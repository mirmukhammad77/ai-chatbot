import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, lte } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import type { Tx } from '../../database/unit-of-work.js';
import { type Session, sessionsTable } from '../entities/index.js';

export type RotateRefreshTokenArgs = {
  oldRefreshTokenHash: string;
  newRefreshTokenHash: string;
  refreshTokenExpiresAt: Date;
};

@Injectable()
export class SessionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createSession(userId: string, refreshTokenHash: string, expiresAt: Date): Promise<Session | null> {
    const db = this.databaseService.getExecutor();

    const [session] = await db.insert(sessionsTable).values({ userId, refreshTokenHash, expiresAt }).returning();

    return session ?? null;
  }

  async findByRefreshTokenHash(refreshTokenHash: string, tx?: Tx): Promise<Session | null> {
    const db = this.databaseService.getExecutor(tx);

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.refreshTokenHash, refreshTokenHash),
          gt(sessionsTable.expiresAt, new Date()),
          isNull(sessionsTable.revokedAt),
        ),
      )
      .limit(1);

    return session ?? null;
  }

  async rotateRefreshToken(args: RotateRefreshTokenArgs, tx?: Tx): Promise<Session | null> {
    const { oldRefreshTokenHash, newRefreshTokenHash, refreshTokenExpiresAt } = args;
    const db = this.databaseService.getExecutor(tx);

    const [session] = await db
      .update(sessionsTable)
      .set({ refreshTokenHash: newRefreshTokenHash, expiresAt: refreshTokenExpiresAt })
      .where(
        and(
          eq(sessionsTable.refreshTokenHash, oldRefreshTokenHash),
          gt(sessionsTable.expiresAt, new Date()),
          isNull(sessionsTable.revokedAt),
        ),
      )
      .returning();

    return session ?? null;
  }

  async revokeSession(refreshTokenHash: string, tx?: Tx): Promise<boolean> {
    const db = this.databaseService.getExecutor(tx);

    const [session] = await db
      .update(sessionsTable)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessionsTable.refreshTokenHash, refreshTokenHash), isNull(sessionsTable.revokedAt)))
      .returning({ id: sessionsTable.id });

    return Boolean(session);
  }

  async deleteExpiredSessions(): Promise<void> {
    const db = this.databaseService.getExecutor();

    await db.delete(sessionsTable).where(lte(sessionsTable.expiresAt, new Date()));
  }
}
