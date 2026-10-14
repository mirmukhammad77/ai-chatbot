import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { validateEnvConfig } from './src/shared/configs/env.config.js';

const config = validateEnvConfig(process.env);

export default defineConfig({
  out: './migrations',
  schema: './src/modules/database/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: config.DATABASE_HOST,
    port: config.DATABASE_PORT,
    database: config.DATABASE_NAME,
    user: config.DATABASE_USERNAME,
    password: config.DATABASE_PASSWORD,
    ssl: false,
  },
});
