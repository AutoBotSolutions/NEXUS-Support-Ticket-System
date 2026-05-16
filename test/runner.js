#!/usr/bin/env node

/**
 * NEXUS Comprehensive Test Runner
 * Runs all tests with proper reporting and analysis
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      performance: { passed: 0, failed: 0, total: 0 },
      security: { passed: 0, failed: 0, total: 0 }
    };
  }
  
  async runTests() {
    console.log('🧪 Running NEXUS Test Suite');
    console.log('============================\n');
    
    try {
      // Run unit tests
      await this.runTestSuite('unit', 'Unit Tests');
      
      // Run integration tests
      await this.runTestSuite('integration', 'Integration Tests');
      
      // Run e2e tests
      await this.runTestSuite('e2e', 'End-to-End Tests');
      
      // Run performance tests
      await this.runTestSuite('performance', 'Performance Tests');
      
      // Run security tests
      await this.runTestSuite('security', 'Security Tests');
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    }
  }
  
  async runTestSuite(type, name) {
    console.log(`🔄 Running ${name}...`);
    
    try {
      const output = execSync(`npm run test:${type}`, { encoding: 'utf8' });
      const results = this.parseTestOutput(output);
      
      this.results[type] = results;
      
      console.log(`✅ ${name} completed: ${results.passed}/${results.total} passed\n`);
      
    } catch (error) {
      const results = this.parseTestOutput(error.stdout);
      this.results[type] = results;
      
      console.log(`❌ ${name} failed: ${results.passed}/${results.total} passed\n`);
    }
  }
  
  parseTestOutput(output) {
    const lines = output.split('\n');
    const result = { passed: 0, failed: 0, total: 0 };
    
    lines.forEach(line => {
      if (line.includes('✓')) result.passed++;
      if (line.includes('✕')) result.failed++;
    });
    
    result.total = result.passed + result.failed;
    return result;
  }
  
  generateReport() {
    console.log('📊 Test Results Summary');
    console.log('======================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    
    Object.entries(this.results).forEach(([type, results]) => {
      totalPassed += results.passed;
      totalFailed += results.failed;
      totalTests += results.total;
      
      const percentage = results.total > 0 ? (results.passed / results.total * 100).toFixed(1) : 0;
      console.log(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${results.passed}/${results.total} (${percentage}%)`);
    });
    
    const overallPercentage = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(50));
    console.log(`Overall: ${totalPassed}/${totalTests} (${overallPercentage}%)`);
    console.log('='.repeat(50));
    
    if (totalFailed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log(`⚠️  ${totalFailed} test(s) failed`);
    }
    
    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        percentage: overallPercentage
      }
    };
    
    const reportPath = path.join(__dirname, '../test/reports/test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to ${reportPath}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runTests().catch(console.error);
}

module.exports = TestRunner;
