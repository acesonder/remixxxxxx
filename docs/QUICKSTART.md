# Quick Start Guide

This guide will help you get the RemiXXXXXX platform up and running in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm (comes with Node.js)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file if needed (defaults work for local development).

### Step 3: Start the Platform

#### Option A: Run Backend and Frontend Separately

Terminal 1 (Backend):
```bash
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

#### Option B: Run Both Together

```bash
npm run dev:full
```

### Step 4: Access the Platform

Open your browser and navigate to:
```
http://localhost:3000
```

## First Time Setup

### 1. Create Your Account

1. Click "Sign Up" on the login page
2. Fill in your details:
   - Username (minimum 3 characters)
   - Email address
   - Password (minimum 6 characters)
   - First and Last name (optional)
3. Click "Sign Up"

You'll be automatically logged in after registration.

### 2. Explore the Dashboard

After logging in, you'll see the main dashboard with:
- System statistics
- Available modules
- Quick actions
- System information

### 3. Manage Modules

1. Click on "Modules" in the sidebar
2. View all available modules
3. Enable or disable modules as needed
4. Note: Some modules depend on others (e.g., Messaging requires Authentication)

## Available Modules

### 1. **Authentication** (Always Enabled)
- User registration and login
- Password recovery
- Profile management

**Quick Test:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. **Messaging**
- Real-time chat
- Conversation management
- Message inbox

**Access:** Click "Messaging" in sidebar

### 3. **Notifications**
- Push notifications
- In-app alerts
- Badge counters

**Access:** Click "Notifications" in sidebar

### 4. **Consent Agreement**
- Terms of service
- Privacy policy
- Consent tracking

**API Endpoint:** `/api/consent/templates`

### 5. **Dashboard**
- Customizable widgets
- Data visualization
- Personal dashboard

**Already viewing it!**

### 6. **UI/UX Configuration**
- Theme selection
- Layout customization
- Accessibility settings

**API Endpoint:** `/api/ui-config/themes`

### 7. **Assessment Intake**
- Form builder
- Data collection
- Response management

**Access:** Click "Assessment" in sidebar

### 8. **Homelessness Outreach**
- Case management
- Resource tracking
- Outreach logging

**API Endpoint:** `/api/homelessness/cases`

### 9. **Addiction Tools**
- Recovery planning
- Daily check-ins
- Support groups
- Crisis resources

**API Endpoint:** `/api/addiction/recovery-plans`

## Common Tasks

### Test the API

```bash
# Check server health
curl http://localhost:5000/health

# Get all modules
curl http://localhost:5000/api/modules

# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","username":"testuser"}'
```

### Enable/Disable a Module

Via API:
```bash
# Enable a module
curl -X POST http://localhost:5000/api/modules/messaging/enable

# Disable a module
curl -X POST http://localhost:5000/api/modules/messaging/disable
```

Via UI:
1. Go to "Modules" page
2. Click "Enable" or "Disable" button on any module card

### View API Documentation

All API endpoints are documented in `/docs/API.md`

You can also test endpoints using tools like:
- Postman
- Insomnia
- curl
- HTTPie

## Troubleshooting

### Port Already in Use

If port 5000 or 3000 is already in use:

1. Edit `.env` and change `PORT=5000` to another port
2. Update frontend API URL in `frontend/src/contexts/AuthContext.js`

### Module Won't Enable

Check if required dependencies are enabled:
```bash
curl http://localhost:5000/api/modules
```

Look for the `dependencies` array for each module.

### Cannot Connect to API

1. Ensure backend server is running (`npm run dev`)
2. Check console for errors
3. Verify the port in `.env` matches the server output
4. Check CORS settings if accessing from a different domain

## Next Steps

1. **Read the Full Documentation:** Check `/docs/API.md` for complete API reference
2. **Customize Your Platform:** Enable only the modules you need
3. **Integrate Database:** Replace in-memory storage with MongoDB for production
4. **Add Security:** Update JWT_SECRET in `.env` to a secure random string
5. **Deploy:** Consider deploying to platforms like Heroku, DigitalOcean, or AWS

## Getting Help

- Check the main `README.md` for detailed information
- Review API documentation in `/docs/API.md`
- Open an issue on GitHub for bugs or feature requests

## Production Deployment Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Set `NODE_ENV=production`
- [ ] Configure a real database (MongoDB)
- [ ] Set up proper email service for password reset
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up logging and monitoring
- [ ] Review and update security settings
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

## Development Tips

### Hot Reload

The development servers support hot reload:
- Backend: Uses `nodemon` to restart on file changes
- Frontend: React development server automatically reloads

### Add a Custom Module

1. Create a new folder in `backend/modules/your-module`
2. Create an `index.js` file with your routes
3. Register in `backend/modules/moduleManager.js`
4. Restart the server

### Customize the Frontend

All React components are in `frontend/src/`:
- `pages/` - Main page components
- `components/` - Reusable components
- `contexts/` - React contexts (Auth, etc.)

### API Testing

Use the included curl commands or create a Postman collection:

```bash
# Save your auth token
TOKEN="your-jwt-token-here"

# Make authenticated requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/auth/me
```

## Resources

- Main README: `/README.md`
- API Documentation: `/docs/API.md`
- Example Environment: `.env.example`

Happy coding! 🚀
