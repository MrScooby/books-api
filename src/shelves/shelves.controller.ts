import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'
import { AdminGuard } from '../common/guards/admin.guard'
import { ShelvesService } from './shelves.service'
import {
  SearchPaginatedData,
  PaginatedResults
} from '../common/interfaces/pagination'
import { ShelfEntity } from './entities/shelf.entity'
import { ShelfDto } from './dto/shelf.dto'
import { CreateShelfDto } from './dto/create-shelf.dto'

@Controller('shelves')
export class ShelvesController {
  constructor(private readonly shelvesService: ShelvesService) {}

  @Post()
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
  updatePageCount(@Param('id') id: string): Promise<string> {
    return this.shelvesService.updatePageCount(id)
  }

  @Patch('update-page-count-all')
  @UseGuards(AdminGuard)
  updatePageCountAll(): Promise<string> {
    return this.shelvesService.updatePageCountAll()
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.shelvesService.remove(id)
  }
}
