import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString, Min, IsOptional, IsArray } from 'class-validator'
import { CreateBookDto } from './create-book.dto'

export class UpdateBookDto extends CreateBookDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  pages: number

  @ApiProperty()
  @IsString()
  @IsOptional()
  ISBN: string | undefined

  @ApiProperty()
  @IsNumber()
  lcId: number

  @ApiProperty()
  @IsString()
  title: string

  @ApiProperty()
  @IsString()
  imgUrl: string

  @ApiProperty({
    description: 'Genre ID for the book',
    required: false
  })
  @IsString()
  @IsOptional()
  genreId?: string

  @ApiProperty({
    description: 'Array of author IDs for the book',
    type: [String],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  authorIds?: string[]
}
