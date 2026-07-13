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
import {
  PaginatedResults,
  SearchPaginatedData
} from '../common/interfaces/pagination'
import { AdminGuard } from '../common/guards/admin.guard'
import { BooksService } from './books.service'
import { BookDto } from './dto/book.dto'
import { CreateBookDto } from './dto/create-book.dto'
import { UpdateBookDto } from './dto/update-book.dto'
import { ReplaceBookDto } from './dto/replace-book.dto'
import { BookEntity } from './entities/book.entity'
import { AddToShelfDto } from './dto/add-to-shelf.dto'

@Controller('books')
export class BooksController {
  constructor(private readonly bookService: BooksService) {}

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() createBookDto: CreateBookDto): Promise<{ id: string }> {
    const id = await this.bookService.create(createBookDto)
    return { id }
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

  @Get(':id/full')
  async findOneFull(@Param('id') id: string) {
    return this.bookService.findOneFull(id)
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async updateBook(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto
  ): Promise<BookDto> {
    return this.bookService.update(id, updateBookDto)
  }

  @Patch(':id/replace')
  @UseGuards(AdminGuard)
  async replaceEdition(
    @Param('id') id: string,
    @Body() replaceBookDto: ReplaceBookDto
  ): Promise<BookDto> {
    return this.bookService.replaceEdition(id, replaceBookDto)
  }

  @Patch('add-on-shelf/:id')
  @UseGuards(AdminGuard)
  addOnShelf(
    @Param('id') id: string,
    @Body() addToShelfDto: AddToShelfDto
  ): Promise<BookDto> {
    return this.bookService.addOnShelf(id, addToShelfDto)
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.bookService.remove(id)
  }
}
