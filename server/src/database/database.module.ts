import { Global, Inject, Injectable, Module, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { initDatabase } from './seed';

export const APP_DB = 'APP_DB';
export const IDENTITY_DB = 'IDENTITY_DB';

function openDb(dbPath: string): Database.Database {
  const resolved = path.resolve(process.cwd(), dbPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const db = new Database(resolved);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

@Injectable()
export class SchemaService implements OnModuleInit {
  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    @Inject(IDENTITY_DB) private readonly identityDb: Database.Database,
  ) {}

  onModuleInit() {
    // 启动时自动建表并写入种子数据，重复启动不会重复写入
    initDatabase(this.appDb, this.identityDb);
  }
}

/** 业务库与身份隔离库分开，均为 SQLite 文件 */
@Global()
@Module({
  providers: [
    {
      provide: APP_DB,
      useFactory: () => openDb(process.env.DB_PATH ?? './data/app.db'),
    },
    {
      provide: IDENTITY_DB,
      useFactory: () => openDb(process.env.IDENTITY_DB_PATH ?? './data/identity.db'),
    },
    SchemaService,
  ],
  exports: [APP_DB, IDENTITY_DB],
})
export class DatabaseModule {}
