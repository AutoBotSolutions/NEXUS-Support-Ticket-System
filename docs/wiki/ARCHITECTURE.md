# NEXUS Architecture Documentation

This document provides an in-depth overview of NEXUS Support System architecture and design decisions.

## System Overview

NEXUS is a full-stack web application that provides ticket management capabilities with GitHub integration.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                    (Static HTML/CSS/JS)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer                            │
│                    (Express.js Application)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Middleware │  │   Routes     │  │ Controllers  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ Mongoose
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│                    (MongoDB)                                 │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Tickets    │  │    Users     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│                    (GitHub API)                              │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT + bcrypt
- **HTTP Client**: Axios
- **Security**: Helmet, CORS, express-rate-limit

### Frontend

- **Technology**: Vanilla HTML5, CSS3, JavaScript
- **No Framework**: Lightweight, no build step required
- **Theme**: Custom sci-fi theme with CSS

### Infrastructure

- **Process Manager**: PM2 (production)
- **Reverse Proxy**: Nginx (production)
- **SSL**: Let's Encrypt (production)

## Component Architecture

### Server (server.js)

**Responsibilities:**
- Express application initialization
- Middleware configuration
- Route registration
- Error handling
- Server startup

**Key Components:**
```javascript
- Database connection
- Security middleware (Helmet, CORS)
- Rate limiting
- Static file serving
- API routes
- Error handling middleware
```

### Controllers Layer

**Purpose:** Business logic and request/response handling

**Controllers:**
1. **ticketController.js**
   - Create, read, update, delete tickets
   - Add comments to tickets
   - Link tickets to GitHub issues

2. **githubController.js**
   - Process GitHub webhooks
   - Sync tickets to GitHub
   - Handle GitHub events

3. **userController.js**
   - User registration
   - User login
   - Get current user profile

**Design Pattern:** Each controller handles CRUD operations for a specific resource.

### Models Layer

**Purpose:** Data structure definition and validation

**Models:**
1. **Ticket.js**
   - Ticket schema with GitHub integration fields
   - Pre-save hooks for timestamps
   - Validation rules

2. **User.js**
   - User schema with authentication fields
   - Password hashing (handled in controller)

**Design Pattern:** Mongoose schemas with built-in validation.

### Routes Layer

**Purpose:** API endpoint definitions and routing

**Route Files:**
1. **ticketRoutes.js** - `/api/tickets` endpoints
2. **githubRoutes.js** - `/api/github` endpoints
3. **userRoutes.js** - `/api/users` endpoints

**Design Pattern:** RESTful API design with resource-based routing.

### Middleware Layer

**Purpose:** Cross-cutting concerns

**Middleware:**
1. **auth.js**
   - JWT token verification
   - User attachment to request object

2. **githubWebhook.js**
   - GitHub webhook signature verification
   - Security validation

**Design Pattern:** Express middleware pattern for request processing.

## Data Flow

### Creating a Ticket

```
User (Frontend)
    ↓ HTTP POST /api/tickets
Express Server
    ↓ ticketController.createTicket()
Ticket Model (Mongoose)
    ↓ MongoDB
Database
    ↓ Response
Frontend (Update UI)
```

### GitHub Webhook Processing

```
GitHub Event
    ↓ POST /api/github/webhook
githubWebhook Middleware
    ↓ Verify signature
githubController.handleGitHubWebhook()
    ↓ Process event type
Ticket Model (Create/Update)
    ↓ MongoDB
Database
```

### Syncing Ticket to GitHub

```
User Request
    ↓ POST /api/github/sync-ticket/:id
githubController.syncTicketToGitHub()
    ↓ Axios Request
GitHub API
    ↓ Create/Update Issue
Ticket Model (Update with GitHub data)
    ↓ MongoDB
Database
```

## Database Schema

### Ticket Collection

```javascript
{
  _id: ObjectId,
  ticketId: String (unique, indexed),
  title: String,
  description: String,
  status: Enum ['open', 'in_progress', 'resolved', 'closed'],
  priority: Enum ['low', 'medium', 'high', 'critical'],
  category: String,
  createdBy: String,
  createdByEmail: String,
  assignedTo: String,
  githubIssueNumber: Number,
  githubIssueUrl: String,
  comments: [{
    author: String,
    authorEmail: String,
    content: String,
    createdAt: Date
  }],
  tags: [String],
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date
}
```

**Indexes:**
- `ticketId` (unique)
- `status`
- `priority`
- `createdAt` (descending)

### User Collection

```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: Enum ['admin', 'support_agent', 'user'],
  githubUsername: String,
  createdAt: Date
}
```

**Indexes:**
- `username` (unique)
- `email` (unique)

## API Design

### RESTful Principles

- **Resources**: Tickets, Users, GitHub
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Proper HTTP status codes
- **Response Format**: Consistent JSON format

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Authentication Flow

1. User registers or logs in
2. Server generates JWT token
3. Client stores token
4. Client includes token in Authorization header
5. Server verifies token on protected routes

## Security Architecture

### Security Layers

1. **Transport Layer**
   - SSL/TLS (HTTPS) with automatic enforcement in production
   - Secure headers (Helmet) with explicit Content Security Policy
   - HSTS (HTTP Strict Transport Security)
   - MongoDB SSL/TLS configuration support

2. **Application Layer**
   - Input validation with validator library
   - Output sanitization (xss-clean)
   - NoSQL injection prevention (express-mongo-sanitize)
   - XSS prevention
   - Parameter pollution prevention (hpp)
   - Body size limits (10kb)

3. **Authentication Layer**
   - JWT tokens with 1-hour expiration
   - Password hashing (bcrypt with 10 salt rounds)
   - Password complexity requirements (8+ chars, uppercase, lowercase, number, special char)
   - General rate limiting (100 requests/15min per IP)
   - Login-specific rate limiting (5 attempts/15min per IP)

4. **Network Layer**
   - CORS configuration with origin control
   - Firewall rules
   - IP whitelisting

5. **Audit Layer**
   - Security event logging to logs/security.log
   - Failed login attempt tracking
   - Rate limit violation logging
   - Suspicious input detection
   - User registration monitoring

### Security Features

- **Helmet**: Security headers with explicit Content Security Policy
- **CORS**: Cross-origin resource sharing control with configurable origins
- **Rate Limiting**: 100 requests/15min per IP (general), 5 login attempts/15min per IP
- **Password Hashing**: bcrypt with 10 salt rounds
- **Password Complexity**: Minimum 8 characters with uppercase, lowercase, number, and special character requirements
- **JWT**: Token-based authentication with 1-hour expiration
- **Webhook Verification**: HMAC signature verification
- **Input Validation**: Mongoose validators + validator library
- **Input Sanitization**: express-mongo-sanitize, xss-clean, hpp
- **Environment Variables**: Secrets not in code
- **Security Audit Logging**: Comprehensive logging of security events
- **HTTPS Enforcement**: Automatic redirect to HTTPS in production
- **MongoDB SSL/TLS**: Configurable encrypted database connections

## GitHub Integration Architecture

### Webhook Flow

```
GitHub Repository
    ↓ Webhook Event
Application Server
    ↓ Signature Verification
Event Handler
    ↓ Process Event
Database Update
    ↓ Sync to GitHub (if needed)
GitHub API
```

### Supported Events

- **Issues**: opened, closed, reopened, edited, labeled
- **Issue Comments**: created

### Bidirectional Sync

- **GitHub → Application**: Webhooks create/update tickets
- **Application → GitHub**: Manual sync creates/updates issues

## Scalability Considerations

### Current Design

- Single server deployment
- Single MongoDB instance
- In-memory session management

### Scaling Strategies

1. **Horizontal Scaling**
   - Load balancer (Nginx)
   - Multiple application instances
   - Shared session storage (Redis)

2. **Database Scaling**
   - MongoDB replica sets
   - Sharding for large datasets
   - Read replicas for read-heavy workloads

3. **Caching**
   - Redis for session storage
   - Application-level caching
   - CDN for static assets

4. **Performance Optimization**
   - Database indexing
   - Query optimization
   - Response compression
   - Connection pooling

## Error Handling

### Error Handling Strategy

1. **Try-Catch Blocks**: All async operations
2. **Error Middleware**: Centralized error handling
3. **Consistent Format**: Standardized error responses
4. **Logging**: Error logging for debugging

### Error Types

- **Validation Errors**: 400 Bad Request
- **Authentication Errors**: 401 Unauthorized
- **Not Found Errors**: 404 Not Found
- **Server Errors**: 500 Internal Server Error

## Deployment Architecture

### Development Environment

- Local MongoDB
- nodemon for auto-restart
- Environment variables in .env

### Production Environment

- MongoDB Atlas or self-hosted
- PM2 process manager
- Nginx reverse proxy
- SSL/TLS encryption
- Environment-specific configuration

## Monitoring and Logging

### Logging Strategy

- Application logs (PM2)
- Database logs (MongoDB)
- Access logs (Nginx)
- Error tracking (optional: Sentry)

### Metrics to Monitor

- Server uptime
- Response times
- Error rates
- Database performance
- GitHub API rate limits

## Future Enhancements

### Potential Improvements

1. **Real-time Updates**
   - WebSocket integration
   - Live ticket updates

2. **Advanced Features**
   - File attachments
   - Email notifications
   - SLA tracking
   - Reporting dashboard

3. **Integrations**
   - Slack notifications
   - Jira integration
   - Zendesk integration

4. **Performance**
   - Redis caching
   - Query optimization
   - CDN integration

## Design Decisions

### Why MongoDB?

- Flexible schema for ticket data
- Easy to scale horizontally
- Good for document-based data
- Built-in indexing

### Why Express.js?

- Minimal and flexible
- Large ecosystem
- Easy to learn
- Good performance

### Why Vanilla Frontend?

- No build step required
- Easy to deploy
- Lightweight
- Easy to customize

### Why JWT Authentication?

- Stateless
- Easy to implement
- Good for API authentication
- Cross-platform support

### Why GitHub Webhooks?

- Real-time event processing
- Efficient synchronization
- No polling required
- Event-driven architecture

## Code Organization Principles

1. **Separation of Concerns**: Each layer has distinct responsibility
2. **DRY**: Don't repeat yourself
3. **SOLID Principles**: Single responsibility, open/closed, etc.
4. **RESTful Design**: Standard HTTP methods and status codes
5. **Consistent Naming**: Clear, descriptive names

## Testing Strategy

### Testing Levels

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test API endpoints
3. **End-to-End Tests**: Test complete user flows

### Testing Tools (Future)

- Jest for unit tests
- Supertest for API tests
- Playwright for E2E tests

## Documentation

### Documentation Types

1. **User Documentation**: How to use the system
2. **Developer Documentation**: How to contribute
3. **API Documentation**: Endpoint reference
4. **Deployment Documentation**: How to deploy
5. **Architecture Documentation**: This document

## Maintenance

### Regular Maintenance Tasks

- Dependency updates
- Security patches
- Database backups
- Log rotation
- Performance monitoring

### Version Control

- Semantic versioning
- Git branches for features
- Pull request process
- Change logs

## Conclusion

This architecture provides a solid foundation for a support ticket system with GitHub integration. The modular design allows for easy maintenance and future enhancements while maintaining security and performance.
