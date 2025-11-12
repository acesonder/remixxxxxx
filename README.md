# Modular Web Platform for Social Services Management

A comprehensive, configurable web platform designed for managing social services, case management, assessments, and client engagement. The platform features a modular architecture that allows organizations to enable/disable features based on their specific needs.

## Features

### 🔐 Authentication & User Management
- User registration and login
- Forgot password functionality
- Role-based access control (Admin, Staff, Worker, Service Provider, Client)
- User profile management
- Friends/connections system

### 💬 Communication Modules
- Inbox and messaging system
- Real-time instant messaging
- Push notifications
- In-app notifications
- Email notifications (configurable)
- Real-time chat
- Real-time video chat support
- Group chat functionality
- File sharing in messages

### 📋 Case Management
- Client case tracking
- Case notes and documentation
- Goal setting and action plans
- Progress monitoring
- Team collaboration
- Location sharing for field work
- Document management
- Case assignment system

### 📝 Assessment & Intake Systems
- General intake assessments
- Custom form builder
- VI-SPDAT assessments (Individual, Family, Youth)
- Mental health diagnostic tools
- Substance use assessments
- Assessment history and reporting
- Automated scoring

### 🏠 Specialized Tools
- **Homelessness Outreach**: Client tracking, location mapping, outreach scheduling
- **Addiction Support**: Recovery planning, progress tracking, relapse prevention
- **Mental Health**: Treatment planning, symptom tracking, medication management
- **Shelter Management**: Bed management, check-in/out, occupancy tracking, waitlist management

### ⚠️ Incident Reporting
- Incident logging and tracking
- Severity classification
- Photo attachments
- Follow-up action tracking
- Incident reports

### 📚 Resource Sharing
- Resource library
- Document sharing with version control
- Category-based organization
- Access control by role
- Search and filtering

### 🎨 Customization & Branding
- Theme configurator
- Company logo and branding
- Color scheme customization
- Layout configuration
- Dark mode support
- Icon and label customization

### 🏆 Badges & Gamification
- Achievement badges
- Progress tracking badges
- Custom badge system

### ⚙️ Settings & Configuration
- User preferences
- Notification preferences
- Privacy settings
- Security settings
- Data export functionality
- Advanced settings for administrators

## Technology Stack

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time features
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **Socket.IO Client** for real-time features
- **React Icons** for UI icons

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/acesonder/remixxxxxx.git
cd remixxxxxx
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

5. Update the `.env` file with your configuration:
```
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/remixxxxxx
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

6. Start MongoDB (if running locally):
```bash
mongod
```

## Running the Application

### Development Mode

Run both backend and frontend concurrently:
```bash
npm run dev
```

Or run them separately:

Backend:
```bash
npm run server
```

Frontend (in a separate terminal):
```bash
npm run client
```

### Production Mode

1. Build the frontend:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Module Configuration

Administrators can configure which modules and features are enabled through the admin panel:

1. Log in as an admin user
2. Navigate to "Configure Modules" from the dashboard
3. Toggle modules and features on/off as needed
4. Customize branding (logo, colors, company name)
5. Configure layout preferences
6. Save configuration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Forgot password
- `GET /api/auth/me` - Get current user

### Modules
- `GET /api/modules` - Get module configuration
- `PUT /api/modules` - Update module configuration (admin only)
- `PATCH /api/modules/:moduleName` - Update specific module (admin only)

### Users
- `GET /api/users` - Get all users (staff/admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/friends` - Add friend
- `DELETE /api/users/:id/friends/:friendId` - Remove friend

### Messages
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/:conversationId` - Get messages in conversation
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark message as read

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Assessments
- `GET /api/assessments` - Get assessments
- `GET /api/assessments/:id` - Get assessment by ID
- `POST /api/assessments` - Create assessment
- `PUT /api/assessments/:id` - Update assessment

### Case Management
- `GET /api/case-management` - Get cases
- `GET /api/case-management/:id` - Get case by ID
- `POST /api/case-management` - Create case
- `PUT /api/case-management/:id` - Update case
- `POST /api/case-management/:id/notes` - Add note to case

### Resources
- `GET /api/resources` - Get resources
- `GET /api/resources/:id` - Get resource by ID
- `POST /api/resources` - Create resource
- `PUT /api/resources/:id` - Update resource

### Settings
- `GET /api/settings/user` - Get user settings
- `PUT /api/settings/user` - Update user settings
- `PATCH /api/settings/theme` - Update theme
- `GET /api/settings/export` - Export user data

## User Roles

- **Admin**: Full system access, can configure modules and manage all users
- **Staff**: Access to most features, can manage clients and cases
- **Worker**: Field workers with access to case management and assessments
- **Service Provider**: External service providers with limited access
- **Client**: End users receiving services

## Real-time Features

The platform uses Socket.IO for real-time functionality:
- Instant messaging
- Live notifications
- Location sharing updates
- Video chat signaling

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control
- Secure API endpoints with middleware protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
