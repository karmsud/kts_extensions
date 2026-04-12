# FRP Management System - Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Development Environment](#development-environment)
3. [Staging Environment](#staging-environment)
4. [Production Environment](#production-environment)
5. [Database Management](#database-management)
6. [Configuration Management](#configuration-management)
7. [Security Considerations](#security-considerations)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Recovery](#backup-and-recovery)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The FRP Management System can be deployed in various environments, from local development to enterprise production. The application uses **SQLite** as its database — a file-based, zero-configuration database that requires no separate server process. This simplifies deployment significantly.

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │   SQLite DB     │
│   (Nginx/ALB)   │◄──►│   (Node.js)     │◄──►│   (File-based)  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   File Storage  │
                       │ (Local/Network) │
                       └─────────────────┘
```

### Deployment Types
- **Development**: Local machine with hot reload
- **Standalone (EXE)**: Self-contained release folder with Node.js
- **Staging**: Testing environment mirroring production
- **Production**: Deployed via the build:exe script as a portable package

---

## Development Environment

### Prerequisites
- Node.js 18+ with npm
- Git for version control
- 4GB+ RAM recommended

### Quick Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd frp-prototype

# 2. Install dependencies
npm install
cd client && npm install && cd ..

# 3. Configuration
cp config.example.json config.json
# Edit config.json — set DB_PATH to your desired database location
# Example: {"DB_PATH": "./database.db", "PORT": 3001}

# 4. Start development servers
npm run dev           # Backend (Terminal 1)
cd client && npm run dev  # Frontend (Terminal 2)
```

### Configuration (config.json)
```json
{
  "DB_PATH": "./database.db",
  "PORT": 3001
}
```

- **DB_PATH**: Path to the SQLite database file. Can be a local path (`./database.db`) or a network share (`X:\\FRP\\database.db`). The file is created automatically on first run.
- **PORT**: Server port (default: 3001)

### Development Services
```bash
# Backend Development Server
# - Auto-restart on file changes (ts-node-dev)
# - TypeScript compilation
# - Source maps enabled
npm run dev

# Frontend Development Server
# - Hot Module Replacement (HMR)
# - Fast refresh for React
# - Development optimizations
cd client && npm run dev
```

### Development Verification
```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
open http://localhost:3000

# Check API endpoints
curl http://localhost:3001/api/v1
```

---

## Staging Environment

### Infrastructure Requirements
- **Application Server**: 2 CPU cores, 4GB RAM, 50GB SSD
- **Network**: Access to the shared SQLite database file (if using network share)
- No separate database server required (SQLite is embedded)

### Staging Deployment Steps

**1. Server Preparation**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx

# Install PM2 for process management
sudo npm install -g pm2
```

**2. Application Deployment**
```bash
# Create application user
sudo useradd -m -s /bin/bash frp-app
sudo mkdir -p /opt/frp
sudo chown frp-app:frp-app /opt/frp

# Switch to app user
sudo su - frp-app

# Clone and build application
cd /opt/frp
git clone <repository-url> .
npm ci
npm run build

# Build frontend
cd client
npm ci
npm run build
cd ..
```

**3. Database Setup**
```bash
# No manual database setup required!
# SQLite database is created automatically on first server start.
# Just ensure config.json has the correct DB_PATH:
cat > config.json << 'EOF'
{
  "DB_PATH": "/opt/frp/data/database.db",
  "PORT": 3001
}
EOF

# Create the data directory
mkdir -p /opt/frp/data
```

**4. Process Management with PM2**
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'frp-backend',
    script: 'dist/server.js',
    instances: 1,
    env: {
      NODE_ENV: 'staging',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

> **Note**: SQLite supports only one writer at a time (with WAL mode enabling concurrent reads). Use `instances: 1` for PM2. For multi-instance scaling, consider migrating to PostgreSQL or MySQL.

**5. Nginx Configuration**
```nginx
# /etc/nginx/sites-available/frp-staging
server {
    listen 80;
    server_name frp-staging.yourdomain.com;

    # Frontend static files
    location / {
        root /opt/frp/client/build;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001;
        access_log off;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/frp-staging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Production Environment

### Recommended: Standalone Release Package

The simplest production deployment uses the built-in `build:exe` script to create a self-contained release package:

```bash
# Build the release package
npm run build:exe
```

This creates a `release/` folder containing:
- `server.js` — bundled Node.js backend
- `client/build/` — compiled frontend
- `start.bat` / `start.ps1` — launch scripts
- `config.json` — database configuration (edit before distributing)
- `better_sqlite3.node` — native SQLite addon

**Distributing to Users:**
1. Copy the entire `release/` folder to the target machine
2. Install Node.js 18+ on the target machine
3. Edit `release/config.json` to set `DB_PATH` (e.g., a network share path)
4. Double-click `start.bat` or run `start.ps1`

### Server Deployment with Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY dist/ ./dist/
COPY client/build/ ./client/build/
COPY config.example.json ./config.json
EXPOSE 3001
USER node
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  frp:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data          # SQLite database storage
      - ./config.json:/app/config.json  # Configuration
    environment:
      - NODE_ENV=production
    restart: unless-stopped

# No separate database service needed — SQLite is embedded!
```

### Nginx Reverse Proxy (Production)
```nginx
server {
    listen 443 ssl http2;
    server_name frp.yourdomain.com;

    ssl_certificate /path/to/ssl/fullchain.pem;
    ssl_certificate_key /path/to/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name frp.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Database Management

### SQLite Overview

The FRP system uses **SQLite** via the `better-sqlite3` Node.js package. Key features:
- **Zero configuration** — no separate database server to install or manage
- **File-based** — the entire database is a single `.db` file
- **WAL mode** — enables concurrent read access while writing
- **Network share support** — `DB_PATH` can point to a UNC path (e.g., `X:\FRP\database.db`)
- **Auto-creation** — tables are created automatically on first run via `src/db/schema.ts`

### Database Location

Configure the database path in `config.json`:
```json
{
  "DB_PATH": "./database.db"
}
```

Examples:
- Local: `"./database.db"` or `"C:\\FRP\\database.db"`
- Network share: `"X:\\FRP\\database.db"` or `"\\\\server\\share\\FRP\\database.db"`

### Schema Management

The database schema is defined in `src/db/schema.ts` and applied automatically on startup. Tables include:
- `frp_mailbox_jobs` — email monitoring job configurations
- `frp_job_filters` — job filter rules
- `frp_job_parsers` — job parser configurations
- `frp_job_templates` — job template mappings
- `frp_deals` — deal/keyword mappings
- `frp_servicers` — servicer master data
- `frp_settings` — application settings
- `frp_sftp_jobs` — SFTP job configurations

### Database Pragmas

The application configures these SQLite pragmas for optimal performance:
```sql
PRAGMA journal_mode = WAL;       -- Write-Ahead Logging for concurrent reads
PRAGMA busy_timeout = 5000;      -- Wait up to 5s for write locks
PRAGMA synchronous = NORMAL;     -- Balance between safety and speed
PRAGMA foreign_keys = ON;        -- Enforce referential integrity
```

---

## Configuration Management

### Configuration File (config.json)

The application uses a simple `config.json` file (copy from `config.example.json`):

```json
{
  "DB_PATH": "./database.db",
  "PORT": 3001
}
```

### Environment-Specific Examples

**Development**
```json
{
  "DB_PATH": "./database.db",
  "PORT": 3001
}
```

**Production (Network Share)**
```json
{
  "DB_PATH": "X:\\FRP\\database.db",
  "PORT": 3001
}
```

**Production (Linux)**
```json
{
  "DB_PATH": "/opt/frp/data/database.db",
  "PORT": 3001
}
```

---

## Security Considerations

### SSL/TLS Configuration

Use Nginx or a load balancer to terminate SSL. See the Nginx configuration in the Production Environment section above.

### Firewall Configuration

```bash
# Basic firewall setup (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Database Security

SQLite security is primarily file-system based:
- Set restrictive file permissions on the `.db` file: `chmod 640 database.db`
- Ensure the database directory is only accessible to the application user
- Use network share permissions to control access when DB is on a shared drive
- The application uses parameterized queries to prevent SQL injection

### Application Security Features

- **Helmet.js** — security headers (X-Frame-Options, CSP, etc.)
- **CORS** — configured origin restrictions
- **Rate limiting** — `express-rate-limit` middleware
- **Input validation** — `express-validator` on all endpoints
- **Parameterized queries** — prevents SQL injection
- **File upload restrictions** — via `multer` middleware

---

## Monitoring and Logging

### Application Monitoring

**Health Check Endpoint**
```bash
curl http://localhost:3001/health
```

Returns:
```json
{
  "status": "OK",
  "timestamp": "2026-04-12T12:00:00.000Z",
  "services": {
    "database": "OK",
    "filesystem": "OK"
  }
}
```

### Logging

The application uses **Winston** for structured logging:

- `logs/combined.log` — all log messages
- `logs/error.log` — error-level messages only
- `logs/exceptions.log` — uncaught exceptions
- `logs/rejections.log` — unhandled promise rejections

Configure log level via the application (default: `info` in production, `debug` in development).

### Request Logging

**Morgan** middleware logs all HTTP requests with performance timing.

---

## Backup and Recovery

### Database Backup

Since SQLite is a single file, backup is straightforward:

**Manual Backup**
```bash
# Simple file copy (safe when using WAL mode)
cp /opt/frp/data/database.db /opt/backups/frp_backup_$(date +%Y%m%d_%H%M%S).db
```

**Automated Backup Script (Linux)**
```bash
#!/bin/bash
# backup.sh
set -e

DB_PATH="/opt/frp/data/database.db"
BACKUP_DIR="/opt/backups/frp"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

BACKUP_FILE="$BACKUP_DIR/frp_backup_$(date +%Y%m%d_%H%M%S).db"

# Use SQLite's backup API for a consistent copy
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Compress
gzip "$BACKUP_FILE"

# Upload to S3 (optional)
if [ ! -z "$AWS_S3_BUCKET" ]; then
  aws s3 cp "$BACKUP_FILE.gz" "s3://$AWS_S3_BUCKET/backups/"
fi

# Clean up old backups
find $BACKUP_DIR -name "frp_backup_*.db.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Windows Backup (PowerShell)**
```powershell
$dbPath = "X:\FRP\database.db"
$backupDir = "X:\FRP\backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

New-Item -Path $backupDir -ItemType Directory -Force
Copy-Item $dbPath "$backupDir\frp_backup_$timestamp.db"

# Clean up backups older than 30 days
Get-ChildItem $backupDir -Filter "frp_backup_*.db" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item
```

**Backup Cron Job (Linux)**
```bash
# Run daily at 2 AM
0 2 * * * /opt/scripts/backup.sh 2>&1 | logger -t frp-backup
```

### Recovery

```bash
# Stop the application
pm2 stop frp-backend

# Replace database with backup
cp /opt/backups/frp/frp_backup_YYYYMMDD_HHMMSS.db /opt/frp/data/database.db

# Restart the application
pm2 start frp-backend
```

---

## Troubleshooting

### Common Issues

**Application won't start**
```bash
# Check Node.js version
node --version  # Must be 18+

# Check if port is in use
lsof -i :3001   # Linux
netstat -ano | findstr :3001  # Windows

# Check config.json exists and is valid JSON
cat config.json | python -m json.tool
```

**Database errors**
```bash
# Check DB_PATH is accessible
ls -la /opt/frp/data/database.db

# Check file permissions
stat /opt/frp/data/database.db

# Check for WAL files (normal — these are temporary)
ls -la /opt/frp/data/database.db*
# Expect: database.db, database.db-shm, database.db-wal

# Test database integrity
sqlite3 /opt/frp/data/database.db "PRAGMA integrity_check;"
```

**Network share database issues**
- Ensure the network share is mounted and accessible
- Verify the application user has read/write permissions
- Check that antivirus is not locking the `.db` file
- WAL mode requires the `-shm` and `-wal` files to be on the same share

**Frontend not loading**
```bash
# Check if client/build exists (for production)
ls client/build/index.html

# Rebuild if missing
cd client && npm run build && cd ..
```

**Import failures**
- Ensure the PowerShell XML file or CSV is in the expected format
- Check the server logs: `tail -20 logs/error.log`

### Log Locations

| Log | Path | Purpose |
|-----|------|---------|
| Combined | `logs/combined.log` | All application logs |
| Errors | `logs/error.log` | Error-level messages |
| Exceptions | `logs/exceptions.log` | Uncaught exceptions |
| Rejections | `logs/rejections.log` | Unhandled rejections |

### Useful Commands

```bash
# View recent errors
tail -50 logs/error.log

# Follow logs in real-time
tail -f logs/combined.log

# Check application status (PM2)
pm2 status
pm2 logs frp-backend

# Restart application
pm2 restart frp-backend
```
