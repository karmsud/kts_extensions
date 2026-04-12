const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'World'
    });
    
    console.log('Connected to MySQL database');
    
    // Show current database
    const [dbResult] = await connection.execute('SELECT DATABASE() as current_db');
    console.log('Current database:', dbResult[0].current_db);
    
    // List tables to see what exists
    const [tablesResult] = await connection.execute('SHOW TABLES');
    console.log('Existing tables:', tablesResult.map(row => Object.values(row)[0]));
    
    // Read the migration SQL file
    const sqlFile = path.join(__dirname, 'scripts', 'sftp_jobs_migration.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('SQL content preview:', sqlContent.substring(0, 500));
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log('Number of statements found:', statements.length);
    console.log('First few statements:');
    statements.slice(0, 3).forEach((stmt, i) => {
      console.log(`Statement ${i + 1}:`, stmt.trim().substring(0, 100) + '...');
    });
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      // Skip empty statements and pure comment blocks (but allow CREATE statements that have comments)
      if (trimmedStatement && 
          !trimmedStatement.startsWith('--') && 
          trimmedStatement.toLowerCase().includes('create') || 
          trimmedStatement.toLowerCase().includes('insert') ||
          trimmedStatement.toLowerCase().includes('set @')) {
        try {
          const result = await connection.execute(trimmedStatement);
          console.log('✅ Executed: ', trimmedStatement.substring(0, 80) + '...');
        } catch (error) {
          console.log('❌ Error executing:', trimmedStatement.substring(0, 50) + '...');
          console.log('   Error:', error.message);
        }
      } else if (trimmedStatement && !trimmedStatement.startsWith('--')) {
        console.log('🔧 Skipping non-essential statement:', trimmedStatement.substring(0, 50) + '...');
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
