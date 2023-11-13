import { Injectable } from '@nestjs/common'
import { BookEntity } from './entities/book.entity'
import { DBService } from 'src/db/db.service'
import {
  PaginatedResults,
  SearchPaginatedData
} from 'common/interfaces/pagination'
import { defaultPaginationOptions } from 'common/constants'

@Injectable()
export class BooksService {
  constructor(private db: DBService) {}

  // create() {
  //   return 'This action adds a new book';
  // }

  async findAll(
    query: SearchPaginatedData
  ): Promise<PaginatedResults<BookEntity>> {
    const perPage = Number(query.perPage) || defaultPaginationOptions.perPage
    const page = Number(query.page) || defaultPaginationOptions.page

    const skip = page > 1 ? (page - 1) * perPage : 0

    const totalPromise = this.db.book.count()
    const dataPromise = this.db.book.findMany({
      skip: skip,
      take: perPage
    })

    const [total, data] = await Promise.all([totalPromise, dataPromise])

    return {
      data,
      meta: {
        total,
        perPage,
        page
      }
    }
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} book`;
  // }

  // update(id: number) {
  //   return `This action updates a #${id} book`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} book`;
  // }
}
