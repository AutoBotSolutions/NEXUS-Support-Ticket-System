#!/usr/bin/env node

/**
 * Infrastructure Monitoring System Debugging Script
 * Tests the newly added Infrastructure Monitoring system and all other monitoring systems
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/comprehensive-monitoring`;

// Test endpoints
const endpoints = [
    { name: 'System Overview', path: '/overview', priority: 'high' },
    { name: 'System Metrics', path: '/metrics', priority: 'high' },
    { name: 'Database Monitoring', path: '/database', priority: 'high' },
    { name: 'Security Monitoring', path: '/security', priority: 'high' },
    { name: 'Business Intelligence', path: '/business', priority: 'high' },
    { name: 'Alerting System', path: '/alerts', priority: 'high' },
    { name: 'Logging Infrastructure', path: '/logging', priority: 'high' },
    { name: 'Distributed Tracing', path: '/tracing', priority: 'high' },
    { name: 'Session Replay', path: '/session-replay', priority: 'high' },
    { name: 'Comprehensive Dashboard', path: '/dashboard', priority: 'high' },
    { name: 'On-call Scheduling', path: '/oncall', priority: 'medium' },
    { name: 'Threat Intelligence', path: '/threat-intelligence', priority: 'medium' },
    { name: 'Automated Reporting', path: '/automated-reporting', priority: 'medium' },
    { name: 'Vulnerability Scanning', path: '/vulnerability-scanning', priority: 'medium' },
    { name: 'System Metrics (Enhanced)', path: '/system-metrics', priority: 'medium' },
    { name: 'Workflow Automation', path: '/workflow-automation', priority: 'medium' },
    { name: 'Enhanced Search System', path: '/enhanced-search', priority: 'medium' },
    { name: 'Enhanced Reporting System', path: '/enhanced-reporting', priority: 'medium' },
    { name: 'APM Monitoring System', path: '/apm-monitoring', priority: 'medium' },
    { name: 'Infrastructure Monitoring', path: '/infrastructure', priority: 'high' }
];

// HTTP request function
function makeRequest(url) {
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
                    const jsonData = JSON.parse(data);
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        responseTime,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        responseTime,
                        error: 'JSON parse error',
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            resolve({
                success: false,
                statusCode: 0,
                responseTime,
                error: error.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                success: false,
                statusCode: 0,
                responseTime: 10000,
                error: 'Request timeout'
            });
        });
    });
}

// Test function
async function testEndpoint(endpoint) {
    const url = `${API_BASE}${endpoint.path}`;
    console.log(`Testing ${endpoint.name} (${endpoint.path})...`);
    
    try {
        const result = await makeRequest(url);
        
        if (result.success) {
            console.log(`✅ ${endpoint.name}: SUCCESS (${result.responseTime}ms)`);
            return {
                name: endpoint.name,
                path: endpoint.path,
                success: true,
                responseTime: result.responseTime,
                statusCode: result.statusCode,
                priority: endpoint.priority
            };
        } else {
            console.log(`❌ ${endpoint.name}: FAILED - ${result.error} (${result.responseTime}ms)`);
            return {
                name: endpoint.name,
                path: endpoint.path,
                success: false,
                responseTime: result.responseTime,
                statusCode: result.statusCode,
                error: result.error,
                priority: endpoint.priority
            };
        }
    } catch (error) {
        console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
        return {
            name: endpoint.name,
            path: endpoint.path,
            success: false,
            responseTime: 0,
            error: error.message,
            priority: endpoint.priority
        };
    }
}

// Test infrastructure monitoring specifically
async function testInfrastructureMonitoring() {
    console.log('\n🔍 Testing Infrastructure Monitoring System specifically...');
    
    const url = `${API_BASE}/infrastructure`;
    const result = await makeRequest(url);
    
    if (result.success) {
        console.log('✅ Infrastructure Monitoring: SUCCESS');
        
        // Test specific components
        const data = result.data;
        const components = [
            { name: 'System Resources', check: data.data && data.data.systemResources },
            { name: 'Docker Containers', check: data.data && data.data.dockerContainers },
            { name: 'Prometheus Metrics', check: data.data && data.data.prometheusMetrics },
            { name: 'Grafana Dashboards', check: data.data && data.data.grafanaDashboards },
            { name: 'System Health', check: data.data && data.data.systemHealth },
            { name: 'Alerts', check: data.data && data.data.alerts },
            { name: 'Features', check: data.data && data.data.features },
            { name: 'Statistics', check: data.data && data.data.statistics }
        ];
        
        console.log('\n📊 Infrastructure Monitoring Components:');
        components.forEach(component => {
            if (component.check) {
                console.log(`✅ ${component.name}: Available`);
            } else {
                console.log(`❌ ${component.name}: Missing`);
            }
        });
        
        // Validate system resources
        if (data.data && data.data.systemResources) {
            const resources = data.data.systemResources;
            console.log('\n💻 System Resources:');
            console.log(`   CPU Usage: ${resources.cpu ? resources.cpu.usage.toFixed(2) + '%' : 'N/A'}`);
            console.log(`   Memory Usage: ${resources.memory ? resources.memory.percentage.toFixed(2) + '%' : 'N/A'}`);
            console.log(`   Disk Usage: ${resources.disk ? resources.disk.percentage.toFixed(2) + '%' : 'N/A'}`);
            console.log(`   Network Connections: ${resources.network ? resources.network.connections : 'N/A'}`);
        }
        
        // Validate Docker containers
        if (data.data && data.data.dockerContainers) {
            const containers = data.data.dockerContainers;
            console.log('\n🐳 Docker Containers:');
            console.log(`   Total Containers: ${containers.length}`);
            containers.forEach((container, index) => {
                console.log(`   ${index + 1}. ${container.name || 'Unknown'} - ${container.status || 'Unknown'} (${container.cpu || 'N/A'}% CPU, ${container.memory || 'N/A'}MB RAM)`);
            });
        }
        
        return true;
    } else {
        console.log('❌ Infrastructure Monitoring: FAILED');
        console.log(`   Error: ${result.error}`);
        return false;
    }
}

// Main function
async function main() {
    console.log('🚀 Infrastructure Monitoring System Debugging');
    console.log('==========================================');
    console.log(`Testing ${endpoints.length} monitoring endpoints...\n`);
    
    const results = [];
    
    // Test all endpoints
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        results.push(result);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Test infrastructure monitoring specifically
    const infrastructureResult = await testInfrastructureMonitoring();
    
    // Calculate statistics
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(2);
    
    // Calculate average response time
    const successfulTests = results.filter(r => r.success);
    const avgResponseTime = successfulTests.length > 0 
        ? (successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length).toFixed(2)
        : 0;
    
    // Find slowest and fastest
    const slowest = successfulTests.length > 0 
        ? successfulTests.reduce((slowest, current) => current.responseTime > slowest.responseTime ? current : slowest)
        : null;
    
    const fastest = successfulTests.length > 0 
        ? successfulTests.reduce((fastest, current) => current.responseTime < fastest.responseTime ? current : fastest)
        : null;
    
    // Display results
    console.log('\n📊 Test Results Summary');
    console.log('=====================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Average Response Time: ${avgResponseTime}ms`);
    
    if (fastest) {
        console.log(`Fastest: ${fastest.name} (${fastest.responseTime}ms)`);
    }
    
    if (slowest) {
        console.log(`Slowest: ${slowest.name} (${slowest.responseTime}ms)`);
    }
    
    // Show failed tests
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
        console.log('\n❌ Failed Tests:');
        failedResults.forEach(result => {
            console.log(`   ${result.name}: ${result.error || 'Unknown error'}`);
        });
    }
    
    // Infrastructure monitoring status
    console.log('\n🔧 Infrastructure Monitoring Status:');
    console.log(`   Status: ${infrastructureResult ? '✅ Operational' : '❌ Failed'}`);
    
    // Overall status
    const overallSuccess = failedTests === 0 && infrastructureResult;
    console.log('\n🎯 Overall Status:');
    console.log(`   Status: ${overallSuccess ? '✅ All Systems Operational' : '❌ Issues Detected'}`);
    
    // Save results to file
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests,
            passedTests,
            failedTests,
            successRate: parseFloat(successRate),
            avgResponseTime: parseFloat(avgResponseTime),
            infrastructureMonitoring: infrastructureResult,
            overallSuccess
        },
        results,
        slowest,
        fastest
    };
    
    const fs = require('fs');
    fs.writeFileSync('infrastructure-monitoring-debug-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: infrastructure-monitoring-debug-report.json');
    
    // Exit with appropriate code
    process.exit(overallSuccess ? 0 : 1);
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { testEndpoint, testInfrastructureMonitoring, main };
