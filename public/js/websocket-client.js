/**
 * NEXUS WebSocket Client
 * Client-side WebSocket implementation for real-time notifications
 */

class NEXUSWebSocketClient {
  constructor(options = {}) {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.token = options.token || null;
    this.eventHandlers = new Map();
    this.notificationQueue = [];
    this.metrics = {
      connections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      lastConnected: null,
      lastDisconnected: null
    };
  }

  /**
   * Initialize WebSocket connection
   */
  async initialize(token) {
    try {
      this.token = token;
      
      // Get WebSocket configuration
      const config = await this.getWebSocketConfig();
      
      // Connect to WebSocket server
      await this.connect(config);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket client:', error);
      return false;
    }
  }

  /**
   * Get WebSocket configuration from server
   */
  async getWebSocketConfig() {
    try {
      const response = await fetch('/api/websocket/config', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get WebSocket configuration');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ Error getting WebSocket config:', error);
      throw error;
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect(config) {
    return new Promise((resolve, reject) => {
      try {
        // Import socket.io-client
        const io = require('socket.io-client');
        
        // Create socket connection
        this.socket = io(config.websocketUrl, {
          transports: config.transports,
          timeout: config.timeout,
          forceNew: config.forceNew,
          reconnection: config.reconnection,
          reconnectionDelay: config.reconnectionDelay,
          reconnectionAttempts: config.reconnectionAttempts,
          auth: {
            token: this.token
          }
        });

        // Setup event handlers
        this.setupEventHandlers();

        // Handle connection success
        this.socket.on('connect', () => {
          this.onConnect();
          resolve();
        });

        // Handle connection error
        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          this.metrics.errors++;
          reject(error);
        });

      } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => this.onConnect());
    this.socket.on('disconnect', (reason) => this.onDisconnect(reason));
    this.socket.on('reconnect', (attemptNumber) => this.onReconnect(attemptNumber));
    this.socket.on('reconnect_attempt', (attemptNumber) => this.onReconnectAttempt(attemptNumber));
    this.socket.on('reconnect_error', (error) => this.onReconnectError(error));
    this.socket.on('reconnect_failed', () => this.onReconnectFailed());

    // Server events
    this.socket.on('connected', (data) => this.onConnected(data));
    this.socket.on('notification', (data) => this.onNotification(data));
    this.socket.on('broadcast', (data) => this.onBroadcast(data));
    this.socket.on('user-connection-status', (data) => this.onUserConnectionStatus(data));
    this.socket.on('user-typing', (data) => this.onUserTyping(data));
    this.socket.on('notification-read-updated', (data) => this.onNotificationReadUpdated(data));
    this.socket.on('server-shutdown', (data) => this.onServerShutdown(data));

    // Room events
    this.socket.on('room-joined', (data) => this.onRoomJoined(data));
    this.socket.on('room-left', (data) => this.onRoomLeft(data));

    // Error handling
    this.socket.on('error', (error) => this.onError(error));
  }

  /**
   * Handle successful connection
   */
  onConnect() {
    this.connected = true;
    this.reconnectAttempts = 0;
    this.metrics.connections++;
    this.metrics.lastConnected = new Date().toISOString();
    
    console.log('✅ Connected to NEXUS WebSocket server');
    this.emit('connected', {
      connected: true,
      timestamp: new Date().toISOString()
    });

    // Process queued notifications
    this.processNotificationQueue();
  }

  /**
   * Handle disconnection
   */
  onDisconnect(reason) {
    this.connected = false;
    this.metrics.lastDisconnected = new Date().toISOString();
    
    console.log(`🔌 Disconnected from WebSocket server: ${reason}`);
    this.emit('disconnected', {
      connected: false,
      reason: reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle reconnection
   */
  onReconnect(attemptNumber) {
    console.log(`🔄 Reconnected to WebSocket server (attempt ${attemptNumber})`);
    this.emit('reconnected', {
      attemptNumber,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle reconnection attempt
   */
  onReconnectAttempt(attemptNumber) {
    this.reconnectAttempts = attemptNumber;
    console.log(`🔄 Attempting to reconnect (${attemptNumber}/${this.maxReconnectAttempts})`);
    this.emit('reconnect_attempt', {
      attemptNumber,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle reconnection error
   */
  onReconnectError(error) {
    console.error('❌ Reconnection error:', error);
    this.metrics.errors++;
    this.emit('reconnect_error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle reconnection failed
   */
  onReconnectFailed() {
    console.error('❌ Failed to reconnect to WebSocket server');
    this.emit('reconnect_failed', {
      attempts: this.reconnectAttempts,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle connected message from server
   */
  onConnected(data) {
    console.log('📬 Received connected message from server:', data);
    this.emit('server_connected', data);
  }

  /**
   * Handle incoming notification
   */
  onNotification(data) {
    this.metrics.messagesReceived++;
    
    console.log('📬 Received notification:', data);
    
    // Show browser notification if permission granted
    this.showBrowserNotification(data);
    
    // Emit to event handlers
    this.emit('notification', data);
  }

  /**
   * Handle broadcast message
   */
  onBroadcast(data) {
    this.metrics.messagesReceived++;
    
    console.log('📢 Received broadcast:', data);
    this.emit('broadcast', data);
  }

  /**
   * Handle user connection status update
   */
  onUserConnectionStatus(data) {
    console.log('👤 User connection status updated:', data);
    this.emit('user_connection_status', data);
  }

  /**
   * Handle user typing indicator
   */
  onUserTyping(data) {
    console.log('⌨️ User typing indicator:', data);
    this.emit('user_typing', data);
  }

  /**
   * Handle notification read status update
   */
  onNotificationReadUpdated(data) {
    console.log('📖 Notification read status updated:', data);
    this.emit('notification_read_updated', data);
  }

  /**
   * Handle server shutdown
   */
  onServerShutdown(data) {
    console.log('🔄 Server shutting down:', data);
    this.emit('server_shutdown', data);
  }

  /**
   * Handle room joined
   */
  onRoomJoined(data) {
    console.log('📝 Joined room:', data);
    this.emit('room_joined', data);
  }

  /**
   * Handle room left
   */
  onRoomLeft(data) {
    console.log('📝 Left room:', data);
    this.emit('room_left', data);
  }

  /**
   * Handle WebSocket error
   */
  onError(error) {
    console.error('❌ WebSocket error:', error);
    this.metrics.errors++;
    this.emit('error', error);
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(data) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(data.notification.title, {
          body: data.notification.message,
          icon: '/favicon.ico',
          tag: data.notification.id,
          data: data
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          this.emit('notification_clicked', data);
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('❌ Error showing browser notification:', error);
    }
  }

  /**
   * Join a room
   */
  joinRoom(roomName) {
    if (this.connected && this.socket) {
      this.socket.emit('join-room', { roomName });
      return true;
    }
    return false;
  }

  /**
   * Leave a room
   */
  leaveRoom(roomName) {
    if (this.connected && this.socket) {
      this.socket.emit('leave-room', { roomName });
      return true;
    }
    return false;
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId, read = true) {
    if (this.connected && this.socket) {
      this.socket.emit('notification-read', { notificationId, read });
      return true;
    }
    return false;
  }

  /**
   * Send typing indicator
   */
  sendTypingStart(room, context) {
    if (this.connected && this.socket) {
      this.socket.emit('typing-start', { room, context });
      return true;
    }
    return false;
  }

  /**
   * Send typing stop indicator
   */
  sendTypingStop(room, context) {
    if (this.connected && this.socket) {
      this.socket.emit('typing-stop', { room, context });
      return true;
    }
    return false;
  }

  /**
   * Send custom event
   */
  sendCustomEvent(event, payload, target = null) {
    if (this.connected && this.socket) {
      this.metrics.messagesSent++;
      this.socket.emit('custom-event', { event, payload, target });
      return true;
    }
    return false;
  }

  /**
   * Process notification queue
   */
  processNotificationQueue() {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      this.onNotification(notification);
    }
  }

  /**
   * Add event listener
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Remove event listener
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to handlers
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
      notificationQueueSize: this.notificationQueue.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    console.log('🔌 Disconnected from WebSocket server');
  }

  /**
   * Reconnect to WebSocket server
   */
  async reconnect() {
    if (this.socket) {
      this.disconnect();
    }
    
    try {
      const config = await this.getWebSocketConfig();
      await this.connect(config);
      return true;
    } catch (error) {
      console.error('❌ Failed to reconnect:', error);
      return false;
    }
  }
}

// Create singleton instance
const nexusWebSocketClient = new NEXUSWebSocketClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NEXUSWebSocketClient;
} else {
  window.NEXUSWebSocketClient = NEXUSWebSocketClient;
  window.nexusWebSocketClient = nexusWebSocketClient;
}

// Auto-initialize if token is available
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeWebSocketClient();
    });
  } else {
    initializeWebSocketClient();
  }
}

/**
 * Initialize WebSocket client with token from localStorage or global
 */
async function initializeWebSocketClient() {
  try {
    // Get token from localStorage or global variable
    const token = localStorage.getItem('token') || window.nexusToken;
    
    if (token) {
      await nexusWebSocketClient.initialize(token);
    } else {
      console.log('⚠️ No authentication token found, WebSocket client not initialized');
    }
  } catch (error) {
    console.error('❌ Failed to initialize WebSocket client:', error);
  }
}
