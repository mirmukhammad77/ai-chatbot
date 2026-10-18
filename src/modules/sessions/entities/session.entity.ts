import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from '../../users/entities/user.entity.js';

export const sessionsTable = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id),
    refreshTokenHash: text('refresh_token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
);

export type Session = typeof sessionsTable.$inferSelect;
