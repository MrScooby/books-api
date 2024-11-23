import { ApiProperty } from '@nestjs/swagger'
import { Shelves } from '@prisma/client'

export class ShelfEntity implements Shelves {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  pages: number

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
