import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from '../../users/entities/user.entity.ts';

export const conversationsTable = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id),
    title: text('title'),
    isPinned: boolean('is_pinned').default(false).notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [index('conversations_user_id_unique').on(table.userId)],
);

export type Conversation = typeof conversationsTable.$inferSelect;
