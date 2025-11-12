# Platform Architecture

## Overview

RemiXXXXXX is built as a modular web platform where each feature is implemented as an independent, pluggable module. This architecture allows for flexible system configuration where modules can be enabled, disabled, or configured without affecting the core platform.

## Architecture Principles

### 1. Modularity
Each feature is isolated in its own module with clear boundaries and interfaces.

### 2. Dependency Management
Modules can declare dependencies on other modules, ensuring proper initialization order.

### 3. Loose Coupling
Modules communicate through well-defined APIs and events, not direct imports.

### 4. Scalability
The architecture supports adding new modules without modifying existing code.

## System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐   │
│  │   Pages    │  │ Components │  │    Contexts     │   │
│  │  - Login   │  │  - Layout  │  │  - AuthContext  │   │
│  │  - Dashboard│  │  - Widgets │  │                 │   │
│  │  - Modules │  │            │  │                 │   │
│  └────────────┘  └────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                    HTTP / WebSocket
                         │
┌─────────────────────────────────────────────────────────┐
│                   Backend (Node.js)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Module Manager                      │   │
│  │  - Module Registry                               │   │
│  │  - Dependency Resolution                         │   │
│  │  - Lifecycle Management                          │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                                │
│  ┌──────────┬──────────┴──────────┬──────────────┐     │
│  │  Module  │   Module  │  Module │    Module    │     │
│  │   Auth   │ Messaging │ Notif.  │   Dashboard  │ ... │
│  └──────────┴───────────┴─────────┴──────────────┘     │
│                         │                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Storage Layer                       │   │
│  │  (Currently: In-Memory Maps)                     │   │
│  │  (Future: MongoDB/PostgreSQL)                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Module Structure

### Backend Module Anatomy

Each module follows this structure:

```javascript
// backend/modules/{module-name}/index.js

const express = require('express');
const router = express.Router();

module.exports = (io, moduleManager) => {
  // Module initialization code
  
  // Define routes
  router.get('/endpoint', authenticateToken, (req, res) => {
    // Handle request
  });
  
  // Socket.IO handlers (if needed)
  io.on('connection', (socket) => {
    // Handle real-time events
  });
  
  return router;
};
```

### Module Definition

Modules are registered in `moduleManager.js`:

```javascript
{
  id: 'module-id',
  name: 'Module Name',
  description: 'What this module does',
  enabled: true,
  version: '1.0.0',
  features: ['feature1', 'feature2'],
  dependencies: ['required-module-id']
}
```

## Core Systems

### 1. Module Manager

**Location:** `backend/modules/moduleManager.js`

**Responsibilities:**
- Load and register modules
- Manage module state (enabled/disabled)
- Resolve dependencies
- Initialize module routes
- Handle module configuration

**Key Methods:**
```javascript
- getAllModules()        // Get all registered modules
- getEnabledModules()    // Get only enabled modules
- enableModule(id)       // Enable a module
- disableModule(id)      // Disable a module
- configureModule(id, config) // Update module configuration
- initializeModules(app, io)  // Initialize all enabled modules
```

### 2. Authentication System

**Location:** `backend/modules/auth/`

**Features:**
- JWT-based authentication
- Password hashing with bcryptjs
- User registration and login
- Password reset flow
- Token validation middleware

**Middleware Export:**
```javascript
const { authenticateToken } = require('../auth');
```

### 3. Real-Time Communication

**Technology:** Socket.IO

**Usage:**
- Real-time messaging
- Live notifications
- Presence tracking
- Event broadcasting

**Implementation:**
```javascript
io.on('connection', (socket) => {
  socket.on('event', (data) => {
    // Handle event
    io.emit('response', result);
  });
});
```

### 4. Data Storage

**Current:** In-Memory Maps (Development)
**Future:** MongoDB/PostgreSQL (Production)

**Structure:**
```javascript
const data = new Map();
data.set(key, value);
data.get(key);
data.has(key);
data.delete(key);
```

## Request Flow

### HTTP Request Flow

```
1. Client Request
   └─> Express Middleware (CORS, Body Parser)
       └─> Route Handler
           └─> Authentication Middleware (if protected)
               └─> Module Business Logic
                   └─> Data Layer
                       └─> Response
```

### WebSocket Flow

```
1. Client Connection
   └─> Socket.IO Server
       └─> Connection Handler
           └─> Event Listeners
               └─> Business Logic
                   └─> Emit to Client(s)
```

## Module Dependencies

### Dependency Graph

```
Authentication (auth)
├─> Messaging
├─> Notifications
├─> Consent
├─> Dashboard
├─> Assessment
│   ├─> Homelessness
│   └─> Addiction
└─> UI Configuration (independent)
```

### Dependency Rules

1. A module cannot be disabled if other enabled modules depend on it
2. A module cannot be enabled if its dependencies are disabled
3. The Module Manager enforces these rules automatically

## API Architecture

### RESTful Design

All modules follow REST principles:

- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT/PATCH` - Update resources
- `DELETE` - Remove resources

### URL Structure

```
/api/{module}/{resource}/{id?}/{action?}

Examples:
- GET    /api/auth/me
- POST   /api/messaging/conversations
- GET    /api/assessment/forms
- POST   /api/addiction/check-ins
```

### Response Format

Success:
```json
{
  "data": { },
  "message": "Success message"
}
```

Error:
```json
{
  "error": "Error message",
  "errors": [ ]
}
```

## Security Architecture

### Authentication Flow

```
1. User Registration/Login
   └─> Credentials Validation
       └─> Password Hashing (bcryptjs)
           └─> JWT Generation
               └─> Token to Client

2. Protected Request
   └─> JWT from Authorization Header
       └─> Token Verification
           └─> User Context Added to Request
               └─> Route Handler
```

### Security Measures

1. **Password Security**
   - Passwords hashed with bcryptjs (10 rounds)
   - Never stored in plain text
   - Not returned in API responses

2. **JWT Tokens**
   - Signed with secret key
   - 24-hour expiration
   - Contains minimal user data

3. **Input Validation**
   - Express-validator for all inputs
   - Type checking
   - Required field validation
   - Custom validators

4. **CORS**
   - Configured for specific origins
   - Credentials support
   - Methods whitelisting

## Frontend Architecture

### Component Structure

```
src/
├── components/       # Reusable UI components
│   └── Layout.js     # Main layout wrapper
├── pages/            # Page-level components
│   ├── Login.js
│   ├── Dashboard.js
│   └── ModuleManager.js
├── contexts/         # React contexts
│   └── AuthContext.js
├── utils/            # Utility functions
└── App.js            # Root component
```

### State Management

- **Local State:** React useState for component state
- **Global State:** React Context for auth and shared data
- **Server State:** Axios for API calls

### Routing

React Router v6 for client-side routing:

```javascript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
  <Route path="/modules" element={<PrivateRoute><ModuleManager /></PrivateRoute>} />
</Routes>
```

## Scalability Considerations

### Current Architecture (Development)

- In-memory storage
- Single server process
- No load balancing
- Direct Socket.IO connections

### Production Architecture (Recommended)

1. **Database Layer**
   ```
   MongoDB or PostgreSQL
   ├─> Connection pooling
   ├─> Indexing for performance
   └─> Backup and replication
   ```

2. **Horizontal Scaling**
   ```
   Load Balancer
   ├─> App Server 1
   ├─> App Server 2
   └─> App Server N
   ```

3. **Socket.IO Scaling**
   ```
   Redis Adapter
   ├─> Shared session store
   └─> Message broadcasting across servers
   ```

4. **Caching Layer**
   ```
   Redis/Memcached
   ├─> Session storage
   ├─> Frequently accessed data
   └─> Rate limiting
   ```

## Adding a New Module

### Step 1: Create Module Directory

```bash
mkdir -p backend/modules/new-module
```

### Step 2: Implement Module

```javascript
// backend/modules/new-module/index.js
const express = require('express');
const router = express.Router();

module.exports = (io, moduleManager) => {
  const { authenticateToken } = require('../auth');
  
  router.get('/', authenticateToken, (req, res) => {
    res.json({ message: 'New module endpoint' });
  });
  
  return router;
};
```

### Step 3: Register Module

```javascript
// In moduleManager.js
{
  id: 'new-module',
  name: 'New Module',
  description: 'Module description',
  enabled: true,
  version: '1.0.0',
  features: ['feature1'],
  dependencies: ['auth']
}
```

### Step 4: Restart Server

The module will be automatically loaded and routes registered.

## Performance Optimization

### Current Optimizations

1. **Efficient Data Structures:** Using Maps for O(1) lookups
2. **Lazy Loading:** Modules only loaded when enabled
3. **Middleware Caching:** Express middleware pipeline optimization

### Future Optimizations

1. **Database Indexing:** Add indexes on frequently queried fields
2. **API Response Caching:** Cache GET responses
3. **CDN for Static Assets:** Serve frontend from CDN
4. **Code Splitting:** Lazy load frontend modules
5. **WebSocket Compression:** Enable Socket.IO compression

## Monitoring and Logging

### Recommended Tools

- **Application Monitoring:** New Relic, DataDog
- **Error Tracking:** Sentry
- **Logging:** Winston, Morgan
- **Analytics:** Google Analytics, Mixpanel

### Key Metrics

- Response time per endpoint
- Module enable/disable events
- User registration/login rates
- WebSocket connection count
- Error rates by module

## Testing Strategy

### Unit Tests
Test individual functions and components

### Integration Tests
Test module interactions and API endpoints

### End-to-End Tests
Test complete user workflows

### Recommended Tools
- Jest (Unit/Integration)
- Supertest (API testing)
- React Testing Library (Frontend)
- Cypress (E2E)

## Deployment Architecture

### Development
```
Local Machine
├─> Backend: localhost:5000
└─> Frontend: localhost:3000
```

### Production
```
Domain: example.com
├─> Frontend: CDN or Static Host
│   └─> React Build
└─> Backend: Cloud Server(s)
    ├─> Load Balancer
    ├─> App Servers
    └─> Database
```

## Summary

This architecture provides:

- ✅ Modularity and flexibility
- ✅ Clear separation of concerns
- ✅ Scalability path from development to production
- ✅ Security best practices
- ✅ Real-time capabilities
- ✅ Developer-friendly structure
- ✅ Easy module addition/removal

The design balances simplicity for development with extensibility for production needs.
