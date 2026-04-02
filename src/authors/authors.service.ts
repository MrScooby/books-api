import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { DBService } from 'src/db/db.service'
import { defaultPaginationOptions } from 'src/common/constants'
import {
  SearchPaginatedData,
  PaginatedResults
} from 'src/common/interfaces/pagination'
import { AuthorEntity } from './entities/author.entity'
import { AuthorDto } from './dto/author.dto'
import { CreateAuthorDto } from './dto/create-author.dto'
import { UpdateAuthorDto } from './dto/update-author.dto'
import { omit } from '../common/utils/omit.util'

@Injectable()
export class AuthorsService {
  constructor(private db: DBService) {}

  async findAll(
    query: SearchPaginatedData
  ): Promise<PaginatedResults<AuthorEntity>> {
    const perPage = Number(query.perPage) || defaultPaginationOptions.perPage!
    const page = Number(query.page) || defaultPaginationOptions.page!

    const skip = page > 1 ? (page - 1) * perPage : 0

    const orderDirection = query.orderDirection?.toLowerCase() === 'asc' ? 'asc' as const : 'desc' as const

    const totalPromise = this.db.authors.count()
    const dataPromise = this.db.authors.findMany({
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

  async findOne(id: string): Promise<AuthorDto> {
    const author = await this.db.authors.findUnique({
      where: { id }
    })

    if (!author) {
      throw new NotFoundException({
        error: `Author with id: ${id} doesn't exists`,
        status: HttpStatus.NOT_FOUND
      })
    }

    const rest = omit(author, ['createdAt', 'updatedAt'])

    const authorsBooks = await this.db.authorsBooks.findMany({
      where: { authorId: id }
    })

    return {
      ...rest,
      bookIds: authorsBooks.map((ab) => ab.bookId)
    }
  }

  async create(body: CreateAuthorDto): Promise<string> {
    try {
      const author = await this.db.authors.create({
        data: { name: body.name }
      })

      return author.id
    } catch (e: any) {
      if (e.code === 'P2002' || e.message?.includes('Unique constraint')) {
        throw new ConflictException({
          error: `Author with name: ${body.name} already exists`,
          status: HttpStatus.CONFLICT
        })
      }
      throw new InternalServerErrorException({
        error: 'Failed to create author',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        details: e.message
      })
    }
  }

  async update(id: string, body: UpdateAuthorDto): Promise<AuthorDto> {
    await this.findOne(id)

    try {
      await this.db.authors.update({
        where: { id },
        data: { name: body.name }
      })

      return this.findOne(id)
    } catch (e: any) {
      if (e.code === 'P2002' || e.message?.includes('Unique constraint')) {
        throw new ConflictException({
          error: `Author with name: ${body.name} already exists`,
          status: HttpStatus.CONFLICT
        })
      }
      throw new InternalServerErrorException({
        error: 'Failed to update author',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        details: e.message
      })
    }
  }

  async remove(id: string): Promise<string> {
    await this.findOne(id)

    await this.db.$transaction(async (tx) => {
      await tx.authorsBooks.deleteMany({ where: { authorId: id } })
      await tx.authors.delete({ where: { id } })
    })

    return `Author was deleted.`
  }
}
