/**
 * NEXUS WebSocket Server
 * Real-time notification delivery system
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketServer {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket.id
    this.userSockets = new Map(); // socket.id -> userId
    this.rooms = new Map(); // roomName -> Set of socket.ids
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0
    };
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server, options = {}) {
    try {
      this.io = new Server(server, {
        cors: {
          origin: options.corsOrigin || process.env.CORS_ORIGIN || "*",
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
      });

      this.setupMiddleware();
      this.setupEventHandlers();
      
      console.log('🚀 WebSocket server initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket server:', error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Setup authentication and logging middleware
   */
  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
          return next(new Error('Invalid user or inactive account'));
        }

        socket.user = user;
        socket.userId = user._id.toString();
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Logging middleware
    this.io.use((socket, next) => {
      console.log(`🔗 WebSocket connection attempt: User ${socket.userId}`);
      this.metrics.totalConnections++;
      next();
    });
  }

  /**
   * Setup main event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    this.io.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.metrics.errors++;
    });
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    const user = socket.user;

    console.log(`✅ User connected: ${user.email} (${userId})`);
    
    // Store connection
    this.connectedUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, userId);
    this.metrics.activeConnections++;

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Join user to their role-based rooms
    socket.join(`role:${user.role}`);

    // Join user to their team rooms
    if (user.teams && user.teams.length > 0) {
      user.teams.forEach(team => {
        socket.join(`team:${team.teamId}`);
      });
    }

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to NEXUS real-time notifications',
      userId: userId,
      timestamp: new Date().toISOString()
    });

    // Setup event handlers for this socket
    this.setupSocketEventHandlers(socket);

    // Notify other systems about user connection
    this.notifyUserConnection(userId, 'online');
  }

  /**
   * Setup event handlers for individual socket
   */
  setupSocketEventHandlers(socket) {
    const userId = socket.userId;

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle joining rooms
    socket.on('join-room', (roomName) => {
      this.handleJoinRoom(socket, roomName);
    });

    // Handle leaving rooms
    socket.on('leave-room', (roomName) => {
      this.handleLeaveRoom(socket, roomName);
    });

    // Handle notification read status
    socket.on('notification-read', (data) => {
      this.handleNotificationRead(socket, data);
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing-stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle custom events
    socket.on('custom-event', (data) => {
      this.handleCustomEvent(socket, data);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ WebSocket error for user ${userId}:`, error);
      this.metrics.errors++;
    });
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket, reason) {
    const userId = socket.userId;
    const user = socket.user;

    console.log(`🔌 User disconnected: ${user.email} (${userId}) - Reason: ${reason}`);

    // Remove connection tracking
    this.connectedUsers.delete(userId);
    this.userSockets.delete(socket.id);
    this.metrics.activeConnections--;

    // Remove from all rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        this.leaveRoom(socket, room);
      }
    });

    // Notify other systems about user disconnection
    this.notifyUserConnection(userId, 'offline');
  }

  /**
   * Handle joining a room
   */
  handleJoinRoom(socket, roomName) {
    try {
      if (typeof roomName === 'string' && roomName.length > 0) {
        socket.join(roomName);
        this.joinRoom(socket, roomName);
        
        socket.emit('room-joined', {
          room: roomName,
          timestamp: new Date().toISOString()
        });

        console.log(`📝 User ${socket.userId} joined room: ${roomName}`);
      }
    } catch (error) {
      console.error(`❌ Error joining room ${roomName}:`, error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  /**
   * Handle leaving a room
   */
  handleLeaveRoom(socket, roomName) {
    try {
      if (typeof roomName === 'string' && roomName.length > 0) {
        socket.leave(roomName);
        this.leaveRoom(socket, roomName);
        
        socket.emit('room-left', {
          room: roomName,
          timestamp: new Date().toISOString()
        });

        console.log(`📝 User ${socket.userId} left room: ${roomName}`);
      }
    } catch (error) {
      console.error(`❌ Error leaving room ${roomName}:`, error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  }

  /**
   * Handle notification read status
   */
  handleNotificationRead(socket, data) {
    try {
      const { notificationId, read } = data;
      
      // Broadcast to user's other sessions
      this.broadcastToUser(socket.userId, 'notification-read-updated', {
        notificationId,
        read,
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });

      console.log(`📖 User ${socket.userId} marked notification ${notificationId} as ${read ? 'read' : 'unread'}`);
    } catch (error) {
      console.error(`❌ Error handling notification read:`, error);
    }
  }

  /**
   * Handle typing start
   */
  handleTypingStart(socket, data) {
    try {
      const { room, context } = data;
      
      if (room) {
        socket.to(room).emit('user-typing', {
          userId: socket.userId,
          user: socket.user,
          context,
          typing: true,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`❌ Error handling typing start:`, error);
    }
  }

  /**
   * Handle typing stop
   */
  handleTypingStop(socket, data) {
    try {
      const { room, context } = data;
      
      if (room) {
        socket.to(room).emit('user-typing', {
          userId: socket.userId,
          user: socket.user,
          context,
          typing: false,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`❌ Error handling typing stop:`, error);
    }
  }

  /**
   * Handle custom events
   */
  handleCustomEvent(socket, data) {
    try {
      const { event, payload, target } = data;
      
      if (target) {
        if (target.type === 'user') {
          this.sendToUser(target.id, event, payload);
        } else if (target.type === 'room') {
          this.sendToRoom(target.id, event, payload);
        } else if (target.type === 'role') {
          this.sendToRole(target.id, event, payload);
        }
      }

      console.log(`🔔 Custom event sent: ${event} to ${target?.type || 'broadcast'}`);
    } catch (error) {
      console.error(`❌ Error handling custom event:`, error);
    }
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId, event, data) {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit(event, {
          ...data,
          timestamp: new Date().toISOString()
        });
        this.metrics.messagesSent++;
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error sending to user ${userId}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Send notification to room
   */
  sendToRoom(roomName, event, data) {
    try {
      this.io.to(roomName).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      this.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(`❌ Error sending to room ${roomName}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Send notification to users with specific role
   */
  sendToRole(role, event, data) {
    try {
      this.io.to(`role:${role}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      this.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(`❌ Error sending to role ${role}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Send notification to team
   */
  sendToTeam(teamId, event, data) {
    try {
      this.io.to(`team:${teamId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      this.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(`❌ Error sending to team ${teamId}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event, data) {
    try {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      this.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(`❌ Error broadcasting:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Send real-time notification
   */
  sendNotification(notification, targetUsers = null) {
    try {
      const eventData = {
        type: 'notification',
        notification: {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          data: notification.data || {}
        }
      };

      if (targetUsers && Array.isArray(targetUsers)) {
        // Send to specific users
        targetUsers.forEach(userId => {
          this.sendToUser(userId, 'notification', eventData);
        });
      } else if (notification.userId) {
        // Send to specific user
        this.sendToUser(notification.userId, 'notification', eventData);
      } else {
        // Broadcast to all
        this.broadcast('notification', eventData);
      }

      console.log(`📬 Real-time notification sent: ${notification.title}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending real-time notification:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Get connection metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.rooms.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get connected users list
   */
  getConnectedUsers() {
    const users = [];
    for (const [userId, socketId] of this.connectedUsers) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.user) {
        users.push({
          userId,
          socketId,
          email: socket.user.email,
          name: socket.user.firstName + ' ' + socket.user.lastName,
          role: socket.user.role,
          connectedAt: socket.handshake.time
        });
      }
    }
    return users;
  }

  /**
   * Get room information
   */
  getRoomInfo(roomName) {
    const sockets = this.io.sockets.adapter.rooms.get(roomName);
    if (!sockets) return null;

    const users = [];
    sockets.forEach(socketId => {
      const userId = this.userSockets.get(socketId);
      if (userId) {
        users.push(userId);
      }
    });

    return {
      room: roomName,
      userCount: users.length,
      users: users
    };
  }

  /**
   * Disconnect user
   */
  disconnectUser(userId, reason = 'Manual disconnect') {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
          console.log(`🔌 Manually disconnected user: ${userId} - Reason: ${reason}`);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`❌ Error disconnecting user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Join room helper
   */
  joinRoom(socket, roomName) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(socket.id);
  }

  /**
   * Leave room helper
   */
  leaveRoom(socket, roomName) {
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).delete(socket.id);
      if (this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName);
      }
    }
  }

  /**
   * Broadcast to user helper
   */
  broadcastToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      this.metrics.messagesSent++;
    }
  }

  /**
   * Notify about user connection status
   */
  notifyUserConnection(userId, status) {
    this.broadcast('user-connection-status', {
      userId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    console.log('🔄 Shutting down WebSocket server...');
    
    // Disconnect all clients
    this.io.emit('server-shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });

    // Close server
    this.io.close(() => {
      console.log('✅ WebSocket server shut down successfully');
    });
  }
}

// Create singleton instance
const websocketServer = new WebSocketServer();

module.exports = {
  websocketServer,
  initialize: (server, options) => websocketServer.initialize(server, options),
  sendToUser: (userId, event, data) => websocketServer.sendToUser(userId, event, data),
  sendToRoom: (roomName, event, data) => websocketServer.sendToRoom(roomName, event, data),
  sendToRole: (role, event, data) => websocketServer.sendToRole(role, event, data),
  sendToTeam: (teamId, event, data) => websocketServer.sendToTeam(teamId, event, data),
  broadcast: (event, data) => websocketServer.broadcast(event, data),
  sendNotification: (notification, targetUsers) => websocketServer.sendNotification(notification, targetUsers),
  getMetrics: () => websocketServer.getMetrics(),
  getConnectedUsers: () => websocketServer.getConnectedUsers(),
  getRoomInfo: (roomName) => websocketServer.getRoomInfo(roomName),
  disconnectUser: (userId, reason) => websocketServer.disconnectUser(userId, reason),
  shutdown: () => websocketServer.shutdown()
};
