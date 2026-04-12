import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { exec } from 'child_process';
import { getAppConfig } from './utils/appConfig';
import { initializeSchema } from './db/schema';

import Database from './config/database';
import jobRoutes from './routes/jobRoutes';
import dealRoutes from './routes/dealRoutes';
import servicerRoutes from './routes/servicerRoutes';
import settingsRoutes from './routes/settingsRoutes';
import outlookScriptRoutes from './routes/outlookScriptRoutes';
import sftpJobRoutes from './routes/sftpJobRoutes';

// Import middleware
import { errorHandler, notFoundHandler, gracefulShutdown } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiting';

// Import logging and health check
import logger, { logHTTPRequest } from './utils/logger';
import { healthCheckService } from './utils/healthCheck';

// Load environment variables
dotenv.config();

// Load app config (config.json for DB path, port)
const appConfig = getAppConfig();

const app = express();
const PORT = appConfig.PORT || process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Security and basic middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // React dev servers
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('combined'));
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to API routes
app.use(`${API_PREFIX}`, apiLimiter);

  // Serve static files (for frontend build)
  app.use(express.static(path.join(__dirname, '../client/build')));

// HTTP request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logHTTPRequest(req, res, duration);
  });
  
  next();
});

// Health check endpoint (enhanced)
app.get('/health', async (req, res) => {
  try {
    const healthCheck = await healthCheckService.runHealthCheck();
    
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check endpoint failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Simple health check for load balancers
app.get('/health/simple', async (req, res) => {
  const isHealthy = await healthCheckService.isHealthy();
  res.status(isHealthy ? 200 : 503).send(isHealthy ? 'OK' : 'UNHEALTHY');
});

// API Routes
app.use(`${API_PREFIX}/jobs`, jobRoutes);
app.use(`${API_PREFIX}/deals`, dealRoutes);
app.use(`${API_PREFIX}/servicers`, servicerRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/outlook-script`, outlookScriptRoutes);
app.use(`${API_PREFIX}/sftp-jobs`, sftpJobRoutes);

// API info endpoint
app.get(API_PREFIX, (req, res) => {
  res.json({
    name: 'FRP Prototype API',
    version: '1.0.0',
    description: 'File Routing and Processing Management API',
    endpoints: {
      jobs: `${API_PREFIX}/jobs`,
      deals: `${API_PREFIX}/deals`,
      health: '/health'
    }
  });
});

// 404 handler for API routes (must come before catch-all)
app.use(`${API_PREFIX}/*`, notFoundHandler);

// Catch-all handler for React Router (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Global error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Open SQLite database and initialize schema
    const db = Database.getInstance();
    const isConnected = db.testConnection();

    if (!isConnected) {
      console.error('Failed to open SQLite database. Exiting...');
      process.exit(1);
    }

    // Create tables if they don't exist
    initializeSchema(db.getDb());

    // Start server
    const server = app.listen(PORT, () => {
      logger.info('🚀 FRP Prototype Server Started Successfully', {
        port: PORT,
        apiPrefix: API_PREFIX,
        environment: process.env.NODE_ENV || 'development',
        healthEndpoint: `http://localhost:${PORT}/health`,
        apiEndpoint: `http://localhost:${PORT}${API_PREFIX}`,
        features: ['Enhanced Security', 'Rate Limiting', 'Centralized Logging', 'Health Checks']
      });
      
      console.log(`
🚀 FRP Prototype Server Started Successfully
📍 Server: http://localhost:${PORT}
📡 API: http://localhost:${PORT}${API_PREFIX}
🏥 Health: http://localhost:${PORT}/health
💻 Environment: ${process.env.NODE_ENV || 'development'}
🗄️ Database: SQLite (${appConfig.DB_PATH})
🔒 Security: Enhanced middleware enabled
⚡ Rate Limiting: Active on API routes
📊 Logging: Winston with file rotation
⏰ Started at: ${new Date().toISOString()}
      `);
    });

    // Auto-open browser when running as packaged exe (not in dev mode)
    if (process.env.NODE_ENV !== 'development') {
      setTimeout(() => {
        exec(`start http://localhost:${PORT}`, (err) => {
          if (err) console.error('Could not open browser:', err.message);
        });
      }, 1000);
    }

    // Set up graceful shutdown
    const shutdown = gracefulShutdown(server);
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Note: Graceful shutdown handlers are now set up in startServer() function

// Start the server
startServer(); 