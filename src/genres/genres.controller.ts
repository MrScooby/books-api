import { Controller, Get, Param } from '@nestjs/common'
import { GenresService } from './genres.service'

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get('name/:id')
  findOne(@Param('id') id: string) {
    return this.genresService.getName(id)
  }
}
