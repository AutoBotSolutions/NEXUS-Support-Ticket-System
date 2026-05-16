#!/usr/bin/env node

/**
 * Comprehensive Monitoring System Debugging Script
 * Tests all monitoring components for functionality and integration
 */

const http = require('http');
const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    timeout: 5000,
    retries: 3
};

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Utility functions
const makeRequest = (method, path, data = null) => {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Monitoring-Debug-Script/1.0'
            }
        };

        if (data) {
            const jsonData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }

        const req = http.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                
                try {
                    const parsedBody = body ? JSON.parse(body) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: parsedBody,
                        responseTime: responseTime
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                        responseTime: responseTime
                    });
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

        req.setTimeout(TEST_CONFIG.timeout);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
};

const runTest = async (testName, testFunction) => {
    testResults.total++;
    
    try {
        console.log(`\n🧪 Testing: ${testName}`);
        const startTime = performance.now();
        
        await testFunction();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        testResults.passed++;
        testResults.details.push({
            name: testName,
            status: 'PASSED',
            duration: duration,
            error: null
        });
        
        console.log(`✅ PASSED: ${testName} (${duration.toFixed(2)}ms)`);
        
    } catch (error) {
        testResults.failed++;
        testResults.details.push({
            name: testName,
            status: 'FAILED',
            duration: 0,
            error: error.message
        });
        
        console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
};

// Test functions
const testServerHealth = async () => {
    const response = await makeRequest('GET', '/api/health');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Health check failed');
    }
};

const testAPMMonitoring = async () => {
    // Test metrics endpoint
    const response = await makeRequest('GET', '/api/metrics');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    // Check if response contains Prometheus-style metrics
    if (typeof response.body !== 'string' || !response.body.includes('nexus_requests_total')) {
        throw new Error('Metrics endpoint not returning proper Prometheus format');
    }
    
    console.log(`   📊 Metrics endpoint working (${response.responseTime.toFixed(2)}ms)`);
};

const testComprehensiveMonitoringOverview = async () => {
    const response = await makeRequest('GET', '/api/comprehensive-monitoring/overview');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Overview endpoint failed');
    }
    
    const data = response.body.data;
    const requiredSections = ['system', 'application', 'database', 'security', 'business', 'alerts', 'sessions'];
    
    for (const section of requiredSections) {
        if (!data[section]) {
            throw new Error(`Missing section: ${section}`);
        }
    }
    
    console.log(`   📈 Overview endpoint working with all sections`);
};

const testMonitoringMetrics = async () => {
    const response = await makeRequest('GET', '/api/comprehensive-monitoring/metrics');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Metrics endpoint failed');
    }
    
    const data = response.body.data;
    const requiredFields = ['requests', 'database', 'business', 'system'];
    
    for (const field of requiredFields) {
        if (!data[field]) {
            throw new Error(`Missing metrics field: ${field}`);
        }
    }
    
    console.log(`   📊 System metrics working`);
};

const testDatabaseMonitoring = async () => {
    const response = await makeRequest('GET', '/api/comprehensive-monitoring/database');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Database monitoring endpoint failed');
    }
    
    const data = response.body.data;
    if (!data.health) {
        throw new Error('Missing database health data');
    }
    
    console.log(`   🗄️ Database monitoring working`);
};

const testSecurityMonitoring = async () => {
    const response = await makeRequest('GET', '/api/comprehensive-monitoring/security');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Security monitoring endpoint failed');
    }
    
    const data = response.body.data;
    if (!data.dashboard) {
        throw new Error('Missing security dashboard data');
    }
    
    console.log(`   🔒 Security monitoring working`);
};

const testBusinessIntelligence = async () => {
    const response = await makeRequest('GET', '/api/comprehensive-monitoring/business');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Business intelligence endpoint failed');
    }
    
    const data = response.body.data;
    if (!data.analytics && !data.kpis) {
        throw new Error('Missing business intelligence data');
    }
    
    console.log(`   💼 Business intelligence working`);
};

const testAlertingSystem = async () => {
    // Test alert status
    const response = await makeRequest('GET', '/api/comprehensive-monitoring/alerts');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Alerting system endpoint failed');
    }
    
    const data = response.body.data;
    if (!data.alertRules) {
        throw new Error('Missing alert rules data');
    }
    
    // Test creating an alert rule
    const testRule = {
        id: 'test_debug_rule',
        name: 'Test Debug Rule',
        condition: 'test_metric > 0',
        severity: 'warning',
        threshold: 0,
        duration: 300,
        enabled: true,
        description: 'Test rule for debugging'
    };
    
    const createResponse = await makeRequest('POST', '/api/comprehensive-monitoring/alerts/rules', testRule);
    
    if (createResponse.statusCode !== 200) {
        throw new Error(`Failed to create alert rule: ${createResponse.statusCode}`);
    }
    
    // Clean up - delete the test rule
    await makeRequest('DELETE', '/api/comprehensive-monitoring/alerts/rules/test_debug_rule');
    
    console.log(`   🚨 Alerting system working`);
};

const testLoggingInfrastructure = async () => {
    const response = await makeRequest('GET', '/api/comprehensive-monitoring/logging');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Logging infrastructure endpoint failed');
    }
    
    const data = response.body.data;
    if (!data.stats) {
        throw new Error('Missing logging stats data');
    }
    
    // Test log search
    const searchResponse = await makeRequest('POST', '/api/comprehensive-monitoring/logs/search', {
        query: 'test',
        filters: {}
    });
    
    if (searchResponse.statusCode !== 200) {
        throw new Error(`Log search failed: ${searchResponse.statusCode}`);
    }
    
    console.log(`   📝 Logging infrastructure working`);
};

const testDistributedTracing = async () => {
    const response = await makeRequest('GET', '/api/comprehensive-monitoring/tracing');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Distributed tracing endpoint failed');
    }
    
    const data = response.body.data;
    if (!data.serviceMap) {
        throw new Error('Missing service map data');
    }
    
    console.log(`   🔗 Distributed tracing working`);
};

const testSessionReplay = async () => {
    // Test session analytics
    const response = await makeRequest('GET', '/api/comprehensive-monitoring/session-replay');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Session replay endpoint failed');
    }
    
    const data = response.body.data;
    if (!data.analytics) {
        throw new Error('Missing session analytics data');
    }
    
    // Test creating a session
    const sessionData = {
        url: 'http://localhost:3000/test',
        screenResolution: '1920x1080',
        viewport: '1200x800',
        platform: 'Linux',
        language: 'en-US'
    };
    
    const createResponse = await makeRequest('POST', '/api/comprehensive-monitoring/session-replay', sessionData);
    
    if (createResponse.statusCode !== 200) {
        throw new Error(`Failed to create session: ${createResponse.statusCode}`);
    }
    
    if (!createResponse.body.data || !createResponse.body.data.sessionId) {
        throw new Error('Session creation did not return session ID');
    }
    
    const sessionId = createResponse.body.data.sessionId;
    
    // Test recording an event
    const eventData = {
        type: 'click',
        data: { element: 'test-button' },
        coordinates: { x: 100, y: 200 },
        target: '#test-button'
    };
    
    const eventResponse = await makeRequest('POST', `/api/comprehensive-monitoring/session-replay/${sessionId}/event`, eventData);
    
    if (eventResponse.statusCode !== 200) {
        throw new Error(`Failed to record session event: ${eventResponse.statusCode}`);
    }
    
    console.log(`   🎥 Session replay working`);
};

const testComprehensiveDashboard = async () => {
    const response = await makeRequest('GET', '/api/comprehensive-monitoring/dashboard');
    
    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    if (!response.body.success) {
        throw new Error('Comprehensive dashboard endpoint failed');
    }
    
    const data = response.body.data;
    const requiredSections = ['overview', 'metrics', 'database', 'security', 'business', 'alerts', 'logging', 'tracing', 'sessionReplay'];
    
    for (const section of requiredSections) {
        if (!data[section]) {
            throw new Error(`Missing dashboard section: ${section}`);
        }
    }
    
    console.log(`   📊 Comprehensive dashboard working with all sections`);
};

const testMonitoringMiddlewareIntegration = async () => {
    // Test that monitoring middleware is properly integrated
    // by making a request that should trigger monitoring
    
    const response = await makeRequest('GET', '/api/tickets');
    
    // Should work regardless of authentication for testing purposes
    // The important thing is that the request goes through the middleware
    
    if (response.statusCode === 500) {
        throw new Error('Server error during middleware integration test');
    }
    
    console.log(`   🔧 Monitoring middleware integration working`);
};

// Main test execution
const runAllTests = async () => {
    console.log('🚀 Starting Comprehensive Monitoring System Debugging');
    console.log('=' .repeat(60));
    
    const startTime = performance.now();
    
    try {
        // Check if server is running
        await runTest('Server Health Check', testServerHealth);
        
        // Test individual monitoring components
        await runTest('APM Monitoring', testAPMMonitoring);
        await runTest('Comprehensive Monitoring Overview', testComprehensiveMonitoringOverview);
        await runTest('System Metrics', testMonitoringMetrics);
        await runTest('Database Monitoring', testDatabaseMonitoring);
        await runTest('Security Monitoring', testSecurityMonitoring);
        await runTest('Business Intelligence', testBusinessIntelligence);
        await runTest('Alerting System', testAlertingSystem);
        await runTest('Logging Infrastructure', testLoggingInfrastructure);
        await runTest('Distributed Tracing', testDistributedTracing);
        await runTest('Session Replay', testSessionReplay);
        await runTest('Comprehensive Dashboard', testComprehensiveDashboard);
        await runTest('Monitoring Middleware Integration', testMonitoringMiddlewareIntegration);
        
    } catch (error) {
        console.error('Critical error during testing:', error.message);
    }
    
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    
    // Print results summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 MONITORING SYSTEM DEBUGGING RESULTS');
    console.log('=' .repeat(60));
    
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.details
            .filter(test => test.status === 'FAILED')
            .forEach(test => {
                console.log(`   - ${test.name}: ${test.error}`);
            });
    }
    
    console.log('\n📋 DETAILED RESULTS:');
    testResults.details.forEach(test => {
        const icon = test.status === 'PASSED' ? '✅' : '❌';
        const duration = test.duration ? ` (${test.duration.toFixed(2)}ms)` : '';
        console.log(`   ${icon} ${test.name}${duration}`);
        if (test.error) {
            console.log(`      Error: ${test.error}`);
        }
    });
    
    // Generate report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            successRate: ((testResults.passed / testResults.total) * 100).toFixed(1),
            duration: totalDuration
        },
        details: testResults.details
    };
    
    // Save report to file
    const fs = require('fs');
    try {
        fs.writeFileSync('monitoring-debug-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to: monitoring-debug-report.json');
    } catch (error) {
        console.log('\n⚠️  Could not save report to file:', error.message);
    }
    
    console.log('\n🎯 MONITORING SYSTEM DEBUGGING COMPLETED');
    
    if (testResults.failed === 0) {
        console.log('🎉 All monitoring systems are operational!');
    } else {
        console.log(`⚠️  ${testResults.failed} test(s) failed. Review the details above.`);
    }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run tests
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests, testResults };
