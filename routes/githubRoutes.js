const express = require('express');
const router = express.Router();
const { handleGitHubWebhook, syncTicketToGitHub } = require('../controllers/githubController');
const verifyGitHubWebhook = require('../middleware/githubWebhook');

// Webhook endpoint (public but verified)
router.post('/webhook', verifyGitHubWebhook, handleGitHubWebhook);

// Manual sync endpoint
router.post('/sync-ticket/:ticketId', syncTicketToGitHub);

module.exports = router;
