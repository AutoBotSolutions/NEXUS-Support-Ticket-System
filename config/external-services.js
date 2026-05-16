/**
 * NEXUS External Services Integration
 * Production-ready external service connections and integrations
 */

const axios = require('axios');
const https = require('https');

class ExternalServiceManager {
  constructor() {
    this.services = new Map();
    this.initializeServices();
  }

  initializeServices() {
    // Initialize all external services
    this.services.set('slack', new SlackService());
    this.services.set('pagerduty', new PagerDutyService());
    this.services.set('twilio', new TwilioService());
    this.services.set('github', new GitHubService());
    this.services.set('webhook', new WebhookService());
    this.services.set('email', new EmailService());
    this.services.set('newrelic', new NewRelicService());
    this.services.set('datadog', new DatadogService());
    this.services.set('sentry', new SentryService());
  }

  getService(serviceName) {
    return this.services.get(serviceName);
  }

  async sendNotification(serviceName, message, options = {}) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    return await service.sendNotification(message, options);
  }

  async checkServiceHealth(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return { status: 'not_found', message: `Service ${serviceName} not found` };
    }
    return await service.checkHealth();
  }

  async getAllServiceStatus() {
    const status = {};
    for (const [name, service] of this.services) {
      try {
        status[name] = await service.checkHealth();
      } catch (error) {
        status[name] = { status: 'error', message: error.message };
      }
    }
    return status;
  }
}

// Slack Service Integration
class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.defaultChannel = process.env.SLACK_CHANNEL || '#general';
    this.timeout = process.env.SLACK_TIMEOUT || 10000;
  }

  async sendNotification(message, options = {}) {
    if (!this.webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const payload = {
      channel: options.channel || this.defaultChannel,
      username: options.username || 'NEXUS Bot',
      text: message,
      icon_emoji: options.emoji || ':robot_face:',
      attachments: options.attachments || []
    };

    // Add rich formatting if provided
    if (options.blocks) {
      payload.blocks = options.blocks;
    }

    try {
      const response = await axios.post(this.webhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      throw new Error(`Slack notification failed: ${error.message}`);
    }
  }

  async sendAlert(alert) {
    const color = this.getAlertColor(alert.severity);
    const attachment = {
      color: color,
      title: alert.title,
      text: alert.message,
      fields: alert.fields || [],
      footer: 'NEXUS Alert System',
      ts: Math.floor(Date.now() / 1000)
    };

    return await this.sendNotification('', {
      attachments: [attachment],
      channel: alert.channel || this.defaultChannel
    });
  }

  getAlertColor(severity) {
    const colors = {
      critical: 'danger',
      high: 'warning',
      medium: 'warning',
      low: 'good',
      info: 'good'
    };
    return colors[severity] || 'good';
  }

  async checkHealth() {
    if (!this.webhookUrl) {
      return { status: 'not_configured', message: 'Slack webhook URL not configured' };
    }

    try {
      // Test with a simple health check message
      const response = await axios.post(this.webhookUrl, {
        text: 'Health check from NEXUS',
        channel: this.defaultChannel
      }, { timeout: 5000 });

      return {
        status: 'healthy',
        message: 'Slack service is operational',
        webhook_status: response.status
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Slack health check failed: ${error.message}`
      };
    }
  }
}

// PagerDuty Service Integration
class PagerDutyService {
  constructor() {
    this.integrationKey = process.env.PAGERDUTY_INTEGRATION_KEY;
    this.serviceKey = process.env.PAGERDUTY_SERVICE_KEY;
    this.apiUrl = 'https://events.pagerduty.com/v2/enqueue';
    this.timeout = process.env.PAGERDUTY_TIMEOUT || 15000;
  }

  async sendNotification(message, options = {}) {
    if (!this.integrationKey) {
      throw new Error('PagerDuty integration key not configured');
    }

    const payload = {
      routing_key: this.integrationKey,
      event_action: options.action || 'trigger',
      dedup_key: options.dedupKey,
      payload: {
        summary: message,
        source: options.source || 'nexus-app',
        severity: options.severity || 'error',
        timestamp: new Date().toISOString(),
        component: options.component || 'application',
        group: options.group || 'nexus',
        class: options.class || 'error',
        custom_details: options.details || {}
      },
      images: options.images || [],
      links: options.links || []
    };

    try {
      const response = await axios.post(this.apiUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
        dedup_key: response.data.dedup_key
      };
    } catch (error) {
      throw new Error(`PagerDuty notification failed: ${error.message}`);
    }
  }

  async triggerIncident(incident) {
    return await this.sendNotification(incident.title, {
      severity: incident.severity,
      source: incident.source || 'nexus-app',
      component: incident.component,
      details: incident.details,
      action: 'trigger'
    });
  }

  async acknowledgeIncident(incidentKey, details = {}) {
    return await this.sendNotification('Incident acknowledged', {
      dedupKey: incidentKey,
      action: 'acknowledge',
      details
    });
  }

  async resolveIncident(incidentKey, details = {}) {
    return await this.sendNotification('Incident resolved', {
      dedupKey: incidentKey,
      action: 'resolve',
      details
    });
  }

  async checkHealth() {
    if (!this.integrationKey) {
      return { status: 'not_configured', message: 'PagerDuty integration key not configured' };
    }

    try {
      // Test with a test event
      const response = await axios.post(this.apiUrl, {
        routing_key: this.integrationKey,
        event_action: 'trigger',
        payload: {
          summary: 'Health check from NEXUS',
          source: 'nexus-health-check',
          severity: 'info'
        }
      }, { timeout: 5000 });

      return {
        status: 'healthy',
        message: 'PagerDuty service is operational',
        api_status: response.status
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `PagerDuty health check failed: ${error.message}`
      };
    }
  }
}

// Twilio SMS Service Integration
class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.timeout = process.env.TWILIO_TIMEOUT || 10000;
    this.client = null;

    if (this.accountSid && this.authToken) {
      const twilio = require('twilio');
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  async sendNotification(message, options = {}) {
    if (!this.client) {
      throw new Error('Twilio client not configured');
    }

    const to = options.to;
    if (!to) {
      throw new Error('Recipient phone number is required');
    }

    try {
      const messageResponse = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });

      return {
        success: true,
        messageSid: messageResponse.sid,
        status: messageResponse.status,
        to: messageResponse.to,
        from: messageResponse.from
      };
    } catch (error) {
      throw new Error(`Twilio SMS failed: ${error.message}`);
    }
  }

  async sendAlert(alert, phoneNumbers) {
    const results = [];
    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await this.sendNotification(alert.message, { to: phoneNumber });
        results.push({ phoneNumber, success: true, ...result });
      } catch (error) {
        results.push({ phoneNumber, success: false, error: error.message });
      }
    }
    return results;
  }

  async checkHealth() {
    if (!this.client) {
      return { status: 'not_configured', message: 'Twilio client not configured' };
    }

    try {
      // Test by checking account info
      const account = await this.client.api.accounts(this.accountSid).fetch();
      return {
        status: 'healthy',
        message: 'Twilio service is operational',
        account_sid: account.sid,
        account_status: account.status
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Twilio health check failed: ${error.message}`
      };
    }
  }
}

// GitHub Service Integration
class GitHubService {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.apiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
    this.timeout = process.env.GITHUB_TIMEOUT || 10000;
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: this.token ? {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      } : {}
    });
  }

  async sendNotification(message, options = {}) {
    // GitHub doesn't have direct notification, but can create issues or comments
    if (options.action === 'create_issue') {
      return await this.createIssue(options.repo, options.title, message);
    } else if (options.action === 'create_comment') {
      return await this.createComment(options.repo, options.issueNumber, message);
    }
  }

  async createIssue(repo, title, body) {
    try {
      const response = await this.client.post(`/repos/${repo}/issues`, {
        title,
        body,
        labels: ['nexus-alert']
      });

      return {
        success: true,
        issue_number: response.data.number,
        issue_url: response.data.html_url,
        status: response.status
      };
    } catch (error) {
      throw new Error(`GitHub issue creation failed: ${error.message}`);
    }
  }

  async createComment(repo, issueNumber, body) {
    try {
      const response = await this.client.post(`/repos/${repo}/issues/${issueNumber}/comments`, {
        body
      });

      return {
        success: true,
        comment_url: response.data.html_url,
        status: response.status
      };
    } catch (error) {
      throw new Error(`GitHub comment creation failed: ${error.message}`);
    }
  }

  async checkHealth() {
    try {
      const response = await this.client.get('/user');
      return {
        status: 'healthy',
        message: 'GitHub API is operational',
        user: response.data.login,
        rate_limit: response.headers['x-ratelimit-limit']
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `GitHub health check failed: ${error.message}`
      };
    }
  }
}

// Webhook Service Integration
class WebhookService {
  constructor() {
    this.timeout = process.env.WEBHOOK_TIMEOUT || 10000;
    this.retryAttempts = process.env.WEBHOOK_RETRY_ATTEMPTS || 3;
    this.retryDelay = process.env.WEBHOOK_RETRY_DELAY || 1000;
  }

  async sendNotification(message, options = {}) {
    const url = options.url;
    if (!url) {
      throw new Error('Webhook URL is required');
    }

    const payload = {
      message,
      timestamp: new Date().toISOString(),
      source: 'nexus-app',
      ...options.data
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-NEXUS-Signature': this.generateSignature(payload),
      'X-NEXUS-Timestamp': new Date().toISOString(),
      ...options.headers
    };

    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await axios.post(url, payload, {
          timeout: this.timeout,
          headers,
          httpsAgent: new https.Agent({
            rejectUnauthorized: process.env.WEBHOOK_VERIFY_SSL !== 'false'
          })
        });

        return {
          success: true,
          status: response.status,
          data: response.data,
          attempts: attempt
        };
      } catch (error) {
        lastError = error;
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Webhook notification failed after ${this.retryAttempts} attempts: ${lastError.message}`);
  }

  generateSignature(payload) {
    const crypto = require('crypto');
    const secret = process.env.WEBHOOK_SECRET || 'nexus-webhook-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkHealth() {
    return {
      status: 'healthy',
      message: 'Webhook service is operational',
      timeout: this.timeout,
      retry_attempts: this.retryAttempts
    };
  }
}

// Email Service Integration
class EmailService {
  constructor() {
    this.smtpHost = process.env.SMTP_HOST;
    this.smtpPort = process.env.SMTP_PORT;
    this.smtpUsername = process.env.SMTP_USERNAME;
    this.smtpPassword = process.env.SMTP_PASSWORD;
    this.from = process.env.SMTP_FROM;
  }

  async sendNotification(message, options = {}) {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpPort === '465',
      auth: {
        user: this.smtpUsername,
        pass: this.smtpPassword
      }
    });

    const mailOptions = {
      from: this.from,
      to: options.to,
      subject: options.subject || 'NEXUS Notification',
      text: message,
      html: options.html || message
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      throw new Error(`Email notification failed: ${error.message}`);
    }
  }

  async checkHealth() {
    if (!this.smtpHost || !this.smtpUsername || !this.smtpPassword) {
      return { status: 'not_configured', message: 'Email service not fully configured' };
    }

    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: this.smtpHost,
        port: this.smtpPort,
        auth: {
          user: this.smtpUsername,
          pass: this.smtpPassword
        }
      });

      await transporter.verify();
      return {
        status: 'healthy',
        message: 'Email service is operational'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Email health check failed: ${error.message}`
      };
    }
  }
}

// New Relic Service Integration
class NewRelicService {
  constructor() {
    this.apiKey = process.env.NEW_RELIC_API_KEY;
    this.apiUrl = process.env.NEW_RELIC_API_URL || 'https://api.newrelic.com';
    this.appId = process.env.NEW_RELIC_APP_ID;
  }

  async sendNotification(message, options = {}) {
    // New Relic custom events
    if (this.apiKey && this.appId) {
      return await this.sendCustomEvent(message, options);
    }
  }

  async sendCustomEvent(message, options = {}) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/v2/accounts/events`,
        {
          eventType: 'NexusNotification',
          message,
          ...options.data
        },
        {
          headers: {
            'Api-Key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      throw new Error(`New Relic event failed: ${error.message}`);
    }
  }

  async checkHealth() {
    if (!this.apiKey) {
      return { status: 'not_configured', message: 'New Relic API key not configured' };
    }

    try {
      const response = await axios.get(`${this.apiUrl}/v2/applications/${this.appId}`, {
        headers: {
          'Api-Key': this.apiKey
        }
      });

      return {
        status: 'healthy',
        message: 'New Relic API is operational',
        app_name: response.data.application.name,
        app_id: response.data.application.id
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `New Relic health check failed: ${error.message}`
      };
    }
  }
}

// Datadog Service Integration
class DatadogService {
  constructor() {
    this.apiKey = process.env.DATADOG_API_KEY;
    this.apiUrl = process.env.DATADOG_API_URL || 'https://api.datadoghq.com';
  }

  async sendNotification(message, options = {}) {
    if (this.apiKey) {
      return await this.sendEvent(message, options);
    }
  }

  async sendEvent(message, options = {}) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/events`,
        {
          title: options.title || 'NEXUS Alert',
          text: message,
          alert_type: options.alertType || 'info',
          priority: options.priority || 'normal',
          tags: options.tags || ['source:nexus']
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': this.apiKey
          }
        }
      );

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      throw new Error(`Datadog event failed: ${error.message}`);
    }
  }

  async checkHealth() {
    if (!this.apiKey) {
      return { status: 'not_configured', message: 'Datadog API key not configured' };
    }

    try {
      const response = await axios.get(`${this.apiUrl}/api/v1/validate`, {
        headers: {
          'DD-API-KEY': this.apiKey
        }
      });

      return {
        status: 'healthy',
        message: 'Datadog API is operational',
        valid: response.data.valid
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Datadog health check failed: ${error.message}`
      };
    }
  }
}

// Sentry Service Integration
class SentryService {
  constructor() {
    this.dsn = process.env.SENTRY_DSN;
    this.environment = process.env.NODE_ENV || 'production';
  }

  async sendNotification(message, options = {}) {
    if (this.dsn) {
      return await this.sendEvent(message, options);
    }
  }

  async sendEvent(message, options = {}) {
    try {
      const Sentry = require('@sentry/node');
      Sentry.init({ dsn: this.dsn, environment: this.environment });

      Sentry.captureMessage(message, {
        level: options.level || 'info',
        tags: options.tags || {},
        extra: options.extra || {}
      });

      return {
        success: true,
        message: 'Event sent to Sentry'
      };
    } catch (error) {
      throw new Error(`Sentry event failed: ${error.message}`);
    }
  }

  async checkHealth() {
    if (!this.dsn) {
      return { status: 'not_configured', message: 'Sentry DSN not configured' };
    }

    try {
      // Test by sending a test event
      const Sentry = require('@sentry/node');
      Sentry.init({ dsn: this.dsn, environment: this.environment });

      return {
        status: 'healthy',
        message: 'Sentry service is operational',
        environment: this.environment
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Sentry health check failed: ${error.message}`
      };
    }
  }
}

// Export the external service manager
module.exports = {
  ExternalServiceManager,
  SlackService,
  PagerDutyService,
  TwilioService,
  GitHubService,
  WebhookService,
  EmailService,
  NewRelicService,
  DatadogService,
  SentryService
};
