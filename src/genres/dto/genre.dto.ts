import { PickType } from '@nestjs/swagger'
import { GenreEntity } from '../entities/genre.entity'

export class GenreDto extends PickType(GenreEntity, ['id', 'name']) {}
