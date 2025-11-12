# Quick Start Guide

Get your platform up and running in 5 minutes.

## Prerequisites

- Node.js v14 or higher
- MongoDB v4.4 or higher (optional for demo)
- npm or yarn

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/acesonder/remixxxxxx.git
cd remixxxxxx
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/remixxxxxx
JWT_SECRET=your_random_secret_key_here
JWT_EXPIRE=7d
```

**Note:** The platform can run without MongoDB for testing purposes.

### 4. Start the Application

**Option A: Run everything at once (recommended for development)**

```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 3000).

**Option B: Run separately**

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run client
```

## First Time Setup

### 1. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### 2. Create Admin Account

1. Click "Create Account" on the login page
2. Fill in your details:
   - First Name
   - Last Name
   - Email
   - Password (min 6 characters)
   - Select Role: **Admin** (for first user)
3. Click "Create Account"

### 3. Access Dashboard

After registration, you'll be redirected to the dashboard. You'll see:
- Module cards for enabled features
- Admin Tools section (only for admin users)

### 4. Configure Modules

1. Click "Configure Modules" in Admin Tools
2. Browse through the three tabs:
   - **Modules**: Enable/disable features
   - **Branding**: Customize appearance
   - **Layout**: Configure layout options
3. Make your desired changes
4. Click "Save Configuration"

## Common Use Cases

### Scenario 1: Social Services Organization

Enable these modules:
- ✅ Authentication
- ✅ Communication
- ✅ Case Management
- ✅ Assessment & Intake
- ✅ VI-SPDAT
- ✅ Homelessness Outreach
- ✅ Resource Sharing
- ✅ Incident Reporting

### Scenario 2: Mental Health Clinic

Enable these modules:
- ✅ Authentication
- ✅ User Management
- ✅ Mental Health Tools
- ✅ Assessment & Intake
- ✅ Case Management
- ✅ Communication

### Scenario 3: Shelter Management

Enable these modules:
- ✅ Authentication
- ✅ Shelter Tools
- ✅ Case Management
- ✅ Incident Reporting
- ✅ Communication
- ✅ Resource Sharing

### Scenario 4: Addiction Recovery Center

Enable these modules:
- ✅ Authentication
- ✅ Addiction Tools
- ✅ Assessment & Intake
- ✅ Case Management
- ✅ Communication
- ✅ Resource Sharing

## Testing the Platform

### Create Test Users

1. Create users with different roles:
   - Admin
   - Staff
   - Worker
   - Service Provider
   - Client

2. Log in as each role to see different access levels

### Test Communication

1. Send messages between users
2. Create notifications
3. Test real-time chat (requires Socket.IO connection)

### Test Case Management

1. Create a case
2. Add notes and goals
3. Assign team members
4. Track progress

### Test Assessments

1. Create an assessment
2. Fill in responses
3. View assessment history
4. Generate reports

## Production Deployment

### 1. Build Frontend

```bash
cd client
npm run build
```

This creates optimized production files in `client/build/`.

### 2. Set Production Environment

Update `.env`:
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=strong_random_secret
```

### 3. Start Production Server

```bash
npm start
```

### 4. Serve Frontend

Option A - Using Node.js:
```bash
npm install -g serve
serve -s client/build -p 3000
```

Option B - Using Nginx:
Configure Nginx to serve `client/build` directory and proxy API requests to port 5000.

## Troubleshooting

### Port Already in Use

If port 5000 or 3000 is already in use:

```bash
# Change port in .env
PORT=5001

# Or kill the process using the port (Linux/Mac)
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Error

If you don't have MongoDB installed:
- The platform will run without database (useful for testing UI)
- Install MongoDB: https://docs.mongodb.com/manual/installation/
- Or use MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas

### Module Configuration Not Saving

Requires MongoDB connection. Either:
- Install MongoDB locally
- Use MongoDB Atlas cloud service
- Configuration will work once database is connected

### Frontend Not Connecting to Backend

Check that:
- Backend is running on port 5000
- `REACT_APP_API_URL` in `client/.env` points to backend
- CORS is enabled (already configured)

### Build Errors

Clear cache and reinstall:
```bash
# Backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd client
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Customize Branding**
   - Upload your logo
   - Set your brand colors
   - Update company name

2. **Configure Modules**
   - Enable only needed features
   - Set up module-specific settings

3. **Create Users**
   - Add staff and workers
   - Set up client accounts
   - Configure roles and permissions

4. **Import Data**
   - Use API to import existing data
   - Set up integrations
   - Configure external services

5. **Train Staff**
   - Create user documentation
   - Set up training sessions
   - Establish workflows

## Useful Commands

```bash
# Development
npm run dev          # Run both backend and frontend
npm run server       # Run backend only
npm run client       # Run frontend only

# Production
npm run build        # Build frontend for production
npm start            # Start backend server

# Testing
npm test            # Run tests (when implemented)

# Utilities
npm run install-all  # Install all dependencies
```

## Support Resources

- **README.md** - Technical overview and setup
- **FEATURES.md** - Complete feature list
- **CONFIGURATION_GUIDE.md** - Detailed configuration instructions
- **API Documentation** - See README.md API Endpoints section

## Default Credentials

For testing purposes, create an admin account on first run. The system does not come with default credentials for security reasons.

## Security Notes

- Change JWT_SECRET to a strong random string
- Use HTTPS in production
- Enable two-factor authentication for sensitive data
- Regular security audits recommended
- Keep dependencies updated

## Getting Help

If you encounter issues:
1. Check the troubleshooting section
2. Review error messages in console
3. Check server logs
4. Verify all dependencies are installed
5. Ensure ports are not blocked

Happy building! 🚀
