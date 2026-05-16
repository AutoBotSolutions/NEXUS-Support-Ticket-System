const crypto = require('crypto');

const verifyGitHubWebhook = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  
  if (!signature) {
    console.error('Webhook verification failed: No signature provided');
    return res.status(401).json({ error: 'No signature provided' });
  }

  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    console.error('Webhook verification failed: GITHUB_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
    hmac.update(payload);
    const digest = 'sha256=' + hmac.digest('hex');

    if (signature !== digest) {
      console.error('Webhook verification failed: Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(500).json({ error: 'Webhook verification error' });
  }
};

module.exports = verifyGitHubWebhook;
