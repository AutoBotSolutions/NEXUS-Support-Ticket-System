/**
 * Reporting Routes Unit Tests
 * 
 * Comprehensive unit tests for the Reporting routes
 * covering all endpoints and error handling.
 */

const request = require('supertest');
const express = require('express');
const ReportingController = require('../../../controllers/reportingController');

// Mock the controller
jest.mock('../../../controllers/reportingController');

describe('Reporting Routes', () => {
  let app;
  let mockController;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Mock controller
    mockController = {
      generateReport: jest.fn(),
      getReportTemplates: jest.fn(),
      getSavedReports: jest.fn(),
      saveReport: jest.fn(),
      deleteReport: jest.fn(),
      scheduleReport: jest.fn(),
      getScheduledReports: jest.fn(),
      cancelScheduledReport: jest.fn(),
      exportReport: jest.fn(),
      shareReport: jest.fn(),
      getReportHistory: jest.fn(),
      getReportStatus: jest.fn(),
      createReportTemplate: jest.fn(),
      updateReportTemplate: jest.fn(),
      deleteReportTemplate: jest.fn()
    };

    // Mock ReportingController constructor
    ReportingController.mockImplementation(() => mockController);

    // Import and use routes
    const reportingRoutes = require('../../../routes/reportingRoutes');
    app.use('/api/reports', reportingRoutes);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/reports/templates', () => {
    it('should return report templates', async () => {
      const mockTemplates = [
        { id: 'ticket_summary', name: 'Ticket Summary', type: 'analytics' },
        { id: 'user_activity', name: 'User Activity', type: 'analytics' }
      ];

      mockController.getReportTemplates.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockTemplates,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTemplates);
      expect(response.body.timestamp).toBeDefined();
      expect(mockController.getReportTemplates).toHaveBeenCalled();
    });

    it('should handle template retrieval errors', async () => {
      mockController.getReportTemplates.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: 'Template error',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports/templates')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Template error');
    });
  });

  describe('POST /api/reports/generate', () => {
    it('should generate a new report', async () => {
      const reportConfig = {
        name: 'Test Report',
        type: 'ticket_analytics',
        parameters: { timeRange: '30d' }
      };

      const mockReport = {
        reportId: 'report123',
        name: 'Test Report',
        type: 'ticket_analytics',
        status: 'generating'
      };

      mockController.generateReport.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockReport,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/generate')
        .send(reportConfig)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReport);
      expect(mockController.generateReport).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      mockController.generateReport.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Report type and name are required',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/generate')
        .send({ name: 'Test Report' }) // Missing type
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Report type and name are required');
    });

    it('should handle generation errors', async () => {
      mockController.generateReport.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: 'Generation failed',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/generate')
        .send({ name: 'Test Report', type: 'ticket_analytics' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Generation failed');
    });
  });

  describe('GET /api/reports', () => {
    it('should return saved reports', async () => {
      const mockReports = {
        reports: [
          { id: 'report1', name: 'Report 1' },
          { id: 'report2', name: 'Report 2' }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          pages: 3
        }
      };

      mockController.getSavedReports.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockReports,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReports);
      expect(mockController.getSavedReports).toHaveBeenCalled();
    });

    it('should handle pagination parameters', async () => {
      mockController.getSavedReports.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: { reports: [], pagination: {} },
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports?page=2&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockController.getSavedReports).toHaveBeenCalled();
    });
  });

  describe('POST /api/reports', () => {
    it('should save a report configuration', async () => {
      const reportData = {
        name: 'Saved Report',
        type: 'user_analytics',
        parameters: { timeRange: '7d' }
      };

      const mockSavedReport = {
        reportId: 'report456',
        name: 'Saved Report',
        createdAt: new Date()
      };

      mockController.saveReport.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockSavedReport,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSavedReport);
      expect(mockController.saveReport).toHaveBeenCalled();
    });

    it('should validate report data', async () => {
      mockController.saveReport.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Report name and type are required',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports')
        .send({ name: 'Report' }) // Missing type
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Report name and type are required');
    });
  });

  describe('DELETE /api/reports/:reportId', () => {
    it('should delete a saved report', async () => {
      mockController.deleteReport.mockImplementation((req, res) => {
        res.json({
          success: true,
          message: 'Report deleted successfully',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .delete('/api/reports/report123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Report deleted successfully');
      expect(mockController.deleteReport).toHaveBeenCalled();
    });

    it('should handle missing report ID', async () => {
      mockController.deleteReport.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Report ID is required',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .delete('/api/reports/')
        .expect(404); // Express will return 404 for missing parameter
    });

    it('should handle report not found', async () => {
      mockController.deleteReport.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          error: 'Report not found',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .delete('/api/reports/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Report not found');
    });
  });

  describe('POST /api/reports/schedule', () => {
    it('should schedule a report', async () => {
      const scheduleData = {
        reportId: 'report123',
        schedule: 'daily',
        recipients: ['user@example.com'],
        options: { format: 'pdf' }
      };

      const mockSchedule = {
        scheduleId: 'schedule789',
        reportId: 'report123',
        schedule: 'daily',
        nextRun: new Date()
      };

      mockController.scheduleReport.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockSchedule,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/schedule')
        .send(scheduleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSchedule);
      expect(mockController.scheduleReport).toHaveBeenCalled();
    });

    it('should validate schedule data', async () => {
      mockController.scheduleReport.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Report ID and schedule are required',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/schedule')
        .send({ reportId: 'report123' }) // Missing schedule
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Report ID and schedule are required');
    });
  });

  describe('GET /api/reports/scheduled', () => {
    it('should return scheduled reports', async () => {
      const mockScheduledReports = [
        { scheduleId: 'schedule1', reportId: 'report1', schedule: 'daily' },
        { scheduleId: 'schedule2', reportId: 'report2', schedule: 'weekly' }
      ];

      mockController.getScheduledReports.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockScheduledReports,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports/scheduled')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockScheduledReports);
      expect(mockController.getScheduledReports).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/reports/scheduled/:scheduleId', () => {
    it('should cancel a scheduled report', async () => {
      mockController.cancelScheduledReport.mockImplementation((req, res) => {
        res.json({
          success: true,
          message: 'Scheduled report cancelled successfully',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .delete('/api/reports/scheduled/schedule123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Scheduled report cancelled successfully');
      expect(mockController.cancelScheduledReport).toHaveBeenCalled();
    });

    it('should handle missing schedule ID', async () => {
      const response = await request(app)
        .delete('/api/reports/scheduled/')
        .expect(404); // Express will return 404 for missing parameter
    });
  });

  describe('GET /api/reports/:reportId/export/:format', () => {
    it('should export a report', async () => {
      const mockExport = {
        downloadUrl: '/downloads/report123.pdf',
        format: 'pdf',
        size: 2048
      };

      mockController.exportReport.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockExport,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports/report123/export/pdf')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockExport);
      expect(mockController.exportReport).toHaveBeenCalled();
    });

    it('should validate export format', async () => {
      mockController.exportReport.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Invalid export format',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports/report123/export/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid export format');
    });
  });

  describe('POST /api/reports/:reportId/share', () => {
    it('should share a report', async () => {
      const shareData = {
        users: ['user456', 'user789'],
        permissions: ['view', 'export'],
        expiresAt: '2023-12-31'
      };

      const mockShare = {
        shareId: 'share123',
        sharedWith: ['user456', 'user789'],
        expiresAt: new Date('2023-12-31')
      };

      mockController.shareReport.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockShare,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/report123/share')
        .send(shareData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockShare);
      expect(mockController.shareReport).toHaveBeenCalled();
    });

    it('should validate share data', async () => {
      mockController.shareReport.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Users and permissions are required',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/report123/share')
        .send({ users: [] }) // Missing permissions
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Users and permissions are required');
    });
  });

  describe('GET /api/reports/:reportId/history', () => {
    it('should return report history', async () => {
      const mockHistory = [
        { executionId: 'exec1', reportId: 'report123', status: 'completed' },
        { executionId: 'exec2', reportId: 'report123', status: 'failed' }
      ];

      mockController.getReportHistory.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockHistory,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports/report123/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockHistory);
      expect(mockController.getReportHistory).toHaveBeenCalled();
    });
  });

  describe('GET /api/reports/:reportId/status', () => {
    it('should return report status', async () => {
      const mockStatus = {
        reportId: 'report123',
        status: 'generating',
        progress: 45,
        estimatedCompletion: new Date()
      };

      mockController.getReportStatus.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockStatus,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports/report123/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStatus);
      expect(mockController.getReportStatus).toHaveBeenCalled();
    });
  });

  describe('POST /api/reports/templates', () => {
    it('should create a new report template', async () => {
      const templateData = {
        name: 'Custom Template',
        type: 'custom',
        configuration: { fields: ['name', 'date'] }
      };

      const mockTemplate = {
        templateId: 'template123',
        name: 'Custom Template',
        type: 'custom',
        createdAt: new Date()
      };

      mockController.createReportTemplate.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockTemplate,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/templates')
        .send(templateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTemplate);
      expect(mockController.createReportTemplate).toHaveBeenCalled();
    });

    it('should validate template data', async () => {
      mockController.createReportTemplate.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Template name and type are required',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/templates')
        .send({ name: 'Template' }) // Missing type
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Template name and type are required');
    });
  });

  describe('PUT /api/reports/templates/:templateId', () => {
    it('should update a report template', async () => {
      const updateData = {
        name: 'Updated Template',
        configuration: { fields: ['name', 'date', 'status'] }
      };

      const mockUpdatedTemplate = {
        templateId: 'template123',
        name: 'Updated Template',
        updatedAt: new Date()
      };

      mockController.updateReportTemplate.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: mockUpdatedTemplate,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .put('/api/reports/templates/template123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpdatedTemplate);
      expect(mockController.updateReportTemplate).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/reports/templates/:templateId', () => {
    it('should delete a report template', async () => {
      mockController.deleteReportTemplate.mockImplementation((req, res) => {
        res.json({
          success: true,
          message: 'Template deleted successfully',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .delete('/api/reports/templates/template123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Template deleted successfully');
      expect(mockController.deleteReportTemplate).toHaveBeenCalled();
    });

    it('should handle template not found', async () => {
      mockController.deleteReportTemplate.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          error: 'Template not found',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .delete('/api/reports/templates/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Template not found');
    });
  });

  describe('GET /api/reports/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/reports/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/reports/metrics', () => {
    it('should return service metrics', async () => {
      const response = await request(app)
        .get('/api/reports/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/reports/nonexistent')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .send('invalid-json')
        .expect(400);
    });

    it('should handle empty requests', async () => {
      mockController.getReportTemplates.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: [],
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports/templates')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Response Format', () => {
    it('should return consistent response format for success', async () => {
      mockController.getReportTemplates.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: [{ id: 'template1' }],
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports/templates')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return consistent response format for errors', async () => {
      mockController.getReportTemplates.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: 'Service error',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/reports/templates')
        .expect(500);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      mockController.getReportTemplates.mockImplementation((req, res) => {
        setTimeout(() => {
          res.json({
            success: true,
            data: [{ id: 'template1' }],
            timestamp: new Date().toISOString()
          });
        }, 10);
      });

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/reports/templates')
        .expect(200);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
      expect(response.body.success).toBe(true);
    });

    it('should handle concurrent requests', async () => {
      mockController.getReportTemplates.mockImplementation((req, res) => {
        res.json({
          success: true,
          data: [{ id: 'template1' }],
          timestamp: new Date().toISOString()
        });
      });

      const promises = Array(10).fill().map(() => 
        request(app).get('/api/reports/templates')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(mockController.getReportTemplates).toHaveBeenCalledTimes(10);
    });
  });

  describe('Security', () => {
    it('should handle large requests gracefully', async () => {
      const largeData = 'a'.repeat(1000000); // 1MB of data
      
      mockController.generateReport.mockImplementation((req, res) => {
        res.status(413).json({
          success: false,
          error: 'Request entity too large',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/generate')
        .send({ data: largeData })
        .expect(413);

      expect(response.body.error).toBe('Request entity too large');
    });

    it('should validate input parameters', async () => {
      mockController.generateReport.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          error: 'Invalid input parameters',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/api/reports/generate')
        .send({ name: '<script>alert("xss")</script>', type: 'ticket_analytics' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
