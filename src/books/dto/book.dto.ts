import { ApiProperty, PickType } from '@nestjs/swagger'
import { BookEntity } from '../entities/book.entity'

export class BookDto extends PickType(BookEntity, [
  'id',
  'ISBN',
  'pages',
  'rating',
  'title',
  'url',
  'genreId',
  'imgUrl'
]) {
  @ApiProperty()
  shelvesIds: string[]

  @ApiProperty()
  authorsIds: string[]
}
