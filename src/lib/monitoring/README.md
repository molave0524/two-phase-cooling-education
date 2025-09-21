# Performance Monitoring Framework

This comprehensive monitoring framework provides real-time performance tracking, alerting, and analytics for the Two-Phase Cooling Education Center platform.

## Overview

The monitoring framework addresses critical performance concerns across all system components:
- **Application Health**: Response times, error rates, throughput, uptime
- **Video Delivery**: CDN performance, cache efficiency, streaming quality
- **Database Performance**: Query times, connection pools, index efficiency
- **AI Service Monitoring**: Response times, success rates, circuit breaker status
- **User Experience**: Core Web Vitals, page performance, engagement
- **Business Metrics**: Conversions, revenue, user satisfaction

## Key Components

### 🎯 Performance Monitor (`performance-monitor.ts`)
- **Real-time Metrics Collection**: Monitors 30+ performance indicators
- **Smart Alerting System**: 12 pre-configured alert rules with customizable thresholds
- **CloudWatch Integration**: Automatic metric publishing for AWS dashboards
- **Historical Analysis**: Trend analysis and performance reporting
- **Incident Management**: Alert acknowledgment and resolution tracking

### 📊 Performance Dashboard (`performance-dashboard.ts`)
- **Live Dashboard**: React component for real-time monitoring
- **Interactive Charts**: Performance trends and historical data visualization
- **Alert Management**: View, acknowledge, and resolve alerts
- **Customizable Views**: Multiple time ranges and metric filtering
- **Mobile Responsive**: Optimized for desktop and mobile monitoring

## Quick Start

### 1. Basic Monitoring Setup

```typescript
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor';

// Initialize monitor
const monitor = new PerformanceMonitor('us-east-1');

// Start monitoring every 30 seconds
monitor.startMonitoring(30000);

// Get current health status
const health = monitor.getHealthSummary();
console.log(`System Health: ${health.status} (${health.score}/100)`);
```

### 2. Dashboard Integration

```typescript
import { PerformanceDashboard } from '@/lib/monitoring/performance-dashboard';

function MonitoringPage() {
  const monitor = new PerformanceMonitor();

  return (
    <PerformanceDashboard
      monitor={monitor}
      refreshInterval={30000}
      autoRefresh={true}
    />
  );
}
```

### 3. Custom Alert Configuration

```typescript
// Add custom alert rule
monitor.addAlertRule({
  id: 'high-video-start-time',
  name: 'High Video Start Time',
  metric: 'videoDelivery.averageStartTime',
  condition: 'greater_than',
  threshold: 3000, // 3 seconds
  duration: 180,   // 3 minutes
  severity: 'high',
  enabled: true,
  channels: [
    { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL, enabled: true },
    { type: 'email', endpoint: 'alerts@twophasecooling.com', enabled: true }
  ]
});
```

### 4. Performance Report Generation

```typescript
// Generate comprehensive report
const report = monitor.generatePerformanceReport(24); // Last 24 hours

console.log(`Overall Health: ${report.summary.overallHealth}`);
console.log(`Performance Score: ${report.summary.performanceScore}/100`);
console.log(`Active Incidents: ${report.summary.totalIncidents}`);

// Get specific recommendations
report.recommendations.forEach(rec => {
  console.log(`📋 ${rec}`);
});
```

## Alert Rules Configuration

### Default Alert Rules

The framework includes 12 pre-configured alert rules covering critical scenarios:

#### 🚨 Critical Alerts
- **Application Response Time > 5s** (3 min duration)
- **Error Rate > 5%** (1 min duration)
- **Video Start Time > 5s** (1 min duration)

#### ⚠️ Warning Alerts
- **Video Start Time > 2s** (3 min duration)
- **Cache Hit Rate < 70%** (5 min duration)
- **Database Response > 1s** (5 min duration)
- **AI Fallback Rate > 50%** (5 min duration)

#### 📊 Business Alerts
- **Conversion Rate < 1%** (1 hour duration)
- **High Bounce Rate > 20%** (10 min duration)

### Custom Alert Channels

```typescript
// Slack Integration
{
  type: 'slack',
  endpoint: 'https://hooks.slack.com/services/...',
  enabled: true
}

// Email Notifications
{
  type: 'email',
  endpoint: 'alerts@your-domain.com',
  enabled: true
}

// Webhook Integration
{
  type: 'webhook',
  endpoint: 'https://your-api.com/alerts',
  enabled: true
}
```

## Performance Metrics

### Application Health
- **Response Time**: Average API response time (target: <1s)
- **Error Rate**: Percentage of failed requests (target: <1%)
- **Throughput**: Requests per second
- **Uptime**: Service availability percentage (target: >99.9%)
- **Memory Usage**: Heap utilization percentage
- **CPU Usage**: Processing utilization percentage

### Video Delivery Performance
- **Video Start Time**: Time to first frame (target: <2s)
- **Buffer Health**: Streaming buffer ratio (target: >95%)
- **Cache Hit Rate**: CDN cache efficiency (target: >80%)
- **Completion Rate**: Video completion percentage
- **Bandwidth Utilization**: Network usage (Mbps)
- **Error Rate**: Video delivery failures (target: <1%)

### Database Performance
- **Query Response Time**: Average query duration (target: <100ms)
- **Connection Pool Usage**: Database connection utilization
- **Slow Query Count**: Queries exceeding time thresholds
- **Lock Contention**: Database locking conflicts
- **Index Efficiency**: Index utilization ratio (target: >95%)
- **Deadlock Count**: Database deadlock incidents

### AI Service Health
- **Response Time**: AI API response duration (target: <3s)
- **Success Rate**: Successful AI responses (target: >95%)
- **Fallback Rate**: FAQ fallback usage (target: <10%)
- **Circuit Breaker State**: Service protection status
- **Tokens Used**: OpenAI token consumption
- **Cost Per Hour**: AI service expenses

### User Experience Metrics
- **Page Load Time**: Full page load duration (target: <2s)
- **First Contentful Paint**: FCP metric (target: <1.5s)
- **Largest Contentful Paint**: LCP metric (target: <2.5s)
- **Cumulative Layout Shift**: CLS score (target: <0.1)
- **First Input Delay**: FID metric (target: <100ms)
- **Bounce Rate**: User abandonment rate (target: <15%)

### Business Analytics
- **Active Users**: Current concurrent users
- **Conversion Rate**: Visitor to customer rate (target: >2%)
- **Session Duration**: Average user session time
- **Revenue Per Hour**: Hourly revenue generation
- **Customer Satisfaction**: CSAT score (target: >4.5)
- **Support Ticket Rate**: Support requests per hour

## CloudWatch Integration

### Automatic Metric Publishing

The monitor automatically publishes metrics to AWS CloudWatch:

```typescript
// Metrics are published to namespace: TwoPhaseCooling/Education
// Examples:
// - ApplicationResponseTime (Milliseconds)
// - VideoStartTime (Milliseconds)
// - DatabaseResponseTime (Milliseconds)
// - AIResponseTime (Milliseconds)
// - ActiveUsers (Count)
// - ConversionRate (Percent)
```

### CloudWatch Dashboard Setup

```typescript
// Create custom CloudWatch dashboard
const dashboardBody = {
  widgets: [
    {
      type: "metric",
      properties: {
        metrics: [
          ["TwoPhaseCooling/Education", "VideoStartTime"],
          [".", "ApplicationResponseTime"],
          [".", "DatabaseResponseTime"]
        ],
        period: 300,
        stat: "Average",
        region: "us-east-1",
        title: "Response Times"
      }
    }
  ]
};
```

## Performance Targets & Thresholds

### Critical Performance Targets

| Component | Metric | Target | Warning | Critical |
|-----------|--------|---------|---------|----------|
| **Application** | Response Time | <1s | >2s | >5s |
| **Application** | Error Rate | <1% | >2% | >5% |
| **Video Delivery** | Start Time | <2s | >3s | >5s |
| **Video Delivery** | Cache Hit Rate | >80% | <70% | <60% |
| **Database** | Query Time | <100ms | >500ms | >1s |
| **AI Service** | Response Time | <3s | >5s | >10s |
| **User Experience** | Page Load | <2s | >3s | >5s |
| **Business** | Conversion Rate | >2% | <1.5% | <1% |

### Performance Scoring

The framework calculates an overall performance score (0-100) based on weighted metrics:
- **Application Health**: 25% weight
- **Video Delivery**: 25% weight
- **Database Performance**: 20% weight
- **AI Service**: 15% weight
- **User Experience**: 15% weight

## Advanced Features

### Trend Analysis

```typescript
// Analyze performance trends over time
const report = monitor.generatePerformanceReport(24);

report.trends.forEach(trend => {
  console.log(`${trend.metric}: ${trend.trend} (${trend.changePercentage}%)`);
});

// Example output:
// Application Response Time: improving (-15%)
// Video Start Time: stable (2%)
// Conversion Rate: degrading (-8%)
```

### Intelligent Recommendations

The framework provides context-aware optimization recommendations:

```typescript
const recommendations = monitor.generateRecommendations(metrics);

// Example recommendations:
// 🚀 Optimize application response time by implementing caching strategies
// 📹 Optimize video delivery by improving CDN configuration
// 💾 Improve cache hit rate by adjusting TTL settings
// 🗄️ Optimize database performance with better indexing
```

### Health Check API

```typescript
// Health check endpoint for load balancers
app.get('/api/health', (req, res) => {
  const health = monitor.getHealthSummary();
  const alerts = monitor.getActiveAlerts();

  res.status(health.score > 50 ? 200 : 503).json({
    status: health.status,
    score: health.score,
    alerts: alerts.length,
    timestamp: new Date().toISOString()
  });
});
```

### Performance Testing Integration

```typescript
// Integration with load testing
const validator = new CDNValidator(); // From CDN validation framework

// Run performance validation before deployment
const results = await validator.validateCDN({
  videoUrls: ['https://cdn.example.com/video.mp4'],
  concurrentUsers: [100, 500, 1000],
  testDuration: 60000
});

if (results.passedValidation) {
  console.log('✅ Performance validation passed');
  // Deploy to production
} else {
  console.log('❌ Performance issues detected');
  console.log('Recommendations:', results.recommendations);
}
```

## Production Deployment

### Environment Configuration

```bash
# Required environment variables
export AWS_REGION="us-east-1"
export CLOUDWATCH_NAMESPACE="TwoPhaseCooling/Education"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export ALERT_EMAIL="alerts@twophasecooling.com"

# Optional configuration
export MONITORING_INTERVAL="30000"  # 30 seconds
export METRICS_RETENTION_HOURS="24" # 24 hours
export PERFORMANCE_SCORE_THRESHOLD="75" # Minimum acceptable score
```

### Docker Integration

```dockerfile
# Add monitoring to your application container
COPY src/lib/monitoring/ /app/src/lib/monitoring/

# Install monitoring dependencies
RUN npm install @aws-sdk/client-cloudwatch

# Health check using monitoring framework
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: performance-monitor
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: AWS_REGION
          value: "us-east-1"
        - name: SLACK_WEBHOOK_URL
          valueFrom:
            secretKeyRef:
              name: monitoring-secrets
              key: slack-webhook
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 30
```

## Troubleshooting

### Common Issues

**High response times?**
- Check application server performance
- Review database query efficiency
- Validate CDN configuration
- Monitor memory and CPU usage

**Alert fatigue?**
- Adjust alert thresholds based on baseline performance
- Implement alert grouping and rate limiting
- Review alert severity levels
- Use acknowledgment to reduce noise

**Missing metrics?**
- Verify CloudWatch permissions
- Check environment variable configuration
- Review monitoring interval settings
- Validate metric collection logic

**Dashboard performance issues?**
- Implement data pagination for large datasets
- Use caching for expensive calculations
- Optimize chart rendering performance
- Consider server-side rendering for complex views

### Debug Mode

```typescript
// Enable debug logging
const monitor = new PerformanceMonitor();
monitor.enableDebugMode(); // Enables detailed logging

// Manual metric collection for testing
await monitor.collectMetrics();
const metrics = monitor.getCurrentMetrics();
console.log('Current metrics:', metrics);
```

This comprehensive monitoring framework provides everything needed to maintain optimal performance for the Two-Phase Cooling Education Center platform, ensuring excellent user experience and business success.