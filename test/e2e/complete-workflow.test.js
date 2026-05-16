/**
 * Complete Workflow End-to-End Tests
 * Tests the entire NEXUS system workflow from user registration to ticket resolution
 */

const request = require('supertest');
const app = require('../../server');
const { createTestUserWithToken, generateRandomEmail } = require('../utils/testUtils');

describe('Complete System Workflow E2E Tests', () => {
  describe('User Registration to Ticket Resolution Workflow', () => {
    test('should complete full user journey', async () => {
      // Step 1: User Registration
      const userData = {
        username: 'newuser',
        email: generateRandomEmail(),
        password: 'SecurePassword123!'
      };

      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.username).toBe(userData.username);
      const userToken = registerResponse.body.data.token;

      // Step 2: User Login (test login flow)
      await request(app)
        .post('/api/users/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const newToken = loginResponse.body.data.token;

      // Step 3: Get User Profile
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.username).toBe(userData.username);

      // Step 4: Create Support Ticket
      const ticketData = {
        title: 'Need Help with Account Setup',
        description: 'I need assistance setting up my account preferences',
        priority: 'medium',
        category: 'general'
      };

      const ticketResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${newToken}`)
        .send(ticketData)
        .expect(201);

      expect(ticketResponse.body.success).toBe(true);
      const ticketId = ticketResponse.body.data._id;

      // Step 5: View Created Ticket
      const viewTicketResponse = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(viewTicketResponse.body.success).toBe(true);
      expect(viewTicketResponse.body.data.title).toBe(ticketData.title);
      expect(viewTicketResponse.body.data.status).toBe('open');

      // Step 6: Add Comment to Ticket
      const commentResponse = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${newToken}`)
        .send({ text: 'I have tried the suggested solutions but still need help' })
        .expect(201);

      expect(commentResponse.body.success).toBe(true);

      // Step 7: View User's Tickets List
      const ticketsListResponse = await request(app)
        .get('/api/tickets/my')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(ticketsListResponse.body.success).toBe(true);
      expect(ticketsListResponse.body.data.tickets).toHaveLength(1);
      expect(ticketsListResponse.body.data.tickets[0]._id).toBe(ticketId);

      // Step 8: Update User Profile
      const updateProfileResponse = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .send({ username: 'updatedusername' })
        .expect(200);

      expect(updateProfileResponse.body.success).toBe(true);
      expect(updateProfileResponse.body.data.username).toBe('updatedusername');

      // Step 9: Logout
      const logoutResponse = await request(app)
        .post('/api/users/logout')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Verify token is invalidated
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(401);
    });
  });

  describe('Admin Workflow E2E Tests', () => {
    test('should complete admin management workflow', async () => {
      // Step 1: Create Admin User
      const { user: admin, token: adminToken } = await createTestUserWithToken({ role: 'admin' });

      // Step 2: Create Regular Users
      const user1Data = {
        username: 'user1',
        email: generateRandomEmail(),
        password: 'Password123!'
      };

      const user2Data = {
        username: 'user2',
        email: generateRandomEmail(),
        password: 'Password123!'
      };

      await request(app)
        .post('/api/users/register')
        .send(user1Data)
        .expect(201);

      await request(app)
        .post('/api/users/register')
        .send(user2Data)
        .expect(201);

      // Step 3: View All Users
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(usersResponse.body.success).toBe(true);
      expect(usersResponse.body.data.users.length).toBeGreaterThan(2);

      // Step 4: Create Agent User
      const agentData = {
        username: 'supportagent',
        email: generateRandomEmail(),
        password: 'AgentPassword123!'
      };

      const agentResponse = await request(app)
        .post('/api/users/register')
        .send(agentData)
        .expect(201);

      const agentToken = agentResponse.body.data.token;
      const agentId = agentResponse.body.data.user._id;

      // Step 5: Promote User to Agent
      const promoteResponse = await request(app)
        .put(`/api/users/${agentId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'agent' })
        .expect(200);

      expect(promoteResponse.body.success).toBe(true);
      expect(promoteResponse.body.data.role).toBe('agent');

      // Step 6: Create Test Tickets
      const { user: regularUser, token: userToken } = await createTestUserWithToken();

      const ticket1Response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'High Priority Bug',
          description: 'Critical system bug',
          priority: 'high',
          category: 'bug'
        })
        .expect(201);

      const ticket2Response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Feature Request',
          description: 'New feature request',
          priority: 'medium',
          category: 'feature'
        })
        .expect(201);

      // Step 7: Assign Tickets to Agent
      await request(app)
        .put(`/api/tickets/${ticket1Response.body.data._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ agentId })
        .expect(200);

      await request(app)
        .put(`/api/tickets/${ticket2Response.body.data._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ agentId })
        .expect(200);

      // Step 8: View System Statistics
      const statsResponse = await request(app)
        .get('/api/tickets/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.total).toBeGreaterThan(0);

      // Step 9: View All Tickets
      const allTicketsResponse = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(allTicketsResponse.body.success).toBe(true);
      expect(allTicketsResponse.body.data.tickets.length).toBeGreaterThan(0);

      // Step 10: Monitor System Health
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);

      expect(healthResponse.body.success).toBe(true);
      expect(healthResponse.body.data.status).toBe('healthy');
    });
  });

  describe('Agent Workflow E2E Tests', () => {
    test('should complete agent support workflow', async () => {
      // Step 1: Create Agent and Regular User
      const { user: agent, token: agentToken } = await createTestUserWithToken({ role: 'agent' });
      const { user: regularUser, token: userToken } = await createTestUserWithToken();

      // Step 2: User Creates Support Ticket
      const ticketResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Login Issue',
          description: 'Cannot login to my account',
          priority: 'high',
          category: 'bug'
        })
        .expect(201);

      const ticketId = ticketResponse.body.data._id;

      // Step 3: Agent Views Assigned Tickets
      await request(app)
        .put(`/api/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ agentId: agent._id })
        .expect(403); // Agent cannot assign to themselves

      // Admin assigns ticket to agent
      const { user: admin, token: adminToken } = await createTestUserWithToken({ role: 'admin' });
      await request(app)
        .put(`/api/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ agentId: agent._id })
        .expect(200);

      // Step 4: Agent Views Their Tickets
      const agentTicketsResponse = await request(app)
        .get('/api/tickets/assigned')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(agentTicketsResponse.body.success).toBe(true);
      expect(agentTicketsResponse.body.data.tickets).toHaveLength(1);

      // Step 5: Agent Adds Comment
      const commentResponse = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ text: 'I am looking into your login issue. Can you provide more details?' })
        .expect(201);

      expect(commentResponse.body.success).toBe(true);

      // Step 6: Agent Updates Ticket Status
      const statusResponse = await request(app)
        .put(`/api/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.status).toBe('in_progress');

      // Step 7: User Responds to Comment
      await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'I get an error message when trying to login' })
        .expect(201);

      // Step 8: Agent Resolves Ticket
      const resolveResponse = await request(app)
        .put(`/api/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ status: 'resolved' })
        .expect(200);

      expect(resolveResponse.body.success).toBe(true);
      expect(resolveResponse.body.data.status).toBe('resolved');

      // Step 9: User Views Resolved Ticket
      const finalTicketResponse = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalTicketResponse.body.success).toBe(true);
      expect(finalTicketResponse.body.data.status).toBe('resolved');
      expect(finalTicketResponse.body.data.comments).toHaveLength(3);
    });
  });

  describe('GitHub Integration Workflow E2E Tests', () => {
    test('should complete GitHub integration workflow', async () => {
      // Step 1: Create User with GitHub Account
      const { user: testUser, token: userToken } = await createTestUserWithToken();

      // Step 2: Link GitHub Account (mock)
      const githubLinkResponse = await request(app)
        .post('/api/github/link')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          githubToken: 'mock-github-token',
          githubUsername: 'testuser'
        })
        .expect(200);

      expect(githubLinkResponse.body.success).toBe(true);

      // Step 3: Create Ticket Related to GitHub Issue
      const ticketResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'GitHub Integration Issue',
          description: 'Issue with GitHub integration',
          priority: 'medium',
          category: 'bug',
          githubIssue: 'https://github.com/testuser/nexus/issues/123'
        })
        .expect(201);

      const ticketId = ticketResponse.body.data._id;

      // Step 4: Sync with GitHub (mock)
      const syncResponse = await request(app)
        .post(`/api/tickets/${ticketId}/github/sync`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(syncResponse.body.success).toBe(true);

      // Step 5: Create GitHub Issue from Ticket
      const createIssueResponse = await request(app)
        .post(`/api/tickets/${ticketId}/github/issue`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'GitHub Issue from Ticket',
          body: 'This issue was created from a support ticket'
        })
        .expect(200);

      expect(createIssueResponse.body.success).toBe(true);

      // Step 6: Get GitHub Status
      const githubStatusResponse = await request(app)
        .get('/api/github/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(githubStatusResponse.body.success).toBe(true);
      expect(githubStatusResponse.body.data.linked).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases E2E Tests', () => {
    test('should handle concurrent operations gracefully', async () => {
      const { user: testUser, token: userToken } = await createTestUserWithToken();

      // Create multiple tickets concurrently
      const ticketPromises = [];
      for (let i = 0; i < 10; i++) {
        ticketPromises.push(
          request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              title: `Concurrent Ticket ${i}`,
              description: `Description ${i}`,
              priority: 'medium',
              category: 'general'
            })
        );
      }

      const responses = await Promise.all(ticketPromises);

      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(`Concurrent Ticket ${index}`);
      });

      // Verify all tickets were created
      const ticketsResponse = await request(app)
        .get('/api/tickets/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(ticketsResponse.body.success).toBe(true);
      expect(ticketsResponse.body.data.tickets).toHaveLength(10);
    });

    test('should handle invalid data gracefully', async () => {
      const { user: testUser, token: userToken } = await createTestUserWithToken();

      // Test invalid ticket creation
      const invalidTicketResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '', // Invalid: empty title
          description: 'Valid description',
          priority: 'invalid', // Invalid: wrong priority
          category: 'invalid' // Invalid: wrong category
        })
        .expect(400);

      expect(invalidTicketResponse.body.success).toBe(false);

      // Test invalid user update
      const invalidUpdateResponse = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'invalid-email', // Invalid email format
          role: 'admin' // Invalid: cannot change role
        })
        .expect(400);

      expect(invalidUpdateResponse.body.success).toBe(false);
    });

    test('should handle authentication edge cases', async () => {
      // Test with expired token (mock)
      const expiredTokenResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(expiredTokenResponse.body.success).toBe(false);

      // Test with malformed token
      const malformedTokenResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);

      expect(malformedTokenResponse.body.success).toBe(false);

      // Test without token
      const noTokenResponse = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(noTokenResponse.body.success).toBe(false);
    });
  });

  describe('Performance and Load E2E Tests', () => {
    test('should handle high load operations', async () => {
      const { user: testUser, token: userToken } = await createTestUserWithToken();

      // Create 100 tickets
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              title: `Load Test Ticket ${i}`,
              description: `Load test description ${i}`,
              priority: 'medium',
              category: 'general'
            })
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // Verify all tickets were created successfully
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Performance should be reasonable
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Test listing performance
      const listStartTime = Date.now();
      const listResponse = await request(app)
        .get('/api/tickets/my?limit=100')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const listEndTime = Date.now();

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.tickets).toHaveLength(100);
      expect(listEndTime - listStartTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
