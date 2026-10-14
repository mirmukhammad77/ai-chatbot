import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { defineRelations } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { type EnvConfig } from '../../shared/configs/env.config.js';
import * as schema from './schema/index.js';
import { type Tx } from './unit-of-work.js';

const relations = defineRelations(schema);

type Database = NodePgDatabase<typeof relations>;

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  public readonly db: Database;
  private readonly pool: Pool;

  constructor(configService: ConfigService<EnvConfig, true>) {
    this.pool = new Pool({
      host: configService.get('DATABASE_HOST', { infer: true }),
      port: configService.get('DATABASE_PORT', { infer: true }),
      database: configService.get('DATABASE_NAME', { infer: true }),
      user: configService.get('DATABASE_USERNAME', { infer: true }),
      password: configService.get('DATABASE_PASSWORD', { infer: true }),
    });
    this.db = drizzle({ client: this.pool, relations });
  }

  getExecutor(tx?: Tx): Tx | Database {
    return tx ?? this.db;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
