# FRP Prototype Setup Guide

## 🚀 Complete Setup Instructions

### Step 1: Prerequisites
- **Node.js**: Version 18 or higher
- **MySQL**: Any recent version
- **Git**: For version control

### Step 2: Project Setup

1. **Clone or create the project directory**
```bash
mkdir frp-prototype
cd frp-prototype
```

2. **Backend Setup**
```bash
# Install backend dependencies
npm install

# Create environment file
cat > .env << 'EOF'
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password_here
DB_NAME=world

# File Paths
POWERSHELL_SCRIPT_PATH=./outlook.ps1
SCRIPT_VERSIONS_DIR=./script_versions
UPLOAD_DIR=./uploads

# API Configuration
API_PREFIX=/api/v1
EOF
```

3. **Frontend Setup**
```bash
# Navigate to frontend directory
cd client

# Install frontend dependencies
npm install

# Add missing Tailwind CSS forms plugin
npm install @tailwindcss/forms

# Return to root directory
cd ..
```

### Step 3: Database Setup

The database tables will be automatically created when you first run the backend. The application uses your existing MySQL "world" database.

### Step 4: Import Your Data

1. **Place your files in the project root:**
   - Copy `outlook.ps1` to the project root
   - Copy `tblExternalDIDRef.csv` to the project root

2. **Import existing data:**
   - Jobs will be imported from `outlook.ps1` via the API
   - Deals will be imported from `tblExternalDIDRef.csv` via the API

### Step 5: Start the Application

1. **Start the backend server (Terminal 1):**
```bash
npm run dev
```
Backend will be available at: http://localhost:3001

2. **Start the frontend development server (Terminal 2):**
```bash
cd client
npm run dev
```
Frontend will be available at: http://localhost:3000

## 🔍 Verification Steps

1. **Check Backend Health:**
   - Visit: http://localhost:3001/health
   - Should return: `{"status": "OK", ...}`

2. **Check API Endpoints:**
   - Visit: http://localhost:3001/api/v1
   - Should return API information

3. **Check Frontend:**
   - Visit: http://localhost:3000
   - Should display the FRP Management Dashboard

4. **Import Data:**
   - Use the "Import from XML" button to import PowerShell jobs
   - Use the "Import from CSV" button to import deals from CSV

## 📱 Using the Application

### Dashboard Features:
- **Overview Statistics**: Active jobs, total deals, unique servicers
- **Recent Activity**: Latest jobs and top keywords
- **Quick Actions**: Import data, manage jobs and deals

### Jobs Management:
- View all email monitoring jobs
- Search and filter jobs
- Import from PowerShell XML configuration
- Export back to PowerShell XML

### Deals Management:
- View all deal/keyword mappings
- Search by deal name, keyword, or servicer ID
- Import from CSV file
- Export to CSV

## 🛠️ Development Commands

### Backend:
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Start production server
```

### Frontend:
```bash
cd client
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Error:**
   - Verify MySQL is running
   - Check credentials in `.env` file
   - Ensure `world` database exists

2. **Port Already in Use:**
   - Backend (3001): Change `PORT` in `.env`
   - Frontend (3000): Will automatically try 3001, 3002, etc.

3. **Import Failures:**
   - Verify `outlook.ps1` and `tblExternalDIDRef.csv` are in project root
   - Check file permissions
   - Review error messages in browser console

4. **TypeScript Errors:**
   - Run `npm install` in both root and `client` directories
   - Restart your IDE/editor

## 🔧 Configuration

### Environment Variables:
- `PORT`: Backend server port (default: 3001)
- `DB_*`: Database connection settings
- `POWERSHELL_SCRIPT_PATH`: Path to PowerShell configuration file
- `API_PREFIX`: API URL prefix (default: /api/v1)

### Customization:
- **Styling**: Modify `client/src/index.css`
- **API Endpoints**: Extend `src/routes/` files
- **Database Schema**: Modify table creation in `src/config/database.ts`

## 📊 Testing the Prototype

### Recommended Testing Flow:

1. **Start with Dashboard**
   - Verify UI loads correctly
   - Check statistics display

2. **Import Data**
   - Import PowerShell jobs first
   - Then import CSV deals
   - Verify data appears in dashboard

3. **Test CRUD Operations**
   - Create a new job
   - Edit an existing deal
   - Delete test data

4. **Test Export**
   - Export jobs to XML
   - Export deals to CSV
   - Verify file contents

## 🎯 Demo Scenarios

### For IT Team:
1. Show backend API endpoints working
2. Demonstrate data import/export
3. Show database integration
4. Explain security considerations

### For Business Users:
1. Start with dashboard overview
2. Show job management interface
3. Demonstrate search and filtering
4. Show import/export capabilities

## 🔐 Security Notes (Prototype Only)

**⚠️ This is a prototype - do not use in production without:**
- User authentication
- Input sanitization enhancements
- File upload security
- Network security configuration
- Audit logging
- Data encryption

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify all dependencies are installed
4. Ensure MySQL is running and accessible

---

**Success!** You now have a fully functional FRP management prototype running locally. 