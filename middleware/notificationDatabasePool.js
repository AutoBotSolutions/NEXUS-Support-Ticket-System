/**
 * NEXUS Notification System Database Connection Pool Manager
 * Optimized database connections for notification system performance
 */

const mongoose = require('mongoose');
const { EventEmitter } = require('events');

class NotificationDatabasePool extends EventEmitter {
  constructor() {
    super();
    this.pools = new Map();
    this.connections = new Map();
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      maxConnections: 10,
      minConnections: 2,
      connectionTimeout: 30000,
      idleTimeout: 300000,
      retryAttempts: 3,
      retryDelay: 1000
    };
    
    this.initializePools();
    this.startConnectionMonitoring();
  }

  /**
   * Initialize database connection pools
   */
  initializePools() {
    // Main notification database pool
    this.createPool('notifications', {
      connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus',
      options: {
        maxPoolSize: this.metrics.maxConnections,
        minPoolSize: this.metrics.minConnections,
        maxIdleTimeMS: this.metrics.idleTimeout,
        serverSelectionTimeoutMS: this.metrics.connectionTimeout,
        socketTimeoutMS: 45000
      }
    });

    // Analytics database pool (for notification analytics)
    this.createPool('analytics', {
      connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus',
      options: {
        maxPoolSize: 5,
        minPoolSize: 1,
        maxIdleTimeMS: this.metrics.idleTimeout,
        serverSelectionTimeoutMS: this.metrics.connectionTimeout,
        socketTimeoutMS: 45000
      }
    });

    // Cache database pool (for notification caching)
    this.createPool('cache', {
      connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus',
      options: {
        maxPoolSize: 3,
        minPoolSize: 1,
        maxIdleTimeMS: this.metrics.idleTimeout,
        serverSelectionTimeoutMS: this.metrics.connectionTimeout,
        socketTimeoutMS: 45000
      }
    });
  }

  /**
   * Create a database connection pool
   */
  async createPool(name, config) {
    try {
      const connection = mongoose.createConnection(config.connectionString, config.options);
      
      connection.on('connected', () => {
        console.log(`Notification ${name} database pool connected`);
        this.emit('poolConnected', name);
      });

      connection.on('error', (error) => {
        console.error(`Notification ${name} database pool error:`, error);
        this.emit('poolError', { name, error });
      });

      connection.on('disconnected', () => {
        console.log(`Notification ${name} database pool disconnected`);
        this.emit('poolDisconnected', name);
      });

      // Wait for connection to be established
      await new Promise((resolve, reject) => {
        connection.once('connected', resolve);
        connection.once('error', reject);
        
        // Timeout after connectionTimeout
        setTimeout(() => {
          reject(new Error(`Connection timeout for ${name} pool`));
        }, this.metrics.connectionTimeout);
      });

      this.pools.set(name, {
        connection,
        config,
        created: new Date(),
        lastUsed: new Date(),
        queryCount: 0,
        errorCount: 0
      });

      this.metrics.totalConnections++;
      this.metrics.activeConnections++;

      console.log(`Notification ${name} database pool created successfully`);
      return connection;

    } catch (error) {
      console.error(`Failed to create ${name} database pool:`, error);
      this.emit('poolCreationFailed', { name, error });
      throw error;
    }
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(poolName = 'notifications') {
    const pool = this.pools.get(poolName);
    
    if (!pool) {
      throw new Error(`Database pool '${poolName}' not found`);
    }

    try {
      // Check if connection is ready
      if (pool.connection.readyState !== 1) {
        await this.waitForConnection(pool.connection);
      }

      pool.lastUsed = new Date();
      pool.queryCount++;
      
      this.emit('connectionAcquired', poolName);
      return pool.connection;

    } catch (error) {
      pool.errorCount++;
      this.emit('connectionError', { poolName, error });
      throw error;
    }
  }

  /**
   * Wait for connection to be ready
   */
  async waitForConnection(connection, timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (connection.readyState === 1) {
        resolve(connection);
        return;
      }

      const checkConnection = () => {
        if (connection.readyState === 1) {
          resolve(connection);
        } else if (connection.readyState === 0) {
          setTimeout(checkConnection, 100);
        } else {
          reject(new Error('Connection not ready'));
        }
      };

      setTimeout(checkConnection, 100);

      // Timeout after specified duration
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);
    });
  }

  /**
   * Execute a database query with connection pooling
   */
  async executeQuery(poolName, queryFunction) {
    const startTime = Date.now();
    let connection;
    
    try {
      connection = await this.getConnection(poolName);
      const result = await queryFunction(connection);
      
      const executionTime = Date.now() - startTime;
      this.emit('queryExecuted', { 
        poolName, 
        executionTime, 
        success: true 
      });
      
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.emit('queryExecuted', { 
        poolName, 
        executionTime, 
        success: false, 
        error 
      });
      
      throw error;

    } finally {
      if (connection) {
        this.emit('connectionReleased', poolName);
      }
    }
  }

  /**
   * Get notification database connection
   */
  async getNotificationConnection() {
    return this.getConnection('notifications');
  }

  /**
   * Get analytics database connection
   */
  async getAnalyticsConnection() {
    return this.getConnection('analytics');
  }

  /**
   * Get cache database connection
   */
  async getCacheConnection() {
    return this.getConnection('cache');
  }

  /**
   * Execute notification query
   */
  async executeNotificationQuery(queryFunction) {
    return this.executeQuery('notifications', queryFunction);
  }

  /**
   * Execute analytics query
   */
  async executeAnalyticsQuery(queryFunction) {
    return this.executeQuery('analytics', queryFunction);
  }

  /**
   * Execute cache query
   */
  async executeCacheQuery(queryFunction) {
    return this.executeQuery('cache', queryFunction);
  }

  /**
   * Start connection monitoring
   */
  startConnectionMonitoring() {
    // Monitor connection health every 30 seconds
    setInterval(() => {
      this.checkConnectionHealth();
    }, 30000);

    // Monitor metrics every 60 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 60000);
  }

  /**
   * Check connection health
   */
  async checkConnectionHealth() {
    for (const [name, pool] of this.pools) {
      try {
        if (pool.connection.readyState === 1) {
          // Ping the database
          await pool.connection.db.admin().ping();
          pool.lastUsed = new Date();
        } else {
          console.warn(`Pool ${name} connection not ready, state: ${pool.connection.readyState}`);
        }
      } catch (error) {
        console.error(`Health check failed for pool ${name}:`, error);
        pool.errorCount++;
      }
    }
  }

  /**
   * Update connection metrics
   */
  updateMetrics() {
    let activeConnections = 0;
    let idleConnections = 0;

    for (const [name, pool] of this.pools) {
      if (pool.connection.readyState === 1) {
        const timeSinceLastUse = Date.now() - pool.lastUsed.getTime();
        if (timeSinceLastUse > 60000) {
          idleConnections++;
        } else {
          activeConnections++;
        }
      }
    }

    this.metrics.activeConnections = activeConnections;
    this.metrics.idleConnections = idleConnections;

    this.emit('metricsUpdated', this.metrics);
  }

  /**
   * Get pool metrics
   */
  getMetrics() {
    const poolMetrics = {};
    
    for (const [name, pool] of this.pools) {
      poolMetrics[name] = {
        state: pool.connection.readyState,
        queryCount: pool.queryCount,
        errorCount: pool.errorCount,
        lastUsed: pool.lastUsed,
        created: pool.created,
        uptime: Date.now() - pool.created.getTime()
      };
    }

    return {
      ...this.metrics,
      pools: poolMetrics
    };
  }

  /**
   * Close all connections
   */
  async closeAllConnections() {
    const closePromises = [];
    
    for (const [name, pool] of this.pools) {
      closePromises.push(
        pool.connection.close().then(() => {
          console.log(`Pool ${name} connection closed`);
        }).catch(error => {
          console.error(`Error closing pool ${name}:`, error);
        })
      );
    }

    await Promise.all(closePromises);
    this.pools.clear();
    this.connections.clear();
    
    this.emit('allConnectionsClosed');
  }

  /**
   * Restart a specific pool
   */
  async restartPool(poolName) {
    const pool = this.pools.get(poolName);
    
    if (!pool) {
      throw new Error(`Pool '${poolName}' not found`);
    }

    try {
      // Close existing connection
      await pool.connection.close();
      
      // Remove from pools
      this.pools.delete(poolName);
      
      // Recreate pool
      await this.createPool(poolName, pool.config);
      
      this.emit('poolRestarted', poolName);
      console.log(`Pool ${poolName} restarted successfully`);

    } catch (error) {
      console.error(`Failed to restart pool ${poolName}:`, error);
      this.emit('poolRestartFailed', { poolName, error });
      throw error;
    }
  }

  /**
   * Optimize pool configuration
   */
  optimizePoolConfiguration() {
    const metrics = this.getMetrics();
    
    // Adjust pool sizes based on usage patterns
    for (const [name, pool] of this.pools) {
      const poolMetrics = metrics.pools[name];
      
      if (poolMetrics.queryCount > 1000 && poolMetrics.errorCount < 10) {
        // High usage, low errors - consider increasing pool size
        console.log(`Pool ${name} has high usage (${poolMetrics.queryCount} queries)`);
      }
      
      if (poolMetrics.errorCount > poolMetrics.queryCount * 0.1) {
        // High error rate - consider restarting pool
        console.warn(`Pool ${name} has high error rate (${poolMetrics.errorCount}/${poolMetrics.queryCount})`);
      }
    }
  }

  /**
   * Handle application shutdown
   */
  async shutdown() {
    console.log('Shutting down notification database pools...');
    
    try {
      await this.closeAllConnections();
      console.log('All notification database pools closed successfully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}

// Create singleton instance
const notificationDatabasePool = new NotificationDatabasePool();

// Export functions
const getNotificationConnection = () => notificationDatabasePool.getNotificationConnection();
const getAnalyticsConnection = () => notificationDatabasePool.getAnalyticsConnection();
const getCacheConnection = () => notificationDatabasePool.getCacheConnection();
const executeNotificationQuery = (queryFunction) => notificationDatabasePool.executeNotificationQuery(queryFunction);
const executeAnalyticsQuery = (queryFunction) => notificationDatabasePool.executeAnalyticsQuery(queryFunction);
const executeCacheQuery = (queryFunction) => notificationDatabasePool.executeCacheQuery(queryFunction);
const getPoolMetrics = () => notificationDatabasePool.getMetrics();
const restartPool = (poolName) => notificationDatabasePool.restartPool(poolName);
const optimizePools = () => notificationDatabasePool.optimizePoolConfiguration();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await notificationDatabasePool.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await notificationDatabasePool.shutdown();
  process.exit(0);
});

module.exports = {
  notificationDatabasePool,
  getNotificationConnection,
  getAnalyticsConnection,
  getCacheConnection,
  executeNotificationQuery,
  executeAnalyticsQuery,
  executeCacheQuery,
  getPoolMetrics,
  restartPool,
  optimizePools
};
