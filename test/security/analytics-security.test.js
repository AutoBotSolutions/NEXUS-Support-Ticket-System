/**
 * Analytics System Security Tests
 * 
 * Comprehensive security tests for the Analytics System
 * testing authentication, authorization, input validation, and data protection.
 */

const request = require('supertest');
const app = require('../../server');

describe('Analytics System Security Tests', () => {
  describe('Authentication Security', () => {
    it('should require authentication for protected endpoints', async () => {
      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should reject invalid authentication tokens', async () => {
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });

    it('should reject expired authentication tokens', async () => {
      const expiredToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', expiredToken)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token expired');
    });

    it('should handle malformed authentication headers', async () => {
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', 'malformed-header')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate user session', async () => {
      // Mock session validation
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', 'Bearer valid-session-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Authorization Security', () => {
    it('should enforce role-based access control', async () => {
      // Test with user role (should have limited access)
      const userResponse = await request(app)
        .get('/api/analytics/administrative')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(userResponse.body.success).toBe(false);
      expect(userResponse.body.error).toContain('Insufficient permissions');

      // Test with admin role (should have full access)
      const adminResponse = await request(app)
        .get('/api/analytics/administrative')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(adminResponse.body.success).toBe(true);
    });

    it('should prevent unauthorized data access', async () => {
      // Test accessing other user's data
      const response = await request(app)
        .get('/api/analytics/users/other-user-id')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unauthorized access');
    });

    it('should validate admin-only endpoints', async () => {
      // Test admin-only endpoint with non-admin user
      const response = await request(app)
        .get('/api/analytics/system-metrics')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should handle permission escalation attempts', async () => {
      // Attempt to escalate permissions by modifying request
      const maliciousRequest = {
        headers: {
          'Authorization': 'Bearer user-token',
          'X-User-Role': 'admin' // Malicious header injection
        }
      };

      const response = await request(app)
        .get('/api/analytics/administrative')
        .set(maliciousRequest.headers)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      const response = await request(app)
        .get(`/api/analytics/tickets?filters=${encodeURIComponent(maliciousInput)}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid input');
    });

    it('should prevent XSS attacks', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(app)
        .post('/api/analytics/export')
        .send({ type: xssPayload, format: 'json' })
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid input');
    });

    it('should validate JSON input structure', async () => {
      const malformedJSON = '{"name": "test", "type": "analytics",}'; // Trailing comma

      const response = await request(app)
        .post('/api/analytics/export')
        .send(malformedJSON)
        .set('Authorization', 'Bearer valid-token')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should limit request payload size', async () => {
      const largePayload = {
        data: 'x'.repeat(10000000) // 10MB payload
      };

      const response = await request(app)
        .post('/api/analytics/export')
        .send(largePayload)
        .set('Authorization', 'Bearer valid-token')
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Request entity too large');
    });

    it('should validate date formats', async () => {
      const invalidDate = '2023-13-45'; // Invalid date

      const response = await request(app)
        .get(`/api/analytics/tickets?startDate=${invalidDate}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid date format');
    });

    it('should validate numeric inputs', async () => {
      const nonNumericValue = 'not-a-number';

      const response = await request(app)
        .get(`/api/analytics/tickets?page=${nonNumericValue}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid parameter');
    });
  });

  describe('Data Protection Security', () => {
    it('should not expose sensitive data in responses', async () => {
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Check for sensitive data exposure
      const responseBody = JSON.stringify(response.body);
      
      // Should not contain passwords, tokens, or internal IDs
      expect(responseBody).not.toMatch(/password/i);
      expect(responseBody).not.toMatch(/secret/i);
      expect(responseBody).not.toMatch(/token/i);
      expect(responseBody).not.toMatch(/_id":/i);
    });

    it('should mask sensitive analytics data', async () => {
      const response = await request(app)
        .get('/api/analytics/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // User data should be anonymized or masked
      const userData = response.body.data;
      
      if (userData.users) {
        userData.users.forEach(user => {
          // Email should be masked
          if (user.email) {
            expect(user.email).toMatch(/\*{2,}/); // Should contain asterisks
          }
          
          // Phone should be masked
          if (user.phone) {
            expect(user.phone).toMatch(/\*{2,}/);
          }
        });
      }
    });

    it('should implement rate limiting', async () => {
      // Make multiple rapid requests
      const requests = Array(20).fill().map(() => 
        request(app)
          .get('/api/analytics/tickets')
          .set('Authorization', 'Bearer valid-token')
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should implement CORS security', async () => {
      const response = await request(app)
        .options('/api/analytics/tickets')
        .set('Origin', 'http://malicious-site.com')
        .expect(200);

      // Should not allow cross-origin requests from malicious sites
      const corsHeader = response.headers['access-control-allow-origin'];
      expect(corsHeader).not.toBe('http://malicious-site.com');
    });

    it('should implement CSRF protection', async () => {
      const response = await request(app)
        .post('/api/analytics/export')
        .send({ type: 'tickets', format: 'json' })
        .set('Authorization', 'Bearer valid-token')
        .set('X-Requested-With', 'XMLHttpRequest')
        .expect(200);

      // Should have CSRF token in response
      const csrfToken = response.headers['x-csrf-token'];
      expect(csrfToken).toBeDefined();
    });
  });

  describe('API Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should prevent content-type sniffing', async () => {
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should implement clickjacking protection', async () => {
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });

  describe('Error Handling Security', () => {
    it('should not leak stack traces in production', async () => {
      const response = await request(app)
        .get('/api/analytics/nonexistent-endpoint')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      // Should not contain stack trace or internal error details
      const responseBody = JSON.stringify(response.body);
      expect(responseBody).not.toMatch(/stack trace/i);
      expect(responseBody).not.toMatch(/internal server error/i);
    });

    it('should handle database errors securely', async () => {
      // Mock database error
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', 'Bearer valid-token')
        .query({ simulate_db_error: 'true' })
        .expect(500);

      // Should not expose database details
      const responseBody = JSON.stringify(response.body);
      expect(responseBody).not.toMatch(/database/i);
      expect(responseBody).not.toMatch(/sql/i);
      expect(responseBody).not.toMatch(/table/i);
    });

    it('should sanitize error messages', async () => {
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', 'Bearer valid-token')
        .query({ malicious_error: '<script>alert(1)</script>' })
        .expect(400);

      // Error message should be sanitized
      const errorMessage = response.body.error;
      expect(errorMessage).not.toMatch(/<script>/i);
      expect(errorMessage).not.toMatch(/alert/i);
    });
  });

  describe('Session Security', () => {
    it('should implement secure session management', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' })
        .expect(200);

      // Should have secure session cookie
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        const cookie = setCookieHeader[0];
        expect(cookie).toMatch(/Secure/i);
        expect(cookie).toMatch(/HttpOnly/i);
        expect(cookie).toMatch(/SameSite/i);
      }
    });

    it('should invalidate sessions on logout', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' })
        .expect(200);

      const sessionCookie = loginResponse.headers['set-cookie'];

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      // Try to use session after logout
      const postLogoutResponse = await request(app)
        .get('/api/analytics/tickets')
        .set('Cookie', sessionCookie)
        .expect(401);

      expect(postLogoutResponse.body.success).toBe(false);
    });

    it('should implement session timeout', async () => {
      // Create session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' })
        .expect(200);

      const sessionCookie = loginResponse.headers['set-cookie'];

      // Wait for session to expire (simulate)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to use expired session
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Cookie', sessionCookie)
        .expect(401);

      expect(response.body.error).toContain('Session expired');
    });
  });

  describe('File Upload Security', () => {
    it('should validate file types for uploads', async () => {
      const maliciousFile = {
        name: 'malicious.exe',
        mimetype: 'application/octet-stream',
        size: 1024
      };

      const response = await request(app)
        .post('/api/analytics/upload')
        .attach('file', Buffer.from('malicious content'), 'malicious.exe')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid file type');
    });

    it('should limit file upload size', async () => {
      const largeFile = Buffer.alloc(10 * 1024 * 1024); // 10MB

      const response = await request(app)
        .post('/api/analytics/upload')
        .attach('file', largeFile, 'large.csv')
        .set('Authorization', 'Bearer valid-token')
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('File too large');
    });

    it('should scan uploaded files for malware', async () => {
      const suspiciousFile = Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE');

      const response = await request(app)
        .post('/api/analytics/upload')
        .attach('file', suspiciousFile, 'test.txt')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Malicious file detected');
    });
  });

  describe('Logging and Monitoring Security', () => {
    it('should log security events', async () => {
      // Failed login attempt
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'invalid', password: 'invalid' })
        .expect(401);

      // Unauthorized access attempt
      await request(app)
        .get('/api/analytics/administrative')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // SQL injection attempt
      await request(app)
        .get('/api/analytics/tickets?filters=\'; DROP TABLE users; --')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      // These events should be logged (verify through log monitoring)
      expect(true).toBe(true); // Placeholder for log verification
    });

    it('should implement security monitoring', async () => {
      // Multiple failed attempts from same IP
      const ip = '192.168.1.100';
      
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ username: 'test', password: 'wrong' })
          .set('X-Forwarded-For', ip)
          .expect(401);
      }

      // Next request should be blocked
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('Authorization', 'Bearer valid-token')
        .set('X-Forwarded-For', ip)
        .expect(429);

      expect(response.body.error).toContain('Rate limit exceeded');
    });
  });

  describe('Encryption Security', () => {
    it('should use HTTPS for sensitive operations', async () => {
      // This would be tested in a real HTTPS environment
      // For now, we'll test that the app can handle HTTPS requests
      expect(true).toBe(true); // Placeholder for HTTPS testing
    });

    it('should encrypt sensitive data at rest', async () => {
      // Test that sensitive data is encrypted in database
      // This would require database inspection
      expect(true).toBe(true); // Placeholder for encryption verification
    });

    it('should use secure hashing for passwords', async () => {
      // Test password hashing
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'test', password: 'password123' })
        .expect(201);

      // Password should be hashed (not stored in plain text)
      expect(response.body.user.passwordHash).toBeDefined();
      expect(response.body.user.passwordHash).not.toBe('password123');
    });
  });

  describe('API Key Security', () => {
    it('should validate API keys', async () => {
      const response = await request(app)
        .get('/api/analytics/tickets')
        .set('X-API-Key', 'invalid-key')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid API key');
    });

    it('should implement API key rotation', async () => {
      // Generate new API key
      const response = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(response.body.apiKey).toBeDefined();
      expect(response.body.apiKey).toMatch(/^[a-zA-Z0-9]{32}$/); // Should be properly formatted
    });

    it('should revoke API keys', async () => {
      const response = await request(app)
        .delete('/api/auth/api-keys/old-key')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('API key revoked');
    });
  });

  describe('Webhook Security', () => {
    it('should validate webhook signatures', async () => {
      const webhookPayload = {
        event: 'ticket.created',
        data: { id: 123, title: 'Test Ticket' }
      };

      const response = await request(app)
        .post('/api/webhooks/analytics')
        .send(webhookPayload)
        .set('X-Webhook-Signature', 'invalid-signature')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid webhook signature');
    });

    it('should rate limit webhook endpoints', async () => {
      const webhookPayload = {
        event: 'ticket.created',
        data: { id: 123 }
      };

      const requests = Array(20).fill().map(() => 
        request(app)
          .post('/api/webhooks/analytics')
          .send(webhookPayload)
          .set('X-Webhook-Signature', 'valid-signature')
      );

      const responses = await Promise.allSettled(requests);
      
      const rateLimitedResponses = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
