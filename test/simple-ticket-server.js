const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the simplified index.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'simple-index.html'));
});

// Simple in-memory storage for demo
let tickets = [
  {
    ticketId: 'TCK-001',
    title: 'Test Ticket - Login Issue',
    description: 'Users are unable to login with valid credentials',
    createdBy: 'John Doe',
    createdByEmail: 'john@example.com',
    priority: 'high',
    category: 'authentication',
    tags: ['login', 'bug', 'urgent'],
    status: 'open',
    createdAt: new Date().toISOString(),
    comments: [
      {
        id: '1',
        content: 'I can reproduce this issue. The login form seems to be rejecting valid credentials.',
        author: 'Support Agent',
        authorEmail: 'agent@example.com',
        createdAt: new Date().toISOString()
      }
    ],
    assignedTo: null,
    githubIssueNumber: 123,
    githubIssueUrl: 'https://github.com/example/repo/issues/123'
  },
  {
    ticketId: 'TCK-002',
    title: 'Feature Request - Dark Mode',
    description: 'Please add a dark mode option to the user interface',
    createdBy: 'Jane Smith',
    createdByEmail: 'jane@example.com',
    priority: 'medium',
    category: 'feature',
    tags: ['ui', 'dark-mode', 'enhancement'],
    status: 'in_progress',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    comments: [],
    assignedTo: 'Dev Team',
    githubIssueNumber: 124,
    githubIssueUrl: 'https://github.com/example/repo/issues/124'
  }
];

const generateTicketId = () => {
  return 'TCK-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET all tickets
app.get('/api/tickets', (req, res) => {
  try {
    const { status, priority } = req.query;
    let filteredTickets = tickets;
    
    if (status) {
      filteredTickets = filteredTickets.filter(t => t.status === status);
    }
    if (priority) {
      filteredTickets = filteredTickets.filter(t => t.priority === priority);
    }
    
    res.json({
      success: true,
      data: filteredTickets
    });
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({ success: false, error: 'Failed to get tickets' });
  }
});

// GET single ticket
app.get('/api/tickets/:ticketId', (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = tickets.find(t => t.ticketId === ticketId);
    
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error getting ticket:', error);
    res.status(500).json({ success: false, error: 'Failed to get ticket' });
  }
});

// POST create ticket
app.post('/api/tickets', (req, res) => {
  console.log('🌐 === TICKET CREATION REQUEST ===');
  console.log('📥 Request headers:', req.headers);
  console.log('📦 Request body:', req.body);
  console.log('📋 Content-Type:', req.get('Content-Type'));
  
  try {
    const ticketData = req.body;
    console.log('🎫 Processing ticket data:', ticketData);
    
    if (!ticketData) {
      console.error('❌ No ticket data received');
      return res.status(400).json({ success: false, error: 'No ticket data received' });
    }
    
    const newTicket = {
      ticketId: generateTicketId(),
      title: ticketData.title || 'No Title',
      description: ticketData.description || 'No Description',
      createdBy: ticketData.createdBy || 'Anonymous',
      createdByEmail: ticketData.createdByEmail || 'anonymous@example.com',
      priority: ticketData.priority || 'medium',
      category: ticketData.category || 'general',
      tags: ticketData.tags || [],
      status: 'open',
      createdAt: new Date().toISOString(),
      comments: [],
      assignedTo: null,
      githubIssueNumber: null,
      githubIssueUrl: null
    };
    
    tickets.push(newTicket);
    console.log('✅ Ticket created successfully:', newTicket.ticketId);
    console.log('📊 Total tickets now:', tickets.length);
    
    const response = {
      success: true,
      data: newTicket
    };
    
    console.log('📤 Sending response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ ERROR IN TICKET CREATION:', error);
    console.error('❌ Error stack:', error.stack);
    
    const errorResponse = {
      success: false,
      error: error.message
    };
    
    console.log('📤 Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
  
  console.log('🌐 === END TICKET CREATION ===');
});

// POST add comment to ticket
app.post('/api/tickets/:ticketId/comments', (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content, author, authorEmail } = req.body;
    
    const ticket = tickets.find(t => t.ticketId === ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    const comment = {
      id: Date.now().toString(),
      content,
      author,
      authorEmail,
      createdAt: new Date().toISOString()
    };
    
    ticket.comments.push(comment);
    
    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// POST sync ticket with GitHub (mock)
app.post('/api/github/sync-ticket/:ticketId', (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = tickets.find(t => t.ticketId === ticketId);
    
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    // Mock GitHub sync
    ticket.githubIssueNumber = Math.floor(Math.random() * 1000) + 1;
    ticket.githubIssueUrl = `https://github.com/example/repo/issues/${ticket.githubIssueNumber}`;
    
    res.json({
      success: true,
      data: {
        message: 'Ticket synced with GitHub',
        githubIssueNumber: ticket.githubIssueNumber,
        githubIssueUrl: ticket.githubIssueUrl
      }
    });
  } catch (error) {
    console.error('Error syncing ticket:', error);
    res.status(500).json({ success: false, error: 'Failed to sync ticket' });
  }
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 NEXUS Simple Ticket Server running on port ${PORT}`);
  console.log(`📊 Ticket endpoints available at http://localhost:${PORT}/api/tickets`);
  console.log(`🔍 Health check at http://localhost:${PORT}/api/health`);
  console.log(`✅ Server ready for ticket management`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});
