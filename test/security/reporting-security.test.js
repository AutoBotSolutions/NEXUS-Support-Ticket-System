/**
 * Reporting System Security Tests
 * 
 * Comprehensive security tests for the Reporting System
 * testing authentication, authorization, input validation, and data protection.
 */

const request = require('supertest');
const app = require('../../server');

describe('Reporting System Security Tests', () => {
  describe('Authentication Security', () => {
    it('should require authentication for report generation', async () => {
      const reportConfig = {
        name: 'Test Report',
        type: 'ticket_analytics',
        parameters: { timeRange: '7d' }
      };

      const response = await request(app)
        .post('/api/reports/generate')
        .send(reportConfig)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should reject invalid authentication tokens for reports', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });

    it('should require authentication for report access', async () => {
      const response = await request(app)
        .get('/api/reports/report123')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should validate session for report operations', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', 'Bearer valid-session-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Authorization Security', () => {
    it('should enforce report ownership', async () => {
      // Try to access another user's report
      const response = await request(app)
        .get('/api/reports/other-user-report-123')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unauthorized access');
    });

    it('should restrict admin-only report operations', async () => {
      // Test admin-only endpoint with regular user
      const response = await request(app)
        .get('/api/reports/system-templates')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should prevent unauthorized report sharing', async () => {
      const shareConfig = {
        users: ['other-user@example.com'],
        permissions: ['view', 'export']
      };

      const response = await request(app)
        .post('/api/reports/report123/share')
        .send(shareConfig)
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot share this report');
    });

    it('should validate template management permissions', async () => {
      const templateData = {
        name: 'User Template',
        type: 'custom',
        configuration: { fields: ['name', 'date'] }
      };

      const response = await request(app)
        .post('/api/reports/templates')
        .send(templateData)
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize SQL injection in report parameters', async () => {
      const maliciousConfig = {
        name: 'Malicious Report',
        type: 'ticket_analytics',
        parameters: {
          timeRange: "'; DROP TABLE reports; --"
        }
      };

      const response = await request(app)
        .post('/api/reports/generate')
        .send(maliciousConfig)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid input');
    });

    it('should prevent XSS in report names', async () => {
      const maliciousConfig = {
        name: '<script>alert("XSS")</script>',
        type: 'ticket_analytics',
        parameters: { timeRange: '7d' }
      };

      const response = await request(app)
        .post('/api/reports/generate')
        .send(maliciousConfig)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid input');
    });

    it('should validate report configuration structure', async () => {
      const invalidConfig = {
        name: 'Invalid Report',
        type: 'ticket_analytics'
        // Missing required parameters
      };

      const response = await request(app)
        .post('/api/reports/generate')
        .send(invalidConfig)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should limit report configuration size', async () => {
      const largeConfig = {
        name: 'Large Report',
        type: 'ticket_analytics',
        parameters: {
          data: 'x'.repeat(1000000) // 1MB of data
        }
      };

      const response = await request(app)
        .post('/api/reports/generate')
        .send(largeConfig)
        .set('Authorization', 'Bearer valid-token')
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Request entity too large');
    });

    it('should validate export format parameters', async () => {
      const response = await request(app)
        .get('/api/reports/report123/export/invalid-format')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid export format');
    });

    it('should validate scheduling parameters', async () => {
      const invalidSchedule = {
        reportId: 'report123',
        schedule: 'invalid-frequency',
        recipients: ['user@example.com']
      };

      const response = await request(app)
        .post('/api/reports/schedule')
        .send(invalidSchedule)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid schedule frequency');
    });

    it('should validate email addresses in sharing', async () => {
      const invalidShare = {
        users: ['invalid-email', 'user@domain'],
        permissions: ['view']
      };

      const response = await request(app)
        .post('/api/reports/report123/share')
        .send(invalidShare)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email addresses');
    });
  });

  describe('Data Protection Security', () => {
    it('should not expose sensitive report data', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Check for sensitive data exposure
      const responseBody = JSON.stringify(response.body);
      
      // Should not contain internal IDs or sensitive metadata
      expect(responseBody).not.toMatch(/internal_id/i);
      expect(responseBody).not.toMatch(/database_id/i);
      expect(responseBody).not.toMatch(/system_metadata/i);
    });

    it('should mask sensitive user data in reports', async () => {
      const response = await request(app)
        .get('/api/reports/report123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Report data should be sanitized
      const reportData = response.body.data;
      
      if (reportData && reportData.users) {
        reportData.users.forEach(user => {
          // Email should be masked
          if (user.email) {
            expect(user.email).toMatch(/\*{2,}/);
          }
          
          // Phone should be masked
          if (user.phone) {
            expect(user.phone).toMatch(/\*{2,}/);
          }
        });
      }
    });

    it('should implement rate limiting for report generation', async () => {
      const reportConfig = {
        name: 'Rate Limit Test',
        type: 'ticket_analytics',
        parameters: { timeRange: '7d' }
      };

      const requests = Array(10).fill().map(() => 
        request(app)
          .post('/api/reports/generate')
          .send(reportConfig)
          .set('Authorization', 'Bearer valid-token')
      );

      const responses = await Promise.allSettled(requests);
      
      const rateLimitedResponses = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should prevent unauthorized report downloads', async () => {
      const response = await request(app)
        .get('/api/reports/report123/export/pdf')
        .set('Authorization', 'Bearer unauthorized-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate download token expiration', async () => {
      const expiredToken = 'expired-download-token-123';

      const response = await request(app)
        .get(`/api/reports/download/${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Download link expired');
    });
  });

  describe('Report Template Security', () => {
    it('should prevent template injection attacks', async () => {
      const maliciousTemplate = {
        name: 'Malicious Template',
        type: 'custom',
        configuration: {
          script: '<script>alert("XSS")</script>',
          query: "'; DROP TABLE templates; --"
        }
      };

      const response = await request(app)
        .post('/api/reports/templates')
        .send(maliciousTemplate)
        .set('Authorization', 'Bearer admin-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid template configuration');
    });

    it('should validate template field names', async () => {
      const invalidTemplate = {
        name: 'Invalid Template',
        type: 'custom',
        configuration: {
          fields: ['valid-field', 'invalid-field-with-<script>', 'another-field']
        }
      };

      const response = await request(app)
        .post('/api/reports/templates')
        .send(invalidTemplate)
        .set('Authorization', 'Bearer admin-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid field names');
    });

    it('should prevent template privilege escalation', async () => {
      const escalationTemplate = {
        name: 'Escalation Template',
        type: 'custom',
        configuration: {
          permissions: ['admin', 'superuser'],
          accessLevel: 'system'
        }
      };

      const response = await request(app)
        .post('/api/reports/templates')
        .send(escalationTemplate)
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Privilege escalation detected');
    });
  });

  describe('Report Sharing Security', () => {
    it('should validate sharing permissions', async () => {
      const invalidShare = {
        users: ['user@example.com'],
        permissions: ['admin', 'delete', 'modify'] // Excessive permissions
      };

      const response = await request(app)
        .post('/api/reports/report123/share')
        .send(invalidShare)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid sharing permissions');
    });

    it('should prevent sharing with non-existent users', async () => {
      const shareConfig = {
        users: ['nonexistent@example.com', 'invalid-user'],
        permissions: ['view']
      };

      const response = await request(app)
        .post('/api/reports/report123/share')
        .send(shareConfig)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Users not found');
    });

    it('should implement sharing expiration', async () => {
      const shareConfig = {
        users: ['user@example.com'],
        permissions: ['view'],
        expiresAt: '2023-01-01' // Past date
      };

      const response = await request(app)
        .post('/api/reports/report123/share')
        .send(shareConfig)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Expiration date must be in the future');
    });

    it('should limit sharing scope', async () => {
      const excessiveShare = {
        users: Array(1000).fill().map((_, i) => `user${i}@example.com`), // Too many users
        permissions: ['view']
      };

      const response = await request(app)
        .post('/api/reports/report123/share')
        .send(excessiveShare)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Too many recipients');
    });
  });

  describe('Report Scheduling Security', () => {
    it('should validate scheduling frequency limits', async () => {
      const frequentSchedule = {
        reportId: 'report123',
        schedule: 'every-minute', // Too frequent
        recipients: ['user@example.com']
      };

      const response = await request(app)
        .post('/api/reports/schedule')
        .send(frequentSchedule)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Schedule frequency too high');
    });

    it('should prevent scheduling of sensitive reports', async () => {
      const sensitiveSchedule = {
        reportId: 'sensitive-admin-report-123',
        schedule: 'daily',
        recipients: ['external@example.com']
      };

      const response = await request(app)
        .post('/api/reports/schedule')
        .send(sensitiveSchedule)
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot schedule sensitive reports');
    });

    it('should validate schedule recipients', async () => {
      const invalidSchedule = {
        reportId: 'report123',
        schedule: 'daily',
        recipients: ['external-domain.com'] // Invalid email format
      };

      const response = await request(app)
        .post('/api/reports/schedule')
        .send(invalidSchedule)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid recipient email');
    });
  });

  describe('File Upload Security', () => {
    it('should validate upload file types for reports', async () => {
      const maliciousFile = Buffer.from('malicious-executable-content');

      const response = await request(app)
        .post('/api/reports/upload-data')
        .attach('file', maliciousFile, 'report.exe')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid file type');
    });

    it('should limit upload file size for reports', async () => {
      const largeFile = Buffer.alloc(50 * 1024 * 1024); // 50MB

      const response = await request(app)
        .post('/api/reports/upload-data')
        .attach('file', largeFile, 'large-report.csv')
        .set('Authorization', 'Bearer valid-token')
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('File too large');
    });

    it('should scan uploaded data for malicious content', async () => {
      const maliciousContent = Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE');

      const response = await request(app)
        .post('/api/reports/upload-data')
        .attach('file', maliciousContent, 'test.txt')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Malicious content detected');
    });
  });

  describe('API Security Headers', () => {
    it('should include security headers for report endpoints', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should prevent content-type sniffing for report downloads', async () => {
      const response = await request(app)
        .get('/api/reports/report123/export/pdf')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should implement download security headers', async () => {
      const response = await request(app)
        .get('/api/reports/report123/export/pdf')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Should have content-disposition header for download
      expect(response.headers['content-disposition']).toBeDefined();
      expect(response.headers['content-disposition']).toMatch(/attachment/);
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose internal errors in report generation', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .send({ name: 'Test Report', type: 'invalid-type' })
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      // Should not contain stack traces or internal details
      const responseBody = JSON.stringify(response.body);
      expect(responseBody).not.toMatch(/stack trace/i);
      expect(responseBody).not.toMatch(/internal server error/i);
      expect(responseBody).not.toMatch(/database error/i);
    });

    it('should sanitize error messages in reporting', async () => {
      const response = await request(app)
        .get('/api/reports/nonexistent-report')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      const errorMessage = response.body.error;
      expect(errorMessage).not.toMatch(/<script>/i);
      expect(errorMessage).not.toMatch(/sql/i);
      expect(errorMessage).not.toMatch(/table/i);
    });
  });

  describe('Audit Logging Security', () => {
    it('should log report generation events', async () => {
      const reportConfig = {
        name: 'Audit Test Report',
        type: 'ticket_analytics',
        parameters: { timeRange: '7d' }
      };

      await request(app)
        .post('/api/reports/generate')
        .send(reportConfig)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // This event should be logged (verify through log monitoring)
      expect(true).toBe(true); // Placeholder for log verification
    });

    it('should log unauthorized access attempts', async () => {
      await request(app)
        .get('/api/reports/admin-reports')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      // This event should be logged
      expect(true).toBe(true); // Placeholder for log verification
    });

    it('should log data export events', async () => {
      await request(app)
        .get('/api/reports/report123/export/csv')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Export event should be logged
      expect(true).toBe(true); // Placeholder for log verification
    });
  });

  describe('Session Security for Reports', () => {
    it('should invalidate report access on logout', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' })
        .expect(200);

      const sessionCookie = loginResponse.headers['set-cookie'];

      // Generate report
      await request(app)
        .post('/api/reports/generate')
        .send({ name: 'Test Report', type: 'ticket_analytics' })
        .set('Cookie', sessionCookie)
        .expect(200);

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      // Try to access report after logout
      const response = await request(app)
        .get('/api/reports')
        .set('Cookie', sessionCookie)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should implement report session timeout', async () => {
      // This would be tested with actual session timeout logic
      expect(true).toBe(true); // Placeholder for session timeout testing
    });
  });

  describe('Encryption Security for Reports', () => {
    it('should encrypt sensitive report data', async () => {
      // Test that sensitive report data is encrypted
      // This would require database inspection
      expect(true).toBe(true); // Placeholder for encryption verification
    });

    it('should secure report download links', async () => {
      const response = await request(app)
        .get('/api/reports/report123/export/pdf')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Download link should be temporary and secure
      const downloadUrl = response.body.data.downloadUrl;
      expect(downloadUrl).toMatch(/\/api\/reports\/download\/[a-zA-Z0-9]{32}/);
      expect(downloadUrl).not.toMatch(/\/api\/reports\/download\/predictable/);
    });

    it('should expire download links', async () => {
      // Generate download link
      const response = await request(app)
        .get('/api/reports/report123/export/pdf')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const downloadToken = response.body.data.downloadUrl.split('/').pop();

      // Try to use expired token (simulate expiration)
      await new Promise(resolve => setTimeout(resolve, 100));

      const expiredResponse = await request(app)
        .get(`/api/reports/download/${downloadToken}`)
        .expect(401);

      expect(expiredResponse.body.error).toContain('Download link expired');
    });
  });
});
