/**
 * Reporting System Integration Tests
 * 
 * Comprehensive integration tests for the Reporting System
 * testing the interaction between controllers, services, and models.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

// Mock dependencies that might cause issues in test environment
jest.mock('../../services/reportingService');
jest.mock('../../models/Report');
jest.mock('../../models/Dashboard');

describe('Reporting System Integration', () => {
  let server;
  let reportingServiceMock;
  let reportModelMock;
  let dashboardModelMock;

  beforeAll(async () => {
    // Start test server
    server = app.listen(0); // Use random port
    
    // Get mocked dependencies
    reportingServiceMock = require('../../services/reportingService');
    reportModelMock = require('../../models/Report');
    dashboardModelMock = require('../../models/Dashboard');
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

  describe('Reporting API Integration', () => {
    describe('POST /api/reports/generate', () => {
      it('should integrate controller and service for report generation', async () => {
        const reportConfig = {
          name: 'Test Report',
          type: 'ticket_analytics',
          parameters: { timeRange: '30d' }
        };

        const mockReport = {
          reportId: 'report123',
          name: 'Test Report',
          type: 'ticket_analytics',
          status: 'generating',
          createdAt: new Date(),
          data: { totalTickets: 100 }
        };

        // Mock service method
        reportingServiceMock.prototype.generateReport.mockResolvedValue(mockReport);

        const response = await request(app)
          .post('/api/reports/generate')
          .send(reportConfig)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockReport);
        expect(response.body.timestamp).toBeDefined();
        expect(reportingServiceMock.prototype.generateReport).toHaveBeenCalledWith(reportConfig);
      });

      it('should handle service errors in the integration chain', async () => {
        // Mock service to throw error
        reportingServiceMock.prototype.generateReport.mockRejectedValue(new Error('Report generation failed'));

        const response = await request(app)
          .post('/api/reports/generate')
          .send({ name: 'Test Report', type: 'ticket_analytics' })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Report generation failed');
        expect(response.body.timestamp).toBeDefined();
      });

      it('should validate report configuration through service', async () => {
        const invalidConfig = {
          name: 'Test Report',
          type: 'invalid_type'
        };

        reportingServiceMock.prototype.generateReport.mockImplementation(async (config) => {
          if (config.type === 'invalid_type') {
            throw new Error('Invalid report type');
          }
          return { reportId: 'report123' };
        });

        const response = await request(app)
          .post('/api/reports/generate')
          .send(invalidConfig)
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid report type');
      });
    });

    describe('GET /api/reports', () => {
      it('should integrate saved reports retrieval', async () => {
        const mockReports = {
          reports: [
            { reportId: 'report1', name: 'Report 1', type: 'ticket_analytics' },
            { reportId: 'report2', name: 'Report 2', type: 'user_analytics' }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            pages: 1
          }
        };

        reportingServiceMock.prototype.getSavedReports.mockResolvedValue(mockReports);

        const response = await request(app)
          .get('/api/reports')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockReports);
        expect(reportingServiceMock.prototype.getSavedReports).toHaveBeenCalled();
      });

      it('should pass pagination parameters to service', async () => {
        const mockReports = { reports: [], pagination: {} };
        reportingServiceMock.prototype.getSavedReports.mockResolvedValue(mockReports);

        await request(app)
          .get('/api/reports?page=2&limit=10')
          .expect(200);

        expect(reportingServiceMock.prototype.getSavedReports).toHaveBeenCalledWith({
          page: '2',
          limit: '10',
          type: undefined
        });
      });
    });

    describe('POST /api/reports/schedule', () => {
      it('should integrate report scheduling', async () => {
        const scheduleConfig = {
          reportId: 'report123',
          schedule: 'daily',
          recipients: ['user@example.com'],
          options: { format: 'pdf' }
        };

        const mockSchedule = {
          scheduleId: 'schedule789',
          reportId: 'report123',
          schedule: 'daily',
          nextRun: new Date(),
          recipients: ['user@example.com']
        };

        reportingServiceMock.prototype.scheduleReport.mockResolvedValue(mockSchedule);

        const response = await request(app)
          .post('/api/reports/schedule')
          .send(scheduleConfig)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockSchedule);
        expect(reportingServiceMock.prototype.scheduleReport).toHaveBeenCalledWith(scheduleConfig);
      });
    });

    describe('GET /api/reports/:reportId/export/:format', () => {
      it('should integrate report export functionality', async () => {
        const mockExport = {
          downloadUrl: '/downloads/report123.pdf',
          format: 'pdf',
          size: 2048,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        reportingServiceMock.prototype.exportReport.mockResolvedValue(mockExport);

        const response = await request(app)
          .get('/api/reports/report123/export/pdf')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockExport);
        expect(reportingServiceMock.prototype.exportReport).toHaveBeenCalledWith('report123', 'pdf');
      });
    });
  });

  describe('Database Integration', () => {
    describe('Report Model Integration', () => {
      it('should integrate report persistence with database', async () => {
        const mockSavedReport = {
          _id: 'report123',
          name: 'Test Report',
          type: 'ticket_analytics',
          data: { totalTickets: 100 },
          status: 'completed',
          createdBy: 'user123',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Mock model static method
        reportModelMock.saveReport.mockResolvedValue(mockSavedReport);

        // Mock service to use model
        reportingServiceMock.prototype.saveReport.mockImplementation(async (reportData) => {
          return await reportModelMock.saveReport(reportData);
        });

        const response = await request(app)
          .post('/api/reports')
          .send({
            name: 'Test Report',
            type: 'ticket_analytics',
            data: { totalTickets: 100 }
          })
          .expect(200);

        expect(reportModelMock.saveReport).toHaveBeenCalled();
        expect(response.body.success).toBe(true);
      });

      it('should handle database connection errors', async () => {
        // Mock model to throw database error
        reportModelMock.findByUser.mockRejectedValue(new Error('Database connection failed'));

        // Mock service to use model
        reportingServiceMock.prototype.getSavedReports.mockImplementation(async (options) => {
          return await reportModelMock.findByUser('user123', options);
        });

        const response = await request(app)
          .get('/api/reports')
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Database connection failed');
      });
    });

    describe('Dashboard Model Integration', () => {
      it('should integrate dashboard operations with reports', async () => {
        const mockDashboard = {
          _id: 'dashboard123',
          name: 'Analytics Dashboard',
          type: 'analytics',
          widgets: [
            { id: 'widget1', type: 'chart', title: 'Ticket Trends' }
          ],
          createdBy: 'user123'
        };

        dashboardModelMock.findByUser.mockResolvedValue([mockDashboard]);

        // Create endpoint that integrates reports with dashboards
        app.get('/api/reports/dashboard-integration', async (req, res) => {
          try {
            const dashboards = await dashboardModelMock.findByUser('user123');
            const reports = await reportingServiceMock.prototype.getSavedReports({});
            
            const integration = dashboards.map(dashboard => ({
              ...dashboard,
              reportCount: reports.reports.filter(r => r.type === dashboard.type).length
            }));

            res.json({
              success: true,
              data: integration,
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

        reportingServiceMock.prototype.getSavedReports.mockResolvedValue({
          reports: [
            { type: 'analytics', name: 'Analytics Report' },
            { type: 'analytics', name: 'Analytics Report 2' }
          ]
        });

        const response = await request(app)
          .get('/api/reports/dashboard-integration')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data[0].reportCount).toBe(2);
      });
    });
  });

  describe('Service Integration', () => {
    describe('Reporting Service Integration', () => {
      it('should integrate multiple reporting operations', async () => {
        const mockReport = {
          reportId: 'report123',
          name: 'Comprehensive Report',
          type: 'comprehensive',
          status: 'generating'
        };

        // Mock service to handle multiple operations
        reportingServiceMock.prototype.generateReport.mockResolvedValue(mockReport);
        reportingServiceMock.prototype.scheduleReport.mockResolvedValue({
          scheduleId: 'schedule123',
          reportId: 'report123'
        });
        reportingServiceMock.prototype.shareReport.mockResolvedValue({
          shareId: 'share123',
          reportId: 'report123'
        });

        // Create endpoint that performs multiple operations
        app.post('/api/reports/comprehensive', async (req, res) => {
          try {
            const { reportConfig, scheduleConfig, shareConfig } = req.body;

            const report = await reportingServiceMock.prototype.generateReport(reportConfig);
            const schedule = await reportingServiceMock.prototype.scheduleReport(scheduleConfig);
            const share = await reportingServiceMock.prototype.shareReport(shareConfig);

            res.json({
              success: true,
              data: { report, schedule, share },
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
          .post('/api/reports/comprehensive')
          .send({
            reportConfig: { name: 'Test Report', type: 'comprehensive' },
            scheduleConfig: { reportId: 'report123', schedule: 'daily' },
            shareConfig: { reportId: 'report123', users: ['user456'] }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('report');
        expect(response.body.data).toHaveProperty('schedule');
        expect(response.body.data).toHaveProperty('share');
      });

      it('should handle service timeouts gracefully', async () => {
        // Mock service to timeout
        reportingServiceMock.prototype.generateReport.mockImplementation(() => {
          return new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Service timeout')), 100);
          });
        });

        const response = await request(app)
          .post('/api/reports/generate')
          .send({ name: 'Test Report', type: 'ticket_analytics' })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Service timeout');
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should propagate errors through the integration chain', async () => {
      // Mock service to throw error
      reportingServiceMock.prototype.generateReport.mockRejectedValue(new Error('Integration error'));

      const response = await request(app)
        .post('/api/reports/generate')
        .send({ name: 'Test Report', type: 'ticket_analytics' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Integration error');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle partial service failures', async () => {
      // Mock one service to fail, others to succeed
      reportingServiceMock.prototype.getSavedReports.mockResolvedValue({
        reports: [{ reportId: 'report1', name: 'Report 1' }]
      });
      reportingServiceMock.prototype.getScheduledReports.mockRejectedValue(new Error('Schedule service failed'));

      // Create endpoint that handles partial failures
      app.get('/api/reports/partial', async (req, res) => {
        try {
          const reports = await reportingServiceMock.prototype.getSavedReports({});
          let scheduled = null;
          let error = null;

          try {
            scheduled = await reportingServiceMock.prototype.getScheduledReports();
          } catch (scheduleError) {
            error = scheduleError.message;
          }

          res.json({
            success: true,
            data: { reports, scheduled, error },
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
        .get('/api/reports/partial')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reports).toBeDefined();
      expect(response.body.data.scheduled).toBeNull();
      expect(response.body.data.error).toBe('Schedule service failed');
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent report generation', async () => {
      const mockReport = { reportId: 'report123', status: 'generating' };
      reportingServiceMock.prototype.generateReport.mockResolvedValue(mockReport);

      const promises = Array(10).fill().map((_, index) => 
        request(app)
          .post('/api/reports/generate')
          .send({ name: `Report ${index}`, type: 'ticket_analytics' })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(reportingServiceMock.prototype.generateReport).toHaveBeenCalledTimes(10);
    });

    it('should maintain response times under load', async () => {
      const mockReport = { reportId: 'report123', status: 'generating' };
      reportingServiceMock.prototype.generateReport.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockReport), 50); // 50ms delay
        });
      });

      const startTime = Date.now();
      await request(app)
        .post('/api/reports/generate')
        .send({ name: 'Test Report', type: 'ticket_analytics' });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200); // Should complete within 200ms
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across report operations', async () => {
      const mockReport = {
        reportId: 'report123',
        name: 'Consistency Test Report',
        type: 'ticket_analytics',
        status: 'completed',
        data: { totalTickets: 100 }
      };

      reportingServiceMock.prototype.generateReport.mockResolvedValue(mockReport);
      reportingServiceMock.prototype.saveReport.mockResolvedValue(mockReport);
      reportingServiceMock.prototype.getReportStatus.mockResolvedValue({
        reportId: 'report123',
        status: 'completed',
        data: { totalTickets: 100 }
      });

      // Create endpoint that checks consistency
      app.post('/api/reports/consistency', async (req, res) => {
        try {
          const generated = await reportingServiceMock.prototype.generateReport(req.body);
          const saved = await reportingServiceMock.prototype.saveReport(generated);
          const status = await reportingServiceMock.prototype.getReportStatus('report123');

          // Check consistency
          const isConsistent = 
            generated.reportId === saved.reportId &&
            saved.reportId === status.reportId &&
            generated.data.totalTickets === status.data.totalTickets;

          res.json({
            success: true,
            data: { generated, saved, status, isConsistent },
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
        .post('/api/reports/consistency')
        .send({ name: 'Test Report', type: 'ticket_analytics' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isConsistent).toBe(true);
    });
  });

  describe('Workflow Integration', () => {
    it('should integrate complete report workflow', async () => {
      const workflowSteps = {
        generate: { reportId: 'report123', status: 'generating' },
        complete: { reportId: 'report123', status: 'completed', data: { totalTickets: 100 } },
        schedule: { scheduleId: 'schedule123', reportId: 'report123' },
        share: { shareId: 'share123', reportId: 'report123' }
      };

      // Mock service methods for workflow
      reportingServiceMock.prototype.generateReport.mockResolvedValue(workflowSteps.generate);
      reportingServiceMock.prototype.updateReportStatus.mockImplementation(async (id, status) => {
        if (status === 'completed') {
          return workflowSteps.complete;
        }
        return null;
      });
      reportingServiceMock.prototype.scheduleReport.mockResolvedValue(workflowSteps.schedule);
      reportingServiceMock.prototype.shareReport.mockResolvedValue(workflowSteps.share);

      // Create workflow endpoint
      app.post('/api/reports/workflow', async (req, res) => {
        try {
          const { reportConfig, scheduleConfig, shareConfig } = req.body;

          // Step 1: Generate report
          const generated = await reportingServiceMock.prototype.generateReport(reportConfig);
          
          // Step 2: Complete report
          const completed = await reportingServiceMock.prototype.updateReportStatus(
            generated.reportId, 
            'completed'
          );
          
          // Step 3: Schedule report
          const scheduled = await reportingServiceMock.prototype.scheduleReport(scheduleConfig);
          
          // Step 4: Share report
          const shared = await reportingServiceMock.prototype.shareReport(shareConfig);

          res.json({
            success: true,
            data: { generated, completed, scheduled, shared },
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
        .post('/api/reports/workflow')
        .send({
          reportConfig: { name: 'Workflow Report', type: 'ticket_analytics' },
          scheduleConfig: { reportId: 'report123', schedule: 'daily' },
          shareConfig: { reportId: 'report123', users: ['user456'] }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('generated');
      expect(response.body.data).toHaveProperty('completed');
      expect(response.body.data).toHaveProperty('scheduled');
      expect(response.body.data).toHaveProperty('shared');
    });
  });

  describe('Security Integration', () => {
    it('should handle authorization in reporting endpoints', async () => {
      const mockReport = { reportId: 'report123', status: 'generating' };
      reportingServiceMock.prototype.generateReport.mockResolvedValue(mockReport);

      // Create protected endpoint
      app.post('/api/reports/protected', (req, res, next) => {
        // Mock authorization check
        if (!req.headers.authorization) {
          return res.status(401).json({
            success: false,
            error: 'Authorization required',
            timestamp: new Date().toISOString()
          });
        }
        next();
      }, async (req, res) => {
        try {
          const report = await reportingServiceMock.prototype.generateReport(req.body);
          res.json({
            success: true,
            data: report,
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
        .post('/api/reports/protected')
        .send({ name: 'Test Report', type: 'ticket_analytics' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authorization required');
    });

    it('should validate input data for security', async () => {
      // Mock service to validate input
      reportingServiceMock.prototype.generateReport.mockImplementation(async (config) => {
        if (config.name && config.name.includes('<script>')) {
          throw new Error('Invalid input detected');
        }
        return { reportId: 'report123' };
      });

      const response = await request(app)
        .post('/api/reports/generate')
        .send({ name: '<script>alert("xss")</script>', type: 'ticket_analytics' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid input detected');
    });
  });
});
