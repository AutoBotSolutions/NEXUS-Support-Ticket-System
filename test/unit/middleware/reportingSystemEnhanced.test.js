/**
 * Enhanced Reporting System Tests
 * Comprehensive test suite for the enhanced reporting system
 */

const {
  EnhancedReportingSystem,
  generateReport,
  getAvailableTemplates,
  getTemplate,
  getReportHistory,
  scheduleReport,
  getScheduledReports,
  createCustomTemplate,
  deleteTemplate,
  deleteScheduledReport,
  clearCache,
  getAdvancedAnalytics
} = require('../../../middleware/reportingSystemEnhanced');

describe('EnhancedReportingSystem', () => {
  let reportingSystem;

  beforeEach(() => {
    reportingSystem = new EnhancedReportingSystem();
  });

  describe('Initialization', () => {
    test('should initialize with default templates', () => {
      const templates = getAvailableTemplates();
      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
      
      const templateIds = templates.map(t => t.id);
      expect(templateIds).toContain('ticket_summary');
      expect(templateIds).toContain('user_analytics');
      expect(templateIds).toContain('system_performance');
      expect(templateIds).toContain('business_kpis');
      expect(templateIds).toContain('team_performance');
    });

    test('should initialize with empty caches and history', () => {
      expect(reportingSystem.reportCache.size).toBe(0);
      expect(reportingSystem.analyticsCache.size).toBe(0);
      expect(reportingSystem.reportHistory.size).toBe(0);
      expect(reportingSystem.scheduledReports.size).toBe(0);
    });
  });

  describe('Template Management', () => {
    test('should get available templates', () => {
      const templates = getAvailableTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('template');
        expect(template.template).toHaveProperty('sections');
      });
    });

    test('should get specific template by ID', () => {
      const template = getTemplate('ticket_summary');
      expect(template).toBeDefined();
      expect(template.id).toBe('ticket_summary');
      expect(template.name).toBe('Ticket Summary Report');
    });

    test('should return undefined for non-existent template', () => {
      const template = getTemplate('non_existent');
      expect(template).toBeUndefined();
    });

    test('should create custom template', async () => {
      const customTemplateData = {
        name: 'Custom Test Report',
        description: 'Test custom template',
        type: 'custom',
        category: 'test',
        format: 'json',
        schedule: 'daily',
        recipients: ['admin'],
        template: {
          sections: [
            {
              title: 'Test Section',
              metrics: ['total_tickets']
            }
          ]
        }
      };

      const template = await createCustomTemplate(customTemplateData);
      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.name).toBe('Custom Test Report');
      expect(template.createdAt).toBeDefined();
    });

    test('should delete template', async () => {
      const customTemplateData = {
        name: 'Template to Delete',
        description: 'Test template for deletion',
        type: 'test',
        category: 'test',
        template: {
          sections: [{ title: 'Test', metrics: ['total_tickets'] }]
        }
      };

      const template = await createCustomTemplate(customTemplateData);
      const deleted = await deleteTemplate(template.id);
      expect(deleted).toBe(true);
      
      const retrieved = getTemplate(template.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Report Generation', () => {
    test('should generate ticket summary report', async () => {
      const report = await generateReport('ticket_summary', {
        timeRange: '7d',
        filters: {},
        format: 'json'
      });

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      
      const reportData = JSON.parse(report);
      expect(reportData).toHaveProperty('template');
      expect(reportData).toHaveProperty('name');
      expect(reportData).toHaveProperty('generatedAt');
      expect(reportData).toHaveProperty('timeRange');
      expect(reportData).toHaveProperty('sections');
      expect(reportData).toHaveProperty('summary');
      
      expect(reportData.template).toBe('ticket_summary');
      expect(reportData.sections).toHaveLength(3);
    });

    test('should generate user analytics report', async () => {
      const report = await generateReport('user_analytics', {
        timeRange: '30d',
        filters: {},
        format: 'json'
      });

      const reportData = JSON.parse(report);
      expect(reportData.template).toBe('user_analytics');
      expect(reportData.sections).toHaveLength(2);
    });

    test('should generate system performance report', async () => {
      const report = await generateReport('system_performance', {
        timeRange: '1d',
        filters: {},
        format: 'json'
      });

      const reportData = JSON.parse(report);
      expect(reportData.template).toBe('system_performance');
      expect(reportData.sections).toHaveLength(2);
    });

    test('should generate business KPI report', async () => {
      const report = await generateReport('business_kpis', {
        timeRange: '30d',
        filters: {},
        format: 'json'
      });

      const reportData = JSON.parse(report);
      expect(reportData.template).toBe('business_kpis');
      expect(reportData.sections).toHaveLength(3);
    });

    test('should generate team performance report', async () => {
      const report = await generateReport('team_performance', {
        timeRange: '7d',
        filters: {},
        format: 'json'
      });

      const reportData = JSON.parse(report);
      expect(reportData.template).toBe('team_performance');
      expect(reportData.sections).toHaveLength(3);
    });

    test('should throw error for non-existent template', async () => {
      await expect(generateReport('non_existent', {}))
        .rejects.toThrow('Report template not found: non_existent');
    });

    test('should use cache for repeated requests', async () => {
      const options = {
        timeRange: '7d',
        filters: {},
        format: 'json'
      };

      const report1 = await generateReport('ticket_summary', options);
      const report2 = await generateReport('ticket_summary', options);

      expect(report1).toBe(report2); // Should return cached result
    });
  });

  describe('Report Formatting', () => {
    test('should format report as JSON', async () => {
      const report = await generateReport('ticket_summary', {
        timeRange: '7d',
        format: 'json'
      });

      expect(report).toBeDefined();
      expect(() => JSON.parse(report)).not.toThrow();
    });

    test('should format report as CSV', async () => {
      const report = await generateReport('ticket_summary', {
        timeRange: '7d',
        format: 'csv'
      });

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report).toContain('Report: Ticket Summary Report');
      expect(report).toContain('Metric,Value,Previous,Trend,Change');
    });

    test('should format report as HTML', async () => {
      const report = await generateReport('ticket_summary', {
        timeRange: '7d',
        format: 'html'
      });

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report).toContain('<!DOCTYPE html>');
      expect(report).toContain('<title>Ticket Summary Report</title>');
    });

    test('should format report as PDF', async () => {
      const report = await generateReport('ticket_summary', {
        timeRange: '7d',
        format: 'pdf'
      });

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      // PDF generation currently returns HTML format
    });
  });

  describe('Report History', () => {
    test('should record report generation in history', async () => {
      await generateReport('ticket_summary', {
        timeRange: '7d',
        format: 'json'
      });

      const history = getReportHistory('ticket_summary');
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      const firstEntry = history[0];
      expect(firstEntry).toHaveProperty('templateId');
      expect(firstEntry).toHaveProperty('generatedAt');
      expect(firstEntry).toHaveProperty('reportSize');
    });

    test('should limit history results', async () => {
      // Generate multiple reports
      for (let i = 0; i < 5; i++) {
        await generateReport('ticket_summary', {
          timeRange: '7d',
          format: 'json'
        });
      }

      const history = getReportHistory('ticket_summary', 3);
      expect(history.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Scheduled Reports', () => {
    test('should schedule report', async () => {
      const scheduledReport = await scheduleReport(
        'ticket_summary',
        'daily',
        ['admin@test.com'],
        { format: 'json' }
      );

      expect(scheduledReport).toBeDefined();
      expect(scheduledReport.id).toBeDefined();
      expect(scheduledReport.templateId).toBe('ticket_summary');
      expect(scheduledReport.schedule).toBe('daily');
      expect(scheduledReport.recipients).toEqual(['admin@test.com']);
      expect(scheduledReport.active).toBe(true);
      expect(scheduledReport.nextRun).toBeDefined();
    });

    test('should get scheduled reports', async () => {
      await scheduleReport('ticket_summary', 'daily', ['admin@test.com']);
      
      const scheduledReports = getScheduledReports();
      expect(Array.isArray(scheduledReports)).toBe(true);
      expect(scheduledReports.length).toBeGreaterThan(0);
    });

    test('should delete scheduled report', async () => {
      const scheduledReport = await scheduleReport('ticket_summary', 'daily', ['admin@test.com']);
      
      const deleted = await deleteScheduledReport(scheduledReport.id);
      expect(deleted).toBe(true);
      
      const remainingReports = getScheduledReports();
      const found = remainingReports.find(r => r.id === scheduledReport.id);
      expect(found).toBeUndefined();
    });
  });

  describe('Advanced Analytics', () => {
    test('should get advanced analytics', async () => {
      const analytics = await getAdvancedAnalytics('30d');
      
      expect(analytics).toBeDefined();
      expect(analytics).toHaveProperty('overview');
      expect(analytics).toHaveProperty('trends');
      expect(analytics).toHaveProperty('predictions');
      expect(analytics).toHaveProperty('insights');
    });

    test('should cache analytics results', async () => {
      const analytics1 = await getAdvancedAnalytics('30d');
      const analytics2 = await getAdvancedAnalytics('30d');
      
      expect(analytics1).toBe(analytics2); // Should return cached result
    });
  });

  describe('Ticket Metrics', () => {
    test('should calculate total tickets', async () => {
      const result = await reportingSystem.getTotalTickets(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('previous');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('change');
      expect(typeof result.value).toBe('number');
    });

    test('should calculate open tickets', async () => {
      const result = await reportingSystem.getOpenTickets(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(typeof result.value).toBe('number');
    });

    test('should calculate resolved tickets', async () => {
      const result = await reportingSystem.getResolvedTickets(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(typeof result.value).toBe('number');
    });

    test('should calculate average resolution time', async () => {
      const result = await reportingSystem.getAvgResolutionTime(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result.unit).toBe('hours');
    });

    test('should calculate resolution rate', async () => {
      const result = await reportingSystem.getResolutionRate(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result.unit).toBe('%');
    });

    test('should calculate daily ticket volume', async () => {
      const result = await reportingSystem.getDailyTicketVolume(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('type');
      expect(result.type).toBe('timeseries');
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('User Metrics', () => {
    test('should calculate total users', async () => {
      const result = await reportingSystem.getTotalUsers(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(typeof result.value).toBe('number');
    });

    test('should calculate active users', async () => {
      const result = await reportingSystem.getActiveUsers(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(typeof result.value).toBe('number');
    });

    test('should calculate new users', async () => {
      const result = await reportingSystem.getNewUsers(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(typeof result.value).toBe('number');
    });

    test('should calculate users by role', async () => {
      const result = await reportingSystem.getUsersByRole(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('type');
      expect(result.type).toBe('distribution');
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('System Performance Metrics', () => {
    test('should calculate uptime', async () => {
      const result = await reportingSystem.getUptime(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result.unit).toBe('%');
      expect(result.value).toBeGreaterThanOrEqual(99);
      expect(result.value).toBeLessThanOrEqual(100);
    });

    test('should calculate response time', async () => {
      const result = await reportingSystem.getResponseTime(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result.unit).toBe('ms');
      expect(typeof result.value).toBe('number');
    });

    test('should calculate error rate', async () => {
      const result = await reportingSystem.getErrorRate(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result.unit).toBe('%');
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThanOrEqual(5);
    });

    test('should calculate CPU usage', async () => {
      const result = await reportingSystem.getCPUUsage(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result.unit).toBe('%');
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThanOrEqual(100);
    });

    test('should calculate memory usage', async () => {
      const result = await reportingSystem.getMemoryUsage(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result.unit).toBe('%');
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThanOrEqual(100);
    });
  });

  describe('Business Intelligence Metrics', () => {
    test('should calculate satisfaction score', async () => {
      const result = await reportingSystem.getSatisfactionScore(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result.value).toBeGreaterThanOrEqual(3.5);
      expect(result.value).toBeLessThanOrEqual(5.0);
    });

    test('should calculate NPS score', async () => {
      const result = await reportingSystem.getNPSScore(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result.value).toBeGreaterThanOrEqual(30);
      expect(result.value).toBeLessThanOrEqual(70);
    });

    test('should calculate feedback rate', async () => {
      const result = await reportingSystem.getFeedbackRate(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result.unit).toBe('%');
      expect(result.value).toBeGreaterThanOrEqual(10);
      expect(result.value).toBeLessThanOrEqual(30);
    });

    test('should calculate revenue impact', async () => {
      const result = await reportingSystem.getRevenueImpact(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result.unit).toBe('$');
      expect(result.value).toBeGreaterThanOrEqual(10000);
      expect(result.value).toBeLessThanOrEqual(50000);
    });
  });

  describe('Team Performance Metrics', () => {
    test('should calculate team size', async () => {
      const result = await reportingSystem.getTeamSize(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(typeof result.value).toBe('number');
      expect(result.value).toBeGreaterThanOrEqual(0);
    });

    test('should calculate active members', async () => {
      const result = await reportingSystem.getActiveMembers(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(typeof result.value).toBe('number');
      expect(result.value).toBeGreaterThanOrEqual(0);
    });

    test('should calculate tickets handled', async () => {
      const result = await reportingSystem.getTicketsHandled(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(typeof result.value).toBe('number');
      expect(result.value).toBeGreaterThanOrEqual(0);
    });

    test('should calculate knowledge sharing', async () => {
      const result = await reportingSystem.getKnowledgeSharing(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        {}
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result.unit).toBe('%');
      expect(result.value).toBeGreaterThanOrEqual(60);
      expect(result.value).toBeLessThanOrEqual(90);
    });
  });

  describe('Time Range Parsing', () => {
    test('should parse time range strings', () => {
      const result = reportingSystem.parseTimeRange('7d');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    test('should parse time range objects', () => {
      const timeRange = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };
      
      const result = reportingSystem.parseTimeRange(timeRange);
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    test('should use default time range for invalid input', () => {
      const result = reportingSystem.parseTimeRange('invalid');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });
  });

  describe('Trend Calculation', () => {
    test('should calculate trend correctly', () => {
      expect(reportingSystem.calculateTrend(100, 80)).toBe('up');
      expect(reportingSystem.calculateTrend(80, 100)).toBe('down');
      expect(reportingSystem.calculateTrend(100, 100)).toBe('stable');
      expect(reportingSystem.calculateTrend(50, 0)).toBe('up');
      expect(reportingSystem.calculateTrend(0, 0)).toBe('stable');
    });

    test('should calculate change percentage correctly', () => {
      expect(reportingSystem.calculateChange(120, 100)).toBe(20);
      expect(reportingSystem.calculateChange(80, 100)).toBe(-20);
      expect(reportingSystem.calculateChange(100, 100)).toBe(0);
      expect(reportingSystem.calculateChange(50, 0)).toBe(100);
      expect(reportingSystem.calculateChange(0, 0)).toBe(0);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache', () => {
      // Add some data to cache
      reportingSystem.reportCache.set('test', { data: 'test' });
      reportingSystem.analyticsCache.set('test', { data: 'test' });
      
      expect(reportingSystem.reportCache.size).toBe(1);
      expect(reportingSystem.analyticsCache.size).toBe(1);
      
      clearCache();
      
      expect(reportingSystem.reportCache.size).toBe(0);
      expect(reportingSystem.analyticsCache.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid template ID gracefully', async () => {
      await expect(generateReport('invalid_template', {}))
        .rejects.toThrow('Report template not found: invalid_template');
    });

    test('should handle invalid time range gracefully', async () => {
      const report = await generateReport('ticket_summary', {
        timeRange: 'invalid',
        format: 'json'
      });

      expect(report).toBeDefined();
      // Should use default time range
    });

    test('should handle empty filters gracefully', async () => {
      const report = await generateReport('ticket_summary', {
        timeRange: '7d',
        filters: {},
        format: 'json'
      });

      expect(report).toBeDefined();
      const reportData = JSON.parse(report);
      expect(reportData.filters).toEqual({});
    });
  });

  describe('Performance', () => {
    test('should generate reports within reasonable time', async () => {
      const startTime = Date.now();
      
      await generateReport('ticket_summary', {
        timeRange: '30d',
        format: 'json'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should use cache effectively for repeated requests', async () => {
      const options = {
        timeRange: '7d',
        format: 'json'
      };

      const startTime1 = Date.now();
      await generateReport('ticket_summary', options);
      const duration1 = Date.now() - startTime1;

      const startTime2 = Date.now();
      await generateReport('ticket_summary', options);
      const duration2 = Date.now() - startTime2;

      expect(duration2).toBeLessThan(duration1); // Cached request should be faster
    });
  });
});
