require('dotenv').config();

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const req = http.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                try {
                    const parsedData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: parsedData,
                        responseTime,
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        responseTime,
                        headers: res.headers,
                        parseError: error.message
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Test function
async function runTest(testName, url, expectedStatus = 200, validationFn = null) {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`📡 URL: ${url}`);
    
    try {
        const result = await makeRequest(url);
        const testResult = {
            name: testName,
            url,
            status: 'passed',
            statusCode: result.statusCode,
            responseTime: result.responseTime,
            data: result.data,
            error: null
        };
        
        // Check status code
        if (result.statusCode !== expectedStatus) {
            testResult.status = 'failed';
            testResult.error = `Expected status ${expectedStatus}, got ${result.statusCode}`;
        }
        
        // Check if response is successful
        if (result.data && result.data.success === false) {
            testResult.status = 'failed';
            testResult.error = result.data.error || 'API returned success: false';
        }
        
        // Custom validation
        if (validationFn && testResult.status === 'passed') {
            const validationResult = validationFn(result.data);
            if (!validationResult.passed) {
                testResult.status = 'failed';
                testResult.error = validationResult.error;
            }
        }
        
        // Log result
        if (testResult.status === 'passed') {
            console.log(`✅ PASSED (${result.responseTime}ms)`);
            if (result.data && result.data.data) {
                const dataKeys = Object.keys(result.data.data);
                console.log(`📊 Data keys: ${dataKeys.join(', ')}`);
            }
        } else {
            console.log(`❌ FAILED: ${testResult.error}`);
            console.log(`🔍 Status: ${result.statusCode}`);
            console.log(`⏱️ Response Time: ${result.responseTime}ms`);
        }
        
        TEST_RESULTS.tests.push(testResult);
        TEST_RESULTS.total++;
        
        if (testResult.status === 'passed') {
            TEST_RESULTS.passed++;
        } else {
            TEST_RESULTS.failed++;
        }
        
        return testResult;
        
    } catch (error) {
        const testResult = {
            name: testName,
            url,
            status: 'failed',
            statusCode: null,
            responseTime: null,
            data: null,
            error: error.message
        };
        
        console.log(`❌ FAILED: ${error.message}`);
        TEST_RESULTS.tests.push(testResult);
        TEST_RESULTS.total++;
        TEST_RESULTS.failed++;
        
        return testResult;
    }
}

// Validation functions
function validateVulnerabilityScanning(data) {
    if (!data.data) {
        return { passed: false, error: 'Missing data field' };
    }
    
    const requiredFields = ['vulnerabilities', 'scanResults', 'knownVulnerabilities', 'securityPolicies', 'vulnerabilitySummary'];
    for (const field of requiredFields) {
        if (!(field in data.data)) {
            return { passed: false, error: `Missing required field: ${field}` };
        }
    }
    
    if (!Array.isArray(data.data.knownVulnerabilities)) {
        return { passed: false, error: 'knownVulnerabilities should be an array' };
    }
    
    if (data.data.knownVulnerabilities.length === 0) {
        return { passed: false, error: 'knownVulnerabilities array is empty' };
    }
    
    return { passed: true };
}

function validateSystemMetrics(data) {
    if (!data.data) {
        return { passed: false, error: 'Missing data field' };
    }
    
    const requiredFields = ['metrics', 'performanceMetrics', 'resourceMetrics', 'networkMetrics'];
    for (const field of requiredFields) {
        if (!(field in data.data)) {
            return { passed: false, error: `Missing required field: ${field}` };
        }
    }
    
    return { passed: true };
}

function validateWorkflowAutomation(data) {
    if (!data.data) {
        return { passed: false, error: 'Missing data field' };
    }
    
    const requiredFields = ['workflows', 'executions', 'metrics'];
    for (const field of requiredFields) {
        if (!(field in data.data)) {
            return { passed: false, error: `Missing required field: ${field}` };
        }
    }
    
    if (!Array.isArray(data.data.workflows)) {
        return { passed: false, error: 'workflows should be an array' };
    }
    
    if (data.data.workflows.length === 0) {
        return { passed: false, error: 'workflows array is empty' };
    }
    
    // Check workflow structure
    const workflow = data.data.workflows[0];
    const workflowFields = ['id', 'name', 'description', 'category', 'enabled', 'trigger', 'actions'];
    for (const field of workflowFields) {
        if (!(field in workflow)) {
            return { passed: false, error: `Missing workflow field: ${field}` };
        }
    }
    
    return { passed: true };
}

// Main debugging function
async function debugNewMonitoringSystems() {
    console.log('🚀 Starting Debugging of New Monitoring Systems');
    console.log('=' .repeat(60));
    
    // Test server health first
    await runTest('Server Health Check', `${BASE_URL}/api/health`, 200);
    
    // Test Vulnerability Scanning
    await runTest(
        'Vulnerability Scanning Endpoint', 
        `${BASE_URL}/api/comprehensive-monitoring/vulnerability-scanning`,
        200,
        validateVulnerabilityScanning
    );
    
    // Test System Metrics
    await runTest(
        'System Metrics Endpoint',
        `${BASE_URL}/api/comprehensive-monitoring/system-metrics`,
        200,
        validateSystemMetrics
    );
    
    // Test Workflow Automation
    await runTest(
        'Workflow Automation Endpoint',
        `${BASE_URL}/api/comprehensive-monitoring/workflow-automation`,
        200,
        validateWorkflowAutomation
    );
    
    // Test comprehensive dashboard (should include new systems)
    await runTest('Comprehensive Dashboard', `${BASE_URL}/api/comprehensive-monitoring/dashboard`, 200);
    
    // Generate final report
    console.log('\n' + '=' .repeat(60));
    console.log('📊 DEBUGGING RESULTS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`📈 Total Tests: ${TEST_RESULTS.total}`);
    console.log(`✅ Passed: ${TEST_RESULTS.passed}`);
    console.log(`❌ Failed: ${TEST_RESULTS.failed}`);
    console.log(`📊 Success Rate: ${((TEST_RESULTS.passed / TEST_RESULTS.total) * 100).toFixed(1)}%`);
    
    if (TEST_RESULTS.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        TEST_RESULTS.tests.filter(test => test.status === 'failed').forEach(test => {
            console.log(`  • ${test.name}: ${test.error}`);
        });
    }
    
    // Calculate average response time
    const avgResponseTime = TEST_RESULTS.tests
        .filter(test => test.responseTime !== null)
        .reduce((sum, test) => sum + test.responseTime, 0) / 
        TEST_RESULTS.tests.filter(test => test.responseTime !== null).length;
    
    console.log(`⏱️ Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    
    // Save results to file
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            total: TEST_RESULTS.total,
            passed: TEST_RESULTS.passed,
            failed: TEST_RESULTS.failed,
            successRate: ((TEST_RESULTS.passed / TEST_RESULTS.total) * 100).toFixed(1),
            averageResponseTime: avgResponseTime.toFixed(2)
        },
        tests: TEST_RESULTS.tests
    };
    
    require('fs').writeFileSync(
        '/home/robbie/Desktop/nexus/new-monitoring-systems-debug-report.json',
        JSON.stringify(reportData, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: new-monitoring-systems-debug-report.json');
    
    if (TEST_RESULTS.failed === 0) {
        console.log('\n🎉 ALL NEW MONITORING SYSTEMS ARE WORKING CORRECTLY!');
    } else {
        console.log('\n⚠️  SOME ISSUES FOUND - PLEASE REVIEW FAILED TESTS');
    }
    
    return reportData;
}

// Run debugging
if (require.main === module) {
    debugNewMonitoringSystems().catch(console.error);
}

module.exports = { debugNewMonitoringSystems };
