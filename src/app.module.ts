import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BooksModule } from './books/books.module';
import { DBModule } from './db/db.module';
import { GenresModule } from './genres/genres.module';

@Module({
  imports: [ConfigModule.forRoot(), DBModule, BooksModule, GenresModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
