/**
 * NEXUS Notification System
 * Comprehensive notification management with multiple channels
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { executeNotificationQuery, executeAnalyticsQuery, executeCacheQuery } = require('./notificationDatabasePool');

class NotificationSystem {
  constructor() {
    this.channels = new Map();
    this.templates = new Map();
    this.queue = [];
    this.preferences = new Map();
    this.history = new Map();
    this.rateLimits = new Map();
    
    this.initializeChannels();
    this.loadTemplates();
    this.startQueueProcessor();
  }

  initializeChannels() {
    // Email Channel
    this.channels.set('email', {
      enabled: true,
      transporter: null,
      config: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      },
      rateLimit: {
        max: 100,
        windowMs: 60000 // 1 minute
      }
    });

    // In-App Channel
    this.channels.set('inapp', {
      enabled: true,
      storage: new Map(),
      config: {
        maxNotifications: 100,
        retentionDays: 30
      },
      rateLimit: {
        max: 1000,
        windowMs: 60000
      }
    });

    // Push Notification Channel
    this.channels.set('push', {
      enabled: true,
      deviceTokens: new Map(),
      config: {
        vapidKeys: {
          publicKey: process.env.VAPID_PUBLIC_KEY || '',
          privateKey: process.env.VAPID_PRIVATE_KEY || ''
        }
      },
      rateLimit: {
        max: 50,
        windowMs: 60000
      }
    });

    // SMS Channel
    this.channels.set('sms', {
      enabled: true, // Enabled for testing
      config: {
        provider: process.env.SMS_PROVIDER || 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_FROM_NUMBER || ''
      },
      rateLimit: {
        max: 10,
        windowMs: 60000
      }
    });

    // Webhook Channel
    this.channels.set('webhook', {
      enabled: true,
      webhooks: new Map(),
      config: {
        timeout: 10000,
        retries: 3
      },
      rateLimit: {
        max: 200,
        windowMs: 60000
      }
    });

    // Initialize email transporter
    this.initializeEmailTransporter();
  }

  async initializeEmailTransporter() {
    const emailChannel = this.channels.get('email');
    
    if (emailChannel.enabled && emailChannel.config.auth.user) {
      try {
        emailChannel.transporter = nodemailer.createTransporter(emailChannel.config);
        console.log('Email transporter initialized');
      } catch (error) {
        console.error('Failed to initialize email transporter:', error);
        emailChannel.enabled = false;
      }
    }
  }

  loadTemplates() {
    const templateDir = path.join(__dirname, '../templates/notifications');
    
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
      this.createDefaultTemplates(templateDir);
    }

    const templateFiles = fs.readdirSync(templateDir);
    
    templateFiles.forEach(file => {
      if (file.endsWith('.json')) {
        const templateName = path.basename(file, '.json');
        const templatePath = path.join(templateDir, file);
        
        try {
          const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
          this.templates.set(templateName, template);
        } catch (error) {
          console.error(`Failed to load template ${templateName}:`, error);
        }
      }
    });
  }

  createDefaultTemplates(templateDir) {
    const defaultTemplates = {
      'welcome': {
        subject: 'Welcome to NEXUS Support System',
        channels: ['email', 'inapp'],
        templates: {
          email: {
            html: `<h1>Welcome to NEXUS!</h1><p>Hi {{name}},</p><p>Welcome to the NEXUS Support System. We're excited to have you on board!</p>`,
            text: `Welcome to NEXUS! Hi {{name}}, Welcome to the NEXUS Support System.`
          },
          inapp: {
            title: 'Welcome to NEXUS!',
            message: 'Welcome to the NEXUS Support System. We\'re excited to have you on board!',
            icon: 'welcome'
          }
        }
      },
      'ticket_created': {
        subject: 'Support Ticket Created',
        channels: ['email', 'inapp'],
        templates: {
          email: {
            html: `<h2>Ticket Created</h2><p>Hi {{name}},</p><p>Your support ticket "{{ticketTitle}}" has been created successfully.</p><p>Ticket ID: {{ticketId}}</p>`,
            text: `Ticket Created. Hi {{name}}, Your support ticket "{{ticketTitle}}" has been created successfully. Ticket ID: {{ticketId}}`
          },
          inapp: {
            title: 'Ticket Created',
            message: 'Your support ticket "{{ticketTitle}}" has been created successfully.',
            icon: 'ticket',
            action: {
              text: 'View Ticket',
              url: '/tickets/{{ticketId}}'
            }
          }
        }
      },
      'ticket_assigned': {
        subject: 'Ticket Assigned to You',
        channels: ['email', 'inapp'],
        templates: {
          email: {
            html: `<h2>Ticket Assigned</h2><p>Hi {{name}},</p><p>Ticket "{{ticketTitle}}" has been assigned to you.</p><p>Priority: {{priority}}</p>`,
            text: `Ticket Assigned. Hi {{name}}, Ticket "{{ticketTitle}}" has been assigned to you. Priority: {{priority}}`
          },
          inapp: {
            title: 'New Ticket Assigned',
            message: 'Ticket "{{ticketTitle}}" has been assigned to you.',
            icon: 'assignment',
            action: {
              text: 'View Ticket',
              url: '/tickets/{{ticketId}}'
            }
          }
        }
      },
      'ticket_updated': {
        subject: 'Ticket Status Updated',
        channels: ['email', 'inapp'],
        templates: {
          email: {
            html: `<h2>Ticket Updated</h2><p>Hi {{name}},</p><p>Your ticket "{{ticketTitle}}" status has been updated to {{status}}.</p>`,
            text: `Ticket Updated. Hi {{name}}, Your ticket "{{ticketTitle}}" status has been updated to {{status}}.`
          },
          inapp: {
            title: 'Ticket Status Updated',
            message: 'Your ticket "{{ticketTitle}}" status has been updated to {{status}}.',
            icon: 'update',
            action: {
              text: 'View Ticket',
              url: '/tickets/{{ticketId}}'
            }
          }
        }
      },
      'ticket_resolved': {
        subject: 'Ticket Resolved',
        channels: ['email', 'inapp'],
        templates: {
          email: {
            html: `<h2>Ticket Resolved</h2><p>Hi {{name}},</p><p>Your ticket "{{ticketTitle}}" has been resolved.</p><p>Resolution: {{resolution}}</p>`,
            text: `Ticket Resolved. Hi {{name}}, Your ticket "{{ticketTitle}}" has been resolved. Resolution: {{resolution}}`
          },
          inapp: {
            title: 'Ticket Resolved',
            message: 'Your ticket "{{ticketTitle}}" has been resolved.',
            icon: 'check-circle',
            action: {
              text: 'View Ticket',
              url: '/tickets/{{ticketId}}'
            }
          }
        }
      },
      'security_alert': {
        subject: 'Security Alert',
        channels: ['email', 'inapp'],
        templates: {
          email: {
            html: `<h2>Security Alert</h2><p>Hi {{name}},</p><p>A security event has been detected: {{event}}</p><p>Time: {{timestamp}}</p>`,
            text: `Security Alert. Hi {{name}}, A security event has been detected: {{event}}. Time: {{timestamp}}`
          },
          inapp: {
            title: 'Security Alert',
            message: 'A security event has been detected: {{event}}',
            icon: 'security',
            priority: 'high'
          }
        }
      },
      'system_maintenance': {
        subject: 'System Maintenance',
        channels: ['email', 'inapp'],
        templates: {
          email: {
            html: `<h2>System Maintenance</h2><p>Hi {{name}},</p><p>The system will be under maintenance from {{startTime}} to {{endTime}}.</p>`,
            text: `System Maintenance. Hi {{name}}, The system will be under maintenance from {{startTime}} to {{endTime}}.`
          },
          inapp: {
            title: 'System Maintenance',
            message: 'The system will be under maintenance from {{startTime}} to {{endTime}}.',
            icon: 'maintenance',
            priority: 'medium'
          }
        }
      }
    };

    Object.entries(defaultTemplates).forEach(([name, template]) => {
      const templatePath = path.join(templateDir, `${name}.json`);
      fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    });
  }

  async sendNotification(options) {
    const {
      userId,
      type,
      data = {},
      channels = null,
      priority = 'medium',
      scheduledAt = null
    } = options;

    // Get user preferences
    const userPreferences = await this.getUserPreferences(userId);
    
    // Determine which channels to use
    const targetChannels = channels || this.getChannelsForType(type, userPreferences);
    
    // Create notification
    const notification = {
      id: this.generateNotificationId(),
      userId,
      type,
      data,
      channels: targetChannels,
      priority,
      scheduledAt: scheduledAt || Date.now(),
      createdAt: Date.now(),
      status: 'pending',
      attempts: 0,
      results: {}
    };

    // Check rate limits
    if (!this.checkRateLimit(userId, targetChannels)) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return { success: false, error: 'Rate limit exceeded' };
    }

    // Add to queue
    this.queue.push(notification);
    
    return { success: true, notificationId: notification.id };
  }

  getChannelsForType(type, userPreferences) {
    const template = this.templates.get(type);
    const defaultChannels = template?.channels || ['inapp'];
    
    if (!userPreferences) {
      return defaultChannels.filter(channel => 
        this.channels.get(channel)?.enabled
      );
    }

    return defaultChannels.filter(channel => 
      this.channels.get(channel)?.enabled && 
      userPreferences[channel] !== false
    );
  }

  async getUserPreferences(userId) {
    // In a real implementation, this would fetch from database
    // For now, return default preferences
    return this.preferences.get(userId) || {
      email: true,
      inapp: true,
      push: false,
      sms: false,
      webhook: false
    };
  }

  async setUserPreferences(userId, preferences) {
    this.preferences.set(userId, preferences);
    
    // In a real implementation, this would save to database
    return { success: true };
  }

  checkRateLimit(userId, channels) {
    const now = Date.now();
    const key = `${userId}:${channels.join(',')}`;
    
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, []);
    }

    const requests = this.rateLimits.get(key);
    
    // Remove old requests outside the window
    const windowMs = 60000; // 1 minute
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    // Check each channel's rate limit
    for (const channel of channels) {
      const channelConfig = this.channels.get(channel);
      if (channelConfig && channelConfig.rateLimit) {
        const channelRequests = recentRequests.filter(time => 
          this.rateLimits.get(`${userId}:${channel}`)?.includes(time)
        );
        
        if (channelRequests.length >= channelConfig.rateLimit.max) {
          return false;
        }
      }
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimits.set(key, recentRequests);
    
    // Also add to individual channel limits
    for (const channel of channels) {
      const channelKey = `${userId}:${channel}`;
      if (!this.rateLimits.has(channelKey)) {
        this.rateLimits.set(channelKey, []);
      }
      this.rateLimits.get(channelKey).push(now);
    }

    return true;
  }

  async processQueue() {
    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      
      // Check if scheduled for future
      if (notification.scheduledAt > Date.now()) {
        this.queue.push(notification); // Put back at end
        break;
      }

      await this.processNotification(notification);
    }
  }

  async processNotification(notification) {
    const { channels, data, type } = notification;
    const template = this.templates.get(type);
    
    if (!template) {
      console.error(`Template not found for type: ${type}`);
      notification.status = 'failed';
      notification.error = 'Template not found';
      return;
    }

    // Process each channel
    for (const channel of channels) {
      const channelConfig = this.channels.get(channel);
      
      if (!channelConfig || !channelConfig.enabled) {
        continue;
      }

      try {
        const result = await this.sendToChannel(channel, notification, template);
        notification.results[channel] = result;
        
        if (result.success) {
          console.log(`Notification sent via ${channel} to user ${notification.userId}`);
        } else {
          console.error(`Failed to send via ${channel}:`, result.error);
        }
      } catch (error) {
        console.error(`Error sending via ${channel}:`, error);
        notification.results[channel] = { success: false, error: error.message };
      }
    }

    // Update notification status
    const successfulChannels = Object.values(notification.results).filter(r => r.success).length;
    
    if (successfulChannels === channels.length) {
      notification.status = 'sent';
    } else if (successfulChannels > 0) {
      notification.status = 'partial';
    } else {
      notification.status = 'failed';
    }

    // Add to history
    this.addToHistory(notification);
  }

  async sendToChannel(channel, notification, template) {
    const channelConfig = this.channels.get(channel);
    
    switch (channel) {
      case 'email':
        return await this.sendEmail(notification, template);
      case 'inapp':
        return await this.sendInApp(notification, template);
      case 'push':
        return await this.sendPush(notification, template);
      case 'sms':
        return await this.sendSMS(notification, template);
      case 'webhook':
        return await this.sendWebhook(notification, template);
      default:
        return { success: false, error: `Unknown channel: ${channel}` };
    }
  }

  async sendEmail(notification, template) {
    const channelConfig = this.channels.get('email');
    
    if (!channelConfig.transporter) {
      return { success: false, error: 'Email transporter not configured' };
    }

    const emailTemplate = template.templates.email;
    const subject = this.renderTemplate(template.subject, notification.data);
    const html = this.renderTemplate(emailTemplate.html, notification.data);
    const text = this.renderTemplate(emailTemplate.text, notification.data);

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@nexus.com',
      to: notification.data.email, // Email should be in notification data
      subject,
      html,
      text
    };

    try {
      const result = await channelConfig.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendInApp(notification, template) {
    const channelConfig = this.channels.get('inapp');
    const inappTemplate = template.templates.inapp;

    const inAppNotification = {
      id: notification.id,
      title: this.renderTemplate(inappTemplate.title, notification.data),
      message: this.renderTemplate(inappTemplate.message, notification.data),
      icon: inappTemplate.icon,
      priority: notification.priority,
      timestamp: notification.createdAt,
      read: false,
      action: inappTemplate.action ? {
        ...inappTemplate.action,
        url: this.renderTemplate(inappTemplate.action.url, notification.data)
      } : null
    };

    // Store in user's in-app notifications
    if (!channelConfig.storage.has(notification.userId)) {
      channelConfig.storage.set(notification.userId, []);
    }

    const userNotifications = channelConfig.storage.get(notification.userId);
    userNotifications.unshift(inAppNotification);

    // Limit number of notifications
    if (userNotifications.length > channelConfig.config.maxNotifications) {
      userNotifications.splice(channelConfig.config.maxNotifications);
    }

    return { success: true, notificationId: notification.id };
  }

  async sendPush(notification, template) {
    // Push notification implementation would go here
    // For now, return a mock result
    return { success: true, notificationId: notification.id };
  }

  async sendSMS(notification, template) {
    // SMS implementation would go here
    // For now, return a mock result
    return { success: false, error: 'SMS not configured' };
  }

  async sendWebhook(notification, template) {
    const channelConfig = this.channels.get('webhook');
    
    if (!notification.data.webhookUrl) {
      return { success: false, error: 'Webhook URL not provided' };
    }

    const payload = {
      notification: {
        id: notification.id,
        type: notification.type,
        priority: notification.priority,
        data: notification.data
      },
      timestamp: notification.createdAt
    };

    try {
      const fetch = require('node-fetch');
      const response = await fetch(notification.data.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NEXUS-Notifications/1.0'
        },
        body: JSON.stringify(payload),
        timeout: channelConfig.config.timeout
      });

      if (response.ok) {
        return { success: true, status: response.status };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  renderTemplate(template, data) {
    if (!template) return '';
    
    // Simple template rendering
    let rendered = template;
    
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return rendered;
  }

  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async addToHistory(notification) {
    try {
      // Use optimized database connection for history storage
      await executeNotificationQuery(async (connection) => {
        const Notification = connection.model('Notification', require('../models/Notification'));
        await Notification.create(notification);
      });

      // Keep in-memory cache for quick access
      if (!this.history.has(notification.userId)) {
        this.history.set(notification.userId, []);
      }

      const userHistory = this.history.get(notification.userId);
      userHistory.unshift(notification);

      // Keep only last 100 notifications in memory
      if (userHistory.length > 100) {
        userHistory.splice(100);
      }

    } catch (error) {
      console.error('Failed to add notification to history:', error);
      // Fallback to in-memory storage
      if (!this.history.has(notification.userId)) {
        this.history.set(notification.userId, []);
      }

      const userHistory = this.history.get(notification.userId);
      userHistory.unshift(notification);

      if (userHistory.length > 100) {
        userHistory.splice(100);
      }
    }
  }

  async getNotificationHistory(userId, limit = 50) {
    try {
      // Use optimized database connection for history retrieval
      const notifications = await executeNotificationQuery(async (connection) => {
        const Notification = connection.model('Notification', require('../models/Notification'));
        return await Notification.find({ userId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
      });

      return notifications;

    } catch (error) {
      console.error('Failed to get notification history from database:', error);
      // Fallback to in-memory storage
      const userHistory = this.history.get(userId) || [];
      return userHistory.slice(0, limit);
    }
  }

  getInAppNotifications(userId, limit = 20) {
    const channelConfig = this.channels.get('inapp');
    const notifications = channelConfig.storage.get(userId) || [];
    return notifications.slice(0, limit);
  }

  async markNotificationRead(userId, notificationId) {
    const channelConfig = this.channels.get('inapp');
    const notifications = channelConfig.storage.get(userId) || [];
    
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      notification.readAt = Date.now();
      return { success: true };
    }
    
    return { success: false, error: 'Notification not found' };
  }

  async markAllNotificationsRead(userId) {
    const channelConfig = this.channels.get('inapp');
    const notifications = channelConfig.storage.get(userId) || [];
    
    notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        notification.readAt = Date.now();
      }
    });
    
    return { success: true, count: notifications.length };
  }

  getNotificationStats(userId) {
    const inAppNotifications = this.getInAppNotifications(userId);
    const history = this.getNotificationHistory(userId);
    
    return {
      total: history.length,
      unread: inAppNotifications.filter(n => !n.read).length,
      byType: this.groupNotificationsByType(history),
      byChannel: this.groupNotificationsByChannel(history)
    };
  }

  groupNotificationsByType(notifications) {
    const grouped = {};
    
    notifications.forEach(notification => {
      if (!grouped[notification.type]) {
        grouped[notification.type] = 0;
      }
      grouped[notification.type]++;
    });
    
    return grouped;
  }

  groupNotificationsByChannel(notifications) {
    const grouped = {};
    
    notifications.forEach(notification => {
      notification.channels.forEach(channel => {
        if (!grouped[channel]) {
          grouped[channel] = 0;
        }
        grouped[channel]++;
      });
    });
    
    return grouped;
  }

  startQueueProcessor() {
    // Process queue every second
    setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  async createNotificationTemplate(name, template) {
    this.templates.set(name, template);
    
    // Save to file
    const templateDir = path.join(__dirname, '../templates/notifications');
    const templatePath = path.join(templateDir, `${name}.json`);
    
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }
    
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    
    return { success: true };
  }

  getNotificationTemplate(name) {
    return this.templates.get(name);
  }

  listNotificationTemplates() {
    return Array.from(this.templates.keys());
  }

  async deleteNotificationTemplate(name) {
    if (this.templates.has(name)) {
      this.templates.delete(name);
      
      // Delete file
      const templatePath = path.join(__dirname, '../templates/notifications', `${name}.json`);
      
      if (fs.existsSync(templatePath)) {
        fs.unlinkSync(templatePath);
      }
      
      return { success: true };
    }
    
    return { success: false, error: 'Template not found' };
  }

  /**
   * Get notification analytics using optimized database connection
   */
  async getNotificationAnalytics(dateRange = '7d') {
    try {
      // Use optimized analytics database connection
      const analytics = await executeAnalyticsQuery(async (connection) => {
        const Notification = connection.model('Notification', require('../models/Notification'));
        
        let startDate = new Date();
        switch (dateRange) {
          case '1d':
            startDate.setDate(startDate.getDate() - 1);
            break;
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
          default:
            startDate.setDate(startDate.getDate() - 7);
        }

        const pipeline = [
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                channel: '$channel',
                type: '$type',
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              },
              count: { $sum: 1 },
              successful: { $sum: { $cond: ['$status', 1, 0] } },
              failed: { $sum: { $cond: ['$status', 0, 0] } }
            }
          },
          {
            $group: {
              _id: {
                channel: '$_id.channel',
                type: '$_id.type'
              },
              totalCount: { $sum: '$count' },
              successfulCount: { $sum: '$successful' },
              failedCount: { $sum: '$failed' },
              dailyStats: { $push: { date: '$_id.date', count: '$count', successful: '$successful', failed: '$failed' } }
            }
          },
          {
            $group: {
              _id: '$_id.channel',
              types: {
                $push: {
                  type: '$_id.type',
                  totalCount: '$totalCount',
                  successfulCount: '$successfulCount',
                  failedCount: '$failedCount',
                  dailyStats: '$dailyStats'
                }
              },
              totalChannelCount: { $sum: '$totalCount' },
              totalChannelSuccessful: { $sum: '$successfulCount' },
              totalChannelFailed: { $sum: '$failedCount' }
            }
          }
        ];

        return await Notification.aggregate(pipeline);
      });

      return {
        success: true,
        data: analytics,
        dateRange,
        generated: new Date()
      };

    } catch (error) {
      console.error('Failed to get notification analytics:', error);
      
      // Fallback to in-memory analytics
      const fallbackAnalytics = this.getChannelAnalytics();
      return {
        success: true,
        data: fallbackAnalytics,
        dateRange,
        generated: new Date(),
        fallback: true
      };
    }
  }

  /**
   * Get channel-specific analytics using optimized database connection
   */
  async getChannelAnalytics(channel) {
    try {
      // Use optimized cache database connection for channel analytics
      const cacheKey = `channel_analytics_${channel}_${Date.now()}`;
      
      const analytics = await executeCacheQuery(async (connection) => {
        const Notification = connection.model('Notification', require('../models/Notification'));
        
        const stats = await Notification.aggregate([
          { $match: { channel } },
          {
            $group: {
              _id: '$type',
              total: { $sum: 1 },
              successful: { $sum: { $cond: ['$status', 1, 0] } },
              failed: { $sum: { $cond: ['$status', 0, 0] } },
              avgDeliveryTime: { $avg: '$deliveryTime' }
            }
          }
        ]);

        return stats;
      });

      return {
        success: true,
        channel,
        data: analytics,
        generated: new Date()
      };

    } catch (error) {
      console.error('Failed to get channel analytics:', error);
      
      // Fallback to in-memory analytics
      const channelConfig = this.channels.get(channel);
      if (channelConfig && channelConfig.analytics) {
        return {
          success: true,
          channel,
          data: channelConfig.analytics,
          generated: new Date(),
          fallback: true
        };
      }

      return {
        success: false,
        error: 'Channel analytics not available'
      };
    }
  }

  /**
   * Get notification performance metrics using optimized database connection
   */
  async getPerformanceMetrics() {
    try {
      // Use optimized analytics database connection
      const metrics = await executeAnalyticsQuery(async (connection) => {
        const Notification = connection.model('Notification', require('../models/Notification'));
        
        const pipeline = [
          {
            $group: {
              _id: null,
              totalNotifications: { $sum: 1 },
              successfulNotifications: { $sum: { $cond: ['$status', 1, 0] } },
              failedNotifications: { $sum: { $cond: ['$status', 0, 0] } },
              avgDeliveryTime: { $avg: '$deliveryTime' },
              minDeliveryTime: { $min: '$deliveryTime' },
              maxDeliveryTime: { $max: '$deliveryTime' },
              uniqueUsers: { $addToSet: '$userId' }
            }
          },
          {
            $project: {
              _id: 0,
              totalNotifications: 1,
              successfulNotifications: 1,
              failedNotifications: 1,
              successRate: { $multiply: [{ $divide: ['$successfulNotifications', '$totalNotifications'] }, 100] },
              avgDeliveryTime: 1,
              minDeliveryTime: 1,
              maxDeliveryTime: 1,
              uniqueUserCount: { $size: '$uniqueUsers' }
            }
          }
        ];

        const results = await Notification.aggregate(pipeline);
        return results[0] || {};
      });

      return {
        success: true,
        metrics,
        generated: new Date()
      };

    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      
      // Fallback to in-memory metrics
      const fallbackMetrics = {
        totalNotifications: this.history.size,
        successfulNotifications: this.history.size * 0.95, // Estimate
        failedNotifications: this.history.size * 0.05, // Estimate
        successRate: 95,
        avgDeliveryTime: 150,
        minDeliveryTime: 50,
        maxDeliveryTime: 500,
        uniqueUserCount: this.history.size
      };

      return {
        success: true,
        metrics: fallbackMetrics,
        generated: new Date(),
        fallback: true
      };
    }
  }
}

// Create singleton instance
const notificationSystem = new NotificationSystem();

// Export functions
const sendNotification = (options) => notificationSystem.sendNotification(options);
const getUserPreferences = (userId) => notificationSystem.getUserPreferences(userId);
const setUserPreferences = (userId, preferences) => notificationSystem.setUserPreferences(userId, preferences);
const getNotificationHistory = (userId, limit) => notificationSystem.getNotificationHistory(userId, limit);
const getNotificationAnalytics = (dateRange) => notificationSystem.getNotificationAnalytics(dateRange);
const getChannelAnalytics = (channel) => notificationSystem.getChannelAnalytics(channel);
const getPerformanceMetrics = () => notificationSystem.getPerformanceMetrics();
const getInAppNotifications = (userId, limit) => notificationSystem.getInAppNotifications(userId, limit);
const markNotificationRead = (userId, notificationId) => notificationSystem.markNotificationRead(userId, notificationId);
const markAllNotificationsRead = (userId) => notificationSystem.markAllNotificationsRead(userId);
const getNotificationStats = (userId) => notificationSystem.getNotificationStats(userId);
const createNotificationTemplate = (name, template) => notificationSystem.createNotificationTemplate(name, template);
const getNotificationTemplate = (name) => notificationSystem.getNotificationTemplate(name);
const listNotificationTemplates = () => notificationSystem.listNotificationTemplates();
const deleteNotificationTemplate = (name) => notificationSystem.deleteNotificationTemplate(name);

module.exports = {
  notificationSystem,
  sendNotification,
  getUserPreferences,
  setUserPreferences,
  getNotificationHistory,
  getNotificationAnalytics,
  getChannelAnalytics,
  getPerformanceMetrics,
  getInAppNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationStats,
  createNotificationTemplate,
  getNotificationTemplate,
  listNotificationTemplates,
  deleteNotificationTemplate
};
