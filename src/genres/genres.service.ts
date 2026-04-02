import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { GenreDto } from './dto/genre.dto'
import { DBService } from '../db/db.service'
import {
  SearchPaginatedData,
  PaginatedResults,
  parsePagination,
  buildPaginatedResult
} from '../common/interfaces/pagination'
import { GenreEntity } from './entities/genre.entity'
import { omit } from '../common/utils/omit.util'
import { CreateGenreDto } from './dto/create-genre.dto'
import { UpdateGenreDto } from './dto/update-genre.dto'

@Injectable()
export class GenresService {
  constructor(private db: DBService) {}

  async findAll(
    query: SearchPaginatedData
  ): Promise<PaginatedResults<GenreEntity>> {
    const { params, page, perPage } = parsePagination(query)

    const [total, data] = await Promise.all([
      this.db.genres.count(),
      this.db.genres.findMany({
        ...params,
        include: { _count: { select: { books: true } } }
      })
    ])

    const withCounts = data.map((g) => ({
      ...g,
      bookCount: (g as any)._count?.books ?? 0
    }))

    return buildPaginatedResult(withCounts, total, page, perPage)
  }

  async findOne(id: string): Promise<GenreDto> {
    const genre = await this.db.genres.findUnique({
      where: {
        id
      }
    })

    if (!genre) {
      throw new NotFoundException({
        error: `Genre with id: ${id} doesn't exists`,
        status: HttpStatus.NOT_FOUND
      })
    }

    return omit(genre, ['createdAt', 'updatedAt'])
  }

  async create(body: CreateGenreDto): Promise<string> {
    try {
      const genre = await this.db.genres.create({
        data: {
          name: body.name
        }
      })

      return genre.id
    } catch (e: any) {
      if (e.code === 'P2002' || e.message?.includes('Unique constraint')) {
        throw new ConflictException({
          error: `Genre with name: ${body.name} already exists`,
          status: HttpStatus.CONFLICT
        })
      }
      throw new InternalServerErrorException({
        error: 'Failed to create genre',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        details: e.message
      })
    }
  }

  async update(id: string, body: UpdateGenreDto): Promise<GenreDto> {
    await this.findOne(id)

    try {
      const genre = await this.db.genres.update({
        where: { id },
        data: { name: body.name }
      })

      return omit(genre, ['createdAt', 'updatedAt'])
    } catch (e: any) {
      if (e.code === 'P2002' || e.message?.includes('Unique constraint')) {
        throw new ConflictException({
          error: `Genre with name: ${body.name} already exists`,
          status: HttpStatus.CONFLICT
        })
      }
      throw new InternalServerErrorException({
        error: 'Failed to update genre',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        details: e.message
      })
    }
  }

  async remove(id: string): Promise<string> {
    await this.findOne(id)

    await this.db.$transaction(async (tx) => {
      await tx.books.updateMany({
        where: { genreId: id },
        data: { genreId: null }
      })

      await tx.genres.delete({
        where: { id }
      })
    })

    return `Genre was deleted.`
  }
}
