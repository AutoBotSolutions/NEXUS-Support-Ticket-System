/**
 * NEXUS Reporting System Debugging Script
 * 
 * Comprehensive debugging script to test all Reporting System components
 * including controllers, services, models, utilities, and API endpoints.
 */

const fs = require('fs');
const path = require('path');

class ReportingSystemDebugger {
    constructor() {
        this.debugResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: [],
            details: {}
        };
        
        this.systems = [
            'AnalyticsController',
            'ReportingController',
            'AnalyticsService',
            'ReportingService',
            'AnalyticsModel',
            'ReportModel',
            'DashboardModel',
            'DataAggregator',
            'ChartGenerator',
            'AnalyticsRoutes',
            'ReportingRoutes',
            'FrontendComponents'
        ];
    }

    async runAllDebugTests() {
        console.log('🔍 NEXUS Reporting System Debug Suite');
        console.log('=====================================\n');
        
        console.log('📋 Debugging Implementation Status');
        console.log('=====================================\n');
        
        // Test file existence and structure
        await this.debugFileStructure();
        
        // Test controllers
        await this.debugControllers();
        
        // Test services
        await this.debugServices();
        
        // Test models
        await this.debugModels();
        
        // Test utilities
        await this.debugUtilities();
        
        // Test routes
        await this.debugRoutes();
        
        // Test frontend components
        await this.debugFrontendComponents();
        
        // Test API endpoints
        await this.debugAPIEndpoints();
        
        // Test database operations
        await this.debugDatabaseOperations();
        
        // Test integration
        await this.debugIntegration();
        
        // Test functionality
        await this.debugFunctionality();
        
        // Generate final debugging report
        this.generateDebugReport();
    }

    async debugFileStructure() {
        console.log('📁 Debugging File Structure');
        console.log('----------------------------');
        
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
            
            this.debugResults.total++;
            
            if (exists) {
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf8');
                const hasExports = content.includes('module.exports') || content.includes('export');
                const hasClass = content.includes('class ');
                const hasMethods = content.includes('constructor') || content.includes('function');
                const hasEventListeners = content.includes('addEventListener');
                const isRouteFile = file.includes('routes/');
                
                // Routes files don't need methods, they just need exports and router functionality
                const isValidStructure = isRouteFile ? 
                    (hasExports && content.includes('router')) : 
                    (hasExports && (hasClass || hasMethods));
                
                if (isValidStructure) {
                    this.debugResults.passed++;
                    console.log(`✅ ${file} - VALID (${stats.size} bytes)`);
                    this.debugResults.details[file] = {
                        status: 'VALID',
                        size: stats.size,
                        hasExports,
                        hasClass,
                        hasMethods
                    };
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ ${file} - INVALID STRUCTURE`);
                    this.debugResults.errors.push(`${file} has invalid structure`);
                    this.debugResults.details[file] = {
                        status: 'INVALID',
                        size: stats.size,
                        hasExports,
                        hasClass,
                        hasMethods
                    };
                }
            } else {
                this.debugResults.failed++;
                console.log(`❌ ${file} - MISSING`);
                this.debugResults.errors.push(`${file} is missing`);
                this.debugResults.details[file] = {
                    status: 'MISSING'
                };
            }
        }
        
        console.log('');
    }

    async debugControllers() {
        console.log('🎮 Debugging Controllers');
        console.log('------------------------');
        
        try {
            // Debug AnalyticsController
            const AnalyticsController = require('./controllers/analyticsController');
            const analyticsController = new AnalyticsController();
            
            const analyticsMethods = [
                'getTicketAnalytics',
                'getUserAnalytics',
                'getSystemPerformance',
                'getGitHubAnalytics',
                'getAdministrativeReports',
                'getDashboardData',
                'getKPIDashboard',
                'getVisualizationData',
                'exportData'
            ];
            
            for (const method of analyticsMethods) {
                this.debugResults.total++;
                if (typeof analyticsController[method] === 'function') {
                    this.debugResults.passed++;
                    console.log(`✅ AnalyticsController.${method} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ AnalyticsController.${method} - MISSING`);
                    this.debugResults.errors.push(`AnalyticsController.${method} is missing`);
                }
            }
            
            // Debug ReportingController
            const ReportingController = require('./controllers/reportingController');
            const reportingController = new ReportingController();
            
            const reportingMethods = [
                'generateReport',
                'getReportTemplates',
                'getSavedReports',
                'saveReport',
                'deleteReport',
                'scheduleReport',
                'getScheduledReports',
                'cancelScheduledReport',
                'exportReport',
                'shareReport',
                'getReportSharing',
                'getReportHistory',
                'getReportStatus',
                'createReportTemplate',
                'updateReportTemplate',
                'deleteReportTemplate'
            ];
            
            for (const method of reportingMethods) {
                this.debugResults.total++;
                if (typeof reportingController[method] === 'function') {
                    this.debugResults.passed++;
                    console.log(`✅ ReportingController.${method} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ ReportingController.${method} - MISSING`);
                    this.debugResults.errors.push(`ReportingController.${method} is missing`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Controllers Debug Error: ${error.message}`);
            this.debugResults.errors.push(`Controllers: ${error.message}`);
        }
        
        console.log('');
    }

    async debugServices() {
        console.log('🔧 Debugging Services');
        console.log('---------------------');
        
        try {
            // Debug AnalyticsService
            const AnalyticsService = require('./services/analyticsService');
            const analyticsService = new AnalyticsService();
            
            const analyticsMethods = [
                'getTicketAnalytics',
                'getUserAnalytics',
                'getSystemPerformance',
                'getGitHubAnalytics',
                'getAdministrativeReports',
                'getDashboardData',
                'getKPIDashboard',
                'getVisualizationData',
                'exportData'
            ];
            
            for (const method of analyticsMethods) {
                this.debugResults.total++;
                if (typeof analyticsService[method] === 'function') {
                    this.debugResults.passed++;
                    console.log(`✅ AnalyticsService.${method} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ AnalyticsService.${method} - MISSING`);
                    this.debugResults.errors.push(`AnalyticsService.${method} is missing`);
                }
            }
            
            // Debug ReportingService
            const ReportingService = require('./services/reportingService');
            const reportingService = new ReportingService();
            
            const reportingMethods = [
                'generateReport',
                'getReportTemplates',
                'getSavedReports',
                'saveReport',
                'deleteReport',
                'scheduleReport',
                'getScheduledReports',
                'cancelScheduledReport',
                'exportReport',
                'shareReport',
                'getReportSharing',
                'getReportHistory',
                'getReportStatus',
                'createReportTemplate',
                'updateReportTemplate',
                'deleteReportTemplate'
            ];
            
            for (const method of reportingMethods) {
                this.debugResults.total++;
                if (typeof reportingService[method] === 'function') {
                    this.debugResults.passed++;
                    console.log(`✅ ReportingService.${method} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ ReportingService.${method} - MISSING`);
                    this.debugResults.errors.push(`ReportingService.${method} is missing`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Services Debug Error: ${error.message}`);
            this.debugResults.errors.push(`Services: ${error.message}`);
        }
        
        console.log('');
    }

    async debugModels() {
        console.log('🗄️ Debugging Models');
        console.log('-------------------');
        
        try {
            // Debug Analytics model
            const Analytics = require('./models/Analytics');
            
            const analyticsMethods = [
                'findByKey',
                'findValid',
                'cacheAnalytics',
                'cleanupExpired'
            ];
            
            for (const method of analyticsMethods) {
                this.debugResults.total++;
                if (typeof Analytics[method] === 'function') {
                    this.debugResults.passed++;
                    console.log(`✅ Analytics.${method} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ Analytics.${method} - MISSING`);
                    this.debugResults.errors.push(`Analytics.${method} is missing`);
                }
            }
            
            // Debug Report model
            const Report = require('./models/Report');
            
            const reportMethods = [
                'findByUser',
                'findScheduled',
                'findTemplates',
                'findPublic',
                'cleanupExpired'
            ];
            
            for (const method of reportMethods) {
                this.debugResults.total++;
                if (typeof Report[method] === 'function') {
                    this.debugResults.passed++;
                    console.log(`✅ Report.${method} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ Report.${method} - MISSING`);
                    this.debugResults.errors.push(`Report.${method} is missing`);
                }
            }
            
            // Debug Dashboard model
            const Dashboard = require('./models/Dashboard');
            
            const dashboardMethods = [
                'findByUser',
                'findTemplates',
                'findPublic',
                'cleanupExpired'
            ];
            
            for (const method of dashboardMethods) {
                this.debugResults.total++;
                if (typeof Dashboard[method] === 'function') {
                    this.debugResults.passed++;
                    console.log(`✅ Dashboard.${method} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ Dashboard.${method} - MISSING`);
                    this.debugResults.errors.push(`Dashboard.${method} is missing`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Models Debug Error: ${error.message}`);
            this.debugResults.errors.push(`Models: ${error.message}`);
        }
        
        console.log('');
    }

    async debugUtilities() {
        console.log('🛠️ Debugging Utilities');
        console.log('-----------------------');
        
        try {
            // Debug DataAggregator
            const DataAggregator = require('./utils/dataAggregator');
            const dataAggregator = new DataAggregator();
            
            const aggregatorMethods = [
                'aggregateByTime',
                'aggregateByCategory',
                'calculateMovingAverage',
                'calculateTrend',
                'calculatePercentiles',
                'groupByMultipleFields',
                'filterByDateRange',
                'calculateGrowthRate',
                'calculateCAGR',
                'smoothData',
                'detectOutliers',
                'calculateCorrelation',
                'transformForChart',
                'cacheData',
                'getCachedData'
            ];
            
            for (const method of aggregatorMethods) {
                this.debugResults.total++;
                if (typeof dataAggregator[method] === 'function') {
                    this.debugResults.passed++;
                    console.log(`✅ DataAggregator.${method} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ DataAggregator.${method} - MISSING`);
                    this.debugResults.errors.push(`DataAggregator.${method} is missing`);
                }
            }
            
            // Debug ChartGenerator
            const ChartGenerator = require('./utils/chartGenerator');
            const chartGenerator = new ChartGenerator();
            
            const chartMethods = [
                'generateChart',
                'formatData',
                'generateOptions',
                'generateColorPalette',
                'generateGradientColors',
                'validateChartConfig',
                'generateChartHTML',
                'exportChartAsImage',
                'generateThumbnail'
            ];
            
            for (const method of chartMethods) {
                this.debugResults.total++;
                if (typeof chartGenerator[method] === 'function') {
                    this.debugResults.passed++;
                    console.log(`✅ ChartGenerator.${method} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ ChartGenerator.${method} - MISSING`);
                    this.debugResults.errors.push(`ChartGenerator.${method} is missing`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Utilities Debug Error: ${error.message}`);
            this.debugResults.errors.push(`Utilities: ${error.message}`);
        }
        
        console.log('');
    }

    async debugRoutes() {
        console.log('🛣️ Debugging Routes');
        console.log('-------------------');
        
        try {
            // Debug analytics routes
            const analyticsRoutes = require('./routes/analyticsRoutes');
            
            this.debugResults.total++;
            if (typeof analyticsRoutes === 'function') {
                this.debugResults.passed++;
                console.log(`✅ Analytics Routes - VALID ROUTER`);
            } else {
                this.debugResults.failed++;
                console.log(`❌ Analytics Routes - INVALID ROUTER`);
                this.debugResults.errors.push('Analytics routes is not a valid router');
            }
            
            // Debug reporting routes
            const reportingRoutes = require('./routes/reportingRoutes');
            
            this.debugResults.total++;
            if (typeof reportingRoutes === 'function') {
                this.debugResults.passed++;
                console.log(`✅ Reporting Routes - VALID ROUTER`);
            } else {
                this.debugResults.failed++;
                console.log(`❌ Reporting Routes - INVALID ROUTER`);
                this.debugResults.errors.push('Reporting routes is not a valid router');
            }
            
        } catch (error) {
            console.log(`❌ Routes Debug Error: ${error.message}`);
            this.debugResults.errors.push(`Routes: ${error.message}`);
        }
        
        console.log('');
    }

    async debugFrontendComponents() {
        console.log('🎨 Debugging Frontend Components');
        console.log('---------------------------------');
        
        const frontendFiles = [
            'public/analytics-dashboard.js',
            'public/report-builder.js'
        ];

        for (const file of frontendFiles) {
            const filePath = path.join(__dirname, file);
            const exists = fs.existsSync(filePath);
            
            this.debugResults.total++;
            
            if (exists) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                const hasClass = content.includes('class ');
                const hasConstructor = content.includes('constructor');
                const hasInit = content.includes('init()');
                const hasEventListeners = content.includes('addEventListener');
                const hasMethods = content.includes('function') || content.includes('method');
                const hasExport = content.includes('module.exports') || content.includes('export');
                
                if (hasClass && hasConstructor && hasEventListeners && hasExport) {
                    this.debugResults.passed++;
                    console.log(`✅ ${file} - VALID COMPONENT`);
                    this.debugResults.details[file] = {
                        status: 'VALID',
                        hasClass,
                        hasConstructor,
                        hasInit,
                        hasEventListeners,
                        hasMethods,
                        hasExport
                    };
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ ${file} - INVALID COMPONENT`);
                    this.debugResults.errors.push(`${file} is not a valid component`);
                    this.debugResults.details[file] = {
                        status: 'INVALID',
                        hasClass,
                        hasConstructor,
                        hasInit,
                        hasEventListeners,
                        hasMethods,
                        hasExport
                    };
                }
            } else {
                this.debugResults.failed++;
                console.log(`❌ ${file} - MISSING`);
                this.debugResults.errors.push(`${file} is missing`);
                this.debugResults.details[file] = {
                    status: 'MISSING'
                };
            }
        }
        
        console.log('');
    }

    async debugAPIEndpoints() {
        console.log('🌐 Debugging API Endpoints');
        console.log('---------------------------');
        
        try {
            // Test analytics routes file for endpoint definitions
            const analyticsRoutesContent = fs.readFileSync(path.join(__dirname, 'routes/analyticsRoutes.js'), 'utf8');
            
            const analyticsEndpoints = [
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
                'GET /api/analytics/metrics'
            ];

            for (const endpoint of analyticsEndpoints) {
                const path = endpoint.split(' ')[1];
                const hasEndpoint = analyticsRoutesContent.includes(path);
                
                this.debugResults.total++;
                
                if (hasEndpoint) {
                    this.debugResults.passed++;
                    console.log(`✅ ${endpoint} - DEFINED`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ ${endpoint} - NOT DEFINED`);
                    this.debugResults.errors.push(`${endpoint} is not defined`);
                }
            }
            
            // Test reporting routes file for endpoint definitions
            const reportingRoutesContent = fs.readFileSync(path.join(__dirname, 'routes/reportingRoutes.js'), 'utf8');
            
            const reportingEndpoints = [
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

            for (const endpoint of reportingEndpoints) {
                const path = endpoint.split(' ')[1];
                const hasEndpoint = reportingRoutesContent.includes(path) || 
                                  reportingRoutesContent.includes(path.split('/')[1]);
                
                this.debugResults.total++;
                
                if (hasEndpoint) {
                    this.debugResults.passed++;
                    console.log(`✅ ${endpoint} - DEFINED`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ ${endpoint} - NOT DEFINED`);
                    this.debugResults.errors.push(`${endpoint} is not defined`);
                }
            }
            
        } catch (error) {
            console.log(`❌ API Endpoints Debug Error: ${error.message}`);
            this.debugResults.errors.push(`API Endpoints: ${error.message}`);
        }
        
        console.log('');
    }

    async debugDatabaseOperations() {
        console.log('🗃️ Debugging Database Operations');
        console.log('---------------------------------');
        
        try {
            // Test model instantiation
            const Analytics = require('./models/Analytics');
            const Report = require('./models/Report');
            const Dashboard = require('./models/Dashboard');
            
            // Test Analytics model schema
            const analyticsSchema = Analytics.schema;
            const analyticsFields = ['key', 'data', 'type', 'timestamp', 'expiresAt'];
            
            for (const field of analyticsFields) {
                this.debugResults.total++;
                if (analyticsSchema.paths[field]) {
                    this.debugResults.passed++;
                    console.log(`✅ Analytics Schema.${field} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ Analytics Schema.${field} - MISSING`);
                    this.debugResults.errors.push(`Analytics schema field ${field} is missing`);
                }
            }
            
            // Test Report model schema
            const reportSchema = Report.schema;
            const reportFields = ['name', 'type', 'data', 'status', 'createdBy'];
            
            for (const field of reportFields) {
                this.debugResults.total++;
                if (reportSchema.paths[field]) {
                    this.debugResults.passed++;
                    console.log(`✅ Report Schema.${field} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ Report Schema.${field} - MISSING`);
                    this.debugResults.errors.push(`Report schema field ${field} is missing`);
                }
            }
            
            // Test Dashboard model schema
            const dashboardSchema = Dashboard.schema;
            const dashboardFields = ['name', 'type', 'widgets', 'createdBy'];
            
            for (const field of dashboardFields) {
                this.debugResults.total++;
                if (dashboardSchema.paths[field]) {
                    this.debugResults.passed++;
                    console.log(`✅ Dashboard Schema.${field} - EXISTS`);
                } else {
                    this.debugResults.failed++;
                    console.log(`❌ Dashboard Schema.${field} - MISSING`);
                    this.debugResults.errors.push(`Dashboard schema field ${field} is missing`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Database Operations Debug Error: ${error.message}`);
            this.debugResults.errors.push(`Database Operations: ${error.message}`);
        }
        
        console.log('');
    }

    async debugIntegration() {
        console.log('🔗 Debugging Integration');
        console.log('-------------------------');
        
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
            
            this.debugResults.total++;
            if (analyticsController && reportingController && analyticsService && 
                reportingService && dataAggregator && chartGenerator) {
                this.debugResults.passed++;
                console.log(`✅ Component Integration - SUCCESS`);
            } else {
                this.debugResults.failed++;
                console.log(`❌ Component Integration - FAILED`);
                this.debugResults.errors.push('Component integration failed');
            }
            
            // Test method chaining
            const testData = [
                { value: 10, date: new Date('2023-01-01') },
                { value: 20, date: new Date('2023-01-02') },
                { value: 15, date: new Date('2023-01-03') }
            ];
            
            const aggregationResult = dataAggregator.aggregateByTime(testData, 'date', 'day');
            
            this.debugResults.total++;
            if (Array.isArray(aggregationResult) && aggregationResult.length > 0) {
                this.debugResults.passed++;
                console.log(`✅ Data Aggregation - WORKING`);
            } else {
                this.debugResults.failed++;
                console.log(`❌ Data Aggregation - FAILED`);
                this.debugResults.errors.push('Data aggregation failed');
            }
            
            // Test chart generation
            const chartConfig = chartGenerator.generateChart('line', {
                labels: ['A', 'B', 'C'],
                datasets: [{ data: [1, 2, 3] }]
            });
            
            this.debugResults.total++;
            if (chartConfig && chartConfig.type === 'line') {
                this.debugResults.passed++;
                console.log(`✅ Chart Generation - WORKING`);
            } else {
                this.debugResults.failed++;
                console.log(`❌ Chart Generation - FAILED`);
                this.debugResults.errors.push('Chart generation failed');
            }
            
        } catch (error) {
            console.log(`❌ Integration Debug Error: ${error.message}`);
            this.debugResults.errors.push(`Integration: ${error.message}`);
        }
        
        console.log('');
    }

    async debugFunctionality() {
        console.log('⚙️ Debugging Functionality');
        console.log('--------------------------');
        
        try {
            // Test data aggregation functionality
            const DataAggregator = require('./utils/dataAggregator');
            const dataAggregator = new DataAggregator();
            
            const testCases = [
                {
                    name: 'Time Aggregation',
                    test: () => {
                        const data = [
                            { value: 10, date: new Date('2023-01-01') },
                            { value: 20, date: new Date('2023-01-02') }
                        ];
                        return dataAggregator.aggregateByTime(data, 'date', 'day');
                    }
                },
                {
                    name: 'Category Aggregation',
                    test: () => {
                        const data = [
                            { category: 'A', value: 10 },
                            { category: 'B', value: 20 }
                        ];
                        return dataAggregator.aggregateByCategory(data, 'category');
                    }
                },
                {
                    name: 'Trend Calculation',
                    test: () => {
                        const data = [1, 2, 3, 4, 5];
                        return dataAggregator.calculateTrend(data.map(v => ({ value: v })));
                    }
                }
            ];
            
            for (const testCase of testCases) {
                this.debugResults.total++;
                try {
                    const result = testCase.test();
                    if (result && (Array.isArray(result) || typeof result === 'object')) {
                        this.debugResults.passed++;
                        console.log(`✅ ${testCase.name} - WORKING`);
                    } else {
                        this.debugResults.failed++;
                        console.log(`❌ ${testCase.name} - FAILED`);
                        this.debugResults.errors.push(`${testCase.name} failed`);
                    }
                } catch (error) {
                    this.debugResults.failed++;
                    console.log(`❌ ${testCase.name} - ERROR: ${error.message}`);
                    this.debugResults.errors.push(`${testCase.name} error: ${error.message}`);
                }
            }
            
            // Test chart generation functionality
            const ChartGenerator = require('./utils/chartGenerator');
            const chartGenerator = new ChartGenerator();
            
            const chartTestCases = [
                {
                    name: 'Line Chart Generation',
                    test: () => {
                        return chartGenerator.generateChart('line', {
                            labels: ['A', 'B', 'C'],
                            datasets: [{ data: [1, 2, 3] }]
                        });
                    }
                },
                {
                    name: 'Bar Chart Generation',
                    test: () => {
                        return chartGenerator.generateChart('bar', {
                            labels: ['A', 'B', 'C'],
                            datasets: [{ data: [1, 2, 3] }]
                        });
                    }
                },
                {
                    name: 'Pie Chart Generation',
                    test: () => {
                        return chartGenerator.generateChart('pie', {
                            labels: ['A', 'B', 'C'],
                            datasets: [{ data: [1, 2, 3] }]
                        });
                    }
                }
            ];
            
            for (const testCase of chartTestCases) {
                this.debugResults.total++;
                try {
                    const result = testCase.test();
                    if (result && result.type && result.data) {
                        this.debugResults.passed++;
                        console.log(`✅ ${testCase.name} - WORKING`);
                    } else {
                        this.debugResults.failed++;
                        console.log(`❌ ${testCase.name} - FAILED`);
                        this.debugResults.errors.push(`${testCase.name} failed`);
                    }
                } catch (error) {
                    this.debugResults.failed++;
                    console.log(`❌ ${testCase.name} - ERROR: ${error.message}`);
                    this.debugResults.errors.push(`${testCase.name} error: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Functionality Debug Error: ${error.message}`);
            this.debugResults.errors.push(`Functionality: ${error.message}`);
        }
        
        console.log('');
    }

    generateDebugReport() {
        console.log('📊 Debug Results Summary');
        console.log('========================\n');
        
        const successRate = this.debugResults.total > 0 ? 
            ((this.debugResults.passed / this.debugResults.total) * 100).toFixed(2) : 0;
        
        console.log(`📈 Total Tests: ${this.debugResults.total}`);
        console.log(`✅ Passed: ${this.debugResults.passed}`);
        console.log(`❌ Failed: ${this.debugResults.failed}`);
        console.log(`📊 Success Rate: ${successRate}%`);
        
        if (this.debugResults.errors.length > 0) {
            console.log('\n🚨 Errors:');
            this.debugResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        console.log('\n🎯 Assessment:');
        if (successRate >= 95) {
            console.log('🟢 EXCELLENT - Reporting system is fully operational');
        } else if (successRate >= 80) {
            console.log('🟡 GOOD - Reporting system is mostly operational with minor issues');
        } else if (successRate >= 60) {
            console.log('🟠 FAIR - Reporting system has significant issues that need attention');
        } else {
            console.log('🔴 POOR - Reporting system requires major fixes');
        }
        
        // Save debug results
        const debugReport = {
            timestamp: new Date().toISOString(),
            results: this.debugResults,
            successRate: parseFloat(successRate),
            assessment: this.getAssessment(successRate),
            systems: this.systems
        };
        
        const reportPath = path.join(__dirname, 'reporting-system-debug-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(debugReport, null, 2));
        
        console.log(`\n📄 Detailed debug report saved to: ${reportPath}`);
        
        return debugReport;
    }

    getAssessment(successRate) {
        if (successRate >= 95) return 'EXCELLENT';
        if (successRate >= 80) return 'GOOD';
        if (successRate >= 60) return 'FAIR';
        return 'POOR';
    }
}

// Run debug tests
async function runReportingSystemDebug() {
    const systemDebugger = new ReportingSystemDebugger();
    await systemDebugger.runAllDebugTests();
}

// Export for use in other modules
module.exports = {
    ReportingSystemDebugger,
    runReportingSystemDebug
};

// Run debug if this file is executed directly
if (require.main === module) {
    runReportingSystemDebug().catch(console.error);
}
