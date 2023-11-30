import { Controller, Get, Param } from '@nestjs/common'
import { GenresService } from './genres.service'
import { GenreDto } from './dto/genre.dto'

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get()
  async findAll(): Promise<GenreDto[]> {
    return await this.genresService.findAll()
  }

  @Get('name/:id')
  findOne(@Param('id') id: string) {
    return this.genresService.getName(id)
  }
}
