# FRP Management System - Architecture Overview

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Component Architecture](#component-architecture)
4. [Data Architecture](#data-architecture)
5. [Integration Architecture](#integration-architecture)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Performance Architecture](#performance-architecture)
9. [Future Architecture Considerations](#future-architecture-considerations)

---

## System Overview

The File Routing and Processing (FRP) Management System is designed as a modern web application that provides centralized management of email monitoring jobs and deal/keyword mappings. The system bridges legacy PowerShell automation with contemporary web-based management interfaces.

### Architectural Goals
- **Modularity**: Loosely coupled components for maintainability
- **Scalability**: Horizontal scaling capabilities for growth
- **Reliability**: Fault tolerance and graceful error handling
- **Security**: Defense in depth with multiple security layers
- **Usability**: Intuitive interfaces for business users
- **Integration**: Seamless integration with existing systems

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   React     │  │   Mobile    │  │   API       │        │
│  │   Web App   │  │   App       │  │   Clients   │        │
│  │             │  │  (Future)   │  │  (Future)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Load Balancer   │
                    │   (Nginx/ALB)     │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                   Application Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Node.js   │  │   Node.js   │  │   Node.js   │          │
│  │   Server 1  │  │   Server 2  │  │   Server N  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Database Layer   │
                    │  ┌─────────────┐  │
                    │  │   SQLite     │  │
                    │  │   Database   │  │
                    │  └─────────────┘  │
                    └───────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                   Integration Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ PowerShell  │  │    File     │  │    Email    │          │
│  │   Scripts   │  │   Storage   │  │  Services   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Patterns

### 1. Three-Tier Architecture

The system follows a classic three-tier architecture pattern:

**Presentation Tier (Client-Side)**
- React single-page application (SPA)
- TypeScript for type safety
- Tailwind CSS for styling
- Responsive design for multiple devices

**Application Tier (Server-Side)**
- Node.js with Express framework
- RESTful API design
- Business logic separation
- Middleware for cross-cutting concerns

**Data Tier (Persistence)**
- SQLite embedded database (via better-sqlite3)
- WAL mode for concurrent read/write access
- File-based storage — supports local paths and network shares
- Transaction support for data integrity

### 2. Layered Architecture

Within the application tier, we implement a layered architecture:

```
┌─────────────────────────────────────┐
│          Controller Layer           │ ← HTTP Request Handling
├─────────────────────────────────────┤
│           Service Layer             │ ← Business Logic
├─────────────────────────────────────┤
│         Repository Layer            │ ← Data Access Abstraction
├─────────────────────────────────────┤
│          Database Layer             │ ← Data Persistence
└─────────────────────────────────────┘
```

**Controller Layer**
- HTTP request/response handling
- Input validation and sanitization
- Response formatting
- Error handling and logging

**Service Layer**
- Business logic implementation
- Data transformation and processing
- External service integration
- File processing operations

**Repository Layer**
- Database abstraction
- Query optimization
- Transaction management
- Connection pooling

### 3. Repository Pattern

Data access is abstracted through the repository pattern:

```typescript
interface JobRepository {
  getAllJobs(filters?: JobFilters): Promise<Job[]>;
  getJobById(id: number): Promise<Job | null>;
  createJob(job: CreateJobRequest): Promise<Job>;
  updateJob(id: number, updates: UpdateJobRequest): Promise<Job>;
  deleteJob(id: number): Promise<boolean>;
}
```

Benefits:
- Testability through dependency injection
- Database technology independence
- Centralized query logic
- Consistent error handling

### 4. Singleton Pattern

Database connections and configuration management use singleton pattern:

```typescript
class Database {
  private static instance: Database;
  private db: BetterSqlite3.Database;

  private constructor() {
    const config = getAppConfig();
    this.db = new BetterSqlite3(config.DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}
```

---

## Component Architecture

### Frontend Component Architecture

```
App (Root Component)
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Main Content Area
├── Router
│   ├── Dashboard
│   ├── JobsManagement
│   │   ├── JobList
│   │   ├── JobForm
│   │   └── JobConfigurationEditor
│   ├── DealsManagement
│   │   ├── DealList
│   │   ├── DealForm
│   │   └── DealKeywordManager
│   └── Settings
├── Shared Components
│   ├── Button
│   ├── Modal
│   ├── Table
│   ├── Form Elements
│   └── Loading Indicators
└── Services
    ├── API Client
    ├── Job Service
    ├── Deal Service
    └── Settings Service
```

**Component Design Principles**
- Single Responsibility: Each component has one clear purpose
- Composability: Components can be combined to create complex UIs
- Reusability: Shared components used across multiple pages
- Type Safety: TypeScript interfaces for all props and state

### Backend Component Architecture

```
Server Application
├── Routes
│   ├── Job Routes
│   ├── Deal Routes
│   ├── Settings Routes
│   └── Health Routes
├── Controllers
│   ├── JobController
│   ├── DealController
│   ├── JobConfigController
│   └── SettingsController
├── Services
│   ├── XMLParser
│   ├── CSVImporter
│   ├── ConfigDeployer
│   └── NotificationService (Future)
├── Repositories
│   ├── JobRepository
│   ├── DealRepository
│   └── SettingsRepository
├── Middleware
│   ├── Error Handler
│   ├── Request Logger
│   ├── CORS Handler
│   └── File Upload Handler
└── Configuration
    ├── Database Config
    ├── Server Config
    └── Environment Config
```

**Service Layer Details**

**XMLParser Service**
```typescript
class XMLParser {
  parseJobsFromXML(xmlPath: string): Promise<Job[]>
  generateXMLFromJobs(jobs: Job[]): Promise<string>
  validateXMLStructure(xml: string): boolean
}
```

**CSVImporter Service**
```typescript
class CSVImporter {
  importDealsFromCSV(csvPath: string): Promise<ImportResult>
  validateCSVFormat(csvContent: string): ValidationResult
  exportDealsToCSV(deals: Deal[]): Promise<string>
}
```

**ConfigDeployer Service**
```typescript
class ConfigDeployer {
  deployConfiguration(jobId: number, config: JobConfig): Promise<DeployResult>
  createBackup(configPath: string): Promise<string>
  rollbackConfiguration(backupPath: string): Promise<boolean>
}
```

---

## Data Architecture

### Database Schema Design

The database follows normalized design principles with strategic denormalization for performance:

```sql
-- Core Entity Tables
frp_mailbox_jobs        -- Main job configurations
frp_deals               -- Deal/keyword mappings
frp_servicers           -- Servicer master data

-- Configuration Tables
frp_job_configs         -- Extended job configurations (JSON)
frp_settings            -- Application settings

-- Operational Tables
frp_job_config_drafts   -- Staging area for changes
frp_script_versions     -- Version history (Future)
frp_audit_log           -- Change tracking (Future)
```

### Data Model Relationships

```
┌─────────────────┐    1:1    ┌─────────────────┐
│ frp_mailbox_jobs │◄────────►│ frp_job_configs │
│                 │           │                 │
│ - id (PK)       │           │ - job_id (FK)   │
│ - job_name      │           │ - filters       │
│ - mailbox       │           │ - parsers       │
│ - folder        │           │ - templates     │
│ - status        │           │                 │
└─────────────────┘           └─────────────────┘
                                       │
                               1:0..1  │
                                       ▼
                              ┌─────────────────┐
                              │frp_job_config_  │
                              │     drafts      │
                              │                 │
                              │ - job_id (FK)   │
                              │ - config (JSON) │
                              └─────────────────┘

┌─────────────────┐    N:1    ┌─────────────────┐
│   frp_deals     │──────────►│ frp_servicers   │
│                 │           │                 │
│ - id (PK)       │           │ - id (PK)       │
│ - deal_name     │           │ - name          │
│ - keyword       │           │ - description   │
│ - servicer_id   │           │ - active        │
│ - item_id       │           │                 │
└─────────────────┘           └─────────────────┘
```

### JSON Schema Design

Configuration data uses JSON columns for flexibility:

```json
{
  "filters": {
    "from": "@example.com",
    "attachments": "True",
    "subject": "Report"
  },
  "parsers": {
    "detach_file": ".*\\.pdf",
    "detach_file_subject": ".*",
    "ignore_files": "temp_.*",
    "unzip_files": false,
    "search_by_subject": true
  },
  "templates": {
    "main": "ProcessReport",
    
  }
}
```

### Data Flow Architecture

```
User Input
    │
    ▼
Frontend Validation
    │
    ▼
API Endpoint
    │
    ▼
Controller Validation
    │
    ▼
Service Layer Processing
    │
    ▼
Repository Layer
    │
    ▼
Database Transaction
    │
    ▼
Response Formation
    │
    ▼
Frontend Update
```

---

## Integration Architecture

### PowerShell Integration

The system integrates with existing PowerShell automation through XML configuration files:

```
FRP Management System
        │
        ▼
   XML Generation
        │
        ▼
  outlook.ps1 File
        │
        ▼
PowerShell Automation
        │
        ▼
  Email Processing
        │
        ▼
   File Storage
```

**Integration Components**

**XML Parser/Generator**
- Reads existing PowerShell configurations
- Generates updated XML configurations
- Validates XML structure and content
- Handles version compatibility

**File System Integration**
- Monitors configuration file changes
- Creates automatic backups
- Manages script versioning
- Handles file permissions

**Configuration Deployment**
- Atomic configuration updates
- Rollback capabilities
- Validation before deployment
- Audit trail maintenance

### External System Integration (Future)

**Email Notification Integration**
```
FRP System
    │
    ▼
SMTP Service
    │
    ▼
Business Users
```

**File Storage Integration**
```
FRP System
    │
    ▼
NFS/S3/Azure Blob
    │
    ▼
PowerShell Scripts
```

**Enterprise Integration**
```
FRP System
    │
    ├─► Active Directory (Authentication)
    ├─► LDAP (User Management)
    ├─► Enterprise Database (Data Sync)
    └─► Monitoring Systems (Metrics)
```

---

## Security Architecture

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Perimeter Security                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Firewall   │  │     WAF     │  │     CDN     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                  Application Security                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │    HTTPS    │  │    CORS     │  │   Headers   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└───────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                   Data Security                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Input Valid │  │  SQL Inject │  │ Encryption  │      │
│  │   ation     │  │ Prevention  │  │             │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└───────────────────────────────────────────────────────────┘
```

### Security Controls

**Authentication & Authorization (Future)**
- JWT token-based authentication
- Role-based access control (RBAC)
- Session management and timeout
- Multi-factor authentication (MFA)

**Input Validation & Sanitization**
- Server-side validation for all inputs
- Parameterized database queries
- File upload restrictions
- XSS prevention

**Data Protection**
- Encryption at rest for sensitive data
- HTTPS for data in transit
- Secure session management
- Data masking for logs

**Infrastructure Security**
- Network segmentation
- Firewall rules and access controls
- Regular security updates
- Vulnerability scanning

### Security Monitoring

```
Application Logs
    │
    ▼
Security Events
    │
    ▼
SIEM System
    │
    ▼
Alert Generation
    │
    ▼
Security Team
```

---

## Deployment Architecture

### Multi-Environment Architecture

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Development   │  │     Staging     │  │   Production    │
│                 │  │                 │  │                 │
│ - Local SQLite  │  │ - Shared SQLite │  │ - SQLite on     │
│ - Hot Reload    │  │ - Full Build    │  │   Network Share │
│ - Debug Mode    │  │ - Production    │  │ - Monitoring    │
│                 │  │   Config        │  │ - Backup        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Container Architecture (Future)

```yaml
services:
  frontend:
    image: frp-frontend:latest
    ports: ["80:80", "443:443"]
    
  backend:
    image: frp-backend:latest
    replicas: 3
    environment:
      - NODE_ENV=production
    
  database:
    # SQLite is file-based, no separate container needed
    # Database file mounted as a volume
    volumes:
      - db_data:/data/frp
```

### Cloud Architecture Options

**AWS Architecture**
```
Route 53 (DNS)
    │
    ▼
CloudFront (CDN)
    │
    ▼
Application Load Balancer
    │
    ├─► ECS/Fargate (Backend)
    │   └─► SQLite DB (file-based)
    └─► S3 (Static Files)
```

**Azure Architecture**
```
Azure DNS
    │
    ▼
Front Door
    │
    ▼
Application Gateway
    │
    ├─► Container Instances
    │   └─► SQLite DB (file-based)
    └─► Blob Storage
```

---

## Performance Architecture

### Caching Strategy

```
Browser Cache
    │
    ▼
CDN Cache
    │
    ▼
Application Cache
    │
    ▼
Database Cache
    │
    ▼
Database
```

**Caching Layers**

**Browser Caching**
- Static assets cached for 1 year
- API responses cached for 5 minutes
- Cache invalidation on updates

**Application Caching**
- Redis for session storage
- In-memory caching for configuration
- Query result caching

**Database Caching**
- SQLite WAL mode for read concurrency
- Prepared statement caching
- Busy timeout for write contention

### Scalability Architecture

**Horizontal Scaling**
```
Load Balancer
    │
    ├─► App Server 1
    ├─► App Server 2
    ├─► App Server 3
    └─► App Server N
            │
            ▼
    Database Cluster
```

**Vertical Scaling**
- CPU and memory optimization
- Database query optimization
- Index strategy implementation
- Connection pool tuning

### Performance Monitoring

```
Application Metrics
    │
    ├─► Response Time
    ├─► Throughput
    ├─► Error Rate
    └─► Resource Usage
            │
            ▼
    Monitoring Dashboard
            │
            ▼
    Alert System
```

---

## Future Architecture Considerations

### Microservices Migration

Current monolithic architecture could evolve to microservices:

```
API Gateway
    │
    ├─► Job Service
    ├─► Deal Service
    ├─► Configuration Service
    ├─► Notification Service
    └─► Authentication Service
```

### Event-Driven Architecture

Future implementation could include event sourcing:

```
User Action
    │
    ▼
Event Store
    │
    ├─► Job Events
    ├─► Deal Events
    └─► Config Events
            │
            ▼
    Event Handlers
            │
            ▼
    Business Logic
```

### Machine Learning Integration

Potential AI/ML capabilities:

```
Historical Data
    │
    ▼
ML Pipeline
    │
    ├─► Anomaly Detection
    ├─► Predictive Analytics
    └─► Optimization Suggestions
            │
            ▼
    Enhanced User Experience
```

### Cloud-Native Architecture

Migration to cloud-native patterns:

- **Serverless Functions**: For specific processing tasks
- **Container Orchestration**: Kubernetes deployment
- **Service Mesh**: Inter-service communication
- **Auto-scaling**: Dynamic resource allocation

### API Evolution

GraphQL integration for flexible data fetching:

```
GraphQL Gateway
    │
    ├─► REST APIs (Current)
    ├─► Direct Database Access
    └─► External Services
```

---

## Conclusion

The FRP Management System architecture is designed with flexibility, scalability, and maintainability in mind. The current three-tier architecture provides a solid foundation for immediate business needs while supporting future enhancements and technology migrations.

### Key Architectural Principles

1. **Separation of Concerns**: Clear boundaries between layers
2. **Loose Coupling**: Minimal dependencies between components
3. **High Cohesion**: Related functionality grouped together
4. **Scalability**: Design supports horizontal and vertical scaling
5. **Security**: Defense in depth with multiple security layers
6. **Maintainability**: Clean code and clear documentation

### Evolution Path

The architecture supports gradual evolution:
- **Phase 1**: Current monolithic deployment
- **Phase 2**: Enhanced monitoring and security
- **Phase 3**: Microservices migration
- **Phase 4**: Cloud-native transformation

This architectural approach ensures the system can meet current business requirements while providing a pathway for future growth and technological advancement.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: Quarterly  
**Architecture Owner**: Technical Architecture Team  
**Stakeholders**: Development Team, Infrastructure Team, Security Team 