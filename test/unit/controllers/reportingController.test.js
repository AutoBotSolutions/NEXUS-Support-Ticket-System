/**
 * Reporting Controller Unit Tests
 * 
 * Comprehensive unit tests for the Reporting Controller
 * covering all methods and edge cases.
 */

const ReportingController = require('../../../controllers/reportingController');
const ReportingService = require('../../../services/reportingService');

// Mock dependencies
jest.mock('../../../services/reportingService');

describe('ReportingController', () => {
  let reportingController;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    reportingController = new ReportingController();
    mockReq = {
      query: {},
      body: {},
      params: {},
      user: { _id: 'user123', role: 'admin' }
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate a report successfully', async () => {
      const reportConfig = {
        name: 'Test Report',
        type: 'ticket_analytics',
        parameters: { timeRange: '30d' }
      };

      mockReq.body = reportConfig;

      const mockReport = {
        reportId: 'report123',
        name: 'Test Report',
        type: 'ticket_analytics',
        status: 'generating',
        createdAt: new Date()
      };

      ReportingService.prototype.generateReport.mockResolvedValue(mockReport);

      await reportingController.generateReport(mockReq, mockRes);

      expect(ReportingService.prototype.generateReport).toHaveBeenCalledWith(reportConfig);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockReport,
        timestamp: expect.any(String)
      });
    });

    it('should validate required fields', async () => {
      mockReq.body = { name: 'Test Report' }; // Missing type

      await reportingController.generateReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Report type and name are required',
        timestamp: expect.any(String)
      });
    });

    it('should handle service errors', async () => {
      mockReq.body = {
        name: 'Test Report',
        type: 'ticket_analytics'
      };

      ReportingService.prototype.generateReport.mockRejectedValue(new Error('Generation failed'));

      await reportingController.generateReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Generation failed',
        timestamp: expect.any(String)
      });
    });
  });

  describe('getReportTemplates', () => {
    it('should return available report templates', async () => {
      const mockTemplates = [
        { id: 'ticket_summary', name: 'Ticket Summary', type: 'analytics' },
        { id: 'user_activity', name: 'User Activity', type: 'analytics' }
      ];

      ReportingService.prototype.getReportTemplates.mockResolvedValue(mockTemplates);

      await reportingController.getReportTemplates(mockReq, mockRes);

      expect(ReportingService.prototype.getReportTemplates).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTemplates,
        timestamp: expect.any(String)
      });
    });

    it('should handle template retrieval errors', async () => {
      ReportingService.prototype.getReportTemplates.mockRejectedValue(new Error('Template error'));

      await reportingController.getReportTemplates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Template error',
        timestamp: expect.any(String)
      });
    });
  });

  describe('getSavedReports', () => {
    it('should return saved reports with pagination', async () => {
      mockReq.query = { page: 1, limit: 20 };

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

      ReportingService.prototype.getSavedReports.mockResolvedValue(mockReports);

      await reportingController.getSavedReports(mockReq, mockRes);

      expect(ReportingService.prototype.getSavedReports).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        type: undefined
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockReports,
        timestamp: expect.any(String)
      });
    });

    it('should handle type filter', async () => {
      mockReq.query = { type: 'ticket_analytics' };

      const mockReports = { reports: [], pagination: {} };
      ReportingService.prototype.getSavedReports.mockResolvedValue(mockReports);

      await reportingController.getSavedReports(mockReq, mockRes);

      expect(ReportingService.prototype.getSavedReports).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        type: 'ticket_analytics'
      });
    });
  });

  describe('saveReport', () => {
    it('should save a report configuration', async () => {
      const reportData = {
        name: 'Saved Report',
        type: 'user_analytics',
        parameters: { timeRange: '7d' }
      };

      mockReq.body = reportData;

      const mockSavedReport = {
        reportId: 'report456',
        name: 'Saved Report',
        createdAt: new Date()
      };

      ReportingService.prototype.saveReport.mockResolvedValue(mockSavedReport);

      await reportingController.saveReport(mockReq, mockRes);

      expect(ReportingService.prototype.saveReport).toHaveBeenCalledWith(reportData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSavedReport,
        timestamp: expect.any(String)
      });
    });

    it('should validate report data', async () => {
      mockReq.body = { name: 'Report' }; // Missing type

      await reportingController.saveReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Report name and type are required',
        timestamp: expect.any(String)
      });
    });
  });

  describe('deleteReport', () => {
    it('should delete a saved report', async () => {
      mockReq.params = { reportId: 'report123' };

      ReportingService.prototype.deleteReport.mockResolvedValue(true);

      await reportingController.deleteReport(mockReq, mockRes);

      expect(ReportingService.prototype.deleteReport).toHaveBeenCalledWith('report123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Report deleted successfully',
        timestamp: expect.any(String)
      });
    });

    it('should handle missing report ID', async () => {
      mockReq.params = {};

      await reportingController.deleteReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Report ID is required',
        timestamp: expect.any(String)
      });
    });

    it('should handle report not found', async () => {
      mockReq.params = { reportId: 'nonexistent' };

      ReportingService.prototype.deleteReport.mockRejectedValue(new Error('Report not found'));

      await reportingController.deleteReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Report not found',
        timestamp: expect.any(String)
      });
    });
  });

  describe('scheduleReport', () => {
    it('should schedule a report successfully', async () => {
      const scheduleData = {
        reportId: 'report123',
        schedule: 'daily',
        recipients: ['user@example.com'],
        options: { format: 'pdf' }
      };

      mockReq.body = scheduleData;

      const mockSchedule = {
        scheduleId: 'schedule789',
        reportId: 'report123',
        schedule: 'daily',
        nextRun: new Date()
      };

      ReportingService.prototype.scheduleReport.mockResolvedValue(mockSchedule);

      await reportingController.scheduleReport(mockReq, mockRes);

      expect(ReportingService.prototype.scheduleReport).toHaveBeenCalledWith(scheduleData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSchedule,
        timestamp: expect.any(String)
      });
    });

    it('should validate schedule data', async () => {
      mockReq.body = { reportId: 'report123' }; // Missing schedule

      await reportingController.scheduleReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Report ID and schedule are required',
        timestamp: expect.any(String)
      });
    });
  });

  describe('getScheduledReports', () => {
    it('should return scheduled reports', async () => {
      const mockScheduledReports = [
        { scheduleId: 'schedule1', reportId: 'report1', schedule: 'daily' },
        { scheduleId: 'schedule2', reportId: 'report2', schedule: 'weekly' }
      ];

      ReportingService.prototype.getScheduledReports.mockResolvedValue(mockScheduledReports);

      await reportingController.getScheduledReports(mockReq, mockRes);

      expect(ReportingService.prototype.getScheduledReports).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockScheduledReports,
        timestamp: expect.any(String)
      });
    });
  });

  describe('cancelScheduledReport', () => {
    it('should cancel a scheduled report', async () => {
      mockReq.params = { scheduleId: 'schedule123' };

      ReportingService.prototype.cancelScheduledReport.mockResolvedValue(true);

      await reportingController.cancelScheduledReport(mockReq, mockRes);

      expect(ReportingService.prototype.cancelScheduledReport).toHaveBeenCalledWith('schedule123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Scheduled report cancelled successfully',
        timestamp: expect.any(String)
      });
    });

    it('should handle missing schedule ID', async () => {
      mockReq.params = {};

      await reportingController.cancelScheduledReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Schedule ID is required',
        timestamp: expect.any(String)
      });
    });
  });

  describe('exportReport', () => {
    it('should export a report in specified format', async () => {
      mockReq.params = { reportId: 'report123', format: 'pdf' };

      const mockExport = {
        downloadUrl: '/downloads/report123.pdf',
        format: 'pdf',
        size: 2048
      };

      ReportingService.prototype.exportReport.mockResolvedValue(mockExport);

      await reportingController.exportReport(mockReq, mockRes);

      expect(ReportingService.prototype.exportReport).toHaveBeenCalledWith('report123', 'pdf');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockExport,
        timestamp: expect.any(String)
      });
    });

    it('should validate export format', async () => {
      mockReq.params = { reportId: 'report123', format: 'invalid' };

      await reportingController.exportReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid export format',
        timestamp: expect.any(String)
      });
    });
  });

  describe('shareReport', () => {
    it('should share a report with users', async () => {
      mockReq.params = { reportId: 'report123' };
      mockReq.body = {
        users: ['user456', 'user789'],
        permissions: ['view', 'export'],
        expiresAt: '2023-12-31'
      };

      const mockShare = {
        shareId: 'share123',
        sharedWith: ['user456', 'user789'],
        expiresAt: new Date('2023-12-31')
      };

      ReportingService.prototype.shareReport.mockResolvedValue(mockShare);

      await reportingController.shareReport(mockReq, mockRes);

      expect(ReportingService.prototype.shareReport).toHaveBeenCalledWith('report123', {
        users: ['user456', 'user789'],
        permissions: ['view', 'export'],
        expiresAt: '2023-12-31'
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockShare,
        timestamp: expect.any(String)
      });
    });

    it('should validate share data', async () => {
      mockReq.params = { reportId: 'report123' };
      mockReq.body = { users: [] }; // Missing permissions

      await reportingController.shareReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Users and permissions are required',
        timestamp: expect.any(String)
      });
    });
  });

  describe('getReportHistory', () => {
    it('should return report history', async () => {
      mockReq.params = { reportId: 'report123' };

      const mockHistory = [
        { executionId: 'exec1', reportId: 'report123', status: 'completed' },
        { executionId: 'exec2', reportId: 'report123', status: 'failed' }
      ];

      ReportingService.prototype.getReportHistory.mockResolvedValue(mockHistory);

      await reportingController.getReportHistory(mockReq, mockRes);

      expect(ReportingService.prototype.getReportHistory).toHaveBeenCalledWith('report123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
        timestamp: expect.any(String)
      });
    });
  });

  describe('getReportStatus', () => {
    it('should return report status', async () => {
      mockReq.params = { reportId: 'report123' };

      const mockStatus = {
        reportId: 'report123',
        status: 'generating',
        progress: 45,
        estimatedCompletion: new Date()
      };

      ReportingService.prototype.getReportStatus.mockResolvedValue(mockStatus);

      await reportingController.getReportStatus(mockReq, mockRes);

      expect(ReportingService.prototype.getReportStatus).toHaveBeenCalledWith('report123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatus,
        timestamp: expect.any(String)
      });
    });
  });

  describe('createReportTemplate', () => {
    it('should create a new report template', async () => {
      const templateData = {
        name: 'Custom Template',
        type: 'custom',
        configuration: { fields: ['name', 'date'] }
      };

      mockReq.body = templateData;

      const mockTemplate = {
        templateId: 'template123',
        name: 'Custom Template',
        type: 'custom',
        createdAt: new Date()
      };

      ReportingService.prototype.createReportTemplate.mockResolvedValue(mockTemplate);

      await reportingController.createReportTemplate(mockReq, mockRes);

      expect(ReportingService.prototype.createReportTemplate).toHaveBeenCalledWith(templateData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTemplate,
        timestamp: expect.any(String)
      });
    });

    it('should validate template data', async () => {
      mockReq.body = { name: 'Template' }; // Missing type

      await reportingController.createReportTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Template name and type are required',
        timestamp: expect.any(String)
      });
    });
  });

  describe('updateReportTemplate', () => {
    it('should update a report template', async () => {
      mockReq.params = { templateId: 'template123' };
      mockReq.body = {
        name: 'Updated Template',
        configuration: { fields: ['name', 'date', 'status'] }
      };

      const mockUpdatedTemplate = {
        templateId: 'template123',
        name: 'Updated Template',
        updatedAt: new Date()
      };

      ReportingService.prototype.updateReportTemplate.mockResolvedValue(mockUpdatedTemplate);

      await reportingController.updateReportTemplate(mockReq, mockRes);

      expect(ReportingService.prototype.updateReportTemplate).toHaveBeenCalledWith('template123', {
        name: 'Updated Template',
        configuration: { fields: ['name', 'date', 'status'] }
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedTemplate,
        timestamp: expect.any(String)
      });
    });
  });

  describe('deleteReportTemplate', () => {
    it('should delete a report template', async () => {
      mockReq.params = { templateId: 'template123' };

      ReportingService.prototype.deleteReportTemplate.mockResolvedValue(true);

      await reportingController.deleteReportTemplate(mockReq, mockRes);

      expect(ReportingService.prototype.deleteReportTemplate).toHaveBeenCalledWith('template123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Template deleted successfully',
        timestamp: expect.any(String)
      });
    });

    it('should handle template not found', async () => {
      mockReq.params = { templateId: 'nonexistent' };

      ReportingService.prototype.deleteReportTemplate.mockRejectedValue(new Error('Template not found'));

      await reportingController.deleteReportTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Template not found',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle missing user authentication', async () => {
      delete mockReq.user;

      await reportingController.generateReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        timestamp: expect.any(String)
      });
    });

    it('should handle invalid JSON in request body', async () => {
      mockReq.body = 'invalid-json';

      // Mock JSON.parse to throw error
      const originalParse = JSON.parse;
      JSON.parse = jest.fn().mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      await reportingController.saveReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid JSON in request body',
        timestamp: expect.any(String)
      });

      // Restore original JSON.parse
      JSON.parse = originalParse;
    });

    it('should handle service timeouts', async () => {
      mockReq.body = {
        name: 'Test Report',
        type: 'ticket_analytics'
      };

      ReportingService.prototype.generateReport.mockRejectedValue(new Error('Service timeout'));

      await reportingController.generateReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(504);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service timeout',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      mockReq.body = {
        name: 'Test Report',
        type: 'ticket_analytics'
      };

      const mockReport = { reportId: 'report123' };
      ReportingService.prototype.generateReport.mockResolvedValue(mockReport);

      const startTime = Date.now();
      await reportingController.generateReport(mockReq, mockRes);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should respond within 100ms
    });

    it('should handle concurrent requests', async () => {
      mockReq.body = {
        name: 'Test Report',
        type: 'ticket_analytics'
      };

      const mockReport = { reportId: 'report123' };
      ReportingService.prototype.generateReport.mockResolvedValue(mockReport);

      const promises = Array(10).fill().map(() => 
        reportingController.generateReport(mockReq, mockRes)
      );

      await Promise.all(promises);

      expect(ReportingService.prototype.generateReport).toHaveBeenCalledTimes(10);
    });
  });
});
