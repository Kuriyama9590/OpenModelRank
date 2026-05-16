import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'arena-reports.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    migrate(db);
  }
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS arena_reports (
      id TEXT PRIMARY KEY,
      model_name TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      overall_max_score INTEGER NOT NULL,
      percentage REAL NOT NULL,
      category_scores TEXT NOT NULL,
      results TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_arena_reports_created_at
      ON arena_reports(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_arena_reports_model_name
      ON arena_reports(model_name);
  `);
}
