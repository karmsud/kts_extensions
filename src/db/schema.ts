import BetterSqlite3 from 'better-sqlite3';

/**
 * Initializes all FRP application tables in the SQLite database.
 * Safe to call on every startup — uses IF NOT EXISTS.
 */
export function initializeSchema(db: BetterSqlite3.Database): void {
  console.log('🔄 Initializing database schema...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS frp_servicers (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      servicer_name  TEXT NOT NULL,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS frp_settings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS frp_deals (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id     TEXT,
      deal_name   TEXT NOT NULL,
      keyword     TEXT NOT NULL,
      servicer_id INTEGER,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS frp_mailbox_jobs (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      job_name        TEXT NOT NULL UNIQUE,
      mailbox         TEXT,
      folder          TEXT,
      sme_emails      TEXT,
      last_email      TEXT,
      save_location   TEXT,
      enabled         INTEGER DEFAULT 1,
      servicer_id     INTEGER,
      priority        INTEGER DEFAULT 0,
      server_side     INTEGER DEFAULT 0,
      queue_one_file  INTEGER DEFAULT 0,
      day_adjust      INTEGER DEFAULT 0,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS frp_filters (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id       INTEGER NOT NULL,
      filter_type  TEXT NOT NULL,
      filter_value TEXT,
      FOREIGN KEY (job_id) REFERENCES frp_mailbox_jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS frp_parsers (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id       INTEGER NOT NULL,
      parser_type  TEXT NOT NULL,
      parser_value TEXT,
      FOREIGN KEY (job_id) REFERENCES frp_mailbox_jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS frp_templates (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id         INTEGER NOT NULL,
      template_name  TEXT NOT NULL,
      template_value TEXT,
      FOREIGN KEY (job_id) REFERENCES frp_mailbox_jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS frp_job_configs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id     INTEGER NOT NULL UNIQUE,
      config     TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES frp_mailbox_jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS frp_job_config_drafts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id     INTEGER NOT NULL UNIQUE,
      config     TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES frp_mailbox_jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS frp_script_versions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id      INTEGER,
      version     TEXT,
      script_content TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS frp_sftp_jobs (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      job_name           TEXT NOT NULL UNIQUE,
      path               TEXT,
      servicer_id        INTEGER,
      dsn                TEXT,
      sme_emails         TEXT,
      save_location      TEXT,
      skip_list          TEXT,
      ignore_list        TEXT,
      zip_content_filter TEXT DEFAULT '.*',
      day_adjust         INTEGER DEFAULT 0,
      enabled            INTEGER DEFAULT 1,
      created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS frp_sftp_job_parsers (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      sftp_job_id  INTEGER NOT NULL,
      parser_type  TEXT NOT NULL,
      parser_value TEXT,
      FOREIGN KEY (sftp_job_id) REFERENCES frp_sftp_jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS frp_sftp_job_templates (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      sftp_job_id    INTEGER NOT NULL,
      template_name  TEXT NOT NULL,
      template_value TEXT,
      FOREIGN KEY (sftp_job_id) REFERENCES frp_sftp_jobs(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ Database schema initialized');
}
