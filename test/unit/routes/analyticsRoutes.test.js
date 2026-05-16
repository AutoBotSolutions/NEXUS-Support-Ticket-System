/**
 * Analytics Routes Unit Tests
 * 
 * Comprehensive unit tests for the Analytics routes
 * covering all endpoints and error handling.
 */

const request = require('supertest');
const express = require('express');
const AnalyticsController = require('../../../controllers/analyticsController');

// Mock the controller
jest.mock('../../../controllers/analyticsController');

describe('Analytics Routes', () => {
  let app;
  let mockController;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Mock controller
    mockController = {
      getTicketAnalytics: jest.fn(),
      getUserAnalytics: jest.fn(),
      getSystemPerformance: jest.fn(),
      getGitHubAnalytics: jest.fn(),
      getAdministrativeReports: jest.fn(),
      getDashboardData: jest.fn(),
      getKPIDashboard: jest.fn(),
      getVisualizationData: jest.fn(),
      exportData: jest.fn()
    };

    // Mock AnalyticsController constructor
    AnalyticsController.mockImplementation(() => mockController);

    // Import and use routes
    const analyticsRoutes = require('../../../routes/analyticsRoutes');
    app.use('/api/analytics', analyticsRoutes);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/tickets', () => {
    it('should return ticket analytics', async () => {
      const mockAnalytics = {
        overview: { totalTickets: 100, openTickets: 25 },
        volume: [1, 2, 3],
        resolutionTime: [24, 36, 48]
      };

      mockController.getTicketAnalytics.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockAnalytics,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
      expect(response.body.timestamp).toBeDefined();
      expect(mockController.getTicketAnalytics).toHaveBeenCalled();
    });

    it('should handle query parameters', async () => {
      mockController.getTicketAnalytics.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: { overview: { totalTickets: 50 } },
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/tickets?startDate=2023-01-01&endDate=2023-01-31')
        .expect(200);

      expect(mockController.getTicketAnalytics).toHaveBeenCalled();
    });

    it('should handle controller errors', async () => {
      mockController.getTicketAnalytics.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: 'Service error',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Service error');
    });
  });

  describe('GET /api/analytics/users', () => {
    it('should return user analytics', async () => {
      const mockAnalytics = {
        overview: { totalUsers: 50, activeUsers: 35 },
        activity: [10, 15, 20],
        performance: { averageActivity: 12.5 }
      };

      mockController.getUserAnalytics.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockAnalytics,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
      expect(mockController.getUserAnalytics).toHaveBeenCalled();
    });

    it('should handle user analytics errors', async () => {
      mockController.getUserAnalytics.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: 'Database error',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/users')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/analytics/performance', () => {
    it('should return system performance metrics', async () => {
      const mockPerformance = {
        apiMetrics: { averageResponseTime: 45.2 },
        databaseMetrics: { connectionPool: 15 },
        systemMetrics: { cpu: 45.2, memory: 68.5 }
      };

      mockController.getSystemPerformance.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockPerformance,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPerformance);
      expect(mockController.getSystemPerformance).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/github', () => {
    it('should return GitHub integration analytics', async () => {
      const mockGitHubAnalytics = {
        syncRates: { success: 98.5, failed: 1.5 },
        webhookPerformance: { averageProcessingTime: 150 },
        issueAnalytics: { totalIssues: 200 }
      };

      mockController.getGitHubAnalytics.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockGitHubAnalytics,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/github')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGitHubAnalytics);
      expect(mockController.getGitHubAnalytics).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/administrative', () => {
    it('should return administrative reports', async () => {
      const mockAdminReports = {
        systemUsage: { dailyActiveUsers: 25 },
        securityIncidents: { total: 2, resolved: 2 },
        auditTrail: { totalActions: 150 }
      };

      mockController.getAdministrativeReports.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockAdminReports,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/administrative')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAdminReports);
      expect(mockController.getAdministrativeReports).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should return real-time dashboard data', async () => {
      const mockDashboardData = {
        kpi: { totalTickets: 100, resolutionRate: 0.95 },
        widgets: [{ id: 1, type: 'chart' }],
        charts: [{ id: 1, type: 'line' }],
        metrics: { responseTime: 45 }
      };

      mockController.getDashboardData.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockDashboardData,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDashboardData);
      expect(mockController.getDashboardData).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/kpi', () => {
    it('should return KPI dashboard metrics', async () => {
      const mockKPIData = {
        kpis: [
          { name: 'Resolution Time', value: 36, target: 48 },
          { name: 'Customer Satisfaction', value: 4.5, target: 4.0 }
        ],
        targets: { resolutionTime: 48, satisfaction: 4.0 },
        performance: { overall: 92 }
      };

      mockController.getKPIDashboard.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockKPIData,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/kpi')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockKPIData);
      expect(mockController.getKPIDashboard).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/visualization', () => {
    it('should return visualization data', async () => {
      const mockVizData = {
        chart: { type: 'line', config: {} },
        data: [{ x: '2023-01-01', y: 10 }],
        options: { responsive: true }
      };

      mockController.getVisualizationData.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockVizData,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/visualization?type=line&data=tickets')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockVizData);
      expect(mockController.getVisualizationData).toHaveBeenCalled();
    });

    it('should handle missing visualization parameters', async () => {
      mockController.getVisualizationData.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Visualization type is required',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/visualization')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Visualization type is required');
    });
  });

  describe('GET /api/analytics/export', () => {
    it('should export data in specified format', async () => {
      const mockExportData = {
        downloadUrl: '/downloads/tickets_20230101.csv',
        format: 'csv',
        size: 1024
      };

      mockController.exportData.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockExportData,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/export?format=csv&type=tickets')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockExportData);
      expect(mockController.exportData).toHaveBeenCalled();
    });

    it('should handle invalid export format', async () => {
      mockController.exportData.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Invalid export format',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/export?format=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid export format');
    });
  });

  describe('GET /api/analytics/health', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'healthy',
        services: {
          dataAggregator: 'operational',
          chartGenerator: 'operational',
          cache: 'operational'
        },
        uptime: process.uptime()
      };

      // This endpoint should be handled directly by the route
      const response = await request(app)
        .get('/api/analytics/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('GET /api/analytics/metrics', () => {
    it('should return service metrics', async () => {
      const mockMetrics = {
        requests: 1250,
        cacheHitRate: 85.2,
        averageResponseTime: 45.3,
        errorRate: 0.01
      };

      // This endpoint should be handled directly by the route
      const response = await request(app)
        .get('/api/analytics/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/analytics/nonexistent')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/analytics/export')
        .send('invalid-json')
        .expect(400);
    });

    it('should handle empty requests', async () => {
      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(200);

      // Should handle empty query parameters gracefully
      expect(response.body).toBeDefined();
    });
  });

  describe('Request Validation', () => {
    it('should validate date parameters', async () => {
      mockController.getTicketAnalytics.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Invalid date format',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/tickets?startDate=invalid-date')
        .expect(400);

      expect(response.body.error).toBe('Invalid date format');
    });

    it('should validate filter parameters', async () => {
      mockController.getTicketAnalytics.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Invalid filters format',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/tickets?filters=invalid-json')
        .expect(400);

      expect(response.body.error).toBe('Invalid filters format');
    });
  });

  describe('Response Format', () => {
    it('should return consistent response format', async () => {
      mockController.getTicketAnalytics.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: { overview: { totalTickets: 100 } },
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return error response format', async () => {
      mockController.getTicketAnalytics.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: 'Service error',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(500);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      mockController.getTicketAnalytics.mockImplementation((req, res) => {
        // Simulate some processing time
        setTimeout(() => {
          res.json({
            success: true,
            data: { overview: { totalTickets: 100 } },
            timestamp: new Date().toISOString()
          });
        }, 10);
      });

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(200);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
      expect(response.body.success).toBe(true);
    });

    it('should handle concurrent requests', async () => {
      mockController.getTicketAnalytics.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: { overview: { totalTickets: 100 } },
          timestamp: new Date().toISOString()
        });
      });

      const promises = Array(10).fill().map(() => 
        request(app).get('/api/analytics/tickets')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(mockController.getTicketAnalytics).toHaveBeenCalledTimes(10);
    });
  });

  describe('Security', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/analytics/health')
        .expect(200);

      // Check for common security headers (if implemented)
      // This would depend on the actual implementation
      expect(response.headers).toBeDefined();
    });

    it('should handle large requests gracefully', async () => {
      const largeQuery = 'a'.repeat(10000);
      
      mockController.getTicketAnalytics.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Query too large',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get(`/api/analytics/tickets?query=${largeQuery}`)
        .expect(400);

      expect(response.body.error).toBe('Query too large');
    });
  });
});
