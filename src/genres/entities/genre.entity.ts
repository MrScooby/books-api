import { ApiProperty } from '@nestjs/swagger'
import { Genres } from 'src/generated/prisma/client'
import { BookEntity } from 'src/books/entities/book.entity'

export class GenreEntity implements Genres {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty({ type: [BookEntity], required: false })
  books?: BookEntity[]

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
