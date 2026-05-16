/**
 * Analytics Controller Unit Tests
 * 
 * Comprehensive unit tests for the Analytics Controller
 * covering all methods and edge cases.
 */

const AnalyticsController = require('../../../controllers/analyticsController');
const AnalyticsService = require('../../../services/analyticsService');

// Mock dependencies
jest.mock('../../../services/analyticsService');

describe('AnalyticsController', () => {
  let analyticsController;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    analyticsController = new AnalyticsController();
    mockReq = {
      query: {},
      user: { _id: 'user123', role: 'admin' }
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getTicketAnalytics', () => {
    it('should return ticket analytics successfully', async () => {
      const mockAnalytics = {
        overview: { totalTickets: 100, openTickets: 25 },
        volume: [1, 2, 3],
        resolutionTime: [24, 36, 48],
        trends: [10, 15, 20],
        categories: { bug: 40, feature: 30, support: 30 },
        priorities: { high: 10, medium: 60, low: 30 },
        statusDistribution: { open: 25, closed: 75 },
        performance: { averageResolutionTime: 36 }
      };

      AnalyticsService.prototype.getTicketAnalytics.mockResolvedValue(mockAnalytics);

      await analyticsController.getTicketAnalytics(mockReq, mockRes);

      expect(AnalyticsService.prototype.getTicketAnalytics).toHaveBeenCalledWith({
        startDate: null,
        endDate: null,
        filters: {}
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalytics,
        timestamp: expect.any(String)
      });
    });

    it('should handle date range parameters', async () => {
      mockReq.query = {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        filters: '{"status": "open"}'
      };

      const mockAnalytics = { overview: { totalTickets: 50 } };
      AnalyticsService.prototype.getTicketAnalytics.mockResolvedValue(mockAnalytics);

      await analyticsController.getTicketAnalytics(mockReq, mockRes);

      expect(AnalyticsService.prototype.getTicketAnalytics).toHaveBeenCalledWith({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        filters: { status: 'open' }
      });
    });

    it('should handle service errors gracefully', async () => {
      AnalyticsService.prototype.getTicketAnalytics.mockRejectedValue(new Error('Service error'));

      await analyticsController.getTicketAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service error',
        timestamp: expect.any(String)
      });
    });
  });

  describe('getUserAnalytics', () => {
    it('should return user analytics successfully', async () => {
      const mockAnalytics = {
        overview: { totalUsers: 50, activeUsers: 35 },
        activity: [10, 15, 20],
        performance: { averageActivity: 12.5 },
        engagement: { loginRate: 0.8 },
        registrationTrends: [5, 8, 12],
        roleDistribution: { admin: 5, agent: 20, user: 25 }
      };

      AnalyticsService.prototype.getUserAnalytics.mockResolvedValue(mockAnalytics);

      await analyticsController.getUserAnalytics(mockReq, mockRes);

      expect(AnalyticsService.prototype.getUserAnalytics).toHaveBeenCalledWith({
        startDate: null,
        endDate: null,
        filters: {}
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalytics,
        timestamp: expect.any(String)
      });
    });

    it('should handle user analytics errors', async () => {
      AnalyticsService.prototype.getUserAnalytics.mockRejectedValue(new Error('Database error'));

      await analyticsController.getUserAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
        timestamp: expect.any(String)
      });
    });
  });

  describe('getSystemPerformance', () => {
    it('should return system performance metrics', async () => {
      const mockPerformance = {
        apiMetrics: { averageResponseTime: 45.2, requestRate: 125.5 },
        databaseMetrics: { connectionPool: 15, queryTime: 12.3 },
        systemMetrics: { cpu: 45.2, memory: 68.5 },
        errorTracking: { errorRate: 0.02 },
        uptime: { totalUptime: 99.9 }
      };

      AnalyticsService.prototype.getSystemPerformance.mockResolvedValue(mockPerformance);

      await analyticsController.getSystemPerformance(mockReq, mockRes);

      expect(AnalyticsService.prototype.getSystemPerformance).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPerformance,
        timestamp: expect.any(String)
      });
    });
  });

  describe('getGitHubAnalytics', () => {
    it('should return GitHub integration analytics', async () => {
      const mockGitHubAnalytics = {
        syncRates: { success: 98.5, failed: 1.5 },
        webhookPerformance: { averageProcessingTime: 150 },
        integrationErrors: [],
        issueAnalytics: { totalIssues: 200, resolvedIssues: 180 },
        crossPlatformCorrelation: { correlation: 0.85 }
      };

      AnalyticsService.prototype.getGitHubAnalytics.mockResolvedValue(mockGitHubAnalytics);

      await analyticsController.getGitHubAnalytics(mockReq, mockRes);

      expect(AnalyticsService.prototype.getGitHubAnalytics).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockGitHubAnalytics,
        timestamp: expect.any(String)
      });
    });
  });

  describe('getAdministrativeReports', () => {
    it('should return administrative reports', async () => {
      const mockAdminReports = {
        systemUsage: { dailyActiveUsers: 25 },
        securityIncidents: { total: 2, resolved: 2 },
        auditTrail: { totalActions: 150 },
        compliance: { complianceScore: 95 },
        costAnalysis: { monthlyCost: 5000 }
      };

      AnalyticsService.prototype.getAdministrativeReports.mockResolvedValue(mockAdminReports);

      await analyticsController.getAdministrativeReports(mockReq, mockRes);

      expect(AnalyticsService.prototype.getAdministrativeReports).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAdminReports,
        timestamp: expect.any(String)
      });
    });
  });

  describe('getDashboardData', () => {
    it('should return real-time dashboard data', async () => {
      const mockDashboardData = {
        kpi: { totalTickets: 100, resolutionRate: 0.95 },
        widgets: [{ id: 1, type: 'chart', data: [] }],
        charts: [{ id: 1, type: 'line', data: [] }],
        metrics: { responseTime: 45, throughput: 125 }
      };

      AnalyticsService.prototype.getDashboardData.mockResolvedValue(mockDashboardData);

      await analyticsController.getDashboardData(mockReq, mockRes);

      expect(AnalyticsService.prototype.getDashboardData).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDashboardData,
        timestamp: expect.any(String)
      });
    });
  });

  describe('getKPIDashboard', () => {
    it('should return KPI dashboard metrics', async () => {
      const mockKPIData = {
        kpis: [
          { name: 'Resolution Time', value: 36, target: 48, status: 'good' },
          { name: 'Customer Satisfaction', value: 4.5, target: 4.0, status: 'excellent' }
        ],
        targets: { resolutionTime: 48, satisfaction: 4.0 },
        performance: { overall: 92 },
        trends: { resolutionTime: -5, satisfaction: 0.2 }
      };

      AnalyticsService.prototype.getKPIDashboard.mockResolvedValue(mockKPIData);

      await analyticsController.getKPIDashboard(mockReq, mockRes);

      expect(AnalyticsService.prototype.getKPIDashboard).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockKPIData,
        timestamp: expect.any(String)
      });
    });
  });

  describe('getVisualizationData', () => {
    it('should return visualization data for charts', async () => {
      mockReq.query = {
        type: 'line',
        data: 'tickets',
        options: '{"timeRange": "30d"}'
      };

      const mockVizData = {
        chart: { type: 'line', config: {} },
        data: [{ x: '2023-01-01', y: 10 }],
        options: { responsive: true }
      };

      AnalyticsService.prototype.getVisualizationData.mockResolvedValue(mockVizData);

      await analyticsController.getVisualizationData(mockReq, mockRes);

      expect(AnalyticsService.prototype.getVisualizationData).toHaveBeenCalledWith({
        type: 'line',
        data: 'tickets',
        options: { timeRange: '30d' }
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockVizData,
        timestamp: expect.any(String)
      });
    });
  });

  describe('exportData', () => {
    it('should export data in specified format', async () => {
      mockReq.query = {
        format: 'csv',
        type: 'tickets',
        filters: '{"status": "closed"}'
      };

      const mockExportData = {
        downloadUrl: '/downloads/tickets_20230101.csv',
        format: 'csv',
        size: 1024
      };

      AnalyticsService.prototype.exportData.mockResolvedValue(mockExportData);

      await analyticsController.exportData(mockReq, mockRes);

      expect(AnalyticsService.prototype.exportData).toHaveBeenCalledWith({
        format: 'csv',
        type: 'tickets',
        filters: { status: 'closed' }
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockExportData,
        timestamp: expect.any(String)
      });
    });

    it('should handle invalid export format', async () => {
      mockReq.query = { format: 'invalid', type: 'tickets' };

      await analyticsController.exportData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid export format',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user in request', async () => {
      delete mockReq.user;

      await analyticsController.getTicketAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        timestamp: expect.any(String)
      });
    });

    it('should handle invalid JSON in filters', async () => {
      mockReq.query = { filters: 'invalid-json' };

      await analyticsController.getTicketAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid filters format',
        timestamp: expect.any(String)
      });
    });

    it('should handle service unavailability', async () => {
      AnalyticsService.prototype.getTicketAnalytics.mockRejectedValue(new Error('Service unavailable'));

      await analyticsController.getTicketAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service unavailable',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Input Validation', () => {
    it('should validate date format', async () => {
      mockReq.query = { startDate: 'invalid-date' };

      await analyticsController.getTicketAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid date format',
        timestamp: expect.any(String)
      });
    });

    it('should validate visualization type', async () => {
      mockReq.query = { type: 'invalid-type' };

      await analyticsController.getVisualizationData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid visualization type',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const mockAnalytics = { overview: { totalTickets: 100 } };
      AnalyticsService.prototype.getTicketAnalytics.mockResolvedValue(mockAnalytics);

      const startTime = Date.now();
      await analyticsController.getTicketAnalytics(mockReq, mockRes);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should respond within 100ms
    });

    it('should handle concurrent requests', async () => {
      const mockAnalytics = { overview: { totalTickets: 100 } };
      AnalyticsService.prototype.getTicketAnalytics.mockResolvedValue(mockAnalytics);

      const promises = Array(10).fill().map(() => 
        analyticsController.getTicketAnalytics(mockReq, mockRes)
      );

      await Promise.all(promises);

      expect(AnalyticsService.prototype.getTicketAnalytics).toHaveBeenCalledTimes(10);
    });
  });
});
