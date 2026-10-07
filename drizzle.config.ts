import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?schema=public`;

export default defineConfig({
  out: './drizzle',
  schema: './src/modules/database/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
