import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import type { Tx } from '../../database/unit-of-work.js';
import { type User, usersTable } from '../entities/index.js';

export type CreateUserParams = {
  email: string;
  password: string;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(params: CreateUserParams, tx?: Tx): Promise<User> {
    const db = this.databaseService.getExecutor(tx);

    const [newUser] = await db
      .insert(usersTable)
      .values({ ...params })
      .returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    return newUser;
  }

  async findByEmail(email: string, tx?: Tx): Promise<User | null> {
    const db = this.databaseService.getExecutor(tx);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.email, email), isNull(usersTable.deletedAt)));

    return user ?? null;
  }
}
