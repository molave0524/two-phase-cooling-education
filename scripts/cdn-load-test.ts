#!/usr/bin/env ts-node

/**
 * CDN Load Testing Script
 *
 * Comprehensive load testing for video CDN performance validation
 * Simulates realistic traffic patterns for YouTube tech channel reviews
 */

import { CDNValidator, CDNTestConfig, VideoQuality } from '../src/lib/cdn/cdn-validator';

// Test configuration for different scenarios
const REALISTIC_VIDEO_SIZES: VideoQuality[] = [
  {
    resolution: '4K',
    bitrate: 45000000,     // 45 Mbps
    fileSize: 2048,        // 2GB for 10-minute video
    url: 'https://d123456789.cloudfront.net/videos/demo-4k.mp4'
  },
  {
    resolution: '1080p',
    bitrate: 8000000,      // 8 Mbps
    fileSize: 512,         // 512MB for 10-minute video
    url: 'https://d123456789.cloudfront.net/videos/demo-1080p.mp4'
  },
  {
    resolution: '720p',
    bitrate: 5000000,      // 5 Mbps
    fileSize: 320,         // 320MB for 10-minute video
    url: 'https://d123456789.cloudfront.net/videos/demo-720p.mp4'
  },
  {
    resolution: '480p',
    bitrate: 2500000,      // 2.5 Mbps
    fileSize: 160,         // 160MB for 10-minute video
    url: 'https://d123456789.cloudfront.net/videos/demo-480p.mp4'
  }
];

const TEST_REGIONS = [
  'us-east-1',      // Virginia (origin)
  'us-west-2',      // Oregon
  'eu-west-1',      // Ireland
  'ap-southeast-1', // Singapore
  'ap-northeast-1', // Tokyo
  'eu-central-1'    // Frankfurt
];

// YouTube tech channel review traffic simulation scenarios
const TRAFFIC_SCENARIOS = {
  // Normal daily traffic
  baseline: {
    name: 'Baseline Traffic',
    concurrentUsers: [10, 25, 50, 100],
    testDuration: 30000, // 30 seconds
    description: 'Normal daily traffic patterns'
  },

  // Small tech YouTuber mentions (10K-50K subscribers)
  smallYouTuber: {
    name: 'Small YouTuber Mention',
    concurrentUsers: [100, 250, 500, 750],
    testDuration: 60000, // 1 minute
    description: 'Traffic spike from small tech channel mention'
  },

  // Medium tech YouTuber (100K-500K subscribers)
  mediumYouTuber: {
    name: 'Medium YouTuber Review',
    concurrentUsers: [500, 1000, 2000, 3000],
    testDuration: 120000, // 2 minutes
    description: 'Traffic spike from medium tech channel review'
  },

  // Large tech YouTuber (1M+ subscribers) - LTT, MKBHD, etc.
  largeYouTuber: {
    name: 'Large YouTuber Review',
    concurrentUsers: [2000, 5000, 10000, 15000],
    testDuration: 300000, // 5 minutes
    description: 'Traffic spike from major tech channel review (LTT, MKBHD)'
  },

  // Viral moment - multiple channels covering simultaneously
  viralMoment: {
    name: 'Viral Tech Moment',
    concurrentUsers: [10000, 20000, 30000, 50000],
    testDuration: 600000, // 10 minutes
    description: 'Viral moment with multiple tech channels covering simultaneously'
  }
};

const PERFORMANCE_TARGETS = {
  firstByteTime: 500,      // 500ms TTFB target
  videoStartTime: 2000,    // 2 second video start target
  bufferRatio: 0.95,       // 95% buffer health target
  errorRate: 0.01,         // 1% max error rate
  cacheHitRate: 0.8        // 80% cache hit rate target
};

/**
 * Main load testing function
 */
async function runCDNLoadTests() {
  console.log('🚀 Starting CDN Load Testing Suite');
  console.log('===================================\n');

  const validator = new CDNValidator();
  const results: any[] = [];

  // Test each traffic scenario
  for (const [scenarioKey, scenario] of Object.entries(TRAFFIC_SCENARIOS)) {
    console.log(`📊 Testing Scenario: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    console.log(`Max Concurrent Users: ${Math.max(...scenario.concurrentUsers)}`);
    console.log(`Test Duration: ${scenario.testDuration / 1000}s\n`);

    const testConfig: CDNTestConfig = {
      videoUrls: REALISTIC_VIDEO_SIZES.map(v => v.url),
      testRegions: TEST_REGIONS,
      concurrentUsers: scenario.concurrentUsers,
      testDuration: scenario.testDuration,
      qualityLevels: REALISTIC_VIDEO_SIZES,
      targetMetrics: PERFORMANCE_TARGETS
    };

    try {
      const result = await validator.validateCDN(testConfig);

      // Log key results
      console.log(`✅ Scenario: ${scenario.name} - Results:`);
      console.log(`   Avg Video Start: ${result.results.performance.averageVideoStartTime}ms`);
      console.log(`   P95 Video Start: ${result.results.performance.p95VideoStartTime}ms`);
      console.log(`   Success Rate: ${(result.results.reliability.successRate * 100).toFixed(1)}%`);
      console.log(`   Error Rate: ${(result.results.reliability.errorRate * 100).toFixed(1)}%`);
      console.log(`   Estimated Monthly Cost: $${result.results.cost.estimatedMonthlyCost.toFixed(2)}`);
      console.log(`   Validation: ${result.passedValidation ? '✅ PASS' : '❌ FAIL'}`);

      if (result.recommendations.length > 0) {
        console.log('   Recommendations:');
        result.recommendations.forEach(rec => console.log(`     - ${rec}`));
      }
      console.log('');

      results.push({
        scenario: scenarioKey,
        ...result
      });

    } catch (error) {
      console.error(`❌ Failed to test scenario ${scenario.name}:`, error);
    }

    // Brief pause between scenarios
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Generate summary report
  generateSummaryReport(results);
}

/**
 * Generate comprehensive summary report
 */
function generateSummaryReport(results: any[]) {
  console.log('\n📋 CDN Load Testing Summary Report');
  console.log('==================================\n');

  // Overall validation status
  const passedTests = results.filter(r => r.passedValidation).length;
  const totalTests = results.length;
  console.log(`Overall Validation: ${passedTests}/${totalTests} scenarios passed\n`);

  // Performance summary table
  console.log('Performance Summary:');
  console.log('Scenario                | Avg Start (ms) | P95 Start (ms) | Success Rate | Monthly Cost');
  console.log('------------------------|----------------|----------------|--------------|-------------');

  results.forEach(result => {
    const perf = result.results.performance;
    const rel = result.results.reliability;
    const cost = result.results.cost;

    console.log(
      `${TRAFFIC_SCENARIOS[result.scenario].name.padEnd(23)} | ` +
      `${Math.round(perf.averageVideoStartTime).toString().padEnd(14)} | ` +
      `${Math.round(perf.p95VideoStartTime).toString().padEnd(14)} | ` +
      `${(rel.successRate * 100).toFixed(1).padEnd(11)}% | ` +
      `$${cost.estimatedMonthlyCost.toFixed(2)}`
    );
  });

  // Recommendations summary
  console.log('\n🎯 Key Recommendations:');
  const allRecommendations = results.flatMap(r => r.recommendations);
  const uniqueRecommendations = [...new Set(allRecommendations)];

  if (uniqueRecommendations.length === 0) {
    console.log('✅ No critical issues found - CDN configuration appears optimal');
  } else {
    uniqueRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  // Critical alerts
  console.log('\n🚨 Critical Alerts:');
  const criticalIssues = results.filter(r => !r.passedValidation);

  if (criticalIssues.length === 0) {
    console.log('✅ No critical issues - CDN ready for production traffic');
  } else {
    criticalIssues.forEach(result => {
      const scenarioName = TRAFFIC_SCENARIOS[result.scenario].name;
      console.log(`❌ ${scenarioName}: Failed validation`);

      const perf = result.results.performance;
      const rel = result.results.reliability;

      if (perf.averageVideoStartTime > PERFORMANCE_TARGETS.videoStartTime) {
        console.log(`   - Video start time: ${Math.round(perf.averageVideoStartTime)}ms (target: ${PERFORMANCE_TARGETS.videoStartTime}ms)`);
      }

      if (rel.errorRate > PERFORMANCE_TARGETS.errorRate) {
        console.log(`   - Error rate: ${(rel.errorRate * 100).toFixed(1)}% (target: ${(PERFORMANCE_TARGETS.errorRate * 100).toFixed(1)}%)`);
      }
    });
  }

  // Cost analysis
  console.log('\n💰 Cost Analysis:');
  const costs = results.map(r => r.results.cost.estimatedMonthlyCost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;

  console.log(`Min Monthly Cost: $${minCost.toFixed(2)} (baseline traffic)`);
  console.log(`Max Monthly Cost: $${maxCost.toFixed(2)} (peak viral traffic)`);
  console.log(`Avg Monthly Cost: $${avgCost.toFixed(2)}`);

  // Final recommendation
  console.log('\n🎯 Final Recommendation:');
  if (passedTests === totalTests) {
    console.log('✅ CDN configuration is ready for production deployment');
    console.log('✅ Can handle expected traffic from major tech YouTube reviews');
    console.log('✅ Performance targets met across all scenarios');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('⚠️ CDN configuration needs minor optimizations');
    console.log('⚠️ Can handle most traffic scenarios but may struggle with viral moments');
    console.log('⚠️ Consider implementing recommended improvements before major marketing');
  } else {
    console.log('❌ CDN configuration requires significant improvements');
    console.log('❌ Will likely fail during major tech YouTube reviews');
    console.log('❌ Must address critical issues before production deployment');
  }

  // Save detailed results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `cdn-load-test-results-${timestamp}.json`;

  try {
    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${filename}`);
  } catch (error) {
    console.error('Failed to save results file:', error);
  }
}

/**
 * Run specific scenario test
 */
async function runScenarioTest(scenarioName: string) {
  const scenario = TRAFFIC_SCENARIOS[scenarioName as keyof typeof TRAFFIC_SCENARIOS];

  if (!scenario) {
    console.error(`❌ Unknown scenario: ${scenarioName}`);
    console.log('Available scenarios:', Object.keys(TRAFFIC_SCENARIOS).join(', '));
    return;
  }

  console.log(`🎯 Running specific test: ${scenario.name}`);

  const validator = new CDNValidator();
  const testConfig: CDNTestConfig = {
    videoUrls: REALISTIC_VIDEO_SIZES.map(v => v.url),
    testRegions: TEST_REGIONS,
    concurrentUsers: scenario.concurrentUsers,
    testDuration: scenario.testDuration,
    qualityLevels: REALISTIC_VIDEO_SIZES,
    targetMetrics: PERFORMANCE_TARGETS
  };

  const result = await validator.validateCDN(testConfig);
  generateSummaryReport([{ scenario: scenarioName, ...result }]);
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Run all scenarios
    runCDNLoadTests().catch(console.error);
  } else if (args[0] === '--scenario' && args[1]) {
    // Run specific scenario
    runScenarioTest(args[1]).catch(console.error);
  } else if (args[0] === '--help') {
    console.log('CDN Load Testing Script');
    console.log('Usage:');
    console.log('  npm run cdn-test                    # Run all scenarios');
    console.log('  npm run cdn-test --scenario baseline # Run specific scenario');
    console.log('');
    console.log('Available scenarios:');
    Object.entries(TRAFFIC_SCENARIOS).forEach(([key, scenario]) => {
      console.log(`  ${key.padEnd(15)} - ${scenario.description}`);
    });
  } else {
    console.error('❌ Invalid arguments. Use --help for usage information.');
  }
}