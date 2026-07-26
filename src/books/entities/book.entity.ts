import { ApiProperty } from '@nestjs/swagger'
import { Books } from '../../generated/prisma/client'

export class BookEntity implements Books {
  @ApiProperty()
  id: string

  @ApiProperty()
  ISBN: string | null

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
  genreId: string | null

  @ApiProperty()
  imgUrl: string

  @ApiProperty()
  owned: boolean

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
