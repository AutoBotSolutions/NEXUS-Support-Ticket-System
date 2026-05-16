#!/usr/bin/env node

/**
 * Comprehensive Monitoring Systems Debugging Script
 * Tests all monitoring endpoints to ensure they are operational
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ENDPOINTS = [
    '/api/comprehensive-monitoring/overview',
    '/api/comprehensive-monitoring/metrics',
    '/api/comprehensive-monitoring/database',
    '/api/comprehensive-monitoring/security',
    '/api/comprehensive-monitoring/business',
    '/api/comprehensive-monitoring/alerts',
    '/api/comprehensive-monitoring/logging',
    '/api/comprehensive-monitoring/tracing',
    '/api/comprehensive-monitoring/session-replay',
    '/api/comprehensive-monitoring/dashboard',
    '/api/comprehensive-monitoring/oncall',
    '/api/comprehensive-monitoring/threat-intelligence',
    '/api/comprehensive-monitoring/automated-reporting',
    '/api/comprehensive-monitoring/vulnerability-scanning',
    '/api/comprehensive-monitoring/system-metrics',
    '/api/comprehensive-monitoring/workflow-automation',
    '/api/comprehensive-monitoring/enhanced-search',
    '/api/comprehensive-monitoring/enhanced-reporting',
    '/api/comprehensive-monitoring/apm-monitoring'
];

// Utility function to make HTTP requests
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        data: jsonData,
                        responseTime: Date.now()
                    });
                } catch (error) {
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        error: 'Invalid JSON response',
                        rawData: data,
                        responseTime: Date.now()
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            resolve({
                success: false,
                error: error.message,
                responseTime: Date.now()
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                success: false,
                error: 'Request timeout',
                responseTime: Date.now()
            });
        });
    });
}

// Test a single endpoint
async function testEndpoint(endpoint) {
    const startTime = Date.now();
    const url = `${BASE_URL}${endpoint}`;
    
    try {
        const result = await makeRequest(url);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        return {
            endpoint,
            url,
            success: result.success,
            statusCode: result.statusCode || 0,
            responseTime,
            data: result.success ? result.data : null,
            error: result.error || null
        };
    } catch (error) {
        return {
            endpoint,
            url,
            success: false,
            statusCode: 0,
            responseTime: Date.now() - startTime,
            error: error.message
        };
    }
}

// Main debugging function
async function debugMonitoringSystems() {
    console.log('🔍 Starting comprehensive monitoring systems debugging...\n');
    
    const results = [];
    const startTime = Date.now();
    
    // Test server health first
    console.log('📋 Checking server health...');
    try {
        const healthResult = await makeRequest(`${BASE_URL}/api/health`);
        if (healthResult.success) {
            console.log('✅ Server is healthy and running');
        } else {
            console.log('❌ Server health check failed');
            return;
        }
    } catch (error) {
        console.log('❌ Cannot connect to server');
        return;
    }
    
    console.log('\n🧪 Testing all monitoring endpoints...\n');
    
    // Test all endpoints
    for (const endpoint of ENDPOINTS) {
        const result = await testEndpoint(endpoint);
        results.push(result);
        
        // Display result
        const status = result.success ? '✅' : '❌';
        const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';
        const code = result.statusCode || 'N/A';
        
        console.log(`${status} ${endpoint} - ${time} - Status: ${code}`);
        
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate statistics
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(2);
    const avgResponseTime = results
        .filter(r => r.responseTime)
        .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime).length;
    
    // Display summary
    console.log('\n📊 Debugging Results Summary:');
    console.log('=====================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${successRate}%)`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    
    // Show failed tests if any
    if (failedTests > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => !r.success).forEach(result => {
            console.log(`   - ${result.endpoint}: ${result.error || 'Unknown error'}`);
        });
    }
    
    // Generate detailed report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: parseFloat(successRate),
            totalTime,
            averageResponseTime: parseFloat(avgResponseTime.toFixed(2))
        },
        results: results
    };
    
    // Save report to file
    const fs = require('fs');
    const reportPath = '/home/robbie/Desktop/nexus/comprehensive-monitoring-debug-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Final status
    if (failedTests === 0) {
        console.log('\n🎉 All monitoring systems are operational!');
    } else {
        console.log(`\n⚠️  ${failedTests} monitoring systems need attention.`);
    }
}

// Run the debugging
if (require.main === module) {
    debugMonitoringSystems().catch(console.error);
}

module.exports = { debugMonitoringSystems, testEndpoint };
