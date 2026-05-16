/**
 * Reporting Workflow End-to-End Tests
 * 
 * Comprehensive E2E tests for the Reporting System workflow
 * testing complete user workflows from UI to backend.
 */

const puppeteer = require('puppeteer');
const app = require('../../server');

describe('Reporting Workflow E2E Tests', () => {
  let browser;
  let page;
  let server;

  beforeAll(async () => {
    // Start test server
    server = app.listen(0);
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'test' ? 'new' : false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    // Clean up
    if (browser) {
      await browser.close();
    }
    if (server) {
      await server.close();
    }
  });

  beforeEach(async () => {
    // Create new page
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1200, height: 800 });
    
    // Handle console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Page error:', msg.text());
      }
    });
    
    // Handle page errors
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  });

  afterEach(async () => {
    // Close page
    if (page) {
      await page.close();
    }
  });

  describe('Report Builder Workflow', () => {
    it('should complete report creation workflow', async () => {
      // Navigate to report builder
      await page.goto(`http://localhost:${server.address().port}/reports/builder`);
      
      // Wait for report builder to load
      await page.waitForSelector('.report-builder', { timeout: 10000 });
      
      // Check report builder interface
      const builderElement = await page.$('.report-builder');
      expect(builderElement).toBeTruthy();
      
      // Step 1: Select report type
      await page.click('[data-testid="report-type-select"]');
      await page.waitForSelector('.report-type-options', { timeout: 5000 });
      await page.click('[data-testid="type-ticket-analytics"]');
      
      // Verify selection
      const selectedType = await page.$eval('[data-testid="selected-type"]', el => el.textContent);
      expect(selectedType).toContain('Ticket Analytics');
      
      // Step 2: Configure report parameters
      await page.click('[data-testid="configure-parameters"]');
      
      // Wait for configuration panel
      await page.waitForSelector('.parameter-configuration', { timeout: 5000 });
      
      // Set date range
      await page.click('[data-testid="date-range-picker"]');
      await page.click('[data-testid="last-30-days"]');
      
      // Set filters
      await page.click('[data-testid="add-filter"]');
      await page.select('[data-testid="filter-field"]', 'status');
      await page.select('[data-testid="filter-value"]', 'open');
      
      // Step 3: Select data fields
      await page.click('[data-testid="data-fields-tab"]');
      
      // Wait for data fields panel
      await page.waitForSelector('.data-fields-panel', { timeout: 5000 });
      
      // Select fields
      await page.click('[data-testid="field-total-tickets"]');
      await page.click('[data-testid="field-resolution-time"]');
      await page.click('[data-testid="field-categories"]');
      
      // Step 4: Configure visualization
      await page.click('[data-testid="visualization-tab"]');
      
      // Wait for visualization panel
      await page.waitForSelector('.visualization-panel', { timeout: 5000 });
      
      // Select chart type
      await page.click('[data-testid="chart-type-line"]');
      
      // Configure chart options
      await page.click('[data-testid="chart-colors"]');
      await page.click('[data-testid="color-blue"]');
      
      // Step 5: Preview report
      await page.click('[data-testid="preview-report"]');
      
      // Wait for preview to generate
      await page.waitForSelector('.report-preview', { timeout: 15000 });
      
      // Check preview content
      const previewTitle = await page.$eval('[data-testid="preview-title"]', el => el.textContent);
      expect(previewTitle).toContain('Preview');
      
      const previewChart = await page.$('.preview-chart');
      expect(previewChart).toBeTruthy();
      
      // Step 6: Save report
      await page.click('[data-testid="save-report"]');
      
      // Wait for save dialog
      await page.waitForSelector('.save-report-dialog', { timeout: 5000 });
      
      // Enter report name
      await page.type('[data-testid="report-name"]', 'Test Ticket Analytics Report');
      
      // Add description
      await page.type('[data-testid="report-description"]', 'This is a test report for ticket analytics');
      
      // Save report
      await page.click('[data-testid="confirm-save"]');
      
      // Wait for save to complete
      await page.waitForSelector('.save-success', { timeout: 10000 });
      
      // Verify success message
      const successMessage = await page.$eval('.save-success', el => el.textContent);
      expect(successMessage).toContain('saved successfully');
      
      // Check report appears in saved reports
      await page.goto(`http://localhost:${server.address().port}/reports`);
      
      // Wait for reports list to load
      await page.waitForSelector('.reports-list', { timeout: 10000 });
      
      // Find saved report
      const savedReport = await page.$('[data-testid="report-test-ticket-analytics"]');
      expect(savedReport).toBeTruthy();
    });

    it('should handle report template selection', async () => {
      await page.goto(`http://localhost:${server.address().port}/reports/builder`);
      
      // Wait for report builder to load
      await page.waitForSelector('.report-builder', { timeout: 10000 });
      
      // Click on templates
      await page.click('[data-testid="use-template"]');
      
      // Wait for templates gallery
      await page.waitForSelector('.templates-gallery', { timeout: 5000 });
      
      // Select a template
      await page.click('[data-testid="template-ticket-summary"]');
      
      // Wait for template to load
      await page.waitForSelector('.template-loaded', { timeout: 5000 });
      
      // Check template fields are pre-filled
      const reportType = await page.$eval('[data-testid="selected-type"]', el => el.textContent);
      expect(reportType).toContain('Ticket Summary');
      
      // Check pre-configured parameters
      const parameters = await page.$$('.pre-configured-parameter');
      expect(parameters.length).toBeGreaterThan(0);
      
      // Customize template
      await page.click('[data-testid="customize-template"]');
      
      // Modify date range
      await page.click('[data-testid="date-range-picker"]');
      await page.click('[data-testid="last-7-days"]');
      
      // Add custom field
      await page.click('[data-testid="add-custom-field"]');
      await page.select('[data-testid="custom-field-select"]', 'priority');
      
      // Save customized report
      await page.click('[data-testid="save-customized-report"]');
      
      // Wait for save dialog
      await page.waitForSelector('.save-report-dialog', { timeout: 5000 });
      
      // Enter report name
      await page.type('[data-testid="report-name"]', 'Customized Template Report');
      
      // Save
      await page.click('[data-testid="confirm-save"]');
      
      // Wait for save to complete
      await page.waitForSelector('.save-success', { timeout: 10000 });
      
      // Verify success
      const successMessage = await page.$eval('.save-success', el => el.textContent);
      expect(successMessage).toContain('saved successfully');
    });
  });

  describe('Report Generation and Export', () => {
    it('should generate and export report successfully', async () => {
      // Navigate to saved reports
      await page.goto(`http://localhost:${server.address().port}/reports`);
      
      // Wait for reports list to load
      await page.waitForSelector('.reports-list', { timeout: 10000 });
      
      // Click on a report
      await page.click('[data-testid="report-test-ticket-analytics"]');
      
      // Wait for report details to load
      await page.waitForSelector('.report-details', { timeout: 10000 });
      
      // Generate report
      await page.click('[data-testid="generate-report"]');
      
      // Wait for generation to start
      await page.waitForSelector('.generation-progress', { timeout: 5000 });
      
      // Wait for generation to complete
      await page.waitForSelector('.generation-complete', { timeout: 30000 });
      
      // Check generation status
      const statusElement = await page.$('[data-testid="generation-status"]');
      expect(statusElement).toBeTruthy();
      
      const status = await page.evaluate(el => el.textContent, statusElement);
      expect(status).toContain('Completed');
      
      // View generated report
      await page.click('[data-testid="view-report"]');
      
      // Wait for report view to load
      await page.waitForSelector('.report-view', { timeout: 10000 });
      
      // Check report content
      const reportTitle = await page.$eval('[data-testid="report-title"]', el => el.textContent);
      expect(reportTitle).toContain('Test Ticket Analytics Report');
      
      // Export report
      await page.click('[data-testid="export-report"]');
      
      // Wait for export options
      await page.waitForSelector('.export-options', { timeout: 5000 });
      
      // Select PDF export
      await page.click('[data-testid="export-pdf"]');
      
      // Wait for export to complete
      await page.waitForSelector('.export-complete', { timeout: 15000 });
      
      // Verify export success
      const exportMessage = await page.$eval('.export-complete', el => el.textContent);
      expect(exportMessage).toContain('exported successfully');
      
      // Check download link
      const downloadLink = await page.$('[data-testid="download-link"]');
      expect(downloadLink).toBeTruthy();
      
      const downloadUrl = await page.evaluate(el => el.href, downloadLink);
      expect(downloadUrl).toContain('.pdf');
    });

    it('should handle multiple export formats', async () => {
      // Navigate to a generated report
      await page.goto(`http://localhost:${server.address().port}/reports`);
      
      // Wait for reports list to load
      await page.waitForSelector('.reports-list', { timeout: 10000 });
      
      // Click on a report
      await page.click('[data-testid="report-test-ticket-analytics"]');
      
      // Wait for report details to load
      await page.waitForSelector('.report-details', { timeout: 10000 });
      
      // Test CSV export
      await page.click('[data-testid="export-report"]');
      await page.waitForSelector('.export-options', { timeout: 5000 });
      await page.click('[data-testid="export-csv"]');
      await page.waitForSelector('.export-complete', { timeout: 15000 });
      
      const csvMessage = await page.$eval('.export-complete', el => el.textContent);
      expect(csvMessage).toContain('CSV exported successfully');
      
      // Test Excel export
      await page.click('[data-testid="export-report"]');
      await page.waitForSelector('.export-options', { timeout: 5000 });
      await page.click('[data-testid="export-excel"]');
      await page.waitForSelector('.export-complete', { timeout: 15000 });
      
      const excelMessage = await page.$eval('.export-complete', el => el.textContent);
      expect(excelMessage).toContain('Excel exported successfully');
      
      // Test JSON export
      await page.click('[data-testid="export-report"]');
      await page.waitForSelector('.export-options', { timeout: 5000 });
      await page.click('[data-testid="export-json"]');
      await page.waitForSelector('.export-complete', { timeout: 15000 });
      
      const jsonMessage = await page.$eval('.export-complete', el => el.textContent);
      expect(jsonMessage).toContain('JSON exported successfully');
    });
  });

  describe('Report Scheduling Workflow', () => {
    it('should schedule and manage reports', async () => {
      // Navigate to a report
      await page.goto(`http://localhost:${server.address().port}/reports`);
      
      // Wait for reports list to load
      await page.waitForSelector('.reports-list', { timeout: 10000 });
      
      // Click on a report
      await page.click('[data-testid="report-test-ticket-analytics"]');
      
      // Wait for report details to load
      await page.waitForSelector('.report-details', { timeout: 10000 });
      
      // Schedule report
      await page.click('[data-testid="schedule-report"]');
      
      // Wait for scheduling dialog
      await page.waitForSelector('.schedule-dialog', { timeout: 5000 });
      
      // Configure schedule
      await page.select('[data-testid="schedule-frequency"]', 'daily');
      
      // Set time
      await page.click('[data-testid="schedule-time"]');
      await page.click('[data-testid="time-09-00"]');
      
      // Add recipients
      await page.click('[data-testid="add-recipient"]');
      await page.type('[data-testid="recipient-email"]', 'test@example.com');
      await page.click('[data-testid="add-recipient-btn"]');
      
      // Configure export format
      await page.select('[data-testid="schedule-format"]', 'pdf');
      
      // Save schedule
      await page.click('[data-testid="save-schedule"]');
      
      // Wait for schedule to save
      await page.waitForSelector('.schedule-saved', { timeout: 10000 });
      
      // Verify schedule saved
      const scheduleMessage = await page.$eval('.schedule-saved', el => el.textContent);
      expect(scheduleMessage).toContain('scheduled successfully');
      
      // Check scheduled reports
      await page.goto(`http://localhost:${server.address().port}/reports/scheduled`);
      
      // Wait for scheduled reports list
      await page.waitForSelector('.scheduled-reports', { timeout: 10000 });
      
      // Find scheduled report
      const scheduledReport = await page.$('[data-testid="scheduled-test-ticket-analytics"]');
      expect(scheduledReport).toBeTruthy();
      
      // Check schedule details
      const scheduleDetails = await page.$eval('[data-testid="schedule-details"]', el => el.textContent);
      expect(scheduleDetails).toContain('Daily');
      expect(scheduleDetails).toContain('09:00');
      
      // Test editing schedule
      await page.click('[data-testid="edit-schedule"]');
      
      // Wait for edit dialog
      await page.waitForSelector('.edit-schedule-dialog', { timeout: 5000 });
      
      // Change frequency
      await page.select('[data-testid="schedule-frequency"]', 'weekly');
      
      // Save changes
      await page.click('[data-testid="save-schedule-changes"]');
      
      // Wait for changes to save
      await page.waitForSelector('.schedule-updated', { timeout: 10000 });
      
      // Verify update
      const updateMessage = await page.$eval('.schedule-updated', el => el.textContent);
      expect(updateMessage).toContain('updated successfully');
      
      // Test cancelling schedule
      await page.click('[data-testid="cancel-schedule"]');
      
      // Wait for confirmation dialog
      await page.waitForSelector('.cancel-confirmation', { timeout: 5000 });
      
      // Confirm cancellation
      await page.click('[data-testid="confirm-cancel"]');
      
      // Wait for cancellation to complete
      await page.waitForSelector('.schedule-cancelled', { timeout: 10000 });
      
      // Verify cancellation
      const cancelMessage = await page.$eval('.schedule-cancelled', el => el.textContent);
      expect(cancelMessage).toContain('cancelled successfully');
    });
  });

  describe('Report Sharing Workflow', () => {
    it('should share reports with users', async () => {
      // Navigate to a report
      await page.goto(`http://localhost:${server.address().port}/reports`);
      
      // Wait for reports list to load
      await page.waitForSelector('.reports-list', { timeout: 10000 });
      
      // Click on a report
      await page.click('[data-testid="report-test-ticket-analytics"]');
      
      // Wait for report details to load
      await page.waitForSelector('.report-details', { timeout: 10000 });
      
      // Share report
      await page.click('[data-testid="share-report"]');
      
      // Wait for sharing dialog
      await page.waitForSelector('.share-dialog', { timeout: 5000 });
      
      // Add users to share with
      await page.click('[data-testid="add-user"]');
      await page.type('[data-testid="user-search"]', 'testuser');
      
      // Wait for user search results
      await page.waitForSelector('.user-search-results', { timeout: 5000 });
      
      // Select user
      await page.click('[data-testid="user-testuser"]');
      
      // Set permissions
      await page.click('[data-testid="permission-view"]');
      await page.click('[data-testid="permission-export"]');
      
      // Set expiration
      await page.click('[data-testid="set-expiration"]');
      await page.click('[data-testid="expiration-7-days"]');
      
      // Share report
      await page.click('[data-testid="confirm-share"]');
      
      // Wait for sharing to complete
      await page.waitForSelector('.share-success', { timeout: 10000 });
      
      // Verify sharing success
      const shareMessage = await page.$eval('.share-success', el => el.textContent);
      expect(shareMessage).toContain('shared successfully');
      
      // Check shared reports
      await page.goto(`http://localhost:${server.address().port}/reports/shared`);
      
      // Wait for shared reports list
      await page.waitForSelector('.shared-reports', { timeout: 10000 });
      
      // Find shared report
      const sharedReport = await page.$('[data-testid="shared-test-ticket-analytics"]');
      expect(sharedReport).toBeTruthy();
      
      // Test accessing shared report
      await page.click('[data-testid="shared-test-ticket-analytics"]');
      
      // Wait for shared report view
      await page.waitForSelector('.shared-report-view', { timeout: 10000 });
      
      // Check report content
      const reportTitle = await page.$eval('[data-testid="report-title"]', el => el.textContent);
      expect(reportTitle).toContain('Test Ticket Analytics Report');
      
      // Test revoking access
      await page.click('[data-testid="revoke-access"]');
      
      // Wait for confirmation dialog
      await page.waitForSelector('.revoke-confirmation', { timeout: 5000 });
      
      // Confirm revocation
      await page.click('[data-testid="confirm-revoke"]');
      
      // Wait for revocation to complete
      await page.waitForSelector('.access-revoked', { timeout: 10000 });
      
      // Verify revocation
      const revokeMessage = await page.$eval('.access-revoked', el => el.textContent);
      expect(revokeMessage).toContain('access revoked');
    });
  });

  describe('Report Templates Management', () => {
    it('should create and manage report templates', async () => {
      // Navigate to templates
      await page.goto(`http://localhost:${server.address().port}/reports/templates`);
      
      // Wait for templates list to load
      await page.waitForSelector('.templates-list', { timeout: 10000 });
      
      // Create new template
      await page.click('[data-testid="create-template"]');
      
      // Wait for template builder
      await page.waitForSelector('.template-builder', { timeout: 10000 });
      
      // Configure template
      await page.type('[data-testid="template-name"]', 'Custom Analytics Template');
      await page.select('[data-testid="template-category"]', 'analytics');
      
      // Add template description
      await page.type('[data-testid="template-description"]', 'Custom template for analytics reports');
      
      // Configure template structure
      await page.click('[data-testid="add-template-section"]');
      await page.select('[data-testid="section-type"]', 'chart');
      await page.type('[data-testid="section-title"]', 'Ticket Trends');
      
      // Add data fields
      await page.click('[data-testid="add-template-field"]');
      await page.select('[data-testid="field-type"]', 'metric');
      await page.type('[data-testid="field-name"]', 'Total Tickets');
      
      // Save template
      await page.click('[data-testid="save-template"]');
      
      // Wait for template to save
      await page.waitForSelector('.template-saved', { timeout: 10000 });
      
      // Verify template saved
      const saveMessage = await page.$eval('.template-saved', el => el.textContent);
      expect(saveMessage).toContain('template saved successfully');
      
      // Check template appears in list
      await page.goto(`http://localhost:${server.address().port}/reports/templates`);
      
      // Wait for templates list to load
      await page.waitForSelector('.templates-list', { timeout: 10000 });
      
      // Find created template
      const createdTemplate = await page.$('[data-testid="template-custom-analytics"]');
      expect(createdTemplate).toBeTruthy();
      
      // Test using template
      await page.click('[data-testid="use-template-custom-analytics"]');
      
      // Wait for template to load in builder
      await page.waitForSelector('.template-loaded', { timeout: 5000 });
      
      // Verify template structure loaded
      const templateSections = await page.$$('.template-section');
      expect(templateSections.length).toBeGreaterThan(0);
      
      // Test editing template
      await page.click('[data-testid="edit-template"]');
      
      // Wait for edit mode
      await page.waitForSelector('.template-edit-mode', { timeout: 5000 });
      
      // Modify template
      await page.type('[data-testid="template-description"]', ' - Updated description', { delay: 100 });
      
      // Save changes
      await page.click('[data-testid="save-template-changes"]');
      
      // Wait for changes to save
      await page.waitForSelector('.template-updated', { timeout: 10000 });
      
      // Verify update
      const updateMessage = await page.$eval('.template-updated', el => el.textContent);
      expect(updateMessage).toContain('template updated successfully');
      
      // Test deleting template
      await page.goto(`http://localhost:${server.address().port}/reports/templates`);
      
      // Wait for templates list to load
      await page.waitForSelector('.templates-list', { timeout: 10000 });
      
      // Delete template
      await page.click('[data-testid="delete-template-custom-analytics"]');
      
      // Wait for confirmation dialog
      await page.waitForSelector('.delete-confirmation', { timeout: 5000 });
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');
      
      // Wait for deletion to complete
      await page.waitForSelector('.template-deleted', { timeout: 10000 });
      
      // Verify deletion
      const deleteMessage = await page.$eval('.template-deleted', el => el.textContent);
      expect(deleteMessage).toContain('template deleted successfully');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle report generation failures gracefully', async () => {
      // Mock API failure
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/reports/generate')) {
          request.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Generation failed' })
          });
        } else {
          request.continue();
        }
      });
      
      await page.goto(`http://localhost:${server.address().port}/reports`);
      
      // Wait for reports list to load
      await page.waitForSelector('.reports-list', { timeout: 10000 });
      
      // Try to generate report
      await page.click('[data-testid="report-test-ticket-analytics"]');
      await page.waitForSelector('.report-details', { timeout: 10000 });
      await page.click('[data-testid="generate-report"]');
      
      // Wait for error message
      await page.waitForSelector('.generation-error', { timeout: 15000 });
      
      // Verify error handling
      const errorMessage = await page.$eval('.generation-error', el => el.textContent);
      expect(errorMessage).toContain('Generation failed');
      
      // Check retry option
      const retryButton = await page.$('[data-testid="retry-generation"]');
      expect(retryButton).toBeTruthy();
    });

    it('should handle large report exports', async () => {
      // Mock large export
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/reports/export')) {
          // Simulate long processing time
          setTimeout(() => {
            request.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: { downloadUrl: '/downloads/large-report.pdf', size: 52428800 }
              })
            });
          }, 5000);
        } else {
          request.continue();
        }
      });
      
      await page.goto(`http://localhost:${server.address().port}/reports`);
      
      // Wait for reports list to load
      await page.waitForSelector('.reports-list', { timeout: 10000 });
      
      // Try to export large report
      await page.click('[data-testid="report-test-ticket-analytics"]');
      await page.waitForSelector('.report-details', { timeout: 10000 });
      await page.click('[data-testid="export-report"]');
      await page.waitForSelector('.export-options', { timeout: 5000 });
      await page.click('[data-testid="export-pdf"]');
      
      // Wait for progress indicator
      await page.waitForSelector('.export-progress', { timeout: 5000 });
      
      // Wait for completion
      await page.waitForSelector('.export-complete', { timeout: 20000 });
      
      // Verify large export handled
      const exportMessage = await page.$eval('.export-complete', el => el.textContent);
      expect(exportMessage).toContain('exported successfully');
      
      // Check file size warning
      const sizeWarning = await page.$('[data-testid="large-file-warning"]');
      expect(sizeWarning).toBeTruthy();
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle concurrent report operations', async () => {
      await page.goto(`http://localhost:${server.address().port}/reports`);
      
      // Wait for reports list to load
      await page.waitForSelector('.reports-list', { timeout: 10000 });
      
      // Start multiple operations
      await page.click('[data-testid="report-test-ticket-analytics"]');
      await page.click('[data-testid="report-user-analytics"]');
      await page.click('[data-testid="report-system-performance"]');
      
      // Wait for all details to load
      await page.waitForSelector('.report-details', { timeout: 10000 });
      
      // Check all reports loaded
      const reportDetails = await page.$$('.report-details');
      expect(reportDetails.length).toBeGreaterThan(0);
      
      // Generate multiple reports
      const generateButtons = await page.$$('[data-testid="generate-report"]');
      
      for (const button of generateButtons) {
        await button.click();
      }
      
      // Wait for all generations to start
      await page.waitForSelector('.generation-progress', { timeout: 5000 });
      
      // Check progress indicators
      const progressIndicators = await page.$$('.generation-progress');
      expect(progressIndicators.length).toBeGreaterThan(0);
    });

    it('should be responsive on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      
      await page.goto(`http://localhost:${server.address().port}/reports`);
      
      // Wait for mobile layout
      await page.waitForSelector('.mobile-reports-layout', { timeout: 10000 });
      
      // Check mobile navigation
      const mobileNav = await page.$('.mobile-navigation');
      expect(mobileNav).toBeTruthy();
      
      // Test mobile report creation
      await page.click('[data-testid="mobile-create-report"]');
      
      // Wait for mobile report builder
      await page.waitForSelector('.mobile-report-builder', { timeout: 10000 });
      
      // Check mobile-friendly interface
      const mobileBuilder = await page.$('.mobile-report-builder');
      expect(mobileBuilder).toBeTruthy();
      
      // Test mobile report list
      await page.click('[data-testid="mobile-reports-list"]');
      
      // Wait for mobile reports list
      await page.waitForSelector('.mobile-reports-list', { timeout: 10000 });
      
      // Check mobile report items
      const mobileReportItems = await page.$$('.mobile-report-item');
      expect(mobileReportItems.length).toBeGreaterThan(0);
    });
  });
});
