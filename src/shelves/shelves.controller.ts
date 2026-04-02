import { Controller, Get, Param, Patch, Query } from '@nestjs/common'
import { ShelvesService } from './shelves.service'
import {
  SearchPaginatedData,
  PaginatedResults
} from 'src/common/interfaces/pagination'
import { ShelfEntity } from './entities/shelf.entity'
import { ShelfDto } from './dto/shelf.dto'

@Controller('shelves')
export class ShelvesController {
  constructor(private readonly shelvesService: ShelvesService) {}

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
}
