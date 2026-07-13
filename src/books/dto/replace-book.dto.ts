import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class ReplaceBookDto {
  @ApiProperty()
  @IsString()
  url: string
}
