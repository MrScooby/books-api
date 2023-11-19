import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { BooksService } from './books.service'
import { BookEntity } from './entities/book.entity'
import {
  PaginatedResults,
  SearchPaginatedData
} from 'common/interfaces/pagination'
import { CreateBookDto } from './dto/create-book.dto'

@Controller('books')
export class BooksController {
  constructor(private readonly bookService: BooksService) {}

  @Post()
  async create(@Body() createBookDto: CreateBookDto): Promise<number> {
    let bookId

    try {
      bookId = await this.bookService.create(createBookDto)
    } catch (e) {
      // TODO: generic api errors?
      throw new Error(e)
    }
    return bookId
  }

  @Get()
  async findAll(
    @Query() query: SearchPaginatedData
  ): Promise<PaginatedResults<BookEntity>> {
    return await this.bookService.findAll(query)
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.bookService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
  //   return this.bookService.update(+id, updateBookDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.bookService.remove(+id);
  // }
}
