import { ApiProperty } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  url: string

  // A book that hasn't been read yet has nothing to rate: 0 means "not rated".
  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  rating?: number

  // Owned but unread books sit on no shelf until they are read.
  @ApiProperty({ required: false, type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  shelves?: string[]

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  owned?: boolean
}
