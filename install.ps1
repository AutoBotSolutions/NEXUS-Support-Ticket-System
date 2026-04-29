###############################################################################
# NEXUS Support System - Automated Installer
# Supports: Windows
###############################################################################

param(
    [switch]$SkipNode,
    [switch]$SkipMongo,
    [switch]$SkipDeps,
    [switch]$SkipEnv,
    [switch]$SkipMongoConfig,
    [switch]$SkipHealthCheck
)

# Error handling
$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    Write-ColorOutput "###############################################################################" "Cyan"
    Write-ColorOutput "# GitHub Support Ticket System - Automated Installer" "Cyan"
    Write-ColorOutput "###############################################################################" "Cyan"
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "[STEP] $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Green"
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-NodeJS {
    Write-Step "Installing Node.js"
    
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $installedVersion = node -v
        Write-Success "Node.js already installed: $installedVersion"
        $reinstall = Read-Host "Reinstall Node.js? (Y/N)"
        if ($reinstall -ne "Y") {
            return
        }
    }
    
    # Download Node.js installer
    $nodeUrl = "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    
    Write-Host "Downloading Node.js..."
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
    
    # Install Node.js
    Write-Host "Installing Node.js..."
    Start-Process msiexec.exe -ArgumentList "/i $nodeInstaller /quiet /norestart" -Wait
    
    # Cleanup
    Remove-Item $nodeInstaller -Force
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Success "Node.js installed: $(node -v)"
    Write-Success "npm installed: $(npm -v)"
}

function Install-MongoDB {
    Write-Step "Installing MongoDB"
    
    if (Get-Command mongod -ErrorAction SilentlyContinue) {
        Write-Success "MongoDB already installed"
        $reinstall = Read-Host "Reinstall MongoDB? (Y/N)"
        if ($reinstall -ne "Y") {
            return
        }
    }
    
    # Download MongoDB
    $mongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.13-signed.msi"
    $mongoInstaller = "$env:TEMP\mongo-installer.msi"
    
    Write-Host "Downloading MongoDB..."
    Invoke-WebRequest -Uri $mongoUrl -OutFile $mongoInstaller -UseBasicParsing
    
    # Install MongoDB
    Write-Host "Installing MongoDB..."
    Start-Process msiexec.exe -ArgumentList "/i $mongoInstaller /quiet /norestart INSTALLLOCATION=C:\MongoDB" -Wait
    
    # Create data directory
    $dataDir = "C:\data\db"
    if (!(Test-Path $dataDir)) {
        New-Item -ItemType Directory -Path $dataDir -Force
    }
    
    # Cleanup
    Remove-Item $mongoInstaller -Force
    
    # Install MongoDB as service
    $mongoBin = "C:\MongoDB\Server\6.0\bin\mongod.exe"
    if (Test-Path $mongoBin) {
        Start-Process $mongoBin -ArgumentList "--config C:\MongoDB\Server\6.0\bin\mongod.cfg --install" -Wait
        Start-Service MongoDB
        Set-Service -Name MongoDB -StartupType Automatic
    }
    
    Write-Success "MongoDB installed and started"
}

function Install-NpmDependencies {
    Write-Step "Installing npm dependencies"
    
    npm install
    
    Write-Success "npm dependencies installed"
}

function Generate-Secrets {
    Write-Step "Generating secure secrets"
    
    $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
    $webhookSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
    
    $script:JWT_SECRET = $jwtSecret
    $script:WEBHOOK_SECRET = $webhookSecret
    
    Write-Success "Secrets generated"
}

function Create-EnvFile {
    Write-Step "Creating .env file"
    
    if (Test-Path .env) {
        Write-Warning ".env file already exists. Backing up to .env.backup"
        Move-Item .env .env.backup -Force
    }
    
    $envContent = @"
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nexus-support

# GitHub Configuration
GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET
GITHUB_TOKEN=
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=

# JWT Secret
JWT_SECRET=$JWT_SECRET
"@
    
    $envContent | Out-File -FilePath .env -Encoding UTF8
    
    Write-Success ".env file created"
    Write-Warning "Please configure GitHub settings in .env file if needed"
}

function Configure-MongoDB {
    Write-Step "Configuring MongoDB"
    
    # Wait for MongoDB to be ready
    Start-Sleep -Seconds 3
    
    # Create database and collections
    $mongoCmd = "C:\MongoDB\Server\6.0\bin\mongo.exe"
    if (Test-Path $mongoCmd) {
        & $mongoCmd --eval "use nexus-support; db.createCollection('tickets'); db.createCollection('users');" 2>$null
    }
    
    Write-Success "MongoDB configured"
}

function Start-Services {
    Write-Step "Starting services"
    
    # Check if MongoDB service is running
    $mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
    if ($mongoService -and $mongoService.Status -ne "Running") {
        Write-Warning "MongoDB not running, starting..."
        Start-Service MongoDB
    }
    
    Write-Success "Services started"
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Run-HealthCheck {
    Write-Step "Running health check"
    
    # Start the application in background
    $process = Start-Process node -ArgumentList "server.js" -PassThru -NoNewWindow
    $logFile = "$env:TEMP\nexus.log"
    
    # Wait for server to start
    Start-Sleep -Seconds 5
    
    # Check if server is responding
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Health check passed - Server is running"
        }
    } catch {
        Write-Error "Health check failed - Server may not be running"
        Write-Error "Check logs: $logFile"
    }
    
    # Stop the server
    Stop-Process -Id $process.Id -Force
}

function Show-PostInstall {
    Write-Host ""
    Write-ColorOutput "###############################################################################" "Green"
    Write-ColorOutput "# Installation Complete!" "Green"
    Write-ColorOutput "###############################################################################" "Green"
    Write-Host ""
    Write-Host "To start the application:"
    Write-Host "  npm start"
    Write-Host ""
    Write-Host "To start in development mode:"
    Write-Host "  npm run dev"
    Write-Host ""
    Write-Host "Access the application at:"
    Write-Host "  http://localhost:3000"
    Write-Host ""
    Write-Host "For GitHub integration, configure the following in .env:"
    Write-Host "  GITHUB_TOKEN=your_github_token"
    Write-Host "  GITHUB_REPO_OWNER=your_username"
    Write-Host "  GITHUB_REPO_NAME=your_repository"
    Write-Host ""
    Write-Host "Documentation available in docs/ directory"
    Write-Host ""
}

# Main installation flow
function Main {
    Write-Header
    
    # Check for administrator privileges
    if (-not (Test-Administrator)) {
        Write-Warning "This script requires administrator privileges"
        Write-Warning "Please run PowerShell as Administrator"
        $continue = Read-Host "Continue anyway? (Y/N)"
        if ($continue -ne "Y") {
            exit
        }
    }
    
    # Install Node.js
    if (-not $SkipNode) {
        $installNode = Read-Host "Install Node.js? (Y/N)"
        if ($installNode -eq "Y") {
            Install-NodeJS
        }
    }
    
    # Install MongoDB
    if (-not $SkipMongo) {
        $installMongo = Read-Host "Install MongoDB? (Y/N)"
        if ($installNode -eq "Y") {
            Install-MongoDB
        }
    }
    
    # Install npm dependencies
    if (-not $SkipDeps) {
        Install-NpmDependencies
    }
    
    # Generate secrets
    Generate-Secrets
    
    # Create .env file
    if (-not $SkipEnv) {
        Create-EnvFile
    }
    
    # Configure MongoDB
    if (-not $SkipMongoConfig) {
        Configure-MongoDB
    }
    
    # Start services
    Start-Services
    
    # Run health check
    if (-not $SkipHealthCheck) {
        Run-HealthCheck
    }
    
    # Show post-install information
    Show-PostInstall
}

# Run main function
Main
