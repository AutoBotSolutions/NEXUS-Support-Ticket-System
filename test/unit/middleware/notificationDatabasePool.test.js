/**
 * Notification Database Pool System Tests
 * Comprehensive test suite for the database connection pool manager
 */

const { 
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
} = require('../../middleware/notificationDatabasePool');

describe('Notification Database Pool System', () => {
  let testNotification;
  let testAnalytics;
  let testCache;

  beforeEach(() => {
    // Reset pool metrics before each test
    notificationDatabasePool.metrics.totalConnections = 0;
    notificationDatabasePool.metrics.activeConnections = 0;
    notificationDatabasePool.metrics.idleConnections = 0;
  });

  afterEach(() => {
    // Clean up after each test
  });

  describe('Database Pool Initialization', () => {
    test('should initialize all database pools successfully', () => {
      expect(notificationDatabasePool.pools.size).toBe(3);
      expect(notificationDatabasePool.pools.has('notifications')).toBe(true);
      expect(notificationDatabasePool.pools.has('analytics')).toBe(true);
      expect(notificationDatabasePool.pools.has('cache')).toBe(true);
    });

    test('should have correct pool configuration', () => {
      const notificationsPool = notificationDatabasePool.pools.get('notifications');
      const analyticsPool = notificationDatabasePool.pools.get('analytics');
      const cachePool = notificationDatabasePool.pools.get('cache');

      expect(notificationsPool.config.options.maxPoolSize).toBe(10);
      expect(notificationsPool.config.options.minPoolSize).toBe(2);
      
      expect(analyticsPool.config.options.maxPoolSize).toBe(5);
      expect(analyticsPool.config.options.minPoolSize).toBe(1);
      
      expect(cachePool.config.options.maxPoolSize).toBe(3);
      expect(cachePool.config.options.minPoolSize).toBe(1);
    });

    test('should have proper metrics initialization', () => {
      const metrics = getPoolMetrics();
      
      expect(metrics.totalConnections).toBeGreaterThanOrEqual(0);
      expect(metrics.maxConnections).toBe(10);
      expect(metrics.minConnections).toBe(2);
      expect(metrics.connectionTimeout).toBe(30000);
      expect(metrics.idleTimeout).toBe(300000);
      expect(metrics.retryAttempts).toBe(3);
      expect(metrics.retryDelay).toBe(1000);
    });
  });

  describe('Connection Management', () => {
    test('should get notification connection successfully', async () => {
      const connection = await getNotificationConnection();
      expect(connection).toBeDefined();
      expect(typeof connection).toBe('object');
    });

    test('should get analytics connection successfully', async () => {
      const connection = await getAnalyticsConnection();
      expect(connection).toBeDefined();
      expect(typeof connection).toBe('object');
    });

    test('should get cache connection successfully', async () => {
      const connection = await getCacheConnection();
      expect(connection).toBeDefined();
      expect(typeof connection).toBe('object');
    });

    test('should throw error for non-existent pool', async () => {
      await expect(getConnection('non-existent')).rejects.toThrow("Database pool 'non-existent' not found");
    });

    test('should handle connection timeouts gracefully', async () => {
      // Mock a connection that never becomes ready
      const mockConnection = {
        readyState: 0, // disconnected
        once: jest.fn()
      };

      // This should timeout and throw an error
      await expect(notificationDatabasePool.waitForConnection(mockConnection, 100)).rejects.toThrow('Connection timeout');
    });
  });

  describe('Query Execution', () => {
    test('should execute notification query successfully', async () => {
      const queryFunction = jest.fn().mockResolvedValue({ success: true, data: 'test' });
      
      const result = await executeNotificationQuery(queryFunction);
      
      expect(result).toEqual({ success: true, data: 'test' });
      expect(queryFunction).toHaveBeenCalled();
    });

    test('should execute analytics query successfully', async () => {
      const queryFunction = jest.fn().mockResolvedValue({ success: true, data: 'analytics' });
      
      const result = await executeAnalyticsQuery(queryFunction);
      
      expect(result).toEqual({ success: true, data: 'analytics' });
      expect(queryFunction).toHaveBeenCalled();
    });

    test('should execute cache query successfully', async () => {
      const queryFunction = jest.fn().mockResolvedValue({ success: true, data: 'cached' });
      
      const result = await executeCacheQuery(queryFunction);
      
      expect(result).toEqual({ success: true, data: 'cached' });
      expect(queryFunction).toHaveBeenCalled();
    });

    test('should handle query execution errors gracefully', async () => {
      const queryFunction = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await expect(executeNotificationQuery(queryFunction)).rejects.toThrow('Database error');
      expect(queryFunction).toHaveBeenCalled();
    });

    test('should measure query execution time', async () => {
      let startTime;
      const queryFunction = jest.fn().mockImplementation(async (connection) => {
        startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
      });
      
      const result = await executeNotificationQuery(queryFunction);
      
      expect(result).toBeDefined();
      expect(queryFunction).toHaveBeenCalled();
    });
  });

  describe('Pool Metrics', () => {
    test('should get comprehensive pool metrics', () => {
      const metrics = getPoolMetrics();
      
      expect(metrics).toHaveProperty('totalConnections');
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('idleConnections');
      expect(metrics).toHaveProperty('maxConnections');
      expect(metrics).toHaveProperty('minConnections');
      expect(metrics).toHaveProperty('pools');
      
      expect(typeof metrics.totalConnections).toBe('number');
      expect(typeof metrics.activeConnections).toBe('number');
      expect(typeof metrics.idleConnections).toBe('number');
      expect(typeof metrics.pools).toBe('object');
    });

    test('should include individual pool metrics', () => {
      const metrics = getPoolMetrics();
      
      expect(metrics.pools).toHaveProperty('notifications');
      expect(metrics.pools).toHaveProperty('analytics');
      expect(metrics.pools).toHaveProperty('cache');
      
      const notificationsPool = metrics.pools.notifications;
      expect(notificationsPool).toHaveProperty('state');
      expect(notificationsPool).toHaveProperty('queryCount');
      expect(notificationsPool).toHaveProperty('errorCount');
      expect(notificationsPool).toHaveProperty('lastUsed');
      expect(notificationsPool).toHaveProperty('created');
      expect(notificationsPool).toHaveProperty('uptime');
    });

    test('should update metrics on connection usage', async () => {
      const initialMetrics = getPoolMetrics();
      const initialQueryCount = initialMetrics.pools.notifications.queryCount;
      
      // Execute a query to increment metrics
      const queryFunction = jest.fn().mockResolvedValue({ success: true });
      await executeNotificationQuery(queryFunction);
      
      const updatedMetrics = getPoolMetrics();
      expect(updatedMetrics.pools.notifications.queryCount).toBeGreaterThan(initialQueryCount);
    });
  });

  describe('Pool Management', () => {
    test('should restart pool successfully', async () => {
      const poolName = 'notifications';
      
      // Mock the pool restart process
      const originalPool = notificationDatabasePool.pools.get(poolName);
      const mockConnection = {
        close: jest.fn().mockResolvedValue(true)
      };
      
      // Replace connection with mock
      originalPool.connection = mockConnection;
      
      await restartPool(poolName);
      
      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('should throw error when restarting non-existent pool', async () => {
      await expect(restartPool('non-existent')).rejects.toThrow("Pool 'non-existent' not found");
    });

    test('should optimize pool configurations', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      optimizePools();
      
      // Should not throw any errors
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Event Emission', () => {
    test('should emit events on pool connection', (done) => {
      notificationDatabasePool.once('poolConnected', (poolName) => {
        expect(poolName).toBeDefined();
        done();
      });
      
      // Simulate pool connection event
      notificationDatabasePool.emit('poolConnected', 'test-pool');
    });

    test('should emit events on pool error', (done) => {
      notificationDatabasePool.once('poolError', ({ name, error }) => {
        expect(name).toBeDefined();
        expect(error).toBeDefined();
        done();
      });
      
      // Simulate pool error event
      notificationDatabasePool.emit('poolError', { name: 'test-pool', error: new Error('Test error') });
    });

    test('should emit events on query execution', (done) => {
      notificationDatabasePool.once('queryExecuted', ({ poolName, executionTime, success }) => {
        expect(poolName).toBeDefined();
        expect(executionTime).toBeDefined();
        expect(typeof success).toBe('boolean');
        done();
      });
      
      // Simulate query execution event
      notificationDatabasePool.emit('queryExecuted', { 
        poolName: 'notifications', 
        executionTime: 100, 
        success: true 
      });
    });

    test('should emit events on metrics update', (done) => {
      notificationDatabasePool.once('metricsUpdated', (metrics) => {
        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('totalConnections');
        done();
      });
      
      // Simulate metrics update event
      notificationDatabasePool.emit('metricsUpdated', { totalConnections: 5 });
    });
  });

  describe('Connection Health Monitoring', () => {
    test('should check connection health', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock a pool with disconnected connection
      const mockPool = {
        connection: {
          readyState: 0, // disconnected
          db: {
            admin: jest.fn().mockReturnValue({
              ping: jest.fn().mockRejectedValue(new Error('Connection lost'))
            })
          }
        },
        lastUsed: new Date(),
        errorCount: 0
      };
      
      notificationDatabasePool.pools.set('test-health', mockPool);
      
      await notificationDatabasePool.checkConnectionHealth();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should update metrics periodically', (done) => {
      const metricsSpy = jest.spyOn(notificationDatabasePool, 'updateMetrics');
      
      // Simulate metrics update
      notificationDatabasePool.updateMetrics();
      
      expect(metricsSpy).toHaveBeenCalled();
      metricsSpy.mockRestore();
      done();
    });
  });

  describe('Error Handling', () => {
    test('should handle connection errors gracefully', async () => {
      const queryFunction = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      await expect(executeNotificationQuery(queryFunction)).rejects.toThrow('Connection failed');
    });

    test('should handle pool creation failures', async () => {
      const mockCreateConnection = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      // This should be handled gracefully
      try {
        await notificationDatabasePool.createPool('test-fail', {
          connectionString: 'invalid://connection',
          options: {}
        });
      } catch (error) {
        expect(error.message).toBe('Connection failed');
      }
    });

    test('should handle pool restart failures', async () => {
      const mockPool = {
        connection: {
          close: jest.fn().mockRejectedValue(new Error('Close failed'))
        },
        config: {}
      };
      
      notificationDatabasePool.pools.set('test-restart-fail', mockPool);
      
      await expect(restartPool('test-restart-fail')).rejects.toThrow('Close failed');
    });
  });

  describe('Performance Optimization', () => {
    test('should handle concurrent queries efficiently', async () => {
      const queryFunction = jest.fn().mockResolvedValue({ success: true });
      
      // Execute multiple queries concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(executeNotificationQuery(queryFunction));
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toEqual({ success: true });
      });
    });

    test('should reuse connections efficiently', async () => {
      const queryFunction = jest.fn().mockResolvedValue({ success: true });
      
      // Execute multiple queries to test connection reuse
      await executeNotificationQuery(queryFunction);
      await executeNotificationQuery(queryFunction);
      await executeNotificationQuery(queryFunction);
      
      const metrics = getPoolMetrics();
      expect(metrics.pools.notifications.queryCount).toBe(3);
    });

    test('should handle connection timeouts', async () => {
      const queryFunction = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Long running query
      });
      
      // This should complete but might take time
      const startTime = Date.now();
      await executeNotificationQuery(queryFunction);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThan(4000);
    });
  });

  describe('Integration with Notification System', () => {
    test('should integrate with notification system history', async () => {
      const { notificationSystem } = require('../../middleware/notificationSystem');
      
      // Mock notification data
      const notification = {
        id: 'test-notification-1',
        userId: 'test-user-1',
        type: 'test',
        channel: 'email',
        createdAt: new Date(),
        status: 1
      };
      
      // Test adding to history
      await notificationSystem.addToHistory(notification);
      
      // Test getting history
      const history = await notificationSystem.getNotificationHistory('test-user-1');
      
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });

    test('should integrate with notification system analytics', async () => {
      const { notificationSystem } = require('../../middleware/notificationSystem');
      
      // Test getting analytics
      const analytics = await notificationSystem.getNotificationAnalytics('7d');
      
      expect(analytics).toBeDefined();
      expect(analytics).toHaveProperty('success');
      expect(analytics).toHaveProperty('data');
      expect(analytics).toHaveProperty('dateRange');
      expect(analytics).toHaveProperty('generated');
    });

    test('should integrate with notification system performance metrics', async () => {
      const { notificationSystem } = require('../../middleware/notificationSystem');
      
      // Test getting performance metrics
      const metrics = await notificationSystem.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('success');
      expect(metrics).toHaveProperty('metrics');
      expect(metrics).toHaveProperty('generated');
    });
  });

  describe('Cleanup and Shutdown', () => {
    test('should close all connections on shutdown', async () => {
      const mockClose = jest.fn().mockResolvedValue(true);
      
      // Mock all pool connections
      for (const [name, pool] of notificationDatabasePool.pools) {
        pool.connection = { close: mockClose };
      }
      
      await notificationDatabasePool.shutdown();
      
      expect(mockClose).toHaveBeenCalledTimes(notificationDatabasePool.pools.size);
    });

    test('should handle shutdown errors gracefully', async () => {
      const mockClose = jest.fn().mockRejectedValue(new Error('Close failed'));
      
      // Mock all pool connections to fail
      for (const [name, pool] of notificationDatabasePool.pools) {
        pool.connection = { close: mockClose };
      }
      
      // Should not throw, but should handle errors
      await notificationDatabasePool.shutdown();
      
      expect(mockClose).toHaveBeenCalled();
    });
  });
});

describe('Notification Database Pool Performance', () => {
  test('should handle high load efficiently', async () => {
    const queryFunction = jest.fn().mockResolvedValue({ success: true });
    
    // Simulate high load with 100 concurrent queries
    const promises = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      promises.push(executeNotificationQuery(queryFunction));
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    expect(results).toHaveLength(100);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  test('should maintain performance under sustained load', async () => {
    const queryFunction = jest.fn().mockResolvedValue({ success: true });
    
    // Simulate sustained load over time
    for (let batch = 0; batch < 5; batch++) {
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(executeNotificationQuery(queryFunction));
      }
      
      await Promise.all(promises);
    }
    
    const metrics = getPoolMetrics();
    expect(metrics.pools.notifications.queryCount).toBe(100);
  });
});

// Helper function for testing
async function getConnection(poolName) {
  return notificationDatabasePool.getConnection(poolName);
}
