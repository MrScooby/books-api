import { ApiProperty, PickType } from '@nestjs/swagger'
import { AuthorEntity } from '../entities/author.entity'

export class AuthorDto extends PickType(AuthorEntity, ['id', 'name']) {
  @ApiProperty()
  bookIds: string[]
}
