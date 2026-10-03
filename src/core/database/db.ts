import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.resolve(import.meta.dirname, '../../../data/petrol_pump.db');

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  const schemaPath = path.resolve(import.meta.dirname, './schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Safe non-destructive column migrations
  try {
    db.prepare('ALTER TABLE credit_sales ADD COLUMN is_billed INTEGER NOT NULL DEFAULT 0').run();
  } catch {}
  try {
    db.prepare('ALTER TABLE credit_sales ADD COLUMN invoice_id TEXT').run();
  } catch {}
}

// Initialize on module load
initDatabase();
