import { Module } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const IDENTITY_DB_PATH = process.env.IDENTITY_DATABASE_PATH || './data/identity.db';

let identityDb: Database.Database;

export function getIdentityDb(): Database.Database {
  if (!identityDb) {
    const dir = path.dirname(IDENTITY_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    identityDb = new Database(IDENTITY_DB_PATH);
  }
  return identityDb;
}

@Module({})
export class IdentityDatabaseModule {}
