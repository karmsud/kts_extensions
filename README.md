# FRP Prototype - Enhanced File Routing and Processing Management System

A comprehensive web-based prototype for managing PowerShell email monitoring jobs and deal/keyword mappings. This system provides a modern interface for configuring, deploying, and managing automated file processing workflows.

## 🆕 **Latest Enhancements** (Just Completed)

### 🔒 **Enterprise-Grade Security & Reliability**
- **Enhanced Security**: Comprehensive input validation, rate limiting, and security headers
- **Centralized Error Handling**: Professional error management with detailed logging
- **Database Security**: Removed hardcoded credentials, enhanced connection monitoring
- **Input Sanitization**: All endpoints protected with express-validator middleware

### ⚡ **Performance & Architecture Improvements**
- **Service Layer Architecture**: Business logic separated from controllers for better maintainability
- **Custom React Hooks**: `useApi`, `useMutation`, `useDebounce` for optimized data management  
- **React Optimizations**: Error boundaries, memoization, and proper dependency management
- **Enhanced TypeScript**: Improved type definitions and safer code patterns

### 📊 **Professional Observability**
- **Winston Logging**: Structured logging with file rotation and multiple log levels
- **Health Check System**: Comprehensive monitoring (database, memory, disk, environment)
- **Request Tracing**: HTTP request logging with performance metrics
- **Error Tracking**: Centralized error logging with contextual information

### 🧪 **Testing & Development Experience**
- **Jest Testing Framework**: Unit tests with coverage reporting and CI/CD support
- **Development Tools**: Automated setup scripts and monitoring utilities
- **Enhanced Documentation**: Comprehensive guides and troubleshooting
- **Developer Scripts**: `npm run setup`, `npm run logs`, `npm run health`

---

## 🎯 Overview

The FRP Management System bridges the gap between complex PowerShell automation scripts and user-friendly business interfaces. It enables centralized management of email monitoring jobs, deal/keyword mappings, and configuration deployment while maintaining integration with existing PowerShell infrastructure.

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** with npm
- **MySQL 8.0+**
- **Git** for version control

### Setup Instructions

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd frp-prototype
npm install
cd client && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Setup database
mysql -u root -p
CREATE DATABASE world;
EXIT;

# 4. Start development servers
npm run dev           # Backend (Terminal 1)
cd client && npm run dev  # Frontend (Terminal 2)
```

### Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## 📚 Documentation

### Core Documentation
- **[Business Requirements](docs/BUSINESS_REQUIREMENTS.md)** - Business case, objectives, and value proposition
- **[Product Requirements](docs/PRODUCT_REQUIREMENTS.md)** - Detailed feature specifications and user stories
- **[Technical Requirements](docs/TECHNICAL_REQUIREMENTS.md)** - Architecture, infrastructure, and implementation details
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Complete guide for navigating and contributing to the codebase
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Environment setup and deployment procedures
- **[Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md)** - System design and architectural patterns

### Additional Documentation
- **[API Documentation](docs/API.md)** - REST API endpoints and usage examples
- **[Database Schema](docs/DATABASE.md)** - Data model and relationships
- **[Security Guide](docs/SECURITY.md)** - Security considerations and best practices
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Node.js API   │    │   MySQL DB      │
│                 │    │                 │    │                 │
│ - Dashboard     │◄──►│ - Controllers   │◄──►│ - Jobs Tables   │
│ - Jobs Mgmt     │    │ - Services      │    │ - Deals Tables  │
│ - Deals Mgmt    │    │ - Repositories  │    │ - Config Tables │
│ - Settings      │    │ - Middleware    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ PowerShell XML  │
                       │ Configuration   │
                       │ Files           │
                       └─────────────────┘
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL 8.0 with JSON support
- **Integration**: PowerShell XML + CSV processing

## ✨ Features

### Current Implementation ✅
- **Jobs Management**: Complete CRUD for email monitoring jobs
- **Deals Management**: Deal/keyword mappings with servicer integration
- **Configuration Editor**: Comprehensive job configuration interface
- **Data Import/Export**: PowerShell XML and CSV file processing
- **Dashboard**: Real-time statistics and operational overview
- **REST API**: Complete backend API with error handling
- **Database Integration**: MySQL with connection pooling
- **File Processing**: XML parsing and generation for PowerShell scripts

### Future Enhancements 🔄
- User authentication and role-based access
- Real-time job monitoring and notifications
- Advanced reporting and analytics
- Mobile application support
- Cloud deployment options
- Machine learning optimization

## 📡 API Endpoints

### Jobs Management
```
GET    /api/v1/jobs                    # List all jobs
GET    /api/v1/jobs/{id}               # Get specific job
POST   /api/v1/jobs                    # Create new job
PUT    /api/v1/jobs/{id}               # Update job
DELETE /api/v1/jobs/{id}               # Delete job
GET    /api/v1/jobs/{id}/config        # Get job configuration
PUT    /api/v1/jobs/{id}/config        # Update job configuration
POST   /api/v1/jobs/import             # Import from PowerShell XML
GET    /api/v1/jobs/export             # Export to PowerShell XML
```

### Deals Management
```
GET    /api/v1/deals                   # List all deals
POST   /api/v1/deals                   # Create new deal
PUT    /api/v1/deals/{id}              # Update deal
DELETE /api/v1/deals/{id}              # Delete deal
POST   /api/v1/deals/import            # Import from CSV
GET    /api/v1/deals/export            # Export to CSV
GET    /api/v1/deals/stats             # Get statistics
```

### System
```
GET    /health                         # Health check
GET    /api/v1                         # API information
GET    /api/v1/settings                # Application settings
```

## 🗄️ Database Schema

### Core Tables
- **`frp_mailbox_jobs`** - Main job configurations
- **`frp_job_configs`** - Extended job configurations (JSON)
- **`frp_deals`** - Deal/keyword mappings
- **`frp_servicers`** - Servicer master data
- **`frp_settings`** - Application settings
- **`frp_job_config_drafts`** - Staging area for configuration changes

### Key Features
- **JSON columns** for flexible configuration storage
- **Foreign key constraints** for data integrity
- **Indexes** for performance optimization
- **Transaction support** for complex operations

## 🔄 Data Import/Export

### Import from Existing Files

```bash
# Import PowerShell Jobs (via API)
POST /api/v1/jobs/import
# Reads from outlook.ps1 file

# Import CSV Deals (via API)
POST /api/v1/deals/import
# Reads from tblExternalDIDRef.csv file
```

### Export to Files

```bash
# Export to PowerShell XML (via API)
GET /api/v1/jobs/export
# Creates updated outlook.ps1 file

# Export Deals to CSV (via API)  
GET /api/v1/deals/export
# Creates CSV file with all deal data
```

## 🛡️ Security Features

- **Helmet.js** security headers
- **CORS** configuration
- **Input validation** and sanitization
- **SQL injection prevention** (parameterized queries)
- **Error handling** without information disclosure
- **File upload restrictions**

## 🔧 Development

### Scripts
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production  
npm start        # Start production server
npm test         # Run tests (future implementation)
```

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting (configured)
- **Consistent error handling** patterns
- **Database transactions** for data integrity
- **Comprehensive logging**

## 📊 Project Structure

```
frp-prototype/
├── src/                    # Backend source code
│   ├── config/            # Database and app configuration
│   ├── controllers/       # API endpoint handlers  
│   ├── middleware/        # Express middleware
│   ├── repositories/      # Data access layer
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript type definitions
│   └── server.ts         # Main server entry point
├── client/               # Frontend React application
│   ├── src/             # React source code
│   │   ├── components/   # React components
│   │   ├── services/     # API client services
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Main React component
│   └── public/          # Static assets
├── docs/                # Comprehensive documentation
├── database/            # Database schema and migrations
├── dist/               # Compiled code (generated)
├── uploads/            # File upload storage
├── outlook.ps1         # PowerShell configuration file
├── tblExternalDIDRef.csv # Sample deal data
└── README.md           # This file
```

## 🚨 Known Limitations (Prototype)

- **No authentication/authorization** (by design for prototype)
- **No file upload interface** (uses local file paths)
- **No real-time PowerShell script execution**
- **Basic error handling** (production would need enhanced logging)
- **Limited production deployment guidance**

## 🔍 Testing the Prototype

### Recommended Testing Flow

1. **Start with Dashboard**
   - Verify UI loads correctly
   - Check statistics display

2. **Import Data**
   - Import PowerShell jobs first using "Import from XML" button
   - Then import CSV deals using "Import from CSV" button
   - Verify data appears in dashboard and management pages

3. **Test CRUD Operations**
   - Create a new job through the interface
   - Edit an existing deal
   - Delete test data
   - Test search and filtering

4. **Test Export**
   - Export jobs to XML and verify file contents
   - Export deals to CSV and verify data

## 🎯 Demo Scenarios

### For Technical Team
1. Show backend API endpoints working with Postman/curl
2. Demonstrate data import/export functionality
3. Show database integration and query performance
4. Explain security considerations and error handling

### For Business Users
1. Start with dashboard overview showing key metrics
2. Show job management interface and configuration options
3. Demonstrate search and filtering capabilities
4. Show import/export capabilities for data management

## 🤝 Contributing

This is a prototype for internal evaluation. For feedback or improvements:

1. Review the [Developer Guide](docs/DEVELOPER_GUIDE.md) for detailed development instructions
2. Check the [Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md) for system design
3. Follow the coding standards and patterns established in the codebase
4. Test API endpoints and verify database operations
5. Report any issues or suggestions through appropriate channels

## 🆘 Support

### Getting Help

1. **Check Documentation**: Review the comprehensive docs in the `/docs` folder
2. **Check Logs**: Review browser console and server terminal for errors
3. **Verify Setup**: Ensure all dependencies are installed and services running
4. **Database Issues**: Verify MySQL is running and credentials are correct

### Common Issues

- **Port conflicts**: Change ports in `.env` file if 3001/3000 are in use
- **Database connection**: Verify MySQL service is running and credentials are correct
- **Import failures**: Ensure `outlook.ps1` and `tblExternalDIDRef.csv` files exist in project root
- **Build issues**: Delete `node_modules` and run `npm install` in both root and client directories

For additional support, consult the [Troubleshooting Guide](docs/TROUBLESHOOTING.md) or contact the development team.

---

## 📋 Environment Variables

```bash
# Backend Configuration
PORT=3001
NODE_ENV=development

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
```

---

**Note**: This is a prototype for demonstration and feedback purposes. Production deployment would require additional security, monitoring, and infrastructure considerations as outlined in the [Technical Requirements](docs/TECHNICAL_REQUIREMENTS.md) and [Deployment Guide](docs/DEPLOYMENT_GUIDE.md).

---

**Project Version**: 1.0  
**Last Updated**: January 2025  
**Development Team**: FRP Prototype Team  
**Documentation**: See `/docs` folder for comprehensive documentation 