# NEXUS Windows Setup Guide

Setup instructions for NEXUS Support System on Windows systems.

## Prerequisites

- Windows 10 or later
- Administrator privileges
- Internet connection

## Step 1: Install Node.js

1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Download the LTS version (recommended)
3. Run the installer
4. Follow the installation wizard
5. Restart your computer

**Verify installation:**
```powershell
node --version
npm --version
```

## Step 2: Install MongoDB

### Option A: MongoDB Community Server

1. Download MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Select Windows version
3. Download the MSI installer
4. Run the installer
5. Choose "Complete" installation
6. Install MongoDB Compass (optional)
7. Complete the installation

### Option B: MongoDB via Chocolatey

```powershell
# Install Chocolatey (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MongoDB
choco install mongodb
```

### Start MongoDB Service

```powershell
# Start MongoDB service
net start MongoDB

# Or run manually
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath C:\data\db
```

**Create data directory:**
```powershell
mkdir C:\data\db
```

### Verify MongoDB

```powershell
"C:\Program Files\MongoDB\Server\6.0\bin\mongo.exe"
> show dbs
```

## Step 3: Install Git (Optional)

1. Download Git from [git-scm.com](https://git-scm.com/)
2. Run the installer
3. Accept default settings
4. Complete installation

**Verify:**
```powershell
git --version
```

## Step 4: Clone or Download Repository

### Option A: Clone with Git

```powershell
git clone <repository-url>
cd nexus
```

### Option B: Download ZIP

1. Download repository as ZIP
2. Extract to folder
3. Navigate to folder:
```powershell
cd nexus
```

## Step 5: Install Dependencies

```powershell
npm install
```

## Step 6: Configure Environment

### Create .env File

```powershell
Copy .env.example .env
```

### Edit .env

Open `.env` in Notepad or your preferred editor:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/nexus-support
JWT_SECRET=your-secure-secret-here
```

### Generate Secure Secret

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

## Step 7: Start the Application

```powershell
npm start
```

Or for development with auto-restart:
```powershell
npm run dev
```

## Step 8: Access the System

Open your browser: `http://localhost:3000`

## Windows-Specific Considerations

### Firewall

You may need to allow Node.js through Windows Firewall:

1. Open Windows Defender Firewall
2. Allow Node.js through firewall
3. Allow port 3000

### Path Issues

If you encounter "command not found" errors:

1. Add Node.js to PATH:
   - Search "Environment Variables"
   - Edit system PATH
   - Add Node.js installation path (e.g., `C:\Program Files\nodejs`)

### MongoDB as Windows Service

Install MongoDB as Windows service for automatic startup:

```powershell
# Create config file
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\6.0\mongod.cfg" --install

# Start service
net start MongoDB
```

### Using PowerShell vs Command Prompt

Both work, but PowerShell is recommended for modern Windows.

## Common Windows Issues

### MongoDB Service Won't Start

**Solution:**
```powershell
# Check service status
sc query MongoDB

# Start service
net start MongoDB

# If fails, check logs in C:\data\db\mongod.log
```

### Port Already in Use

**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F
```

### npm Install Fails

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules
Remove-Item -Recurse -Force node_modules

# Install again
npm install
```

### Permission Issues

**Solution:**
- Run PowerShell as Administrator
- Check folder permissions
- Ensure write access to project directory

## Using Windows Terminal (Recommended)

For better experience, use Windows Terminal:

1. Install from Microsoft Store
2. Supports multiple tabs (PowerShell, CMD, WSL)
3. Better copy-paste support

## Next Steps

After successful setup:

- Configure [GitHub Integration](SETUP.md#github-integration-setup)
- Review [API Documentation](API.md)
- Deploy to production with [Deployment Guide](DEPLOYMENT.md)

## Troubleshooting

For Windows-specific issues:

1. Check Windows Event Viewer for service errors
2. Verify MongoDB service status
3. Check firewall settings
4. Review MongoDB logs in `C:\data\db\mongod.log`

For general issues, see [Troubleshooting Guide](TROUBLESHOOTING.md).
