# NEXUS Installation and Setup Guide

This guide provides step-by-step instructions for installing and setting up NEXUS Support System.

## Table of Contents

- [Quick Start (Automated Installer)](#quick-start-automated-installer)
- [Prerequisites](#prerequisites)
- [Manual Installation Steps](#manual-installation-steps)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Verification](#verification)
- [Common Installation Issues](#common-installation-issues)

## Quick Start (Automated Installer)

NEXUS includes automated installation scripts that handle the entire setup process automatically:

### Linux/macOS
```bash
chmod +x install.sh
./install.sh
```

The Linux/macOS installer will:
- Detect your operating system and distribution
- Install Node.js automatically
- Install MongoDB automatically
- Configure MongoDB as a service
- Generate secure secrets
- Create `.env` file
- Start MongoDB service
- Run health checks

### Windows
```powershell
# Run as Administrator
.\install.ps1
```

The Windows installer will:
- Check for administrator privileges
- Install Node.js via MSI
- Install MongoDB via MSI
- Configure MongoDB as Windows service
- Generate secure secrets
- Create `.env` file
- Start MongoDB service
- Run health checks

### Cross-Platform (Node.js)
```bash
node install.js
```

The cross-platform installer will:
- Detect your operating system
- Check for Node.js/npm
- Install npm dependencies
- Generate secure secrets
- Create `.env` file
- Create MongoDB data directory
- Start MongoDB (platform-specific)
- Run health checks

### Docker (Containerized)
```bash
docker-compose up -d
```

The Docker setup will:
- Pull MongoDB container
- Build application container
- Configure networking
- Set up volume persistence
- Start both services
- Configure health checks

For detailed automated installer documentation, see [AUTOMATED_INSTALL.md](AUTOMATED_INSTALL.md).

## Prerequisites

Before installing the GitHub Support Ticket System, ensure you have the following installed:

### Required Software

- **Node.js**: Version 14.0.0 or higher
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`
  
- **npm**: Version 6.0.0 or higher (comes with Node.js)
  - Verify installation: `npm --version`

- **MongoDB**: Version 4.4 or higher
  - Download from [mongodb.com](https://www.mongodb.com/try/download)
  - For local development, you can use MongoDB Community Server
  - Verify installation: `mongod --version`

### Optional Software

- **Git**: For version control (if cloning from repository)
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify installation: `git --version`

- **Postman** or similar API testing tool
  - For testing API endpoints during development

## Installation Steps

### Step 1: Clone or Download the Project

If cloning from a Git repository:

```bash
git clone <repository-url>
cd nexus
```

If downloading as a zip file:
1. Extract the archive
2. Navigate to the extracted directory

### Step 2: Install Dependencies

Install all required Node.js packages:

```bash
npm install
```

This will install the following dependencies:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing
- `axios` - HTTP client for GitHub API
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing

Development dependencies:
- `nodemon` - Auto-restart server during development

### Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/githubb-support

# GitHub Configuration
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO_NAME=your_repository_name

# JWT Secret
JWT_SECRET=your_jwt_secret_here_change_this_in_production
```

### Step 4: Start MongoDB

Start MongoDB server (if not already running):

```bash
# On Linux/macOS
mongod --dbpath /path/to/your/data/directory

# On Windows
mongod --dbpath C:\path\to\your\data\directory

# Or use MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

Verify MongoDB is running:

```bash
mongo
# In MongoDB shell
> show dbs
```

### Step 5: Initialize the Database

The application will automatically create collections when you first run it. However, you can optionally create an admin user via API:

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "secure_password",
    "role": "admin"
  }'
```

## Configuration

### MongoDB Configuration

**Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/nexus-support
```

**MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexus-support?retryWrites=true&w=majority
```

**MongoDB with Authentication:**
```env
MONGODB_URI=mongodb://username:password@localhost:27017/nexus-support?authSource=admin
```

### GitHub Configuration

#### Creating a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token" (classic)
3. Select the following scopes:
   - `repo` - Full control of private repositories
   - `issues` - Read and write issues
4. Generate the token and copy it
5. Add it to your `.env` file as `GITHUB_TOKEN`

#### Setting Up GitHub Webhooks

1. Navigate to your GitHub repository
2. Go to Settings → Webhooks → Add webhook
3. Configure:
   - **Payload URL**: `https://your-domain.com/api/github/webhook`
   - For local testing, use ngrok: `https://your-ngrok-url.ngrok.io/api/github/webhook`
   - **Content type**: `application/json`
   - **Secret**: Use the value from `GITHUB_WEBHOOK_SECRET` in `.env`
   - **Events**: Select "Issues" and "Issue comments"
4. Click "Add webhook"

#### Generating Webhook Secret

Generate a secure random string for your webhook secret:

```bash
# On Linux/macOS
openssl rand -hex 32

# On Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### JWT Configuration

Generate a secure JWT secret:

```bash
# On Linux/macOS
openssl rand -hex 64

# On Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

**Important:** Use different secrets for development and production.

## Running the Application

### Development Mode

Run with auto-restart on file changes:

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files are modified.

### Production Mode

Run in production mode:

```bash
npm start
```

Or with Node.js directly:

```bash
NODE_ENV=production node server.js
```

### Using PM2 (Process Manager)

For production deployment with PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name nexus

# View logs
pm2 logs nexus

# Restart
pm2 restart nexus

# Stop
pm2 stop nexus
```

## Verification

### 1. Check Server Status

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Access the Web Interface

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the GitHub Support Ticket System interface with the sci-fi theme.

### 3. Test API Endpoints

Create a test ticket:

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Ticket",
    "description": "This is a test ticket",
    "createdBy": "Test User",
    "createdByEmail": "test@example.com"
  }'
```

### 4. Verify MongoDB Connection

Check if collections were created:

```bash
mongo
> use nexus-support
> show collections
```

You should see:
- `tickets`
- `users`

## Common Installation Issues

### Issue: MongoDB Connection Failed

**Symptom:** Error message "MongoDB Connected: undefined" or connection timeout

**Solutions:**
1. Verify MongoDB is running: `mongod --version`
2. Check MongoDB URI in `.env` file
3. Ensure MongoDB is accessible on the specified port (default: 27017)
4. Check firewall settings
5. For MongoDB Atlas, verify IP whitelist includes your IP address

### Issue: Port Already in Use

**Symptom:** Error "EADDRINUSE: address already in use"

**Solutions:**
1. Change the PORT in `.env` file
2. Kill the process using the port:
   ```bash
   # Find process
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

### Issue: Module Not Found

**Symptom:** Error "Cannot find module 'express'"

**Solutions:**
1. Run `npm install` to install dependencies
2. Delete `node_modules` and `package-lock.json`, then run `npm install` again
3. Verify Node.js version is compatible

### Issue: GitHub Webhook Not Working

**Symptom:** Webhooks not being received or processed

**Solutions:**
1. Verify webhook URL is publicly accessible (use ngrok for local testing)
2. Check webhook secret matches in both GitHub and `.env`
3. Review GitHub webhook delivery logs in repository settings
4. Check server logs for webhook processing errors
5. Ensure webhook events are selected (Issues, Issue comments)

### Issue: CORS Errors

**Symptom:** Browser console shows CORS errors

**Solutions:**
1. Verify CORS is configured in `server.js`
2. Check allowed origins in CORS configuration
3. For development, ensure frontend and backend are on same origin or CORS allows it

### Issue: JWT Token Invalid

**Symptom:** Authentication fails with "Invalid token" error

**Solutions:**
1. Verify JWT_SECRET is set in `.env`
2. Ensure token is being sent in Authorization header: `Bearer <token>`
3. Check token expiration (default: 7 days)
4. Regenerate token if needed

## Next Steps

After successful installation:

1. Read the [Developer Guide](DEVELOPER.md) for development instructions
2. Review the [API Documentation](API.md) for endpoint details
3. Set up GitHub webhooks for issue synchronization
4. Configure authentication and user roles
5. Deploy to production using the [Deployment Guide](DEPLOYMENT.md)

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [GitHub Webhooks Documentation](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [JWT Documentation](https://jwt.io/)

## Support

For installation issues not covered in this guide:
- Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review GitHub Issues
- Contact support team
