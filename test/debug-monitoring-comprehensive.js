const http = require('http');
const { performance } = require('perf_hooks');

// Comprehensive monitoring system debugging framework
class MonitoringSystemDebugger {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: [],
            systems: {}
        };
        this.systemTests = [
            {
                name: 'APM Integration',
                tests: [
                    { name: 'APM Metrics Collection', endpoint: '/metrics', method: 'GET' },
                    { name: 'Request Metrics Tracking', endpoint: '/api/comprehensive-monitoring/metrics', method: 'GET' },
                    { name: 'Performance Metrics', endpoint: '/api/comprehensive-monitoring/overview', method: 'GET' }
                ]
            },
            {
                name: 'Infrastructure Monitoring',
                tests: [
                    { name: 'System Health Check', endpoint: '/api/health', method: 'GET' },
                    { name: 'Database Health', endpoint: '/api/health/database', method: 'GET' },
                    { name: 'System Overview', endpoint: '/api/comprehensive-monitoring/overview', method: 'GET' }
                ]
            },
            {
                name: 'Database Monitoring',
                tests: [
                    { name: 'Database Metrics', endpoint: '/api/comprehensive-monitoring/database', method: 'GET' },
                    { name: 'Database Health Check', endpoint: '/api/health/database', method: 'GET' },
                    { name: 'Query Performance', endpoint: '/api/comprehensive-monitoring/metrics', method: 'GET' }
                ]
            },
            {
                name: 'Frontend Monitoring',
                tests: [
                    { name: 'Frontend Error Tracking', endpoint: '/api/monitoring/error', method: 'POST', data: { type: 'test', message: 'Test error' } },
                    { name: 'Frontend Metrics', endpoint: '/api/monitoring/metrics', method: 'POST', data: { pageLoadTime: 100 } },
                    { name: 'Session Replay', endpoint: '/api/comprehensive-monitoring/session-replay', method: 'POST', data: { url: 'test.com' } }
                ]
            },
            {
                name: 'Security Monitoring',
                tests: [
                    { name: 'Security Dashboard', endpoint: '/api/comprehensive-monitoring/security', method: 'GET' },
                    { name: 'Security Events', endpoint: '/api/security/dashboard', method: 'GET' },
                    { name: 'Threat Detection', endpoint: '/api/comprehensive-monitoring/security', method: 'GET' }
                ]
            },
            {
                name: 'Business Intelligence',
                tests: [
                    { name: 'KPI Dashboard', endpoint: '/api/bi/kpi', method: 'GET' },
                    { name: 'Business Analytics', endpoint: '/api/bi/analytics', method: 'GET' },
                    { name: 'Business Metrics', endpoint: '/api/comprehensive-monitoring/business', method: 'GET' }
                ]
            },
            {
                name: 'Alerting System',
                tests: [
                    { name: 'Alert Status', endpoint: '/api/comprehensive-monitoring/alerts', method: 'GET' },
                    { name: 'Alert Rules', endpoint: '/api/alerts/status', method: 'GET' },
                    { name: 'Alert Management', endpoint: '/api/comprehensive-monitoring/alerts', method: 'GET' }
                ]
            },
            {
                name: 'Logging Infrastructure',
                tests: [
                    { name: 'Log Statistics', endpoint: '/api/comprehensive-monitoring/logging', method: 'GET' },
                    { name: 'Log Search', endpoint: '/api/comprehensive-monitoring/logs/search', method: 'POST', data: { query: 'test' } },
                    { name: 'Log Trends', endpoint: '/api/comprehensive-monitoring/logging', method: 'GET' }
                ]
            },
            {
                name: 'Distributed Tracing',
                tests: [
                    { name: 'Tracing Data', endpoint: '/api/comprehensive-monitoring/tracing', method: 'GET' },
                    { name: 'Service Maps', endpoint: '/api/comprehensive-monitoring/tracing', method: 'GET' },
                    { name: 'Performance Budgets', endpoint: '/api/comprehensive-monitoring/tracing', method: 'GET' }
                ]
            },
            {
                name: 'Session Replay',
                tests: [
                    { name: 'Create Session', endpoint: '/api/comprehensive-monitoring/session-replay', method: 'POST', data: { url: 'test.com' } },
                    { name: 'Record Event', endpoint: '/api/comprehensive-monitoring/session-replay/test123/event', method: 'POST', data: { type: 'click' } },
                    { name: 'Get Sessions', endpoint: '/api/comprehensive-monitoring/session-replay', method: 'GET' }
                ]
            },
            {
                name: 'On-call Scheduling',
                tests: [
                    { name: 'On-call Status', endpoint: '/api/comprehensive-monitoring/alerts', method: 'GET' },
                    { name: 'Incident Management', endpoint: '/api/comprehensive-monitoring/alerts', method: 'GET' },
                    { name: 'Escalation Policies', endpoint: '/api/comprehensive-monitoring/alerts', method: 'GET' }
                ]
            },
            {
                name: 'Threat Intelligence',
                tests: [
                    { name: 'Threat Data', endpoint: '/api/comprehensive-monitoring/security', method: 'GET' },
                    { name: 'Vulnerability Scanning', endpoint: '/api/comprehensive-monitoring/security', method: 'GET' },
                    { name: 'Security Analytics', endpoint: '/api/security/dashboard', method: 'GET' }
                ]
            },
            {
                name: 'Automated Reporting',
                tests: [
                    { name: 'Report Generation', endpoint: '/api/comprehensive-monitoring/dashboard', method: 'GET' },
                    { name: 'Data Export', endpoint: '/api/comprehensive-monitoring/overview', method: 'GET' },
                    { name: 'Report Templates', endpoint: '/api/bi/analytics', method: 'GET' }
                ]
            }
        ];
    }

    // Make HTTP request
    async makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const startTime = performance.now();
            const url = new URL(endpoint, this.baseUrl);
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'NEXUS-Monitoring-Debugger/1.0'
                }
            };

            const req = http.request(url, options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    const endTime = performance.now();
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: responseData,
                        responseTime: endTime - startTime
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (data && method !== 'GET') {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    // Run individual test
    async runTest(systemName, testName, testConfig) {
        this.testResults.total++;
        
        try {
            console.log(`🧪 Testing: ${systemName} - ${testName}`);
            
            const response = await this.makeRequest(testConfig.endpoint, testConfig.method, testConfig.data);
            
            let result = {
                success: false,
                statusCode: response.statusCode,
                responseTime: response.responseTime,
                data: null,
                error: null
            };

            // Parse response body if possible
            try {
                result.data = JSON.parse(response.body);
            } catch (e) {
                result.data = response.body;
            }

            // Evaluate test success
            if (response.statusCode >= 200 && response.statusCode < 300) {
                result.success = true;
                this.testResults.passed++;
                console.log(`✅ ${systemName} - ${testName} - PASSED (${response.responseTime.toFixed(2)}ms)`);
                
                // Initialize system results if not exists
                if (!this.testResults.systems[systemName]) {
                    this.testResults.systems[systemName] = { passed: 0, failed: 0, total: 0 };
                }
                this.testResults.systems[systemName].passed++;
            } else {
                result.error = `HTTP ${response.statusCode}`;
                this.testResults.failed++;
                console.log(`❌ ${systemName} - ${testName} - FAILED (HTTP ${response.statusCode})`);
                
                if (!this.testResults.systems[systemName]) {
                    this.testResults.systems[systemName] = { passed: 0, failed: 0, total: 0 };
                }
                this.testResults.systems[systemName].failed++;
                this.testResults.errors.push({ system: systemName, test: testName, error: result.error });
            }

            if (!this.testResults.systems[systemName]) {
                this.testResults.systems[systemName] = { passed: 0, failed: 0, total: 0 };
            }
            this.testResults.systems[systemName].total++;

            return result;

        } catch (error) {
            this.testResults.failed++;
            console.log(`❌ ${systemName} - ${testName} - ERROR: ${error.message}`);
            
            if (!this.testResults.systems[systemName]) {
                this.testResults.systems[systemName] = { passed: 0, failed: 0, total: 0 };
            }
            this.testResults.systems[systemName].failed++;
            this.testResults.systems[systemName].total++;
            
            this.testResults.errors.push({ system: systemName, test: testName, error: error.message });
            
            return {
                success: false,
                error: error.message,
                responseTime: 0,
                data: null
            };
        }
    }

    // Run all tests for a system
    async runSystemTests(system) {
        console.log(`\n🔍 Debugging System: ${system.name}`);
        console.log('='.repeat(50));
        
        const systemResults = [];
        
        for (const test of system.tests) {
            const result = await this.runTest(system.name, test.name, test);
            systemResults.push({ test: test.name, result });
            
            // Add delay between tests to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return systemResults;
    }

    // Run comprehensive debugging
    async runComprehensiveDebug() {
        console.log('🚀 Starting Comprehensive Monitoring System Debug');
        console.log('='.repeat(60));
        console.log(`📊 Testing ${this.systemTests.length} monitoring systems`);
        console.log(`🧪 Total tests to run: ${this.systemTests.reduce((sum, system) => sum + system.tests.length, 0)}`);
        
        // Check if server is running
        try {
            await this.makeRequest('/api/health');
            console.log('✅ Server is running and accessible');
        } catch (error) {
            console.log('❌ Server is not running or not accessible');
            console.log('   Please start the server first: node server-monitoring-test.js');
            return this.testResults;
        }

        // Run all system tests
        for (const system of this.systemTests) {
            await this.runSystemTests(system);
        }

        // Print comprehensive results
        this.printResults();
        
        return this.testResults;
    }

    // Print detailed results
    printResults() {
        console.log('\n📊 Comprehensive Debug Results');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.testResults.total}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
        
        console.log('\n🎯 System-by-System Results:');
        console.log('-'.repeat(30));
        
        for (const [systemName, results] of Object.entries(this.testResults.systems)) {
            const successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
            const status = successRate === '100.0' ? '✅' : successRate >= '80.0' ? '⚠️' : '❌';
            console.log(`${status} ${systemName}: ${results.passed}/${results.total} (${successRate}%)`);
        }
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ Failed Tests:');
            for (const error of this.testResults.errors) {
                console.log(`   ${error.system} - ${error.test}: ${error.error}`);
            }
        }
        
        console.log('\n🎯 Overall System Status:');
        if (this.testResults.failed === 0) {
            console.log('✅ All monitoring systems are operational and debugged!');
        } else if (this.testResults.failed <= 5) {
            console.log('⚠️  Monitoring systems mostly operational with minor issues');
        } else {
            console.log('❌ Monitoring systems have significant issues that need attention');
        }
        
        // Recommendations
        console.log('\n🔧 Debugging Recommendations:');
        if (this.testResults.failed === 0) {
            console.log('✅ System is ready for production deployment');
        } else {
            console.log('1. Fix failed endpoints and tests');
            console.log('2. Verify all monitoring components are properly integrated');
            console.log('3. Test with real data and traffic');
            console.log('4. Configure alert thresholds and notifications');
        }
    }
}

// Main execution
const main = async () => {
    const monitoringDebugger = new MonitoringSystemDebugger();
    const results = await monitoringDebugger.runComprehensiveDebug();
    
    // Exit with appropriate code
    process.exit(results.failed === 0 ? 0 : 1);
};

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = MonitoringSystemDebugger;
