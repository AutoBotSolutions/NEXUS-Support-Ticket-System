const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    timeout: 5000,
    retries: 3
};

// Test results
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

// HTTP request helper
const makeRequest = (url, options = {}) => {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        
        const req = http.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const endTime = performance.now();
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    responseTime: endTime - startTime
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(TEST_CONFIG.timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
};

// Test function
const runTest = async (name, testFn) => {
    testResults.total++;
    
    try {
        console.log(`\n🧪 Testing: ${name}`);
        const result = await testFn();
        
        if (result.success) {
            testResults.passed++;
            console.log(`✅ ${name} - PASSED`);
            if (result.details) {
                console.log(`   ${result.details}`);
            }
        } else {
            testResults.failed++;
            console.log(`❌ ${name} - FAILED`);
            console.log(`   Error: ${result.error}`);
            testResults.errors.push({ test: name, error: result.error });
        }
    } catch (error) {
        testResults.failed++;
        console.log(`❌ ${name} - ERROR`);
        console.log(`   Error: ${error.message}`);
        testResults.errors.push({ test: name, error: error.message });
    }
};

// Test cases
const testHealthEndpoint = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/health`);
        
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            return {
                success: true,
                details: `Response time: ${response.responseTime.toFixed(2)}ms`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testDatabaseHealth = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/health/database`);
        
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            return {
                success: true,
                details: `Database status: ${body.status}`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testMetricsEndpoint = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/metrics`);
        
        if (response.statusCode === 200) {
            return {
                success: true,
                details: `Metrics endpoint available`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testMonitoringOverview = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/comprehensive-monitoring/overview`);
        
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            return {
                success: true,
                details: `Overview data received: ${Object.keys(body.data).length} sections`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testDatabaseMonitoring = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/comprehensive-monitoring/database`);
        
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            return {
                success: true,
                details: `Database monitoring data received`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testSecurityMonitoring = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/comprehensive-monitoring/security`);
        
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            return {
                success: true,
                details: `Security monitoring data received`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testBusinessIntelligence = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/comprehensive-monitoring/business`);
        
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            return {
                success: true,
                details: `Business intelligence data received`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testAlertingSystem = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/comprehensive-monitoring/alerts`);
        
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            return {
                success: true,
                details: `Alerting system data received`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testLoggingInfrastructure = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/comprehensive-monitoring/logging`);
        
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            return {
                success: true,
                details: `Logging infrastructure data received`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testDistributedTracing = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/comprehensive-monitoring/tracing`);
        
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            return {
                success: true,
                details: `Distributed tracing data received`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testSessionReplay = async () => {
    try {
        // Test creating a session
        const createResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/comprehensive-monitoring/session-replay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: 'http://localhost:3000/test',
                screenResolution: '1920x1080',
                viewport: '1200x800',
                platform: 'Linux',
                language: 'en-US'
            })
        });
        
        if (createResponse.statusCode === 200) {
            const body = JSON.parse(createResponse.body);
            const sessionId = body.data.sessionId;
            
            // Test getting session data
            const getResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/comprehensive-monitoring/session-replay?sessionId=${sessionId}`);
            
            if (getResponse.statusCode === 200) {
                return {
                    success: true,
                    details: `Session replay system working (Session ID: ${sessionId})`
                };
            } else {
                return {
                    success: false,
                    error: `Failed to get session data: ${getResponse.statusCode}`
                };
            }
        } else {
            return {
                success: false,
                error: `Failed to create session: ${createResponse.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testComprehensiveDashboard = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/comprehensive-monitoring/dashboard`);
        
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            return {
                success: true,
                details: `Comprehensive dashboard data received: ${Object.keys(body.data).length} sections`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const testMonitoringDashboardUI = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/monitoring-dashboard.html`);
        
        if (response.statusCode === 200) {
            return {
                success: true,
                details: `Monitoring dashboard UI accessible`
            };
        } else {
            return {
                success: false,
                error: `Unexpected status code: ${response.statusCode}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Run all tests
const runAllTests = async () => {
    console.log('🚀 Starting NEXUS Monitoring System Tests');
    console.log('==========================================');
    
    const tests = [
        { name: 'Health Endpoint', fn: testHealthEndpoint },
        { name: 'Database Health Check', fn: testDatabaseHealth },
        { name: 'Metrics Endpoint', fn: testMetricsEndpoint },
        { name: 'Monitoring Overview', fn: testMonitoringOverview },
        { name: 'Database Monitoring', fn: testDatabaseMonitoring },
        { name: 'Security Monitoring', fn: testSecurityMonitoring },
        { name: 'Business Intelligence', fn: testBusinessIntelligence },
        { name: 'Alerting System', fn: testAlertingSystem },
        { name: 'Logging Infrastructure', fn: testLoggingInfrastructure },
        { name: 'Distributed Tracing', fn: testDistributedTracing },
        { name: 'Session Replay System', fn: testSessionReplay },
        { name: 'Comprehensive Dashboard', fn: testComprehensiveDashboard },
        { name: 'Monitoring Dashboard UI', fn: testMonitoringDashboardUI }
    ];
    
    for (const test of tests) {
        await runTest(test.name, test.fn);
    }
    
    // Print results
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.errors.length > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.errors.forEach(error => {
            console.log(`   ${error.test}: ${error.error}`);
        });
    }
    
    console.log('\n🎯 Monitoring System Status:');
    if (testResults.failed === 0) {
        console.log('✅ All monitoring systems are operational!');
    } else if (testResults.failed <= 2) {
        console.log('⚠️  Monitoring system mostly operational with minor issues');
    } else {
        console.log('❌ Monitoring system has significant issues that need attention');
    }
    
    return testResults;
};

// Check if server is running
const checkServer = async () => {
    try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/health`);
        return response.statusCode === 200;
    } catch (error) {
        return false;
    }
};

// Main execution
const main = async () => {
    console.log('🔍 Checking if NEXUS server is running...');
    
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.log('❌ NEXUS server is not running. Please start the server first:');
        console.log('   npm start or node server.js');
        process.exit(1);
    }
    
    console.log('✅ NEXUS server is running');
    
    const results = await runAllTests();
    
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

// Run tests if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = {
    runAllTests,
    testResults
};
