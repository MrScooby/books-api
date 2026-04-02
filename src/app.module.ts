import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorsModule } from './authors/authors.module'
import { BooksModule } from './books/books.module'
import { DBModule } from './db/db.module'
import { GenresModule } from './genres/genres.module'
import { ShelvesModule } from './shelves/shelves.module'

@Module({
  imports: [
    ConfigModule.forRoot(),
    DBModule,
    AuthorsModule,
    BooksModule,
    GenresModule,
    ShelvesModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
