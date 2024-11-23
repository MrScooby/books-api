import { Module } from '@nestjs/common'
import { ShelvesService } from './shelves.service'
import { ShelvesController } from './shelves.controller';

@Module({
  providers: [ShelvesService],
  controllers: [ShelvesController]
})
export class ShelvesModule {}
