# FRP Management System - Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Development Environment](#development-environment)
3. [Staging Environment](#staging-environment)
4. [Production Environment](#production-environment)
5. [Database Deployment](#database-deployment)
6. [Configuration Management](#configuration-management)
7. [Security Considerations](#security-considerations)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Recovery](#backup-and-recovery)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The FRP Management System can be deployed in various environments, from local development to enterprise production. This guide covers deployment strategies, configuration, and best practices for each environment type.

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │   Database      │
│   (Nginx/ALB)   │◄──►│   (Node.js)     │◄──►│   (MySQL)       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   File Storage  │
                       │   (NFS/S3)      │
                       └─────────────────┘
```

### Deployment Types
- **Development**: Local machine with hot reload
- **Staging**: Testing environment mirroring production
- **Production**: High-availability, secure deployment

---

## Development Environment

### Prerequisites
- Node.js 18+ with npm
- MySQL 8.0+ or compatible
- Git for version control
- 8GB+ RAM, 4+ CPU cores recommended

### Quick Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd frp-prototype

# 2. Install dependencies
npm install
cd client && npm install && cd ..

# 3. Environment configuration
cp .env.example .env
# Edit .env with your local settings

# 4. Database setup
mysql -u root -p
CREATE DATABASE world;
EXIT;

# 5. Start development servers
npm run dev           # Backend (Terminal 1)
cd client && npm run dev  # Frontend (Terminal 2)
```

### Environment Variables (.env)
```bash
# Development Environment
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=world

# File Paths
POWERSHELL_SCRIPT_PATH=./outlook.ps1
SCRIPT_VERSIONS_DIR=./script_versions
UPLOAD_DIR=./uploads

# API Configuration
API_PREFIX=/api/v1

# Debug Settings
LOG_LEVEL=debug
ENABLE_SQL_LOGGING=true
```

### Development Services
```bash
# Backend Development Server
# - Auto-restart on file changes
# - TypeScript compilation
# - Source maps enabled
npm run dev

# Frontend Development Server  
# - Hot Module Replacement (HMR)
# - Fast refresh for React
# - Development optimizations
cd client && npm run dev

# Database Development
# - Local MySQL instance
# - Development data
# - No replication
```

### Development Verification
```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
open http://localhost:3000

# Check API endpoints
curl http://localhost:3001/api/v1

# Test database connection
npm run test:db
```

---

## Staging Environment

### Infrastructure Requirements
- **Application Server**: 4 CPU cores, 8GB RAM, 100GB SSD
- **Database Server**: 4 CPU cores, 8GB RAM, 200GB SSD
- **Load Balancer**: 2 CPU cores, 4GB RAM, 50GB SSD
- **Network**: Internal VPN or secure network

### Staging Deployment Steps

**1. Server Preparation**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL 8.0
sudo apt update
sudo apt install mysql-server-8.0

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
npm ci --only=production
npm run build

# Build frontend
cd client
npm ci --only=production
npm run build
cd ..
```

**3. Database Setup**
```bash
# Create database and user
mysql -u root -p
CREATE DATABASE frp_staging;
CREATE USER 'frp_app'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON frp_staging.* TO 'frp_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u frp_app -p frp_staging < database/schema.sql
```

**4. Process Management with PM2**
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'frp-backend',
    script: 'dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
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

**5. Nginx Configuration**
```nginx
# /etc/nginx/sites-available/frp-staging
server {
    listen 80;
    server_name frp-staging.yourdomain.com;
    
    # Frontend static files
    location / {
        root /opt/frp/client/dist;
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

### Staging Environment Variables
```bash
# /opt/frp/.env
NODE_ENV=staging
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=frp_app
DB_PASSWORD=secure_staging_password
DB_NAME=frp_staging

# File paths
POWERSHELL_SCRIPT_PATH=/opt/frp/config/outlook.ps1
SCRIPT_VERSIONS_DIR=/opt/frp/data/script_versions
UPLOAD_DIR=/opt/frp/data/uploads

# Logging
LOG_LEVEL=info
LOG_FILE=/opt/frp/logs/application.log

# Security
ENABLE_CORS=true
CORS_ORIGIN=http://frp-staging.yourdomain.com
```

---

## Production Environment

### Infrastructure Requirements

**High Availability Setup**
- **Load Balancer**: AWS ALB, Azure Load Balancer, or Nginx
- **Web Servers**: 2+ instances with 8+ CPU cores, 16GB+ RAM
- **Database**: Primary/replica setup, 16+ CPU cores, 32GB+ RAM
- **Storage**: NFS or cloud storage for shared files
- **Network**: VPC with proper security groups

### Production Deployment Architecture

**Option 1: Traditional Server Deployment**
```bash
# Load Balancer (Nginx)
server {
    listen 443 ssl http2;
    server_name frp.yourdomain.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    upstream backend {
        least_conn;
        server app1.internal:3001 max_fails=3 fail_timeout=30s;
        server app2.internal:3001 max_fails=3 fail_timeout=30s;
    }
    
    location / {
        root /var/www/frp-frontend;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://backend;
        # Additional proxy settings...
    }
}
```

**Option 2: Container Deployment (Docker)**
```dockerfile
# Dockerfile.backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY dist/ ./dist/
EXPOSE 3001
USER node
CMD ["node", "dist/server.js"]

# Dockerfile.frontend
FROM nginx:alpine
COPY client/dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

**Docker Compose for Production**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_NAME=frp_production
    depends_on:
      - db
    networks:
      - frp-network
    
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - frp-network
    
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: frp_production
      MYSQL_USER: frp_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    networks:
      - frp-network

volumes:
  db_data:

networks:
  frp-network:
    driver: bridge
```

### Cloud Deployment Options

**AWS Deployment**
```bash
# Using AWS ECS with Fargate
# 1. Build and push images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker build -t frp-backend .
docker tag frp-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/frp-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/frp-backend:latest

# 2. Create ECS task definition
{
  "family": "frp-production",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "frp-backend",
      "image": "<account>.dkr.ecr.us-east-1.amazonaws.com/frp-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}

# 3. Create RDS MySQL instance
aws rds create-db-instance \
  --db-instance-identifier frp-production \
  --db-instance-class db.t3.medium \
  --engine mysql \
  --engine-version 8.0.35 \
  --allocated-storage 100 \
  --master-username admin \
  --master-user-password <secure-password>
```

**Kubernetes Deployment**
```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frp-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frp-backend
  template:
    metadata:
      labels:
        app: frp-backend
    spec:
      containers:
      - name: frp-backend
        image: your-registry/frp-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: frp-secrets
              key: db-host
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: frp-backend-service
spec:
  selector:
    app: frp-backend
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
```

### Production Environment Variables
```bash
# Production .env (stored securely)
NODE_ENV=production
PORT=3001

# Database (use AWS RDS, Azure Database, etc.)
DB_HOST=frp-prod-cluster.cluster-xyz.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=frp_app
DB_PASSWORD=${SECURE_DB_PASSWORD}
DB_NAME=frp_production

# Redis for caching (optional)
REDIS_URL=redis://frp-prod-cache.xyz.cache.amazonaws.com:6379

# File storage (use S3, Azure Blob, etc.)
UPLOAD_STRATEGY=s3
AWS_S3_BUCKET=frp-production-uploads
AWS_REGION=us-east-1

# Security
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CORS_ORIGIN=https://frp.yourdomain.com

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
METRICS_PORT=9090

# Email notifications
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=${SMTP_PASSWORD}
```

---

## Database Deployment

### Development Database
```bash
# Local MySQL setup
mysql -u root -p
CREATE DATABASE world;
CREATE USER 'frp_dev'@'localhost' IDENTIFIED BY 'dev_password';
GRANT ALL PRIVILEGES ON world.* TO 'frp_dev'@'localhost';
FLUSH PRIVILEGES;

# Import schema and sample data
mysql -u frp_dev -p world < database/schema.sql
mysql -u frp_dev -p world < database/sample_data.sql
```

### Production Database Setup

**High Availability MySQL**
```bash
# Master-Slave Replication Setup
# Master Server Configuration (/etc/mysql/mysql.conf.d/mysqld.cnf)
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
gtid-mode = ON
enforce-gtid-consistency = ON

# Slave Server Configuration
[mysqld]
server-id = 2
relay-log = relay-log
read-only = 1
gtid-mode = ON
enforce-gtid-consistency = ON

# Create replication user
CREATE USER 'replication'@'%' IDENTIFIED BY 'replication_password';
GRANT REPLICATION SLAVE ON *.* TO 'replication'@'%';

# Setup slave
CHANGE MASTER TO
  MASTER_HOST='master-ip',
  MASTER_USER='replication',
  MASTER_PASSWORD='replication_password',
  MASTER_AUTO_POSITION=1;
START SLAVE;
```

**Database Migration Script**
```bash
#!/bin/bash
# migrate.sh

set -e

DB_HOST=${1:-localhost}
DB_USER=${2:-frp_app}
DB_NAME=${3:-frp_production}

echo "Starting database migration for $DB_NAME on $DB_HOST"

# Backup current database
mysqldump --single-transaction -h $DB_HOST -u $DB_USER -p $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
for migration in database/migrations/*.sql; do
    echo "Running migration: $migration"
    mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < $migration
done

echo "Migration completed successfully"
```

**Database Schema Versioning**
```sql
-- Create schema version table
CREATE TABLE schema_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track migrations
INSERT INTO schema_versions (version, description) 
VALUES ('1.0.0', 'Initial schema');

INSERT INTO schema_versions (version, description) 
VALUES ('1.1.0', 'Added job configuration tables');
```

---

## Configuration Management

### Environment-Specific Configuration

**Development Configuration**
```typescript
// config/development.ts
export const config = {
  database: {
    host: 'localhost',
    port: 3306,
    username: 'frp_dev',
    password: 'dev_password',
    database: 'world',
    logging: true,
    synchronize: true
  },
  server: {
    port: 3001,
    cors: {
      origin: 'http://localhost:3000',
      credentials: true
    }
  },
  logging: {
    level: 'debug',
    console: true,
    file: false
  }
};
```

**Production Configuration**
```typescript
// config/production.ts
export const config = {
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false,
    ssl: {
      rejectUnauthorized: false
    }
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true
    }
  },
  logging: {
    level: 'info',
    console: false,
    file: '/var/log/frp/application.log'
  }
};
```

### Secrets Management

**Using AWS Secrets Manager**
```typescript
// utils/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

export async function getSecret(secretName: string): Promise<string> {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    return response.SecretString || '';
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw error;
  }
}

// Usage
const dbPassword = await getSecret('frp/production/db-password');
```

**Using Docker Secrets**
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    image: frp-backend
    secrets:
      - db_password
      - jwt_secret
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

---

## Security Considerations

### SSL/TLS Configuration

**Nginx SSL Configuration**
```nginx
server {
    listen 443 ssl http2;
    server_name frp.yourdomain.com;
    
    # SSL Certificate
    ssl_certificate /path/to/ssl/fullchain.pem;
    ssl_certificate_key /path/to/ssl/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'";
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name frp.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Firewall Configuration

**UFW (Ubuntu Firewall)**
```bash
# Basic firewall setup
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow database access from application servers only
sudo ufw allow from 10.0.1.0/24 to any port 3306

# Enable firewall
sudo ufw enable
```

**AWS Security Groups**
```json
{
  "GroupName": "frp-production-web",
  "Description": "Security group for FRP web servers",
  "IpPermissions": [
    {
      "IpProtocol": "tcp",
      "FromPort": 80,
      "ToPort": 80,
      "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
    },
    {
      "IpProtocol": "tcp",
      "FromPort": 443,
      "ToPort": 443,
      "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
    },
    {
      "IpProtocol": "tcp",
      "FromPort": 22,
      "ToPort": 22,
      "UserIdGroupPairs": [{"GroupId": "sg-admin-access"}]
    }
  ]
}
```

### Database Security

**MySQL Security Configuration**
```sql
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Remove remote root access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Remove test database
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Create application user with limited privileges
CREATE USER 'frp_app'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON frp_production.* TO 'frp_app'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

---

## Monitoring and Logging

### Application Monitoring

**Health Check Endpoint**
```typescript
// routes/health.ts
import { Router } from 'express';
import Database from '../config/database';

const router = Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      filesystem: 'unknown'
    }
  };

  try {
    // Check database connection
    const db = Database.getInstance().getPool();
    await db.execute('SELECT 1');
    health.services.database = 'OK';
  } catch (error) {
    health.services.database = 'ERROR';
    health.status = 'ERROR';
  }

  try {
    // Check filesystem access
    await fs.access('./uploads', fs.constants.W_OK);
    health.services.filesystem = 'OK';
  } catch (error) {
    health.services.filesystem = 'ERROR';
    health.status = 'ERROR';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
```

**Prometheus Metrics**
```typescript
// metrics.ts
import promClient from 'prom-client';

// Create metrics registry
const register = new promClient.Registry();

// Default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const activeJobs = new promClient.Gauge({
  name: 'frp_active_jobs_total',
  help: 'Total number of active jobs'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(activeJobs);

export { register, httpRequestDuration, activeJobs };
```

### Centralized Logging

**Winston Logger Configuration**
```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'frp-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

**ELK Stack Configuration**
```yaml
# docker-compose.elk.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

---

## Backup and Recovery

### Database Backup Strategy

**Automated Backup Script**
```bash
#!/bin/bash
# backup.sh

set -e

# Configuration
DB_HOST="localhost"
DB_USER="frp_app"
DB_PASSWORD="$1"
DB_NAME="frp_production"
BACKUP_DIR="/opt/backups/mysql"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename
BACKUP_FILE="$BACKUP_DIR/frp_backup_$(date +%Y%m%d_%H%M%S).sql"

# Create backup
echo "Creating backup: $BACKUP_FILE"
mysqldump --single-transaction --routines --triggers \
  -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3 (optional)
if [ ! -z "$AWS_S3_BUCKET" ]; then
  aws s3 cp $BACKUP_FILE.gz s3://$AWS_S3_BUCKET/backups/
fi

# Clean up old backups
find $BACKUP_DIR -name "frp_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully"
```

**Backup Cron Job**
```bash
# Add to crontab
0 2 * * * /opt/scripts/backup.sh $DB_PASSWORD 2>&1 | logger -t mysql-backup
```

### Application Configuration Backup

**Configuration Versioning**
```bash
#!/bin/bash
# backup-config.sh

CONFIG_DIR="/opt/frp"
BACKUP_DIR="/opt/backups/config"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup configuration files
tar -czf $BACKUP_DIR/config_$TIMESTAMP.tar.gz \
  -C $CONFIG_DIR \
  .env \
  ecosystem.config.js \
  nginx.conf \
  outlook.ps1

# Backup PowerShell script versions
if [ -d "$CONFIG_DIR/script_versions" ]; then
  tar -czf $BACKUP_DIR/scripts_$TIMESTAMP.tar.gz \
    -C $CONFIG_DIR \
    script_versions/
fi

echo "Configuration backup completed: $BACKUP_DIR"
```

### Disaster Recovery Plan

**Recovery Procedures**
```bash
#!/bin/bash
# recover.sh

set -e

BACKUP_FILE="$1"
DB_NAME="frp_production"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

echo "Starting disaster recovery process..."

# Stop application
pm2 stop frp-backend

# Create recovery database
mysql -u root -p -e "DROP DATABASE IF EXISTS ${DB_NAME}_recovery;"
mysql -u root -p -e "CREATE DATABASE ${DB_NAME}_recovery;"

# Restore from backup
gunzip -c $BACKUP_FILE | mysql -u root -p ${DB_NAME}_recovery

# Verify restoration
TABLES=$(mysql -u root -p ${DB_NAME}_recovery -e "SHOW TABLES;" | wc -l)
echo "Restored database contains $TABLES tables"

# Switch databases (after verification)
mysql -u root -p -e "DROP DATABASE IF EXISTS ${DB_NAME}_old;"
mysql -u root -p -e "RENAME TABLE ${DB_NAME} TO ${DB_NAME}_old;"
mysql -u root -p -e "RENAME TABLE ${DB_NAME}_recovery TO ${DB_NAME};"

# Restart application
pm2 start frp-backend

echo "Disaster recovery completed successfully"
```

---

## Troubleshooting

### Common Deployment Issues

**Port Already in Use**
```bash
# Find process using port
sudo netstat -tulpn | grep :3001
# or
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>

# Check if port is available
nc -zv localhost 3001
```

**Database Connection Issues**
```bash
# Test database connectivity
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1;"

# Check database user permissions
mysql -u root -p -e "SHOW GRANTS FOR 'frp_app'@'localhost';"

# Verify database exists
mysql -u root -p -e "SHOW DATABASES;" | grep frp

# Check database configuration
cat /etc/mysql/mysql.conf.d/mysqld.cnf | grep bind-address
```

**File Permission Issues**
```bash
# Check application directory permissions
ls -la /opt/frp/

# Fix permissions
sudo chown -R frp-app:frp-app /opt/frp/
sudo chmod -R 755 /opt/frp/

# Check upload directory
ls -la /opt/frp/uploads/
sudo chmod 755 /opt/frp/uploads/
```

**SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in /path/to/cert.pem -text -noout

# Test SSL configuration
openssl s_client -connect frp.yourdomain.com:443

# Check certificate chain
curl -I https://frp.yourdomain.com
```

### Performance Issues

**Database Performance**
```sql
-- Check slow queries
SELECT * FROM mysql.slow_log 
ORDER BY start_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
    table_name,
    table_rows,
    ROUND(data_length / 1024 / 1024, 2) AS 'Data MB',
    ROUND(index_length / 1024 / 1024, 2) AS 'Index MB'
FROM information_schema.tables 
WHERE table_schema = 'frp_production'
ORDER BY data_length DESC;

-- Check index usage
SELECT 
    table_name,
    index_name,
    column_name
FROM information_schema.statistics 
WHERE table_schema = 'frp_production';
```

**Application Performance**
```bash
# Check memory usage
pm2 monit

# Check system resources
top -p $(pgrep -f "node.*server.js")

# Check disk usage
df -h /opt/frp/

# Check network connections
netstat -an | grep :3001
```

### Log Analysis

**Application Logs**
```bash
# View application logs
pm2 logs frp-backend

# View specific log file
tail -f /opt/frp/logs/combined.log

# Search for errors
grep "ERROR" /opt/frp/logs/combined.log | tail -20

# Analyze request patterns
grep "GET\|POST\|PUT\|DELETE" /var/log/nginx/access.log | \
  awk '{print $7}' | sort | uniq -c | sort -nr
```

**System Logs**
```bash
# Check system logs
journalctl -u nginx -f
journalctl -u mysql -f

# Check disk space issues
dmesg | grep -i "no space"

# Check memory issues
dmesg | grep -i "out of memory"
```

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying the FRP Management System across different environments. Key recommendations:

### Best Practices
- **Security First**: Always use HTTPS, secure secrets, and proper access controls
- **Monitoring**: Implement comprehensive monitoring and alerting
- **Backups**: Automate regular backups and test recovery procedures
- **Documentation**: Keep deployment procedures up-to-date
- **Testing**: Test deployments in staging before production

### Maintenance Schedule
- **Daily**: Monitor system health and performance metrics
- **Weekly**: Review logs and update security patches
- **Monthly**: Test backup restoration procedures
- **Quarterly**: Review and update deployment procedures

For additional support or questions about deployment, consult the development team or create an issue in the project repository.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: Quarterly  
**Maintainers**: DevOps Team, Infrastructure Team 