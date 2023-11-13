import { Controller, Get, Query } from '@nestjs/common'
import { BooksService } from './books.service'
import { BookEntity } from './entities/book.entity'
import {
  PaginatedResults,
  SearchPaginatedData
} from 'common/interfaces/pagination'

@Controller('books')
export class BooksController {
  constructor(private readonly bookService: BooksService) {}

  // @Post()
  // create(@Body() createBookDto: CreateBookDto) {
  //   return this.bookService.create(createBookDto);
  // }

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
