import { index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { conversationsTable } from '../../conversations/entities/conversation.entity.ts';

export const MessageRoleEnum = pgEnum('message_role_enum', ['user', 'assistant', 'system']);
export type MessageRoleEnumType = (typeof MessageRoleEnum.enumValues)[number];

export const MessageStatusEnum = pgEnum('message_status_enum', ['pending', 'completed', 'failed']);
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
    status: MessageStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [index('messages_conversation_id').on(table.conversationId)],
);

export type Message = typeof MessagesTable.$inferSelect;
