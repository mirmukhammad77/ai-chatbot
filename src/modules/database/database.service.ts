import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { defineRelations } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type EnvConfig } from '#/shared/configs/env.config';
import * as schema from './schema';

const relations = defineRelations(schema);

type Database = NodePgDatabase<typeof relations>;
type Tx = Parameters<Database['transaction']>[0] extends (tx: infer T) => Promise<unknown> ? T : never;

@Injectable()
export class DatabaseService {
  public readonly db: Database;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const host = configService.get('DATABASE_HOST', { infer: true });
    const port = configService.get('DATABASE_PORT', { infer: true });
    const name = configService.get('DATABASE_NAME', { infer: true });
    const user = configService.get('DATABASE_USERNAME', { infer: true });
    const password = configService.get('DATABASE_PASSWORD', { infer: true });

    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${name}?schema=public`;

    this.db = drizzle({ connection: connectionString, relations });
  }

  getExecutor(tx?: Tx): Tx | Database {
    return tx ?? this.db;
  }
}
