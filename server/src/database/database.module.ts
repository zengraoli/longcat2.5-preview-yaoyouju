import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = process.env.DATABASE_PATH || './data/app.db';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
  }
  return db;
}

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE',
      useFactory: () => getDb(),
    },
  ],
  exports: ['DATABASE'],
})
export class DatabaseModule implements OnModuleDestroy {
  onModuleDestroy() {
    if (db) {
      db.close();
    }
  }
}
