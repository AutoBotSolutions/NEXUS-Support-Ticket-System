require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for demo
let users = [];
let tickets = [];

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Data sanitization
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting - disabled for demo
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve main interface first (before static files)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth-index.html'));
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-secret-key-change-in-production';

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token.' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'NEXUS Support System is running'
  });
});

// User Registration
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username, email, and password are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email or username already exists' 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = {
      id: uuidv4(),
      username,
      email,
      fullName: fullName || username,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    users.push(user);
    
    // Generate token
    const token = generateToken(user.id);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during registration' 
    });
  }
});

// User Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: 'Account is deactivated' 
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during login' 
    });
  }
});

// Get User Profile
app.get('/api/users/profile', verifyToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: { user: userWithoutPassword }
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// User Logout
app.post('/api/users/logout', verifyToken, (req, res) => {
  // In a real implementation, you would invalidate the token
  // For this demo, we'll just return success
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Ticket Routes (all require authentication)

// Create Ticket
app.post('/api/tickets', verifyToken, (req, res) => {
  try {
    const { title, description, priority, category } = req.body;
    
    // Validation
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and description are required' 
      });
    }
    
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    const ticket = {
      id: uuidv4(),
      ticketNumber: `TCK-${Date.now()}`,
      title,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      createdBy: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      assignedTo: null,
      githubIssueUrl: null
    };
    
    tickets.push(ticket);
    
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: { ticket }
    });
    
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get All Tickets (for authenticated user)
app.get('/api/tickets', verifyToken, (req, res) => {
  try {
    const { status, priority } = req.query;
    let filteredTickets = tickets;
    
    // Filter by user (only show tickets created by the user)
    filteredTickets = filteredTickets.filter(t => t.createdBy.id === req.user.userId);
    
    // Apply additional filters
    if (status) {
      filteredTickets = filteredTickets.filter(t => t.status === status);
    }
    if (priority) {
      filteredTickets = filteredTickets.filter(t => t.priority === priority);
    }
    
    // Sort by creation date (newest first)
    filteredTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: { 
        tickets: filteredTickets,
        total: filteredTickets.length
      }
    });
    
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get Single Ticket
app.get('/api/tickets/:ticketId', verifyToken, (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = tickets.find(t => 
      t.id === ticketId && t.createdBy.id === req.user.userId
    );
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    res.json({
      success: true,
      data: { ticket }
    });
    
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Add Comment to Ticket
app.post('/api/tickets/:ticketId/comments', verifyToken, (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Comment text is required' 
      });
    }
    
    const ticket = tickets.find(t => 
      t.id === ticketId && t.createdBy.id === req.user.userId
    );
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    const user = users.find(u => u.id === req.user.userId);
    
    const comment = {
      id: uuidv4(),
      text,
      author: {
        id: user.id,
        username: user.username,
        fullName: user.fullName
      },
      createdAt: new Date().toISOString(),
      isInternal: false
    };
    
    ticket.comments.push(comment);
    ticket.updatedAt = new Date().toISOString();
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment }
    });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get User's Tickets (alias for /api/tickets)
app.get('/api/tickets/my', verifyToken, (req, res) => {
  // Redirect to the main tickets endpoint
  req.url = '/api/tickets';
  return app._router.handle(req, res);
});


// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 NEXUS Support System with Authentication running on port ${PORT}`);
  console.log(`📝 User registration: http://localhost:${PORT}/api/users/register`);
  console.log(`🔑 User login: http://localhost:${PORT}/api/users/login`);
  console.log(`🎫 Ticket creation: http://localhost:${PORT}/api/tickets (requires auth)`);
  console.log(`🌐 Main interface: http://localhost:${PORT}`);
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
