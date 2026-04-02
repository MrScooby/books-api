import { ApiProperty } from '@nestjs/swagger'
import { Authors } from 'src/generated/prisma/client'

export class AuthorEntity implements Authors {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
