/**
 * One-time migration script: copies all frp_* data from MySQL to SQLite.
 *
 * Prerequisites:
 *  - MySQL server running with existing FRP data
 *  - .env file configured with DB_* credentials
 *  - better-sqlite3 installed (npm install)
 *  - mysql2 installed temporarily for this script: npm install --save-dev mysql2
 *
 * Usage (run once on your personal machine):
 *   node scripts/migrate-mysql-to-sqlite.js
 *
 * Output: ./database.db (copy this to your network share)
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Check mysql2 is available
let mysql;
try {
  mysql = require('mysql2/promise');
} catch {
  console.error('ERROR: mysql2 is required for migration.');
  console.error('Run: npm install --save-dev mysql2');
  process.exit(1);
}

const Database = require('better-sqlite3');

const SQLITE_OUTPUT = path.join(process.cwd(), 'database.db');

// Tables in dependency order (parent before child)
const TABLES = [
  'frp_servicers',
  'frp_settings',
  'frp_mailbox_jobs',
  'frp_filters',
  'frp_parsers',
  'frp_templates',
  'frp_job_configs',
  'frp_job_config_drafts',
  'frp_script_versions',
  'frp_deals',
  'frp_sftp_jobs',
  'frp_sftp_job_parsers',
  'frp_sftp_job_templates',
];

// Column renames: { table: { mysqlCol: sqliteCol } }
const COLUMN_RENAMES = {
  frp_servicers: { name: 'servicer_name' },
};

// Columns to drop per table (MySQL has them, SQLite schema doesn't)
const COLUMNS_TO_DROP = {
  frp_sftp_job_parsers: ['created_at', 'updated_at'],
  frp_sftp_job_templates: ['created_at', 'updated_at'],
  frp_settings: ['*'], // completely different schema (key-value vs flat), skip
  frp_job_configs: ['schedule','emailSettings','folderPaths','filePatterns','options','filters','parsers','servicer_id','priority','server_side','queue_one_file','templates'], // MySQL schema differs; 0 rows anyway
  frp_script_versions: ['version_number','file_path','created_by','description','is_active'], // schema differs; 0 rows
};

async function migrate() {
  console.log('=== FRP MySQL → SQLite Migration ===\n');

  // Connect to MySQL
  const mysqlConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'world',
  });

  console.log(`✅ Connected to MySQL: ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'world'}`);

  // Open/create SQLite
  if (fs.existsSync(SQLITE_OUTPUT)) {
    fs.renameSync(SQLITE_OUTPUT, SQLITE_OUTPUT + '.bak');
    console.log(`📁 Backed up existing database.db → database.db.bak`);
  }
  const sqlite = new Database(SQLITE_OUTPUT);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = OFF'); // disable during bulk insert

  console.log(`✅ SQLite database created: ${SQLITE_OUTPUT}\n`);

  // Initialize schema
  const { initializeSchema } = require('../dist/db/schema.js');
  initializeSchema(sqlite);

  let totalMigrated = 0;

  for (const table of TABLES) {
    // Check table exists in MySQL
    const [checkRows] = await mysqlConn.query(
      `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
      [process.env.DB_NAME || 'world', table]
    );
    if (checkRows[0].cnt === 0) {
      console.log(`  ⏭  ${table} — not found in MySQL, skipping`);
      continue;
    }

    const [rows] = await mysqlConn.query(`SELECT * FROM \`${table}\``);
    if (rows.length === 0) {
      console.log(`  ⏭  ${table} — empty, skipping`);
      continue;
    }

    // Skip entire table if marked with ['*']
    const dropCols = COLUMNS_TO_DROP[table] || [];
    if (dropCols.includes('*')) {
      console.log(`  ⏭  ${table} — skipped (incompatible schema)`);
      continue;
    }

    // Get column names from first row, apply drops + renames
    const renames = COLUMN_RENAMES[table] || {};
    const mysqlCols = Object.keys(rows[0]).filter(c => !dropCols.includes(c));
    const sqliteCols = mysqlCols.map(c => renames[c] || c);
    const placeholders = sqliteCols.map(() => '?').join(', ');
    const insertSQL = `INSERT OR IGNORE INTO ${table} (${sqliteCols.join(', ')}) VALUES (${placeholders})`;
    const insertStmt = sqlite.prepare(insertSQL);

    const insertMany = sqlite.transaction((rows) => {
      for (const row of rows) {
        const values = mysqlCols.map(col => {
          const v = row[col];
          if (v instanceof Date) return v.toISOString().replace('T', ' ').slice(0, 19);
          if (typeof v === 'boolean') return v ? 1 : 0;
          return v;
        });
        insertStmt.run(...values);
      }
    });

    insertMany(rows);
    console.log(`  ✅ ${table} — ${rows.length} rows migrated`);
    totalMigrated += rows.length;
  }

  sqlite.pragma('foreign_keys = ON');
  sqlite.close();
  await mysqlConn.end();

  console.log(`\n✅ Migration complete! Total rows: ${totalMigrated}`);
  console.log(`📁 SQLite database: ${SQLITE_OUTPUT}`);
  console.log('\nNext steps:');
  console.log('  1. Copy database.db to your network share (e.g. X:\\FRP\\database.db)');
  console.log('  2. Update config.json DB_PATH to point to that location');
  console.log('  3. Run: npm run build:exe');
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
