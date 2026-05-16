/**
 * Ticket Model Unit Tests
 */

const Ticket = require('../../../models/Ticket');
const User = require('../../../models/User');
const { createTestUser, createTestTicket, generateRandomString } = require('../utils/testUtils');

describe('Ticket Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  describe('Ticket Creation', () => {
    test('should create a ticket with valid data', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'This is a test ticket',
        priority: 'medium',
        status: 'open',
        category: 'general',
        createdBy: testUser._id
      };

      const ticket = await Ticket.create(ticketData);

      expect(ticket).toBeDefined();
      expect(ticket.title).toBe(ticketData.title);
      expect(ticket.description).toBe(ticketData.description);
      expect(ticket.priority).toBe(ticketData.priority);
      expect(ticket.status).toBe(ticketData.status);
      expect(ticket.category).toBe(ticketData.category);
      expect(ticket.createdBy.toString()).toBe(testUser._id.toString());
    });

    test('should require title', async () => {
      const ticketData = {
        description: 'This is a test ticket',
        priority: 'medium',
        status: 'open',
        category: 'general',
        createdBy: testUser._id
      };

      await expect(Ticket.create(ticketData)).rejects.toThrow();
    });

    test('should require description', async () => {
      const ticketData = {
        title: 'Test Ticket',
        priority: 'medium',
        status: 'open',
        category: 'general',
        createdBy: testUser._id
      };

      await expect(Ticket.create(ticketData)).rejects.toThrow();
    });

    test('should require createdBy', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'This is a test ticket',
        priority: 'medium',
        status: 'open',
        category: 'general'
      };

      await expect(Ticket.create(ticketData)).rejects.toThrow();
    });

    test('should validate priority', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'This is a test ticket',
        priority: 'invalid-priority',
        status: 'open',
        category: 'general',
        createdBy: testUser._id
      };

      await expect(Ticket.create(ticketData)).rejects.toThrow();
    });

    test('should validate status', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'This is a test ticket',
        priority: 'medium',
        status: 'invalid-status',
        category: 'general',
        createdBy: testUser._id
      };

      await expect(Ticket.create(ticketData)).rejects.toThrow();
    });

    test('should validate category', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'This is a test ticket',
        priority: 'medium',
        status: 'open',
        category: 'invalid-category',
        createdBy: testUser._id
      };

      await expect(Ticket.create(ticketData)).rejects.toThrow();
    });
  });

  describe('Ticket Methods', () => {
    test('should assign ticket to agent', async () => {
      const agent = await createTestUser({ role: 'agent' });
      const ticket = await createTestTicket({ createdBy: testUser._id });

      await ticket.assignToAgent(agent._id);

      expect(ticket.assignedTo.toString()).toBe(agent._id.toString());
      expect(ticket.status).toBe('in_progress');
      expect(ticket.assignedAt).toBeDefined();
    });

    test('should update ticket status', async () => {
      const ticket = await createTestTicket({ createdBy: testUser._id });

      await ticket.updateStatus('resolved');

      expect(ticket.status).toBe('resolved');
      expect(ticket.resolvedAt).toBeDefined();
      expect(ticket.resolvedBy.toString()).toBe(testUser._id.toString());
    });

    test('should add comment to ticket', async () => {
      const ticket = await createTestTicket({ createdBy: testUser._id });
      const commentData = {
        text: 'This is a comment',
        author: testUser._id
      };

      await ticket.addComment(commentData);

      expect(ticket.comments).toHaveLength(1);
      expect(ticket.comments[0].text).toBe(commentData.text);
      expect(ticket.comments[0].author.toString()).toBe(commentData.author.toString());
      expect(ticket.comments[0].createdAt).toBeDefined();
    });

    test('should update ticket priority', async () => {
      const ticket = await createTestTicket({ createdBy: testUser._id });

      await ticket.updatePriority('high');

      expect(ticket.priority).toBe('high');
      expect(ticket.priorityUpdatedAt).toBeDefined();
    });

    test('should close ticket', async () => {
      const ticket = await createTestTicket({ createdBy: testUser._id });

      await ticket.closeTicket();

      expect(ticket.status).toBe('closed');
      expect(ticket.closedAt).toBeDefined();
      expect(ticket.closedBy.toString()).toBe(testUser._id.toString());
    });

    test('should reopen ticket', async () => {
      const ticket = await createTestTicket({ createdBy: testUser._id });
      await ticket.closeTicket();

      await ticket.reopenTicket();

      expect(ticket.status).toBe('open');
      expect(ticket.closedAt).toBeUndefined();
      expect(ticket.closedBy).toBeUndefined();
    });
  });

  describe('Ticket Queries', () => {
    test('should find tickets by status', async () => {
      await createTestTicket({ status: 'open', createdBy: testUser._id });
      await createTestTicket({ status: 'closed', createdBy: testUser._id });
      await createTestTicket({ status: 'in_progress', createdBy: testUser._id });

      const openTickets = await Ticket.find({ status: 'open' });
      const closedTickets = await Ticket.find({ status: 'closed' });
      const inProgressTickets = await Ticket.find({ status: 'in_progress' });

      expect(openTickets).toHaveLength(1);
      expect(closedTickets).toHaveLength(1);
      expect(inProgressTickets).toHaveLength(1);
    });

    test('should find tickets by priority', async () => {
      await createTestTicket({ priority: 'low', createdBy: testUser._id });
      await createTestTicket({ priority: 'medium', createdBy: testUser._id });
      await createTestTicket({ priority: 'high', createdBy: testUser._id });

      const lowPriorityTickets = await Ticket.find({ priority: 'low' });
      const mediumPriorityTickets = await Ticket.find({ priority: 'medium' });
      const highPriorityTickets = await Ticket.find({ priority: 'high' });

      expect(lowPriorityTickets).toHaveLength(1);
      expect(mediumPriorityTickets).toHaveLength(1);
      expect(highPriorityTickets).toHaveLength(1);
    });

    test('should find tickets by category', async () => {
      await createTestTicket({ category: 'bug', createdBy: testUser._id });
      await createTestTicket({ category: 'feature', createdBy: testUser._id });
      await createTestTicket({ category: 'general', createdBy: testUser._id });

      const bugTickets = await Ticket.find({ category: 'bug' });
      const featureTickets = await Ticket.find({ category: 'feature' });
      const generalTickets = await Ticket.find({ category: 'general' });

      expect(bugTickets).toHaveLength(1);
      expect(featureTickets).toHaveLength(1);
      expect(generalTickets).toHaveLength(1);
    });

    test('should find tickets by creator', async () => {
      const user2 = await createTestUser({ username: 'user2' });
      
      await createTestTicket({ createdBy: testUser._id });
      await createTestTicket({ createdBy: testUser._id });
      await createTestTicket({ createdBy: user2._id });

      const user1Tickets = await Ticket.find({ createdBy: testUser._id });
      const user2Tickets = await Ticket.find({ createdBy: user2._id });

      expect(user1Tickets).toHaveLength(2);
      expect(user2Tickets).toHaveLength(1);
    });

    test('should find tickets by assigned agent', async () => {
      const agent = await createTestUser({ role: 'agent' });
      
      const ticket1 = await createTestTicket({ createdBy: testUser._id });
      const ticket2 = await createTestTicket({ createdBy: testUser._id });
      const ticket3 = await createTestTicket({ createdBy: testUser._id });

      await ticket1.assignToAgent(agent._id);
      await ticket2.assignToAgent(agent._id);

      const assignedTickets = await Ticket.find({ assignedTo: agent._id });

      expect(assignedTickets).toHaveLength(2);
    });

    test('should sort tickets by creation date', async () => {
      const ticket1 = await createTestTicket({ createdBy: testUser._id });
      const ticket2 = await createTestTicket({ createdBy: testUser._id });

      const tickets = await Ticket.find().sort({ createdAt: -1 });

      expect(tickets[0].createdAt.getTime()).toBeGreaterThan(tickets[1].createdAt.getTime());
    });

    test('should sort tickets by priority', async () => {
      await createTestTicket({ priority: 'low', createdBy: testUser._id });
      await createTestTicket({ priority: 'high', createdBy: testUser._id });
      await createTestTicket({ priority: 'medium', createdBy: testUser._id });

      const tickets = await Ticket.find().sort({ priority: 1 }); // high > medium > low

      expect(tickets[0].priority).toBe('high');
      expect(tickets[1].priority).toBe('medium');
      expect(tickets[2].priority).toBe('low');
    });
  });

  describe('Ticket Statistics', () => {
    test('should calculate ticket statistics', async () => {
      await createTestTicket({ status: 'open', priority: 'high', createdBy: testUser._id });
      await createTestTicket({ status: 'open', priority: 'medium', createdBy: testUser._id });
      await createTestTicket({ status: 'closed', priority: 'low', createdBy: testUser._id });
      await createTestTicket({ status: 'in_progress', priority: 'high', createdBy: testUser._id });

      const stats = await Ticket.getStatistics();

      expect(stats.total).toBe(4);
      expect(stats.byStatus.open).toBe(2);
      expect(stats.byStatus.closed).toBe(1);
      expect(stats.byStatus.in_progress).toBe(1);
      expect(stats.byPriority.high).toBe(2);
      expect(stats.byPriority.medium).toBe(1);
      expect(stats.byPriority.low).toBe(1);
    });

    test('should calculate user statistics', async () => {
      const user2 = await createTestUser({ username: 'user2' });
      
      await createTestTicket({ createdBy: testUser._id });
      await createTestTicket({ createdBy: testUser._id });
      await createTestTicket({ createdBy: user2._id });

      const user1Stats = await Ticket.getUserStatistics(testUser._id);
      const user2Stats = await Ticket.getUserStatistics(user2._id);

      expect(user1Stats.total).toBe(2);
      expect(user2Stats.total).toBe(1);
    });
  });

  describe('Ticket Validation', () => {
    test('should validate title length', async () => {
      const ticketData = {
        title: generateRandomString(300), // Too long
        description: 'This is a test ticket',
        priority: 'medium',
        status: 'open',
        category: 'general',
        createdBy: testUser._id
      };

      await expect(Ticket.create(ticketData)).rejects.toThrow();
    });

    test('should validate description length', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: generateRandomString(2000), // Too long
        priority: 'medium',
        status: 'open',
        category: 'general',
        createdBy: testUser._id
      };

      await expect(Ticket.create(ticketData)).rejects.toThrow();
    });
  });

  describe('Ticket Relationships', () => {
    test('should populate creator information', async () => {
      const ticket = await createTestTicket({ createdBy: testUser._id });

      const populatedTicket = await Ticket.findById(ticket._id).populate('createdBy', 'username email');

      expect(populatedTicket.createdBy).toBeDefined();
      expect(populatedTicket.createdBy.username).toBe(testUser.username);
      expect(populatedTicket.createdBy.email).toBe(testUser.email);
    });

    test('should populate assigned agent information', async () => {
      const agent = await createTestUser({ role: 'agent' });
      const ticket = await createTestTicket({ createdBy: testUser._id });
      
      await ticket.assignToAgent(agent._id);

      const populatedTicket = await Ticket.findById(ticket._id).populate('assignedTo', 'username email');

      expect(populatedTicket.assignedTo).toBeDefined();
      expect(populatedTicket.assignedTo.username).toBe(agent.username);
      expect(populatedTicket.assignedTo.email).toBe(agent.email);
    });

    test('should populate comment authors', async () => {
      const ticket = await createTestTicket({ createdBy: testUser._id });
      
      await ticket.addComment({
        text: 'Test comment',
        author: testUser._id
      });

      const populatedTicket = await Ticket.findById(ticket._id).populate('comments.author', 'username email');

      expect(populatedTicket.comments[0].author).toBeDefined();
      expect(populatedTicket.comments[0].author.username).toBe(testUser.username);
      expect(populatedTicket.comments[0].author.email).toBe(testUser.email);
    });
  });
});
