# RemiXXXXXX - Modular Web Platform

A comprehensive, modular web platform that allows you to manage, add, and remove different system modules through configuration. Built with Node.js, Express, React, and Socket.IO.

## Features

### Core Module Management
- **Dynamic Module System**: Enable/disable modules on the fly
- **Module Configuration**: Customize each module's settings
- **Dependency Management**: Automatic handling of module dependencies

### Available Modules

#### 1. Authentication Module
- User registration with email verification
- Secure login/logout
- Password recovery and reset
- JWT-based authentication
- Profile management

#### 2. Messaging Module
- Real-time instant messaging
- Conversation management
- Message inbox
- Unread message tracking
- WebSocket support for live updates

#### 3. Notifications Module
- Push notifications
- In-app notifications
- Badge counters
- Notification preferences
- Multi-channel delivery (push, email)

#### 4. Consent Agreement Module
- Consent template management
- Version control for agreements
- User consent tracking
- Terms of service
- Privacy policy management

#### 5. Dashboard Module
- Configurable dashboards
- Widget system
- Custom layouts
- Data visualization
- Drag-and-drop widget placement

#### 6. UI/UX Configuration Module
- Theme configurator (light, dark, high-contrast)
- Custom color schemes
- Layout options
- Visual effects control
- Accessibility features

#### 7. Assessment Intake System
- Form builder
- Custom intake workflows
- Response management
- Data validation
- Assessment tracking and statistics

#### 8. Homelessness Outreach Tools
- Case management
- Client tracking
- Resource database
- Outreach activity logging
- Reporting and statistics

#### 9. Addiction Tools Module
- Recovery plan management
- Daily check-ins
- Support group directory
- Crisis resources
- Progress tracking and streaks
- Emergency alert system

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time updates

## Installation

### Prerequisites
- Node.js 16+ and npm

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/acesonder/remixxxxxx.git
cd remixxxxxx
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=5000
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
```

5. Start the backend server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### Running Full Stack

From the root directory, run both backend and frontend concurrently:
```bash
npm run dev:full
```

## Usage

### Accessing the Platform

1. Open your browser and navigate to `http://localhost:3000`
2. Register a new account or login with existing credentials
3. Navigate to the Module Manager to enable/disable modules
4. Access enabled modules from the sidebar navigation

### Module Management

1. Go to the **Modules** page from the sidebar
2. View all available modules with their descriptions and features
3. Click **Enable** or **Disable** to toggle module availability
4. Modules with dependencies will require those dependencies to be enabled first

### API Documentation

Comprehensive API documentation is available in `/docs/API.md`. The API includes endpoints for:
- Authentication
- Module management
- Messaging
- Notifications
- Assessments
- Case management
- And more...

## Project Structure

```
remixxxxxx/
├── backend/
│   ├── config/          # Configuration files
│   ├── modules/         # Module implementations
│   │   ├── auth/        # Authentication module
│   │   ├── messaging/   # Messaging module
│   │   ├── notifications/ # Notifications module
│   │   ├── consent/     # Consent module
│   │   ├── dashboard/   # Dashboard module
│   │   ├── ui-config/   # UI configuration module
│   │   ├── assessment/  # Assessment module
│   │   ├── homelessness/ # Homelessness outreach module
│   │   ├── addiction/   # Addiction tools module
│   │   └── moduleManager.js # Module management core
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       ├── contexts/    # React contexts
│       ├── utils/       # Utilities
│       └── App.js       # Main app component
├── docs/
│   └── API.md          # API documentation
├── .env.example        # Example environment variables
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api/modules` - Get all modules
- `POST /api/modules/:id/enable` - Enable module
- `POST /api/modules/:id/disable` - Disable module
- `POST /api/modules/:id/configure` - Configure module

### Module-Specific Endpoints
Each module provides its own set of endpoints under `/api/{module-name}`. See `/docs/API.md` for complete documentation.

## Development

### Adding a New Module

1. Create a new directory in `backend/modules/`
2. Implement an `index.js` file that exports a function accepting `(io, moduleManager)`
3. Register the module in `moduleManager.js`
4. The module will automatically be loaded on server start

Example module structure:
```javascript
const express = require('express');
const router = express.Router();

module.exports = (io, moduleManager) => {
  // Define routes
  router.get('/', (req, res) => {
    res.json({ message: 'Module endpoint' });
  });

  return router;
};
```

## Security

- JWT authentication for protected routes
- Password hashing with bcryptjs
- Input validation with express-validator
- CORS configuration
- Environment-based secrets

**Important**: Change the `JWT_SECRET` in production!

## Database

Currently using in-memory storage for development. For production:
- Uncomment MongoDB configuration in `.env`
- Implement database models
- Replace Map-based storage with database queries

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Roadmap

- [ ] Database integration (MongoDB)
- [ ] Email service integration
- [ ] Advanced user roles and permissions
- [ ] Module marketplace
- [ ] Plugin system
- [ ] Mobile app support
- [ ] Advanced analytics
- [ ] Export/import functionality
- [ ] Multi-language support
- [ ] Advanced reporting tools
