import { Injectable } from '@nestjs/common';
import { BookEntity } from './entities/book.entity';
import { DBService } from 'src/db/db.service';

@Injectable()
export class BookService {
  constructor(private db: DBService) {}

  // create() {
  //   return 'This action adds a new book';
  // }

  async findAll(): Promise<BookEntity[]> {
    const results = await this.db.book.findMany({
      // skip: 40,
      // take: 10,
      // where: {
      //   email: {
      //     contains: 'prisma.io'
      //   }
      // }
    });
    console.log('results', results);
    return results;
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
