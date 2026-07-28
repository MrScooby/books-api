import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString, Min, Max, IsOptional, IsArray, IsBoolean } from 'class-validator'

export class UpdateBookDto {
  // 0 means "not rated" — an owned book may not have been read yet.
  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  rating?: number

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  pages?: number

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ISBN?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  url?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imgUrl?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  genreId?: string

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  authorIds?: string[]

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  owned?: boolean
}
