import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateShelfDto {
  @ApiProperty()
  @IsString()
  name: string
}
