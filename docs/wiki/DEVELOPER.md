# NEXUS Developer Guide

This guide provides comprehensive information for developers working on NEXUS Support System.

## Table of Contents

- [Project Architecture](#project-architecture)
- [Development Environment Setup](#development-environment-setup)
- [Quick Setup with Automated Installers](#quick-setup-with-automated-installers)
- [Code Structure](#code-structure)
- [Database Schema](#database-schema)
- [API Development](#api-development)
- [Testing](#testing)
- [Coding Standards](#coding-standards)
- [Git Workflow](#git-workflow)
- [Contributing](#contributing)

## Project Architecture

### High-Level Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │◄────►│   Backend   │◄────►│  MongoDB    │
│  (Static)   │      │  (Express)  │      │  Database   │
└─────────────┘      └─────────────┘      └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   GitHub    │
                       │    API      │
                       └─────────────┘
```

### Technology Stack

- **Backend Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, Bcrypt
- **GitHub Integration**: Axios
- **Frontend**: Vanilla HTML/CSS/JavaScript

### Key Components

1. **Server Layer** (`server.js`)
   - Express application setup
   - Middleware configuration
   - Route registration
   - Error handling

2. **Controllers Layer** (`controllers/`)
   - Business logic
   - Request/response handling
   - Data validation

3. **Models Layer** (`models/`)
   - Database schemas
   - Data validation
   - Pre/post hooks

4. **Routes Layer** (`routes/`)
   - API endpoint definitions
   - Route middleware
   - Request routing

5. **Middleware Layer** (`middleware/`)
   - Authentication
   - Request validation
   - Error handling

## Development Environment Setup

### Quick Setup with Automated Installers

The system includes automated installation scripts for rapid development environment setup:

**Linux/macOS:**
```bash
chmod +x install.sh
./install.sh
```

**Windows:**
```powershell
.\install.ps1
```

**Cross-Platform:**
```bash
node install.js
```

**Docker:**
```bash
docker-compose up -d
```

For detailed automated installer documentation, see [AUTOMATED_INSTALL.md](AUTOMATED_INSTALL.md).

### Prerequisites

- Node.js 14+
- MongoDB 4.4+
- Git
- Code editor (VS Code recommended)

### Recommended VS Code Extensions

- ESLint
- Prettier
- MongoDB for VS Code
- REST Client
- GitLens

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   mongod --dbpath /path/to/data
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   ```
   http://localhost:3000
   ```

## Code Structure

```
nexus/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── ticketController.js   # Ticket CRUD operations
│   ├── githubController.js   # GitHub webhook & sync logic
│   └── userController.js     # User authentication logic
├── middleware/
│   ├── auth.js               # JWT authentication middleware
│   └── githubWebhook.js      # GitHub webhook verification
├── models/
│   ├── Ticket.js             # Ticket MongoDB schema
│   └── User.js               # User MongoDB schema
├── public/
│   └── index.html            # Frontend interface
├── routes/
│   ├── ticketRoutes.js       # Ticket API routes
│   ├── githubRoutes.js       # GitHub API routes
│   └── userRoutes.js         # User API routes
├── docs/                     # Documentation
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Project dependencies
├── README.md                 # Project overview
└── server.js                 # Main application entry point
```

### File Descriptions

#### `server.js`
Main application entry point. Configures Express, middleware, routes, and starts the server.

#### `config/database.js`
MongoDB connection logic using Mongoose. Handles connection errors and logging.

#### `controllers/`
Contains business logic for each resource:
- **ticketController.js**: Handle ticket CRUD, comments, GitHub linking
- **githubController.js**: Process GitHub webhooks, sync tickets to GitHub
- **userController.js**: User registration, login, profile management

#### `middleware/`
Custom middleware functions:
- **auth.js**: Verify JWT tokens and attach user to request
- **githubWebhook.js**: Verify GitHub webhook signatures

#### `models/`
Mongoose schemas defining data structure:
- **Ticket.js**: Ticket schema with GitHub integration fields
- **User.js**: User schema with authentication fields

#### `routes/`
API endpoint definitions:
- **ticketRoutes.js**: /api/tickets endpoints
- **githubRoutes.js**: /api/github endpoints
- **userRoutes.js**: /api/users endpoints

#### `public/`
Static files served by Express:
- **index.html**: Single-page application interface

## Database Schema

### Ticket Model

```javascript
{
  ticketId: String (unique, required),
  title: String (required),
  description: String (required),
  status: Enum ['open', 'in_progress', 'resolved', 'closed'],
  priority: Enum ['low', 'medium', 'high', 'critical'],
  category: String,
  createdBy: String (required),
  createdByEmail: String (required),
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

### User Model

```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  role: Enum ['admin', 'support_agent', 'user'],
  githubUsername: String,
  createdAt: Date
}
```

## API Development

### Adding a New Endpoint

1. **Define the controller function** in `controllers/`:
   ```javascript
   // controllers/ticketController.js
   const newEndpoint = async (req, res) => {
     try {
       // Business logic here
       res.status(200).json({ success: true, data: result });
     } catch (error) {
       res.status(400).json({ success: false, error: error.message });
     }
   };
   ```

2. **Export the function**:
   ```javascript
   module.exports = {
     // existing exports
     newEndpoint
   };
   ```

3. **Add the route** in `routes/`:
   ```javascript
   // routes/ticketRoutes.js
   const { newEndpoint } = require('../controllers/ticketController');
   router.post('/new-endpoint', newEndpoint);
   ```

4. **Register the route** in `server.js` (if new route file):
   ```javascript
   const newRoutes = require('./routes/newRoutes');
   app.use('/api/new', newRoutes);
   ```

### Adding Middleware

1. **Create middleware function** in `middleware/`:
   ```javascript
   // middleware/custom.js
   const customMiddleware = (req, res, next) => {
     // Middleware logic
     next();
   };
   module.exports = customMiddleware;
   ```

2. **Apply to routes**:
   ```javascript
   router.get('/protected', customMiddleware, controllerFunction);
   ```

### Error Handling

All controllers should follow this error handling pattern:

```javascript
const controllerFunction = async (req, res) => {
  try {
    // Business logic
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
```

## Testing

### Recent System Improvements

The system has been enhanced with the following improvements:

**Security & Validation:**
- Comprehensive input validation on all API endpoints
- Environment variable validation checks
- Improved JWT authentication with specific error types
- Enhanced webhook signature verification with logging
- Null safety checks in GitHub webhook handlers

**Installation & Deployment:**
- Automated installation scripts for Linux/macOS (install.sh)
- Automated installation script for Windows (install.ps1)
- Cross-platform Node.js installer (install.js)
- Docker Compose setup for containerized deployment
- Dockerfile for application containerization

**Documentation:**
- Quick Start Guide for rapid setup
- Platform-specific setup guides (Windows, Linux, macOS)
- Comprehensive Automated Installation Guide
- Updated API documentation
- Enhanced troubleshooting guides

**UI/UX:**
- Modern sci-fi theme with neon cyan accents
- Consistent color scheme throughout
- Removed emojis and icons as requested

### Manual Testing with cURL

```bash
# Create ticket
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test","createdBy":"User","createdByEmail":"user@test.com"}'

# Get tickets
curl http://localhost:3000/api/tickets

# Get specific ticket
curl http://localhost:3000/api/tickets/TCK-ABC123
```

### Testing with Postman

1. Import the API collection (if available)
2. Set base URL: `http://localhost:3000/api`
3. For authenticated endpoints, add JWT token to headers:
   - Header: `Authorization`
   - Value: `Bearer <your-jwt-token>`

### Testing GitHub Webhooks Locally

1. Install ngrok:
   ```bash
   # macOS
   brew install ngrok
   
   # Linux
   snap install ngrok
   ```

2. Start ngrok:
   ```bash
   ngrok http 3000
   ```

3. Use the ngrok URL for GitHub webhook payload URL

4. Test webhook by creating an issue in your GitHub repository

## Coding Standards

### JavaScript Style Guide

- Use 2 spaces for indentation
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for classes and constructors
- Use UPPER_CASE for constants
- Add JSDoc comments for functions

### Example:

```javascript
/**
 * Create a new ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    const ticket = await Ticket.create({ title, description });
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
```

### Naming Conventions

- **Files**: kebab-case (e.g., `ticketController.js`)
- **Variables**: camelCase (e.g., `ticketId`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_TICKETS`)
- **Classes**: PascalCase (e.g., `TicketService`)
- **Database Collections**: PascalCase (e.g., `Tickets`, `Users`)

### Code Organization

- Keep controllers thin - business logic only
- Keep routes simple - just routing
- Use middleware for cross-cutting concerns
- Separate validation logic into validators
- Use async/await for asynchronous operations

## Git Workflow

### Branch Strategy

- `main` - Production branch
- `develop` - Integration branch
- `feature/<name>` - Feature branches
- `bugfix/<name>` - Bug fix branches
- `hotfix/<name>` - Emergency fixes

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks

**Examples:**
```
feat(tickets): add ticket filtering by priority

Add ability to filter tickets by priority level in the
GET /api/tickets endpoint. Accepts priority query parameter.

Closes #123
```

```
fix(auth): resolve JWT token expiration issue

Fixed bug where tokens were not expiring correctly.
Updated token generation logic to use proper expiration time.
```

### Development Workflow

1. Create feature branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. Make changes and commit
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. Push to remote
   ```bash
   git push origin feature/new-feature
   ```

4. Create pull request to `develop`

5. After review and merge, delete feature branch
   ```bash
   git branch -d feature/new-feature
   ```

## Contributing

### Before Contributing

1. Read this developer guide
2. Read the API documentation
3. Set up local development environment
4. Run existing tests (if any)

### Making Changes

1. Create a new branch for your changes
2. Follow coding standards
3. Write clear commit messages
4. Test your changes thoroughly
5. Update documentation if needed
6. Submit a pull request

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Commit messages are clear and descriptive
- [ ] Changes are tested locally
- [ ] Documentation is updated
- [ ] No console.log statements left in production code
- [ ] Environment variables are documented
- [ ] No hardcoded credentials or secrets

### Code Review Process

1. Submit pull request
2. Wait for review from maintainers
3. Address review comments
4. Update PR as needed
5. Get approval before merge

## Performance Considerations

### Database Indexing

Add indexes to frequently queried fields:

```javascript
// In models/Ticket.js
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ createdAt: -1 });
```

### Pagination

For large datasets, implement pagination:

```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

const tickets = await Ticket.find().skip(skip).limit(limit);
```

### Caching

Consider caching frequently accessed data:
- User sessions
- Ticket lists
- GitHub repository information

## Security Best Practices

1. **Never commit sensitive data**
   - Use `.env` for secrets
   - Add `.env` to `.gitignore`
   - Rotate secrets regularly

2. **Validate all inputs**
   - Use Mongoose validators
   - Add custom validation in controllers
   - Sanitize user input

3. **Use HTTPS in production**
   - Configure SSL certificates
   - Redirect HTTP to HTTPS

4. **Implement rate limiting**
   - Prevent API abuse
   - Configure appropriate limits

5. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update packages to latest secure versions

## Debugging

### Enable Debug Logging

Add debug statements to controllers:

```javascript
console.log('Processing ticket:', ticketId);
console.log('GitHub webhook received:', eventType);
```

### MongoDB Debugging

Enable MongoDB query logging:

```javascript
mongoose.set('debug', true);
```

### Common Debugging Scenarios

**Ticket not saving:**
- Check Mongoose validation errors
- Verify database connection
- Check for duplicate ticketId

**Webhook not processing:**
- Verify webhook signature
- Check GitHub webhook delivery logs
- Review server logs

**Authentication failing:**
- Verify JWT_SECRET matches
- Check token expiration
- Verify token format

## Resources

- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [JWT.io](https://jwt.io/)
- [GitHub API Documentation](https://docs.github.com/en/rest)

## Getting Help

- Check existing documentation
- Review GitHub Issues
- Contact maintainers
- Join developer community (if available)
