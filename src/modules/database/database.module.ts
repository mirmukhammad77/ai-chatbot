import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service.js';
import { UnitOfWork } from './unit-of-work.js';

@Module({
  providers: [DatabaseService, UnitOfWork],
  exports: [DatabaseService, UnitOfWork],
})
export class DatabaseModule {}
