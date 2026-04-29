# NEXUS Automated Installation Guide

This guide covers the automated installation scripts included with NEXUS Support System.

## Table of Contents

- [Overview](#overview)
- [Linux/macOS Installer](#linuxmacos-installer)
- [Windows Installer](#windows-installer)
- [Cross-Platform Node.js Installer](#cross-platform-nodejs-installer)
- [Docker Installation](#docker-installation)
- [Troubleshooting](#troubleshooting)

## Overview

The GitHub Support Ticket System includes multiple automated installation methods to simplify the setup process:

1. **install.sh** - Shell script for Linux/macOS
2. **install.ps1** - PowerShell script for Windows
3. **install.js** - Cross-platform Node.js installer
4. **docker-compose.yml** - Docker containerized setup

All installers automatically:
- Detect the operating system
- Install required dependencies (optional)
- Generate secure secrets
- Create configuration files
- Configure services
- Run health checks

## Linux/macOS Installer

### File: install.sh

### Features

- **OS Detection**: Automatically detects Linux distribution (Debian, RedHat, Arch) and macOS
- **Node.js Installation**: Installs Node.js 18.x from official repositories
- **MongoDB Installation**: Installs MongoDB 6.0 and configures as system service
- **Secret Generation**: Generates cryptographically secure JWT and webhook secrets
- **Environment Configuration**: Creates `.env` file with all required settings
- **Service Management**: Configures and starts MongoDB as a system service
- **Health Checks**: Verifies the application starts correctly

### Usage

```bash
# Make script executable
chmod +x install.sh

# Run installer
./install.sh
```

### Interactive Prompts

The installer will prompt you for:
- Install Node.js? (Y/n)
- Install MongoDB? (Y/n)

### What Gets Installed

**Node.js:**
- From NodeSource repository (Linux)
- From Homebrew (macOS)
- Version: 18.x

**MongoDB:**
- MongoDB Community Server 6.0
- Configured as system service
- Auto-start on boot

**Configuration:**
- `.env` file with secure secrets
- MongoDB data directory
- Database collections

### System Requirements

- Linux: Ubuntu 18.04+, Debian 10+, CentOS 7+, Arch Linux
- macOS: 10.14 (Mojave) or later
- Root/sudo access for system package installation
- Internet connection

### Manual Steps Performed

The installer executes these steps automatically:

1. Detect OS and distribution
2. Check for required dependencies (curl, git)
3. Install Node.js if needed
4. Install MongoDB if needed
5. Install npm dependencies
6. Generate secure secrets
7. Create `.env` file
8. Configure MongoDB
9. Start MongoDB service
10. Run health check on application

### Customization

You can modify the installer by editing these variables at the top of `install.sh`:

```bash
MONGODB_VERSION="6.0"
NODE_VERSION="18"
```

## Windows Installer

### File: install.ps1

### Features

- **Administrator Check**: Verifies running as Administrator
- **Node.js Installation**: Downloads and installs Node.js via MSI
- **MongoDB Installation**: Downloads and installs MongoDB via MSI
- **Service Configuration**: Configures MongoDB as Windows service
- **Secret Generation**: Generates secure secrets using PowerShell
- **Environment Configuration**: Creates `.env` file
- **Service Management**: Starts MongoDB Windows service
- **Health Checks**: Verifies application startup

### Usage

```powershell
# Run PowerShell as Administrator
Right-click PowerShell -> Run as Administrator

# Navigate to project directory
cd GitHHb-Supportb-Support

# Run installer
.\install.ps1
```

### Parameters

Optional parameters to skip steps:

```powershell
# Skip Node.js installation
.\install.ps1 -SkipNode

# Skip MongoDB installation
.\install.ps1 -SkipMongo

# Skip npm dependencies
.\install.ps1 -SkipDeps

# Skip .env file creation
.\install.ps1 -SkipEnv

# Skip MongoDB configuration
.\install.ps1 -SkipMongoConfig

# Skip health check
.\install.ps1 -SkipHealthCheck
```

### Interactive Prompts

The installer will prompt you for:
- Install Node.js? (Y/N)
- Install MongoDB? (Y/N)

### What Gets Installed

**Node.js:**
- Downloaded from nodejs.org
- Version: 18.19.0
- Installed via MSI
- PATH automatically updated

**MongoDB:**
- Downloaded from mongodb.com
- Version: 6.0.13
- Installed via MSI to C:\MongoDB
- Configured as Windows service
- Auto-start on boot
- Data directory: C:\data\db

**Configuration:**
- `.env` file with secure secrets
- MongoDB data directory
- Windows service configuration

### System Requirements

- Windows 10 or later
- Administrator privileges
- Internet connection
- PowerShell 5.1 or later

### Manual Steps Performed

The installer executes these steps automatically:

1. Check for administrator privileges
2. Download and install Node.js MSI
3. Download and install MongoDB MSI
4. Create MongoDB data directory
5. Install MongoDB as Windows service
6. Start MongoDB service
7. Install npm dependencies
8. Generate secure secrets
9. Create `.env` file
10. Configure MongoDB
11. Start services
12. Run health check

### Troubleshooting Windows Installer

**"This script requires administrator privileges"**
- Right-click PowerShell and select "Run as Administrator"
- Or open PowerShell as Administrator from Start menu

**"MongoDB service won't start"**
- Check Windows Event Viewer for MongoDB service errors
- Verify MongoDB installation path
- Check data directory permissions

**"Port already in use"**
- Another application is using port 3000
- Change PORT in `.env` to 3001 or another port
- Or stop the conflicting application

## Cross-Platform Node.js Installer

### File: install.js

### Features

- **Cross-Platform**: Works on Linux, macOS, and Windows
- **OS Detection**: Automatically detects operating system
- **Dependency Check**: Verifies Node.js and npm are installed
- **Secret Generation**: Generates cryptographically secure secrets
- **Environment Configuration**: Creates `.env` file
- **MongoDB Setup**: Creates MongoDB data directory
- **Service Start**: Starts MongoDB (platform-specific commands)
- **Health Checks**: Verifies application startup

### Usage

```bash
node install.js
```

### Interactive Prompts

The installer will prompt you for:
- Setup MongoDB data directory? (Y/n)
- Run health check? (Y/n)

### What Gets Installed

**Dependencies:**
- npm packages from package.json

**Configuration:**
- `.env` file with secure secrets
- MongoDB data directory (if selected)

**Services:**
- MongoDB service started (if selected)

### System Requirements

- Node.js 14+ (must be installed manually)
- npm 6+ (must be installed manually)
- MongoDB 4.4+ (must be installed manually)
- Internet connection

### Manual Steps Performed

The installer executes these steps automatically:

1. Detect operating system
2. Check for Node.js and npm
3. Install npm dependencies
4. Generate secure secrets
5. Create `.env` file
6. Create MongoDB data directory (if selected)
7. Start MongoDB (if selected)
8. Run health check (if selected)

### Limitations

- Does NOT install Node.js (must be pre-installed)
- Does NOT install MongoDB (must be pre-installed)
- Requires manual MongoDB service management
- Best for users who already have Node.js and MongoDB installed

### When to Use

Use this installer when:
- You already have Node.js and MongoDB installed
- You want to avoid system-level changes
- You're on a system where you don't have sudo/admin access
- You want to control the installation process more manually

## Docker Installation

### Files: docker-compose.yml, Dockerfile, .dockerignore

### Features

- **Containerization**: Runs application and MongoDB in Docker containers
- **Isolation**: Application isolated from host system
- **Reproducibility**: Same environment across all platforms
- **Easy Setup**: Single command to start everything
- **Data Persistence**: MongoDB data persisted in Docker volume
- **Health Checks**: Automatic health checks for MongoDB
- **Networking**: Isolated network for application and database

### Usage

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (delete data)
docker-compose down -v
```

### Services

**App Container:**
- Based on Node.js 18 Alpine
- Runs on port 3000
- Auto-restart on failure
- Depends on MongoDB health check

**MongoDB Container:**
- MongoDB 6.0 official image
- Port 27017 exposed
- Data persisted in named volume
- Health check configured
- Auto-restart on failure

### Configuration

Environment variables are passed from host environment or `.env` file:

```env
JWT_SECRET=your-secret
GITHUB_WEBHOOK_SECRET=your-secret
GITHUB_TOKEN=your-token
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=your-repo
```

### System Requirements

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 20GB disk space

### Manual Steps Performed

Docker Compose automatically:
1. Pulls MongoDB image from Docker Hub
2. Builds application image from Dockerfile
3. Creates Docker network
4. Creates named volume for data persistence
5. Starts MongoDB container
6. Waits for MongoDB health check
7. Starts application container
8. Connects containers via network

### Data Persistence

MongoDB data is stored in a Docker named volume:
- Volume name: `mongodb-data`
- Persisted across container restarts
- Removed with `docker-compose down -v`

### Accessing MongoDB from Host

MongoDB is exposed on port 27017 of the host machine, allowing you to connect with MongoDB Compass or other tools:

```
mongodb://localhost:27017/githhbb-support
```

### Customization

You can customize the Docker setup by editing `docker-compose.yml`:

**Change ports:**
```yaml
services:
  app:
    ports:
      - "8080:3000"  # Use port 8080 instead of 3000
```

**Change MongoDB version:**
```yaml
services:
  mongodb:
    image: mongo:7.0  # Use MongoDB 7.0
```

**Add more replicas:**
```yaml
services:
  app:
    deploy:
      replicas: 3  # Run 3 instances
```

### Troubleshooting Docker

**"Port already in use"**
```bash
# Check what's using the port
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Change port in docker-compose.yml
```

**"Container won't start"**
```bash
# View logs
docker-compose logs app
docker-compose logs mongodb

# Rebuild containers
docker-compose up --build
```

**"Data not persisting"**
```bash
# Check volume
docker volume ls

# Remove volume and start fresh
docker-compose down -v
docker-compose up -d
```

## Comparison of Installation Methods

| Method | Pros | Cons | Best For |
|--------|------|------|-----------|
| **install.sh** | Complete automation, system service | Requires sudo/root, modifies system | Fresh Linux/macOS installations |
| **install.ps1** | Complete automation, Windows service | Requires Admin, modifies system | Fresh Windows installations |
| **install.js** | Cross-platform, no system changes | Requires manual Node.js/MongoDB setup | Users with existing stack |
| **Docker** | Isolated, reproducible, easy cleanup | Requires Docker, resource overhead | Development, testing, production |

## Post-Installation Steps

After running any installer:

1. **Configure GitHub Integration** (optional)
   - Edit `.env` file
   - Add `GITHUB_TOKEN`
   - Add `GITHUB_REPO_OWNER`
   - Add `GITHUB_REPO_NAME`

2. **Set Up GitHub Webhooks** (optional)
   - Go to repository settings
   - Add webhook pointing to your server
   - Configure webhook secret

3. **Create Admin User**
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

4. **Access the Application**
   - Open browser: `http://localhost:3000`
   - Create your first ticket

## Security Considerations

### Automated Installers

- **Secrets are generated locally** - never transmitted
- **Secure random generation** using OpenSSL/crypto
- **.env file created** - never commit to version control
- **Default ports** can be changed in `.env`

### Docker Installation

- **Isolated environment** - reduces host exposure
- **Minimal attack surface** - only necessary ports exposed
- **Easy updates** - rebuild containers for updates
- **Volume encryption** - can encrypt Docker volumes

## Uninstallation

### Linux/macOS

```bash
# Stop MongoDB
sudo systemctl stop mongod

# Disable MongoDB
sudo systemctl disable mongod

# Remove MongoDB
sudo apt remove mongodb-org  # Debian/Ubuntu
sudo yum remove mongodb-org   # CentOS/RHEL

# Remove application files
rm -rf /path/to/GitHub-SHpportb-Support
```

### Windows

```bash
# Stop MongoDB service
net stop MongoDB

# Remove MongoDB service
sc delete MongoDB

# Uninstall MongoDB via Programs and Features
# Uninstall Node.js via Programs and Features

# Remove application files
rm -r nexus
```

### Docker

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (deletes data)
docker-compose down -v

# Remove images
docker rmi nexus-app
docker rmi mongo:6.0
```

## Next Steps

After successful installation:

1. Review [API Documentation](API.md)
2. Configure [GitHub Integration](SETUP.md#github-integration-setup)
3. Set up [Monitoring](DEPLOYMENT.md#monitoring-and-logging)
4. Configure [Backups](DEPLOYMENT.md#backup-and-recovery)
5. Deploy to [Production](DEPLOYMENT.md)

## Support

For installer-specific issues:

1. Check the console output for error messages
2. Review [Troubleshooting Guide](TROUBLESHOOTING.md)
3. Check platform-specific setup guides:
   - [Windows Setup](SETUP-WINDOWS.md)
   - [Linux Setup](SETUP-LINUX.md)
   - [macOS Setup](SETUP-MAC.md)
4. Open a GitHub issue with installer logs

## Advanced Usage

### Custom Installations

For custom installation requirements, you can:

1. Modify the installer scripts
2. Use manual installation from [Installation Guide](INSTALLATION.md#manual-installation-steps)
3. Use Docker with custom configurations
4. Use platform-specific package managers

### CI/CD Integration

Installers can be integrated into CI/CD pipelines:

**GitHub Actions:**
```yaml
- name: Install and Start
  run: |
    chmod +x install.sh
    ./install.sh
```

**Docker in CI/CD:**
```yaml
- name: Start with Docker
  run: |
    docker-compose up -d
```

## Updates

To update the system after automated installation:

```bash
# Pull latest code
git pull

# Update dependencies
npm install

# Restart application
pm2 restart nexus
# Or
docker-compose up -d --build
```

## Contributing

To improve the installers:

1. Fork the repository
2. Modify the installer script
3. Test on multiple platforms
4. Submit a pull request

Installer scripts are located in the project root:
- `install.sh` - Linux/macOS
- `install.ps1` - Windows
- `install.js` - Cross-platform Node.js
