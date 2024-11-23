import { Controller, Get, Param, Patch, Query } from '@nestjs/common'
import { ShelvesService } from './shelves.service'
import {
  SearchPaginatedData,
  PaginatedResults
} from 'common/interfaces/pagination'
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

  @Get(':name')
  async findOne(@Param('name') name: string): Promise<ShelfDto> {
    return this.shelvesService.findOne(name)
  }

  @Get('update-page-count/:name')
  updatePageCount(@Param('name') name: string): Promise<string> {
    return this.shelvesService.updatePageCount(name)
  }

  @Get('update-page-count-all')
  updatePageCountAll(): Promise<string> {
    return this.shelvesService.updatePageCountAll()
  }
}
