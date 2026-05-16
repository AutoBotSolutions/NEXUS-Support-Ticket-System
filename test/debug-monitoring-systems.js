#!/usr/bin/env node

// Comprehensive Monitoring System Debugging Script
const http = require('http');
const fs = require('fs');
const path = require('path');

class MonitoringDebugger {
    constructor() {
        this.results = {
            apm: { status: 'pending', tests: [], issues: [] },
            infrastructure: { status: 'pending', tests: [], issues: [] },
            database: { status: 'pending', tests: [], issues: [] },
            frontend: { status: 'pending', tests: [], issues: [] },
            security: { status: 'pending', tests: [], issues: [] },
            business: { status: 'pending', tests: [], issues: [] },
            alerting: { status: 'pending', tests: [], issues: [] },
            logging: { status: 'pending', tests: [], issues: [] }
        };
        
        this.testCount = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    async runTest(component, testName, testFunction) {
        this.testCount++;
        console.log(`\n🧪 Testing ${component}: ${testName}`);
        
        try {
            const result = await testFunction();
            if (result.success) {
                console.log(`✅ ${testName}: ${result.message}`);
                this.results[component].tests.push({ name: testName, status: 'passed', message: result.message });
                this.passedTests++;
            } else {
                console.log(`❌ ${testName}: ${result.message}`);
                this.results[component].tests.push({ name: testName, status: 'failed', message: result.message });
                this.results[component].issues.push(result.message);
                this.failedTests++;
            }
        } catch (error) {
            console.log(`❌ ${testName}: ${error.message}`);
            this.results[component].tests.push({ name: testName, status: 'error', message: error.message });
            this.results[component].issues.push(error.message);
            this.failedTests++;
        }
    }

    async makeRequest(url, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const req = http.get(url, { timeout }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({ success: true, status: res.statusCode, data });
                });
            });
            
            req.on('error', (err) => {
                resolve({ success: false, error: err.message });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({ success: false, error: 'Request timeout' });
            });
        });
    }

    async debugAPM() {
        console.log('\n🔍 Debugging APM Integration');
        
        // Test 1: Check if New Relic configuration exists
        await this.runTest('apm', 'New Relic Configuration', async () => {
            const configPath = path.join(__dirname, 'newrelic.js');
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                if (content.includes('app_name') && content.includes('license_key')) {
                    return { success: true, message: 'New Relic configuration file exists and is properly formatted' };
                } else {
                    return { success: false, message: 'New Relic configuration file is incomplete' };
                }
            } else {
                return { success: false, message: 'New Relic configuration file not found' };
            }
        });

        // Test 2: Check if APM middleware exists
        await this.runTest('apm', 'APM Middleware', async () => {
            const middlewarePath = path.join(__dirname, 'middleware', 'apmMonitoring.js');
            if (fs.existsSync(middlewarePath)) {
                const content = fs.readFileSync(middlewarePath, 'utf8');
                if (content.includes('prom-client') && content.includes('register')) {
                    return { success: true, message: 'APM middleware exists with Prometheus client' };
                } else {
                    return { success: false, message: 'APM middleware is incomplete' };
                }
            } else {
                return { success: false, message: 'APM middleware file not found' };
            }
        });

        // Test 3: Check if metrics endpoint is accessible
        await this.runTest('apm', 'Metrics Endpoint', async () => {
            const result = await this.makeRequest('http://localhost:3000/metrics');
            if (result.success && result.data.includes('nexus_')) {
                return { success: true, message: 'Metrics endpoint is working and returning data' };
            } else if (result.success) {
                return { success: false, message: 'Metrics endpoint exists but not returning expected data' };
            } else {
                return { success: false, message: 'Metrics endpoint not accessible' };
            }
        });

        // Test 4: Check if New Relic agent is initialized
        await this.runTest('apm', 'New Relic Agent', async () => {
            if (process.env.NEW_RELIC_LICENSE_KEY) {
                return { success: true, message: 'New Relic license key is configured' };
            } else {
                return { success: false, message: 'New Relic license key not configured (set NEW_RELIC_LICENSE_KEY)' };
            }
        });

        this.results.apm.status = this.failedTests === 0 ? 'passed' : 'failed';
    }

    async debugInfrastructure() {
        console.log('\n🔍 Debugging Infrastructure Monitoring');
        
        // Test 1: Check Prometheus configuration
        await this.runTest('infrastructure', 'Prometheus Configuration', async () => {
            const configPath = path.join(__dirname, 'monitoring', 'prometheus.yml');
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                if (content.includes('scrape_configs') && content.includes('nexus-app')) {
                    return { success: true, message: 'Prometheus configuration exists with nexus-app target' };
                } else {
                    return { success: false, message: 'Prometheus configuration is incomplete' };
                }
            } else {
                return { success: false, message: 'Prometheus configuration file not found' };
            }
        });

        // Test 2: Check Grafana dashboard
        await this.runTest('infrastructure', 'Grafana Dashboard', async () => {
            const dashboardPath = path.join(__dirname, 'dashboards', 'nexus-dashboard.json');
            if (fs.existsSync(dashboardPath)) {
                const content = fs.readFileSync(dashboardPath, 'utf8');
                if (content.includes('NEXUS Support System') && content.includes('panels')) {
                    return { success: true, message: 'Grafana dashboard configuration exists' };
                } else {
                    return { success: false, message: 'Grafana dashboard is incomplete' };
                }
            } else {
                return { success: false, message: 'Grafana dashboard file not found' };
            }
        });

        // Test 3: Check if Prometheus is running
        await this.runTest('infrastructure', 'Prometheus Service', async () => {
            const result = await this.makeRequest('http://localhost:9090/api/v1/status/config');
            if (result.success) {
                return { success: true, message: 'Prometheus is running and accessible' };
            } else {
                return { success: false, message: 'Prometheus is not running or not accessible on port 9090' };
            }
        });

        // Test 4: Check if Grafana is running
        await this.runTest('infrastructure', 'Grafana Service', async () => {
            const result = await this.makeRequest('http://localhost:3001/api/health');
            if (result.success) {
                return { success: true, message: 'Grafana is running and accessible' };
            } else {
                return { success: false, message: 'Grafana is not running or not accessible on port 3001' };
            }
        });

        this.results.infrastructure.status = this.failedTests === 0 ? 'passed' : 'failed';
    }

    async debugDatabase() {
        console.log('\n🔍 Debugging Database Monitoring');
        
        // Test 1: Check database monitoring middleware
        await this.runTest('database', 'Database Monitoring Middleware', async () => {
            const middlewarePath = path.join(__dirname, 'middleware', 'databaseMonitoring.js');
            if (fs.existsSync(middlewarePath)) {
                const content = fs.readFileSync(middlewarePath, 'utf8');
                if (content.includes('databaseHealthCheck') && content.includes('slowQueries')) {
                    return { success: true, message: 'Database monitoring middleware exists' };
                } else {
                    return { success: false, message: 'Database monitoring middleware is incomplete' };
                }
            } else {
                return { success: false, message: 'Database monitoring middleware file not found' };
            }
        });

        // Test 2: Check database health endpoint
        await this.runTest('database', 'Database Health Endpoint', async () => {
            const result = await this.makeRequest('http://localhost:3000/api/health/database');
            if (result.success && result.data.includes('database')) {
                return { success: true, message: 'Database health endpoint is working' };
            } else if (result.success) {
                return { success: false, message: 'Database health endpoint exists but not returning expected data' };
            } else {
                return { success: false, message: 'Database health endpoint not accessible' };
            }
        });

        // Test 3: Check MongoDB connection
        await this.runTest('database', 'MongoDB Connection', async () => {
            // Try to connect to MongoDB
            const { MongoClient } = require('mongodb');
            const client = new MongoClient('mongodb://localhost:27017', { 
                serverSelectionTimeoutMS: 2000,
                connectTimeoutMS: 2000
            });
            
            try {
                await client.connect();
                await client.db('admin').command({ ping: 1 });
                await client.close();
                return { success: true, message: 'MongoDB is running and accessible' };
            } catch (error) {
                return { success: false, message: `MongoDB connection failed: ${error.message}` };
            }
        });

        this.results.database.status = this.failedTests === 0 ? 'passed' : 'failed';
    }

    async debugFrontend() {
        console.log('\n🔍 Debugging Frontend Monitoring');
        
        // Test 1: Check frontend monitoring script
        await this.runTest('frontend', 'Frontend Monitoring Script', async () => {
            const scriptPath = path.join(__dirname, 'public', 'frontend-monitoring.js');
            if (fs.existsSync(scriptPath)) {
                const content = fs.readFileSync(scriptPath, 'utf8');
                if (content.includes('FrontendMonitor') && content.includes('performance')) {
                    return { success: true, message: 'Frontend monitoring script exists with performance tracking' };
                } else {
                    return { success: false, message: 'Frontend monitoring script is incomplete' };
                }
            } else {
                return { success: false, message: 'Frontend monitoring script not found' };
            }
        });

        // Test 2: Check if script is included in HTML
        await this.runTest('frontend', 'HTML Integration', async () => {
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            if (fs.existsSync(htmlPath)) {
                const content = fs.readFileSync(htmlPath, 'utf8');
                if (content.includes('frontend-monitoring.js')) {
                    return { success: true, message: 'Frontend monitoring script is included in HTML' };
                } else {
                    return { success: false, message: 'Frontend monitoring script not included in HTML' };
                }
            } else {
                return { success: false, message: 'HTML file not found' };
            }
        });

        // Test 3: Check monitoring routes
        await this.runTest('frontend', 'Monitoring API Routes', async () => {
            const routesPath = path.join(__dirname, 'routes', 'monitoringRoutes.js');
            if (fs.existsSync(routesPath)) {
                const content = fs.readFileSync(routesPath, 'utf8');
                if (content.includes('receiveError') && content.includes('receiveMetrics')) {
                    return { success: true, message: 'Frontend monitoring API routes exist' };
                } else {
                    return { success: false, message: 'Frontend monitoring API routes are incomplete' };
                }
            } else {
                return { success: false, message: 'Frontend monitoring API routes not found' };
            }
        });

        this.results.frontend.status = this.failedTests === 0 ? 'passed' : 'failed';
    }

    async debugSecurity() {
        console.log('\n🔍 Debugging Security Monitoring');
        
        // Test 1: Check security monitoring middleware
        await this.runTest('security', 'Security Monitoring Middleware', async () => {
            const middlewarePath = path.join(__dirname, 'middleware', 'securityMonitoring.js');
            if (fs.existsSync(middlewarePath)) {
                const content = fs.readFileSync(middlewarePath, 'utf8');
                if (content.includes('SecurityMonitor') && content.includes('detectThreats')) {
                    return { success: true, message: 'Security monitoring middleware exists with threat detection' };
                } else {
                    return { success: false, message: 'Security monitoring middleware is incomplete' };
                }
            } else {
                return { success: false, message: 'Security monitoring middleware not found' };
            }
        });

        // Test 2: Check security dashboard endpoint
        await this.runTest('security', 'Security Dashboard Endpoint', async () => {
            const result = await this.makeRequest('http://localhost:3000/api/security/dashboard');
            if (result.success && result.data.includes('security')) {
                return { success: true, message: 'Security dashboard endpoint is working' };
            } else if (result.success) {
                return { success: false, message: 'Security dashboard endpoint exists but not returning expected data' };
            } else {
                return { success: false, message: 'Security dashboard endpoint not accessible' };
            }
        });

        // Test 3: Check alert rules for security
        await this.runTest('security', 'Security Alert Rules', async () => {
            const alertRulesPath = path.join(__dirname, 'monitoring', 'alert_rules.yml');
            if (fs.existsSync(alertRulesPath)) {
                const content = fs.readFileSync(alertRulesPath, 'utf8');
                if (content.includes('security_events') && content.includes('brute_force')) {
                    return { success: true, message: 'Security alert rules are configured' };
                } else {
                    return { success: false, message: 'Security alert rules are incomplete' };
                }
            } else {
                return { success: false, message: 'Security alert rules not found' };
            }
        });

        this.results.security.status = this.failedTests === 0 ? 'passed' : 'failed';
    }

    async debugBusiness() {
        console.log('\n🔍 Debugging Business Intelligence');
        
        // Test 1: Check business intelligence middleware
        await this.runTest('business', 'Business Intelligence Middleware', async () => {
            const middlewarePath = path.join(__dirname, 'middleware', 'businessIntelligence.js');
            if (fs.existsSync(middlewarePath)) {
                const content = fs.readFileSync(middlewarePath, 'utf8');
                if (content.includes('BusinessIntelligence') && content.includes('KPIs')) {
                    return { success: true, message: 'Business intelligence middleware exists with KPI tracking' };
                } else {
                    return { success: false, message: 'Business intelligence middleware is incomplete' };
                }
            } else {
                return { success: false, message: 'Business intelligence middleware not found' };
            }
        });

        // Test 2: Check business analytics endpoint
        await this.runTest('business', 'Business Analytics Endpoint', async () => {
            const result = await this.makeRequest('http://localhost:3000/api/bi/analytics');
            if (result.success && result.data.includes('analytics')) {
                return { success: true, message: 'Business analytics endpoint is working' };
            } else if (result.success) {
                return { success: false, message: 'Business analytics endpoint exists but not returning expected data' };
            } else {
                return { success: false, message: 'Business analytics endpoint not accessible' };
            }
        });

        // Test 3: Check KPI dashboard endpoint
        await this.runTest('business', 'KPI Dashboard Endpoint', async () => {
            const result = await this.makeRequest('http://localhost:3000/api/bi/kpi');
            if (result.success && result.data.includes('kpi')) {
                return { success: true, message: 'KPI dashboard endpoint is working' };
            } else if (result.success) {
                return { success: false, message: 'KPI dashboard endpoint exists but not returning expected data' };
            } else {
                return { success: false, message: 'KPI dashboard endpoint not accessible' };
            }
        });

        this.results.business.status = this.failedTests === 0 ? 'passed' : 'failed';
    }

    async debugAlerting() {
        console.log('\n🔍 Debugging Alerting Configuration');
        
        // Test 1: Check alerting system middleware
        await this.runTest('alerting', 'Alerting System Middleware', async () => {
            const middlewarePath = path.join(__dirname, 'middleware', 'alertingSystem.js');
            if (fs.existsSync(middlewarePath)) {
                const content = fs.readFileSync(middlewarePath, 'utf8');
                if (content.includes('AlertingSystem') && content.includes('PagerDuty')) {
                    return { success: true, message: 'Alerting system middleware exists with PagerDuty integration' };
                } else {
                    return { success: false, message: 'Alerting system middleware is incomplete' };
                }
            } else {
                return { success: false, message: 'Alerting system middleware not found' };
            }
        });

        // Test 2: Check alert status endpoint
        await this.runTest('alerting', 'Alert Status Endpoint', async () => {
            const result = await this.makeRequest('http://localhost:3000/api/alerts/status');
            if (result.success && result.data.includes('alerts')) {
                return { success: true, message: 'Alert status endpoint is working' };
            } else if (result.success) {
                return { success: false, message: 'Alert status endpoint exists but not returning expected data' };
            } else {
                return { success: false, message: 'Alert status endpoint not accessible' };
            }
        });

        // Test 3: Check AlertManager configuration
        await this.runTest('alerting', 'AlertManager Configuration', async () => {
            const configPath = path.join(__dirname, 'monitoring', 'alertmanager.yml');
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                if (content.includes('receivers') && content.includes('email')) {
                    return { success: true, message: 'AlertManager configuration exists' };
                } else {
                    return { success: false, message: 'AlertManager configuration is incomplete' };
                }
            } else {
                return { success: false, message: 'AlertManager configuration not found' };
            }
        });

        // Test 4: Check environment variables for alerting
        await this.runTest('alerting', 'Environment Variables', async () => {
            const envPath = path.join(__dirname, '.env.alerting.example');
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                if (content.includes('PAGERDUTY') && content.includes('SLACK')) {
                    return { success: true, message: 'Alerting environment variables template exists' };
                } else {
                    return { success: false, message: 'Alerting environment variables template is incomplete' };
                }
            } else {
                return { success: false, message: 'Alerting environment variables template not found' };
            }
        });

        this.results.alerting.status = this.failedTests === 0 ? 'passed' : 'failed';
    }

    async debugLogging() {
        console.log('\n🔍 Debugging Logging Infrastructure');
        
        // Test 1: Check logging infrastructure middleware
        await this.runTest('logging', 'Logging Infrastructure Middleware', async () => {
            const middlewarePath = path.join(__dirname, 'middleware', 'loggingInfrastructure.js');
            if (fs.existsSync(middlewarePath)) {
                const content = fs.readFileSync(middlewarePath, 'utf8');
                if (content.includes('LoggingInfrastructure') && content.includes('winston')) {
                    return { success: true, message: 'Logging infrastructure middleware exists with Winston' };
                } else {
                    return { success: false, message: 'Logging infrastructure middleware is incomplete' };
                }
            } else {
                return { success: false, message: 'Logging infrastructure middleware not found' };
            }
        });

        // Test 2: Check ELK configuration files
        await this.runTest('logging', 'ELK Configuration', async () => {
            const loggingDir = path.join(__dirname, 'logging');
            const requiredFiles = ['elasticsearch.yml', 'logstash.yml', 'kibana.yml', 'filebeat.yml'];
            const missingFiles = [];
            
            for (const file of requiredFiles) {
                if (!fs.existsSync(path.join(loggingDir, file))) {
                    missingFiles.push(file);
                }
            }
            
            if (missingFiles.length === 0) {
                return { success: true, message: 'All ELK configuration files exist' };
            } else {
                return { success: false, message: `Missing ELK config files: ${missingFiles.join(', ')}` };
            }
        });

        // Test 3: Check log directory
        await this.runTest('logging', 'Log Directory', async () => {
            const logsDir = path.join(__dirname, 'logs');
            if (fs.existsSync(logsDir)) {
                return { success: true, message: 'Logs directory exists' };
            } else {
                fs.mkdirSync(logsDir, { recursive: true });
                return { success: true, message: 'Logs directory created' };
            }
        });

        // Test 4: Check if Elasticsearch is running
        await this.runTest('logging', 'Elasticsearch Service', async () => {
            const result = await this.makeRequest('http://localhost:9200/_cluster/health');
            if (result.success) {
                return { success: true, message: 'Elasticsearch is running and accessible' };
            } else {
                return { success: false, message: 'Elasticsearch is not running or not accessible on port 9200' };
            }
        });

        this.results.logging.status = this.failedTests === 0 ? 'passed' : 'failed';
    }

    async generateReport() {
        console.log('\n📋 MONITORING SYSTEM DEBUG REPORT');
        console.log('=====================================');
        
        console.log(`\n📊 Overall Results:`);
        console.log(`Total Tests: ${this.testCount}`);
        console.log(`Passed: ${this.passedTests} ✅`);
        console.log(`Failed: ${this.failedTests} ❌`);
        console.log(`Success Rate: ${Math.round((this.passedTests / this.testCount) * 100)}%`);
        
        console.log('\n🔍 Component Status:');
        const components = ['apm', 'infrastructure', 'database', 'frontend', 'security', 'business', 'alerting', 'logging'];
        
        components.forEach(component => {
            const result = this.results[component];
            const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏳';
            console.log(`${status} ${component.toUpperCase()}: ${result.tests.filter(t => t.status === 'passed').length}/${result.tests.length} tests passed`);
            
            if (result.issues.length > 0) {
                console.log(`   Issues: ${result.issues.join(', ')}`);
            }
        });
        
        // Generate summary
        console.log('\n🎯 SUMMARY:');
        const workingComponents = components.filter(c => this.results[c].status === 'passed').length;
        console.log(`${workingComponents}/8 monitoring components are working properly`);
        
        if (workingComponents < 8) {
            console.log('\n🔧 RECOMMENDATIONS:');
            
            if (this.results.apm.status === 'failed') {
                console.log('- Configure NEW_RELIC_LICENSE_KEY environment variable');
                console.log('- Ensure New Relic agent is properly initialized');
            }
            
            if (this.results.infrastructure.status === 'failed') {
                console.log('- Install and start Docker: curl -fsSL https://get.docker.com | sh');
                console.log('- Run: docker-compose up -d to start monitoring stack');
            }
            
            if (this.results.database.status === 'failed') {
                console.log('- Start MongoDB: docker run -d -p 27017:27017 mongo');
                console.log('- Or install MongoDB locally');
            }
            
            if (this.results.logging.status === 'failed') {
                console.log('- Start ELK stack with Docker Compose');
                console.log('- Check Elasticsearch configuration');
            }
        }
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'debug-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Monitoring System Debug\n');
        
        await this.debugAPM();
        await this.debugInfrastructure();
        await this.debugDatabase();
        await this.debugFrontend();
        await this.debugSecurity();
        await this.debugBusiness();
        await this.debugAlerting();
        await this.debugLogging();
        
        await this.generateReport();
    }
}

// Run the debugging
const monitoringDebugger = new MonitoringDebugger();
monitoringDebugger.runAllTests().catch(console.error);
