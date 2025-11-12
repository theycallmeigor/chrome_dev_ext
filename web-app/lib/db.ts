import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

// Get database path - stores in project root for easy access
const DB_PATH = path.join(process.cwd(), 'checkout-champ.db');

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Create database file if it doesn't exist
  const dbExists = fs.existsSync(DB_PATH);

  db = new Database(DB_PATH, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  });

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize schema if database is new
  if (!dbExists) {
    initializeSchema();
  }

  return db;
}

function initializeSchema() {
  if (!db) return;

  // Create funnels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS funnels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funnelId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      firstSeen TEXT NOT NULL,
      lastSeen TEXT NOT NULL,
      isPinned INTEGER DEFAULT 0,
      isFavorite INTEGER DEFAULT 0,
      isOwned INTEGER DEFAULT 0,
      notes TEXT,
      tags TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_funnels_funnelId ON funnels(funnelId);
    CREATE INDEX IF NOT EXISTS idx_funnels_domain ON funnels(domain);
    CREATE INDEX IF NOT EXISTS idx_funnels_isPinned ON funnels(isPinned);
    CREATE INDEX IF NOT EXISTS idx_funnels_isFavorite ON funnels(isFavorite);
  `);

  // Create pages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funnelId TEXT NOT NULL,
      pageId TEXT NOT NULL,
      title TEXT NOT NULL,
      urlSlug TEXT NOT NULL,
      externalURL TEXT,
      referenceId TEXT,
      pageType TEXT,
      splitEnabled INTEGER DEFAULT 0,
      firstSeen TEXT NOT NULL,
      isFavorite INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (funnelId) REFERENCES funnels(funnelId) ON DELETE CASCADE,
      UNIQUE(funnelId, pageId)
    );

    CREATE INDEX IF NOT EXISTS idx_pages_funnelId ON pages(funnelId);
    CREATE INDEX IF NOT EXISTS idx_pages_pageId ON pages(pageId);
    CREATE INDEX IF NOT EXISTS idx_pages_pageType ON pages(pageType);
    CREATE INDEX IF NOT EXISTS idx_pages_splitEnabled ON pages(splitEnabled);
  `);

  console.log('✓ Database schema initialized successfully');
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// Utility function to run queries safely
export function runQuery<T>(
  query: string,
  params?: unknown[]
): T[] {
  const database = getDatabase();
  const stmt = database.prepare(query);
  return params ? stmt.all(...params) as T[] : stmt.all() as T[];
}

// Utility function to run insert/update/delete
export function runExec(
  query: string,
  params?: unknown[]
): Database.RunResult {
  const database = getDatabase();
  const stmt = database.prepare(query);
  return params ? stmt.run(...params) : stmt.run();
}

// Initialize database on module load in development
if (process.env.NODE_ENV !== 'production') {
  getDatabase();
}
