#!/usr/bin/env node

/**
 * Comprehensive Production Systems Debug Script
 * Tests all newly implemented production deployment systems for functionality and operability
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class ProductionSystemsDebugger {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.testResults = {
            newrelic: { status: 'pending', tests: [], errors: [] },
            docker: { status: 'pending', tests: [], errors: [] },
            externalServices: { status: 'pending', tests: [], errors: [] },
            environment: { status: 'pending', tests: [], errors: [] },
            monitoring: { status: 'pending', tests: [], errors: [] },
            deployment: { status: 'pending', tests: [], errors: [] },
            production: { status: 'pending', tests: [], errors: [] }
        };
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            const requestOptions = {
                hostname: new URL(url).hostname,
                port: new URL(url).port || (url.startsWith('https') ? 443 : 80),
                path: new URL(url).pathname + new URL(url).search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                timeout: options.timeout || 10000
            };

            const req = protocol.request(requestOptions, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        resolve({ status: res.statusCode, data });
                    } catch (error) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (options.data) {
                req.write(JSON.stringify(options.data));
            }

            req.end();
        });
    }

    async runTest(testName, testFunction, category = 'production') {
        this.totalTests++;
        try {
            const result = await testFunction();
            if (result.success) {
                this.passedTests++;
                this.testResults[category].tests.push({
                    name: testName,
                    success: true,
                    status: result.status,
                    data: result.data
                });
            } else {
                this.failedTests++;
                this.testResults[category].tests.push({
                    name: testName,
                    success: false,
                    status: result.status,
                    error: result.error
                });
                this.testResults[category].errors.push(`${testName}: ${result.error}`);
            }
        } catch (error) {
            this.failedTests++;
            this.testResults[category].tests.push({
                name: testName,
                success: false,
                error: error.message
            });
            this.testResults[category].errors.push(`${testName}: ${error.message}`);
        }
    }

    async testNewRelicIntegration() {
        console.log('\n🔍 Testing New Relic Integration...');
        
        // Test New Relic configuration file exists
        await this.runTest('New Relic Config File Exists', async () => {
            const configPath = path.join(__dirname, 'config/newrelic.js');
            if (fs.existsSync(configPath)) {
                return { success: true, status: 200, data: 'Configuration file exists' };
            } else {
                return { success: false, status: 404, error: 'New Relic configuration file not found' };
            }
        }, 'newrelic');

        // Test New Relic module can be loaded
        await this.runTest('New Relic Module Loading', async () => {
            try {
                const newrelic = require('../config/newrelic');
                return { success: true, status: 200, data: 'New Relic module loaded successfully' };
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'newrelic');

        // Test New Relic configuration
        await this.runTest('New Relic Configuration', async () => {
            try {
                const { config } = require('../config/newrelic');
                if (config && config.app_name && config.license_key) {
                    return { success: true, status: 200, data: 'New Relic configuration valid' };
                } else {
                    return { success: false, status: 400, error: 'Invalid New Relic configuration' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'newrelic');

        // Test business metrics functionality
        await this.runTest('Business Metrics Creation', async () => {
            try {
                const { businessMetrics } = require('../config/newrelic');
                if (businessMetrics && typeof businessMetrics.recordTicketCreation === 'function') {
                    return { success: true, status: 200, data: 'Business metrics available' };
                } else {
                    return { success: false, status: 400, error: 'Business metrics not available' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'newrelic');

        // Test New Relic health check
        await this.runTest('New Relic Health Check', async () => {
            try {
                const { checkNewRelicHealth } = require('../config/newrelic');
                const health = checkNewRelicHealth();
                if (health && typeof health === 'object') {
                    return { success: true, status: 200, data: health };
                } else {
                    return { success: false, status: 400, error: 'Invalid health check result' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'newrelic');

        this.testResults.newrelic.status = this.testResults.newrelic.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.newrelic.status}`);
    }

    async testDockerDeployment() {
        console.log('\n🔍 Testing Docker Deployment...');
        
        // Test Docker Compose file exists
        await this.runTest('Docker Compose Production File', async () => {
            const composePath = path.join(__dirname, 'docker-compose.production.yml');
            if (fs.existsSync(composePath)) {
                return { success: true, status: 200, data: 'Docker Compose file exists' };
            } else {
                return { success: false, status: 404, error: 'Docker Compose production file not found' };
            }
        }, 'docker');

        // Test production Dockerfile exists
        await this.runTest('Production Dockerfile', async () => {
            const dockerfilePath = path.join(__dirname, 'Dockerfile.production');
            if (fs.existsSync(dockerfilePath)) {
                return { success: true, status: 200, data: 'Production Dockerfile exists' };
            } else {
                return { success: false, status: 404, error: 'Production Dockerfile not found' };
            }
        }, 'docker');

        // Test Docker Compose configuration
        await this.runTest('Docker Compose Configuration', async () => {
            try {
                const composePath = path.join(__dirname, 'docker-compose.production.yml');
                const content = fs.readFileSync(composePath, 'utf8');
                if (content.includes('nexus-app') && content.includes('prometheus') && content.includes('grafana')) {
                    return { success: true, status: 200, data: 'Docker Compose configuration valid' };
                } else {
                    return { success: false, status: 400, error: 'Invalid Docker Compose configuration' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'docker');

        // Test deployment script exists
        await this.runTest('Deployment Script', async () => {
            const scriptPath = path.join(__dirname, 'scripts/deploy-production.sh');
            if (fs.existsSync(scriptPath)) {
                return { success: true, status: 200, data: 'Deployment script exists' };
            } else {
                return { success: false, status: 404, error: 'Deployment script not found' };
            }
        }, 'docker');

        // Test deployment script permissions
        await this.runTest('Deployment Script Permissions', async () => {
            try {
                const scriptPath = path.join(__dirname, 'scripts/deploy-production.sh');
                const stats = fs.statSync(scriptPath);
                if (stats.mode & parseInt('111', 8)) {
                    return { success: true, status: 200, data: 'Deployment script is executable' };
                } else {
                    return { success: false, status: 400, error: 'Deployment script is not executable' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'docker');

        this.testResults.docker.status = this.testResults.docker.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.docker.status}`);
    }

    async testExternalServices() {
        console.log('\n🔍 Testing External Services...');
        
        // Test external services configuration exists
        await this.runTest('External Services Config', async () => {
            const configPath = path.join(__dirname, 'config/external-services.js');
            if (fs.existsSync(configPath)) {
                return { success: true, status: 200, data: 'External services configuration exists' };
            } else {
                return { success: false, status: 404, error: 'External services configuration not found' };
            }
        }, 'externalServices');

        // Test external services module loading
        await this.runTest('External Services Module Loading', async () => {
            try {
                const { ExternalServiceManager } = require('../config/external-services');
                return { success: true, status: 200, data: 'External services module loaded successfully' };
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'externalServices');

        // Test Slack service configuration
        await this.runTest('Slack Service Configuration', async () => {
            try {
                const { SlackService } = require('../config/external-services');
                const slackService = new SlackService();
                if (slackService && typeof slackService.sendNotification === 'function') {
                    return { success: true, status: 200, data: 'Slack service configured' };
                } else {
                    return { success: false, status: 400, error: 'Slack service not properly configured' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'externalServices');

        // Test PagerDuty service configuration
        await this.runTest('PagerDuty Service Configuration', async () => {
            try {
                const { PagerDutyService } = require('../config/external-services');
                const pagerdutyService = new PagerDutyService();
                if (pagerdutyService && typeof pagerdutyService.sendNotification === 'function') {
                    return { success: true, status: 200, data: 'PagerDuty service configured' };
                } else {
                    return { success: false, status: 400, error: 'PagerDuty service not properly configured' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'externalServices');

        // Test Twilio service configuration
        await this.runTest('Twilio Service Configuration', async () => {
            try {
                const { TwilioService } = require('../config/external-services');
                const twilioService = new TwilioService();
                if (twilioService && typeof twilioService.sendNotification === 'function') {
                    return { success: true, status: 200, data: 'Twilio service configured' };
                } else {
                    return { success: false, status: 400, error: 'Twilio service not properly configured' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'externalServices');

        // Test webhook service configuration
        await this.runTest('Webhook Service Configuration', async () => {
            try {
                const { WebhookService } = require('../config/external-services');
                const webhookService = new WebhookService();
                if (webhookService && typeof webhookService.sendNotification === 'function') {
                    return { success: true, status: 200, data: 'Webhook service configured' };
                } else {
                    return { success: false, status: 400, error: 'Webhook service not properly configured' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'externalServices');

        this.testResults.externalServices.status = this.testResults.externalServices.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.externalServices.status}`);
    }

    async testEnvironmentConfiguration() {
        console.log('\n🔍 Testing Environment Configuration...');
        
        // Test production environment file exists
        await this.runTest('Production Environment File', async () => {
            const envPath = path.join(__dirname, 'config/production.env');
            if (fs.existsSync(envPath)) {
                return { success: true, status: 200, data: 'Production environment file exists' };
            } else {
                return { success: false, status: 404, error: 'Production environment file not found' };
            }
        }, 'environment');

        // Test production environment variables
        await this.runTest('Production Environment Variables', async () => {
            try {
                const envPath = path.join(__dirname, 'config/production.env');
                const content = fs.readFileSync(envPath, 'utf8');
                const requiredVars = ['NODE_ENV', 'NEW_RELIC_LICENSE_KEY', 'MONGODB_URI', 'SMTP_HOST'];
                const missingVars = [];
                
                for (const varName of requiredVars) {
                    if (!content.includes(`${varName}=`)) {
                        missingVars.push(varName);
                    }
                }
                
                if (missingVars.length === 0) {
                    return { success: true, status: 200, data: 'All required environment variables present' };
                } else {
                    return { success: false, status: 400, error: `Missing variables: ${missingVars.join(', ')}` };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'environment');

        // Test Nginx configuration exists
        await this.runTest('Nginx Configuration', async () => {
            const nginxPath = path.join(__dirname, 'nginx/nginx.conf');
            if (fs.existsSync(nginxPath)) {
                return { success: true, status: 200, data: 'Nginx configuration exists' };
            } else {
                return { success: false, status: 404, error: 'Nginx configuration not found' };
            }
        }, 'environment');

        // Test Prometheus production configuration
        await this.runTest('Prometheus Production Config', async () => {
            const prometheusPath = path.join(__dirname, 'monitoring/prometheus/production.yml');
            if (fs.existsSync(prometheusPath)) {
                return { success: true, status: 200, data: 'Prometheus production configuration exists' };
            } else {
                return { success: false, status: 404, error: 'Prometheus production configuration not found' };
            }
        }, 'environment');

        // Test AlertManager production configuration
        await this.runTest('AlertManager Production Config', async () => {
            const alertmanagerPath = path.join(__dirname, 'monitoring/alertmanager/production.yml');
            if (fs.existsSync(alertmanagerPath)) {
                return { success: true, status: 200, data: 'AlertManager production configuration exists' };
            } else {
                return { success: false, status: 404, error: 'AlertManager production configuration not found' };
            }
        }, 'environment');

        this.testResults.environment.status = this.testResults.environment.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.environment.status}`);
    }

    async testMonitoringStack() {
        console.log('\n🔍 Testing Production Monitoring Stack...');
        
        // Test Prometheus configuration
        await this.runTest('Prometheus Configuration Validation', async () => {
            try {
                const prometheusPath = path.join(__dirname, 'monitoring/prometheus/production.yml');
                const content = fs.readFileSync(prometheusPath, 'utf8');
                if (content.includes('global:') && content.includes('scrape_configs:') && content.includes('nexus-app')) {
                    return { success: true, status: 200, data: 'Prometheus configuration valid' };
                } else {
                    return { success: false, status: 400, error: 'Invalid Prometheus configuration' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'monitoring');

        // Test AlertManager configuration
        await this.runTest('AlertManager Configuration Validation', async () => {
            try {
                const alertmanagerPath = path.join(__dirname, 'monitoring/alertmanager/production.yml');
                const content = fs.readFileSync(alertmanagerPath, 'utf8');
                if (content.includes('global:') && content.includes('route:') && content.includes('receivers:')) {
                    return { success: true, status: 200, data: 'AlertManager configuration valid' };
                } else {
                    return { success: false, status: 400, error: 'Invalid AlertManager configuration' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'monitoring');

        // Test Nginx configuration
        await this.runTest('Nginx Configuration Validation', async () => {
            try {
                const nginxPath = path.join(__dirname, 'nginx/nginx.conf');
                const content = fs.readFileSync(nginxPath, 'utf8');
                if (content.includes('upstream nexus_backend') && content.includes('server {') && content.includes('listen 443 ssl')) {
                    return { success: true, status: 200, data: 'Nginx configuration valid' };
                } else {
                    return { success: false, status: 400, error: 'Invalid Nginx configuration' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'monitoring');

        // Test Docker Compose monitoring services
        await this.runTest('Docker Compose Monitoring Services', async () => {
            try {
                const composePath = path.join(__dirname, 'docker-compose.production.yml');
                const content = fs.readFileSync(composePath, 'utf8');
                const monitoringServices = ['prometheus', 'grafana', 'alertmanager', 'node-exporter'];
                const missingServices = [];
                
                for (const service of monitoringServices) {
                    if (!content.includes(service)) {
                        missingServices.push(service);
                    }
                }
                
                if (missingServices.length === 0) {
                    return { success: true, status: 200, data: 'All monitoring services configured' };
                } else {
                    return { success: false, status: 400, error: `Missing services: ${missingServices.join(', ')}` };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'monitoring');

        // Test monitoring directories
        await this.runTest('Monitoring Directories', async () => {
            const monitoringDirs = [
                'monitoring/prometheus',
                'monitoring/grafana',
                'monitoring/alertmanager',
                'monitoring/logstash',
                'nginx'
            ];
            const missingDirs = [];
            
            for (const dir of monitoringDirs) {
                const dirPath = path.join(__dirname, dir);
                if (!fs.existsSync(dirPath)) {
                    missingDirs.push(dir);
                }
            }
            
            if (missingDirs.length === 0) {
                return { success: true, status: 200, data: 'All monitoring directories exist' };
            } else {
                return { success: false, status: 400, error: `Missing directories: ${missingDirs.join(', ')}` };
            }
        }, 'monitoring');

        this.testResults.monitoring.status = this.testResults.monitoring.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.monitoring.status}`);
    }

    async testDeploymentScript() {
        console.log('\n🔍 Testing Deployment Script...');
        
        // Test deployment script exists and is executable
        await this.runTest('Deployment Script Executable', async () => {
            try {
                const scriptPath = path.join(__dirname, 'scripts/deploy-production.sh');
                const stats = fs.statSync(scriptPath);
                if (stats.isFile() && (stats.mode & parseInt('111', 8))) {
                    return { success: true, status: 200, data: 'Deployment script is executable' };
                } else {
                    return { success: false, status: 400, error: 'Deployment script is not executable' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'deployment');

        // Test deployment script content
        await this.runTest('Deployment Script Content', async () => {
            try {
                const scriptPath = path.join(__dirname, 'scripts/deploy-production.sh');
                const content = fs.readFileSync(scriptPath, 'utf8');
                const requiredFunctions = ['check_prerequisites', 'validate_environment', 'backup_current_deployment', 'deploy_services'];
                const missingFunctions = [];
                
                for (const func of requiredFunctions) {
                    if (!content.includes(func)) {
                        missingFunctions.push(func);
                    }
                }
                
                if (missingFunctions.length === 0) {
                    return { success: true, status: 200, data: 'Deployment script contains all required functions' };
                } else {
                    return { success: false, status: 400, error: `Missing functions: ${missingFunctions.join(', ')}` };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'deployment');

        // Test Docker Compose reference in script
        await this.runTest('Docker Compose Reference', async () => {
            try {
                const scriptPath = path.join(__dirname, 'scripts/deploy-production.sh');
                const content = fs.readFileSync(scriptPath, 'utf8');
                if (content.includes('docker-compose.production.yml') && content.includes('COMPOSE_FILE')) {
                    return { success: true, status: 200, data: 'Script references production Docker Compose' };
                } else {
                    return { success: false, status: 400, error: 'Script does not reference production Docker Compose' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'deployment');

        // Test error handling in script
        await this.runTest('Error Handling in Script', async () => {
            try {
                const scriptPath = path.join(__dirname, 'scripts/deploy-production.sh');
                const content = fs.readFileSync(scriptPath, 'utf8');
                if (content.includes('set -e') && content.includes('log_error') && content.includes('exit 1')) {
                    return { success: true, status: 200, data: 'Script has proper error handling' };
                } else {
                    return { success: false, status: 400, error: 'Script lacks proper error handling' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'deployment');

        this.testResults.deployment.status = this.testResults.deployment.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.deployment.status}`);
    }

    async testProductionIntegration() {
        console.log('\n🔍 Testing Production Integration...');
        
        // Test server can load production configuration
        await this.runTest('Production Server Configuration', async () => {
            try {
                // Check if server can load with production environment
                const originalEnv = process.env.NODE_ENV;
                process.env.NODE_ENV = 'production';
                
                // Try to load server dependencies
                const { systemMetrics } = require('../middleware/systemMetrics');
                const { distributedTracing } = require('../middleware/distributedTracing');
                
                process.env.NODE_ENV = originalEnv;
                
                return { success: true, status: 200, data: 'Production configuration loads successfully' };
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'production');

        // Test New Relic integration in production mode
        await this.runTest('New Relic Production Integration', async () => {
            try {
                const originalEnv = process.env.NODE_ENV;
                process.env.NODE_ENV = 'production';
                
                // Mock New Relic environment variable
                const originalLicenseKey = process.env.NEW_RELIC_LICENSE_KEY;
                process.env.NEW_RELIC_LICENSE_KEY = 'test-key';
                
                // Try to load New Relic integration
                delete require.cache[require.resolve('./config/newrelic')];
                const newrelic = require('../config/newrelic');
                
                process.env.NODE_ENV = originalEnv;
                process.env.NEW_RELIC_LICENSE_KEY = originalLicenseKey;
                
                if (newrelic && newrelic.metrics) {
                    return { success: true, status: 200, data: 'New Relic integration works in production' };
                } else {
                    return { success: false, status: 400, error: 'New Relic integration failed in production' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'production');

        // Test external services integration in production
        await this.runTest('External Services Production Integration', async () => {
            try {
                const originalEnv = process.env.NODE_ENV;
                process.env.NODE_ENV = 'production';
                
                // Mock external service environment variables
                const originalSlack = process.env.SLACK_WEBHOOK_URL;
                process.env.SLACK_WEBHOOK_URL = 'test-webhook';
                
                // Try to load external services
                delete require.cache[require.resolve('./config/external-services')];
                const { ExternalServiceManager } = require('../config/external-services');
                const externalServices = new ExternalServiceManager();
                
                process.env.NODE_ENV = originalEnv;
                process.env.SLACK_WEBHOOK_URL = originalSlack;
                
                if (externalServices && externalServices.getService) {
                    return { success: true, status: 200, data: 'External services work in production' };
                } else {
                    return { success: false, status: 400, error: 'External services integration failed in production' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'production');

        // Test business metrics in production
        await this.runTest('Business Metrics Production', async () => {
            try {
                const originalEnv = process.env.NODE_ENV;
                process.env.NODE_ENV = 'production';
                
                // Mock New Relic environment variable
                const originalLicenseKey = process.env.NEW_RELIC_LICENSE_KEY;
                process.env.NEW_RELIC_LICENSE_KEY = 'test-key';
                
                // Try to load business metrics
                delete require.cache[require.resolve('./config/newrelic')];
                const newrelic = require('../config/newrelic');
                
                process.env.NODE_ENV = originalEnv;
                process.env.NEW_RELIC_LICENSE_KEY = originalLicenseKey;
                
                if (newrelic.businessMetrics && typeof newrelic.businessMetrics.recordTicketCreation === 'function') {
                    return { success: true, status: 200, data: 'Business metrics work in production' };
                } else {
                    return { success: false, status: 400, error: 'Business metrics failed in production' };
                }
            } catch (error) {
                return { success: false, status: 500, error: error.message };
            }
        }, 'production');

        this.testResults.production.status = this.testResults.production.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.production.status}`);
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Production Systems Debug...\n');
        
        // Check if server is running
        try {
            await this.makeRequest(`${this.baseURL}/api/health`);
            console.log('✅ Server is running and accessible');
        } catch (error) {
            console.log('❌ Server is not running or not accessible');
            console.log('   Please start the server with: node server-standalone.js');
            return;
        }

        // Run all test suites
        await this.testNewRelicIntegration();
        await this.testDockerDeployment();
        await this.testExternalServices();
        await this.testEnvironmentConfiguration();
        await this.testMonitoringStack();
        await this.testDeploymentScript();
        await this.testProductionIntegration();

        // Generate final report
        this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE PRODUCTION SYSTEMS DEBUG REPORT');
        console.log('='.repeat(80));
        
        console.log(`\n📈 Overall Results:`);
        console.log(`   Total Tests: ${this.totalTests}`);
        console.log(`   Passed: ${this.passedTests} (${((this.passedTests/this.totalTests)*100).toFixed(1)}%)`);
        console.log(`   Failed: ${this.failedTests} (${((this.failedTests/this.totalTests)*100).toFixed(1)}%)`);
        
        console.log(`\n🔍 Production System Status:`);
        
        const systems = [
            { name: 'New Relic Integration', key: 'newrelic' },
            { name: 'Docker Deployment', key: 'docker' },
            { name: 'External Services', key: 'externalServices' },
            { name: 'Environment Configuration', key: 'environment' },
            { name: 'Monitoring Stack', key: 'monitoring' },
            { name: 'Deployment Script', key: 'deployment' },
            { name: 'Production Integration', key: 'production' }
        ];

        let totalPassed = 0;
        let totalSystems = 0;

        for (const system of systems) {
            const result = this.testResults[system.key];
            const status = result.status === 'PASS' ? '✅' : '❌';
            const passedCount = result.tests.filter(t => t.success).length;
            const totalCount = result.tests.length;
            
            console.log(`   ${status} ${system.name}: ${passedCount}/${totalCount} tests passed`);
            
            if (result.status === 'PASS') {
                totalPassed++;
            }
            totalSystems++;

            // Show errors if any
            if (result.errors.length > 0) {
                console.log(`      Errors: ${result.errors.slice(0, 2).join(', ')}`);
                if (result.errors.length > 2) {
                    console.log(`      ... and ${result.errors.length - 2} more`);
                }
            }
        }

        console.log(`\n🎯 Overall Production System Health: ${totalPassed}/${totalSystems} systems operational (${((totalPassed/totalSystems)*100).toFixed(1)}%)`);

        // Recommendations
        console.log(`\n💡 Production Deployment Recommendations:`);
        
        if (this.failedTests === 0) {
            console.log(`   🎉 All production systems are operational!`);
            console.log(`   ✅ System is ready for production deployment`);
            console.log(`   📋 Next steps: Run deployment script and configure external services`);
        } else {
            console.log(`   🔧 Fix failed components before production deployment`);
            console.log(`   📋 Review error logs for detailed troubleshooting information`);
            
            // Specific recommendations based on failed systems
            for (const system of systems) {
                const result = this.testResults[system.key];
                if (result.status === 'FAIL') {
                    console.log(`   ⚠️  ${system.name}: Review and fix failing tests`);
                }
            }
        }

        console.log(`\n📋 Production Deployment Checklist:`);
        console.log(`   1. Review any failed tests and fix underlying issues`);
        console.log(`   2. Configure production environment variables`);
        console.log(`   3. Set up external service credentials`);
        console.log(`   4. Run deployment script: ./scripts/deploy-production.sh`);
        console.log(`   5. Verify all services are running correctly`);
        console.log(`   6. Configure monitoring dashboards and alerts`);
        console.log(`   7. Test external service integrations`);

        console.log('\n' + '='.repeat(80));
        console.log('🏁 PRODUCTION DEBUG SESSION COMPLETE');
        console.log('='.repeat(80));
    }
}

// Run the debugging session
if (require.main === module) {
    const productionDebugger = new ProductionSystemsDebugger();
    productionDebugger.runAllTests().catch(console.error);
}

module.exports = ProductionSystemsDebugger;
