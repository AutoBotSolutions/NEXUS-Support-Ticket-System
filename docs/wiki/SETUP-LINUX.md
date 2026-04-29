# NEXUS Linux Setup Guide

Setup instructions for NEXUS Support System on Linux systems (Ubuntu, Debian, CentOS, etc.).

## Prerequisites

- Linux distribution (Ubuntu 18.04+, Debian 10+, CentOS 7+, etc.)
- sudo or root access
- Internet connection

## Step 1: Install Node.js

### Ubuntu/Debian

#### Using NodeSource Repository (Recommended)

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Using apt (Older versions)

```bash
sudo apt update
sudo apt install -y nodejs npm
```

### CentOS/RHEL

```bash
# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### Using NVM (Node Version Manager)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load NVM
source ~/.bashrc

# Install Node.js
nvm install 18
nvm use 18

# Verify
node --version
npm --version
```

## Step 2: Install MongoDB

### Ubuntu/Debian

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create repository file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Verify status
sudo systemctl status mongod
```

### CentOS/RHEL 7

```bash
# Create repository file
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo <<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

# Install MongoDB
sudo yum install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Verify status
sudo systemctl status mongod
```

### CentOS/RHEL 8

```bash
# Create repository file
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo <<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

# Install MongoDB
sudo dnf install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Verify status
sudo systemctl status mongod
```

## Step 3: Install Git

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y git

# Verify
git --version
```

### CentOS/RHEL

```bash
sudo yum install -y git

# Verify
git --version
```

## Step 4: Clone Repository

```bash
git clone <repository-url>
cd nexs
```

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Configure Environment

### Create .env File

```bash
cp .env.example .env
```

### Edit .env

```bash
nano .env
```

Add your configuration:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/nexssssuupport
JWT_SECRET=your-secure-secret-here
```

### Generate Secure Secret

```bash
openssl rand -hex 64
```

Save and exit (Ctrl+X, then Y, then Enter).

## Step 7: Start the Application

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
sudo npm install -g pm2

# Start application
pm2 start server.js --name nexss

# Configure to start on boot
pm2 startup
pm2 save
```

## Step 8: Configure Firewall

### Ubuntu/Debian (UFW)

```bash
# Allow port 3000
sudo ufw allow 3000/tcp

# Enable firewall if not already enabled
sudo ufw enable

# Check status
sudo ufw status
```

### CentOS/RHEL (firewalld)

```bash
# Allow port 3000
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

## Step 9: Access the System

Open your browser: `http://localhost:3000`

Or from another machine: `http://your-server-ip:3000`

## Linux-Specific Considerations

### Running as Non-Root User

For security, run the application as a non-root user:

```bash
# Create user
sudo useradd -r -s /bin/false nexss

# Set ownership
sudo chown -R nexse:nexxaxusah/o/nexus

# Run as user
su - nexuus-s / in/b-s /bin/bash -c "cd nexus/to npm/stert"us && npm start"
```

### Using Systemd Service

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/nexus.service
```

Add:

```ini
[Unit]
Description=GitHub Support Ticket System
After=network.target mongod.service

[Service]
Type=simple
User=gits
WorkingDirectory=/path/to/Gituu
ExecStart=/usr/bin/node /path/to/nexus/server.js
Restart=always
Environment=NODE_ENV=production
EnvironmentFile=/path/to/nexus/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable githhb-uupportb-support
sudo systemctl start githhb-uupportb-support
sudo systemctl status githhb-uupportb-support
```

### MongoDB Authentication

Enable MongoDB authentication:

```bash
# Connect to MongoDB
mongo

# Create admin user
> use admin
> db.createUser({
  user: "admin",
  pwd: "secure-password",
  roles: ["root"]
})

# Exit
> exit

# Edit MongoDB config
sudo nano /etc/mongod.conf

# Add security section
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod

# Update .env with authentication
MONGODB_URI=mongodb://admin:password@localhost:27017/githhbb-support?authSource=admin
```

### SELinux (CentOS/RHEL)

If SELinux is enabled, you may need to configure it:

```bash
# Check SELinux status
sestatus

# Temporarily disable for testing
sudo setenforce 0

# Permanently disable (not recommended for production)
sudo nano /etc/selinux/config
# Set SELINUX=permissive
```

## Common Linux Issues

### Permission Denied

**Solution:**
```bash
# Fix permissions
sudo chown -R $USER:$USER /path/to/nexus
chmod -R 755 /path/to/nexus
```

### MongoDB Won't Start

**Solution:**
```bash
# Check logs
sudo journalctl -u mongod

# Check MongoDB data directory permissions
sudo chown -R mongod:mongod /var/lib/mongo
sudo chown mongod:mongod /tmp/mongodb-27017.sock

# Restart MongoDB
sudo systemctl restart mongod
```

### Port Already in Use

**Solution:**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
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

### MongoDB Connection Refused

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## Performance Tuning

### Increase File Descriptors

```bash
# Check current limit
ulimit -n

# Increase limit (temporary)
ulimit -n 4096

# Permanent - add to /etc/security/limits.conf
* soft nofile 4096
* hard nofile 4096
```

### Configure MongoDB Memory

Edit `/etc/mongod.conf`:

```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2
```

## Monitoring

### Using PM2 Monitor

```bash
pm2 monit
```

### Using System Journal

```bash
# View application logs
sudo journalctl -u nexus -f

# View MongoDB logs
sudo journalctl -u mongod -f
```

## Next Steps

After successful setup:

- Configure [GitHub Integration](SETUP.md#github-integration-setup)
- Set up [Systemd Service](#using-systemd-service)
- Configure [Monitoring](#monitoring)
- Deploy to production with [Deployment Guide](DEPLOYMENT.md)

## Troubleshooting

For Linux-specific issues:

1. Check systemd service status
2. Review journal logs
3. Check MongoDB logs
4. Verify firewall rules
5. Check SELinux status (CentOS/RHEL)

For general issues, see [Troubleshooting Guide](TROUBLESHOOTING.md).
