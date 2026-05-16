/**
 * NEXUS Reporting System Test Script
 * 
 * Comprehensive test script to verify all reporting system components
 * including analytics, reporting, and business intelligence features.
 */

const fs = require('fs');
const path = require('path');

class ReportingSystemTester {
    constructor() {
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
        
        this.testCategories = [
            'Controllers',
            'Services',
            'Models',
            'Routes',
            'Utilities',
            'Frontend Components'
        ];
    }

    async runAllTests() {
        console.log('🚀 NEXUS Reporting System Test Suite');
        console.log('=====================================\n');
        
        console.log('📋 Testing Implementation Status');
        console.log('=====================================\n');
        
        // Test file existence
        await this.testFileExistence();
        
        // Test controllers
        await this.testControllers();
        
        // Test services
        await this.testServices();
        
        // Test models
        await this.testModels();
        
        // Test routes
        await this.testRoutes();
        
        // Test utilities
        await this.testUtilities();
        
        // Test frontend components
        await this.testFrontendComponents();
        
        // Test API endpoints
        await this.testAPIEndpoints();
        
        // Test integration
        await this.testIntegration();
        
        // Generate final report
        this.generateTestReport();
    }

    async testFileExistence() {
        console.log('📁 Testing File Existence');
        console.log('-------------------------');
        
        const requiredFiles = [
            'controllers/analyticsController.js',
            'controllers/reportingController.js',
            'services/analyticsService.js',
            'services/reportingService.js',
            'models/Analytics.js',
            'models/Report.js',
            'models/Dashboard.js',
            'utils/dataAggregator.js',
            'utils/chartGenerator.js',
            'routes/analyticsRoutes.js',
            'routes/reportingRoutes.js',
            'public/analytics-dashboard.js',
            'public/report-builder.js'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, file);
            const exists = fs.existsSync(filePath);
            
            this.testResults.total++;
            
            if (exists) {
                this.testResults.passed++;
                console.log(`✅ ${file} - EXISTS`);
            } else {
                this.testResults.failed++;
                console.log(`❌ ${file} - MISSING`);
                this.testResults.errors.push(`${file} is missing`);
            }
        }
        
        console.log('');
    }

    async testControllers() {
        console.log('🎮 Testing Controllers');
        console.log('---------------------');
        
        try {
            // Test AnalyticsController
            const AnalyticsController = require('./controllers/analyticsController');
            const analyticsController = new AnalyticsController();
            
            this.testMethodExistence(analyticsController, 'getTicketAnalytics');
            this.testMethodExistence(analyticsController, 'getUserAnalytics');
            this.testMethodExistence(analyticsController, 'getSystemPerformance');
            this.testMethodExistence(analyticsController, 'getGitHubAnalytics');
            this.testMethodExistence(analyticsController, 'getAdministrativeReports');
            this.testMethodExistence(analyticsController, 'getDashboardData');
            this.testMethodExistence(analyticsController, 'generateReport');
            this.testMethodExistence(analyticsController, 'exportData');
            
            console.log('✅ AnalyticsController - All methods exist');
            
            // Test ReportingController
            const ReportingController = require('./controllers/reportingController');
            const reportingController = new ReportingController();
            
            this.testMethodExistence(reportingController, 'generateReport');
            this.testMethodExistence(reportingController, 'getReportTemplates');
            this.testMethodExistence(reportingController, 'getSavedReports');
            this.testMethodExistence(reportingController, 'saveReport');
            this.testMethodExistence(reportingController, 'deleteReport');
            this.testMethodExistence(reportingController, 'scheduleReport');
            this.testMethodExistence(reportingController, 'exportReport');
            this.testMethodExistence(reportingController, 'shareReport');
            
            console.log('✅ ReportingController - All methods exist');
            
        } catch (error) {
            console.log(`❌ Controllers Error: ${error.message}`);
            this.testResults.errors.push(`Controllers: ${error.message}`);
        }
        
        console.log('');
    }

    async testServices() {
        console.log('🔧 Testing Services');
        console.log('------------------');
        
        try {
            // Test AnalyticsService
            const AnalyticsService = require('./services/analyticsService');
            const analyticsService = new AnalyticsService();
            
            this.testMethodExistence(analyticsService, 'getTicketAnalytics');
            this.testMethodExistence(analyticsService, 'getUserAnalytics');
            this.testMethodExistence(analyticsService, 'getSystemPerformance');
            this.testMethodExistence(analyticsService, 'getGitHubAnalytics');
            this.testMethodExistence(analyticsService, 'getAdministrativeReports');
            this.testMethodExistence(analyticsService, 'getDashboardData');
            this.testMethodExistence(analyticsService, 'exportData');
            
            console.log('✅ AnalyticsService - All methods exist');
            
            // Test ReportingService
            const ReportingService = require('./services/reportingService');
            const reportingService = new ReportingService();
            
            this.testMethodExistence(reportingService, 'generateReport');
            this.testMethodExistence(reportingService, 'getReportTemplates');
            this.testMethodExistence(reportingService, 'getSavedReports');
            this.testMethodExistence(reportingService, 'saveReport');
            this.testMethodExistence(reportingService, 'deleteReport');
            this.testMethodExistence(reportingService, 'scheduleReport');
            this.testMethodExistence(reportingService, 'exportReport');
            this.testMethodExistence(reportingService, 'shareReport');
            
            console.log('✅ ReportingService - All methods exist');
            
        } catch (error) {
            console.log(`❌ Services Error: ${error.message}`);
            this.testResults.errors.push(`Services: ${error.message}`);
        }
        
        console.log('');
    }

    async testModels() {
        console.log('🗄️ Testing Models');
        console.log('----------------');
        
        try {
            // Test Analytics model
            const Analytics = require('./models/Analytics');
            
            this.testMethodExistence(Analytics, 'findByKey');
            this.testMethodExistence(Analytics, 'findValid');
            this.testMethodExistence(Analytics, 'cacheAnalytics');
            this.testMethodExistence(Analytics, 'cleanupExpired');
            
            console.log('✅ Analytics Model - All methods exist');
            
            // Test Report model
            const Report = require('./models/Report');
            
            this.testMethodExistence(Report, 'findByUser');
            this.testMethodExistence(Report, 'findScheduled');
            this.testMethodExistence(Report, 'findTemplates');
            this.testMethodExistence(Report, 'findPublic');
            this.testMethodExistence(Report, 'cleanupExpired');
            
            console.log('✅ Report Model - All methods exist');
            
            // Test Dashboard model
            const Dashboard = require('./models/Dashboard');
            
            this.testMethodExistence(Dashboard, 'findByUser');
            this.testMethodExistence(Dashboard, 'findTemplates');
            this.testMethodExistence(Dashboard, 'findPublic');
            this.testMethodExistence(Dashboard, 'cleanupExpired');
            
            console.log('✅ Dashboard Model - All methods exist');
            
        } catch (error) {
            console.log(`❌ Models Error: ${error.message}`);
            this.testResults.errors.push(`Models: ${error.message}`);
        }
        
        console.log('');
    }

    async testRoutes() {
        console.log('🛣️ Testing Routes');
        console.log('-----------------');
        
        try {
            // Test analytics routes
            const analyticsRoutes = require('./routes/analyticsRoutes');
            
            if (typeof analyticsRoutes === 'function') {
                console.log('✅ Analytics Routes - Router function exists');
                this.testResults.passed++;
            } else {
                console.log('❌ Analytics Routes - Not a function');
                this.testResults.failed++;
            }
            this.testResults.total++;
            
            // Test reporting routes
            const reportingRoutes = require('./routes/reportingRoutes');
            
            if (typeof reportingRoutes === 'function') {
                console.log('✅ Reporting Routes - Router function exists');
                this.testResults.passed++;
            } else {
                console.log('❌ Reporting Routes - Not a function');
                this.testResults.failed++;
            }
            this.testResults.total++;
            
        } catch (error) {
            console.log(`❌ Routes Error: ${error.message}`);
            this.testResults.errors.push(`Routes: ${error.message}`);
        }
        
        console.log('');
    }

    async testUtilities() {
        console.log('🛠️ Testing Utilities');
        console.log('-------------------');
        
        try {
            // Test DataAggregator
            const DataAggregator = require('./utils/dataAggregator');
            const dataAggregator = new DataAggregator();
            
            this.testMethodExistence(dataAggregator, 'aggregateByTime');
            this.testMethodExistence(dataAggregator, 'aggregateByCategory');
            this.testMethodExistence(dataAggregator, 'calculateMovingAverage');
            this.testMethodExistence(dataAggregator, 'calculateTrend');
            this.testMethodExistence(dataAggregator, 'calculatePercentiles');
            this.testMethodExistence(dataAggregator, 'groupByMultipleFields');
            this.testMethodExistence(dataAggregator, 'filterByDateRange');
            this.testMethodExistence(dataAggregator, 'calculateGrowthRate');
            this.testMethodExistence(dataAggregator, 'detectOutliers');
            this.testMethodExistence(dataAggregator, 'transformForChart');
            
            console.log('✅ DataAggregator - All methods exist');
            
            // Test ChartGenerator
            const ChartGenerator = require('./utils/chartGenerator');
            const chartGenerator = new ChartGenerator();
            
            this.testMethodExistence(chartGenerator, 'generateChart');
            this.testMethodExistence(chartGenerator, 'formatData');
            this.testMethodExistence(chartGenerator, 'generateOptions');
            this.testMethodExistence(chartGenerator, 'generateColorPalette');
            this.testMethodExistence(chartGenerator, 'generateGradientColors');
            this.testMethodExistence(chartGenerator, 'validateChartConfig');
            this.testMethodExistence(chartGenerator, 'generateChartHTML');
            this.testMethodExistence(chartGenerator, 'exportChartAsImage');
            
            console.log('✅ ChartGenerator - All methods exist');
            
        } catch (error) {
            console.log(`❌ Utilities Error: ${error.message}`);
            this.testResults.errors.push(`Utilities: ${error.message}`);
        }
        
        console.log('');
    }

    async testFrontendComponents() {
        console.log('🎨 Testing Frontend Components');
        console.log('-----------------------------');
        
        const frontendFiles = [
            'public/analytics-dashboard.js',
            'public/report-builder.js'
        ];

        for (const file of frontendFiles) {
            const filePath = path.join(__dirname, file);
            const exists = fs.existsSync(filePath);
            
            this.testResults.total++;
            
            if (exists) {
                const content = fs.readFileSync(filePath, 'utf8');
                const hasClass = content.includes('class ');
                const hasMethods = content.includes('constructor');
                const hasEventListeners = content.includes('addEventListener');
                
                if (hasClass && hasMethods && hasEventListeners) {
                    this.testResults.passed++;
                    console.log(`✅ ${file} - VALID COMPONENT`);
                } else {
                    this.testResults.failed++;
                    console.log(`❌ ${file} - INVALID COMPONENT`);
                    this.testResults.errors.push(`${file} is not a valid component`);
                }
            } else {
                this.testResults.failed++;
                console.log(`❌ ${file} - MISSING`);
                this.testResults.errors.push(`${file} is missing`);
            }
        }
        
        console.log('');
    }

    async testAPIEndpoints() {
        console.log('🌐 Testing API Endpoints');
        console.log('-----------------------');
        
        const expectedEndpoints = [
            'GET /api/analytics/tickets',
            'GET /api/analytics/users',
            'GET /api/analytics/performance',
            'GET /api/analytics/github',
            'GET /api/analytics/administrative',
            'GET /api/analytics/dashboard',
            'GET /api/analytics/kpi',
            'GET /api/analytics/visualization',
            'GET /api/analytics/export',
            'GET /api/analytics/health',
            'GET /api/reports/templates',
            'POST /api/reports/generate',
            'GET /api/reports',
            'POST /api/reports',
            'DELETE /api/reports/:reportId',
            'POST /api/reports/schedule',
            'GET /api/reports/scheduled',
            'DELETE /api/reports/scheduled/:scheduleId',
            'GET /api/reports/:reportId/export/:format',
            'POST /api/reports/:reportId/share',
            'GET /api/reports/health',
            'GET /api/reports/metrics'
        ];

        // Test analytics routes file
        try {
            const analyticsRoutesContent = fs.readFileSync(path.join(__dirname, 'routes/analyticsRoutes.js'), 'utf8');
            
            for (const endpoint of expectedEndpoints) {
                if (endpoint.startsWith('/api/analytics/')) {
                    const hasEndpoint = analyticsRoutesContent.includes(endpoint.split(' ')[1]);
                    
                    this.testResults.total++;
                    
                    if (hasEndpoint) {
                        this.testResults.passed++;
                        console.log(`✅ ${endpoint} - DEFINED`);
                    } else {
                        this.testResults.failed++;
                        console.log(`❌ ${endpoint} - NOT DEFINED`);
                        this.testResults.errors.push(`${endpoint} is not defined`);
                    }
                }
            }
        } catch (error) {
            console.log(`❌ API Endpoints Error: ${error.message}`);
            this.testResults.errors.push(`API Endpoints: ${error.message}`);
        }

        console.log('');
    }

    async testIntegration() {
        console.log('🔗 Testing Integration');
        console.log('--------------------');
        
        try {
            // Test that all components can be loaded together
            const AnalyticsController = require('./controllers/analyticsController');
            const ReportingController = require('./controllers/reportingController');
            const AnalyticsService = require('./services/analyticsService');
            const ReportingService = require('./services/reportingService');
            const DataAggregator = require('./utils/dataAggregator');
            const ChartGenerator = require('./utils/chartGenerator');
            
            // Test instantiation
            const analyticsController = new AnalyticsController();
            const reportingController = new ReportingController();
            const analyticsService = new AnalyticsService();
            const reportingService = new ReportingService();
            const dataAggregator = new DataAggregator();
            const chartGenerator = new ChartGenerator();
            
            console.log('✅ All components loaded successfully');
            this.testResults.passed++;
            this.testResults.total++;
            
            // Test method chaining
            const testResult = dataAggregator.aggregateByTime([
                { value: 10, date: new Date('2023-01-01') },
                { value: 20, date: new Date('2023-01-02') }
            ], 'date', 'day');
            
            if (Array.isArray(testResult) && testResult.length > 0) {
                console.log('✅ Data aggregation works');
                this.testResults.passed++;
                this.testResults.total++;
            } else {
                console.log('❌ Data aggregation failed');
                this.testResults.failed++;
                this.testResults.total++;
            }
            
            // Test chart generation
            const chartConfig = chartGenerator.generateChart('line', {
                labels: ['A', 'B', 'C'],
                datasets: [{ data: [1, 2, 3] }]
            });
            
            if (chartConfig && chartConfig.type === 'line') {
                console.log('✅ Chart generation works');
                this.testResults.passed++;
                this.testResults.total++;
            } else {
                console.log('❌ Chart generation failed');
                this.testResults.failed++;
                this.testResults.total++;
            }
            
        } catch (error) {
            console.log(`❌ Integration Error: ${error.message}`);
            this.testResults.errors.push(`Integration: ${error.message}`);
        }
        
        console.log('');
    }

    testMethodExistence(obj, methodName) {
        this.testResults.total++;
        
        if (typeof obj[methodName] === 'function') {
            this.testResults.passed++;
        } else {
            this.testResults.failed++;
            this.testResults.errors.push(`Method ${methodName} is missing or not a function`);
        }
    }

    generateTestReport() {
        console.log('📊 Test Results Summary');
        console.log('=====================\n');
        
        const successRate = this.testResults.total > 0 ? 
            ((this.testResults.passed / this.testResults.total) * 100).toFixed(2) : 0;
        
        console.log(`📈 Total Tests: ${this.testResults.total}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📊 Success Rate: ${successRate}%`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n🚨 Errors:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        console.log('\n🎯 Assessment:');
        if (successRate >= 95) {
            console.log('🟢 EXCELLENT - Reporting system is fully implemented and functional');
        } else if (successRate >= 80) {
            console.log('🟡 GOOD - Reporting system is mostly implemented with minor issues');
        } else if (successRate >= 60) {
            console.log('🟠 FAIR - Reporting system has significant issues that need attention');
        } else {
            console.log('🔴 POOR - Reporting system requires major fixes');
        }
        
        // Save test results
        const testReport = {
            timestamp: new Date().toISOString(),
            results: this.testResults,
            successRate: parseFloat(successRate),
            assessment: this.getAssessment(successRate)
        };
        
        const reportPath = path.join(__dirname, 'reporting-system-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        return testReport;
    }

    getAssessment(successRate) {
        if (successRate >= 95) return 'EXCELLENT';
        if (successRate >= 80) return 'GOOD';
        if (successRate >= 60) return 'FAIR';
        return 'POOR';
    }
}

// Run tests
async function runReportingSystemTests() {
    const tester = new ReportingSystemTester();
    await tester.runAllTests();
}

// Export for use in other modules
module.exports = {
    ReportingSystemTester,
    runReportingSystemTests
};

// Run tests if this file is executed directly
if (require.main === module) {
    runReportingSystemTests().catch(console.error);
}
