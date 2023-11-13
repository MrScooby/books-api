import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BooksModule } from './books/books.module';
import { DBModule } from './db/db.module';

@Module({
  imports: [ConfigModule.forRoot(), DBModule, BooksModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
