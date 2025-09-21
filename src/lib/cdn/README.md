# CDN Performance Validation Framework

This comprehensive CDN validation framework addresses the **PERF-001: Video Delivery Performance Under Load** risk for the Two-Phase Cooling Education Center platform.

## Overview

The framework provides complete validation of CloudFront CDN performance for 4K video delivery, ensuring the platform can handle traffic spikes from major YouTube tech channel reviews while maintaining sub-2-second video start times.

## Key Components

### 🧪 CDN Validator (`cdn-validator.ts`)
- **Load Testing**: Simulates concurrent users from 10 to 50,000
- **Geographic Testing**: Validates performance across global regions
- **Cost Analysis**: Estimates bandwidth costs under different load scenarios
- **Performance Metrics**: Tracks TTFB, video start times, throughput, buffer health

### ⚙️ CloudFront Configuration (`cloudfront-config.ts`)
- **Production Config**: Optimized for 4K video delivery with global edge locations
- **Development Config**: Fast iteration with shorter TTLs
- **Load Test Config**: Specialized for performance validation
- **Adaptive Streaming**: HLS support with quality switching

### 📊 Monitoring System (`cdn-monitor.ts`)
- **Real-time Metrics**: Video delivery, cache performance, error tracking
- **Smart Alerting**: Configurable thresholds with Slack/email notifications
- **Cost Tracking**: Daily spend monitoring with budget alerts
- **User Experience**: Buffer health, abandonment rates, completion tracking

### 🚀 Load Testing Scripts
- **TypeScript Framework**: Comprehensive test scenarios
- **Artillery.js Config**: Production-grade load testing with realistic traffic patterns
- **Multiple Scenarios**: From baseline traffic to viral YouTube moments

## Quick Start

### 1. Setup Environment

```bash
# Install dependencies
npm install

# Set environment variables
export OPENAI_API_KEY="your-key"
export SLACK_WEBHOOK_URL="your-slack-webhook"

# Update CloudFront domain in configs
# Replace 'd123456789.cloudfront.net' with your actual domain
```

### 2. Run Basic CDN Validation

```typescript
import { CDNValidator } from '@/lib/cdn/cdn-validator';

const validator = new CDNValidator();
const result = await validator.validateCDN({
  videoUrls: ['https://your-cdn.com/videos/demo-4k.mp4'],
  testRegions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
  concurrentUsers: [100, 500, 1000],
  testDuration: 60000, // 1 minute
  qualityLevels: [
    { resolution: '4K', bitrate: 45000000, fileSize: 2048, url: '...' }
  ],
  targetMetrics: {
    firstByteTime: 500,    // 500ms TTFB
    videoStartTime: 2000,  // 2s video start
    bufferRatio: 0.95,     // 95% buffer health
    errorRate: 0.01,       // 1% max errors
    cacheHitRate: 0.8      // 80% cache hits
  }
});

console.log(`Validation: ${result.passedValidation ? 'PASS' : 'FAIL'}`);
console.log(`Video Start Time: ${result.results.performance.averageVideoStartTime}ms`);
```

### 3. Run Load Testing Scenarios

```bash
# Test all traffic scenarios (baseline to viral)
npm run cdn-test

# Test specific scenario
npm run cdn-test --scenario largeYouTuber

# Run Artillery.js load test
npx artillery run scripts/artillery-cdn-test.yml --environment production
```

### 4. Start Performance Monitoring

```typescript
import { CDNMonitor } from '@/lib/cdn/cdn-monitor';

const monitor = new CDNMonitor();
monitor.startMonitoring(30000); // Monitor every 30 seconds

// Get current performance
const metrics = monitor.getCurrentMetrics();
console.log(`Video Start Time: ${metrics?.videoDelivery.averageStartTime}ms`);

// Generate report
console.log(monitor.generatePerformanceReport(24)); // Last 24 hours
```

## Traffic Scenarios

The framework tests against realistic YouTube tech channel traffic patterns:

### Baseline Traffic
- **Users**: 10-100 concurrent
- **Description**: Normal daily traffic
- **Use Case**: Baseline performance validation

### Small YouTuber Mention (10K-50K subs)
- **Users**: 100-750 concurrent
- **Description**: Small tech channel mentions your product
- **Use Case**: Initial viral testing

### Medium YouTuber Review (100K-500K subs)
- **Users**: 500-3,000 concurrent
- **Description**: Medium tech channel does full review
- **Use Case**: Moderate traffic spike validation

### Large YouTuber Review (1M+ subs)
- **Users**: 2,000-15,000 concurrent
- **Description**: Major tech channel (LTT, MKBHD) features your product
- **Use Case**: High-impact marketing moment validation

### Viral Tech Moment
- **Users**: 10,000-50,000 concurrent
- **Description**: Multiple channels cover simultaneously
- **Use Case**: Maximum stress testing

## CloudFront Configurations

### Production Configuration
```typescript
const config = getCloudFrontConfig('production');
// - Global edge locations (PriceClass_All)
// - 24-hour TTL for videos
// - Geographic restriction to US/CA
// - Optimized for 4K delivery
```

### Load Testing Configuration
```typescript
const config = getCloudFrontConfig('loadtest');
// - Shorter TTLs for faster testing
// - Global regions enabled
// - Enhanced logging
// - Cost-optimized for testing
```

### Adaptive Streaming Configuration
```typescript
const config = getCloudFrontConfig('adaptive');
// - HLS manifest optimization (10s TTL)
// - Video segment caching (1h TTL)
// - Quality parameter support
// - Dynamic bitrate switching
```

## Performance Targets

The framework validates against these targets based on your architecture requirements:

| Metric | Target | Critical Threshold |
|--------|--------|--------------------|
| **Video Start Time** | < 2 seconds | < 3 seconds |
| **First Byte Time** | < 500ms | < 1 second |
| **Error Rate** | < 1% | < 5% |
| **Cache Hit Rate** | > 80% | > 70% |
| **Buffer Health** | > 95% | > 90% |

## Monitoring & Alerting

### Default Alert Rules

**🔴 Critical Alerts**
- Error rate > 5% (1 minute duration)
- Video start time > 5 seconds (3 minutes duration)

**🟡 Warning Alerts**
- Video start time > 2 seconds (3 minutes duration)
- Cache hit rate < 70% (5 minutes duration)
- Daily cost > $500 (1 hour duration)

**📊 Info Alerts**
- User abandonment > 20% (10 minutes duration)

### Custom Alert Configuration

```typescript
monitor.addAlertRule({
  id: 'custom-latency-alert',
  name: 'Custom Latency Alert',
  metric: 'videoDelivery.p95StartTime',
  condition: 'greater_than',
  threshold: 3000, // 3 seconds
  duration: 300,   // 5 minutes
  severity: 'high',
  enabled: true,
  channels: [
    { type: 'slack', endpoint: 'your-slack-webhook' },
    { type: 'email', endpoint: 'alerts@your-domain.com' }
  ]
});
```

## Cost Analysis

The framework provides comprehensive cost analysis:

### Cost Components
- **Bandwidth**: ~$0.085/GB (varies by region)
- **Requests**: ~$0.0075/10,000 requests
- **Origin Shield**: Optional additional cost for better cache performance

### Example Cost Estimates

| Scenario | Monthly Users | Data Transfer | Estimated Cost |
|----------|---------------|---------------|----------------|
| **Baseline** | 1,000 | 100 GB | $15/month |
| **Medium Growth** | 10,000 | 1 TB | $120/month |
| **Viral Success** | 100,000 | 10 TB | $1,000/month |

### Cost Optimization Strategies
1. **Aggressive Caching**: Increase TTLs where possible
2. **Compression**: Enable compression for metadata/manifests
3. **Quality Optimization**: Balance quality vs. bandwidth costs
4. **Regional Optimization**: Use appropriate price classes

## Real-World Usage Examples

### Example 1: Pre-Launch Validation
```bash
# Validate CDN before major marketing push
npm run cdn-test --scenario largeYouTuber

# Check results
if [[ $? -eq 0 ]]; then
  echo "✅ CDN ready for large YouTuber review"
else
  echo "❌ CDN needs optimization before marketing"
fi
```

### Example 2: Continuous Monitoring
```typescript
// In production application
const monitor = new CDNMonitor();
monitor.startMonitoring(30000);

// Health check endpoint
app.get('/api/health/cdn', (req, res) => {
  const metrics = monitor.getCurrentMetrics();
  const alerts = monitor.getActiveAlerts();

  res.json({
    status: alerts.length === 0 ? 'healthy' : 'degraded',
    metrics: {
      videoStartTime: metrics?.videoDelivery.averageStartTime,
      errorRate: metrics?.errorTracking.totalErrorRate,
      cacheHitRate: metrics?.cachePerformance.hitRate
    },
    activeAlerts: alerts.length
  });
});
```

### Example 3: YouTube Review Preparation
```typescript
// Before major tech channel review
const validator = new CDNValidator();

// Test the exact traffic pattern expected
const result = await validator.validateCDN({
  concurrentUsers: [5000, 10000, 15000], // LTT-level traffic
  testDuration: 300000, // 5 minutes sustained
  // ... other config
});

if (result.passedValidation) {
  console.log('✅ Ready for major tech channel review');
  // Deploy marketing campaign
} else {
  console.log('❌ CDN optimization needed');
  console.log('Recommendations:', result.recommendations);
  // Optimize before marketing
}
```

## Integration with CI/CD

### GitHub Actions Integration
```yaml
# .github/workflows/cdn-validation.yml
name: CDN Performance Validation

on:
  pull_request:
    paths: ['src/lib/cdn/**']
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours

jobs:
  cdn-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run CDN validation
        run: |
          npm ci
          npm run cdn-test --scenario baseline
        env:
          CDN_DOMAIN: ${{ secrets.CDN_DOMAIN }}

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: cdn-test-results
          path: cdn-load-test-results-*.json
```

## Troubleshooting

### Common Issues

**High video start times?**
- Check origin server performance
- Validate CloudFront cache configuration
- Test from multiple geographic regions
- Review video encoding/compression

**Low cache hit rates?**
- Verify Cache-Control headers from origin
- Check CloudFront behavior configurations
- Review query string forwarding settings
- Analyze cache invalidation patterns

**Geographic performance issues?**
- Verify PriceClass includes target regions
- Check for regional CDN misconfigurations
- Test from actual target locations
- Consider Origin Shield for distant regions

**Cost spikes?**
- Monitor bandwidth usage patterns
- Check for cache misses causing origin hits
- Validate video compression settings
- Review price class configuration

### Debug Mode

```typescript
// Enable detailed logging
const validator = new CDNValidator();
validator.enableDebugMode();

// This will log all request/response details
const result = await validator.validateCDN(config);
```

## Contributing

### Adding New Test Scenarios
1. Add scenario to `TRAFFIC_SCENARIOS` in `cdn-load-test.ts`
2. Update documentation with scenario description
3. Test with realistic concurrent user patterns

### Extending Monitoring
1. Add new metrics to `CDNMetrics` interface
2. Implement collection logic in `CDNMonitor`
3. Create appropriate alert rules
4. Update dashboard/reporting

This framework provides everything needed to validate your CDN performance against the demanding requirements of a video-heavy educational platform targeting tech enthusiasts.