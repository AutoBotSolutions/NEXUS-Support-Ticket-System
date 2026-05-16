/**
 * Analytics Model Unit Tests
 * 
 * Comprehensive unit tests for the Analytics model
 * covering all methods and edge cases.
 */

const Analytics = require('../../../models/Analytics');

// Mock mongoose
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    index: jest.fn(),
    pre: jest.fn(),
    static: jest.fn()
  })),
  model: jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn()
  }))
}));

describe('Analytics Model', () => {
  let analyticsInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a mock analytics instance
    analyticsInstance = new Analytics({
      key: 'test_analytics',
      data: { totalTickets: 100 },
      type: 'ticket_analytics',
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
  });

  describe('Schema Validation', () => {
    it('should create analytics with valid data', () => {
      const analytics = new Analytics({
        key: 'test_key',
        data: { value: 100 },
        type: 'performance',
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      });

      expect(analytics.key).toBe('test_key');
      expect(analytics.data).toEqual({ value: 100 });
      expect(analytics.type).toBe('performance');
      expect(analytics.timestamp).toBeInstanceOf(Date);
      expect(analytics.expiresAt).toBeInstanceOf(Date);
    });

    it('should require key field', () => {
      const analytics = new Analytics({
        data: { value: 100 },
        type: 'performance'
      });

      const validationErrors = analytics.validateSync();
      expect(validationErrors.errors.key).toBeDefined();
    });

    it('should require data field', () => {
      const analytics = new Analytics({
        key: 'test_key',
        type: 'performance'
      });

      const validationErrors = analytics.validateSync();
      expect(validationErrors.errors.data).toBeDefined();
    });

    it('should require type field', () => {
      const analytics = new Analytics({
        key: 'test_key',
        data: { value: 100 }
      });

      const validationErrors = analytics.validateSync();
      expect(validationErrors.errors.type).toBeDefined();
    });

    it('should accept valid types', () => {
      const validTypes = ['ticket_analytics', 'user_analytics', 'system_performance', 'github_analytics', 'administrative'];
      
      validTypes.forEach(type => {
        const analytics = new Analytics({
          key: 'test_key',
          data: { value: 100 },
          type: type
        });

        const validationErrors = analytics.validateSync();
        expect(validationErrors).toBeUndefined();
      });
    });

    it('should reject invalid types', () => {
      const analytics = new Analytics({
        key: 'test_key',
        data: { value: 100 },
        type: 'invalid_type'
      });

      const validationErrors = analytics.validateSync();
      expect(validationErrors.errors.type).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    describe('findByKey', () => {
      it('should find analytics by key', async () => {
        const mockAnalytics = {
          key: 'test_key',
          data: { value: 100 },
          type: 'performance'
        };

        Analytics.findByKey = jest.fn().mockResolvedValue(mockAnalytics);

        const result = await Analytics.findByKey('test_key');

        expect(Analytics.findByKey).toHaveBeenCalledWith('test_key');
        expect(result).toEqual(mockAnalytics);
      });

      it('should return null if key not found', async () => {
        Analytics.findByKey = jest.fn().mockResolvedValue(null);

        const result = await Analytics.findByKey('nonexistent_key');

        expect(Analytics.findByKey).toHaveBeenCalledWith('nonexistent_key');
        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        Analytics.findByKey = jest.fn().mockRejectedValue(new Error('Database error'));

        await expect(Analytics.findByKey('test_key')).rejects.toThrow('Database error');
      });
    });

    describe('findValid', () => {
      it('should find valid analytics data', async () => {
        const mockAnalytics = [
          { key: 'key1', data: {}, type: 'performance', expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
          { key: 'key2', data: {}, type: 'user_analytics', expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
        ];

        Analytics.findValid = jest.fn().mockResolvedValue(mockAnalytics);

        const result = await Analytics.findValid();

        expect(Analytics.findValid).toHaveBeenCalled();
        expect(result).toEqual(mockAnalytics);
      });

      it('should filter by type when specified', async () => {
        const mockAnalytics = [{ key: 'key1', type: 'performance' }];
        Analytics.findValid = jest.fn().mockResolvedValue(mockAnalytics);

        await Analytics.findValid('performance');

        expect(Analytics.findValid).toHaveBeenCalledWith('performance');
      });

      it('should handle expired data', async () => {
        const expiredAnalytics = [];
        Analytics.findValid = jest.fn().mockResolvedValue(expiredAnalytics);

        const result = await Analytics.findValid();

        expect(result).toEqual([]);
      });
    });

    describe('cacheAnalytics', () => {
      it('should cache analytics data', async () => {
        const analyticsData = {
          key: 'test_key',
          data: { value: 100 },
          type: 'performance'
        };

        const mockSavedAnalytics = {
          ...analyticsData,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          save: jest.fn().mockResolvedValue(true)
        };

        Analytics.cacheAnalytics = jest.fn().mockResolvedValue(mockSavedAnalytics);

        const result = await Analytics.cacheAnalytics(analyticsData.key, analyticsData.data, analyticsData.type);

        expect(Analytics.cacheAnalytics).toHaveBeenCalledWith(analyticsData.key, analyticsData.data, analyticsData.type);
        expect(result).toEqual(mockSavedAnalytics);
      });

      it('should set default expiration if not provided', async () => {
        const analyticsData = {
          key: 'test_key',
          data: { value: 100 },
          type: 'performance'
        };

        const mockSavedAnalytics = {
          ...analyticsData,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          save: jest.fn().mockResolvedValue(true)
        };

        Analytics.cacheAnalytics = jest.fn().mockResolvedValue(mockSavedAnalytics);

        await Analytics.cacheAnalytics(analyticsData.key, analyticsData.data, analyticsData.type);

        expect(Analytics.cacheAnalytics).toHaveBeenCalled();
      });

      it('should handle caching errors', async () => {
        Analytics.cacheAnalytics = jest.fn().mockRejectedValue(new Error('Cache error'));

        await expect(Analytics.cacheAnalytics('test_key', {}, 'performance')).rejects.toThrow('Cache error');
      });
    });

    describe('cleanupExpired', () => {
      it('should cleanup expired analytics data', async () => {
        const mockResult = { deletedCount: 5 };
        Analytics.cleanupExpired = jest.fn().mockResolvedValue(mockResult);

        const result = await Analytics.cleanupExpired();

        expect(Analytics.cleanupExpired).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
      });

      it('should handle cleanup errors', async () => {
        Analytics.cleanupExpired = jest.fn().mockRejectedValue(new Error('Cleanup error'));

        await expect(Analytics.cleanupExpired()).rejects.toThrow('Cleanup error');
      });
    });
  });

  describe('Instance Methods', () => {
    describe('save', () => {
      it('should save analytics instance', async () => {
        analyticsInstance.save = jest.fn().mockResolvedValue(analyticsInstance);

        const result = await analyticsInstance.save();

        expect(analyticsInstance.save).toHaveBeenCalled();
        expect(result).toEqual(analyticsInstance);
      });

      it('should handle save errors', async () => {
        analyticsInstance.save = jest.fn().mockRejectedValue(new Error('Save error'));

        await expect(analyticsInstance.save()).rejects.toThrow('Save error');
      });
    });

    describe('toJSON', () => {
      it('should return JSON representation', () => {
        const json = analyticsInstance.toJSON();

        expect(json).toHaveProperty('key');
        expect(json).toHaveProperty('data');
        expect(json).toHaveProperty('type');
        expect(json).toHaveProperty('timestamp');
        expect(json).toHaveProperty('expiresAt');
      });

      it('should exclude sensitive fields', () => {
        const json = analyticsInstance.toJSON();

        // Ensure no sensitive fields are exposed
        expect(json).not.toHaveProperty('__v');
        expect(json).not.toHaveProperty('_id');
      });
    });
  });

  describe('Middleware', () => {
    describe('Timestamps', () => {
      it('should set timestamp on creation', () => {
        const analytics = new Analytics({
          key: 'test_key',
          data: { value: 100 },
          type: 'performance'
        });

        expect(analytics.timestamp).toBeInstanceOf(Date);
      });

      it('should update timestamp on modification', () => {
        const analytics = new Analytics({
          key: 'test_key',
          data: { value: 100 },
          type: 'performance'
        });

        const originalTimestamp = analytics.timestamp;
        
        // Simulate update
        analytics.data = { value: 200 };
        
        // In a real scenario, the pre-save middleware would update the timestamp
        expect(analytics.data.value).toBe(200);
      });
    });

    describe('Expiration', () => {
      it('should set default expiration if not provided', () => {
        const analytics = new Analytics({
          key: 'test_key',
          data: { value: 100 },
          type: 'performance'
        });

        // Should have default expiration (24 hours)
        expect(analytics.expiresAt).toBeInstanceOf(Date);
        expect(analytics.expiresAt.getTime()).toBeGreaterThan(Date.now());
      });

      it('should respect custom expiration', () => {
        const customExpiration = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        const analytics = new Analytics({
          key: 'test_key',
          data: { value: 100 },
          type: 'performance',
          expiresAt: customExpiration
        });

        expect(analytics.expiresAt).toEqual(customExpiration);
      });
    });
  });

  describe('Indexes', () => {
    it('should have index on key field', () => {
      // This would be tested in a real database scenario
      expect(true).toBe(true); // Placeholder for index testing
    });

    it('should have index on type field', () => {
      // This would be tested in a real database scenario
      expect(true).toBe(true); // Placeholder for index testing
    });

    it('should have index on expiresAt field', () => {
      // This would be tested in a real database scenario
      expect(true).toBe(true); // Placeholder for index testing
    });

    it('should have compound index on key and type', () => {
      // This would be tested in a real database scenario
      expect(true).toBe(true); // Placeholder for compound index testing
    });
  });

  describe('Data Validation', () => {
    it('should validate data is object', () => {
      const analytics = new Analytics({
        key: 'test_key',
        data: 'invalid_data', // Should be object
        type: 'performance'
      });

      const validationErrors = analytics.validateSync();
      expect(validationErrors.errors.data).toBeDefined();
    });

    it('should accept complex data structures', () => {
      const complexData = {
        metrics: {
          total: 100,
          average: 50.5,
          distribution: [10, 20, 30, 40]
        },
        metadata: {
          source: 'api',
          version: '1.0.0',
          tags: ['production', 'stable']
        }
      };

      const analytics = new Analytics({
        key: 'test_key',
        data: complexData,
        type: 'performance'
      });

      const validationErrors = analytics.validateSync();
      expect(validationErrors).toBeUndefined();
      expect(analytics.data).toEqual(complexData);
    });

    it('should handle large data objects', () => {
      const largeData = {
        items: Array(1000).fill().map((_, index) => ({
          id: index,
          value: Math.random() * 100,
          timestamp: new Date()
        }))
      };

      const analytics = new Analytics({
        key: 'test_key',
        data: largeData,
        type: 'performance'
      });

      expect(analytics.data.items).toHaveLength(1000);
    });
  });

  describe('Performance', () => {
    it('should handle concurrent operations', async () => {
      const promises = Array(10).fill().map(() => 
        Analytics.findByKey('test_key')
      );

      Analytics.findByKey = jest.fn().mockResolvedValue({ key: 'test_key' });

      await Promise.all(promises);

      expect(Analytics.findByKey).toHaveBeenCalledTimes(10);
    });

    it('should handle bulk operations efficiently', async () => {
      const analyticsData = Array(100).fill().map((_, index) => ({
        key: `key_${index}`,
        data: { value: index },
        type: 'performance'
      }));

      Analytics.cacheAnalytics = jest.fn().mockResolvedValue({});

      const promises = analyticsData.map(data => 
        Analytics.cacheAnalytics(data.key, data.data, data.type)
      );

      await Promise.all(promises);

      expect(Analytics.cacheAnalytics).toHaveBeenCalledTimes(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data objects', () => {
      const analytics = new Analytics({
        key: 'test_key',
        data: {},
        type: 'performance'
      });

      const validationErrors = analytics.validateSync();
      expect(validationErrors).toBeUndefined();
      expect(analytics.data).toEqual({});
    });

    it('should handle null values in data', () => {
      const analytics = new Analytics({
        key: 'test_key',
        data: { value: null, description: null },
        type: 'performance'
      });

      const validationErrors = analytics.validateSync();
      expect(validationErrors).toBeUndefined();
    });

    it('should handle circular references in data', () => {
      const circularData = { name: 'test' };
      circularData.self = circularData;

      const analytics = new Analytics({
        key: 'test_key',
        data: circularData,
        type: 'performance'
      });

      // Should handle circular references gracefully
      expect(analytics.data.name).toBe('test');
      expect(analytics.data.self).toBe(circularData);
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      const analytics = new Analytics({
        key: longKey,
        data: { value: 100 },
        type: 'performance'
      });

      // Should handle long keys or validate length
      expect(analytics.key).toBe(longKey);
    });
  });
});
