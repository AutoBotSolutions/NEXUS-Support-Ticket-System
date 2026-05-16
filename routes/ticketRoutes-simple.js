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
} = require('../controllers/ticketController-simple');

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:ticketId', getTicket);
router.put('/:ticketId', updateTicket);
router.delete('/:ticketId', deleteTicket);
router.post('/:ticketId/comments', addComment);
router.post('/:ticketId/link-github', linkGithubIssue);

module.exports = router;
