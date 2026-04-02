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
import { AuthorsService } from './authors.service'
import { AuthorDto } from './dto/author.dto'
import {
  SearchPaginatedData,
  PaginatedResults
} from '../common/interfaces/pagination'
import { AuthorEntity } from './entities/author.entity'
import { CreateAuthorDto } from './dto/create-author.dto'
import { UpdateAuthorDto } from './dto/update-author.dto'

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  async create(@Body() createAuthorDto: CreateAuthorDto): Promise<string> {
    return await this.authorsService.create(createAuthorDto)
  }

  @Get()
  async findAll(
    @Query() query: SearchPaginatedData
  ): Promise<PaginatedResults<AuthorEntity>> {
    return await this.authorsService.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AuthorDto> {
    return this.authorsService.findOne(id)
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAuthorDto: UpdateAuthorDto
  ): Promise<AuthorDto> {
    return this.authorsService.update(id, updateAuthorDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authorsService.remove(id)
  }
}
