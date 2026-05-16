#!/usr/bin/env node

/**
 * Comprehensive Notification Systems Debugging Script
 * Tests all 7 systems from NOTIFICATION_SYSTEM_REPORT.md
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test endpoints for all 7 systems
const systemTests = [
    {
        name: 'Notification System',
        priority: 'high',
        endpoints: [
            { path: '/notifications/preferences', method: 'GET' },
            { path: '/notifications/inapp', method: 'GET' },
            { path: '/notifications/history', method: 'GET' },
            { path: '/notifications/templates', method: 'GET' },
            { path: '/notifications/stats', method: 'GET' }
        ],
        files: [
            'middleware/notificationSystem.js',
            'routes/notificationRoutes.js'
        ]
    },
    {
        name: 'User Management System',
        priority: 'high',
        endpoints: [
            { path: '/users/management/profile', method: 'GET' },
            { path: '/users/management/preferences', method: 'GET' },
            { path: '/users/management/search', method: 'GET' },
            { path: '/users/management/analytics', method: 'GET' },
            { path: '/users/management/stats', method: 'GET' }
        ],
        files: [
            'middleware/userManagement.js',
            'routes/userManagementEnhancedRoutes.js'
        ]
    },
    {
        name: 'Search System',
        priority: 'high',
        endpoints: [
            { path: '/search', method: 'GET' },
            { path: '/search/advanced', method: 'GET' },
            { path: '/search/suggestions', method: 'GET' },
            { path: '/search/stats', method: 'GET' },
            { path: '/search/analytics', method: 'GET' }
        ],
        files: [
            'middleware/searchSystemEnhanced.js',
            'routes/searchEnhancedRoutes.js'
        ]
    },
    {
        name: 'Reporting System',
        priority: 'high',
        endpoints: [
            { path: '/reports/templates', method: 'GET' },
            { path: '/reports/analytics', method: 'GET' },
            { path: '/reports/dashboard', method: 'GET' },
            { path: '/reports/metrics/realtime', method: 'GET' },
            { path: '/reports/performers', method: 'GET' }
        ],
        files: [
            'middleware/reportingSystemEnhanced.js',
            'routes/reportingEnhancedRoutes.js'
        ]
    },
    {
        name: 'Workflow Automation System',
        priority: 'high',
        endpoints: [
            { path: '/workflows', method: 'GET' },
            { path: '/workflows/metrics', method: 'GET' },
            { path: '/workflows/categories', method: 'GET' },
            { path: '/workflows/templates', method: 'GET' },
            { path: '/workflows/health', method: 'GET' }
        ],
        files: [
            'middleware/workflowAutomation.js',
            'routes/workflowAutomationRoutes.js'
        ]
    },
    {
        name: 'Database Connection Pool',
        priority: 'high',
        endpoints: [
            { path: '/notifications/pool/status', method: 'GET' },
            { path: '/notifications/pool/metrics', method: 'GET' },
            { path: '/notifications/pool/health', method: 'GET' },
            { path: '/notifications/pool/config', method: 'GET' },
            { path: '/notifications/pool/stats', method: 'GET' }
        ],
        files: [
            'middleware/notificationDatabasePool.js',
            'routes/notificationDatabasePoolRoutes.js'
        ]
    },
    {
        name: 'WebSocket/Real-Time System',
        priority: 'high',
        endpoints: [
            { path: '/websocket/status', method: 'GET' },
            { path: '/websocket/config', method: 'GET' },
            { path: '/websocket/notifications', method: 'GET' },
            { path: '/websocket/users', method: 'GET' },
            { path: '/websocket/health', method: 'GET' }
        ],
        files: [
            'middleware/websocketServer.js',
            'middleware/realtimeNotifications.js',
            'routes/websocketRoutes.js'
        ]
    }
];

// HTTP request function
function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            }
        };
        
        const req = http.request(url, options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                try {
                    const jsonData = JSON.parse(responseData);
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
                        data: responseData
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
        
        req.setTimeout(5000, () => {
            req.destroy();
            resolve({
                success: false,
                statusCode: 0,
                responseTime: 5000,
                error: 'Request timeout'
            });
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Check if file exists
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

// Get file size
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch (error) {
        return 0;
    }
}

// Test system files
function testSystemFiles(system) {
    const results = [];
    
    system.files.forEach(file => {
        const filePath = path.join(__dirname, file);
        const exists = fileExists(filePath);
        const size = exists ? getFileSize(filePath) : 0;
        
        results.push({
            file: file,
            exists: exists,
            size: size,
            status: exists ? '✅ PRESENT' : '❌ MISSING'
        });
    });
    
    return results;
}

// Test system endpoints
async function testSystemEndpoints(system) {
    const results = [];
    
    for (const endpoint of system.endpoints) {
        const url = `${API_BASE}${endpoint.path}`;
        
        try {
            const result = await makeRequest(url, endpoint.method);
            
            results.push({
                endpoint: endpoint.path,
                method: endpoint.method,
                success: result.success,
                statusCode: result.statusCode,
                responseTime: result.responseTime,
                status: result.success ? '✅ WORKING' : '❌ FAILED',
                error: result.error || null
            });
        } catch (error) {
            results.push({
                endpoint: endpoint.path,
                method: endpoint.method,
                success: false,
                statusCode: 0,
                responseTime: 0,
                status: '❌ ERROR',
                error: error.message
            });
        }
    }
    
    return results;
}

// Main testing function
async function testAllSystems() {
    console.log('🚀 Comprehensive Notification Systems Debugging');
    console.log('==========================================');
    console.log(`Testing ${systemTests.length} systems from NOTIFICATION_SYSTEM_REPORT.md\n`);
    
    const overallResults = {
        totalSystems: systemTests.length,
        systemsTested: 0,
        overallSuccess: true,
        systemResults: []
    };
    
    // Test each system
    for (const system of systemTests) {
        console.log(`\n🔍 Testing ${system.name} (Priority: ${system.priority})`);
        console.log('─'.repeat(50));
        
        const systemResult = {
            name: system.name,
            priority: system.priority,
            fileTests: [],
            endpointTests: [],
            overallStatus: 'UNKNOWN'
        };
        
        // Test files
        console.log('📁 File Tests:');
        const fileResults = testSystemFiles(system);
        systemResult.fileTests = fileResults;
        
        let allFilesExist = true;
        fileResults.forEach(result => {
            console.log(`   ${result.status} ${result.file} (${result.size} bytes)`);
            if (!result.exists) {
                allFilesExist = false;
            }
        });
        
        // Test endpoints
        console.log('\n🌐 Endpoint Tests:');
        const endpointResults = await testSystemEndpoints(system);
        systemResult.endpointTests = endpointResults;
        
        let allEndpointsWorking = true;
        endpointResults.forEach(result => {
            console.log(`   ${result.status} ${result.method} ${result.endpoint} (${result.responseTime}ms)`);
            if (result.success === false) {
                allEndpointsWorking = false;
            }
        });
        
        // Determine system status
        if (allFilesExist && allEndpointsWorking) {
            systemResult.overallStatus = '✅ OPERATIONAL';
            console.log(`\n✅ ${system.name}: OPERATIONAL`);
        } else if (allFilesExist && !allEndpointsWorking) {
            systemResult.overallStatus = '⚠️ PARTIAL';
            console.log(`\n⚠️ ${system.name}: PARTIAL (Files exist, some endpoints failing)`);
        } else if (!allFilesExist && allEndpointsWorking) {
            systemResult.overallStatus = '⚠️ PARTIAL';
            console.log(`\n⚠️ ${system.name}: PARTIAL (Endpoints working, some files missing)`);
        } else {
            systemResult.overallStatus = '❌ FAILED';
            console.log(`\n❌ ${system.name}: FAILED`);
        }
        
        overallResults.systemResults.push(systemResult);
        overallResults.systemsTested++;
        
        if (systemResult.overallStatus !== '✅ OPERATIONAL') {
            overallResults.overallSuccess = false;
        }
        
        // Small delay between systems
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Generate summary
    console.log('\n📊 Debugging Results Summary');
    console.log('============================');
    
    const operationalSystems = overallResults.systemResults.filter(s => s.overallStatus === '✅ OPERATIONAL').length;
    const partialSystems = overallResults.systemResults.filter(s => s.overallStatus === '⚠️ PARTIAL').length;
    const failedSystems = overallResults.systemResults.filter(s => s.overallStatus === '❌ FAILED').length;
    
    console.log(`Total Systems: ${overallResults.totalSystems}`);
    console.log(`Systems Tested: ${overallResults.systemsTested}`);
    console.log(`Operational: ${operationalSystems} ✅`);
    console.log(`Partial: ${partialSystems} ⚠️`);
    console.log(`Failed: ${failedSystems} ❌`);
    console.log(`Overall Success: ${overallResults.overallSuccess ? '✅ YES' : '❌ NO'}`);
    
    // Show failed/partial systems
    const problemSystems = overallResults.systemResults.filter(s => s.overallStatus !== '✅ OPERATIONAL');
    if (problemSystems.length > 0) {
        console.log('\n❌ Systems Requiring Attention:');
        problemSystems.forEach(system => {
            console.log(`   ${system.overallStatus} ${system.name}`);
            
            // Show missing files
            const missingFiles = system.fileTests.filter(f => !f.exists);
            if (missingFiles.length > 0) {
                console.log('      Missing Files:');
                missingFiles.forEach(file => {
                    console.log(`         - ${file.file}`);
                });
            }
            
            // Show failed endpoints
            const failedEndpoints = system.endpointTests.filter(e => e.success === false);
            if (failedEndpoints.length > 0) {
                console.log('      Failed Endpoints:');
                failedEndpoints.forEach(endpoint => {
                    console.log(`         - ${endpoint.method} ${endpoint.endpoint} (${endpoint.error || 'Unknown error'})`);
                });
            }
        });
    }
    
    // Save results to file
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            totalSystems: overallResults.totalSystems,
            systemsTested: overallResults.systemsTested,
            operationalSystems,
            partialSystems,
            failedSystems,
            overallSuccess: overallResults.overallSuccess
        },
        results: overallResults.systemResults
    };
    
    try {
        fs.writeFileSync('notification-systems-debug-report.json', JSON.stringify(reportData, null, 2));
        console.log('\n📄 Detailed report saved to: notification-systems-debug-report.json');
    } catch (error) {
        console.log('\n❌ Failed to save report:', error.message);
    }
    
    return overallResults;
}

// Run the debugging
if (require.main === module) {
    testAllSystems()
        .then(results => {
            console.log('\n🎯 Debugging Complete');
            process.exit(results.overallSuccess ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Debugging failed:', error);
            process.exit(1);
        });
}

module.exports = { testAllSystems, testSystemFiles, testSystemEndpoints };
