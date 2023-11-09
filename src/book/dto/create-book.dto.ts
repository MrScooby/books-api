import { ApiProperty, PickType } from '@nestjs/swagger';
import { BookEntity } from '../entities/book.entity';

export class CreateBookDto extends PickType(BookEntity, [
  'ISBN',
  'lcId',
  'pages',
  'rating',
  'title',
  'url'
]) {
  @ApiProperty()
  author: string;

  @ApiProperty()
  genre: string;
}
