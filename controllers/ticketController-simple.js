const Ticket = require('../models/Ticket');

const generateTicketId = () => {
  return 'TCK-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
};

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res) => {
  try {
    const { title, description, priority, category, tags, createdBy, createdByEmail } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }

    if (!createdBy || !createdByEmail) {
      return res.status(400).json({ success: false, error: 'Created by name and email are required' });
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, error: 'Invalid priority value' });
    }

    const ticket = await Ticket.create({
      ticketId: generateTicketId(),
      title,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      tags: tags || [],
      createdBy,
      createdByEmail
    });

    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
  try {
    const { status, priority, category, assignedTo } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:ticketId
// @access  Private
const getTicket = async (req, res) => {
  try {
    if (!req.params.ticketId) {
      return res.status(400).json({ success: false, error: 'Ticket ID is required' });
    }

    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:ticketId
// @access  Private
const updateTicket = async (req, res) => {
  try {
    const { title, description, status, priority, category, assignedTo, tags } = req.body;

    if (!req.params.ticketId) {
      return res.status(400).json({ success: false, error: 'Ticket ID is required' });
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, error: 'Invalid priority value' });
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    let ticket = await Ticket.findOne({ ticketId: req.params.ticketId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    ticket = await Ticket.findOneAndUpdate(
      { ticketId: req.params.ticketId },
      { title, description, status, priority, category, assignedTo, tags },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:ticketId
// @access  Private
const deleteTicket = async (req, res) => {
  try {
    if (!req.params.ticketId) {
      return res.status(400).json({ success: false, error: 'Ticket ID is required' });
    }

    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    await Ticket.deleteOne({ ticketId: req.params.ticketId });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add comment to ticket
// @route   POST /api/tickets/:ticketId/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { author, authorEmail, content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }

    if (!req.params.ticketId) {
      return res.status(400).json({ success: false, error: 'Ticket ID is required' });
    }

    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    ticket.comments.push({
      author: author || 'Anonymous',
      authorEmail: authorEmail || 'anonymous@example.com',
      content
    });

    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Link ticket to GitHub issue
// @route   POST /api/tickets/:ticketId/link-github
// @access  Private
const linkGithubIssue = async (req, res) => {
  try {
    const { issueNumber, issueUrl } = req.body;

    if (!issueNumber || !issueUrl) {
      return res.status(400).json({ success: false, error: 'Issue number and URL are required' });
    }

    if (!req.params.ticketId) {
      return res.status(400).json({ success: false, error: 'Ticket ID is required' });
    }

    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    ticket.githubIssueNumber = issueNumber;
    ticket.githubIssueUrl = issueUrl;

    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  addComment,
  linkGithubIssue
};
