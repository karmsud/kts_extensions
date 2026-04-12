import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getAppConfig } from '../utils/appConfig';

class Database {
  private static instance: Database;
  private db: BetterSqlite3.Database;

  private constructor() {
    const config = getAppConfig();
    const dbPath = config.DB_PATH;

    // Ensure parent directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    console.log(`🔄 Opening SQLite database: ${dbPath}`);
    this.db = new BetterSqlite3(dbPath);

    // WAL mode: critical for multiple concurrent users on a network share
    this.db.pragma('journal_mode = WAL');
    // Auto-retry writes for 5 seconds when another user holds a write lock
    this.db.pragma('busy_timeout = 5000');
    // Improve performance
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');

    console.log('✅ SQLite database opened successfully');
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /** Returns the raw better-sqlite3 Database instance for direct use in repositories */
  public getDb(): BetterSqlite3.Database {
    return this.db;
  }

  public testConnection(): boolean {
    try {
      console.log('🔄 Testing database connection...');
      this.db.prepare('SELECT 1').get();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  public close(): void {
    try {
      this.db.close();
      console.log('🔒 Database closed gracefully');
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
  }

  public healthCheck(): boolean {
    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  public getDbPath(): string {
    return getAppConfig().DB_PATH;
  }
}

export default Database; 