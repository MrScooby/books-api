import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common'
import { GenresService } from './genres.service'
import { GenreDto } from './dto/genre.dto'
import {
  SearchPaginatedData,
  PaginatedResults
} from '../common/interfaces/pagination'
import { GenreEntity } from './entities/genre.entity'
import { CreateGenreDto } from './dto/create-genre.dto'
import { UpdateGenreDto } from './dto/update-genre.dto'

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
  async create(@Body() createGenreDto: CreateGenreDto): Promise<string> {
    return await this.genresService.create(createGenreDto)
  }

  @Get()
  async findAll(
    @Query() query: SearchPaginatedData
  ): Promise<PaginatedResults<GenreEntity>> {
    return await this.genresService.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GenreDto> {
    return this.genresService.findOne(id)
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGenreDto: UpdateGenreDto
  ): Promise<GenreDto> {
    return this.genresService.update(id, updateGenreDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.genresService.remove(id)
  }
}
