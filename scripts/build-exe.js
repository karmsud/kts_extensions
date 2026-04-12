/**
 * Build script: compiles TypeScript + React frontend, then bundles into a
 * self-contained release/ folder runnable with Node.js (no antivirus issues).
 * Run with: npm run build:exe
 * Output: release/ folder with start.bat + start.ps1 + server.js + client/build/
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RELEASE_DIR = path.join(ROOT, 'release');
const CLIENT_BUILD = path.join(ROOT, 'client', 'build');
const RELEASE_CLIENT = path.join(RELEASE_DIR, 'client', 'build');

function run(cmd, cwd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: cwd || ROOT });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

console.log('=== FRP Build Script ===\n');

// 1. Build TypeScript backend
console.log('[1/5] Compiling TypeScript backend...');
run('npx tsc');

// 2. Build React frontend
console.log('[2/5] Building React frontend...');
run('npm run build', path.join(ROOT, 'client'));

// 3. Verify client build exists
if (!fs.existsSync(path.join(CLIENT_BUILD, 'index.html'))) {
  console.error('ERROR: client/build/index.html not found. Frontend build failed.');
  process.exit(1);
}

// 4. Bundle backend into single JS file with ncc
console.log('[3/5] Bundling backend with ncc...');
fs.mkdirSync(RELEASE_DIR, { recursive: true });
run(`npx ncc build dist/server.js -o release/bundle --external better-sqlite3`);

// 5. Assemble release folder
console.log('[4/5] Assembling release folder...');

// Copy bundled server
fs.copyFileSync(path.join(RELEASE_DIR, 'bundle', 'index.js'), path.join(RELEASE_DIR, 'server.js'));
fs.rmSync(path.join(RELEASE_DIR, 'bundle'), { recursive: true, force: true });

// Copy better-sqlite3 native addon next to server.js
const addon = path.join(ROOT, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
const addonDest = path.join(RELEASE_DIR, 'better_sqlite3.node');
if (fs.existsSync(addon)) fs.copyFileSync(addon, addonDest);

// Copy better-sqlite3 lib folder (database.js etc)
const bsSrc = path.join(ROOT, 'node_modules', 'better-sqlite3', 'lib');
const bsDest = path.join(RELEASE_DIR, 'node_modules', 'better-sqlite3', 'lib');
copyDir(bsSrc, bsDest);
// Copy better-sqlite3 package.json
fs.mkdirSync(path.join(RELEASE_DIR, 'node_modules', 'better-sqlite3'), { recursive: true });
fs.copyFileSync(
  path.join(ROOT, 'node_modules', 'better-sqlite3', 'package.json'),
  path.join(RELEASE_DIR, 'node_modules', 'better-sqlite3', 'package.json')
);
// Copy build/Release
const bsBuild = path.join(ROOT, 'node_modules', 'better-sqlite3', 'build', 'Release');
const bsBuildDest = path.join(RELEASE_DIR, 'node_modules', 'better-sqlite3', 'build', 'Release');
copyDir(bsBuild, bsBuildDest);

// Copy frontend build
copyDir(CLIENT_BUILD, RELEASE_CLIENT);

// Copy/create config.json
const configDest = path.join(RELEASE_DIR, 'config.json');
const configExample = path.join(ROOT, 'config.example.json');
if (!fs.existsSync(configDest)) {
  fs.copyFileSync(configExample, configDest);
  console.log('Created release/config.json from config.example.json');
}

// Write start.bat
const bat = `@echo off\r\ntitle FRP Management System\r\necho Starting FRP Management System...\r\ncd /d "%~dp0"\r\nstart http://localhost:3001\r\nnode server.js\r\npause\r\n`;
fs.writeFileSync(path.join(RELEASE_DIR, 'start.bat'), bat, 'utf8');

// Write start.ps1
const ps1 = `Set-Location $PSScriptRoot\nStart-Process "http://localhost:3001"\nnode server.js\n`;
fs.writeFileSync(path.join(RELEASE_DIR, 'start.ps1'), ps1, 'utf8');

console.log('[5/5] Done!\n');
console.log('Output (copy entire release/ folder to users):');
console.log('  release/server.js        <- bundled Node.js app');
console.log('  release/client/build/    <- frontend assets');
console.log('  release/start.bat        <- double-click to launch');
console.log('  release/start.ps1        <- PowerShell launcher');
console.log('  release/config.json      <- edit DB_PATH to your network share');
console.log('\nREQUIRES: Node.js 18+ installed on target machine.');
console.log('IMPORTANT: Edit release/config.json and set DB_PATH before distributing.');
