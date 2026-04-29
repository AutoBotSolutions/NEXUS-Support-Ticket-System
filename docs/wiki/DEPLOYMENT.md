# NEXUS Deployment Guide

This guide covers deploying NEXUS Support System to production environments.

## Table of Contents

- [Deployment Options](#deployment-options)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Configuration](#environment-configuration)
- [Deploying to VPS](#deploying-to-vps)
- [Deploying to Cloud Platforms](#deploying-to-cloud-platforms)
- [Deploying with Docker](#deploying-with-docker)
- [Database Setup](#database-setup)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Security Hardening](#security-hardening)

## Deployment Options

### Recommended Platforms

1. **VPS (Virtual Private Server)**
   - DigitalOcean
   - Linode
   - AWS EC2
   - Google Compute Engine

2. **Platform as a Service (PaaS)**
   - Heroku
   - Render
   - Railway
   - Fly.io

3. **Container Services**
   - AWS ECS
   - Google Cloud Run
   - Azure Container Instances

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Update all dependencies to latest versions
- [ ] Set strong secrets for JWT and webhook
- [ ] Configure production MongoDB instance
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up logging and monitoring
- [ ] Configure backup strategy
- [ ] Test all functionality in staging
- [ ] Review and update `.gitignore`
- [ ] Remove development dependencies from production
- [ ] Set up GitHub webhooks with production URL
- [ ] Configure error tracking (Sentry, etc.)

## Environment Configuration

### Production Environment Variables

Create a production `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexus-support?retryWrites=true&w=majority

# GitHub Configuration
GITHUB_WEBHOOK_SECRET=<generate-secure-random-string>
GITHUB_TOKEN=<github-personal-access-token>
GITHUB_REPO_OWNER=<your-github-username>
GITHUB_REPO_NAME=<your-repository-name>

# JWT Secret
JWT_SECRET=<generate-secure-random-string>

# Domain Configuration (if needed)
DOMAIN=https://yourdomain.com
```

### Generating Secure Secrets

```bash
# Generate webhook secret (32 bytes hex)
openssl rand -hex 32

# Generate JWT secret (64 bytes hex)
openssl rand -hex 64
```

## Deploying to VPS

### Step 1: Provision Server

Choose a VPS provider and create a server with:
- Ubuntu 20.04 LTS or newer
- Minimum 2GB RAM
- 20GB SSD storage

### Step 2: Connect to Server

```bash
ssh root@your-server-ip
```

### Step 3: Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Git
apt install -y git
```

### Step 4: Configure MongoDB

```bash
# Start MongoDB
systemctl start mongod
systemctl enable mongod

# Enable authentication (optional but recommended)
mongo
> use admin
> db.createUser({
  user: "admin",
  pwd: "secure-password",
  roles: ["root"]
})
> exit

# Edit MongoDB config to enable authentication
nano /etc/mongod.conf

# Add security section
security:
  authorization: enabled

# Restart MongoDB
systemctl restart mongod
```

### Step 5: Deploy Application

```bash
# Clone repository
git clone <your-repository-url>
cd nexus

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add your production environment variables

# Start application with PM2
pm2 start server.js --name nexus

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

### Step 6: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/nexus
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/githhb-uupportb-support /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 7: Configure SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure Nginx
```

## Deploying to Cloud Platforms

### Heroku

1. **Create Heroku Account**
   - Sign up at heroku.com

2. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

3. **Login to Heroku**
   ```bash
   heroku login
   ```

4. **Create App**
   ```bash
   heroku create your-app-name
   ```

5. **Add MongoDB Add-on**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

6. **Set Environment Variables**
   ```bash
   heroku config:set GITHUB_WEBHOOK_SECRET=your-secret
   heroku config:set GITHUB_TOKEN=your-token
   heroku config:set GITHUB_REPO_OWNER=your-username
   heroku config:set GITHUB_REPO_NAME=your-repo
   heroku config:set JWT_SECRET=your-jwt-secret
   ```

7. **Deploy**
   ```bash
   git push heroku main
   ```

8. **Scale Dynos**
   ```bash
   heroku ps:scale web=1
   ```

### Render

1. **Create Render Account**
   - Sign up at render.com

2. **Connect GitHub Repository**
   - Link your repository to Render

3. **Configure Web Service**
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`

4. **Add Environment Variables**
   - Add all required environment variables in Render dashboard

5. **Deploy**
   - Render will auto-deploy on push to main branch

### Railway

1. **Create Railway Account**
   - Sign up at railway.app

2. **New Project**
   - Click "New Project" → "Deploy from GitHub repo"

3. **Add MongoDB**
   - Add MongoDB database from Railway marketplace

4. **Configure Variables**
   - Add environment variables in Railway dashboard

5. **Deploy**
   - Railway will auto-deploy

## Deploying with Docker

### Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Create .dockerignore

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
docs
```

### Build Docker Image

```bash
docker build -t nexus:latest .
```

### Run Docker Container

```bash
docker run -d \
  --name nexus \
  -p 3000:3000 \
  --env-file .env \
  nexus:latest
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/nexus-support
      - GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GITHUB_REPO_OWNER=${GITHUB_REPO_OWNER}
      - GITHUB_REPO_NAME=${GITHUB_REPO_NAME}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    volumes:
      - mongodb-data:/data/db
    restart: unless-stopped

volumes:
  mongodb-data:
```

Run with Docker Compose:

```bash
docker-compose up -d
```

## Database Setup

### MongoDB Atlas (Cloud)

1. **Create Atlas Account**
   - Sign up at mongodb.com/cloud/atlas

2. **Create Cluster**
   - Choose cluster tier (M0 free for development)
   - Select region closest to your users

3. **Configure Security**
   - Whitelist IP addresses (0.0.0.0/0 for all, or specific IPs)
   - Create database user with username and password

4. **Get Connection String**
   - Copy connection string from Atlas dashboard
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database`

5. **Update Environment Variables**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexus-support?retryWrites=true&w=majority
   ```

### Self-Hosted MongoDB

For production, consider:
- Replica sets for high availability
- Sharding for large datasets
- Regular backups
- Monitoring with MongoDB Ops Manager

## SSL/HTTPS Configuration

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
apt install -y certbot

# Obtain certificate
certbot certonly --standalone -d yourdomain.com

# Certificate location:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Configure Nginx with SSL

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

### Auto-renew Certificates

Certbot automatically sets up renewal:

```bash
# Test renewal
certbot renew --dry-run

# Renewal is automatic via cron
```

## Monitoring and Logging

### PM2 Monitoring

```bash
# View real-time metrics
pm2 monit

# View logs
pm2 logs nexus

# View log file location
pm2 show nexus
```

### Application Logging

Add Winston or similar logging library:

```bash
npm install winston
```

Configure logger in `server.js`:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### External Monitoring Services

- **Sentry**: Error tracking and performance monitoring
- **Loggly**: Log aggregation and analysis
- **Datadog**: Full-stack monitoring
- **New Relic**: Application performance monitoring

### MongoDB Monitoring

Use MongoDB Atlas built-in monitoring or:
- MongoDB Ops Manager
- Percona Monitoring and Management (PMM)

## Backup and Recovery

### MongoDB Backup

#### Manual Backup

```bash
# Create backup
mongodump --uri="mongodb://username:password@host:port/database" --out=/backup/path

# Restore backup
mongorestore --uri="mongodb://username:password@host:port/database" /backup/path
```

#### Automated Backup Script

Create backup script:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
MONGODB_URI="mongodb://username:password@host:port/database"

mkdir -p $BACKUP_DIR
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

Add to crontab:

```bash
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

#### MongoDB Atlas Backup

Atlas provides automated backups:
- Enable in Atlas dashboard
- Configure retention period
- Set up point-in-time recovery

### Application Backup

Backup application files:

```bash
# Backup application
tar -czf nexus-backup.tar.gz /path/to/nexus

# Backup environment variables
cp .env .env.backup
```

## Security Hardening

### Firewall Configuration

```bash
# Install UFW
apt install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

### Application Security

1. **Update dependencies regularly**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Use Helmet for security headers**
   - Already configured in `server.js` with explicit Content Security Policy
   - HSTS enabled with 1-year max age

3. **Implement rate limiting**
   - General rate limiting: 100 requests per 15 minutes per IP
   - Login rate limiting: 5 attempts per 15 minutes per IP
   - Already configured in `server.js`

4. **Validate all inputs**
   - Use Mongoose validators
   - Use validator library for email validation
   - Password complexity requirements enforced (8+ chars, uppercase, lowercase, number, special char)
   - Input sanitization with express-mongo-sanitize, xss-clean, and hpp

5. **Secure environment variables**
   - Never commit `.env`
   - Use secrets management in production (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Set `NODE_ENV=production` in production
   - Use strong, random secrets for JWT_SECRET and GITHUB_WEBHOOK_SECRET

6. **Enable CORS only for trusted origins**
   - Configure `CORS_ORIGIN` environment variable to specific domains
   - Never use wildcard (*) in production

7. **HTTPS enforcement**
   - Automatically enabled when `NODE_ENV=production`
   - Requires reverse proxy (Nginx/Apache) with SSL certificates
   - HSTS preload enabled

8. **MongoDB SSL/TLS**
   - Enable MongoDB SSL/TLS in production
   - Configure SSL/TLS options in environment variables:
     - `MONGODB_SSL=true`
     - `MONGODB_TLS=true`
     - Set CA file path for certificate verification
   - Use connection string with `mongodb+srv://` for Atlas

9. **Security audit logging**
   - Logs written to `logs/security.log`
   - Monitor logs regularly for suspicious activities
   - Set up log rotation to prevent disk space issues
   - Configure alerts for failed login attempts

10. **Body size limits**
    - 10kb limit on request bodies
    - Prevents large payload attacks

### MongoDB Security

1. **Enable authentication**
   - Create database users
   - Use strong passwords

2. **Enable network encryption**
   - Use TLS/SSL connections

3. **Restrict network access**
   - Use IP whitelisting
   - Use VPN for admin access

4. **Enable audit logging**
   - Monitor database access

## Performance Optimization

### Node.js

1. **Use clustering with PM2**
   ```bash
   pm2 start server.js -i max
   ```

2. **Enable gzip compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

3. **Implement caching**
   - Cache frequently accessed data
   - Use Redis for session storage

### MongoDB

1. **Create indexes**
   ```javascript
   ticketSchema.index({ ticketId: 1 });
   ticketSchema.index({ status: 1, createdAt: -1 });
   ```

2. **Use connection pooling**
   ```javascript
   mongoose.connect(uri, {
     poolSize: 10,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000
   });
   ```

## Scaling

### Horizontal Scaling

1. **Load Balancer**
   - Use Nginx as load balancer
   - Distribute traffic across multiple instances

2. **Session Storage**
   - Use Redis for session storage
   - Share sessions across instances

3. **Database**
   - Use MongoDB replica sets
   - Consider sharding for large datasets

### Vertical Scaling

1. **Increase server resources**
   - More CPU cores
   - More RAM
   - Faster storage (SSD)

## Troubleshooting Deployment Issues

### Application Won't Start

1. Check logs: `pm2 logs nexus`
2. Verify environment variables
3. Check MongoDB connection
4. Verify port availability

### Database Connection Issues

1. Verify MongoDB URI
2. Check firewall rules
3. Verify MongoDB is running
4. Check authentication credentials

### Webhook Not Working

1. Verify webhook URL is accessible
2. Check webhook secret
3. Review GitHub webhook delivery logs
4. Check server logs

### SSL Certificate Issues

1. Verify domain DNS configuration
2. Check certificate expiration
3. Renew certificate if needed
4. Verify Nginx configuration

## Post-Deployment

1. **Update GitHub Webhooks**
   - Change webhook URL to production domain
   - Update webhook secret if changed

2. **Test All Functionality**
   - Create test ticket
   - Test GitHub sync
   - Test authentication
   - Test webhook processing

3. **Set Up Monitoring**
   - Configure alerts
   - Set up log aggregation
   - Enable performance monitoring

4. **Document Deployment**
   - Record deployment steps
   - Document configuration
   - Update team documentation

## Maintenance

### Regular Tasks

- Weekly: Review logs for errors
- Monthly: Update dependencies
- Monthly: Review and rotate secrets
- Quarterly: Review backup strategy
- Quarterly: Security audit

### Update Process

1. Test updates in staging
2. Create backup before update
3. Deploy updates during low-traffic periods
4. Monitor after deployment
5. Roll back if issues occur

## Support

For deployment issues:
- Check platform-specific documentation
- Review troubleshooting guide
- Contact support team
- Check GitHub issues
