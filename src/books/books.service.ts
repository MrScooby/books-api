import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common'
import { defaultPaginationOptions } from 'src/common/constants'
import {
  PaginatedResults,
  SearchPaginatedData
} from 'src/common/interfaces/pagination'
import scrapBookData, { URLdata } from '../../scripts/scrap_book_data'
import * as fs from 'fs'
import { DBService } from 'src/db/db.service'
import * as backup from '../../database/backup.json'
import { BookDto } from './dto/book.dto'
import { CreateBookDto } from './dto/create-book.dto'
import { BookEntity } from './entities/book.entity'
import { omit } from '../common/utils/omit.util'
import { AddToShelfDto } from './dto/add-to-shelf.dto'

@Injectable()
export class BooksService {
  constructor(private db: DBService) {}

  async create(body: CreateBookDto): Promise<string> {
    const bookData: URLdata = await scrapBookData(body.url)
    const now = Date.now().toString()

    let newBookId: string
    try {
      newBookId = await this.db.$transaction(async (tx): Promise<string> => {
        const authorsIds = await Promise.all(
          bookData.authors.map(async (authorName) => {
            // TODO: move to dedicated module
            const author = await tx.authors.findUnique({
              where: {
                name: authorName
              },
              select: {
                id: true
              }
            })

            if (author) {
              return author.id
            }

            const newAuthor = await tx.authors.create({
              data: {
                name: authorName
              },
              select: {
                id: true
              }
            })

            backup.authors.push({
              name: authorName,
              id: newAuthor.id,
              createdAt: now,
              updatedAt: now
            })

            return newAuthor.id
          })
        )

        // TODO: move to dedicated module
        let genre = await tx.genres.findUnique({
          where: {
            name: bookData.genre
          }
        })

        if (!genre) {
          genre = await tx.genres.create({
            data: {
              name: bookData.genre
            }
          })
        }

        // TODO: move to dedicated module
        const shelves = await Promise.all(
          body.shelves.map(async (shelfName) => {
            const shelf = await tx.shelves.findUnique({
              where: {
                name: shelfName
              },
              select: {
                id: true,
                pages: true
              }
            })

            if (shelf) {
              return shelf
            }

            const newShelf = await tx.shelves.create({
              data: {
                name: shelfName,
                pages: 0
              },
              select: {
                id: true,
                pages: true
              }
            })

            return newShelf
          })
        )

        // update pages count on shelves
        await Promise.all(
          shelves.map(async (shelf) => {
            await tx.shelves.update({
              where: {
                id: shelf.id
              },
              data: {
                pages: shelf.pages + bookData.pages
              }
            })
          })
        )

        const newBook = await tx.books.create({
          data: {
            title: bookData.title,
            lcId: bookData.lcId,
            pages: bookData.pages,
            rating: body.rating,
            url: body.url,
            imgUrl: bookData.imgUrl,
            genre: {
              connect: {
                id: genre.id
              }
            },
            shelves: {
              create: shelves.map((shelf) => ({
                shelf: {
                  connect: {
                    id: shelf.id
                  }
                }
              }))
            },
            authors: {
              create: authorsIds.map((authorId) => ({
                author: {
                  connect: {
                    id: authorId
                  }
                }
              }))
            }
          },
          select: {
            id: true
          }
        })

        // Update local backup just in case (until proper db will be deployed on not free hosting)
        // should be moved to some util service but more probable that I will just delete this all together later
        backup.books.push({
          id: newBook.id,
          ISBN: bookData.ISBN,
          lcId: bookData.lcId,
          pages: bookData.pages,
          rating: body.rating,
          title: bookData.title,
          url: body.url,
          genreId: genre.id,
          imgUrl: bookData.imgUrl,
          createdAt: now,
          updatedAt: now
        })

        shelves.map((sh) => {
          backup.booksOnShelves.push({
            bookId: newBook.id,
            shelfId: sh.id,
            createdAt: now,
            updatedAt: now
          })
        })

        shelves.map((sh) => {
          const shToUpdateIndex = backup.shelves.findIndex(
            (s) => s.id === sh.id
          )

          backup.shelves[shToUpdateIndex] = {
            ...backup.shelves[shToUpdateIndex],
            pages: backup.shelves[shToUpdateIndex].pages + bookData.pages
          }
        })

        authorsIds.map((a) => {
          backup.authorsBooks.push({
            bookId: newBook.id,
            authorId: a,
            createdAt: now,
            updatedAt: now
          })
        })

        fs.writeFile(
          './database/backup.json',
          JSON.stringify(backup),
          { flag: 'w' },
          (e) => {
            if (e) {
              console.log('Something went wrong. e: ', e)
            } else {
              console.log('Local backup created')
            }
          }
        )

        return newBook.id
      })
    } catch (error) {
      throw new InternalServerErrorException({
        error: 'Failed to create book. Transaction failed.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        details: error.message
      })
    }

    return newBookId
  }

  async findAll(
    query: SearchPaginatedData
  ): Promise<PaginatedResults<BookEntity>> {
    const perPage = Number(query.perPage) || defaultPaginationOptions.perPage
    const page = Number(query.page) || defaultPaginationOptions.page

    const skip = page > 1 ? (page - 1) * perPage : 0

    const totalPromise = this.db.books.count()
    const dataPromise = this.db.books.findMany({
      skip: skip,
      take: perPage
    })

    const [total, data] = await Promise.all([totalPromise, dataPromise])

    const totalPages = Math.ceil(total / perPage)

    return {
      data,
      meta: {
        total,
        totalPages,
        perPage,
        page
      }
    }
  }

  async findOne(id: string): Promise<BookDto> {
    const book = await this.db.books.findUnique({
      where: {
        id
      }
    })

    if (!book) {
      throw new NotFoundException({
        error: `Book with id: ${id} doesn't exists`,
        status: HttpStatus.NOT_FOUND
      })
    }

    const rest = omit(book, ['createdAt', 'updatedAt', 'lcId'])

    const booksOnShelves = await this.db.booksOnShelves.findMany({
      where: {
        bookId: id
      }
    })

    const authorsBooks = await this.db.authorsBooks.findMany({
      where: {
        bookId: id
      }
    })

    const bookData: BookDto = {
      ...rest,
      shelvesIds: booksOnShelves.map((bs) => bs.shelfId),
      authorsIds: authorsBooks.map((ab) => ab.authorId)
    }

    return bookData
  }

  async getTitle(id: string): Promise<string> {
    const book = await this.findOne(id)

    return book.title
  }

  async remove(id: string): Promise<string> {
    const book = await this.db.books.findUnique({
      where: {
        id
      }
    })

    if (!book) {
      throw new NotFoundException({
        error: `Book with id: ${id} doesn't exists`,
        status: HttpStatus.NOT_FOUND
      })
    }

    await this.db.$transaction(async (tx) => {
      const booksOnShelves = await tx.booksOnShelves.findMany({
        where: { bookId: id }
      })

      const shelvesPromises = booksOnShelves.map(async (t) => {
        const shelf = await tx.shelves.findUnique({
          where: { id: t.shelfId }
        })

        const promises = []

        promises.push(
          tx.shelves.update({
            where: { id: t.shelfId },
            data: { pages: shelf.pages - book.pages }
          })
        )

        promises.push(
          tx.booksOnShelves.delete({
            where: {
              bookId_shelfId: {
                bookId: id,
                shelfId: t.shelfId
              }
            }
          })
        )

        return Promise.all(promises)
      })

      const authors = await tx.authorsBooks.findMany({
        where: {
          bookId: id
        }
      })

      const authorsPromises: Promise<any>[] = authors.map(async (a) =>
        tx.authorsBooks.delete({
          where: {
            bookId_authorId: {
              bookId: id,
              authorId: a.authorId
            }
          }
        })
      )

      await Promise.all(shelvesPromises.concat(authorsPromises))

      await tx.books.delete({
        where: {
          id
        }
      })
    })

    return `Book was deleted.`
  }

  async addOnShelf(id: string, body: AddToShelfDto): Promise<BookDto> {
    const { shelfName } = body

    const book = await this.db.books.findUnique({
      where: {
        id
      }
    })

    if (!book) {
      throw new NotFoundException({
        error: `Book with id: ${id} doesn't exists`,
        status: HttpStatus.NOT_FOUND
      })
    }

    // TODO: move to dedicated module
    let shelf: any

    try {
      shelf = await this.db.shelves.findUniqueOrThrow({
        where: {
          name: shelfName
        }
      })
    } catch (e) {
      throw new BadRequestException({
        error: `Shelf with name: ${shelfName} doesn't exists`,
        status: HttpStatus.BAD_REQUEST
      })
    }

    try {
      await this.db.$transaction(async (tx) => {
        await tx.booksOnShelves.create({
          data: {
            bookId: book.id,
            shelfId: shelf.id
          }
        })

        await tx.shelves.update({
          where: {
            id: shelf.id
          },
          data: {
            pages: shelf.pages + book.pages
          }
        })
      })
    } catch (e: any) {
      if (e.code === 'P2002' || e.message?.includes('Unique constraint')) {
        throw new ConflictException({
          error: `Book is already on this shelf`,
          status: HttpStatus.CONFLICT
        })
      }
      throw new InternalServerErrorException({
        error: 'Failed to add book to shelf',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        details: e.message
      })
    }

    return this.findOne(id)
  }
}
