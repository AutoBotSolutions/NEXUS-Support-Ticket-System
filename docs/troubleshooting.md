NEXUS Monitoring System Troubleshooting Guide

Common Issues and Solutions

This guide covers common issues that may arise with the NEXUS monitoring system and their solutions. Application Startup Issues

Issue: Application Fails to Start
Symptoms: Application crashes on startup
"Cannot find module" errors
Port already in use errors

Solutions: Check if port is in use
sudo netstat -tulpn | grep :3000Kill process using port 3000
sudo kill -9 <PID>Install missing dependencies
npm install

Check Node.js version
node --version  # Should be v18.0 or higher

Clear npm cache
npm cache clean --force
npm install

Issue: MongoDB Connection Failed
Symptoms:
"connect ECONNREFUSED ::1:27017"
Application crashes during startup
Database health check fails

Solutions: Option 1: Start MongoDB with Docker
docker run -d -p 27017:27017 --name nexus-mongo mongo

Option 2: Install MongoDB locally
sudo apt update
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb

Option 3: Use in-memory fallback (already implemented)
The application will automatically fallback to in-memory storage

Issue: Environment Variables Not Found
Symptoms:
"NEW_RELIC_LICENSE_KEY not configured"
Missing configuration warnings

Solutions: Copy environment templates
cp .env.example .env
cp .env.alerting.example .env.alerting

Edit environment variables
nano .env

Set required variables
NODE_ENV=production
PORT=3000
Add other variables as needed

Monitoring Issues

Issue: Metrics Endpoint Not Working
Symptoms:
/metrics returns 404 error
Prometheus cannot scrape metrics
No data in Grafana

Solutions: Check if application is running
curl http://127.0.0.1:41663/api/health

Verify metrics endpoint
curl http://127.0.0.1:41663/metrics

Check application logs
pm2 logs nexus-support-system
or
node server-standalone.js

Issue: Prometheus Not Scraping Metrics
Symptoms: Prometheus shows "up" but no data
Targets show "connection refused"Solutions: Check Prometheus configuration
cat monitoring/prometheus.yml

Verify target configuration
Should include:
job_name: 'nexus-app'
static_configs:
targets: ['host.docker.internal:3000']Restart Prometheus
docker-compose restart prometheus

Check Prometheus logs
docker-compose logs prometheus

Issue: Grafana Dashboard Not Loading
Symptoms: Dashboard shows "Data source not found"
No data in panels
Connection errors

Solutions: Check Grafana configuration
curl http://localhost:3001/api/health

Verify Prometheus data source
Go to http://localhost:3001
Configuration > Data Sources
Check Prometheus connection
URL should be: http://prometheus:9090Import dashboard manually
Go to Dashboards > Import
Upload dashboards/nexus-dashboard.json

Security Issues

Issue: Security Dashboard Not Showing Data
Symptoms: Empty security events
No threat detection data
Dashboard shows zeros

Solutions: Check security monitoring middleware
ls -la middleware/security

Monitoring.js

Test security endpoint
curl http://127.0.0.1:41663/api/security/dashboard

Verify security middleware is loaded
Check server-standalone.js includes security monitoring

Issue: False Positives in Threat Detection
Symptoms: Too many security alerts
Legitimate traffic flagged as suspicious
IP blocking affecting users

Solutions: Adjust threat detection thresholds
Edit middleware/security

Monitoring.js
Modify sensitivity parameters in detect

Threats function

Review alert rules
cat monitoring/alert_rules.yml
Adjust thresholds as needed

Business Intelligence Issues

Issue: KPI Dashboard Not Updating
Symptoms: Stale KPI data
No new analytics data
Trends not updating

Solutions: Test business analytics endpoint
curl http://127.0.0.1:41663/api/bi/analytics

Test KPI endpoint
curl http://127.0.0.1:41663/api/bi/kpi

Check business intelligence middleware
ls -la middleware/business

Intelligence.js

Verify data collection
Business intelligence runs hourly by default

Issue: Incorrect KPI Calculations
Symptoms: Wrong resolution rates
Inaccurate user counts
Incorrect trend data

Solutions: Reset analytics data
Delete debug-report.json if it exists
rm debug-report.json

Restart application to recalculate
pm2 restart nexus-support-system

Verify data sources
Check if tickets are being created properly
curl -X POST http://127.0.0.1:41663/api/tickets \
-H "Content-Type: application/json" \
-d '{"title":"Test Ticket","description":"Test","created

By":"Test","created

ByEmail":"test@example.com"}'Alerting Issues

Issue: Alerts Not Firing
Symptoms: No alerts when thresholds exceeded
Pager

Duty not receiving alerts
Slack notifications not working

Solutions: Check alert status
curl http://127.0.0.1:41663/api/alerts/status

Verify alert rules
cat monitoring/alert_rules.yml

Check environment variables
cat .env.alerting.example
Copy and configure actual values

Test notification channels
For Slack: Check webhook URL
curl -X POST $SLACK_WEBHOOK_URL \
-H 'Content-type: application/json' \
-d '{"text":"Test message"}'For Pager

Duty: Check integration key
Verify Pager

Duty integration key is valid

Issue: Alert Flooding
Symptoms: Too many alerts firing
Alert fatigue
Notification spam

Solutions: Adjust alert thresholds
Edit monitoring/alert_rules.yml
Increase threshold values or duration

Implement alert grouping
Edit middleware/alerting

System.js
Add alert deduplication logic

Enable alert suppression
Use silence endpoint for noisy alerts
curl -X POST http://127.0.0.1:41663/api/alerts/alert-id/silence \
-H "Content-Type: application/json" \
-d '{"duration": 3600000}'� Logging Issues

Issue: Logs Not Appearing in Kibana
Symptoms: No logs in Elasticsearch
Kibana shows no data
Logstash not receiving logs

Solutions: Check ELK stack status
docker-compose ps

Verify Elasticsearch health
curl http://localhost:9200/_cluster/health

Check Logstash logs
docker-compose logs logstash

Verify Filebeat configuration
cat logging/filebeat.yml

Restart ELK stack
docker-compose restart elasticsearch logstash kibana filebeat

Issue: Structured Logging Not Working
Symptoms: Logs appear as plain text
No structured fields
Search not working

Solutions: Check logging middleware
ls -la middleware/logging

Infrastructure.js

Verify log format
curl http://127.0.0.1:41663/api/logs/stats

Check Winston configuration
Ensure proper log levels and categories

Docker Issues

Issue: Docker Compose Fails to Start
Symptoms: Services fail to start
Port conflicts
Volume mount errors

Solutions: Check Docker status
sudo systemctl status docker

Clean up Docker resources
docker-compose down -v
docker system prune -f

Rebuild containers
docker-compose up -d --build

Check specific service logs
docker-compose logs app
docker-compose logs prometheus

Issue: Container Resource Limits
Symptoms: Containers keep restarting
Out of memory errors
Performance issues

Solutions: Check container resource usage
docker stats

Increase memory limits in docker-compose.yml
Add to service configuration:
mem_limit: 1g
memswap_limit: 1g

Restart with new limits
docker-compose up -d� Network Issues

Issue: Cannot Access Services
Symptoms: Connection refused errors
Timeouts
DNS resolution issues

Solutions: Check network connectivity
ping localhost
curl -I http://127.0.0.1:41663/Check firewall rules
sudo ufw status

Check port availability
sudo netstat -tulpn | grep :3000Verify Docker networking
docker network ls
docker network inspect nexus-network

Issue: Cross-Origin Requests
Symptoms: CORS errors in browser
API calls blocked
Frontend cannot access backend

Solutions: Check CORS configuration
Verify server-standalone.js includes:
app.use(cors({ origin: '', credentials: true }));Test with curl
curl -H "Origin: http://127.0.0.1:41663/" \
-H "Access-Control-Request-Method: GET" \
-H "Access-Control-Request-Headers: X-Requested-With" \
-X OPTIONS http://127.0.0.1:41663/api/health� Testing Issues

Issue: Monitoring Tests Failing
Symptoms: Debug script shows failures
Test endpoints not responding
False negatives

Solutions: Run individual tests
node debug-monitoring-systems.js

Check specific endpoint
curl -v http://127.0.0.1:41663/api/health

Verify application is running
ps aux | grep node

Check for syntax errors
node -c server-standalone.js

Issue: Load Test Failures
Symptoms: Load test crashes application
Performance degradation
Resource exhaustion

Solutions: Reduce load test intensity
Modify load-test.yml to lower arrival

Rate

Monitor resources during test
top
htop

Check application logs
pm2 logs nexus-support-system

Optimize application
Add connection pooling, caching, etc.� Frontend Issues

Issue: Frontend Monitoring Not Working
Symptoms: No performance metrics
Error tracking not working
Frontend script errors

Solutions: Check browser console
Open developer tools and check for Java

Script errors

Verify script inclusion
Check public/index.html includes:
<script src="/frontend-monitoring.js"></script>Test frontend monitoring
Open browser and navigate to application
Check Network tab for monitoring requests

Issue: Frontend Performance Issues
Symptoms: Slow page loads
High response times
Poor user experience

Solutions: Check frontend metrics
curl http://127.0.0.1:41663/api/monitoring/status

Optimize static files
Enable gzip compression
Minify CSS/JS files

Check CDN configuration
Verify static assets are served efficiently

Debugging Tools

Application Debugging
Enable debug logging
DEBUG= node server-standalone.js

Check process status
pm2 status
pm2 monit

Memory leak detection
node --inspect server-standalone.js

Network Debugging
Port scanning
nmap -p 3000,9090,3001 localhost

Connection testing
telnet localhost 3000
nc -zv localhost 3000DNS resolution
nslookup localhost
dig localhost

Performance Debugging
System performance
top
htop
iotop
vmstat
iostat

Application performance
pm2 monit
node --prof server-standalone.js� Getting Help

Log Analysis
Application logs
tail -f logs/application.log

Error logs
tail -f logs/error.log

Docker logs
docker-compose logs -f app

System logs
journalctl -u nexus -f

Health Monitoring
Comprehensive health check
curl http://127.0.0.1:41663/api/health && \
curl http://127.0.0.1:41663/api/health/database && \
curl http://127.0.0.1:41663/api/monitoring/status

Monitoring stack health
curl http://localhost:9090/api/v1/status/config && \
curl http://localhost:3001/api/health && \
curl http://localhost:9200/_cluster/health

Support Information
Check the documentation in /docs/ directory
Review the implementation summary in MONITORING_IMPLEMENTATION_COMPLETE.md
Run the debugging script: node debug-monitoring-systems.js
Check configuration files in monitoring/ directory

This troubleshooting guide covers the most common issues and their solutions. For additional support, refer to the comprehensive documentation or run the debugging framework to identify specific problems.