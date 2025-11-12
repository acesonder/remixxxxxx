# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Modules

### Module Management

#### Get All Modules
```
GET /modules
```

#### Enable Module
```
POST /modules/:moduleId/enable
```

#### Disable Module
```
POST /modules/:moduleId/disable
```

#### Configure Module
```
POST /modules/:moduleId/configure
Body: { configuration object }
```

## Authentication Module

### Register
```
POST /auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```
POST /auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Current User
```
GET /auth/me
Requires: Authentication
```

### Forgot Password
```
POST /auth/forgot-password
Body: {
  "email": "user@example.com"
}
```

### Reset Password
```
POST /auth/reset-password
Body: {
  "token": "reset-token",
  "newPassword": "newpassword123"
}
```

## Messaging Module

### Create Conversation
```
POST /messaging/conversations
Body: {
  "participants": ["userId1", "userId2"],
  "title": "Conversation Title"
}
```

### Get Conversations
```
GET /messaging/conversations
```

### Get Messages
```
GET /messaging/conversations/:conversationId/messages
```

### Send Message
```
POST /messaging/conversations/:conversationId/messages
Body: {
  "content": "Message text"
}
```

### Get Inbox Summary
```
GET /messaging/inbox
```

## Notifications Module

### Get Notifications
```
GET /notifications?unreadOnly=true
```

### Create Notification
```
POST /notifications
Body: {
  "userId": "user-id",
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info|success|warning|error",
  "module": "module-name"
}
```

### Mark as Read
```
PATCH /notifications/:notificationId/read
```

### Get Badge Counts
```
GET /notifications/badges
```

## Consent Module

### Get Templates
```
GET /consent/templates
```

### Accept Consent
```
POST /consent/accept
Body: {
  "templateId": "template-id"
}
```

### Get Consent Status
```
GET /consent/status
```

## Dashboard Module

### Get Dashboard
```
GET /dashboard
```

### Update Layout
```
PUT /dashboard/layout
Body: {
  "layout": [...]
}
```

### Add Widget
```
POST /dashboard/widgets/:widgetId
Body: {
  "position": {...},
  "config": {...}
}
```

### Get Widget Data
```
GET /dashboard/widgets/:widgetId/data
```

## UI Configuration Module

### Get Themes
```
GET /ui-config/themes
```

### Set Theme
```
PUT /ui-config/theme
Body: {
  "themeId": "light|dark|high-contrast",
  "customizations": {...}
}
```

### Get Layouts
```
GET /ui-config/layouts
```

### Get Effects
```
GET /ui-config/effects
```

## Assessment Module

### Get Forms
```
GET /assessment/forms?category=intake&active=true
```

### Create Form
```
POST /assessment/forms
Body: {
  "name": "Form Name",
  "description": "Form description",
  "category": "intake",
  "fields": [...]
}
```

### Submit Response
```
POST /assessment/responses
Body: {
  "formId": "form-id",
  "responses": {...}
}
```

### Get Responses
```
GET /assessment/responses?formId=form-id
```

### Get Statistics
```
GET /assessment/statistics
```

## Homelessness Module

### Create Case
```
POST /homelessness/cases
Body: {
  "clientName": "Client Name",
  "age": 30,
  "location": "Location",
  "notes": "Case notes"
}
```

### Get Cases
```
GET /homelessness/cases?status=active
```

### Update Case
```
PUT /homelessness/cases/:caseId
Body: { update fields }
```

### Log Outreach
```
POST /homelessness/outreach
Body: {
  "caseId": "optional-case-id",
  "location": "Location",
  "activity": "Activity description",
  "contactsMade": 5
}
```

### Get Resources
```
GET /homelessness/resources?type=shelter
```

### Get Statistics
```
GET /homelessness/statistics
```

## Addiction Module

### Create Recovery Plan
```
POST /addiction/recovery-plans
Body: {
  "goals": [...],
  "startDate": "2024-01-01",
  "supportSystem": [...],
  "triggers": [...],
  "copingStrategies": [...]
}
```

### Get Recovery Plans
```
GET /addiction/recovery-plans
```

### Daily Check-in
```
POST /addiction/check-ins
Body: {
  "moodRating": 7,
  "cravingLevel": 3,
  "notes": "Today's notes"
}
```

### Get Support Groups
```
GET /addiction/support-groups?type=AA&virtual=true
```

### Get Crisis Resources
```
GET /addiction/crisis-resources
```

### Emergency Alert
```
POST /addiction/emergency-alert
Body: {
  "message": "Emergency message"
}
```

### Get Statistics
```
GET /addiction/statistics
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Error message",
  "errors": [...]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!",
  "message": "Error details"
}
```
