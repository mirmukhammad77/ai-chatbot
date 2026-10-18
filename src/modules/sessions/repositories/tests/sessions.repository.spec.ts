import { jest } from '@jest/globals';
import { type SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { type DatabaseService } from '../../../database/database.service.js';
import type { Tx } from '../../../database/unit-of-work.js';
import { type Session } from '../../entities/index.js';
import { SessionsRepository } from '../sessions.repository.js';

describe('SessionsRepository', () => {
  const session: Session = {
    id: 'session-id',
    userId: 'user-id',
    refreshTokenHash: 'refresh-token-hash',
    expiresAt: new Date('2026-10-19T00:00:00Z'),
    createdAt: new Date('2026-10-18T00:00:00Z'),
    revokedAt: null,
  };

  it('creates a session using the default executor and returns it', async () => {
    const returning = jest.fn(() => Promise.resolve<Session[]>([session]));
    const values = jest.fn(() => ({ returning }));
    const insert = jest.fn(() => ({ values }));
    const database = {
      getExecutor: jest.fn(() => ({ insert })),
    };
    const repository = new SessionsRepository(database as unknown as DatabaseService);
    const expiresAt = new Date('2026-10-20T00:00:00Z');

    await expect(repository.createSession('user-id', 'refresh-token-hash', expiresAt)).resolves.toEqual(session);

    expect(database.getExecutor).toHaveBeenCalledWith();
    expect(values).toHaveBeenCalledWith({
      userId: 'user-id',
      refreshTokenHash: 'refresh-token-hash',
      expiresAt,
    });
  });

  it('returns null when creating a session yields no row', async () => {
    const returning = jest.fn(() => Promise.resolve<Session[]>([]));
    const values = jest.fn(() => ({ returning }));
    const insert = jest.fn(() => ({ values }));
    const database = {
      getExecutor: jest.fn(() => ({ insert })),
    };
    const repository = new SessionsRepository(database as unknown as DatabaseService);

    await expect(repository.createSession('user-id', 'refresh-token-hash', new Date())).resolves.toBeNull();
  });

  it('finds an active, unexpired session by token hash using the supplied executor', async () => {
    const limit = jest.fn(() => Promise.resolve<Session[]>([session]));
    const where = jest.fn((_condition: SQL) => ({ limit }));
    const select = jest.fn(() => ({ from: () => ({ where }) }));
    const tx = {} as Tx;
    const database = {
      getExecutor: jest.fn(() => ({ select })),
    };
    const repository = new SessionsRepository(database as unknown as DatabaseService);

    await expect(repository.findByRefreshTokenHash(session.refreshTokenHash, tx)).resolves.toEqual(session);

    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain('"sessions"."refresh_token_hash" = $1');
    expect(query.sql).toContain('"sessions"."expires_at" >');
    expect(query.sql).toContain('"sessions"."revoked_at" is null');
    expect(query.params).toContain(session.refreshTokenHash);
    expect(database.getExecutor).toHaveBeenCalledWith(tx);
  });

  it('returns null when no active session matches the token hash', async () => {
    const limit = jest.fn(() => Promise.resolve<Session[]>([]));
    const where = jest.fn((_condition: SQL) => ({ limit }));
    const select = jest.fn(() => ({ from: () => ({ where }) }));
    const database = {
      getExecutor: jest.fn(() => ({ select })),
    };
    const repository = new SessionsRepository(database as unknown as DatabaseService);

    await expect(repository.findByRefreshTokenHash('unknown-token-hash')).resolves.toBeNull();
  });

  it('rotates an active session token and expiration', async () => {
    const returning = jest.fn(() => Promise.resolve<Session[]>([session]));
    const where = jest.fn((_condition: SQL) => ({ returning }));
    const set = jest.fn(() => ({ where }));
    const update = jest.fn(() => ({ set }));
    const database = {
      getExecutor: jest.fn(() => ({ update })),
    };
    const repository = new SessionsRepository(database as unknown as DatabaseService);
    const expiresAt = new Date('2026-10-21T00:00:00Z');

    await expect(
      repository.rotateRefreshToken({
        oldRefreshTokenHash: 'old-token-hash',
        newRefreshTokenHash: 'new-token-hash',
        refreshTokenExpiresAt: expiresAt,
      }),
    ).resolves.toEqual(session);

    expect(set).toHaveBeenCalledWith({ refreshTokenHash: 'new-token-hash', expiresAt });
    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain('"sessions"."refresh_token_hash" = $1');
    expect(query.sql).toContain('"sessions"."expires_at" >');
    expect(query.sql).toContain('"sessions"."revoked_at" is null');
    expect(query.params).toContain('old-token-hash');
  });

  it('returns null when no eligible session can be rotated', async () => {
    const returning = jest.fn(() => Promise.resolve<Session[]>([]));
    const where = jest.fn((_condition: SQL) => ({ returning }));
    const set = jest.fn(() => ({ where }));
    const update = jest.fn(() => ({ set }));
    const database = {
      getExecutor: jest.fn(() => ({ update })),
    };
    const repository = new SessionsRepository(database as unknown as DatabaseService);

    await expect(
      repository.rotateRefreshToken({
        oldRefreshTokenHash: 'old-token-hash',
        newRefreshTokenHash: 'new-token-hash',
        refreshTokenExpiresAt: new Date(),
      }),
    ).resolves.toBeNull();
  });

  it('revokes a matching session and reports whether a row was updated', async () => {
    const returning = jest.fn(() => Promise.resolve([{ id: session.id }]));
    const where = jest.fn((_condition: SQL) => ({ returning }));
    const set = jest.fn(() => ({ where }));
    const update = jest.fn(() => ({ set }));
    const database = {
      getExecutor: jest.fn(() => ({ update })),
    };
    const repository = new SessionsRepository(database as unknown as DatabaseService);

    await expect(repository.revokeSession(session.refreshTokenHash)).resolves.toBe(true);

    expect(set).toHaveBeenCalledWith({ revokedAt: expect.any(Date) });
    expect(returning).toHaveBeenCalled();
    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain('"sessions"."refresh_token_hash" = $1');
    expect(query.sql).toContain('"sessions"."revoked_at" is null');
    expect(query.params).toContain(session.refreshTokenHash);
  });

  it('returns false when there is no unrevoked session to revoke', async () => {
    const returning = jest.fn(() => Promise.resolve([]));
    const where = jest.fn((_condition: SQL) => ({ returning }));
    const set = jest.fn(() => ({ where }));
    const update = jest.fn(() => ({ set }));
    const database = {
      getExecutor: jest.fn(() => ({ update })),
    };
    const repository = new SessionsRepository(database as unknown as DatabaseService);

    await expect(repository.revokeSession('unknown-token-hash')).resolves.toBe(false);
  });

  it('deletes expired sessions using the default database executor', async () => {
    const where = jest.fn((_condition: SQL) => Promise.resolve());
    const deleteQuery = jest.fn(() => ({ where }));
    const database = {
      getExecutor: jest.fn(() => ({ delete: deleteQuery })),
    };
    const repository = new SessionsRepository(database as unknown as DatabaseService);

    await expect(repository.deleteExpiredSessions()).resolves.toBeUndefined();

    expect(database.getExecutor).toHaveBeenCalledWith();
    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain('"sessions"."expires_at" <=');
  });
});
