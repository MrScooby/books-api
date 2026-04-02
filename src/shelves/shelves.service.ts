import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { DBService } from 'src/db/db.service'
import { ShelfEntity } from './entities/shelf.entity'
import { defaultPaginationOptions } from 'src/common/constants'
import {
  SearchPaginatedData,
  PaginatedResults
} from 'src/common/interfaces/pagination'
import { ShelfDto } from './dto/shelf.dto'
import { omit } from '../common/utils/omit.util'

@Injectable()
export class ShelvesService {
  constructor(private db: DBService) {}

  async findAll(
    query: SearchPaginatedData
  ): Promise<PaginatedResults<ShelfEntity>> {
    const perPage = Number(query.perPage) || defaultPaginationOptions.perPage!
    const page = Number(query.page) || defaultPaginationOptions.page!

    const skip = page > 1 ? (page - 1) * perPage : 0

    const orderDirection = query.orderDirection?.toLowerCase() === 'asc' ? 'asc' as const : 'desc' as const

    const totalPromise = this.db.shelves.count()
    const dataPromise = this.db.shelves.findMany({
      skip: skip,
      take: perPage,
      orderBy: { createdAt: orderDirection }
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

  async findOne(id: string): Promise<ShelfDto> {
    const shelf = await this.db.shelves.findUnique({
      where: {
        id
      }
    })

    if (!shelf) {
      throw new NotFoundException({
        error: `Shelf with id: ${id} doesn't exists`,
        status: HttpStatus.NOT_FOUND
      })
    }

    const rest = omit(shelf, ['createdAt', 'updatedAt'])

    const booksOnShelves = await this.db.booksOnShelves.findMany({
      where: {
        shelfId: rest.id
      }
    })

    const books = await this.db.books.findMany({
      where: {
        id: {
          in: booksOnShelves.map((b) => b.bookId)
        }
      }
    })

    return {
      ...rest,
      books: books.map((b) => b)
    }
  }

  async updatePageCount(id: string): Promise<string> {
    const shelf = await this.db.shelves.findUnique({ where: { id } })

    if (!shelf) {
      throw new NotFoundException({
        error: `Shelf with id: ${id} doesn't exists`,
        status: HttpStatus.NOT_FOUND
      })
    }

    const booksOnShelf = await this.db.booksOnShelves.findMany({
      where: { shelfId: shelf.id }
    })

    const books = await this.db.books.findMany({
      where: {
        id: {
          in: booksOnShelf.map((b) => b.bookId)
        }
      }
    })

    let count = 0
    for (let i = 0; i < books.length; i++) {
      count += books[i].pages
    }

    if (count === shelf.pages) {
      return `Shelf "${shelf.name}" page count is up to date: ${count}.`
    }

    await this.db.shelves.update({
      where: {
        id: shelf.id
      },
      data: {
        pages: count
      }
    })

    return `Shelf "${shelf.name}" page count changed from ${shelf.pages} to ${count}`
  }

  async updatePageCountAll(): Promise<string> {
    const shelves = await this.db.shelves.findMany()
    const results: string[] = []

    for (const shelf of shelves) {
      const result = await this.updatePageCount(shelf.id)
      results.push(result)
    }

    return results.join('\n')
  }
}
