# NEXUS Quick Start Guide

Get NEXUS running in under 10 minutes.

## Prerequisites

- Node.js 14+ installed
- MongoDB 4.4+ installed and running
- Git (optional, for cloning)

## Installation

### 1. Clone or Download

```bash
git clone <repository-url>
cd nexus
```

Or download and extract the zip file.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with minimum required settings:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nexus-support
JWT_SECRET=your-secure-secret-here
```

### 4. Start MongoDB

```bash
# Linux/macOS
mongod

# Windows
mongod --dbpath C:\data\db
```

### 5. Start the Application

```bash
npm start
```

### 6. Access the System

Open your browser: `http://localhost:3000`

## Create Your First Ticket

1. Click "Create Ticket"
2. Fill in:
   - Title: "Test Ticket"
   - Description: "This is a test ticket"
   - Your Name: "John Doe"
   - Your Email: "john@example.com"
3. Click "Create Ticket"
4. View your ticket in "View Tickets"

## Optional: GitHub Integration

To enable GitHub features, add to `.env`:

```env
GITHUB_WEBHOOK_SECRET=your-webhook-secret
GITHUB_TOKEN=your-github-token
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=your-repo
```

## Common Issues

**MongoDB connection failed:**
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`

**Port already in use:**
- Change PORT in `.env` to 3001 or another port

**Dependencies failed:**
- Delete `node_modules` and run `npm install` again

## Next Steps

After successful setup:

- Read full [NEXUS Installation Guide](INSTALLATION.md)
- Configure [GitHub Integration](INSTALLATION.md#github-integration)
- Review [NEXUS API Documentation](API.md)
- Deploy to production with [NEXUS Deployment Guide](DEPLOYMENT.md)

## Support

For issues, see [NEXUS Troubleshooting Guide](TROUBLESHOOTING.md) or check [NEXUS FAQ](FAQ.md).
