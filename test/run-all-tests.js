#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * Executes all test suites for the NEXUS platform including:
 * - Unit Tests
 * - Integration Tests
 * - End-to-End Tests
 * - Performance Tests
 * - Security Tests
 * - Coverage Analysis
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0, duration: 0 },
      integration: { passed: 0, failed: 0, total: 0, duration: 0 },
      e2e: { passed: 0, failed: 0, total: 0, duration: 0 },
      performance: { passed: 0, failed: 0, total: 0, duration: 0 },
      security: { passed: 0, failed: 0, total: 0, duration: 0 },
      coverage: { overall: 0, detailed: {} },
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalDuration: 0,
        successRate: 0
      }
    };
    
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite for NEXUS Platform\n');
    console.log('=' .repeat(60));
    
    try {
      // Run unit tests
      await this.runUnitTests();
      
      // Run integration tests
      await this.runIntegrationTests();
      
      // Run E2E tests (if available)
      await this.runE2ETests();
      
      // Run performance tests
      await this.runPerformanceTests();
      
      // Run security tests
      await this.runSecurityTests();
      
      // Generate coverage report
      await this.generateCoverageReport();
      
      // Calculate summary
      this.calculateSummary();
      
      // Generate final report
      await this.generateFinalReport();
      
      // Display results
      this.displayResults();
      
      // Exit with appropriate code
      process.exit(this.results.summary.totalFailed > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runUnitTests() {
    console.log('\n🧪 Running Unit Tests...');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      const output = execSync('npm test -- --testPathPattern="unit" --verbose', {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const endTime = Date.now();
      this.results.unit.duration = endTime - startTime;
      
      // Parse Jest output
      this.parseTestOutput(output, 'unit');
      
      console.log(`✅ Unit Tests: ${this.results.unit.passed}/${this.results.unit.total} passed`);
      
    } catch (error) {
      const endTime = Date.now();
      this.results.unit.duration = endTime - startTime;
      
      // Parse Jest output even on failure
      this.parseTestOutput(error.stdout || '', 'unit');
      
      console.log(`❌ Unit Tests: ${this.results.unit.passed}/${this.results.unit.total} passed`);
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      const output = execSync('npm test -- --testPathPattern="integration" --verbose', {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const endTime = Date.now();
      this.results.integration.duration = endTime - startTime;
      
      this.parseTestOutput(output, 'integration');
      
      console.log(`✅ Integration Tests: ${this.results.integration.passed}/${this.results.integration.total} passed`);
      
    } catch (error) {
      const endTime = Date.now();
      this.results.integration.duration = endTime - startTime;
      
      this.parseTestOutput(error.stdout || '', 'integration');
      
      console.log(`❌ Integration Tests: ${this.results.integration.passed}/${this.results.integration.total} passed`);
    }
  }

  async runE2ETests() {
    console.log('\n🌐 Running End-to-End Tests...');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      const output = execSync('npm test -- --testPathPattern="e2e" --verbose', {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const endTime = Date.now();
      this.results.e2e.duration = endTime - startTime;
      
      this.parseTestOutput(output, 'e2e');
      
      console.log(`✅ E2E Tests: ${this.results.e2e.passed}/${this.results.e2e.total} passed`);
      
    } catch (error) {
      const endTime = Date.now();
      this.results.e2e.duration = endTime - startTime;
      
      // E2E tests might not be available or might fail
      this.parseTestOutput(error.stdout || '', 'e2e');
      
      if (this.results.e2e.total === 0) {
        console.log('⚠️  E2E Tests: No E2E tests found (Puppeteer may not be installed)');
      } else {
        console.log(`❌ E2E Tests: ${this.results.e2e.passed}/${this.results.e2e.total} passed`);
      }
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      const output = execSync('npm test -- --testPathPattern="performance" --verbose', {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const endTime = Date.now();
      this.results.performance.duration = endTime - startTime;
      
      this.parseTestOutput(output, 'performance');
      
      console.log(`✅ Performance Tests: ${this.results.performance.passed}/${this.results.performance.total} passed`);
      
    } catch (error) {
      const endTime = Date.now();
      this.results.performance.duration = endTime - startTime;
      
      this.parseTestOutput(error.stdout || '', 'performance');
      
      console.log(`❌ Performance Tests: ${this.results.performance.passed}/${this.results.performance.total} passed`);
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 Running Security Tests...');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      const output = execSync('npm test -- --testPathPattern="security" --verbose', {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const endTime = Date.now();
      this.results.security.duration = endTime - startTime;
      
      this.parseTestOutput(output, 'security');
      
      console.log(`✅ Security Tests: ${this.results.security.passed}/${this.results.security.total} passed`);
      
    } catch (error) {
      const endTime = Date.now();
      this.results.security.duration = endTime - startTime;
      
      this.parseTestOutput(error.stdout || '', 'security');
      
      console.log(`❌ Security Tests: ${this.results.security.passed}/${this.results.security.total} passed`);
    }
  }

  parseTestOutput(output, testType) {
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let total = 0;
    
    for (const line of lines) {
      // Look for Jest summary lines
      if (line.includes('Tests:') || line.includes('Test Suites:')) {
        const parts = line.split(/\s+/);
        
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === 'Tests:' || parts[i] === 'Test Suites:') {
            if (parts[i + 1]) {
              const testCount = parseInt(parts[i + 1]);
              if (!isNaN(testCount)) {
                total = testCount;
              }
            }
            if (parts[i + 2] && parts[i + 2].includes('passed')) {
              const passedCount = parseInt(parts[i + 2]);
              if (!isNaN(passedCount)) {
                passed = passedCount;
              }
            }
            if (parts[i + 3] && parts[i + 3].includes('failed')) {
              const failedCount = parseInt(parts[i + 3]);
              if (!isNaN(failedCount)) {
                failed = failedCount;
              }
            }
            break;
          }
        }
      }
    }
    
    // If parsing failed, try alternative approach
    if (total === 0) {
      const testMatches = output.match(/(\d+)\s+passed/g) || [];
      const failMatches = output.match(/(\d+)\s+failed/g) || [];
      
      passed = testMatches.reduce((sum, match) => sum + parseInt(match), 0);
      failed = failMatches.reduce((sum, match) => sum + parseInt(match), 0);
      total = passed + failed;
    }
    
    this.results[testType] = {
      ...this.results[testType],
      passed: passed,
      failed: failed,
      total: total
    };
  }

  async generateCoverageReport() {
    console.log('\n📊 Generating Coverage Report...');
    console.log('-'.repeat(40));
    
    try {
      // Import and run coverage reporter
      const TestCoverageReporter = require('./test-coverage-reporter');
      const reporter = new TestCoverageReporter();
      
      const coverageData = await reporter.generateCoverageReport();
      
      this.results.coverage = coverageData.summary || { overall: 0 };
      
      console.log(`✅ Coverage Report Generated: ${this.results.coverage.overall?.statements?.toFixed(1) || 0}% overall`);
      
    } catch (error) {
      console.log(`⚠️  Coverage Report Generation Failed: ${error.message}`);
      this.results.coverage = { overall: 0 };
    }
  }

  calculateSummary() {
    const categories = ['unit', 'integration', 'e2e', 'performance', 'security'];
    
    for (const category of categories) {
      this.results.summary.totalTests += this.results[category].total;
      this.results.summary.totalPassed += this.results[category].passed;
      this.results.summary.totalFailed += this.results[category].failed;
      this.results.summary.totalDuration += this.results[category].duration;
    }
    
    this.results.summary.successRate = this.results.summary.totalTests > 0 
      ? (this.results.summary.totalPassed / this.results.summary.totalTests) * 100 
      : 0;
  }

  async generateFinalReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      results: this.results,
      assessment: this.getAssessment(),
      recommendations: this.getRecommendations()
    };
    
    // Save JSON report
    const jsonPath = path.join(process.cwd(), 'test-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
    
    // Generate Markdown report
    const markdownReport = this.buildMarkdownReport(reportData);
    const mdPath = path.join(process.cwd(), 'TEST_RESULTS.md');
    fs.writeFileSync(mdPath, markdownReport);
    
    console.log(`\n📋 Final Report Generated: test-results.json and TEST_RESULTS.md`);
  }

  getAssessment() {
    const successRate = this.results.summary.successRate;
    
    if (successRate >= 95) {
      return 'EXCELLENT';
    } else if (successRate >= 90) {
      return 'GOOD';
    } else if (successRate >= 80) {
      return 'ACCEPTABLE';
    } else if (successRate >= 70) {
      return 'NEEDS IMPROVEMENT';
    } else {
      return 'CRITICAL';
    }
  }

  getRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.successRate < 90) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Test Coverage',
        message: 'Overall test success rate is below 90%',
        action: 'Fix failing tests and improve test coverage'
      });
    }
    
    if (this.results.unit.failed > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Unit Tests',
        message: `${this.results.unit.failed} unit tests failed`,
        action: 'Review and fix failing unit tests'
      });
    }
    
    if (this.results.integration.failed > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Integration Tests',
        message: `${this.results.integration.failed} integration tests failed`,
        action: 'Check component interactions and fix integration issues'
      });
    }
    
    if (this.results.e2e.failed > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'E2E Tests',
        message: `${this.results.e2e.failed} E2E tests failed`,
        action: 'Review user workflows and fix E2E test issues'
      });
    }
    
    if (this.results.performance.failed > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance Tests',
        message: `${this.results.performance.failed} performance tests failed`,
        action: 'Optimize performance bottlenecks and adjust thresholds'
      });
    }
    
    if (this.results.security.failed > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Security Tests',
        message: `${this.results.security.failed} security tests failed`,
        action: 'Address security vulnerabilities and improve security measures'
      });
    }
    
    if (this.results.coverage.overall?.statements < 80) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Code Coverage',
        message: `Code coverage is ${this.results.coverage.overall.statements.toFixed(1)}%`,
        action: 'Add more tests to improve code coverage'
      });
    }
    
    return recommendations;
  }

  buildMarkdownReport(data) {
    const { timestamp, duration, results, assessment, recommendations } = data;
    
    return `# NEXUS Platform Test Results

## Executive Summary

**Generated**: ${new Date(timestamp).toLocaleString()}  
**Duration**: ${(duration / 1000).toFixed(2)} seconds  
**Assessment**: ${this.getAssessmentBadge(assessment)}  
**Success Rate**: ${results.summary.successRate.toFixed(2)}%

### Test Results Overview

| Test Type | Passed | Failed | Total | Duration |
|------------|--------|--------|-------|----------|
| Unit Tests | ${results.unit.passed} | ${results.unit.failed} | ${results.unit.total} | ${(results.unit.duration / 1000).toFixed(2)}s |
| Integration Tests | ${results.integration.passed} | ${results.integration.failed} | ${results.integration.total} | ${(results.integration.duration / 1000).toFixed(2)}s |
| E2E Tests | ${results.e2e.passed} | ${results.e2e.failed} | ${results.e2e.total} | ${(results.e2e.duration / 1000).toFixed(2)}s |
| Performance Tests | ${results.performance.passed} | ${results.performance.failed} | ${results.performance.total} | ${(results.performance.duration / 1000).toFixed(2)}s |
| Security Tests | ${results.security.passed} | ${results.security.failed} | ${results.security.total} | ${(results.security.duration / 1000).toFixed(2)}s |
| **TOTAL** | **${results.summary.totalPassed}** | **${results.summary.totalFailed}** | **${results.summary.totalTests}** | **${(results.summary.totalDuration / 1000).toFixed(2)}s** |

## Code Coverage

**Overall Coverage**: ${results.coverage.overall?.statements?.toFixed(1) || 0}%

${results.coverage.overall ? `
| Metric | Coverage |
|--------|----------|
| Statements | ${results.coverage.overall.statements?.toFixed(1) || 0}% |
| Branches | ${results.coverage.overall.branches?.toFixed(1) || 0}% |
| Functions | ${results.coverage.overall.functions?.toFixed(1) || 0}% |
| Lines | ${results.coverage.overall.lines?.toFixed(1) || 0}% |
` : 'Coverage data not available.'}

## Recommendations

${recommendations.map(rec => 
  `### ${rec.priority} - ${rec.category}

**Issue**: ${rec.message}  
**Action**: ${rec.action}
`).join('\n\n')}

## Test Categories Analysis

### Unit Tests
- **Status**: ${results.unit.failed === 0 ? '✅ PASSED' : '❌ FAILED'}
- **Coverage**: Tests individual components in isolation
- **Duration**: ${(results.unit.duration / 1000).toFixed(2)}s

### Integration Tests
- **Status**: ${results.integration.failed === 0 ? '✅ PASSED' : '❌ FAILED'}
- **Coverage**: Tests component interactions
- **Duration**: ${(results.integration.duration / 1000).toFixed(2)}s

### End-to-End Tests
- **Status**: ${results.e2e.failed === 0 ? '✅ PASSED' : '❌ FAILED'}
- **Coverage**: Tests complete user workflows
- **Duration**: ${(results.e2e.duration / 1000).toFixed(2)}s

### Performance Tests
- **Status**: ${results.performance.failed === 0 ? '✅ PASSED' : '❌ FAILED'}
- **Coverage**: Tests system performance and scalability
- **Duration**: ${(results.performance.duration / 1000).toFixed(2)}s

### Security Tests
- **Status**: ${results.security.failed === 0 ? '✅ PASSED' : '❌ FAILED'}
- **Coverage**: Tests security vulnerabilities and protections
- **Duration**: ${(results.security.duration / 1000).toFixed(2)}s

## Next Steps

1. **Address Failed Tests**: Review and fix all failing tests
2. **Improve Coverage**: Add tests for uncovered code paths
3. **Performance Optimization**: Address any performance issues found
4. **Security Hardening**: Fix security vulnerabilities
5. **Continuous Integration**: Set up automated testing pipeline

## Detailed Reports

- **JSON Report**: \`test-results.json\`
- **Coverage Report**: \`coverage/lcov-report/index.html\`
- **Coverage Summary**: \`coverage/COVERAGE_REPORT.md\`

---

*This report was generated automatically by the NEXUS Test Runner.*`;
  }

  getAssessmentBadge(assessment) {
    const badges = {
      'EXCELLENT': '🟢 EXCELLENT',
      'GOOD': '🟡 GOOD',
      'ACCEPTABLE': '🟠 ACCEPTABLE',
      'NEEDS IMPROVEMENT': '🔴 NEEDS IMPROVEMENT',
      'CRITICAL': '🔴 CRITICAL'
    };
    return badges[assessment] || assessment;
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 Overall Assessment: ${this.getAssessmentBadge(this.getAssessment())}`);
    console.log(`📈 Success Rate: ${this.results.summary.successRate.toFixed(2)}%`);
    console.log(`⏱️  Total Duration: ${(this.results.summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`🧪 Total Tests: ${this.results.summary.totalTests}`);
    console.log(`✅ Passed: ${this.results.summary.totalPassed}`);
    console.log(`❌ Failed: ${this.results.summary.totalFailed}`);
    
    if (this.results.coverage.overall) {
      console.log(`📊 Code Coverage: ${this.results.coverage.overall.statements?.toFixed(1) || 0}%`);
    }
    
    console.log('\n' + '-'.repeat(60));
    
    // Display recommendations
    const recommendations = this.getRecommendations();
    if (recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.action}`);
      });
      
      if (recommendations.length > 5) {
        console.log(`... and ${recommendations.length - 5} more recommendations`);
      }
    }
    
    console.log('\n📄 Reports Generated:');
    console.log('   - test-results.json (detailed results)');
    console.log('   - TEST_RESULTS.md (summary report)');
    console.log('   - coverage/ (coverage reports)');
    
    console.log('\n' + '='.repeat(60));
  }
}

// Export for use in other modules
module.exports = ComprehensiveTestRunner;

// Run if called directly
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.runAllTests();
}
