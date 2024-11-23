import { ApiProperty, PickType } from '@nestjs/swagger'
import { ShelfEntity } from '../entities/shelf.entity'
import { BookEntity } from 'src/books/entities/book.entity'

export class ShelfDto extends PickType(ShelfEntity, ['id', 'name', 'pages']) {
  @ApiProperty()
  books: BookEntity[]
}
