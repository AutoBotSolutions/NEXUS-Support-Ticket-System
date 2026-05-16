/**
 * Tickets Integration Tests
 * Tests the complete ticket management workflow
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Ticket = require('../../models/Ticket');
const { createTestUserWithToken, generateRandomString } = require('../utils/testUtils');

describe('Tickets Integration Tests', () => {
  let adminUser, adminToken;
  let agentUser, agentToken;
  let regularUser, regularToken;

  beforeEach(async () => {
    // Create test users with different roles
    ({ user: adminUser, token: adminToken } = await createTestUserWithToken({ role: 'admin' }));
    ({ user: agentUser, token: agentToken } = await createTestUserWithToken({ role: 'agent' }));
    ({ user: regularUser, token: regularToken } = await createTestUserWithToken({ role: 'user' }));
  });

  describe('Complete Ticket Lifecycle', () => {
    test('should create, assign, update, and close ticket', async () => {
      // Step 1: Create ticket as regular user
      const ticketData = {
        title: 'Integration Test Ticket',
        description: 'This is a test for the complete ticket lifecycle',
        priority: 'medium',
        category: 'general'
      };

      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(ticketData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const ticketId = createResponse.body.data._id;

      // Step 2: Get ticket details
      const getResponse = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.title).toBe(ticketData.title);
      expect(getResponse.body.data.status).toBe('open');

      // Step 3: Assign ticket to agent (as admin)
      const assignResponse = await request(app)
        .put(`/api/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ agentId: agentUser._id })
        .expect(200);

      expect(assignResponse.body.success).toBe(true);
      expect(assignResponse.body.data.assignedTo._id).toBe(agentUser._id.toString());
      expect(assignResponse.body.data.status).toBe('in_progress');

      // Step 4: Add comment as agent
      const commentResponse = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ text: 'Working on this issue...' })
        .expect(201);

      expect(commentResponse.body.success).toBe(true);
      expect(commentResponse.body.data.text).toBe('Working on this issue...');

      // Step 5: Update ticket status as agent
      const updateResponse = await request(app)
        .put(`/api/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ status: 'resolved' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.status).toBe('resolved');

      // Step 6: Verify final state
      const finalResponse = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(finalResponse.body.success).toBe(true);
      expect(finalResponse.body.data.status).toBe('resolved');
      expect(finalResponse.body.data.comments).toHaveLength(1);
    });

    test('should handle ticket escalation workflow', async () => {
      // Create high priority ticket
      const ticketData = {
        title: 'Critical System Issue',
        description: 'System is completely down',
        priority: 'high',
        category: 'bug'
      };

      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(ticketData)
        .expect(201);

      const ticketId = createResponse.body.data._id;

      // Assign to agent
      await request(app)
        .put(`/api/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ agentId: agentUser._id });

      // Agent adds comment about complexity
      await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ text: 'This requires senior developer assistance' });

      // Admin escalates priority
      const escalateResponse = await request(app)
        .put(`/api/tickets/${ticketId}/priority`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ priority: 'critical' })
        .expect(200);

      expect(escalateResponse.body.success).toBe(true);
      expect(escalateResponse.body.data.priority).toBe('critical');

      // Verify escalation was logged
      const ticket = await Ticket.findById(ticketId);
      expect(ticket.priority).toBe('critical');
      expect(ticket.comments).toHaveLength(2);
    });
  });

  describe('Ticket Permissions and Access Control', () => {
    test('should enforce proper access control', async () => {
      // Create ticket as regular user
      const ticketData = {
        title: 'Access Control Test',
        description: 'Testing access control',
        priority: 'medium',
        category: 'general'
      };

      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(ticketData)
        .expect(201);

      const ticketId = createResponse.body.data._id;

      // User can view their own ticket
      await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      // Agent can view all tickets
      await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      // Admin can view all tickets
      await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // User cannot assign tickets
      await request(app)
        .put(`/api/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ agentId: agentUser._id })
        .expect(403);

      // Agent can assign tickets
      await request(app)
        .put(`/api/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ agentId: agentUser._id })
        .expect(403); // Agent can't assign to themselves

      // Admin can assign tickets
      await request(app)
        .put(`/api/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ agentId: agentUser._id })
        .expect(200);
    });

    test('should prevent unauthorized access to other users tickets', async () => {
      // Create ticket as regular user
      const ticketData = {
        title: 'Private Ticket',
        description: 'This should be private',
        priority: 'medium',
        category: 'general'
      };

      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(ticketData)
        .expect(201);

      const ticketId = createResponse.body.data._id;

      // Create another user
      const { token: otherUserToken } = await createTestUserWithToken({ 
        username: 'otheruser',
        email: 'other@example.com'
      });

      // Other user cannot access the ticket
      await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      // Other user cannot update the ticket
      await request(app)
        .put(`/api/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ status: 'resolved' })
        .expect(403);

      // Other user cannot add comments
      await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ text: 'Unauthorized comment' })
        .expect(403);
    });
  });

  describe('Ticket Search and Filtering', () => {
    beforeEach(async () => {
      // Create multiple tickets for testing
      const tickets = [
        { title: 'Bug Report', priority: 'high', status: 'open', category: 'bug' },
        { title: 'Feature Request', priority: 'medium', status: 'pending', category: 'feature' },
        { title: 'General Question', priority: 'low', status: 'closed', category: 'general' },
        { title: 'Critical Issue', priority: 'critical', status: 'in_progress', category: 'bug' },
        { title: 'Documentation Update', priority: 'medium', status: 'resolved', category: 'documentation' }
      ];

      for (const ticket of tickets) {
        await request(app)
          .post('/api/tickets')
          .set('Authorization', `Bearer ${regularToken}`)
          .send({ ...ticket, description: `Test description for ${ticket.title}` });
      }
    });

    test('should filter tickets by status', async () => {
      const response = await request(app)
        .get('/api/tickets?status=open')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toHaveLength(1);
      expect(response.body.data.tickets[0].status).toBe('open');
    });

    test('should filter tickets by priority', async () => {
      const response = await request(app)
        .get('/api/tickets?priority=medium')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toHaveLength(2);
      expect(response.body.data.tickets.every(ticket => ticket.priority === 'medium')).toBe(true);
    });

    test('should filter tickets by category', async () => {
      const response = await request(app)
        .get('/api/tickets?category=bug')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toHaveLength(2);
      expect(response.body.data.tickets.every(ticket => ticket.category === 'bug')).toBe(true);
    });

    test('should search tickets by title', async () => {
      const response = await request(app)
        .get('/api/tickets?search=Bug')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toHaveLength(2);
      expect(response.body.data.tickets.every(ticket => ticket.title.includes('Bug'))).toBe(true);
    });

    test('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/tickets?status=open&priority=high')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toHaveLength(1);
      expect(response.body.data.tickets[0].status).toBe('open');
      expect(response.body.data.tickets[0].priority).toBe('high');
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/tickets?page=1&limit=2')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.total).toBe(5);
    });
  });

  describe('Ticket Statistics and Analytics', () => {
    beforeEach(async () => {
      // Create tickets with different statuses and priorities
      const tickets = [
        { title: 'Open High', priority: 'high', status: 'open' },
        { title: 'Open Medium', priority: 'medium', status: 'open' },
        { title: 'Closed High', priority: 'high', status: 'closed' },
        { title: 'Resolved Medium', priority: 'medium', status: 'resolved' },
        { title: 'In Progress Low', priority: 'low', status: 'in_progress' }
      ];

      for (const ticket of tickets) {
        await request(app)
          .post('/api/tickets')
          .set('Authorization', `Bearer ${regularToken}`)
          .send({ ...ticket, description: `Test description for ${ticket.title}` });
      }
    });

    test('should get ticket statistics', async () => {
      const response = await request(app)
        .get('/api/tickets/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(5);
      expect(response.body.data.byStatus.open).toBe(2);
      expect(response.body.data.byStatus.closed).toBe(1);
      expect(response.body.data.byStatus.resolved).toBe(1);
      expect(response.body.data.byStatus.in_progress).toBe(1);
      expect(response.body.data.byPriority.high).toBe(2);
      expect(response.body.data.byPriority.medium).toBe(2);
      expect(response.body.data.byPriority.low).toBe(1);
    });

    test('should get user-specific statistics', async () => {
      const response = await request(app)
        .get('/api/tickets/statistics/user')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(5);
      expect(response.body.data.byStatus.open).toBe(2);
      expect(response.body.data.byStatus.closed).toBe(1);
      expect(response.body.data.byStatus.resolved).toBe(1);
      expect(response.body.data.byStatus.in_progress).toBe(1);
    });
  });

  describe('Ticket Comments and Communication', () => {
    test('should handle comment thread correctly', async () => {
      // Create ticket
      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          title: 'Comment Thread Test',
          description: 'Testing comment functionality',
          priority: 'medium',
          category: 'general'
        })
        .expect(201);

      const ticketId = createResponse.body.data._id;

      // Add multiple comments from different users
      const comments = [
        { text: 'Initial comment from user', token: regularToken },
        { text: 'Agent response', token: agentToken },
        { text: 'User follow-up', token: regularToken },
        { text: 'Agent resolution', token: agentToken }
      ];

      for (const comment of comments) {
        await request(app)
          .post(`/api/tickets/${ticketId}/comments`)
          .set('Authorization', `Bearer ${comment.token}`)
          .send({ text: comment.text })
          .expect(201);
      }

      // Verify all comments are present
      const response = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toHaveLength(4);
      expect(response.body.data.comments[0].text).toBe('Initial comment from user');
      expect(response.body.data.comments[1].text).toBe('Agent response');
      expect(response.body.data.comments[2].text).toBe('User follow-up');
      expect(response.body.data.comments[3].text).toBe('Agent resolution');
    });

    test('should prevent unauthorized comments', async () => {
      // Create ticket
      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          title: 'Unauthorized Comment Test',
          description: 'Testing comment permissions',
          priority: 'medium',
          category: 'general'
        })
        .expect(201);

      const ticketId = createResponse.body.data._id;

      // Create another user
      const { token: otherUserToken } = await createTestUserWithToken({ 
        username: 'otheruser',
        email: 'other@example.com'
      });

      // Other user cannot comment
      await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ text: 'Unauthorized comment' })
        .expect(403);
    });
  });

  describe('Ticket Performance and Load Testing', () => {
    test('should handle concurrent ticket creation', async () => {
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${regularToken}`)
            .send({
              title: `Concurrent Ticket ${i}`,
              description: `Test description ${i}`,
              priority: 'medium',
              category: 'general'
            })
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(`Concurrent Ticket ${index}`);
      });
    });

    test('should maintain performance with large ticket lists', async () => {
      // Create 50 tickets
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${regularToken}`)
            .send({
              title: `Performance Test ${i}`,
              description: `Test description ${i}`,
              priority: 'medium',
              category: 'general'
            })
        );
      }

      await Promise.all(promises);

      // Test listing performance
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/tickets?limit=50')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
