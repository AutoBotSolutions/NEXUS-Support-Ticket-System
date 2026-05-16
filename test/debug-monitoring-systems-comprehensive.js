#!/usr/bin/env node

/**
 * Comprehensive Monitoring Systems Debug Script
 * Tests all newly implemented monitoring systems for functionality and operability
 */

const http = require('http');

class MonitoringSystemsDebugger {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.testResults = {
            infrastructure: { status: 'pending', tests: [], errors: [] },
            tracing: { status: 'pending', tests: [], errors: [] },
            sessionReplay: { status: 'pending', tests: [], errors: [] },
            onCall: { status: 'pending', tests: [], errors: [] },
            vulnerability: { status: 'pending', tests: [], errors: [] },
            threat: { status: 'pending', tests: [], errors: [] },
            reporting: { status: 'pending', tests: [], errors: [] },
            endpoints: { status: 'pending', tests: [], errors: [] },
            integration: { status: 'pending', tests: [], errors: [] }
        };
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: endpoint,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
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

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async runTest(testName, endpoint, expectedStatus = 200, method = 'GET', data = null) {
        this.totalTests++;
        try {
            const result = await this.makeRequest(endpoint, method, data);
            
            if (result.status === expectedStatus) {
                this.passedTests++;
                return { success: true, status: result.status, data: result.data };
            } else {
                this.failedTests++;
                return { success: false, status: result.status, error: `Expected ${expectedStatus}, got ${result.status}` };
            }
        } catch (error) {
            this.failedTests++;
            return { success: false, error: error.message };
        }
    }

    async testInfrastructureMonitoring() {
        console.log('\n🔍 Testing Infrastructure Monitoring...');
        
        const tests = [
            { name: 'System Metrics Endpoint', endpoint: '/metrics', expected: 200 },
            { name: 'System Status Endpoint', endpoint: '/api/monitoring/status', expected: 200 },
            { name: 'Health Check', endpoint: '/api/health', expected: 200 },
            { name: 'Database Health', endpoint: '/api/health/database', expected: 200 }
        ];

        for (const test of tests) {
            const result = await this.runTest(test.name, test.endpoint, test.expected);
            this.testResults.infrastructure.tests.push({
                name: test.name,
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.infrastructure.errors.push(`${test.name}: ${result.error || 'Status ' + result.status}`);
            }
        }

        // Test metrics content
        try {
            const metricsResult = await this.makeRequest('/metrics');
            if (metricsResult.status === 200 && metricsResult.data.includes('system_cpu_usage')) {
                this.testResults.infrastructure.tests.push({
                    name: 'Metrics Content Validation',
                    success: true,
                    status: 200
                });
                this.passedTests++;
            } else {
                this.testResults.infrastructure.tests.push({
                    name: 'Metrics Content Validation',
                    success: false,
                    status: metricsResult.status,
                    error: 'Missing expected metrics'
                });
                this.testResults.infrastructure.errors.push('Metrics Content: Missing expected metrics');
                this.failedTests++;
            }
            this.totalTests++;
        } catch (error) {
            this.testResults.infrastructure.tests.push({
                name: 'Metrics Content Validation',
                success: false,
                error: error.message
            });
            this.testResults.infrastructure.errors.push(`Metrics Content: ${error.message}`);
            this.failedTests++;
            this.totalTests++;
        }

        this.testResults.infrastructure.status = this.testResults.infrastructure.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.infrastructure.status}`);
    }

    async testDistributedTracing() {
        console.log('\n🔍 Testing Distributed Tracing...');
        
        const tests = [
            { name: 'Service Map Endpoint', endpoint: '/api/tracing/service-map', expected: 200 },
            { name: 'Performance Report', endpoint: '/api/tracing/performance-report', expected: 200 },
            { name: 'Recent Traces', endpoint: '/api/tracing/recent-traces', expected: 200 }
        ];

        for (const test of tests) {
            const result = await this.runTest(test.name, test.endpoint, test.expected);
            this.testResults.tracing.tests.push({
                name: test.name,
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.tracing.errors.push(`${test.name}: ${result.error || 'Status ' + result.status}`);
            }
        }

        // Test service map content
        try {
            const serviceMapResult = await this.makeRequest('/api/tracing/service-map');
            if (serviceMapResult.status === 200 && serviceMapResult.data.success) {
                const data = serviceMapResult.data.data;
                if (data.services && data.connections) {
                    this.testResults.tracing.tests.push({
                        name: 'Service Map Content Validation',
                        success: true,
                        status: 200
                    });
                    this.passedTests++;
                } else {
                    this.testResults.tracing.tests.push({
                        name: 'Service Map Content Validation',
                        success: false,
                        status: 200,
                        error: 'Missing services or connections data'
                    });
                    this.testResults.tracing.errors.push('Service Map Content: Missing expected data');
                    this.failedTests++;
                }
            } else {
                this.testResults.tracing.tests.push({
                    name: 'Service Map Content Validation',
                    success: false,
                    status: serviceMapResult.status,
                    error: 'Failed to get service map'
                });
                this.testResults.tracing.errors.push('Service Map Content: Failed to get data');
                this.failedTests++;
            }
            this.totalTests++;
        } catch (error) {
            this.testResults.tracing.tests.push({
                name: 'Service Map Content Validation',
                success: false,
                error: error.message
            });
            this.testResults.tracing.errors.push(`Service Map Content: ${error.message}`);
            this.failedTests++;
            this.totalTests++;
        }

        this.testResults.tracing.status = this.testResults.tracing.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.tracing.status}`);
    }

    async testSessionReplay() {
        console.log('\n🔍 Testing Session Replay...');
        
        const tests = [
            { name: 'Session Replay Sessions', endpoint: '/api/monitoring/session-replay/sessions', expected: 200 }
        ];

        for (const test of tests) {
            const result = await this.runTest(test.name, test.endpoint, test.expected);
            this.testResults.sessionReplay.tests.push({
                name: test.name,
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.sessionReplay.errors.push(`${test.name}: ${result.error || 'Status ' + result.status}`);
            }
        }

        // Test session replay POST endpoint
        try {
            const testData = {
                sessionId: 'test-session-' + Date.now(),
                startTime: Date.now(),
                events: [
                    { type: 'click', x: 100, y: 200, timestamp: Date.now() }
                ]
            };
            
            const result = await this.runTest('Session Replay POST', '/api/monitoring/session-replay', 201, 'POST', testData);
            this.testResults.sessionReplay.tests.push({
                name: 'Session Replay POST',
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.sessionReplay.errors.push(`Session Replay POST: ${result.error || 'Status ' + result.status}`);
            }
        } catch (error) {
            this.testResults.sessionReplay.tests.push({
                name: 'Session Replay POST',
                success: false,
                error: error.message
            });
            this.testResults.sessionReplay.errors.push(`Session Replay POST: ${error.message}`);
            this.failedTests++;
            this.totalTests++;
        }

        this.testResults.sessionReplay.status = this.testResults.sessionReplay.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.sessionReplay.status}`);
    }

    async testOnCallManagement() {
        console.log('\n🔍 Testing On-Call Management...');
        
        const tests = [
            { name: 'On-Call Users', endpoint: '/api/oncall/users', expected: 200 },
            { name: 'On-Call Incidents', endpoint: '/api/oncall/incidents', expected: 200 },
            { name: 'On-Call Schedule', endpoint: '/api/oncall/schedule', expected: 200 },
            { name: 'Current On-Call', endpoint: '/api/oncall/current', expected: 200 }
        ];

        for (const test of tests) {
            const result = await this.runTest(test.name, test.endpoint, test.expected);
            this.testResults.onCall.tests.push({
                name: test.name,
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.onCall.errors.push(`${test.name}: ${result.error || 'Status ' + result.status}`);
            }
        }

        // Test incident creation
        try {
            const incidentData = {
                title: 'Test Incident',
                description: 'Test incident for debugging',
                severity: 'medium'
            };
            
            const result = await this.runTest('Incident Creation', '/api/oncall/incidents', 201, 'POST', incidentData);
            this.testResults.onCall.tests.push({
                name: 'Incident Creation',
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.onCall.errors.push(`Incident Creation: ${result.error || 'Status ' + result.status}`);
            }
        } catch (error) {
            this.testResults.onCall.tests.push({
                name: 'Incident Creation',
                success: false,
                error: error.message
            });
            this.testResults.onCall.errors.push(`Incident Creation: ${error.message}`);
            this.failedTests++;
            this.totalTests++;
        }

        this.testResults.onCall.status = this.testResults.onCall.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.onCall.status}`);
    }

    async testVulnerabilityScanning() {
        console.log('\n🔍 Testing Vulnerability Scanning...');
        
        const tests = [
            { name: 'Security Policies', endpoint: '/api/security/policies', expected: 200 },
            { name: 'Security Scans', endpoint: '/api/security/scans', expected: 200 },
            { name: 'Vulnerability Summary', endpoint: '/api/security/vulnerabilities/summary', expected: 200 }
        ];

        for (const test of tests) {
            const result = await this.runTest(test.name, test.endpoint, test.expected);
            this.testResults.vulnerability.tests.push({
                name: test.name,
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.vulnerability.errors.push(`${test.name}: ${result.error || 'Status ' + result.status}`);
            }
        }

        // Test dependency scan
        try {
            const result = await this.runTest('Dependency Scan', '/api/security/scan/dependencies', 200, 'POST');
            this.testResults.vulnerability.tests.push({
                name: 'Dependency Scan',
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.vulnerability.errors.push(`Dependency Scan: ${result.error || 'Status ' + result.status}`);
            }
        } catch (error) {
            this.testResults.vulnerability.tests.push({
                name: 'Dependency Scan',
                success: false,
                error: error.message
            });
            this.testResults.vulnerability.errors.push(`Dependency Scan: ${error.message}`);
            this.failedTests++;
            this.totalTests++;
        }

        this.testResults.vulnerability.status = this.testResults.vulnerability.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.vulnerability.status}`);
    }

    async testThreatIntelligence() {
        console.log('\n🔍 Testing Threat Intelligence...');
        
        const tests = [
            { name: 'Threat Feeds', endpoint: '/api/threat/feeds', expected: 200 },
            { name: 'Threat Indicators', endpoint: '/api/threat/indicators', expected: 200 },
            { name: 'Threat Actors', endpoint: '/api/threat/actors', expected: 200 },
            { name: 'Threat Summary', endpoint: '/api/threat/summary', expected: 200 }
        ];

        for (const test of tests) {
            const result = await this.runTest(test.name, test.endpoint, test.expected);
            this.testResults.threat.tests.push({
                name: test.name,
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.threat.errors.push(`${test.name}: ${result.error || 'Status ' + result.status}`);
            }
        }

        // Test threat indicator check
        try {
            const checkData = {
                indicatorType: 'ip',
                value: '192.168.1.1'
            };
            
            const result = await this.runTest('Threat Check', '/api/threat/check', 200, 'POST', checkData);
            this.testResults.threat.tests.push({
                name: 'Threat Check',
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.threat.errors.push(`Threat Check: ${result.error || 'Status ' + result.status}`);
            }
        } catch (error) {
            this.testResults.threat.tests.push({
                name: 'Threat Check',
                success: false,
                error: error.message
            });
            this.testResults.threat.errors.push(`Threat Check: ${error.message}`);
            this.failedTests++;
            this.totalTests++;
        }

        this.testResults.threat.status = this.testResults.threat.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.threat.status}`);
    }

    async testAutomatedReporting() {
        console.log('\n🔍 Testing Automated Reporting...');
        
        const tests = [
            { name: 'Report Templates', endpoint: '/api/reports/templates', expected: 200 },
            { name: 'Report Schedules', endpoint: '/api/reports/schedules', expected: 200 },
            { name: 'Delivery Methods', endpoint: '/api/reports/delivery-methods', expected: 200 }
        ];

        for (const test of tests) {
            const result = await this.runTest(test.name, test.endpoint, test.expected);
            this.testResults.reporting.tests.push({
                name: test.name,
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.reporting.errors.push(`${test.name}: ${result.error || 'Status ' + result.status}`);
            }
        }

        // Test report generation
        try {
            const reportData = {
                templateId: 'system_health',
                options: { period: 'last_24_hours' }
            };
            
            const result = await this.runTest('Report Generation', '/api/reports/generate', 200, 'POST', reportData);
            this.testResults.reporting.tests.push({
                name: 'Report Generation',
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.reporting.errors.push(`Report Generation: ${result.error || 'Status ' + result.status}`);
            }
        } catch (error) {
            this.testResults.reporting.tests.push({
                name: 'Report Generation',
                success: false,
                error: error.message
            });
            this.testResults.reporting.errors.push(`Report Generation: ${error.message}`);
            this.failedTests++;
            this.totalTests++;
        }

        this.testResults.reporting.status = this.testResults.reporting.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.reporting.status}`);
    }

    async testAllEndpoints() {
        console.log('\n🔍 Testing All API Endpoints...');
        
        const endpoints = [
            // Core endpoints
            { name: 'Health Check', endpoint: '/api/health', expected: 200 },
            { name: 'Database Health', endpoint: '/api/health/database', expected: 200 },
            { name: 'Metrics', endpoint: '/metrics', expected: 200 },
            
            // Monitoring endpoints
            { name: 'Monitoring Status', endpoint: '/api/monitoring/status', expected: 200 },
            { name: 'Security Dashboard', endpoint: '/api/security/dashboard', expected: 200 },
            { name: 'Business Analytics', endpoint: '/api/bi/analytics', expected: 200 },
            { name: 'KPI Dashboard', endpoint: '/api/bi/kpi', expected: 200 },
            { name: 'Alert Status', endpoint: '/api/alerts/status', expected: 200 },
            
            // Tracing endpoints
            { name: 'Service Map', endpoint: '/api/tracing/service-map', expected: 200 },
            { name: 'Performance Report', endpoint: '/api/tracing/performance-report', expected: 200 },
            { name: 'Recent Traces', endpoint: '/api/tracing/recent-traces', expected: 200 },
            
            // On-call endpoints
            { name: 'On-Call Users', endpoint: '/api/oncall/users', expected: 200 },
            { name: 'On-Call Incidents', endpoint: '/api/oncall/incidents', expected: 200 },
            { name: 'On-Call Current', endpoint: '/api/oncall/current', expected: 200 },
            
            // Security endpoints
            { name: 'Security Policies', endpoint: '/api/security/policies', expected: 200 },
            { name: 'Security Scans', endpoint: '/api/security/scans', expected: 200 },
            { name: 'Vulnerability Summary', endpoint: '/api/security/vulnerabilities/summary', expected: 200 },
            
            // Threat intelligence endpoints
            { name: 'Threat Feeds', endpoint: '/api/threat/feeds', expected: 200 },
            { name: 'Threat Indicators', endpoint: '/api/threat/indicators', expected: 200 },
            { name: 'Threat Actors', endpoint: '/api/threat/actors', expected: 200 },
            { name: 'Threat Summary', endpoint: '/api/threat/summary', expected: 200 },
            
            // Reporting endpoints
            { name: 'Report Templates', endpoint: '/api/reports/templates', expected: 200 },
            { name: 'Report Schedules', endpoint: '/api/reports/schedules', expected: 200 },
            { name: 'Delivery Methods', endpoint: '/api/reports/delivery-methods', expected: 200 }
        ];

        for (const endpoint of endpoints) {
            const result = await this.runTest(endpoint.name, endpoint.endpoint, endpoint.expected);
            this.testResults.endpoints.tests.push({
                name: endpoint.name,
                success: result.success,
                status: result.status,
                error: result.error
            });
            
            if (!result.success) {
                this.testResults.endpoints.errors.push(`${endpoint.name}: ${result.error || 'Status ' + result.status}`);
            }
        }

        this.testResults.endpoints.status = this.testResults.endpoints.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.endpoints.status}`);
    }

    async testIntegration() {
        console.log('\n🔍 Testing System Integration...');
        
        // Test that all systems are working together
        const integrationTests = [
            { name: 'System Health Integration', test: async () => {
                const health = await this.makeRequest('/api/health');
                const monitoring = await this.makeRequest('/api/monitoring/status');
                return health.status === 200 && monitoring.status === 200;
            }},
            
            { name: 'Security Integration', test: async () => {
                const security = await this.makeRequest('/api/security/dashboard');
                const threat = await this.makeRequest('/api/threat/summary');
                return security.status === 200 && threat.status === 200;
            }},
            
            { name: 'Business Intelligence Integration', test: async () => {
                const analytics = await this.makeRequest('/api/bi/analytics');
                const kpi = await this.makeRequest('/api/bi/kpi');
                return analytics.status === 200 && kpi.status === 200;
            }}
        ];

        for (const test of integrationTests) {
            this.totalTests++;
            try {
                const result = await test.test();
                if (result) {
                    this.passedTests++;
                    this.testResults.integration.tests.push({
                        name: test.name,
                        success: true,
                        status: 200
                    });
                } else {
                    this.failedTests++;
                    this.testResults.integration.tests.push({
                        name: test.name,
                        success: false,
                        status: 500,
                        error: 'Integration test failed'
                    });
                    this.testResults.integration.errors.push(`${test.name}: Integration test failed`);
                }
            } catch (error) {
                this.failedTests++;
                this.testResults.integration.tests.push({
                    name: test.name,
                    success: false,
                    error: error.message
                });
                this.testResults.integration.errors.push(`${test.name}: ${error.message}`);
            }
        }

        this.testResults.integration.status = this.testResults.integration.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`   Status: ${this.testResults.integration.status}`);
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Monitoring Systems Debug...\n');
        
        // Check if server is running
        try {
            await this.makeRequest('/api/health');
            console.log('✅ Server is running and accessible');
        } catch (error) {
            console.log('❌ Server is not running or not accessible');
            console.log('   Please start the server with: node server-standalone.js');
            return;
        }

        // Run all test suites
        await this.testInfrastructureMonitoring();
        await this.testDistributedTracing();
        await this.testSessionReplay();
        await this.testOnCallManagement();
        await this.testVulnerabilityScanning();
        await this.testThreatIntelligence();
        await this.testAutomatedReporting();
        await this.testAllEndpoints();
        await this.testIntegration();

        // Generate final report
        this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE MONITORING SYSTEMS DEBUG REPORT');
        console.log('='.repeat(80));
        
        console.log(`\n📈 Overall Results:`);
        console.log(`   Total Tests: ${this.totalTests}`);
        console.log(`   Passed: ${this.passedTests} (${((this.passedTests/this.totalTests)*100).toFixed(1)}%)`);
        console.log(`   Failed: ${this.failedTests} (${((this.failedTests/this.totalTests)*100).toFixed(1)}%)`);
        
        console.log(`\n🔍 System Status:`);
        
        const systems = [
            { name: 'Infrastructure Monitoring', key: 'infrastructure' },
            { name: 'Distributed Tracing', key: 'tracing' },
            { name: 'Session Replay', key: 'sessionReplay' },
            { name: 'On-Call Management', key: 'onCall' },
            { name: 'Vulnerability Scanning', key: 'vulnerability' },
            { name: 'Threat Intelligence', key: 'threat' },
            { name: 'Automated Reporting', key: 'reporting' },
            { name: 'API Endpoints', key: 'endpoints' },
            { name: 'System Integration', key: 'integration' }
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

        console.log(`\n🎯 Overall System Health: ${totalPassed}/${totalSystems} systems operational (${((totalPassed/totalSystems)*100).toFixed(1)}%)`);

        // Recommendations
        console.log(`\n💡 Recommendations:`);
        
        if (this.failedTests === 0) {
            console.log(`   🎉 All monitoring systems are operational!`);
            console.log(`   ✅ System is ready for production deployment`);
        } else {
            console.log(`   🔧 Fix failed endpoints to achieve full functionality`);
            console.log(`   📋 Check error logs for detailed troubleshooting information`);
            
            // Specific recommendations based on failed systems
            for (const system of systems) {
                const result = this.testResults[system.key];
                if (result.status === 'FAIL') {
                    console.log(`   ⚠️  ${system.name}: Review and fix failing tests`);
                }
            }
        }

        console.log(`\n📋 Next Steps:`);
        console.log(`   1. Review any failed tests and fix underlying issues`);
        console.log(`   2. Configure production environment variables`);
        console.log(`   3. Set up external monitoring services (Prometheus, Grafana)`);
        console.log(`   4. Configure alerting channels (Email, Slack, PagerDuty)`);
        console.log(`   5. Deploy to production environment`);

        console.log('\n' + '='.repeat(80));
        console.log('🏁 DEBUG SESSION COMPLETE');
        console.log('='.repeat(80));
    }
}

// Run the debugging session
if (require.main === module) {
    const monitoringDebugger = new MonitoringSystemsDebugger();
    monitoringDebugger.runAllTests().catch(console.error);
}

module.exports = MonitoringSystemsDebugger;
