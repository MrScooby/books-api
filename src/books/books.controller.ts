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
} from 'common/interfaces/pagination'
import { BooksService } from './books.service'
import { BookDto } from './dto/book.dto'
import { CreateBookDto } from './dto/create-book.dto'
import { BookEntity } from './entities/book.entity'

@Controller('books')
export class BooksController {
  constructor(private readonly bookService: BooksService) {}

  @Post()
  async create(@Body() createBookDto: CreateBookDto): Promise<string> {
    try {
      return await this.bookService.create(createBookDto)
    } catch (e) {
      // TODO: generic api errors?
      throw new Error(e)
    }
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

  // TODO: add proper body type
  @Patch('add-on-shelf/:id')
  update(
    @Param('id') id: string,
    @Body() body: { shelfName: string }
  ): Promise<BookDto> {
    return this.bookService.addOnShelf(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookService.remove(id)
  }
}
