# NEXUS macOS Setup Guide

Setup instructions for NEXUS Support System on macOS systems.

## Prerequisites

- macOS 10.14 (Mojave) or later
- Xcode Command Line Tools
- Homebrew (recommended)
- Administrator privileges

## Step 1: Install Xcode Command Line Tools

```bash
xcode-select --install
```

Accept the license agreement when prompted.

## Step 2: Install Homebrew (Recommended)

Homebrew makes installing software on macOS much easier.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Verify installation:**
```bash
brew --version
```

## Step 3: Install Node.js

### Option A: Using Homebrew (Recommended)

```bash
brew install node

# Verify installation
node --version
npm --version
```

### Option B: Using Node Version Manager (NVM)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load NVM
source ~/.bashrc
# Or for zsh
source ~/.zshrc

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify
node --version
npm --version
```

### Option C: Official Installer

Download from [nodejs.org](https://nodejs.org/) and run the installer.

## Step 4: Install MongoDB

### Option A: Using Homebrew (Recommended)

```bash
# Tap MongoDB repository
brew tap mongodb/brew

# Install MongoDB Community
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Enable MongoDB to start on boot
brew services enable mongodb-community

# Verify status
brew services list
```

### Option B: Using Docker

```bash
# Install Docker Desktop for Mac
# Download from docker.com

# Run MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo:6.0
```

### Option C: Manual Installation

1. Download MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Download macOS tgz archive
3. Extract to `/usr/local`
4. Create data directory:
```bash
sudo mkdir -p /data/db
sudo chown -R $(whoami) /data/db
```

5. Start MongoDB:
```bash
mongod --dbpath /data/db
```

### Verify MongoDB

```bash
mongo
> show dbs
> exit
```

## Step 5: Install Git

### Using Homebrew

```bash
brew install git

# Verify
git --version
```

Git is usually pre-installed on macOS. Check with `git --version`.

## Step 6: Clone Repository

```bash
git clone <repository-url>
cd GitHHb-Supportb-Support
```

## Step 7: Install Dependencies

```bash
npm install
```

## Step 8: Configure Environment

### Create .env File

```bash
cp .env.example .env
```

### Edit .env

```bash
nano .env
# Or use VS Code
code .env
```

Add your configuration:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/githhbb-support
JWT_SECRET=your-secure-secret-here
```

### Generate Secure Secret

```bash
openssl rand -hex 64
```

Save and exit (Ctrl+X, then Y, then Enter for nano).

## Step 9: Start the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Using PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name githhb-uupportb-support

# Configure to start on boot
pm2 startup
pm2 save
```

### Using LaunchAgent (macOS Native)

Create a LaunchAgent plist file:

```bash
nano ~/Library/LaunchAgents/com.githhb-uupportb-support.plist
```

Add:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.nexus</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/nexus/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/path/to/nexus</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
```

Load the LaunchAgent:

```bash
launchctl load ~/Library/LaunchAgents/com.nexus.plist
```

## Step 10: Access the System

Open your browser: `http://localhost:3000`

## macOS-Specific Considerations

### Firewall

If macOS firewall is enabled, you may need to allow Node.js:

1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add Node.js or allow incoming connections

### Gatekeeper

If you encounter Gatekeeper issues:

```bash
# Allow application to run
xattr -cr /path/to/application
```

### File Permissions

```bash
# Fix permissions if needed
chmod -R 755 /path/to/nexus
```

### Using zsh vs bash

macOS Catalina and later use zsh by default. Ensure your shell profile is configured:

```bash
# For zsh (default on modern macOS)
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile
```

### MongoDB with Homebrew Services

Manage MongoDB with Homebrew services:

```bash
# Start MongoDB
brew services start mongodb-community

# Stop MongoDB
brew services stop mongodb-community

# Restart MongoDB
brew services restart mongodb-community

# Check status
brew services list
```

## Common macOS Issues

### Command Not Found

**Solution:**
```bash
# Add Homebrew to PATH
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### MongoDB Won't Start

**Solution:**
```bash
# Check MongoDB status
brew services list

# Restart MongoDB
brew services restart mongodb-community

# Check logs
tail -f /usr/local/var/log/mongodb/mongo.log

# Fix permissions
sudo chown -R $(whoami) /usr/local/var/mongodb
```

### Port Already in Use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### npm Install Fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Install again
npm install
```

### Xcode Command Line Tools Missing

**Solution:**
```bash
xcode-select --install
```

### Homebrew Installation Fails

**Solution:**
```bash
# Update Xcode command line tools
sudo xcode-select --reset

# Try Homebrew installation again
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Performance Tuning

### MongoDB Configuration

Edit Homebrew MongoDB configuration:

```bash
nano /usr/local/etc/mongod.conf
```

Add memory configuration:

```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2
```

Restart MongoDB:
```bash
brew services restart mongodb-community
```

## Monitoring

### Using PM2 Monitor

```bash
pm2 monit
```

### Using Activity Monitor

1. Open Activity Monitor
2. Search for "node" or "mongod"
3. Monitor CPU and memory usage

### Using Console App

1. Open Console app
2. View system logs
3. Filter for "node" or application name

## Next Steps

After successful setup:

- Configure [GitHub Integration](SETUP.md#github-integration-setup)
- Set up [LaunchAgent](#using-launchagent-macos-native)
- Configure [Monitoring](#monitoring)
- Deploy to production with [Deployment Guide](DEPLOYMENT.md)

## Troubleshooting

For macOS-specific issues:

1. Check Homebrew services status
2. Review Console app logs
3. Check Activity Monitor
4. Verify firewall settings
5. Check Gatekeeper settings

For general issues, see [Troubleshooting Guide](TROUBLESHOOTING.md).

## Additional macOS Tools

### iTerm2 (Terminal Replacement)

Recommended terminal emulator with better features:

```bash
brew install --cask iterm2
```

### Visual Studio Code

Recommended code editor:

```bash
brew install --cask visual-studio-code
```

### Postico (MongoDB GUI)

MongoDB GUI client:

```bash
brew install --cask postico
```

### MongoDB Compass

Official MongoDB GUI:

```bash
brew install --cask mongodb-compass
```
