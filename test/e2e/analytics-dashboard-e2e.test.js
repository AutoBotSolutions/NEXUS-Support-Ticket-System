/**
 * Analytics Dashboard End-to-End Tests
 * 
 * Comprehensive E2E tests for the Analytics Dashboard
 * testing complete user workflows from UI to backend.
 */

const puppeteer = require('puppeteer');
const app = require('../../server');

describe('Analytics Dashboard E2E Tests', () => {
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

  describe('Analytics Dashboard Loading', () => {
    it('should load analytics dashboard successfully', async () => {
      // Navigate to analytics dashboard
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for page to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Check dashboard title
      const title = await page.title();
      expect(title).toContain('Analytics Dashboard');
      
      // Check for main dashboard elements
      const dashboardElement = await page.$('.analytics-dashboard');
      expect(dashboardElement).toBeTruthy();
      
      // Check for KPI widgets
      const kpiWidgets = await page.$$('.kpi-widget');
      expect(kpiWidgets.length).toBeGreaterThan(0);
      
      // Check for charts
      const charts = await page.$$('.chart-container');
      expect(charts.length).toBeGreaterThan(0);
    });

    it('should display loading state initially', async () => {
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Check for loading indicators
      const loadingElements = await page.$$('.loading-spinner');
      expect(loadingElements.length).toBeGreaterThan(0);
      
      // Wait for loading to complete
      await page.waitForSelector('.analytics-dashboard.loaded', { timeout: 10000 });
      
      // Verify loading elements are gone
      const loadingAfter = await page.$$('.loading-spinner');
      expect(loadingAfter.length).toBe(0);
    });

    it('should handle dashboard loading errors gracefully', async () => {
      // Mock API failure
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/analytics/dashboard')) {
          request.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Service unavailable' })
          });
        } else {
          request.continue();
        }
      });
      
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for error message
      await page.waitForSelector('.error-message', { timeout: 10000 });
      
      // Check error message
      const errorElement = await page.$('.error-message');
      expect(errorElement).toBeTruthy();
      
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      expect(errorText).toContain('Service unavailable');
    });
  });

  describe('Ticket Analytics Workflow', () => {
    it('should complete ticket analytics workflow', async () => {
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Click on ticket analytics section
      await page.click('[data-testid="ticket-analytics-section"]');
      
      // Wait for ticket analytics to load
      await page.waitForSelector('.ticket-analytics', { timeout: 10000 });
      
      // Check ticket overview metrics
      const totalTickets = await page.$eval('[data-testid="total-tickets"]', el => el.textContent);
      expect(totalTickets).toMatch(/\d+/);
      
      const openTickets = await page.$eval('[data-testid="open-tickets"]', el => el.textContent);
      expect(openTickets).toMatch(/\d+/);
      
      // Test date range filter
      await page.click('[data-testid="date-range-filter"]');
      await page.click('[data-testid="last-30-days"]');
      
      // Wait for data to refresh
      await page.waitForTimeout(1000);
      
      // Verify chart updated
      const chart = await page.$('.ticket-volume-chart');
      expect(chart).toBeTruthy();
      
      // Test category breakdown
      await page.click('[data-testid="category-breakdown-tab"]');
      
      // Wait for category data to load
      await page.waitForSelector('.category-chart', { timeout: 5000 });
      
      // Check category data
      const categories = await page.$$('.category-item');
      expect(categories.length).toBeGreaterThan(0);
      
      // Export ticket analytics
      await page.click('[data-testid="export-ticket-analytics"]');
      
      // Wait for export options
      await page.waitForSelector('.export-modal', { timeout: 5000 });
      
      // Select CSV export
      await page.click('[data-testid="export-csv"]');
      
      // Wait for export to complete
      await page.waitForSelector('.export-success', { timeout: 10000 });
      
      // Verify success message
      const successMessage = await page.$eval('.export-success', el => el.textContent);
      expect(successMessage).toContain('exported successfully');
    });

    it('should handle real-time updates', async () => {
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Enable real-time updates
      await page.click('[data-testid="real-time-toggle"]');
      
      // Wait for WebSocket connection
      await page.waitForSelector('.real-time-connected', { timeout: 5000 });
      
      // Check initial metrics
      const initialMetrics = await page.evaluate(() => {
        const kpiElements = document.querySelectorAll('.kpi-value');
        return Array.from(kpiElements).map(el => el.textContent);
      });
      
      // Simulate real-time data update (would normally come from WebSocket)
      await page.evaluate(() => {
        // Mock WebSocket message
        window.dispatchEvent(new CustomEvent('analytics-update', {
          detail: {
            tickets: { total: 105, open: 28 },
            timestamp: new Date().toISOString()
          }
        }));
      });
      
      // Wait for update to process
      await page.waitForTimeout(1000);
      
      // Check if metrics updated
      const updatedMetrics = await page.evaluate(() => {
        const kpiElements = document.querySelectorAll('.kpi-value');
        return Array.from(kpiElements).map(el => el.textContent);
      });
      
      // Verify some metrics changed
      expect(updatedMetrics).not.toEqual(initialMetrics);
    });
  });

  describe('User Analytics Workflow', () => {
    it('should complete user analytics workflow', async () => {
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Navigate to user analytics
      await page.click('[data-testid="user-analytics-tab"]');
      
      // Wait for user analytics to load
      await page.waitForSelector('.user-analytics', { timeout: 10000 });
      
      // Check user overview metrics
      const totalUsers = await page.$eval('[data-testid="total-users"]', el => el.textContent);
      expect(totalUsers).toMatch(/\d+/);
      
      const activeUsers = await page.$eval('[data-testid="active-users"]', el => el.textContent);
      expect(activeUsers).toMatch(/\d+/);
      
      // Test user activity chart
      const activityChart = await page.$('.user-activity-chart');
      expect(activityChart).toBeTruthy();
      
      // Test role distribution
      await page.click('[data-testid="role-distribution-section"]');
      
      // Wait for role data to load
      await page.waitForSelector('.role-chart', { timeout: 5000 });
      
      // Check role data
      const roles = await page.$$('.role-item');
      expect(roles.length).toBeGreaterThan(0);
      
      // Test user engagement metrics
      const engagementMetrics = await page.$$('.engagement-metric');
      expect(engagementMetrics.length).toBeGreaterThan(0);
      
      // Filter by user role
      await page.click('[data-testid="role-filter"]');
      await page.click('[data-testid="filter-admin"]');
      
      // Wait for data to refresh
      await page.waitForTimeout(1000);
      
      // Verify filtered data
      const filteredUsers = await page.$eval('[data-testid="filtered-user-count"]', el => el.textContent);
      expect(filteredUsers).toMatch(/\d+/);
    });
  });

  describe('System Performance Workflow', () => {
    it('should complete system performance workflow', async () => {
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Navigate to system performance
      await page.click('[data-testid="system-performance-tab"]');
      
      // Wait for performance data to load
      await page.waitForSelector('.system-performance', { timeout: 10000 });
      
      // Check API metrics
      const apiResponseTime = await page.$eval('[data-testid="api-response-time"]', el => el.textContent);
      expect(apiResponseTime).toMatch(/\d+ms/);
      
      const requestRate = await page.$eval('[data-testid="request-rate"]', el => el.textContent);
      expect(requestRate).toMatch(/\d+\/s/);
      
      // Check database metrics
      const dbConnectionPool = await page.$eval('[data-testid="db-connection-pool"]', el => el.textContent);
      expect(dbConnectionPool).toMatch(/\d+/);
      
      // Check system metrics
      const cpuUsage = await page.$eval('[data-testid="cpu-usage"]', el => el.textContent);
      expect(cpuUsage).toMatch(/\d+%/);
      
      const memoryUsage = await page.$eval('[data-testid="memory-usage"]', el => el.textContent);
      expect(memoryUsage).toMatch(/\d+%/);
      
      // Test performance charts
      const performanceCharts = await page.$$('.performance-chart');
      expect(performanceCharts.length).toBeGreaterThan(0);
      
      // Test alert thresholds
      await page.click('[data-testid="alert-settings"]');
      
      // Wait for settings modal
      await page.waitForSelector('.alert-settings-modal', { timeout: 5000 });
      
      // Set alert threshold
      await page.type('[data-testid="cpu-threshold"]', '80');
      await page.click('[data-testid="save-alert-settings"]');
      
      // Wait for settings to save
      await page.waitForSelector('.settings-saved', { timeout: 5000 });
      
      // Verify settings saved
      const savedMessage = await page.$eval('.settings-saved', el => el.textContent);
      expect(savedMessage).toContain('saved successfully');
    });
  });

  describe('Dashboard Customization', () => {
    it('should allow dashboard customization', async () => {
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Enter customization mode
      await page.click('[data-testid="customize-dashboard"]');
      
      // Wait for customization controls
      await page.waitForSelector('.dashboard-customization', { timeout: 5000 });
      
      // Drag and drop widget
      const widget = await page.$('.draggable-widget');
      const dropZone = await page.$('.drop-zone');
      
      if (widget && dropZone) {
        // Get widget position
        const widgetBox = await widget.boundingBox();
        const dropBox = await dropZone.boundingBox();
        
        // Simulate drag and drop
        await page.mouse.move(widgetBox.x + widgetBox.width / 2, widgetBox.y + widgetBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(dropBox.x + dropBox.width / 2, dropBox.y + dropBox.height / 2);
        await page.mouse.up();
        
        // Wait for drop to process
        await page.waitForTimeout(500);
        
        // Verify widget moved
        const movedWidget = await dropZone.$('.draggable-widget');
        expect(movedWidget).toBeTruthy();
      }
      
      // Resize widget
      const resizeHandle = await page.$('.resize-handle');
      if (resizeHandle) {
        const handleBox = await resizeHandle.boundingBox();
        
        await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(handleBox.x + 50, handleBox.y + 50);
        await page.mouse.up();
        
        // Wait for resize to process
        await page.waitForTimeout(500);
      }
      
      // Save customization
      await page.click('[data-testid="save-customization"]');
      
      // Wait for save to complete
      await page.waitForSelector('.customization-saved', { timeout: 5000 });
      
      // Verify customization saved
      const savedMessage = await page.$eval('.customization-saved', el => el.textContent);
      expect(savedMessage).toContain('saved successfully');
    });

    it('should reset dashboard to default layout', async () => {
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Enter customization mode
      await page.click('[data-testid="customize-dashboard"]');
      
      // Wait for customization controls
      await page.waitForSelector('.dashboard-customization', { timeout: 5000 });
      
      // Reset to default
      await page.click('[data-testid="reset-layout"]');
      
      // Wait for confirmation dialog
      await page.waitForSelector('.reset-confirmation', { timeout: 5000 });
      
      // Confirm reset
      await page.click('[data-testid="confirm-reset"]');
      
      // Wait for reset to complete
      await page.waitForSelector('.layout-reset', { timeout: 5000 });
      
      // Verify reset message
      const resetMessage = await page.$eval('.layout-reset', el => el.textContent);
      expect(resetMessage).toContain('reset to default');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Check mobile navigation
      const mobileNav = await page.$('.mobile-navigation');
      expect(mobileNav).toBeTruthy();
      
      // Check mobile layout
      const mobileLayout = await page.$('.mobile-layout');
      expect(mobileLayout).toBeTruthy();
      
      // Test mobile menu
      await page.click('[data-testid="mobile-menu-toggle"]');
      
      // Wait for menu to open
      await page.waitForSelector('.mobile-menu.open', { timeout: 5000 });
      
      // Verify menu items
      const menuItems = await page.$$('.mobile-menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
      
      // Close mobile menu
      await page.click('[data-testid="mobile-menu-toggle"]');
      
      // Wait for menu to close
      await page.waitForSelector('.mobile-menu.closed', { timeout: 5000 });
    });

    it('should adapt to tablet devices', async () => {
      // Set tablet viewport
      await page.setViewport({ width: 768, height: 1024 });
      
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Check tablet layout
      const tabletLayout = await page.$('.tablet-layout');
      expect(tabletLayout).toBeTruthy();
      
      // Check widget arrangement
      const widgets = await page.$$('.dashboard-widget');
      expect(widgets.length).toBeGreaterThan(0);
      
      // Verify widgets are properly sized for tablet
      const widgetWidths = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.dashboard-widget')).map(el => 
          getComputedStyle(el).width
        );
      });
      
      widgetWidths.forEach(width => {
        expect(width).not.toBe('0px');
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', async () => {
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Check focus indicator
      const focusedElement = await page.evaluate(() => document.activeElement);
      expect(focusedElement).toBeTruthy();
      
      // Navigate through dashboard elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const currentFocus = await page.evaluate(() => document.activeElement);
        expect(currentFocus).toBeTruthy();
      }
      
      // Test Enter key on focused element
      await page.keyboard.press('Enter');
      
      // Check if action was triggered
      await page.waitForTimeout(500);
    });

    it('should have proper ARIA labels', async () => {
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      // Check for ARIA labels
      const ariaElements = await page.$$('[aria-label]');
      expect(ariaElements.length).toBeGreaterThan(0);
      
      // Check for proper roles
      const roleElements = await page.$$('[role]');
      expect(roleElements.length).toBeGreaterThan(0);
      
      // Check for semantic HTML
      const semanticElements = await page.$$('main, nav, section, article, aside, header, footer');
      expect(semanticElements.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should load within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/analytics/dashboard')) {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                kpi: { totalTickets: 10000, openTickets: 2500 },
                widgets: Array(50).fill().map((_, i) => ({
                  id: i,
                  type: 'chart',
                  data: Array(1000).fill().map((_, j) => ({ x: j, y: Math.random() * 100 }))
                }))
              },
              timestamp: new Date().toISOString()
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.goto(`http://localhost:${server.address().port}/analytics/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForSelector('.analytics-dashboard', { timeout: 15000 });
      
      // Check if dashboard handles large dataset
      const widgets = await page.$$('.dashboard-widget');
      expect(widgets.length).toBeGreaterThan(0);
      
      // Check for performance indicators
      const performanceIndicators = await page.$$('.performance-indicator');
      expect(performanceIndicators.length).toBeGreaterThan(0);
    });
  });
});
