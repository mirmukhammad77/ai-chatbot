import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service.js';

export type Tx = Parameters<DatabaseService['db']['transaction']>[0] extends (tx: infer T) => Promise<unknown> ? T : never;

@Injectable()
export class UnitOfWork {
  constructor(private readonly databaseService: DatabaseService) {}
  async run<T>(callback: (tx: Tx) => Promise<T>): Promise<T> {
    return this.databaseService.db.transaction(async (tx) => {
      return callback(tx);
    });
  }
}
