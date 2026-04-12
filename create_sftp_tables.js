const mysql = require('mysql2/promise');

async function createTables() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'world'
    });
    
    console.log('Connected to MySQL database');
    
    // Create frp_sftp_jobs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS frp_sftp_jobs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          job_name VARCHAR(255) NOT NULL UNIQUE,
          path VARCHAR(500) NOT NULL,
          servicer_id INT NULL,
          dsn VARCHAR(255) NULL,
          sme_emails TEXT NULL,
          save_location VARCHAR(500) NOT NULL,
          skip_list VARCHAR(500) NULL DEFAULT 'N:\\\\Automation\\\\BV_Script\\\\Settings\\\\SkipListOCW.txt',
          ignore_list VARCHAR(500) NULL DEFAULT 'N:\\\\Automation\\\\BV_Script\\\\Settings\\\\IgnoreListOCW.txt',
          zip_content_filter VARCHAR(255) NULL DEFAULT '.*',
          day_adjust INT NULL DEFAULT 0,
          enabled BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_job_name (job_name),
          INDEX idx_enabled (enabled),
          INDEX idx_servicer_id (servicer_id)
      )
    `);
    console.log('✅ Created frp_sftp_jobs table');

    // Create frp_sftp_job_parsers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS frp_sftp_job_parsers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sftp_job_id INT NOT NULL,
          parser_type ENUM('MoveFile', 'MoveFile2') NOT NULL DEFAULT 'MoveFile',
          parser_value VARCHAR(500) NOT NULL DEFAULT '.*',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (sftp_job_id) REFERENCES frp_sftp_jobs(id) ON DELETE CASCADE,
          INDEX idx_sftp_job_id (sftp_job_id)
      )
    `);
    console.log('✅ Created frp_sftp_job_parsers table');

    // Create frp_sftp_job_templates table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS frp_sftp_job_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sftp_job_id INT NOT NULL,
          template_name VARCHAR(255) NOT NULL,
          template_value TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (sftp_job_id) REFERENCES frp_sftp_jobs(id) ON DELETE CASCADE,
          INDEX idx_sftp_job_id (sftp_job_id),
          INDEX idx_template_name (template_name)
      )
    `);
    console.log('✅ Created frp_sftp_job_templates table');
    
    // Show created tables
    const [tables] = await connection.execute('SHOW TABLES LIKE "frp_sftp%"');
    console.log('SFTP tables created:', tables.map(row => Object.values(row)[0]));
    
    console.log('🎉 All SFTP tables created successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create tables:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTables();
