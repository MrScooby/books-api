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
import { ShelvesService } from './shelves.service'
import {
  SearchPaginatedData,
  PaginatedResults
} from 'src/common/interfaces/pagination'
import { ShelfEntity } from './entities/shelf.entity'
import { ShelfDto } from './dto/shelf.dto'
import { CreateShelfDto } from './dto/create-shelf.dto'

@Controller('shelves')
export class ShelvesController {
  constructor(private readonly shelvesService: ShelvesService) {}

  @Post()
  async create(@Body() createShelfDto: CreateShelfDto): Promise<string> {
    return await this.shelvesService.create(createShelfDto)
  }

  @Get()
  async findAll(
    @Query() query: SearchPaginatedData
  ): Promise<PaginatedResults<ShelfEntity>> {
    return await this.shelvesService.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ShelfDto> {
    return this.shelvesService.findOne(id)
  }

  @Patch('update-page-count/:id')
  updatePageCount(@Param('id') id: string): Promise<string> {
    return this.shelvesService.updatePageCount(id)
  }

  @Patch('update-page-count-all')
  updatePageCountAll(): Promise<string> {
    return this.shelvesService.updatePageCountAll()
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shelvesService.remove(id)
  }
}
