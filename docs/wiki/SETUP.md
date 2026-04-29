# NEXUS System Setup Guide

Complete setup instructions for NEXUS Support System.

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [GitHub Integration Setup](#github-integration-setup)
- [Running the Application](#running-the-application)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **CPU**: 1 core
- **RAM**: 2GB
- **Storage**: 20GB
- **OS**: Linux, macOS, or Windows

### Software Requirements

- **Node.js**: Version 14.0.0 or higher
- **npm**: Version 6.0.0 or higher
- **MongoDB**: Version 4.4 or higher
- **Git**: Version 2.0 or higher (optional)

### Recommended Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB+
- **Storage**: 50GB+
- **MongoDB**: Version 6.0+

## Installation

### Step 1: Obtain the Source Code

#### Option A: Clone from Git Repository

```bash
git clone <repository-url>
cd nexus
```

#### Option B: Download Release

1. Download the latest release from GitHub
2. Extract the archive
3. Navigate to the extracted directory

### Step 2: Install Node.js Dependencies

```bash
npm install
```

This installs all required packages:
- express, mongoose, dotenv, cors, axios
- helmet, express-rate-limit
- jsonwebtoken, bcryptjs
- nodemon (development)

### Step 3: Verify Installation

```bash
npm list
```

Ensure all dependencies are installed without errors.

## Configuration

### Step 1: Create Environment File

```bash
cp .env.example .env
```

### Step 2: Configure Basic Settings

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# CORS Configuration (optional - restrict to specific domains in production)
CORS_ORIGIN=*

# Database
MONGODB_URI=mongodb://localhost:27017/nexus-support

# MongoDB SSL/TLS Configuration (optional - for production)
MONGODB_SSL=false
MONGODB_TLS=false
MONGODB_TLS_ALLOW_INVALID_CERTS=false
MONGODB_TLS_CA_FILE=
MONGODB_TLS_CERT_KEY_FILE=
MONGODB_TLS_CERT_KEY_PASSWORD=

# JWT Secret (required)
JWT_SECRET=<generate-secure-random-string>
```

### Step 3: Generate Secure Secrets

**Generate JWT Secret:**
```bash
# Linux/macOS
openssl rand -hex 64

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

### Step 4: Configure Optional Features

**GitHub Integration (optional):**
```env
GITHUB_WEBHOOK_SECRET=<generate-secure-random-string>
GITHUB_TOKEN=<github-personal-access-token>
GITHUB_REPO_OWNER=<your-github-username>
GITHUB_REPO_NAME=<your-repository-name>
```

## Database Setup

### Option A: Local MongoDB

#### Install MongoDB

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Windows:**
Download from [mongodb.com](https://www.mongodb.com/try/download)

#### Start MongoDB

```bash
# Linux/macOS
mongod --dbpath /path/to/data/directory

# Or use service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

#### Verify MongoDB

```bash
mongo
> show dbs
```

### Option B: MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 tier)
3. Create database user
4. Whitelist IP address (0.0.0.0/0 for all)
5. Get connection string
6. Update `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexus-support?retryWrites=true&w=majority
```

### Option C: Docker MongoDB

```bash
docker run -d -p 27017:27017 --name mongodb mongo:6.0
```

Update `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/githhbb-support
```

## GitHub Integration Setup

### Step 1: Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token" (classic)
3. Select scopes:
   - `repo` - Full control of private repositories
   - `issues` - Read and write issues
4. Generate and copy the token
5. Add to `.env` as `GITHUB_TOKEN`

### Step 2: Generate Webhook Secret

```bash
# Linux/macOS
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Add to `.env` as `GITHUB_WEBHOOK_SECRET`

### Step 3: Configure Repository Details

```env
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=your-repository-name
```

### Step 4: Set Up GitHub Webhook

1. Go to your GitHub repository
2. Settings → Webhooks → Add webhook
3. Configure:
   - **Payload URL**: `https://your-domain.com/api/github/webhook`
   - For local testing, use ngrok: `https://your-ngrok-url.ngrok.io/api/github/webhook`
   - **Content type**: `application/json`
   - **Secret**: Your `GITHUB_WEBHOOK_SECRET`
   - **Events**: "Issues" and "Issue comments"
4. Click "Add webhook"

### Step 5: Test Webhook (Optional)

For local testing with ngrok:

```bash
# Install ngrok
brew install ngrok  # macOS
snap install ngrok  # Linux

# Start ngrok
ngrok http 3000

# Use the ngrok URL for GitHub webhook
```

## Running the Application

### Development Mode

Auto-restart on file changes:

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Or with environment variable:

```bash
NODE_ENV=production npm start
```

### Using PM2 (Recommended for Production)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name githhb-uupportb-support

# View logs
pm2 logs githhb-uupportb-support

# Restart
pm2 restart nexus

# Stop
pm2 stop nexus

# Configure to start on boot
pm2 startup
pm2 save
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

### 2. Access Web Interface

Open browser: `http://localhost:3000`

### 3. Create Test Ticket

Via web interface or API:

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Setup Test",
    "description": "Testing the system",
    "createdBy": "Test User",
    "createdByEmail": "test@example.com"
  }'
```

### 4. Verify Database

```bash
mongo
> use nexus-support
> show collections
> db.tickets.find()
```

### 5. Test GitHub Integration (if configured)

Create a GitHub issue and verify it creates a ticket, or sync a ticket to GitHub.

## Troubleshooting

### MongoDB Connection Issues

**Error:** "MongoNetworkError"

**Solutions:**
- Verify MongoDB is running
- Check MONGODB_URI in `.env`
- Ensure MongoDB port (27017) is accessible
- Check firewall settings

### Port Already in Use

**Error:** "EADDRINUSE: address already in use :::3000"

**Solutions:**
- Change PORT in `.env`
- Kill process using port 3000:
  ```bash
  lsof -i :3000
  kill -9 <PID>
  ```

### Dependencies Not Installing

**Solutions:**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json
- Run `npm install` again
- Try with different Node.js version

### GitHub Webhook Not Working

**Solutions:**
- Verify webhook URL is publicly accessible
- Use ngrok for local testing
- Check webhook secret matches
- Review GitHub webhook delivery logs
- Check server logs

### Authentication Issues

**Solutions:**
- Verify JWT_SECRET is set in `.env`
- Check token format: `Bearer <token>`
- Verify token hasn't expired (7 days)

For more issues, see [Troubleshooting Guide](TROUBLESHOOTING.md).

## Security Considerations

### Production Deployment

1. **Change all secrets** from default values
2. **Use strong, random secrets** for JWT and webhook
3. **Enable HTTPS** with SSL/TLS
4. **Restrict CORS** to specific origins
5. **Enable rate limiting** (already configured)
6. **Use environment-specific configs**
7. **Never commit `.env` file**
8. **Regular security updates** for dependencies

### Environment Variables

Never commit `.env` to version control. Use `.env.example` as template.

### Database Security

- Enable MongoDB authentication
- Use strong passwords
- Restrict network access
- Use TLS/SSL for connections
- Regular backups

## Performance Tuning

### Database Indexing

Add indexes for frequently queried fields:

```javascript
// In models/Ticket.js
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ createdAt: -1 });
```

### Connection Pooling

Configure MongoDB connection pool:

```javascript
mongoose.connect(uri, {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000
});
```

### Caching

Consider implementing caching for:
- User sessions
- Ticket lists
- GitHub repository info

## Next Steps

After successful NEXUS setup:

- Configure [GitHub Integration](#github-integration-setup)
- Review [NEXUS API Documentation](API.md)
- Set up [Systemd Service](#using-systemd-service)
- Configure [Monitoring](#monitoring)
- Deploy to production with [NEXUS Deployment Guide](DEPLOYMENT.md)

## Additional Resources

- [Installation Guide](INSTALLATION.md) - Detailed installation instructions
- [Developer Guide](DEVELOPER.md) - For developers
- [API Documentation](API.md) - Complete API reference
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions
- [FAQ](FAQ.md) - Frequently asked questions
