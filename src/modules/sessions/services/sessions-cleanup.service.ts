import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionsRepository } from '../repositories/sessions.repository.js';

@Injectable()
export class SessionsCleanupService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async cleanupExpiredSessions(): Promise<void> {
    await this.sessionsRepository.deleteExpiredSessions();
  }
}
