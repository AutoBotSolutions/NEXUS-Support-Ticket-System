const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// POST /api/contact/send-email - Send contact form email
router.post('/send-email', contactController.sendContactEmail);

module.exports = router;
