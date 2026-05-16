/**
 * NEXUS Security Testing Suite
 * Security vulnerability testing and penetration testing
 */

const request = require('supertest');
const app = require('../../server');
const { createTestUserWithToken, generateRandomEmail } = require('../utils/testUtils');

class SecurityTestSuite {
  constructor() {
    this.vulnerabilities = [];
    this.testResults = [];
    this.securityConfig = {
      sqlInjectionAttempts: [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES('hacker','pass'); --"
      ],
      xssAttempts: [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "javascript:alert('XSS')",
        "<svg onload=alert('XSS')>"
      ],
      pathTraversalAttempts: [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "....//....//....//etc/passwd",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
      ],
      csrfTokens: [],
      rateLimitThreshold: 100
    };
  }

  async runAllSecurityTests() {
    console.log('🔒 Starting Security Testing Suite...');
    
    const tests = [
      this.testAuthenticationBypass.bind(this),
      this.testAuthorizationBypass.bind(this),
      this.testSQLInjection.bind(this),
      this.testXSSVulnerabilities.bind(this),
      this.testPathTraversal.bind(this),
      this.testInputValidation.bind(this),
      this.testRateLimiting.bind(this),
      this.testSessionManagement.bind(this),
      this.testCSRFProtection.bind(this),
      this.testDataExposure.bind(this),
      this.testPasswordSecurity.bind(this),
      this.testAPISecurity.bind(this)
    ];

    const results = [];
    
    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
      } catch (error) {
        console.error(`Security test failed: ${error.message}`);
        results.push({
          testName: test.name,
          status: 'error',
          message: error.message,
          vulnerabilities: []
        });
      }
    }

    return this.generateSecurityReport(results);
  }

  async testAuthenticationBypass() {
    console.log('🔐 Testing Authentication Bypass...');
    
    const vulnerabilities = [];
    
    // Test 1: Empty token
    try {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', '')
        .expect(401);
      
      if (response.status !== 401) {
        vulnerabilities.push({
          type: 'Authentication Bypass',
          severity: 'high',
          description: 'Empty token not properly rejected',
          endpoint: '/api/users/profile'
        });
      }
    } catch (error) {
      // Expected to fail
    }

    // Test 2: Invalid token format
    try {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      if (response.status !== 401) {
        vulnerabilities.push({
          type: 'Authentication Bypass',
          severity: 'high',
          description: 'Invalid token not properly rejected',
          endpoint: '/api/users/profile'
        });
      }
    } catch (error) {
      // Expected to fail
    }

    // Test 3: Malformed token
    const malformedTokens = [
      'Bearer',
      'Bearer ',
      'Bearer .',
      'Bearer ..',
      'Bearer ...',
      'Bearer a.b',
      'Bearer a.b.c.d'
    ];

    for (const token of malformedTokens) {
      try {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', token)
          .expect(401);
        
        if (response.status !== 401) {
          vulnerabilities.push({
            type: 'Authentication Bypass',
            severity: 'medium',
            description: `Malformed token not rejected: ${token}`,
            endpoint: '/api/users/profile'
          });
        }
      } catch (error) {
        // Expected to fail
      }
    }

    return {
      testName: 'Authentication Bypass',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testAuthorizationBypass() {
    console.log('🛡️ Testing Authorization Bypass...');
    
    const vulnerabilities = [];
    
    // Create users with different roles
    const { user: regularUser, token: regularToken } = await createTestUserWithToken({ role: 'user' });
    const { user: agentUser, token: agentToken } = await createTestUserWithToken({ role: 'agent' });
    const { user: adminUser, token: adminToken } = await createTestUserWithToken({ role: 'admin' });

    // Test 1: Regular user accessing admin endpoints
    const adminEndpoints = [
      { method: 'GET', path: '/api/users' },
      { method: 'PUT', path: `/api/users/${regularUser._id}/role` },
      { method: 'DELETE', path: `/api/users/${regularUser._id}` }
    ];

    for (const endpoint of adminEndpoints) {
      try {
        let response;
        if (endpoint.method === 'GET') {
          response = await request(app)
            .get(endpoint.path)
            .set('Authorization', `Bearer ${regularToken}`);
        } else if (endpoint.method === 'PUT') {
          response = await request(app)
            .put(endpoint.path)
            .set('Authorization', `Bearer ${regularToken}`)
            .send({ role: 'admin' });
        } else if (endpoint.method === 'DELETE') {
          response = await request(app)
            .delete(endpoint.path)
            .set('Authorization', `Bearer ${regularToken}`);
        }

        if (response.status !== 403 && response.status !== 401) {
          vulnerabilities.push({
            type: 'Authorization Bypass',
            severity: 'high',
            description: `Regular user can access admin endpoint: ${endpoint.method} ${endpoint.path}`,
            endpoint: endpoint.path
          });
        }
      } catch (error) {
        // Expected to fail
      }
    }

    // Test 2: User accessing other user's resources
    const { user: otherUser, token: otherToken } = await createTestUserWithToken({
      username: 'otheruser',
      email: 'other@example.com'
    });

    const userResources = [
      { method: 'GET', path: `/api/users/profile` },
      { method: 'PUT', path: '/api/users/profile' }
    ];

    for (const resource of userResources) {
      try {
        let response;
        if (resource.method === 'GET') {
          response = await request(app)
            .get(resource.path)
            .set('Authorization', `Bearer ${otherToken}`);
        } else if (resource.method === 'PUT') {
          response = await request(app)
            .put(resource.path)
            .set('Authorization', `Bearer ${otherToken}`)
            .send({ username: 'hacked' });
        }

        // Should succeed for own resources, fail for others
        if (response.status === 200 && resource.method === 'PUT') {
          // Check if user can modify other user's profile
          const updatedUser = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${regularToken}`);
          
          if (updatedUser.body.data.username === 'hacked') {
            vulnerabilities.push({
              type: 'Authorization Bypass',
              severity: 'critical',
              description: 'User can modify other user\'s profile',
              endpoint: resource.path
            });
          }
        }
      } catch (error) {
        // Expected to fail
      }
    }

    return {
      testName: 'Authorization Bypass',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testSQLInjection() {
    console.log('💉 Testing SQL Injection...');
    
    const vulnerabilities = [];
    
    // Test SQL injection in various parameters
    const testPayloads = this.securityConfig.sqlInjectionAttempts;
    
    // Test in login form
    for (const payload of testPayloads) {
      try {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            email: payload,
            password: 'password123'
          });
        
        // Should not succeed with SQL injection
        if (response.status === 200) {
          vulnerabilities.push({
            type: 'SQL Injection',
            severity: 'critical',
            description: `SQL injection successful in login email: ${payload}`,
            endpoint: '/api/users/login'
          });
        }
      } catch (error) {
        // Expected to fail
      }
    }

    // Test in registration
    for (const payload of testPayloads) {
      try {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            username: payload,
            email: generateRandomEmail(),
            password: 'password123'
          });
        
        // Should not succeed with SQL injection
        if (response.status === 201) {
          vulnerabilities.push({
            type: 'SQL Injection',
            severity: 'critical',
            description: `SQL injection successful in registration username: ${payload}`,
            endpoint: '/api/users/register'
          });
        }
      } catch (error) {
        // Expected to fail
      }
    }

    // Test in search parameters
    const { token } = await createTestUserWithToken();
    
    for (const payload of testPayloads) {
      try {
        const response = await request(app)
          .get(`/api/tickets?search=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${token}`);
        
        // Should not cause server errors
        if (response.status >= 500) {
          vulnerabilities.push({
            type: 'SQL Injection',
            severity: 'high',
            description: `SQL injection caused server error in search: ${payload}`,
            endpoint: '/api/tickets'
          });
        }
      } catch (error) {
        // Expected to fail
      }
    }

    return {
      testName: 'SQL Injection',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testXSSVulnerabilities() {
    console.log('🎯 Testing XSS Vulnerabilities...');
    
    const vulnerabilities = [];
    
    const xssPayloads = this.securityConfig.xssAttempts;
    const { token } = await createTestUserWithToken();

    // Test XSS in ticket creation
    for (const payload of xssPayloads) {
      try {
        const response = await request(app)
          .post('/api/tickets')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: payload,
            description: 'Test description',
            priority: 'medium',
            category: 'general'
          });
        
        if (response.status === 201) {
          // Check if XSS is stored unescaped
          const ticketResponse = await request(app)
            .get(`/api/tickets/${response.body.data._id}`)
            .set('Authorization', `Bearer ${token}`);
          
          if (ticketResponse.body.data.title.includes('<script>') || 
              ticketResponse.body.data.title.includes('javascript:')) {
            vulnerabilities.push({
              type: 'XSS',
              severity: 'high',
              description: `XSS payload stored unescaped in ticket title: ${payload}`,
              endpoint: '/api/tickets'
            });
          }
        }
      } catch (error) {
        // Expected to fail
      }
    }

    // Test XSS in comments
    const createTicketResponse = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'XSS Test Ticket',
        description: 'Test description',
        priority: 'medium',
        category: 'general'
      });

    for (const payload of xssPayloads) {
      try {
        const response = await request(app)
          .post(`/api/tickets/${createTicketResponse.body.data._id}/comments`)
          .set('Authorization', `Bearer ${token}`)
          .send({ text: payload });
        
        if (response.status === 201) {
          // Check if XSS is stored unescaped
          const ticketResponse = await request(app)
            .get(`/api/tickets/${createTicketResponse.body.data._id}`)
            .set('Authorization', `Bearer ${token}`);
          
          const comment = ticketResponse.body.data.comments.find(c => c.text === payload);
          if (comment && (comment.text.includes('<script>') || comment.text.includes('javascript:'))) {
            vulnerabilities.push({
              type: 'XSS',
              severity: 'high',
              description: `XSS payload stored unescaped in comment: ${payload}`,
              endpoint: '/api/tickets/comments'
            });
          }
        }
      } catch (error) {
        // Expected to fail
      }
    }

    return {
      testName: 'XSS Vulnerabilities',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testPathTraversal() {
    console.log('📁 Testing Path Traversal...');
    
    const vulnerabilities = [];
    
    const pathTraversalPayloads = this.securityConfig.pathTraversalAttempts;
    const { token } = await createTestUserWithToken();

    // Test path traversal in file upload endpoints (if any)
    for (const payload of pathTraversalPayloads) {
      try {
        const response = await request(app)
          .get(`/api/files/${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${token}`);
        
        // Should not succeed or expose system files
        if (response.status === 200 && response.text.includes('root:')) {
          vulnerabilities.push({
            type: 'Path Traversal',
            severity: 'critical',
            description: `Path traversal successful: ${payload}`,
            endpoint: '/api/files'
          });
        }
      } catch (error) {
        // Expected to fail
      }
    }

    // Test path traversal in API parameters
    for (const payload of pathTraversalPayloads) {
      try {
        const response = await request(app)
          .get(`/api/tickets?file=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${token}`);
        
        if (response.status >= 500) {
          vulnerabilities.push({
            type: 'Path Traversal',
            severity: 'medium',
            description: `Path traversal caused server error: ${payload}`,
            endpoint: '/api/tickets'
          });
        }
      } catch (error) {
        // Expected to fail
      }
    }

    return {
      testName: 'Path Traversal',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testInputValidation() {
    console.log('✅ Testing Input Validation...');
    
    const vulnerabilities = [];
    
    const { token } = await createTestUserWithToken();

    // Test oversized inputs
    const oversizedInputs = [
      { field: 'username', value: 'a'.repeat(1000), endpoint: '/api/users/profile' },
      { field: 'title', value: 'a'.repeat(1000), endpoint: '/api/tickets' },
      { field: 'description', value: 'a'.repeat(10000), endpoint: '/api/tickets' }
    ];

    for (const input of oversizedInputs) {
      try {
        let response;
        if (input.endpoint === '/api/users/profile') {
          response = await request(app)
            .put(input.endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({ [input.field]: input.value });
        } else if (input.endpoint === '/api/tickets') {
          response = await request(app)
            .post(input.endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({
              [input.field]: input.value,
              description: 'Test description',
              priority: 'medium',
              category: 'general'
            });
        }

        if (response.status === 200 || response.status === 201) {
          vulnerabilities.push({
            type: 'Input Validation',
            severity: 'medium',
            description: `Oversized input accepted for ${input.field}`,
            endpoint: input.endpoint
          });
        }
      } catch (error) {
        // Expected to fail
      }
    }

    // Test special characters
    const specialChars = '!@#$%^&*(){}[]|\\:";\'<>?,./';
    
    try {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: specialChars,
          description: 'Test description',
          priority: 'medium',
          category: 'general'
        });
      
      if (response.status === 201) {
        // Check if special characters are properly handled
        const ticketResponse = await request(app)
          .get(`/api/tickets/${response.body.data._id}`)
          .set('Authorization', `Bearer ${token}`);
        
        if (ticketResponse.body.data.title === specialChars) {
          // This might be acceptable depending on requirements
          console.log('Special characters accepted in title (may be acceptable)');
        }
      }
    } catch (error) {
      // Expected to fail
    }

    return {
      testName: 'Input Validation',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testRateLimiting() {
    console.log('⏱️ Testing Rate Limiting...');
    
    const vulnerabilities = [];
    
    const { token } = await createTestUserWithToken();

    // Test rate limiting on login endpoint
    const loginAttempts = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 150; i++) {
      try {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });
        
        loginAttempts.push({
          attempt: i,
          status: response.status,
          timestamp: Date.now()
        });
        
        // If we get rate limited, break
        if (response.status === 429) {
          break;
        }
      } catch (error) {
        // Expected to fail
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Check if rate limiting is working
    const rateLimitedAttempts = loginAttempts.filter(a => a.status === 429);
    
    if (rateLimitedAttempts.length === 0) {
      vulnerabilities.push({
        type: 'Rate Limiting',
        severity: 'medium',
        description: 'No rate limiting detected on login endpoint',
        endpoint: '/api/users/login',
        attempts: loginAttempts.length,
        duration
      });
    }

    // Test rate limiting on ticket creation
    const ticketAttempts = [];
    
    for (let i = 0; i < 50; i++) {
      try {
        const response = await request(app)
          .post('/api/tickets')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: `Rate Limit Test ${i}`,
            description: 'Test description',
            priority: 'medium',
            category: 'general'
          });
        
        ticketAttempts.push({
          attempt: i,
          status: response.status
        });
        
        if (response.status === 429) {
          break;
        }
      } catch (error) {
        // Expected to fail
      }
    }

    const rateLimitedTicketAttempts = ticketAttempts.filter(a => a.status === 429);
    
    if (rateLimitedTicketAttempts.length === 0) {
      vulnerabilities.push({
        type: 'Rate Limiting',
        severity: 'low',
        description: 'No rate limiting detected on ticket creation',
        endpoint: '/api/tickets',
        attempts: ticketAttempts.length
      });
    }

    return {
      testName: 'Rate Limiting',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testSessionManagement() {
    console.log('🔑 Testing Session Management...');
    
    const vulnerabilities = [];
    
    // Test session fixation
    const { user, token } = await createTestUserWithToken();

    // Test if token works after logout
    await request(app)
      .post('/api/users/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    try {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      if (response.status === 200) {
        vulnerabilities.push({
          type: 'Session Management',
          severity: 'high',
          description: 'Token still works after logout',
          endpoint: '/api/users/profile'
        });
      }
    } catch (error) {
      // Expected to fail
    }

    // Test concurrent sessions
    const { token: token2 } = await createTestUserWithToken({
      username: 'concurrentuser',
      email: 'concurrent@example.com'
    });

    try {
      const response1 = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      const response2 = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token2}`);

      // Both should work (concurrent sessions allowed)
      if (response1.status !== 200 || response2.status !== 200) {
        vulnerabilities.push({
          type: 'Session Management',
          severity: 'low',
          description: 'Concurrent sessions not working properly',
          endpoint: '/api/users/profile'
        });
      }
    } catch (error) {
      vulnerabilities.push({
        type: 'Session Management',
        severity: 'medium',
        description: 'Error testing concurrent sessions',
        endpoint: '/api/users/profile'
      });
    }

    return {
      testName: 'Session Management',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testCSRFProtection() {
    console.log('🛡️ Testing CSRF Protection...');
    
    const vulnerabilities = [];
    
    // Test CSRF protection (if implemented)
    const { token } = await createTestUserWithToken();

    // Test POST without CSRF token (if CSRF is implemented)
    try {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'CSRF Test',
          description: 'Test description',
          priority: 'medium',
          category: 'general'
        });
      
      // If CSRF is implemented, this should fail without CSRF token
      // For now, we'll just note that CSRF protection should be considered
      if (response.status === 200 || response.status === 201) {
        vulnerabilities.push({
          type: 'CSRF Protection',
          severity: 'medium',
          description: 'CSRF protection not implemented or not working',
          endpoint: '/api/tickets',
          recommendation: 'Consider implementing CSRF protection for state-changing operations'
        });
      }
    } catch (error) {
      // Expected to fail if CSRF is implemented
    }

    return {
      testName: 'CSRF Protection',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testDataExposure() {
    console.log('🔍 Testing Data Exposure...');
    
    const vulnerabilities = [];
    
    // Test for sensitive data in responses
    const { user, token } = await createTestUserWithToken();

    // Check if password is exposed in user profile
    try {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      if (response.body.data.password) {
        vulnerabilities.push({
          type: 'Data Exposure',
          severity: 'high',
          description: 'Password exposed in user profile response',
          endpoint: '/api/users/profile'
        });
      }

      if (response.body.data.tokens) {
        vulnerabilities.push({
          type: 'Data Exposure',
          severity: 'medium',
          description: 'Tokens exposed in user profile response',
          endpoint: '/api/users/profile'
        });
      }
    } catch (error) {
      // Expected to fail
    }

    // Test for sensitive data in error messages
    try {
      const response = await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${token}`);
      
      if (response.status === 500 && response.text.includes('Error:')) {
        vulnerabilities.push({
          type: 'Data Exposure',
          severity: 'medium',
          description: 'Detailed error information exposed',
          endpoint: '/api/users/nonexistent'
        });
      }
    } catch (error) {
      // Expected to fail
    }

    return {
      testName: 'Data Exposure',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testPasswordSecurity() {
    console.log('🔐 Testing Password Security...');
    
    const vulnerabilities = [];
    
    // Test weak password acceptance
    const weakPasswords = [
      '123',
      'password',
      '123456',
      'qwerty',
      'admin',
      'root'
    ];

    for (const weakPassword of weakPasswords) {
      try {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            username: `weakuser${Date.now()}`,
            email: generateRandomEmail(),
            password: weakPassword
          });
        
        if (response.status === 201) {
          vulnerabilities.push({
            type: 'Password Security',
            severity: 'medium',
            description: `Weak password accepted: ${weakPassword}`,
            endpoint: '/api/users/register'
          });
        }
      } catch (error) {
        // Expected to fail
      }
    }

    return {
      testName: 'Password Security',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  async testAPISecurity() {
    console.log('🔌 Testing API Security...');
    
    const vulnerabilities = [];
    
    const { token } = await createTestUserWithToken();

    // Test for HTTP methods not allowed
    const disallowedMethods = ['PATCH', 'TRACE', 'CONNECT', 'OPTIONS'];
    const endpoints = ['/api/users/profile', '/api/tickets', '/api/health'];

    for (const endpoint of endpoints) {
      for (const method of disallowedMethods) {
        try {
          const response = await request(app)[method.toLowerCase()](endpoint)
            .set('Authorization', `Bearer ${token}`);
          
          if (response.status !== 405 && response.status !== 501) {
            vulnerabilities.push({
              type: 'API Security',
              severity: 'low',
              description: `Disallowed HTTP method ${method} accepted on ${endpoint}`,
              endpoint,
              method
            });
          }
        } catch (error) {
          // Expected to fail
        }
      }
    }

    // Test for API versioning
    try {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      if (response.status === 200) {
        // API versioning is implemented
        console.log('API versioning detected');
      }
    } catch (error) {
      vulnerabilities.push({
        type: 'API Security',
        severity: 'low',
        description: 'API versioning not implemented',
        endpoint: '/api/v1/users/profile',
        recommendation: 'Consider implementing API versioning'
      });
    }

    return {
      testName: 'API Security',
      status: vulnerabilities.length === 0 ? 'passed' : 'failed',
      vulnerabilities
    };
  }

  generateSecurityReport(testResults) {
    const totalVulnerabilities = testResults.reduce((sum, result) => sum + result.vulnerabilities.length, 0);
    const criticalVulnerabilities = testResults.reduce((sum, result) => 
      sum + result.vulnerabilities.filter(v => v.severity === 'critical').length, 0);
    const highVulnerabilities = testResults.reduce((sum, result) => 
      sum + result.vulnerabilities.filter(v => v.severity === 'high').length, 0);
    const mediumVulnerabilities = testResults.reduce((sum, result) => 
      sum + result.vulnerabilities.filter(v => v.severity === 'medium').length, 0);
    const lowVulnerabilities = testResults.reduce((sum, result) => 
      sum + result.vulnerabilities.filter(v => v.severity === 'low').length, 0);

    const passedTests = testResults.filter(result => result.status === 'passed').length;
    const failedTests = testResults.filter(result => result.status === 'failed').length;

    const securityScore = Math.max(0, 100 - (criticalVulnerabilities * 20) - (highVulnerabilities * 10) - (mediumVulnerabilities * 5) - (lowVulnerabilities * 1));

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: testResults.length,
        passedTests,
        failedTests,
        totalVulnerabilities,
        criticalVulnerabilities,
        highVulnerabilities,
        mediumVulnerabilities,
        lowVulnerabilities,
        securityScore
      },
      testResults,
      recommendations: this.generateSecurityRecommendations(testResults),
      overallStatus: securityScore >= 80 ? 'secure' : securityScore >= 60 ? 'moderate' : 'vulnerable'
    };
  }

  generateSecurityRecommendations(testResults) {
    const recommendations = [];
    const vulnerabilities = testResults.flatMap(result => result.vulnerabilities);

    if (vulnerabilities.some(v => v.type === 'Authentication Bypass')) {
      recommendations.push('Implement proper token validation and revocation');
    }

    if (vulnerabilities.some(v => v.type === 'Authorization Bypass')) {
      recommendations.push('Strengthen role-based access controls');
    }

    if (vulnerabilities.some(v => v.type === 'SQL Injection')) {
      recommendations.push('Use parameterized queries and input sanitization');
    }

    if (vulnerabilities.some(v => v.type === 'XSS')) {
      recommendations.push('Implement proper output encoding and CSP headers');
    }

    if (vulnerabilities.some(v => v.type === 'Rate Limiting')) {
      recommendations.push('Implement rate limiting on all public endpoints');
    }

    if (vulnerabilities.some(v => v.type === 'Data Exposure')) {
      recommendations.push('Review API responses for sensitive data exposure');
    }

    if (vulnerabilities.some(v => v.type === 'Password Security')) {
      recommendations.push('Implement stronger password policies');
    }

    if (vulnerabilities.length === 0) {
      recommendations.push('Continue regular security testing and monitoring');
    }

    return recommendations;
  }
}

// Test runner functions
async function runAllSecurityTests() {
  const testSuite = new SecurityTestSuite();
  
  try {
    const report = await testSuite.runAllSecurityTests();
    
    console.log('\n🔒 Security Test Summary:');
    console.log('============================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Total Vulnerabilities: ${report.summary.totalVulnerabilities}`);
    console.log(`Critical: ${report.summary.criticalVulnerabilities}`);
    console.log(`High: ${report.summary.highVulnerabilities}`);
    console.log(`Medium: ${report.summary.mediumVulnerabilities}`);
    console.log(`Low: ${report.summary.lowVulnerabilities}`);
    console.log(`Security Score: ${report.summary.securityScore}/100`);
    console.log(`Overall Status: ${report.summary.overallStatus}`);
    
    console.log('\n💡 Security Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`- ${rec}`);
    });
    
    return report;
  } catch (error) {
    console.error('Security test failed:', error);
    throw error;
  }
}

// Export for use in test scripts
module.exports = {
  SecurityTestSuite,
  runAllSecurityTests
};

// Run tests if called directly
if (require.main === module) {
  runAllSecurityTests()
    .then(() => {
      console.log('\n✅ Security tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Security tests failed:', error);
      process.exit(1);
    });
}
