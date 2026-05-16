const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  addComment,
  linkGithubIssue
} = require('../controllers/ticketController');

// Ticket CRUD routes
router.route('/')
  .get(getTickets)
  .post(createTicket);

router.route('/:ticketId')
  .get(getTicket)
  .put(updateTicket)
  .delete(deleteTicket);

// Comment routes
router.post('/:ticketId/comments', addComment);

// GitHub integration routes
router.post('/:ticketId/link-github', linkGithubIssue);

module.exports = router;
