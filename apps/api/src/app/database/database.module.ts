import { Module } from '@nestjs/common';

import { DatabaseService } from './database.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DatabaseService],
  exports: [PrismaModule, DatabaseService],
})
export class DatabaseModule {}
