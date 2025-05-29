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
    const perPage = Number(query.perPage) || defaultPaginationOptions.perPage
    const page = Number(query.page) || defaultPaginationOptions.page

    const skip = page > 1 ? (page - 1) * perPage : 0

    const totalPromise = this.db.shelves.count()
    const dataPromise = this.db.shelves.findMany({
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

  async findOne(name: string): Promise<ShelfDto> {
    const shelf = await this.db.shelves.findUnique({
      where: {
        name
      }
    })

    if (!shelf) {
      throw new NotFoundException({
        error: `Shelf with name: ${name} doesn't exists`,
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

  async updatePageCount(name: string): Promise<any> {
    const shelf = await this.db.shelves.findUnique({ where: { name } })

    if (!shelf) {
      throw new NotFoundException({
        error: `Shelf with name: ${name} doesn't exists`,
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
      return `Shelf "${name}" page count is up to date: ${count}.`
    }

    await this.db.shelves.update({
      where: {
        id: shelf.id
      },
      data: {
        pages: count
      }
    })

    return `Shelf "${name}" page count changed from ${shelf.pages} to ${count}`
  }

  async updatePageCountAll(): Promise<any> {
    // TODO: update all shelves page count
  }
}
