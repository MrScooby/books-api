import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BookModule } from './book/book.module';
import { DBModule } from './db/db.module';

@Module({
  imports: [ConfigModule.forRoot(), DBModule, BookModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
