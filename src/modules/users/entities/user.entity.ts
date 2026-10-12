import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const userRolesEnum = pgEnum('user_roles_enum', ['ADMIN', 'USER', 'GUEST']);
export type UserRoleType = (typeof userRolesEnum.enumValues)[number];

export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  password: text('password').notNull(),
  role: userRolesEnum('role').notNull().default('USER'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
});

export type User = typeof usersTable.$inferSelect;
