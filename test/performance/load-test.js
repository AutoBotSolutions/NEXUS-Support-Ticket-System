/**
 * NEXUS Performance Testing Suite
 * Load testing and performance benchmarks
 */

const request = require('supertest');
const app = require('../../server');
const { createTestUserWithToken, generateRandomEmail } = require('../utils/testUtils');

class PerformanceTestSuite {
  constructor() {
    this.results = [];
    this.testConfig = {
      baseUrl: 'http://localhost:3000',
      concurrentUsers: 10,
      requestsPerUser: 50,
      testDuration: 30000, // 30 seconds
      rampUpTime: 5000, // 5 seconds
      cooldownTime: 5000 // 5 seconds
    };
  }

  async runLoadTest() {
    console.log('🚀 Starting Performance Load Test...');
    
    const startTime = Date.now();
    const promises = [];
    const userTokens = [];

    // Create test users
    console.log('👥 Creating test users...');
    for (let i = 0; i < this.testConfig.concurrentUsers; i++) {
      const { token } = await createTestUserWithToken({
        username: `perfuser${i}`,
        email: `perfuser${i}@test.com`
      });
      userTokens.push(token);
    }

    // Run concurrent requests
    console.log('⚡ Running concurrent requests...');
    for (let userId = 0; userId < this.testConfig.concurrentUsers; userId++) {
      promises.push(this.runUserLoadTest(userTokens[userId], userId));
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();

    // Calculate aggregate statistics
    const aggregateStats = this.calculateAggregateStats(results, endTime - startTime);
    
    console.log('📊 Load Test Results:');
    console.log(`   Total Requests: ${aggregateStats.totalRequests}`);
    console.log(`   Success Rate: ${aggregateStats.successRate}%`);
    console.log(`   Average Response Time: ${aggregateStats.avgResponseTime}ms`);
    console.log(`   Min Response Time: ${aggregateStats.minResponseTime}ms`);
    console.log(`   Max Response Time: ${aggregateStats.maxResponseTime}ms`);
    console.log(`   Requests per Second: ${aggregateStats.rps}`);
    console.log(`   Total Duration: ${endTime - startTime}ms`);

    return aggregateStats;
  }

  async runUserLoadTest(token, userId) {
    const results = [];
    const startTime = Date.now();
    
    // Ramp up period
    await new Promise(resolve => setTimeout(resolve, this.testConfig.rampUpTime * userId / this.testConfig.concurrentUsers));

    // Run requests
    for (let i = 0; i < this.testConfig.requestsPerUser; i++) {
      const requestStart = Date.now();
      
      try {
        const response = await request(app)
          .get('/api/health')
          .set('Authorization', `Bearer ${token}`);
        
        const requestEnd = Date.now();
        const responseTime = requestEnd - requestStart;
        
        results.push({
          userId,
          requestId: i,
          statusCode: response.status,
          responseTime,
          success: response.status === 200,
          timestamp: requestStart
        });
      } catch (error) {
        const requestEnd = Date.now();
        results.push({
          userId,
          requestId: i,
          statusCode: 0,
          responseTime: requestEnd - requestStart,
          success: false,
          error: error.message,
          timestamp: requestStart
        });
      }
    }

    return results;
  }

  calculateAggregateStats(userResults, totalDuration) {
    const allResults = userResults.flat();
    const successfulResults = allResults.filter(r => r.success);
    
    const responseTimes = successfulResults.map(r => r.responseTime);
    const totalRequests = allResults.length;
    const successCount = successfulResults.length;
    const successRate = (successCount / totalRequests) * 100;
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    
    const rps = totalRequests / (totalDuration / 1000);

    return {
      totalRequests,
      successCount,
      successRate: successRate.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      minResponseTime,
      maxResponseTime,
      rps: rps.toFixed(2),
      totalDuration,
      errorCount: totalRequests - successCount
    };
  }

  async runStressTest() {
    console.log('💪 Starting Stress Test...');
    
    const maxConcurrentUsers = 100;
    const stepSize = 10;
    const results = [];

    for (let concurrentUsers = stepSize; concurrentUsers <= maxConcurrentUsers; concurrentUsers += stepSize) {
      console.log(`Testing with ${concurrentUsers} concurrent users...`);
      
      const testConfig = { ...this.testConfig, concurrentUsers };
      const testSuite = new PerformanceTestSuite();
      testSuite.testConfig = testConfig;
      
      const result = await testSuite.runMiniLoadTest();
      results.push({ concurrentUsers, ...result });
      
      // Check if we're hitting performance limits
      if (parseFloat(result.successRate) < 95 || parseFloat(result.avgResponseTime) > 1000) {
        console.log(`⚠️  Performance degradation detected at ${concurrentUsers} users`);
        break;
      }
      
      // Cool down between tests
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return results;
  }

  async runMiniLoadTest() {
    const promises = [];
    const userTokens = [];

    // Create test users
    for (let i = 0; i < this.testConfig.concurrentUsers; i++) {
      const { token } = await createTestUserWithToken({
        username: `stressuser${i}`,
        email: `stressuser${i}@test.com`
      });
      userTokens.push(token);
    }

    // Run concurrent requests
    for (let userId = 0; userId < this.testConfig.concurrentUsers; userId++) {
      promises.push(this.runUserLoadTest(userTokens[userId], userId));
    }

    const results = await Promise.all(promises);
    return this.calculateAggregateStats(results, this.testConfig.testDuration);
  }

  async runEndpointPerformanceTest() {
    console.log('🔍 Running Endpoint Performance Test...');
    
    const { token } = await createTestUserWithToken();
    const endpoints = [
      { method: 'GET', path: '/api/health', description: 'Health Check' },
      { method: 'GET', path: '/api/users/profile', description: 'User Profile' },
      { method: 'GET', path: '/api/tickets', description: 'List Tickets' },
      { method: 'POST', path: '/api/tickets', description: 'Create Ticket', data: {
        title: 'Performance Test Ticket',
        description: 'Testing endpoint performance',
        priority: 'medium',
        category: 'general'
      }}
    ];

    const results = [];

    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint.description}...`);
      
      const times = [];
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        try {
          let response;
          if (endpoint.method === 'GET') {
            response = await request(app)
              .get(endpoint.path)
              .set('Authorization', `Bearer ${token}`);
          } else if (endpoint.method === 'POST') {
            response = await request(app)
              .post(endpoint.path)
              .set('Authorization', `Bearer ${token}`)
              .send(endpoint.data);
          }
          
          const endTime = Date.now();
          times.push(endTime - startTime);
        } catch (error) {
          console.error(`Error testing ${endpoint.description}:`, error.message);
        }
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const p95 = this.calculatePercentile(times, 95);
      const p99 = this.calculatePercentile(times, 99);

      results.push({
        endpoint: endpoint.description,
        method: endpoint.method,
        path: endpoint.path,
        avgTime: avgTime.toFixed(2),
        minTime,
        maxTime,
        p95: p95.toFixed(2),
        p99: p99.toFixed(2),
        iterations
      });
    }

    return results;
  }

  calculatePercentile(values, percentile) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  async runDatabasePerformanceTest() {
    console.log('🗄️ Running Database Performance Test...');
    
    const { token } = await createTestUserWithToken();
    const operations = [
      { name: 'Create User', operation: async () => {
        return await createTestUserWithToken({
          username: `dbtest${Date.now()}`,
          email: `dbtest${Date.now()}@test.com`
        });
      }},
      { name: 'Create Ticket', operation: async () => {
        return await request(app)
          .post('/api/tickets')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: `DB Test Ticket ${Date.now()}`,
            description: 'Database performance test',
            priority: 'medium',
            category: 'general'
          });
      }},
      { name: 'Query Tickets', operation: async () => {
        return await request(app)
          .get('/api/tickets')
          .set('Authorization', `Bearer ${token}`);
      }},
      { name: 'Query User Profile', operation: async () => {
        return await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${token}`);
      }}
    ];

    const results = [];

    for (const test of operations) {
      console.log(`Testing ${test.name}...`);
      
      const times = [];
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        try {
          await test.operation();
          const endTime = Date.now();
          times.push(endTime - startTime);
        } catch (error) {
          console.error(`Error in ${test.name}:`, error.message);
        }
      }

      if (times.length > 0) {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        results.push({
          operation: test.name,
          avgTime: avgTime.toFixed(2),
          minTime,
          maxTime,
          iterations: times.length
        });
      }
    }

    return results;
  }

  async generatePerformanceReport() {
    console.log('📋 Generating Performance Report...');
    
    const loadTestResults = await this.runLoadTest();
    const endpointResults = await this.runEndpointPerformanceTest();
    const dbResults = await this.runDatabasePerformanceTest();
    const stressResults = await this.runStressTest();

    const report = {
      timestamp: new Date().toISOString(),
      testConfig: this.testConfig,
      loadTest: loadTestResults,
      stressTest: stressResults,
      endpointPerformance: endpointResults,
      databasePerformance: dbResults,
      summary: {
        overallPerformance: this.evaluatePerformance(loadTestResults),
        recommendations: this.generateRecommendations(loadTestResults, endpointResults, dbResults)
      }
    };

    return report;
  }

  evaluatePerformance(results) {
    const score = {
      responseTime: results.avgResponseTime < 200 ? 'excellent' : results.avgResponseTime < 500 ? 'good' : 'poor',
      successRate: results.successRate > 99 ? 'excellent' : results.successRate > 95 ? 'good' : 'poor',
      throughput: results.rps > 100 ? 'excellent' : results.rps > 50 ? 'good' : 'poor'
    };

    return score;
  }

  generateRecommendations(loadResults, endpointResults, dbResults) {
    const recommendations = [];

    if (parseFloat(loadResults.avgResponseTime) > 500) {
      recommendations.push('Consider implementing response caching');
      recommendations.push('Optimize database queries');
    }

    if (parseFloat(loadResults.successRate) < 99) {
      recommendations.push('Implement better error handling');
      recommendations.push('Add circuit breakers for external services');
    }

    if (parseFloat(loadResults.rps) < 50) {
      recommendations.push('Consider horizontal scaling');
      recommendations.push('Implement connection pooling');
    }

    const slowEndpoints = endpointResults.filter(ep => parseFloat(ep.avgTime) > 500);
    if (slowEndpoints.length > 0) {
      recommendations.push(`Optimize slow endpoints: ${slowEndpoints.map(ep => ep.endpoint).join(', ')}`);
    }

    const slowDbOps = dbResults.filter(op => parseFloat(op.avgTime) > 200);
    if (slowDbOps.length > 0) {
      recommendations.push(`Add database indexes for: ${slowDbOps.map(op => op.operation).join(', ')}`);
    }

    return recommendations;
  }
}

// Test runner functions
async function runAllPerformanceTests() {
  const testSuite = new PerformanceTestSuite();
  
  try {
    const report = await testSuite.generatePerformanceReport();
    
    console.log('\n🎯 Performance Test Summary:');
    console.log('============================');
    console.log(`Load Test - Success Rate: ${report.loadTest.successRate}%`);
    console.log(`Load Test - Avg Response: ${report.loadTest.avgResponseTime}ms`);
    console.log(`Load Test - RPS: ${report.loadTest.rps}`);
    
    console.log('\n📈 Overall Performance:');
    console.log(`Response Time: ${report.summary.overallPerformance.responseTime}`);
    console.log(`Success Rate: ${report.summary.overallPerformance.successRate}`);
    console.log(`Throughput: ${report.summary.overallPerformance.throughput}`);
    
    console.log('\n💡 Recommendations:');
    report.summary.recommendations.forEach(rec => {
      console.log(`- ${rec}`);
    });
    
    return report;
  } catch (error) {
    console.error('Performance test failed:', error);
    throw error;
  }
}

// Export for use in test scripts
module.exports = {
  PerformanceTestSuite,
  runAllPerformanceTests
};

// Run tests if called directly
if (require.main === module) {
  runAllPerformanceTests()
    .then(() => {
      console.log('\n✅ Performance tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance tests failed:', error);
      process.exit(1);
    });
}
