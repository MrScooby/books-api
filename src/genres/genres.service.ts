import { Injectable } from '@nestjs/common'
import { GenreDto } from './dto/genre.dto'
import { DBService } from 'src/db/db.service'

@Injectable()
export class GenresService {
  constructor(private db: DBService) {}

  async findAll(): Promise<GenreDto[]> {
    const genres = await this.db.genres.findMany()
    return genres
  }

  async findOne(id: string): Promise<GenreDto> {
    const genre = await this.db.genres.findUnique({
      where: {
        id
      }
    })

    return genre
  }

  async getName(id: string): Promise<string> {
    const genre = await this.findOne(id)
    return genre.name
  }
}
