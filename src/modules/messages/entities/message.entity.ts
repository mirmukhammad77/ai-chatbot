import { sql } from 'drizzle-orm';
import { check, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { conversationsTable } from '../../conversations/entities/conversation.entity.js';

export const MessageRoleEnum = pgEnum('message_role_enum', ['user', 'assistant', 'system']);
export type MessageRoleEnumType = (typeof MessageRoleEnum.enumValues)[number];

export const MessageStatusEnum = pgEnum('message_status_enum', ['pending', 'streaming', 'completed', 'failed', 'cancelled']);
export type MessageStatusEnumType = (typeof MessageStatusEnum.enumValues)[number];

export const MessagesTable = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversationsTable.id),
    role: MessageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    provider: varchar('provider', { length: 50 }),
    model: varchar('model', { length: 100 }),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    totalTokens: integer('total_tokens'),
    finishReason: text('finish_reason'),
    sequence: integer('sequence').notNull(),
    status: MessageStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('messages_conversation_sequence_unique').on(table.conversationId, table.sequence),

    check('messages_input_tokens_nonnegative', sql`${table.inputTokens} >= 0`),

    check('messages_output_tokens_nonnegative', sql`${table.outputTokens} >= 0`),

    check('messages_total_tokens_nonnegative', sql`${table.totalTokens} >= 0`),
  ],
);

export type Message = typeof MessagesTable.$inferSelect;
