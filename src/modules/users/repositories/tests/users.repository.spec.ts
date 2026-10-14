import { Test } from '@nestjs/testing';
import { type SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { vi } from 'vitest';
import { DatabaseService } from '../../../database/database.service.js';
import { UsersRepository } from '../users.repository.js';

describe('UsersRepository', () => {
  it('looks up an active user using a parameterized email and deleted_at IS NULL', async () => {
    const where = vi.fn<(condition: SQL) => Promise<never[]>>().mockResolvedValue([]);
    const database = {
      getExecutor: vi.fn().mockReturnValue({ select: () => ({ from: () => ({ where }) }) }),
    };
    const fixture = await Test.createTestingModule({
      providers: [UsersRepository, { provide: DatabaseService, useValue: database }],
    }).compile();
    try {
      const repository = fixture.get(UsersRepository);
      const email = 'test@example.com';
      await expect(repository.findByEmail(email)).resolves.toBeNull();
      const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
      expect(query.sql).toContain('"users"."deleted_at" is null');
      expect(query.params).toEqual([email]);
    } finally {
      await fixture.close();
    }
  });
});
