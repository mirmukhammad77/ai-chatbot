import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { type SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { DatabaseService } from '../../../database/database.service.js';
import type { Tx } from '../../../database/unit-of-work.js';
import { type User } from '../../entities/index.js';
import { UsersRepository } from '../users.repository.js';

describe('UsersRepository', () => {
  it('looks up an active user using a parameterized email and deleted_at IS NULL', async () => {
    const where = jest.fn((_condition: SQL) => Promise.resolve<User[]>([]));
    const database = {
      getExecutor: jest.fn().mockReturnValue({ select: () => ({ from: () => ({ where }) }) }),
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
      expect(query.sql).toContain('"users"."email" = $1');
      expect(query.params).toEqual([email]);
    } finally {
      await fixture.close();
    }
  });

  it('returns a user when findByEmail finds a match', async () => {
    const mockUser: User = {
      id: 'uuid-1',
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    };
    const where = jest.fn((_condition?: SQL) => Promise.resolve<User[]>([mockUser]));
    const database = {
      getExecutor: jest.fn().mockReturnValue({ select: () => ({ from: () => ({ where }) }) }),
    };
    const fixture = await Test.createTestingModule({
      providers: [UsersRepository, { provide: DatabaseService, useValue: database }],
    }).compile();
    try {
      const repository = fixture.get(UsersRepository);
      const result = await repository.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    } finally {
      await fixture.close();
    }
  });

  it('creates and returns a new user', async () => {
    const mockUser: User = {
      id: 'uuid-2',
      email: 'new@example.com',
      password: 'hashedpassword',
      firstName: null,
      lastName: null,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    };
    const returning = jest.fn(() => Promise.resolve<User[]>([mockUser]));
    const values = jest.fn().mockReturnValue({ returning });
    const insert = jest.fn().mockReturnValue({ values });
    const database = {
      getExecutor: jest.fn().mockReturnValue({ insert }),
    };
    const fixture = await Test.createTestingModule({
      providers: [UsersRepository, { provide: DatabaseService, useValue: database }],
    }).compile();
    try {
      const repository = fixture.get(UsersRepository);
      const result = await repository.create({ email: 'new@example.com', password: 'hashedpassword' });
      expect(result).toEqual(mockUser);
      expect(values).toHaveBeenCalledWith({ email: 'new@example.com', password: 'hashedpassword' });
    } finally {
      await fixture.close();
    }
  });

  it('throws an error if create fails to return a user', async () => {
    const returning = jest.fn(() => Promise.resolve<User[]>([]));
    const values = jest.fn().mockReturnValue({ returning });
    const insert = jest.fn().mockReturnValue({ values });
    const database = {
      getExecutor: jest.fn().mockReturnValue({ insert }),
    };
    const fixture = await Test.createTestingModule({
      providers: [UsersRepository, { provide: DatabaseService, useValue: database }],
    }).compile();
    try {
      const repository = fixture.get(UsersRepository);
      await expect(repository.create({ email: 'fail@example.com', password: 'hashedpassword' })).rejects.toThrow(
        'Failed to create user',
      );
    } finally {
      await fixture.close();
    }
  });

  it('uses a supplied transaction executor for repository operations', async () => {
    const tx = {} as Tx;
    const mockUser: User = {
      id: 'uuid-tx',
      email: 'transaction@example.com',
      password: 'hashedpassword',
      firstName: null,
      lastName: null,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    };
    const where = jest.fn((_condition: SQL) => Promise.resolve<User[]>([mockUser]));
    const returning = jest.fn(() => Promise.resolve<User[]>([mockUser]));
    const values = jest.fn().mockReturnValue({ returning });
    const insert = jest.fn().mockReturnValue({ values });
    const txExecutor = {
      select: () => ({ from: () => ({ where }) }),
      insert,
    };
    const database = {
      getExecutor: jest.fn().mockReturnValue(txExecutor),
    };
    const fixture = await Test.createTestingModule({
      providers: [UsersRepository, { provide: DatabaseService, useValue: database }],
    }).compile();

    try {
      const repository = fixture.get(UsersRepository);
      await expect(repository.findByEmail(mockUser.email, tx)).resolves.toEqual(mockUser);
      await expect(repository.create({ email: mockUser.email, password: mockUser.password }, tx)).resolves.toEqual(mockUser);
      expect(database.getExecutor).toHaveBeenNthCalledWith(1, tx);
      expect(database.getExecutor).toHaveBeenNthCalledWith(2, tx);
    } finally {
      await fixture.close();
    }
  });
});
