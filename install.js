#!/usr/bin/env node

/**
 * NEXUS Support System - Cross-Platform Automated Installer
 * Supports: Linux, macOS, Windows
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function colorLog(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader() {
    colorLog('###############################################################################', 'blue');
    colorLog('# GitHub Support Ticket System - Automated Installer', 'blue');
    colorLog('###############################################################################', 'blue');
    console.log('');
}

function printStep(step) {
    colorLog(`[STEP] ${step}`, 'green');
}

function printError(error) {
    colorLog(`[ERROR] ${error}`, 'red');
}

function printWarning(warning) {
    colorLog(`[WARNING] ${warning}`, 'yellow');
}

function printSuccess(success) {
    colorLog(`[SUCCESS] ${success}`, 'green');
}

function detectOS() {
    printStep('Detecting Operating System');
    const platform = os.platform();
    let detectedOS = 'unknown';
    
    if (platform === 'linux') {
        detectedOS = 'linux';
        // Try to detect Linux distribution
        try {
            if (fs.existsSync('/etc/debian_version')) {
                detectedOS = 'debian';
            } else if (fs.existsSync('/etc/redhat-release')) {
                detectedOS = 'redhat';
            } else if (fs.existsSync('/etc/arch-release')) {
                detectedOS = 'arch';
            }
        } catch (e) {
            // Keep as linux
        }
    } else if (platform === 'darwin') {
        detectedOS = 'macos';
    } else if (platform === 'win32') {
        detectedOS = 'windows';
    }
    
    printSuccess(`Detected OS: ${detectedOS}`);
    return detectedOS;
}

function checkCommand(command) {
    try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

function checkDependencies() {
    printStep('Checking for required dependencies');
    
    const required = ['node', 'npm'];
    const missing = [];
    
    for (const cmd of required) {
        if (!checkCommand(cmd)) {
            missing.push(cmd);
        }
    }
    
    if (missing.length > 0) {
        printError(`Missing dependencies: ${missing.join(', ')}`);
        printError('Please install Node.js from https://nodejs.org/');
        process.exit(1);
    }
    
    printSuccess('All dependencies checked');
}

function installNpmDependencies() {
    printStep('Installing npm dependencies');
    
    try {
        execSync('npm install', { stdio: 'inherit' });
        printSuccess('npm dependencies installed');
    } catch (error) {
        printError('Failed to install npm dependencies');
        printError(error.message);
        process.exit(1);
    }
}

function generateSecrets() {
    printStep('Generating secure secrets');
    
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const webhookSecret = crypto.randomBytes(16).toString('hex');
    
    printSuccess('Secrets generated');
    
    return { jwtSecret, webhookSecret };
}

function createEnvFile(secrets) {
    printStep('Creating .env file');
    
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
        printWarning('.env file already exists. Backing up to .env.backup');
        fs.copyFileSync(envPath, path.join(process.cwd(), '.env.backup'));
    }
    
    const envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nexus-support

# GitHub Configuration
GITHUB_WEBHOOK_SECRET=${secrets.webhookSecret}
GITHUB_TOKEN=
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=

# JWT Secret
JWT_SECRET=${secrets.jwtSecret}
`;
    
    fs.writeFileSync(envPath, envContent);
    
    printSuccess('.env file created');
    printWarning('Please configure GitHub settings in .env file if needed');
}

function createMongoDataDir() {
    printStep('Creating MongoDB data directory');
    
    const platform = os.platform();
    let dataDir;
    
    if (platform === 'win32') {
        dataDir = 'C:\\data\\db';
    } else {
        dataDir = '/data/db';
    }
    
    try {
        if (!fs.existsSync(dataDir)) {
            if (platform === 'win32') {
                execSync(`mkdir "${dataDir}"`, { stdio: 'inherit' });
            } else {
                execSync(`sudo mkdir -p ${dataDir}`, { stdio: 'inherit' });
            }
            printSuccess(`MongoDB data directory created: ${dataDir}`);
        } else {
            printSuccess('MongoDB data directory already exists');
        }
    } catch (error) {
        printWarning('Could not create MongoDB data directory');
        printWarning('You may need to create it manually');
    }
}

function startMongoDB() {
    printStep('Starting MongoDB');
    
    const platform = os.platform();
    
    try {
        if (platform === 'linux') {
            execSync('sudo systemctl start mongod', { stdio: 'inherit' });
            printSuccess('MongoDB started via systemctl');
        } else if (platform === 'darwin') {
            execSync('brew services start mongodb-community', { stdio: 'inherit' });
            printSuccess('MongoDB started via brew services');
        } else if (platform === 'win32') {
            execSync('net start MongoDB', { stdio: 'inherit' });
            printSuccess('MongoDB started via Windows service');
        }
    } catch (error) {
        printWarning('Could not start MongoDB automatically');
        printWarning('Please start MongoDB manually');
    }
}

function runHealthCheck() {
    printStep('Running health check');
    
    return new Promise((resolve) => {
        const server = spawn('node', ['server.js']);
        let serverStarted = false;
        
        server.stdout.on('data', (data) => {
            if (data.toString().includes('Server running')) {
                serverStarted = true;
            }
        });
        
        setTimeout(async () => {
            try {
                const response = await fetch('http://localhost:3000/api/health');
                if (response.ok) {
                    printSuccess('Health check passed - Server is running');
                } else {
                    printError('Health check failed');
                }
            } catch (error) {
                printError('Health check failed - Server may not be running');
            }
            
            server.kill();
            resolve();
        }, 5000);
    });
}

function printPostInstall() {
    console.log('');
    colorLog('###############################################################################', 'green');
    colorLog('# Installation Complete!', 'green');
    colorLog('###############################################################################', 'green');
    console.log('');
    console.log('To start the application:');
    console.log('  npm start');
    console.log('');
    console.log('To start in development mode:');
    console.log('  npm run dev');
    console.log('');
    console.log('Access the application at:');
    console.log('  http://localhost:3000');
    console.log('');
    console.log('For GitHub integration, configure the following in .env:');
    console.log('  GITHUB_TOKEN=your_github_token');
    console.log('  GITHUB_REPO_OWNER=your_username');
    console.log('  GITHUB_REPO_NAME=your_repository');
    console.log('');
    console.log('Documentation available in docs/ directory');
    console.log('');
}

async function main() {
    printHeader();
    
    const detectedOS = detectOS();
    
    checkDependencies();
    installNpmDependencies();
    
    const secrets = generateSecrets();
    createEnvFile(secrets);
    
    // Ask about MongoDB setup
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const setupMongo = await new Promise(resolve => {
        readline.question('Setup MongoDB data directory? (Y/n): ', answer => {
            readline.close();
            resolve(answer.toLowerCase() !== 'n');
        });
    });
    
    if (setupMongo) {
        createMongoDataDir();
        startMongoDB();
    }
    
    const runHealth = await new Promise(resolve => {
        const rl = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Run health check? (Y/n): ', answer => {
            rl.close();
            resolve(answer.toLowerCase() !== 'n');
        });
    });
    
    if (runHealth) {
        await runHealthCheck();
    }
    
    printPostInstall();
}

// Run main function
main().catch(error => {
    printError(error.message);
    process.exit(1);
});
