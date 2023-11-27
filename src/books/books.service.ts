import { Injectable } from '@nestjs/common'
import { BookEntity } from './entities/book.entity'
import { DBService } from 'src/db/db.service'
import {
  PaginatedResults,
  SearchPaginatedData
} from 'common/interfaces/pagination'
import { defaultPaginationOptions } from 'common/constants'
import { CreateBookDto } from './dto/create-book.dto'
import scrapBookData, { URLdata } from 'common/scripts/scrap_book_data'
import { BookDto } from './dto/book.dto'

@Injectable()
export class BooksService {
  constructor(private db: DBService) {}

  async create(body: CreateBookDto): Promise<string> {
    const bookData: URLdata = await scrapBookData(body.url)

    const newBookId = await this.db.$transaction(
      async (tx): Promise<string> => {
        const authorsIds = await Promise.all(
          bookData.authors.map(async (authorName) => {
            // TODO: move to dedicated services
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

        // TODO: move to dedicated services
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

        // TODO: move to dedicated services
        const shelvesIds = await Promise.all(
          body.shelves.map(async (shelfName) => {
            const shelf = await tx.shelves.findUnique({
              where: {
                name: shelfName
              },
              select: {
                id: true
              }
            })

            if (shelf) {
              return shelf.id
            }

            const newShelf = await tx.shelves.create({
              data: {
                name: shelfName,
                pages: 0
              },
              select: {
                id: true
              }
            })

            return newShelf.id
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
              create: shelvesIds.map((shelfId) => ({
                shelf: {
                  connect: {
                    id: shelfId
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
      }
    )
    // TODO: add error handling for transaction (client transaction with custom errors?)
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

  // exclude<T, Key extends keyof T>(
  //   entity: T,
  //   keysToOmit: Key
  // ) {}

  async findOne(id: string): Promise<BookDto> {
    const book = await this.db.books.findUnique({
      where: {
        id
      }
    })

    // TODO: create generic function to omit some values
    // const asd = this.exclude(book, ['title'])

    const { createdAt, updatedAt, lcId, ...rest } = book

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
}
