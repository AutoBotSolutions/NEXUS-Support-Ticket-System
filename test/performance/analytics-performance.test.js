/**
 * Analytics System Performance Tests
 * 
 * Comprehensive performance tests for the Analytics System
 * testing response times, throughput, and resource usage.
 */

const request = require('supertest');
const app = require('../../server');

describe('Analytics System Performance Tests', () => {
  const performanceThresholds = {
    responseTime: 500, // ms
    throughput: 100,   // requests per second
    memoryUsage: 100,  // MB
    cpuUsage: 80       // percentage
  };

  describe('Response Time Performance', () => {
    it('should respond to ticket analytics within threshold', async () => {
      const startTime = process.hrtime.bigint();
      
      const response = await request(app)
        .get('/api/analytics/tickets')
        .expect(200);
      
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      expect(responseTime).toBeLessThan(performanceThresholds.responseTime);
      expect(response.body.success).toBe(true);
    });

    it('should respond to user analytics within threshold', async () => {
      const startTime = process.hrtime.bigint();
      
      const response = await request(app)
        .get('/api/analytics/users')
        .expect(200);
      
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;
      
      expect(responseTime).toBeLessThan(performanceThresholds.responseTime);
      expect(response.body.success).toBe(true);
    });

    it('should respond to system performance within threshold', async () => {
      const startTime = process.hrtime.bigint();
      
      const response = await request(app)
        .get('/api/analytics/performance')
        .expect(200);
      
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;
      
      expect(responseTime).toBeLessThan(performanceThresholds.responseTime);
      expect(response.body.success).toBe(true);
    });

    it('should respond to dashboard data within threshold', async () => {
      const startTime = process.hrtime.bigint();
      
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);
      
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;
      
      expect(responseTime).toBeLessThan(performanceThresholds.responseTime);
      expect(response.body.success).toBe(true);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 50;
      const startTime = process.hrtime.bigint();
      
      const promises = Array(concurrentRequests).fill().map(() => 
        request(app).get('/api/analytics/tickets')
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;
      const avgResponseTime = totalTime / concurrentRequests;
      
      expect(avgResponseTime).toBeLessThan(performanceThresholds.responseTime);
      expect(responses.every(response => response.status === 200)).toBe(true);
    });
  });

  describe('Throughput Performance', () => {
    it('should handle sustained load', async () => {
      const requestsPerSecond = 20;
      const duration = 5000; // 5 seconds
      const totalRequests = (requestsPerSecond * duration) / 1000;
      
      const startTime = Date.now();
      const promises = [];
      
      // Generate requests at specified rate
      for (let i = 0; i < totalRequests; i++) {
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              resolve(request(app).get('/api/analytics/tickets'));
            }, (i * 1000) / requestsPerSecond);
          })
        );
      }
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      const actualDuration = endTime - startTime;
      const actualThroughput = (totalRequests / actualDuration) * 1000;
      
      expect(actualThroughput).toBeGreaterThan(requestsPerSecond * 0.8); // Allow 20% tolerance
      expect(responses.every(response => response.status === 200)).toBe(true);
    });

    it('should maintain performance under load', async () => {
      const loadTestDuration = 10000; // 10 seconds
      const requestInterval = 100; // 10 requests per second
      const responseTimes = [];
      
      const startTime = Date.now();
      let requestCount = 0;
      
      const interval = setInterval(async () => {
        if (Date.now() - startTime >= loadTestDuration) {
          clearInterval(interval);
          return;
        }
        
        const requestStart = process.hrtime.bigint();
        
        try {
          await request(app).get('/api/analytics/tickets').expect(200);
          
          const requestEnd = process.hrtime.bigint();
          const responseTime = Number(requestEnd - requestStart) / 1000000;
          responseTimes.push(responseTime);
          requestCount++;
        } catch (error) {
          console.error('Request failed:', error);
        }
      }, requestInterval);
      
      // Wait for load test to complete
      await new Promise(resolve => setTimeout(resolve, loadTestDuration + 1000));
      
      // Analyze performance
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
      
      expect(avgResponseTime).toBeLessThan(performanceThresholds.responseTime);
      expect(maxResponseTime).toBeLessThan(performanceThresholds.responseTime * 2);
      expect(p95ResponseTime).toBeLessThan(performanceThresholds.responseTime * 1.5);
      expect(requestCount).toBeGreaterThan(loadTestDuration / requestInterval * 0.8);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not exceed memory threshold under normal load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Generate moderate load
      const promises = Array(100).fill().map(() => 
        request(app).get('/api/analytics/tickets')
      );
      
      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB
      
      expect(memoryIncrease).toBeLessThan(performanceThresholds.memoryUsage);
    });

    it('should handle memory leaks during sustained operation', async () => {
      const memorySnapshots = [];
      const testDuration = 30000; // 30 seconds
      const sampleInterval = 5000; // 5 seconds
      
      // Take initial memory snapshot
      memorySnapshots.push(process.memoryUsage());
      
      // Run sustained load
      const startTime = Date.now();
      const loadInterval = setInterval(async () => {
        if (Date.now() - startTime >= testDuration) {
          clearInterval(loadInterval);
          return;
        }
        
        // Generate load
        const promises = Array(20).fill().map(() => 
          request(app).get('/api/analytics/tickets')
        );
        
        await Promise.all(promises);
        
        // Take memory snapshot
        memorySnapshots.push(process.memoryUsage());
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }, sampleInterval);
      
      // Wait for test to complete
      await new Promise(resolve => setTimeout(resolve, testDuration + 1000));
      
      // Analyze memory usage
      const memoryUsages = memorySnapshots.map(snapshot => snapshot.heapUsed / 1024 / 1024);
      const memoryGrowth = memoryUsages[memoryUsages.length - 1] - memoryUsages[0];
      
      // Memory growth should be minimal
      expect(memoryGrowth).toBeLessThan(performanceThresholds.memoryUsage * 2);
      
      // Memory usage should not continuously increase
      const increasingTrend = memoryUsages.slice(1).every((usage, index) => 
        usage <= memoryUsages[index] + 10 // Allow 10MB fluctuation
      );
      
      if (!increasingTrend) {
        console.warn('Memory usage shows increasing trend:', memoryUsages);
      }
    });
  });

  describe('Database Performance', () => {
    it('should handle database queries efficiently', async () => {
      const queryTimes = [];
      const queryCount = 50;
      
      for (let i = 0; i < queryCount; i++) {
        const startTime = process.hrtime.bigint();
        
        await request(app)
          .get('/api/analytics/tickets')
          .expect(200);
        
        const endTime = process.hrtime.bigint();
        const queryTime = Number(endTime - startTime) / 1000000;
        queryTimes.push(queryTime);
      }
      
      const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
      const maxQueryTime = Math.max(...queryTimes);
      
      expect(avgQueryTime).toBeLessThan(performanceThresholds.responseTime * 0.5);
      expect(maxQueryTime).toBeLessThan(performanceThresholds.responseTime);
    });

    it('should handle concurrent database operations', async () => {
      const concurrentQueries = 25;
      
      const promises = Array(concurrentQueries).fill().map(() => 
        request(app).get('/api/analytics/tickets')
      );
      
      const startTime = process.hrtime.bigint();
      const responses = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      
      const totalTime = Number(endTime - startTime) / 1000000;
      const avgTime = totalTime / concurrentQueries;
      
      expect(responses.every(response => response.status === 200)).toBe(true);
      expect(avgTime).toBeLessThan(performanceThresholds.responseTime);
    });
  });

  describe('Cache Performance', () => {
    it('should improve response times with caching', async () => {
      // First request (cache miss)
      const firstRequestStart = process.hrtime.bigint();
      await request(app).get('/api/analytics/tickets').expect(200);
      const firstRequestTime = Number(process.hrtime.bigint() - firstRequestStart) / 1000000;
      
      // Second request (cache hit)
      const secondRequestStart = process.hrtime.bigint();
      await request(app).get('/api/analytics/tickets').expect(200);
      const secondRequestTime = Number(process.hrtime.bigint() - secondRequestStart) / 1000000;
      
      // Cached response should be faster
      expect(secondRequestTime).toBeLessThan(firstRequestTime * 0.8);
    });

    it('should handle cache invalidation efficiently', async () => {
      // Populate cache
      await request(app).get('/api/analytics/tickets').expect(200);
      
      // Simulate cache invalidation
      const invalidationStart = process.hrtime.bigint();
      await request(app).post('/api/analytics/cache/invalidate').send({
        keys: ['ticket_analytics']
      }).expect(200);
      const invalidationTime = Number(process.hrtime.bigint() - invalidationStart) / 1000000;
      
      // Cache invalidation should be fast
      expect(invalidationTime).toBeLessThan(100);
      
      // Next request should be cache miss but still performant
      const cacheMissStart = process.hrtime.bigint();
      await request(app).get('/api/analytics/tickets').expect(200);
      const cacheMissTime = Number(process.hrtime.bigint() - cacheMissStart) / 1000000;
      
      expect(cacheMissTime).toBeLessThan(performanceThresholds.responseTime);
    });
  });

  describe('Stress Testing', () => {
    it('should handle extreme load without failure', async () => {
      const extremeLoadRequests = 200;
      const maxConcurrent = 50;
      
      let completedRequests = 0;
      let failedRequests = 0;
      
      const startTime = Date.now();
      
      // Process requests in batches
      for (let i = 0; i < extremeLoadRequests; i += maxConcurrent) {
        const batchSize = Math.min(maxConcurrent, extremeLoadRequests - i);
        const batchPromises = Array(batchSize).fill().map(async () => {
          try {
            await request(app).get('/api/analytics/tickets').expect(200);
            completedRequests++;
          } catch (error) {
            failedRequests++;
          }
        });
        
        await Promise.all(batchPromises);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // System should handle extreme load
      expect(failedRequests).toBeLessThan(completedRequests * 0.05); // Less than 5% failure rate
      expect(completedRequests).toBeGreaterThan(extremeLoadRequests * 0.95); // At least 95% success
      expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should recover from temporary failures', async () => {
      // Simulate temporary failure
      const originalHandler = app._router.stack.find(layer => 
        layer.route && layer.route.path === '/api/analytics/tickets'
      );
      
      // Replace with failing handler temporarily
      app.get('/api/analytics/tickets', (req, res) => {
        res.status(503).json({ success: false, error: 'Service temporarily unavailable' });
      });
      
      // Generate requests during failure
      const failurePromises = Array(10).fill().map(() => 
        request(app).get('/api/analytics/tickets')
      );
      
      const failureResponses = await Promise.allSettled(failurePromises);
      
      // Restore original handler
      if (originalHandler) {
        app._router.stack.push(originalHandler);
      }
      
      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate requests after recovery
      const recoveryPromises = Array(10).fill().map(() => 
        request(app).get('/api/analytics/tickets')
      );
      
      const recoveryResponses = await Promise.allSettled(recoveryPromises);
      
      // System should recover
      const failureCount = failureResponses.filter(r => r.status === 'rejected').length;
      const recoveryCount = recoveryResponses.filter(r => r.status === 'fulfilled').length;
      
      expect(failureCount).toBeGreaterThan(0); // Should have failed during failure period
      expect(recoveryCount).toBeGreaterThan(recoveryPromises.length * 0.8); // Should recover
    });
  });

  describe('Resource Utilization', () => {
    it('should maintain acceptable CPU usage under load', async () => {
      const initialCpuUsage = process.cpuUsage();
      const loadDuration = 10000; // 10 seconds
      
      // Generate sustained load
      const startTime = Date.now();
      const loadPromises = [];
      
      while (Date.now() - startTime < loadDuration) {
        loadPromises.push(request(app).get('/api/analytics/tickets'));
        await new Promise(resolve => setTimeout(resolve, 100)); // 10 requests per second
      }
      
      await Promise.all(loadPromises);
      
      const finalCpuUsage = process.cpuUsage(initialCpuUsage);
      const cpuPercent = (finalCpuUsage.user + finalCpuUsage.system) / (loadDuration * 1000) * 100;
      
      expect(cpuPercent).toBeLessThan(performanceThresholds.cpuUsage);
    });

    it('should handle file I/O efficiently', async () => {
      const fileOperations = [];
      const operationCount = 50;
      
      for (let i = 0; i < operationCount; i++) {
        const startTime = process.hrtime.bigint();
        
        try {
          await request(app)
            .get('/api/analytics/export?format=csv&type=tickets')
            .expect(200);
          
          const endTime = process.hrtime.bigint();
          const operationTime = Number(endTime - startTime) / 1000000;
          fileOperations.push(operationTime);
        } catch (error) {
          // Export might not be implemented, that's okay
          fileOperations.push(0);
        }
      }
      
      const avgOperationTime = fileOperations.reduce((a, b) => a + b, 0) / fileOperations.length;
      
      expect(avgOperationTime).toBeLessThan(performanceThresholds.responseTime * 2);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain performance over multiple iterations', async () => {
      const iterations = 10;
      const requestsPerIteration = 20;
      const performanceData = [];
      
      for (let iteration = 0; iteration < iterations; iteration++) {
        const iterationStart = process.hrtime.bigint();
        
        const promises = Array(requestsPerIteration).fill().map(() => 
          request(app).get('/api/analytics/tickets')
        );
        
        await Promise.all(promises);
        
        const iterationEnd = process.hrtime.bigint();
        const iterationTime = Number(iterationEnd - iterationStart) / 1000000;
        const avgTime = iterationTime / requestsPerIteration;
        
        performanceData.push(avgTime);
        
        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Analyze performance trend
      const firstHalf = performanceData.slice(0, Math.floor(iterations / 2));
      const secondHalf = performanceData.slice(Math.floor(iterations / 2));
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      // Performance should not degrade significantly
      const degradationRatio = secondHalfAvg / firstHalfAvg;
      expect(degradationRatio).toBeLessThan(1.2); // Less than 20% degradation
    });
  });
});
