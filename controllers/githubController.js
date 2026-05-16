const axios = require('axios');
const Ticket = require('../models/Ticket');
const { trackGitHubApiCall, trackTicketCreated } = require('../middleware/apmMonitoringSimple');

// @desc    Handle GitHub webhook events
// @route   POST /api/github/webhook
// @access  Public (with webhook verification)
const handleGitHubWebhook = async (req, res) => {
  const eventType = req.headers['x-github-event'];

  if (!eventType) {
    return res.status(400).json({ success: false, error: 'Missing X-GitHub-Event header' });
  }

  try {
    switch (eventType) {
      case 'issues':
        await handleIssueEvent(req.body);
        break;
      case 'issue_comment':
        await handleIssueCommentEvent(req.body);
        break;
      default:
        console.log(`Unhandled event: ${eventType}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleIssueEvent = async (payload) => {
  const { action, issue, repository } = payload;

  if (!issue || !issue.number) {
    console.error('Invalid issue payload');
    return;
  }

  let ticket = await Ticket.findOne({ githubIssueNumber: issue.number });

  if (action === 'opened' || action === 'reopened') {
    if (!ticket) {
      ticket = await Ticket.create({
        ticketId: generateTicketId(),
        title: issue.title || 'Untitled',
        description: issue.body || '',
        status: action === 'opened' ? 'open' : 'in_progress',
        priority: 'medium',
        category: 'github',
        createdBy: issue.user?.login || 'GitHub User',
        createdByEmail: (issue.user?.login || 'github') + '@github',
        githubIssueNumber: issue.number,
        githubIssueUrl: issue.html_url,
        tags: repository ? [repository.name] : []
      });
      // Track ticket creation from GitHub
      trackTicketCreated(ticket.priority, ticket.category);
      console.log(`Created ticket for GitHub issue #${issue.number}`);
    } else {
      ticket.status = action === 'opened' ? 'open' : 'in_progress';
      ticket.title = issue.title || ticket.title;
      ticket.description = issue.body || ticket.description;
      await ticket.save();
      console.log(`Updated ticket for GitHub issue #${issue.number}`);
    }
  } else if (action === 'closed') {
    if (ticket) {
      ticket.status = 'closed';
      await ticket.save();
      console.log(`Closed ticket for GitHub issue #${issue.number}`);
    }
  } else if (action === 'edited') {
    if (ticket) {
      ticket.title = issue.title || ticket.title;
      ticket.description = issue.body || ticket.description;
      await ticket.save();
      console.log(`Edited ticket for GitHub issue #${issue.number}`);
    }
  } else if (action === 'labeled') {
    if (ticket && payload.label) {
      const label = payload.label.name;
      if (label && !ticket.tags.includes(label)) {
        ticket.tags.push(label);
        await ticket.save();
      }
    }
  }
};

const handleIssueCommentEvent = async (payload) => {
  const { issue, comment } = payload;

  if (!issue || !issue.number || !comment) {
    console.error('Invalid comment payload');
    return;
  }

  let ticket = await Ticket.findOne({ githubIssueNumber: issue.number });

  if (ticket) {
    ticket.comments.push({
      author: comment.user?.login || 'GitHub User',
      authorEmail: (comment.user?.login || 'github') + '@github',
      content: comment.body || '',
      createdAt: comment.created_at || new Date()
    });
    await ticket.save();
    console.log(`Added comment to ticket for GitHub issue #${issue.number}`);
  }
};

const generateTicketId = () => {
  return 'GH-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
};

// @desc    Sync ticket to GitHub issue
// @route   POST /api/github/sync-ticket/:ticketId
// @access  Private
const syncTicketToGitHub = async (req, res) => {
  try {
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO_OWNER || !process.env.GITHUB_REPO_NAME) {
      return res.status(500).json({ 
        success: false, 
        error: 'GitHub configuration missing. Please set GITHUB_TOKEN, GITHUB_REPO_OWNER, and GITHUB_REPO_NAME' 
      });
    }

    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    // If already linked, update the issue
    if (ticket.githubIssueNumber) {
      const updateUrl = `https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/issues/${ticket.githubIssueNumber}`;
      
      const updateData = {
        title: ticket.title,
        body: ticket.description,
        state: ticket.status === 'closed' ? 'closed' : 'open'
      };

      try {
        await axios.patch(updateUrl, updateData, {
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        trackGitHubApiCall('PATCH /issues/:number', 'success');
        return res.status(200).json({ success: true, message: 'Issue updated on GitHub' });
      } catch (error) {
        trackGitHubApiCall('PATCH /issues/:number', 'error');
        throw error;
      }
    }

    // Create new issue
    const createUrl = `https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/issues`;
    
    const issueData = {
      title: ticket.title,
      body: ticket.description,
      labels: ticket.tags || []
    };

    try {
      const response = await axios.post(createUrl, issueData, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      trackGitHubApiCall('POST /issues', 'success');
      
      ticket.githubIssueNumber = response.data.number;
      ticket.githubIssueUrl = response.data.html_url;
      await ticket.save();

      res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      trackGitHubApiCall('POST /issues', 'error');
      throw error;
    }
  } catch (error) {
    console.error('GitHub sync error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  handleGitHubWebhook,
  syncTicketToGitHub
};
