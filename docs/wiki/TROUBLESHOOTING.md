# NEXUS Troubleshooting Guide

Common issues and solutions for NEXUS Support System.

## Installation Issues

### Issue: npm install fails

**Symptoms:**
- Error: "EACCES" permission denied
- Error: "Cannot find module"
- Installation hangs indefinitely

**Solutions:**

1. **Permission Issues**
   ```bash
   sudo chown -R $(whoami) ~/.npm
   sudo chown -R $(whoami) /usr/local/lib/node_modules
   ```

2. **Clear npm cache**
   ```bash
   npm cache clean --force
   ```

3. **Delete node_modules and reinstall**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Issue: MongoDB connection fails

**Symptoms:**
- Error: "MongoNetworkError"
- Error: "Connection timeout"
- Application hangs on startup

**Solutions:**

1. **Verify MongoDB is running**
   ```bash
   sudo systemctl status mongod
   sudo systemctl start mongod
   ```

2. **Check MongoDB URI in .env**
   ```env
   MONGODB_URI=mongodb://localhost:27017/nexus-support
   ```

3. **Test connection manually**
   ```bash
   mongo mongodb://localhost:27017/nexus-support
   ```

### Issue: Port already in use

**Symptoms:**
- Error: "EADDRINUSE: address already in use :::3000"

**Solutions:**

1. **Change port in .env**
   ```env
   PORT=3001
   ```

2. **Kill process using the port**
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

## Database Issues

### Issue: Collections not created

**Solutions:**

1. **Create collections manually**
   ```bash
   mongo
   > use nexus-support
   > db.createCollection('tickets')
   ```

2. **Verify database name in connection string**

### Issue: Duplicate key error

**Solutions:**

1. **Check for existing documents**
   ```bash
   mongo
   > use nexus-support
   > db.tickets.find({ ticketId: "TCK-ABC123" })
   ```

2. **Drop and recreate index**
   ```bash
   > db.tickets.dropIndex({ ticketId: 1 })
   ```

## API Issues

### Issue: 404 Not Found on endpoints

**Solutions:**

1. **Verify route is registered in server.js**
2. **Check URL path spelling**
3. **Verify server is running on correct port**

### Issue: CORS errors in browser

**Symptoms:**
- Browser console shows CORS errors
- Requests blocked by CORS policy

**Solutions:**

1. **Check CORS configuration in server.js**
2. **Add origin to allowed origins**
3. **For development, allow all origins temporarily**

## GitHub Integration Issues

### Issue: Webhook not received

**Symptoms:**
- Webhooks not processing
- No tickets created from GitHub issues

**Solutions:**

1. **Verify webhook URL is publicly accessible**
   - Use ngrok for local testing: `ngrok http 3000`

2. **Check webhook secret matches**
   - Verify in GitHub repository settings
   - Verify in .env file

3. **Review GitHub webhook delivery logs**
   - Go to repository Settings → Webhooks
   - Check recent deliveries

4. **Check server logs for errors**
   ```bash
   pm2 logs nexus
   ```

### Issue: GitHub API rate limit exceeded

**Symptoms:**
- Error: "API rate limit exceeded"
- Cannot sync tickets to GitHub

**Solutions:**

1. **Wait for rate limit reset** (typically 1 hour)
2. **Use authenticated requests** (higher limits)
3. **Implement rate limiting handling**
4. **Use GitHub Pro for higher limits**

## Authentication Issues

### Issue: JWT token invalid

**Symptoms:**
- Error: "Invalid token"
- Cannot access protected endpoints

**Solutions:**

1. **Verify JWT_SECRET is set in .env**
2. **Check token is being sent correctly**
   - Header: `Authorization: Bearer <token>`
3. **Verify token hasn't expired** (default: 7 days)
4. **Regenerate token by logging in again**

### Issue: Password hashing fails

**Solutions:**

1. **Verify bcryptjs is installed**
2. **Check password field in User model**

## Frontend Issues

### Issue: API calls failing from frontend

**Solutions:**

1. **Check browser console for errors**
2. **Verify API_BASE URL is correct**
3. **Check CORS configuration**
4. **Verify server is running**

### Issue: Page not loading styles

**Solutions:**

1. **Clear browser cache**
2. **Check static file serving in server.js**
3. **Verify file paths are correct**

## Performance Issues

### Issue: Slow API responses

**Solutions:**

1. **Add database indexes**
2. **Implement pagination**
3. **Enable response compression**
4. **Use caching for frequently accessed data**

### Issue: High memory usage

**Solutions:**

1. **Check for memory leaks**
2. **Implement connection pooling**
3. **Limit concurrent requests**
4. **Use PM2 clustering**

## Getting Help

If issues persist:

1. Check server logs: `pm2 logs nexus`
2. Review MongoDB logs
3. Check GitHub webhook delivery logs
4. Review this documentation
5. Check GitHub Issues
6. Contact support team
