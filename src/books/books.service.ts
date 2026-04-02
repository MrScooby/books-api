import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common'
import {
  PaginatedResults,
  SearchPaginatedData,
  parsePagination,
  buildPaginatedResult
} from '../common/interfaces/pagination'
import scrapBookData, { URLdata } from './utils/scrap_book_data'
import { DBService } from '../db/db.service'
import { BookDto } from './dto/book.dto'
import { CreateBookDto } from './dto/create-book.dto'
import { UpdateBookDto } from './dto/update-book.dto'
import { BookEntity } from './entities/book.entity'
import { omit } from '../common/utils/omit.util'
import { AddToShelfDto } from './dto/add-to-shelf.dto'

@Injectable()
export class BooksService {
  constructor(private db: DBService) {}

  async create(body: CreateBookDto): Promise<string> {
    const bookData: URLdata = await scrapBookData(body.url)

    let newBookId: string
    try {
      newBookId = await this.db.$transaction(async (tx): Promise<string> => {
        const authorsIds = await Promise.all(
          bookData.authors.map(async (authorName) => {
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

            return newAuthor.id
          })
        )

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

        return newBook.id
      })
    } catch (error: any) {
      if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
        throw new ConflictException({
          error: 'A book with this title or lcId already exists',
          status: HttpStatus.CONFLICT
        })
      }
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
    const { params, page, perPage } = parsePagination(query)

    const where: any = {}

    if (query.shelfId) {
      where.shelves = { some: { shelfId: query.shelfId } }
    }

    if (query.authorId) {
      where.authors = { some: { authorId: query.authorId } }
    }

    if (query.genreId) {
      where.genreId = query.genreId
    }

    const [total, data] = await Promise.all([
      this.db.books.count({ where }),
      this.db.books.findMany({ ...params, where })
    ])

    return buildPaginatedResult(data, total, page, perPage)
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

  async update(id: string, body: UpdateBookDto): Promise<BookDto> {
    const book = await this.db.books.findUnique({ where: { id } })

    if (!book) {
      throw new NotFoundException({
        error: `Book with id: ${id} doesn't exists`,
        status: HttpStatus.NOT_FOUND
      })
    }

    try {
      await this.db.$transaction(async (tx) => {
        const data: Record<string, any> = {}
        if (body.title !== undefined) data.title = body.title
        if (body.pages !== undefined) data.pages = body.pages
        if (body.rating !== undefined) data.rating = body.rating
        if (body.url !== undefined) data.url = body.url
        if (body.ISBN !== undefined) data.ISBN = body.ISBN
        if (body.imgUrl !== undefined) data.imgUrl = body.imgUrl
        if (body.genreId !== undefined) data.genreId = body.genreId

        if (Object.keys(data).length > 0) {
          await tx.books.update({ where: { id }, data })
        }

        if (body.authorIds) {
          await tx.authorsBooks.deleteMany({ where: { bookId: id } })

          await tx.authorsBooks.createMany({
            data: body.authorIds.map((authorId) => ({
              bookId: id,
              authorId
            }))
          })
        }
      })
    } catch (e: any) {
      if (e.code === 'P2002' || e.message?.includes('Unique constraint')) {
        throw new ConflictException({
          error: 'A book with this title already exists',
          status: HttpStatus.CONFLICT
        })
      }
      throw new InternalServerErrorException({
        error: 'Failed to update book. Transaction failed.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        details: e.message
      })
    }

    return this.findOne(id)
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

      await Promise.all(
        booksOnShelves.map(async (entry) => {
          const shelf = await tx.shelves.findUnique({
            where: { id: entry.shelfId }
          })

          if (shelf) {
            await tx.shelves.update({
              where: { id: entry.shelfId },
              data: { pages: shelf.pages - book.pages }
            })
          }
        })
      )

      await tx.books.delete({ where: { id } })
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
