import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DBService extends PrismaClient implements OnModuleInit {
  // TODO: add extensions to handle triggers (incrementing pages on shelves & logging)
  async onModuleInit() {
    await this.$connect();
  }
}
