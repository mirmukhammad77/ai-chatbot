import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { SessionsRepository } from './repositories/sessions.repository.js';
import { SessionsCleanupService } from './services/sessions-cleanup.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [SessionsRepository, SessionsCleanupService],
  exports: [SessionsRepository],
})
export class SessionsModule {}
