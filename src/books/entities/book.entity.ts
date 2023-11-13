import { ApiProperty } from '@nestjs/swagger';
import { Book } from '@prisma/client';

export class BookEntity implements Book {
  @ApiProperty()
  id: number;

  @ApiProperty()
  ISBN: string | undefined;

  @ApiProperty()
  lcId: number;

  @ApiProperty()
  pages: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  genreId: number | undefined;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}