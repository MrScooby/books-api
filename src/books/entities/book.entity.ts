import { ApiProperty } from '@nestjs/swagger'
import { Books } from '@prisma/client'

export class BookEntity implements Books {
  @ApiProperty()
  id: string

  @ApiProperty()
  ISBN: string | undefined

  @ApiProperty()
  lcId: number

  @ApiProperty()
  pages: number

  @ApiProperty()
  rating: number

  @ApiProperty()
  title: string

  @ApiProperty()
  url: string

  @ApiProperty()
  genreId: string | undefined

  @ApiProperty()
  imgUrl: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
