import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { DBService } from 'src/db/db.service'
import { ShelfEntity } from './entities/shelf.entity'
import { CreateShelfDto } from './dto/create-shelf.dto'
import {
  SearchPaginatedData,
  PaginatedResults,
  parsePagination,
  buildPaginatedResult
} from 'src/common/interfaces/pagination'
import { ShelfDto } from './dto/shelf.dto'
import { omit } from '../common/utils/omit.util'

@Injectable()
export class ShelvesService {
  constructor(private db: DBService) {}

  async findAll(
    query: SearchPaginatedData
  ): Promise<PaginatedResults<ShelfEntity>> {
    const { params, page, perPage } = parsePagination(query)

    const [total, data] = await Promise.all([
      this.db.shelves.count(),
      this.db.shelves.findMany(params)
    ])

    return buildPaginatedResult(data, total, page, perPage)
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

  async create(body: CreateShelfDto): Promise<string> {
    try {
      const shelf = await this.db.shelves.create({
        data: {
          name: body.name,
          pages: 0
        }
      })

      return shelf.id
    } catch (e: any) {
      if (e.code === 'P2002' || e.message?.includes('Unique constraint')) {
        throw new ConflictException({
          error: `Shelf with name: ${body.name} already exists`,
          status: HttpStatus.CONFLICT
        })
      }
      throw new InternalServerErrorException({
        error: 'Failed to create shelf',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        details: e.message
      })
    }
  }

  async remove(id: string): Promise<string> {
    const shelf = await this.db.shelves.findUnique({ where: { id } })

    if (!shelf) {
      throw new NotFoundException({
        error: `Shelf with id: ${id} doesn't exists`,
        status: HttpStatus.NOT_FOUND
      })
    }

    await this.db.$transaction(async (tx) => {
      await tx.booksOnShelves.deleteMany({ where: { shelfId: id } })
      await tx.shelves.delete({ where: { id } })
    })

    return `Shelf was deleted.`
  }
}
