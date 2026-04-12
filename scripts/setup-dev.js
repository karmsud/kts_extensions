#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up FRP development environment...\n');

// Create necessary directories
const dirs = [
  'logs',
  'uploads',
  'temp'
];

dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`📁 Directory already exists: ${dir}`);
  }
});

// Create .env.example if it doesn't exist
const envExample = `# FRP Prototype Environment Variables
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1

# Database Configuration
# SQLite database path (configured in config.json)
# DB_PATH=./database.db

# Logging Configuration
LOG_LEVEL=info

# Optional: Email Configuration (for notifications)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
`;

const envExamplePath = path.join(process.cwd(), '.env.example');
if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, envExample);
  console.log('✅ Created .env.example file');
} else {
  console.log('📄 .env.example already exists');
}

// Check if .env exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n⚠️  Warning: .env file not found');
  console.log('   Please copy .env.example to .env and configure your environment variables');
  console.log('   Command: cp .env.example .env (or copy manually on Windows)');
} else {
  console.log('✅ .env file exists');
}

// Create gitkeep files for important empty directories
const gitkeepDirs = ['logs', 'uploads'];
gitkeepDirs.forEach(dir => {
  const gitkeepPath = path.join(process.cwd(), dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '# This file keeps the directory in Git\n');
    console.log(`✅ Created .gitkeep in ${dir}/`);
  }
});

console.log('\n🎉 Development environment setup complete!');
console.log('\nNext steps:');
console.log('1. Configure your .env file with database credentials');
console.log('2. Run: npm run build');
console.log('3. Run: npm run dev');
console.log('4. Visit: http://localhost:3001/health to verify setup');
console.log('\nHappy coding! 🚀'); 