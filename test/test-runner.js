#!/usr/bin/env node

/**
 * NEXUS Test Runner
 * Comprehensive test execution and reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testResults = {
      unit: { passed: 0, failed: 0, errors: [] },
      integration: { passed: 0, failed: 0, errors: [] },
      e2e: { passed: 0, failed: 0, errors: [] },
      performance: { passed: 0, failed: 0, errors: [] },
      security: { passed: 0, failed: 0, errors: [] }
    };
    this.startTime = Date.now();
    this.coverageResults = null;
  }

  async runAllTests() {
    console.log('🚀 Starting NEXUS Test Suite...');
    console.log('=====================================');

    try {
      // Run tests in order
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runE2ETests();
      await this.runPerformanceTests();
      await this.runSecurityTests();
      
      // Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async runUnitTests() {
    console.log('\n📋 Running Unit Tests...');
    console.log('------------------------');

    try {
      const result = execSync('npm run test:unit', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      console.log(result);
      this.parseTestResults(result, 'unit');
      
    } catch (error) {
      console.error('Unit tests failed:', error.message);
      this.testResults.unit.errors.push(error.message);
      this.testResults.unit.failed++;
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    console.log('---------------------------');

    try {
      const result = execSync('npm run test:integration', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      console.log(result);
      this.parseTestResults(result, 'integration');
      
    } catch (error) {
      console.error('Integration tests failed:', error.message);
      this.testResults.integration.errors.push(error.message);
      this.testResults.integration.failed++;
    }
  }

  async runE2ETests() {
    console.log('\n🎭 Running End-to-End Tests...');
    console.log('------------------------------');

    try {
      const result = execSync('npm run test:e2e', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      console.log(result);
      this.parseTestResults(result, 'e2e');
      
    } catch (error) {
      console.error('E2E tests failed:', error.message);
      this.testResults.e2e.errors.push(error.message);
      this.testResults.e2e.failed++;
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    console.log('-----------------------------');

    try {
      const { runAllPerformanceTests } = require('./test/performance/load-test');
      const results = await runAllPerformanceTests();
      
      console.log('Performance tests completed');
      this.testResults.performance.passed++;
      
      // Save performance results
      this.savePerformanceResults(results);
      
    } catch (error) {
      console.error('Performance tests failed:', error.message);
      this.testResults.performance.errors.push(error.message);
      this.testResults.performance.failed++;
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 Running Security Tests...');
    console.log('--------------------------');

    try {
      const { runAllSecurityTests } = require('./test/security/security-test');
      const results = await runAllSecurityTests();
      
      console.log('Security tests completed');
      this.testResults.security.passed++;
      
      // Save security results
      this.saveSecurityResults(results);
      
    } catch (error) {
      console.error('Security tests failed:', error.message);
      this.testResults.security.errors.push(error.message);
      this.testResults.security.failed++;
    }
  }

  parseTestResults(output, testType) {
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;

    for (const line of lines) {
      if (line.includes('✓') || line.includes('PASS')) {
        passed++;
      } else if (line.includes('✗') || line.includes('FAIL') || line.includes('✕')) {
        failed++;
      }
    }

    this.testResults[testType].passed = passed;
    this.testResults[testType].failed = failed;
  }

  async runCoverageTests() {
    console.log('\n📊 Running Coverage Tests...');
    console.log('---------------------------');

    try {
      const result = execSync('npm run test:coverage', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      console.log(result);
      this.parseCoverageResults(result);
      
    } catch (error) {
      console.error('Coverage tests failed:', error.message);
    }
  }

  parseCoverageResults(output) {
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('All files')) {
        const match = line.match(/(\d+\.\d+)%\s*\|\s*(\d+)\s*\|\s*(\d+)/);
        if (match) {
          this.coverageResults = {
            percentage: parseFloat(match[1]),
            lines: match[2],
            statements: match[3]
          };
          break;
        }
      }
    }
  }

  savePerformanceResults(results) {
    const resultsPath = path.join(__dirname, 'test-results', 'performance-results.json');
    
    if (!fs.existsSync(path.dirname(resultsPath))) {
      fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`Performance results saved to ${resultsPath}`);
  }

  saveSecurityResults(results) {
    const resultsPath = path.join(__dirname, 'test-results', 'security-results.json');
    
    if (!fs.existsSync(path.dirname(resultsPath))) {
      fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`Security results saved to ${resultsPath}`);
  }

  generateFinalReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const totalPassed = Object.values(this.testResults).reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = Object.values(this.testResults).reduce((sum, result) => sum + result.failed, 0);
    const totalTests = totalPassed + totalFailed;

    console.log('\n📋 Test Suite Summary');
    console.log('====================');
    console.log(`Total Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);

    console.log('\n📊 Test Results by Type:');
    console.log('------------------------');
    Object.entries(this.testResults).forEach(([type, result]) => {
      const typeTotal = result.passed + result.failed;
      const typeSuccess = typeTotal > 0 ? ((result.passed / typeTotal) * 100).toFixed(2) : '0.00';
      console.log(`${type.toUpperCase()}: ${result.passed}/${typeTotal} (${typeSuccess}%)`);
      
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
      }
    });

    if (this.coverageResults) {
      console.log('\n📊 Coverage Results:');
      console.log('-------------------');
      console.log(`Coverage: ${this.coverageResults.percentage}%`);
      console.log(`Lines: ${this.coverageResults.lines}`);
      console.log(`Statements: ${this.coverageResults.statements}`);
    }

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      duration,
      summary: {
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: (totalPassed / totalTests) * 100
      },
      results: this.testResults,
      coverage: this.coverageResults
    };

    const reportPath = path.join(__dirname, 'test-results', 'test-report.json');
    
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to ${reportPath}`);

    // Exit with appropriate code
    if (totalFailed > 0) {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed');
      process.exit(0);
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const testRunner = new TestRunner();

if (args.length === 0) {
  // Run all tests
  testRunner.runAllTests();
} else {
  // Run specific test type
  const testType = args[0];
  
  switch (testType) {
    case 'unit':
      testRunner.runUnitTests();
      break;
    case 'integration':
      testRunner.runIntegrationTests();
      break;
    case 'e2e':
      testRunner.runE2ETests();
      break;
    case 'performance':
      testRunner.runPerformanceTests();
      break;
    case 'security':
      testRunner.runSecurityTests();
      break;
    case 'coverage':
      testRunner.runCoverageTests();
      break;
    default:
      console.error('Unknown test type:', testType);
      console.log('Available types: unit, integration, e2e, performance, security, coverage');
      process.exit(1);
  }
}
