/**
 * NEXUS Real-Time Notifications Middleware
 * Integrates with WebSocket server for real-time notification delivery
 */

const { websocketServer } = require('./websocketServer');
const notificationSystem = require('./notificationSystem');

class RealtimeNotifications {
  constructor() {
    this.enabled = true;
    this.metrics = {
      notificationsSent: 0,
      notificationsDelivered: 0,
      notificationsFailed: 0,
      usersReached: 0,
      deliveryRate: 0
    };
    this.eventListeners = new Map();
  }

  /**
   * Initialize real-time notifications
   */
  async initialize() {
    try {
      // Setup event listeners for different notification types
      this.setupEventListeners();
      
      // Setup integration with notification system
      this.setupNotificationIntegration();
      
      console.log('🚀 Real-time notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize real-time notifications:', error);
      return false;
    }
  }

  /**
   * Setup event listeners for notification events
   */
  setupEventListeners() {
    // Listen for new notifications
    this.eventListeners.set('notification.created', (notification) => {
      this.handleNotificationCreated(notification);
    });

    // Listen for notification updates
    this.eventListeners.set('notification.updated', (notification) => {
      this.handleNotificationUpdated(notification);
    });

    // Listen for user events
    this.eventListeners.set('user.assigned', (data) => {
      this.handleUserAssigned(data);
    });

    // Listen for ticket events
    this.eventListeners.set('ticket.created', (ticket) => {
      this.handleTicketCreated(ticket);
    });

    this.eventListeners.set('ticket.updated', (ticket) => {
      this.handleTicketUpdated(ticket);
    });

    this.eventListeners.set('ticket.assigned', (data) => {
      this.handleTicketAssigned(data);
    });

    // Listen for system events
    this.eventListeners.set('system.maintenance', (data) => {
      this.handleSystemMaintenance(data);
    });

    this.eventListeners.set('system.alert', (alert) => {
      this.handleSystemAlert(alert);
    });
  }

  /**
   * Setup integration with notification system
   */
  setupNotificationIntegration() {
    // Override notification system send method to include real-time delivery
    if (notificationSystem && notificationSystem.sendNotification) {
      const originalSend = notificationSystem.sendNotification.bind(notificationSystem);
      
      notificationSystem.sendNotification = async (notification, options = {}) => {
        try {
          // Send notification through original method
          const result = await originalSend(notification, options);
          
          // Send real-time notification if enabled
          if (this.enabled && options.realtime !== false) {
            await this.sendRealtimeNotification(notification, options);
          }
          
          return result;
        } catch (error) {
          console.error('❌ Error in enhanced notification send:', error);
          throw error;
        }
      };
    }
  }

  /**
   * Handle notification created event
   */
  async handleNotificationCreated(notification) {
    try {
      await this.sendRealtimeNotification(notification, {
        type: 'notification.created',
        priority: notification.priority || 'normal'
      });
    } catch (error) {
      console.error('❌ Error handling notification created:', error);
    }
  }

  /**
   * Handle notification updated event
   */
  async handleNotificationUpdated(notification) {
    try {
      await this.sendRealtimeNotification(notification, {
        type: 'notification.updated',
        priority: 'normal'
      });
    } catch (error) {
      console.error('❌ Error handling notification updated:', error);
    }
  }

  /**
   * Handle user assigned event
   */
  async handleUserAssigned(data) {
    try {
      const { user, assignee, context } = data;
      
      const notification = {
        _id: `assignment_${Date.now()}`,
        title: 'User Assignment',
        message: `${user.name} has been assigned to ${context}`,
        type: 'assignment',
        priority: 'normal',
        userId: assignee._id,
        data: {
          user: user,
          assignee: assignee,
          context: context
        }
      };

      await this.sendRealtimeNotification(notification, {
        type: 'user.assigned',
        targetUsers: [assignee._id]
      });
    } catch (error) {
      console.error('❌ Error handling user assigned:', error);
    }
  }

  /**
   * Handle ticket created event
   */
  async handleTicketCreated(ticket) {
    try {
      const notification = {
        _id: `ticket_created_${ticket._id}`,
        title: 'New Ticket Created',
        message: `Ticket #${ticket.ticketNumber}: ${ticket.subject}`,
        type: 'ticket.created',
        priority: ticket.priority || 'normal',
        data: {
          ticket: ticket
        }
      };

      // Send to support team
      await this.sendRealtimeNotification(notification, {
        type: 'ticket.created',
        targetRole: 'agent'
      });
    } catch (error) {
      console.error('❌ Error handling ticket created:', error);
    }
  }

  /**
   * Handle ticket updated event
   */
  async handleTicketUpdated(ticket) {
    try {
      const notification = {
        _id: `ticket_updated_${ticket._id}`,
        title: 'Ticket Updated',
        message: `Ticket #${ticket.ticketNumber} has been updated`,
        type: 'ticket.updated',
        priority: 'normal',
        userId: ticket.assignedTo,
        data: {
          ticket: ticket
        }
      };

      await this.sendRealtimeNotification(notification, {
        type: 'ticket.updated'
      });
    } catch (error) {
      console.error('❌ Error handling ticket updated:', error);
    }
  }

  /**
   * Handle ticket assigned event
   */
  async handleTicketAssigned(data) {
    try {
      const { ticket, assignee } = data;
      
      const notification = {
        _id: `ticket_assigned_${ticket._id}`,
        title: 'Ticket Assigned',
        message: `Ticket #${ticket.ticketNumber} assigned to you`,
        type: 'ticket.assigned',
        priority: 'high',
        userId: assignee._id,
        data: {
          ticket: ticket,
          assignee: assignee
        }
      };

      await this.sendRealtimeNotification(notification, {
        type: 'ticket.assigned',
        targetUsers: [assignee._id]
      });
    } catch (error) {
      console.error('❌ Error handling ticket assigned:', error);
    }
  }

  /**
   * Handle system maintenance event
   */
  async handleSystemMaintenance(data) {
    try {
      const notification = {
        _id: `maintenance_${Date.now()}`,
        title: 'System Maintenance',
        message: data.message,
        type: 'system.maintenance',
        priority: 'high',
        data: data
      };

      await this.sendRealtimeNotification(notification, {
        type: 'system.maintenance',
        broadcast: true
      });
    } catch (error) {
      console.error('❌ Error handling system maintenance:', error);
    }
  }

  /**
   * Handle system alert event
   */
  async handleSystemAlert(alert) {
    try {
      const notification = {
        _id: `alert_${alert._id}`,
        title: alert.title,
        message: alert.message,
        type: 'system.alert',
        priority: alert.severity || 'high',
        data: alert
      };

      // Send to appropriate users based on alert
      const targetUsers = alert.targetUsers || [];
      const targetRole = alert.targetRole || 'admin';

      await this.sendRealtimeNotification(notification, {
        type: 'system.alert',
        targetUsers: targetUsers.length > 0 ? targetUsers : null,
        targetRole: targetUsers.length === 0 ? targetRole : null
      });
    } catch (error) {
      console.error('❌ Error handling system alert:', error);
    }
  }

  /**
   * Send real-time notification
   */
  async sendRealtimeNotification(notification, options = {}) {
    try {
      if (!this.enabled) {
        return false;
      }

      let delivered = false;
      const startTime = Date.now();

      // Prepare notification data
      const notificationData = {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'notification',
        priority: notification.priority || 'normal',
        category: notification.category || 'general',
        data: notification.data || {},
        timestamp: new Date().toISOString(),
        metadata: {
          deliveryTime: Date.now() - startTime,
          channel: 'realtime',
          type: options.type || 'notification'
        }
      };

      // Determine target audience
      if (options.broadcast) {
        // Broadcast to all connected users
        delivered = websocketServer.broadcast('notification', notificationData);
        this.metrics.usersReached += websocketServer.getMetrics().activeConnections;
      } else if (options.targetUsers && Array.isArray(options.targetUsers)) {
        // Send to specific users
        let usersReached = 0;
        for (const userId of options.targetUsers) {
          if (websocketServer.sendToUser(userId, 'notification', notificationData)) {
            usersReached++;
          }
        }
        delivered = usersReached > 0;
        this.metrics.usersReached += usersReached;
      } else if (options.targetRole) {
        // Send to users with specific role
        delivered = websocketServer.sendToRole(options.targetRole, 'notification', notificationData);
        // Note: We can't easily track exact users reached for role-based sending
      } else if (notification.userId) {
        // Send to specific user
        delivered = websocketServer.sendToUser(notification.userId, 'notification', notificationData);
        if (delivered) {
          this.metrics.usersReached += 1;
        }
      } else {
        // Default: broadcast
        delivered = websocketServer.broadcast('notification', notificationData);
        this.metrics.usersReached += websocketServer.getMetrics().activeConnections;
      }

      // Update metrics
      this.metrics.notificationsSent++;
      if (delivered) {
        this.metrics.notificationsDelivered++;
      } else {
        this.metrics.notificationsFailed++;
      }

      // Calculate delivery rate
      const total = this.metrics.notificationsDelivered + this.metrics.notificationsFailed;
      this.metrics.deliveryRate = total > 0 ? (this.metrics.notificationsDelivered / total) * 100 : 0;

      console.log(`📬 Real-time notification sent: ${notification.title} - Delivered: ${delivered}`);
      return delivered;
    } catch (error) {
      console.error('❌ Error sending real-time notification:', error);
      this.metrics.notificationsFailed++;
      return false;
    }
  }

  /**
   * Send custom real-time event
   */
  async sendCustomEvent(eventName, data, options = {}) {
    try {
      if (!this.enabled) {
        return false;
      }

      const eventData = {
        event: eventName,
        data: data,
        timestamp: new Date().toISOString(),
        metadata: {
          channel: 'realtime',
          source: 'custom'
        }
      };

      let delivered = false;

      if (options.broadcast) {
        delivered = websocketServer.broadcast(eventName, eventData);
      } else if (options.targetUsers && Array.isArray(options.targetUsers)) {
        for (const userId of options.targetUsers) {
          if (websocketServer.sendToUser(userId, eventName, eventData)) {
            delivered = true;
          }
        }
      } else if (options.targetRole) {
        delivered = websocketServer.sendToRole(options.targetRole, eventName, eventData);
      } else if (options.targetRoom) {
        delivered = websocketServer.sendToRoom(options.targetRoom, eventName, eventData);
      }

      console.log(`🔔 Custom event sent: ${eventName} - Delivered: ${delivered}`);
      return delivered;
    } catch (error) {
      console.error('❌ Error sending custom event:', error);
      return false;
    }
  }

  /**
   * Trigger event
   */
  triggerEvent(eventName, data) {
    try {
      const listener = this.eventListeners.get(eventName);
      if (listener) {
        listener(data);
      }
    } catch (error) {
      console.error(`❌ Error triggering event ${eventName}:`, error);
    }
  }

  /**
   * Enable/disable real-time notifications
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`📊 Real-time notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      enabled: this.enabled,
      websocketMetrics: websocketServer.getMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      notificationsSent: 0,
      notificationsDelivered: 0,
      notificationsFailed: 0,
      usersReached: 0,
      deliveryRate: 0
    };
    console.log('📊 Real-time notification metrics reset');
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const websocketMetrics = websocketServer.getMetrics();
      const isHealthy = this.enabled && websocketMetrics.activeConnections >= 0;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        enabled: this.enabled,
        websocketConnected: websocketMetrics.activeConnections,
        metrics: this.getMetrics(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Real-time notifications health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      console.log('🔄 Shutting down real-time notifications...');
      
      // Disable new notifications
      this.setEnabled(false);
      
      // Wait for existing notifications to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Real-time notifications shut down successfully');
    } catch (error) {
      console.error('❌ Error shutting down real-time notifications:', error);
    }
  }
}

// Create singleton instance
const realtimeNotifications = new RealtimeNotifications();

module.exports = {
  realtimeNotifications,
  initialize: () => realtimeNotifications.initialize(),
  sendRealtimeNotification: (notification, options) => realtimeNotifications.sendRealtimeNotification(notification, options),
  sendCustomEvent: (eventName, data, options) => realtimeNotifications.sendCustomEvent(eventName, data, options),
  triggerEvent: (eventName, data) => realtimeNotifications.triggerEvent(eventName, data),
  setEnabled: (enabled) => realtimeNotifications.setEnabled(enabled),
  getMetrics: () => realtimeNotifications.getMetrics(),
  resetMetrics: () => realtimeNotifications.resetMetrics(),
  healthCheck: () => realtimeNotifications.healthCheck(),
  shutdown: () => realtimeNotifications.shutdown()
};
