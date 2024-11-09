import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString, Min } from 'class-validator'
import { CreateBookDto } from './create-book.dto'

// TODO: add genre and author
export class UpdateBookDto extends CreateBookDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  pages: number

  @ApiProperty()
  @IsString()
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
}
