import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class AddToShelfDto {
  @ApiProperty({
    description: 'The name of the shelf to add the book to',
    example: 'Currently Reading'
  })
  @IsString()
  shelfName: string
}
