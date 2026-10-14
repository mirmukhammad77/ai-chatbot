import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { UsersRepository } from './repositories/users.repository.js';

@Module({
  providers: [UsersRepository],
  imports: [DatabaseModule],
  exports: [UsersRepository],
})
export class UsersModule {}
