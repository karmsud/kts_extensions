require('dotenv').config();
const mysql = require('mysql2/promise');

const TABLES = [
  'frp_servicers','frp_settings','frp_mailbox_jobs','frp_filters','frp_parsers',
  'frp_templates','frp_job_configs','frp_job_config_drafts','frp_script_versions',
  'frp_deals','frp_sftp_jobs','frp_sftp_job_parsers','frp_sftp_job_templates',
];

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  for (const t of TABLES) {
    try {
      const [cols] = await c.query(`DESCRIBE \`${t}\``);
      const [rows] = await c.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
      console.log(`${t} (${rows[0].cnt} rows): ${cols.map(r => r.Field).join(', ')}`);
    } catch(e) {
      console.log(`${t}: NOT FOUND`);
    }
  }
  c.end();
}
run().catch(console.error);
