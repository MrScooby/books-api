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
import {
  PaginatedResults,
  SearchPaginatedData
} from 'src/common/interfaces/pagination'
import { BooksService } from './books.service'
import { BookDto } from './dto/book.dto'
import { CreateBookDto } from './dto/create-book.dto'
import { BookEntity } from './entities/book.entity'
import { AddToShelfDto } from './dto/add-to-shelf.dto'

@Controller('books')
export class BooksController {
  constructor(private readonly bookService: BooksService) {}

  @Post()
  async create(@Body() createBookDto: CreateBookDto): Promise<string> {
    return await this.bookService.create(createBookDto)
  }

  @Get()
  async findAll(
    @Query() query: SearchPaginatedData
  ): Promise<PaginatedResults<BookEntity>> {
    return await this.bookService.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BookDto> {
    return this.bookService.findOne(id)
  }

  @Get('title/:id')
  async getTitle(@Param('id') id: string): Promise<string> {
    return this.bookService.getTitle(id)
  }

  @Patch('add-on-shelf/:id')
  update(
    @Param('id') id: string,
    @Body() addToShelfDto: AddToShelfDto
  ): Promise<BookDto> {
    return this.bookService.addOnShelf(id, addToShelfDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookService.remove(id)
  }
}
