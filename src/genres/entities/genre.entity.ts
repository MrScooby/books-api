import { ApiProperty } from '@nestjs/swagger'
import { Genres } from '@prisma/client'
import { BookEntity } from 'src/books/entities/book.entity'

export class GenreEntity implements Genres {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  books: BookEntity[]

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
