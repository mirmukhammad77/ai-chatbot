import { jest } from '@jest/globals';
import { type SessionsRepository } from '../../repositories/sessions.repository.js';
import { SessionsCleanupService } from '../sessions-cleanup.service.js';

describe('SessionsCleanupService', () => {
  it('deletes expired sessions when the cleanup job runs', async () => {
    const sessionsRepository = {
      deleteExpiredSessions: jest.fn(() => Promise.resolve()),
    };
    const service = new SessionsCleanupService(sessionsRepository as unknown as SessionsRepository);

    await expect(service.cleanupExpiredSessions()).resolves.toBeUndefined();
    expect(sessionsRepository.deleteExpiredSessions).toHaveBeenCalledTimes(1);
  });

  it('propagates repository failures', async () => {
    const error = new Error('Database unavailable');
    const sessionsRepository = {
      deleteExpiredSessions: jest.fn(() => Promise.reject(error)),
    };
    const service = new SessionsCleanupService(sessionsRepository as unknown as SessionsRepository);

    await expect(service.cleanupExpiredSessions()).rejects.toBe(error);
  });
});
