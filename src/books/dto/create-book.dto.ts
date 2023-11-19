import { ApiProperty } from '@nestjs/swagger'
import { ArrayNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator'

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  url: string

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(10)
  rating: number

  @ApiProperty()
  @IsString({ each: true })
  @ArrayNotEmpty()
  shelves: string[]
}
