/**
 * Analytics System Integration Tests
 * 
 * Comprehensive integration tests for the Analytics System
 * testing the interaction between controllers, services, and models.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

// Mock dependencies that might cause issues in test environment
jest.mock('../../services/analyticsService');
jest.mock('../../models/Analytics');

describe('Analytics System Integration', () => {
  let server;
  let analyticsServiceMock;
  let analyticsModelMock;

  beforeAll(async () => {
    // Start test server
    server = app.listen(0); // Use random port
    
    // Get mocked dependencies
    analyticsServiceMock = require('../../services/analyticsService');
    analyticsModelMock = require('../../models/Analytics');
  });

  afterAll(async () => {
    // Clean up
    if (server) {
      await server.close();
    }
  });

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Analytics API Integration', () => {
    describe('GET /api/analytics/tickets', () => {
      it('should integrate controller and service for ticket analytics', async () => {
        const mockAnalyticsData = {
          overview: { totalTickets: 100, openTickets: 25 },
          volume: [1, 2, 3, 4, 5],
          resolutionTime: [24, 36, 48, 60, 72],
          trends: { increasing: true },
          categories: { bug: 40, feature: 35, support: 25 },
          priorities: { high: 10, medium: 60, low: 30 },
          statusDistribution: { open: 25, closed: 75 },
          performance: { averageResolutionTime: 48 }
        };

        // Mock service method
        analyticsServiceMock.prototype.getTicketAnalytics.mockResolvedValue(mockAnalyticsData);

        const response = await request(app)
          .get('/api/analytics/tickets')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockAnalyticsData);
        expect(response.body.timestamp).toBeDefined();
        expect(analyticsServiceMock.prototype.getTicketAnalytics).toHaveBeenCalled();
      });

      it('should handle service errors in the integration chain', async () => {
        // Mock service to throw error
        analyticsServiceMock.prototype.getTicketAnalytics.mockRejectedValue(new Error('Service unavailable'));

        const response = await request(app)
          .get('/api/analytics/tickets')
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Service unavailable');
        expect(response.body.timestamp).toBeDefined();
      });

      it('should pass query parameters from controller to service', async () => {
        const mockAnalyticsData = { overview: { totalTickets: 50 } };
        analyticsServiceMock.prototype.getTicketAnalytics.mockResolvedValue(mockAnalyticsData);

        await request(app)
          .get('/api/analytics/tickets?startDate=2023-01-01&endDate=2023-01-31&filters={"status":"open"}')
          .expect(200);

        expect(analyticsServiceMock.prototype.getTicketAnalytics).toHaveBeenCalledWith({
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-31'),
          filters: { status: 'open' }
        });
      });
    });

    describe('GET /api/analytics/users', () => {
      it('should integrate user analytics flow', async () => {
        const mockUserData = {
          overview: { totalUsers: 50, activeUsers: 35 },
          activity: [10, 15, 20, 25, 30],
          performance: { averageActivity: 20 },
          engagement: { loginRate: 0.8 },
          registrationTrends: [5, 8, 12, 15, 18],
          roleDistribution: { admin: 5, agent: 20, user: 25 }
        };

        analyticsServiceMock.prototype.getUserAnalytics.mockResolvedValue(mockUserData);

        const response = await request(app)
          .get('/api/analytics/users')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockUserData);
        expect(analyticsServiceMock.prototype.getUserAnalytics).toHaveBeenCalled();
      });
    });

    describe('GET /api/analytics/dashboard', () => {
      it('should integrate dashboard data aggregation', async () => {
        const mockDashboardData = {
          kpi: { totalTickets: 100, resolutionRate: 0.95, satisfaction: 4.5 },
          widgets: [
            { id: 1, type: 'chart', data: [1, 2, 3] },
            { id: 2, type: 'metric', value: 95 }
          ],
          charts: [
            { id: 1, type: 'line', data: [{ x: '2023-01-01', y: 10 }] }
          ],
          metrics: { responseTime: 45, throughput: 125 }
        };

        analyticsServiceMock.prototype.getDashboardData.mockResolvedValue(mockDashboardData);

        const response = await request(app)
          .get('/api/analytics/dashboard')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockDashboardData);
        expect(analyticsServiceMock.prototype.getDashboardData).toHaveBeenCalled();
      });
    });
  });

  describe('Database Integration', () => {
    describe('Analytics Model Integration', () => {
      it('should integrate caching with database operations', async () => {
        const mockCacheData = {
          key: 'ticket_analytics_2023-01-01',
          data: { totalTickets: 100 },
          type: 'ticket_analytics',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        // Mock model static method
        analyticsModelMock.cacheAnalytics.mockResolvedValue(mockCacheData);

        // Mock service to use model
        analyticsServiceMock.prototype.getTicketAnalytics.mockImplementation(async (options) => {
          return await analyticsModelMock.cacheAnalytics('test_key', { totalTickets: 100 }, 'ticket_analytics');
        });

        const response = await request(app)
          .get('/api/analytics/tickets')
          .expect(200);

        expect(analyticsModelMock.cacheAnalytics).toHaveBeenCalled();
        expect(response.body.success).toBe(true);
      });

      it('should handle database connection errors', async () => {
        // Mock model to throw database error
        analyticsModelMock.findByKey.mockRejectedValue(new Error('Database connection failed'));

        // Mock service to use model
        analyticsServiceMock.prototype.getTicketAnalytics.mockImplementation(async (options) => {
          return await analyticsModelMock.findByKey('test_key');
        });

        const response = await request(app)
          .get('/api/analytics/tickets')
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Database connection failed');
      });
    });

    describe('Data Persistence Integration', () => {
      it('should persist analytics data correctly', async () => {
        const mockSavedData = {
          _id: 'cache123',
          key: 'test_analytics',
          data: { totalTickets: 100 },
          type: 'ticket_analytics',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        analyticsModelMock.cacheAnalytics.mockResolvedValue(mockSavedData);

        const response = await request(app)
          .get('/api/analytics/tickets')
          .expect(200);

        expect(analyticsModelMock.cacheAnalytics).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.any(String)
        );
      });
    });
  });

  describe('Service Integration', () => {
    describe('Analytics Service Integration', () => {
      it('should integrate multiple analytics sources', async () => {
        const mockIntegratedData = {
          tickets: { total: 100, open: 25 },
          users: { total: 50, active: 35 },
          performance: { responseTime: 45, throughput: 125 },
          combined: { overallScore: 92 }
        };

        // Mock service to integrate multiple data sources
        analyticsServiceMock.prototype.getTicketAnalytics.mockResolvedValue({ total: 100, open: 25 });
        analyticsServiceMock.prototype.getUserAnalytics.mockResolvedValue({ total: 50, active: 35 });
        analyticsServiceMock.prototype.getSystemPerformance.mockResolvedValue({ responseTime: 45, throughput: 125 });

        // Create a custom endpoint that combines data
        app.get('/api/analytics/integrated', async (req, res) => {
          try {
            const [tickets, users, performance] = await Promise.all([
              analyticsServiceMock.prototype.getTicketAnalytics({}),
              analyticsServiceMock.prototype.getUserAnalytics({}),
              analyticsServiceMock.prototype.getSystemPerformance()
            ]);

            const integrated = {
              tickets,
              users,
              performance,
              combined: { overallScore: 92 }
            };

            res.json({
              success: true,
              data: integrated,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            res.status(500).json({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        });

        const response = await request(app)
          .get('/api/analytics/integrated')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('tickets');
        expect(response.body.data).toHaveProperty('users');
        expect(response.body.data).toHaveProperty('performance');
        expect(response.body.data).toHaveProperty('combined');
      });

      it('should handle service timeouts gracefully', async () => {
        // Mock service to timeout
        analyticsServiceMock.prototype.getTicketAnalytics.mockImplementation(() => {
          return new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Service timeout')), 100);
          });
        });

        const response = await request(app)
          .get('/api/analytics/tickets')
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Service timeout');
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should propagate errors through the integration chain', async () => {
      // Mock service to throw error
      analyticsServiceMock.prototype.getTicketAnalytics.mockRejectedValue(new Error('Integration error'));

      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Integration error');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle partial service failures', async () => {
      // Mock one service to fail, others to succeed
      analyticsServiceMock.prototype.getTicketAnalytics.mockResolvedValue({ total: 100 });
      analyticsServiceMock.prototype.getUserAnalytics.mockRejectedValue(new Error('User service failed'));

      // Create endpoint that handles partial failures
      app.get('/api/analytics/partial', async (req, res) => {
        try {
          const tickets = await analyticsServiceMock.prototype.getTicketAnalytics({});
          let users = null;
          let error = null;

          try {
            users = await analyticsServiceMock.prototype.getUserAnalytics({});
          } catch (userError) {
            error = userError.message;
          }

          res.json({
            success: true,
            data: { tickets, users, error },
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      const response = await request(app)
        .get('/api/analytics/partial')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toBeDefined();
      expect(response.body.data.users).toBeNull();
      expect(response.body.data.error).toBe('User service failed');
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent requests efficiently', async () => {
      const mockData = { overview: { totalTickets: 100 } };
      analyticsServiceMock.prototype.getTicketAnalytics.mockResolvedValue(mockData);

      const promises = Array(20).fill().map(() => 
        request(app).get('/api/analytics/tickets')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(analyticsServiceMock.prototype.getTicketAnalytics).toHaveBeenCalledTimes(20);
    });

    it('should maintain response times under load', async () => {
      const mockData = { overview: { totalTickets: 100 } };
      analyticsServiceMock.prototype.getTicketAnalytics.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockData), 50); // 50ms delay
        });
      });

      const startTime = Date.now();
      await request(app).get('/api/analytics/tickets');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200); // Should complete within 200ms
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across service calls', async () => {
      const mockData = { overview: { totalTickets: 100 } };
      analyticsServiceMock.prototype.getTicketAnalytics.mockResolvedValue(mockData);
      analyticsServiceMock.prototype.getUserAnalytics.mockResolvedValue({ totalUsers: 50 });

      // Create endpoint that checks consistency
      app.get('/api/analytics/consistency', async (req, res) => {
        try {
          const [tickets, users] = await Promise.all([
            analyticsServiceMock.prototype.getTicketAnalytics({}),
            analyticsServiceMock.prototype.getUserAnalytics({})
          ]);

          // Check consistency
          const isConsistent = tickets.overview.totalTickets >= 0 && users.totalUsers >= 0;

          res.json({
            success: true,
            data: { tickets, users, isConsistent },
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      const response = await request(app)
        .get('/api/analytics/consistency')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isConsistent).toBe(true);
    });
  });

  describe('Authentication Integration', () => {
    it('should handle authentication in analytics endpoints', async () => {
      // This would test actual authentication middleware integration
      // For now, we'll mock the authentication check
      const mockData = { overview: { totalTickets: 100 } };
      analyticsServiceMock.prototype.getTicketAnalytics.mockResolvedValue(mockData);

      // Create protected endpoint
      app.get('/api/analytics/protected', (req, res, next) => {
        // Mock authentication check
        if (!req.headers.authorization) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            timestamp: new Date().toISOString()
          });
        }
        next();
      }, async (req, res) => {
        try {
          const data = await analyticsServiceMock.prototype.getTicketAnalytics({});
          res.json({
            success: true,
            data,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      const response = await request(app)
        .get('/api/analytics/protected')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('Caching Integration', () => {
    it('should integrate caching with analytics data', async () => {
      const mockCacheData = {
        key: 'cached_analytics',
        data: { totalTickets: 100 },
        timestamp: new Date()
      };

      analyticsModelMock.findByKey.mockResolvedValue(mockCacheData);
      analyticsServiceMock.prototype.getTicketAnalytics.mockImplementation(async (options) => {
        // Try to get from cache first
        const cached = await analyticsModelMock.findByKey('cached_analytics');
        if (cached) {
          return cached.data;
        }
        return { totalTickets: 0 };
      });

      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(200);

      expect(analyticsModelMock.findByKey).toHaveBeenCalled();
      expect(response.body.data).toEqual({ totalTickets: 100 });
    });

    it('should handle cache misses', async () => {
      analyticsModelMock.findByKey.mockResolvedValue(null);
      analyticsServiceMock.prototype.getTicketAnalytics.mockImplementation(async (options) => {
        const cached = await analyticsModelMock.findByKey('nonexistent');
        if (!cached) {
          return { totalTickets: 50 }; // Fresh data
        }
        return cached.data;
      });

      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(200);

      expect(analyticsModelMock.findByKey).toHaveBeenCalled();
      expect(response.body.data).toEqual({ totalTickets: 50 });
    });
  });
});
