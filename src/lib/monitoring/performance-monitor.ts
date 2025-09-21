// Comprehensive Performance Monitoring Framework
// Two-Phase Cooling Education Center
//
// This monitoring system tracks all critical performance metrics across the platform,
// providing real-time alerting, performance analytics, and system health monitoring.

import { CloudWatchClient, PutMetricDataCommand, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PerformanceMetrics {
  // Application Performance
  applicationHealth: {
    responseTime: number;           // Average response time (ms)
    errorRate: number;             // Error rate percentage
    throughput: number;            // Requests per second
    uptime: number;               // Uptime percentage
    memoryUsage: number;          // Memory usage percentage
    cpuUsage: number;             // CPU usage percentage
  };

  // Video Delivery Performance
  videoDelivery: {
    averageStartTime: number;      // Video start time (ms)
    bufferHealthRatio: number;     // Buffer health percentage
    completionRate: number;        // Video completion percentage
    bandwidthUtilization: number;  // Bandwidth usage (Mbps)
    cacheHitRate: number;         // CDN cache hit rate
    errorRate: number;            // Video delivery error rate
  };

  // Database Performance
  databaseHealth: {
    queryResponseTime: number;     // Average query time (ms)
    connectionPoolUsage: number;   // Connection pool utilization
    slowQueryCount: number;        // Number of slow queries
    lockContentionRate: number;    // Database lock contention
    indexEfficiency: number;       // Index hit ratio
    deadlockCount: number;        // Number of deadlocks
  };

  // AI Service Performance
  aiService: {
    responseTime: number;          // AI response time (ms)
    successRate: number;          // AI success rate percentage
    fallbackRate: number;         // Fallback usage rate
    circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    tokensUsed: number;           // OpenAI tokens consumed
    costPerHour: number;          // AI service cost per hour
  };

  // User Experience Metrics
  userExperience: {
    pageLoadTime: number;          // Page load time (ms)
    firstContentfulPaint: number;  // FCP metric (ms)
    largestContentfulPaint: number; // LCP metric (ms)
    cumulativeLayoutShift: number; // CLS score
    firstInputDelay: number;       // FID metric (ms)
    bounceRate: number;           // User bounce rate percentage
  };

  // Business Metrics
  businessHealth: {
    activeUsers: number;           // Current active users
    conversionRate: number;        // Visitor to customer conversion
    averageSessionDuration: number; // Session duration (seconds)
    revenuePerHour: number;       // Revenue rate
    customerSatisfaction: number;  // CSAT score
    supportTicketRate: number;    // Support tickets per hour
  };

  timestamp: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;                 // Dot notation path to metric
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  duration: number;               // Duration in seconds before alerting
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  lastTriggered?: Date;
  channels: AlertChannel[];
}

export interface AlertChannel {
  type: 'slack' | 'email' | 'sms' | 'webhook';
  endpoint: string;
  enabled: boolean;
}

export interface PerformanceAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: string;
  message: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'acknowledged';
}

export interface PerformanceReport {
  timeRange: {
    start: Date;
    end: Date;
  };
  summary: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    uptime: number;
    totalIncidents: number;
    meanTimeToResolution: number;
    performanceScore: number; // 0-100
  };
  sections: {
    applicationHealth: PerformanceSection;
    videoDelivery: PerformanceSection;
    databaseHealth: PerformanceSection;
    aiService: PerformanceSection;
    userExperience: PerformanceSection;
    businessHealth: PerformanceSection;
  };
  recommendations: string[];
  trends: {
    metric: string;
    trend: 'improving' | 'stable' | 'degrading';
    changePercentage: number;
  }[];
}

export interface PerformanceSection {
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  keyMetrics: { name: string; value: number; unit: string; status: string }[];
  incidents: number;
  recommendations: string[];
}

// ============================================================================
// PERFORMANCE MONITOR CLASS
// ============================================================================

export class PerformanceMonitor {
  private cloudWatch: CloudWatchClient;
  private metrics: PerformanceMetrics[] = [];
  private alertRules: AlertRule[] = [];
  private activeAlerts: PerformanceAlert[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  // Configuration
  private readonly MAX_METRICS_HISTORY = 1440; // 24 hours of minute-by-minute data
  private readonly CLOUDWATCH_NAMESPACE = 'TwoPhaseCooling/Education';

  constructor(region = 'us-east-1') {
    this.cloudWatch = new CloudWatchClient({ region });
    this.initializeDefaultAlertRules();
  }

  // ============================================================================
  // MONITORING CONTROL
  // ============================================================================

  public startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.warn('Performance monitoring is already running');
      return;
    }

    console.log(`Starting performance monitoring with ${intervalMs}ms interval`);
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkAlertRules();
        await this.publishToCloudWatch();
      } catch (error) {
        console.error('Error during monitoring cycle:', error);
      }
    }, intervalMs);

    // Initial collection
    this.collectMetrics();
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('Stopping performance monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  private async collectMetrics(): Promise<void> {
    const metrics: PerformanceMetrics = {
      applicationHealth: await this.collectApplicationMetrics(),
      videoDelivery: await this.collectVideoMetrics(),
      databaseHealth: await this.collectDatabaseMetrics(),
      aiService: await this.collectAIMetrics(),
      userExperience: await this.collectUserExperienceMetrics(),
      businessHealth: await this.collectBusinessMetrics(),
      timestamp: new Date()
    };

    this.metrics.push(metrics);

    // Maintain history limit
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_HISTORY);
    }
  }

  private async collectApplicationMetrics() {
    // Collect from Next.js middleware, AWS Lambda metrics, etc.
    return {
      responseTime: await this.getAverageResponseTime(),
      errorRate: await this.getErrorRate(),
      throughput: await this.getThroughput(),
      uptime: await this.calculateUptime(),
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100,
      cpuUsage: await this.getCPUUsage()
    };
  }

  private async collectVideoMetrics() {
    // Collect from CloudFront logs, CDN analytics
    return {
      averageStartTime: await this.getVideoStartTime(),
      bufferHealthRatio: await this.getBufferHealth(),
      completionRate: await this.getVideoCompletionRate(),
      bandwidthUtilization: await this.getBandwidthUtilization(),
      cacheHitRate: await this.getCacheHitRate(),
      errorRate: await this.getVideoErrorRate()
    };
  }

  private async collectDatabaseMetrics() {
    // Collect from PostgreSQL metrics, Prisma monitoring
    return {
      queryResponseTime: await this.getDatabaseResponseTime(),
      connectionPoolUsage: await this.getConnectionPoolUsage(),
      slowQueryCount: await this.getSlowQueryCount(),
      lockContentionRate: await this.getLockContentionRate(),
      indexEfficiency: await this.getIndexEfficiency(),
      deadlockCount: await this.getDeadlockCount()
    };
  }

  private async collectAIMetrics() {
    // Collect from AI service monitoring
    return {
      responseTime: await this.getAIResponseTime(),
      successRate: await this.getAISuccessRate(),
      fallbackRate: await this.getAIFallbackRate(),
      circuitBreakerState: await this.getCircuitBreakerState(),
      tokensUsed: await this.getTokensUsed(),
      costPerHour: await this.getAICostPerHour()
    };
  }

  private async collectUserExperienceMetrics() {
    // Collect from Real User Monitoring (RUM), Core Web Vitals
    return {
      pageLoadTime: await this.getPageLoadTime(),
      firstContentfulPaint: await this.getFCP(),
      largestContentfulPaint: await this.getLCP(),
      cumulativeLayoutShift: await this.getCLS(),
      firstInputDelay: await this.getFID(),
      bounceRate: await this.getBounceRate()
    };
  }

  private async collectBusinessMetrics() {
    // Collect from analytics, business intelligence
    return {
      activeUsers: await this.getActiveUsers(),
      conversionRate: await this.getConversionRate(),
      averageSessionDuration: await this.getSessionDuration(),
      revenuePerHour: await this.getRevenueRate(),
      customerSatisfaction: await this.getCSAT(),
      supportTicketRate: await this.getSupportTicketRate()
    };
  }

  // ============================================================================
  // ALERT MANAGEMENT
  // ============================================================================

  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      // Critical Application Alerts
      {
        id: 'app-response-time-critical',
        name: 'Critical Application Response Time',
        metric: 'applicationHealth.responseTime',
        condition: 'greater_than',
        threshold: 5000, // 5 seconds
        duration: 180,   // 3 minutes
        severity: 'critical',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '', enabled: true },
          { type: 'email', endpoint: 'alerts@twophasecooling.com', enabled: true }
        ]
      },
      {
        id: 'app-error-rate-high',
        name: 'High Application Error Rate',
        metric: 'applicationHealth.errorRate',
        condition: 'greater_than',
        threshold: 5.0, // 5% error rate
        duration: 60,   // 1 minute
        severity: 'critical',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '', enabled: true }
        ]
      },

      // Video Delivery Alerts
      {
        id: 'video-start-time-warning',
        name: 'Video Start Time Warning',
        metric: 'videoDelivery.averageStartTime',
        condition: 'greater_than',
        threshold: 2000, // 2 seconds
        duration: 180,   // 3 minutes
        severity: 'medium',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '', enabled: true }
        ]
      },
      {
        id: 'video-start-time-critical',
        name: 'Critical Video Start Time',
        metric: 'videoDelivery.averageStartTime',
        condition: 'greater_than',
        threshold: 5000, // 5 seconds
        duration: 60,    // 1 minute
        severity: 'critical',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '', enabled: true },
          { type: 'email', endpoint: 'alerts@twophasecooling.com', enabled: true }
        ]
      },
      {
        id: 'cache-hit-rate-low',
        name: 'Low CDN Cache Hit Rate',
        metric: 'videoDelivery.cacheHitRate',
        condition: 'less_than',
        threshold: 0.7, // 70%
        duration: 300,  // 5 minutes
        severity: 'medium',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '', enabled: true }
        ]
      },

      // Database Alerts
      {
        id: 'database-response-slow',
        name: 'Slow Database Response',
        metric: 'databaseHealth.queryResponseTime',
        condition: 'greater_than',
        threshold: 1000, // 1 second
        duration: 300,   // 5 minutes
        severity: 'high',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '', enabled: true }
        ]
      },
      {
        id: 'database-deadlocks',
        name: 'Database Deadlocks Detected',
        metric: 'databaseHealth.deadlockCount',
        condition: 'greater_than',
        threshold: 5,   // 5 deadlocks
        duration: 300,  // 5 minutes
        severity: 'high',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '', enabled: true }
        ]
      },

      // AI Service Alerts
      {
        id: 'ai-circuit-breaker-open',
        name: 'AI Circuit Breaker Open',
        metric: 'aiService.circuitBreakerState',
        condition: 'equals',
        threshold: 1, // Using numeric value for OPEN state
        duration: 60, // 1 minute
        severity: 'high',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '', enabled: true }
        ]
      },
      {
        id: 'ai-fallback-rate-high',
        name: 'High AI Fallback Rate',
        metric: 'aiService.fallbackRate',
        condition: 'greater_than',
        threshold: 50, // 50% fallback rate
        duration: 300, // 5 minutes
        severity: 'medium',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '', enabled: true }
        ]
      },

      // Business Alerts
      {
        id: 'conversion-rate-low',
        name: 'Low Conversion Rate',
        metric: 'businessHealth.conversionRate',
        condition: 'less_than',
        threshold: 1.0, // 1% conversion rate
        duration: 3600, // 1 hour
        severity: 'medium',
        enabled: true,
        channels: [
          { type: 'email', endpoint: 'business@twophasecooling.com', enabled: true }
        ]
      },
      {
        id: 'user-abandonment-high',
        name: 'High User Abandonment',
        metric: 'userExperience.bounceRate',
        condition: 'greater_than',
        threshold: 20, // 20% bounce rate
        duration: 600, // 10 minutes
        severity: 'low',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '', enabled: true }
        ]
      }
    ];
  }

  private async checkAlertRules(): Promise<void> {
    if (this.metrics.length === 0) return;

    const currentMetrics = this.metrics[this.metrics.length - 1];

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const metricValue = this.getMetricValue(currentMetrics, rule.metric);
      if (metricValue === undefined) continue;

      const shouldAlert = this.evaluateCondition(metricValue, rule.condition, rule.threshold);

      if (shouldAlert) {
        await this.handleAlert(rule, metricValue);
      }
    }
  }

  private getMetricValue(metrics: PerformanceMetrics, metricPath: string): number | undefined {
    const parts = metricPath.split('.');
    let value: any = metrics;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return typeof value === 'number' ? value : undefined;
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'greater_than': return value > threshold;
      case 'less_than': return value < threshold;
      case 'equals': return Math.abs(value - threshold) < 0.001;
      case 'not_equals': return Math.abs(value - threshold) >= 0.001;
      default: return false;
    }
  }

  private async handleAlert(rule: AlertRule, currentValue: number): Promise<void> {
    // Check if alert already exists
    const existingAlert = this.activeAlerts.find(
      alert => alert.ruleId === rule.id && alert.status === 'active'
    );

    if (existingAlert) {
      return; // Alert already active
    }

    // Create new alert
    const alert: PerformanceAlert = {
      id: `alert-${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, currentValue),
      triggeredAt: new Date(),
      status: 'active'
    };

    this.activeAlerts.push(alert);

    // Send notifications
    await this.sendAlertNotifications(alert, rule.channels);

    rule.lastTriggered = new Date();
  }

  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const condition = rule.condition.replace('_', ' ');
    return `🚨 ${rule.name}\n` +
           `Metric: ${rule.metric}\n` +
           `Current Value: ${currentValue.toFixed(2)}\n` +
           `Threshold: ${condition} ${rule.threshold}\n` +
           `Severity: ${rule.severity.toUpperCase()}\n` +
           `Time: ${new Date().toISOString()}`;
  }

  private async sendAlertNotifications(alert: PerformanceAlert, channels: AlertChannel[]): Promise<void> {
    for (const channel of channels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'slack':
            await this.sendSlackNotification(alert, channel.endpoint);
            break;
          case 'email':
            await this.sendEmailNotification(alert, channel.endpoint);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, channel.endpoint);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel.type} notification:`, error);
      }
    }
  }

  private async sendSlackNotification(alert: PerformanceAlert, webhookUrl: string): Promise<void> {
    if (!webhookUrl) return;

    const payload = {
      text: alert.message,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: 'Metric', value: alert.metric, short: true },
          { title: 'Current Value', value: alert.currentValue.toFixed(2), short: true },
          { title: 'Threshold', value: alert.threshold.toString(), short: true },
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true }
        ]
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  private async sendEmailNotification(alert: PerformanceAlert, email: string): Promise<void> {
    // In production, integrate with AWS SES or similar email service
    console.log(`Email notification to ${email}:`, alert.message);
  }

  private async sendWebhookNotification(alert: PerformanceAlert, webhookUrl: string): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ffcc00';
      case 'low': return 'good';
      default: return '#cccccc';
    }
  }

  // ============================================================================
  // CLOUDWATCH INTEGRATION
  // ============================================================================

  private async publishToCloudWatch(): Promise<void> {
    if (this.metrics.length === 0) return;

    const currentMetrics = this.metrics[this.metrics.length - 1];

    try {
      const metricData = this.buildCloudWatchMetrics(currentMetrics);

      const command = new PutMetricDataCommand({
        Namespace: this.CLOUDWATCH_NAMESPACE,
        MetricData: metricData
      });

      await this.cloudWatch.send(command);
    } catch (error) {
      console.error('Failed to publish metrics to CloudWatch:', error);
    }
  }

  private buildCloudWatchMetrics(metrics: PerformanceMetrics) {
    const metricData = [];

    // Application Health Metrics
    metricData.push(
      { MetricName: 'ApplicationResponseTime', Value: metrics.applicationHealth.responseTime, Unit: 'Milliseconds' },
      { MetricName: 'ApplicationErrorRate', Value: metrics.applicationHealth.errorRate, Unit: 'Percent' },
      { MetricName: 'ApplicationThroughput', Value: metrics.applicationHealth.throughput, Unit: 'Count/Second' },
      { MetricName: 'ApplicationUptime', Value: metrics.applicationHealth.uptime, Unit: 'Percent' }
    );

    // Video Delivery Metrics
    metricData.push(
      { MetricName: 'VideoStartTime', Value: metrics.videoDelivery.averageStartTime, Unit: 'Milliseconds' },
      { MetricName: 'BufferHealthRatio', Value: metrics.videoDelivery.bufferHealthRatio, Unit: 'Percent' },
      { MetricName: 'CacheHitRate', Value: metrics.videoDelivery.cacheHitRate, Unit: 'Percent' },
      { MetricName: 'VideoCompletionRate', Value: metrics.videoDelivery.completionRate, Unit: 'Percent' }
    );

    // Database Metrics
    metricData.push(
      { MetricName: 'DatabaseResponseTime', Value: metrics.databaseHealth.queryResponseTime, Unit: 'Milliseconds' },
      { MetricName: 'ConnectionPoolUsage', Value: metrics.databaseHealth.connectionPoolUsage, Unit: 'Percent' },
      { MetricName: 'SlowQueryCount', Value: metrics.databaseHealth.slowQueryCount, Unit: 'Count' },
      { MetricName: 'DeadlockCount', Value: metrics.databaseHealth.deadlockCount, Unit: 'Count' }
    );

    // AI Service Metrics
    metricData.push(
      { MetricName: 'AIResponseTime', Value: metrics.aiService.responseTime, Unit: 'Milliseconds' },
      { MetricName: 'AISuccessRate', Value: metrics.aiService.successRate, Unit: 'Percent' },
      { MetricName: 'AIFallbackRate', Value: metrics.aiService.fallbackRate, Unit: 'Percent' },
      { MetricName: 'AITokensUsed', Value: metrics.aiService.tokensUsed, Unit: 'Count' }
    );

    // User Experience Metrics
    metricData.push(
      { MetricName: 'PageLoadTime', Value: metrics.userExperience.pageLoadTime, Unit: 'Milliseconds' },
      { MetricName: 'FirstContentfulPaint', Value: metrics.userExperience.firstContentfulPaint, Unit: 'Milliseconds' },
      { MetricName: 'LargestContentfulPaint', Value: metrics.userExperience.largestContentfulPaint, Unit: 'Milliseconds' },
      { MetricName: 'BounceRate', Value: metrics.userExperience.bounceRate, Unit: 'Percent' }
    );

    // Business Metrics
    metricData.push(
      { MetricName: 'ActiveUsers', Value: metrics.businessHealth.activeUsers, Unit: 'Count' },
      { MetricName: 'ConversionRate', Value: metrics.businessHealth.conversionRate, Unit: 'Percent' },
      { MetricName: 'RevenuePerHour', Value: metrics.businessHealth.revenuePerHour, Unit: 'None' },
      { MetricName: 'CustomerSatisfaction', Value: metrics.businessHealth.customerSatisfaction, Unit: 'None' }
    );

    return metricData;
  }

  // ============================================================================
  // REPORTING AND ANALYTICS
  // ============================================================================

  public generatePerformanceReport(hoursBack: number = 24): PerformanceReport {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hoursBack * 60 * 60 * 1000));

    const relevantMetrics = this.metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );

    if (relevantMetrics.length === 0) {
      throw new Error('No metrics available for the specified time range');
    }

    const report: PerformanceReport = {
      timeRange: { start: startTime, end: endTime },
      summary: this.generateSummary(relevantMetrics),
      sections: {
        applicationHealth: this.analyzeApplicationHealth(relevantMetrics),
        videoDelivery: this.analyzeVideoDelivery(relevantMetrics),
        databaseHealth: this.analyzeDatabaseHealth(relevantMetrics),
        aiService: this.analyzeAIService(relevantMetrics),
        userExperience: this.analyzeUserExperience(relevantMetrics),
        businessHealth: this.analyzeBusinessHealth(relevantMetrics)
      },
      recommendations: this.generateRecommendations(relevantMetrics),
      trends: this.analyzeTrends(relevantMetrics)
    };

    return report;
  }

  private generateSummary(metrics: PerformanceMetrics[]) {
    const incidents = this.activeAlerts.length;
    const uptime = this.calculateAverageUptime(metrics);
    const performanceScore = this.calculateOverallPerformanceScore(metrics);

    return {
      overallHealth: this.getHealthStatus(performanceScore),
      uptime,
      totalIncidents: incidents,
      meanTimeToResolution: this.calculateMTTR(),
      performanceScore
    };
  }

  private analyzeApplicationHealth(metrics: PerformanceMetrics[]): PerformanceSection {
    const responseTimes = metrics.map(m => m.applicationHealth.responseTime);
    const errorRates = metrics.map(m => m.applicationHealth.errorRate);

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const avgErrorRate = errorRates.reduce((a, b) => a + b, 0) / errorRates.length;

    const score = this.calculateApplicationScore(avgResponseTime, avgErrorRate);

    return {
      status: this.getStatusFromScore(score),
      score,
      keyMetrics: [
        { name: 'Avg Response Time', value: avgResponseTime, unit: 'ms', status: avgResponseTime < 1000 ? 'good' : 'warning' },
        { name: 'Error Rate', value: avgErrorRate, unit: '%', status: avgErrorRate < 1 ? 'good' : 'critical' },
        { name: 'Max Response Time', value: Math.max(...responseTimes), unit: 'ms', status: 'info' }
      ],
      incidents: this.getIncidentCount('applicationHealth'),
      recommendations: this.getApplicationRecommendations(avgResponseTime, avgErrorRate)
    };
  }

  private analyzeVideoDelivery(metrics: PerformanceMetrics[]): PerformanceSection {
    const startTimes = metrics.map(m => m.videoDelivery.averageStartTime);
    const cacheHitRates = metrics.map(m => m.videoDelivery.cacheHitRate);

    const avgStartTime = startTimes.reduce((a, b) => a + b, 0) / startTimes.length;
    const avgCacheHitRate = cacheHitRates.reduce((a, b) => a + b, 0) / cacheHitRates.length;

    const score = this.calculateVideoScore(avgStartTime, avgCacheHitRate);

    return {
      status: this.getStatusFromScore(score),
      score,
      keyMetrics: [
        { name: 'Video Start Time', value: avgStartTime, unit: 'ms', status: avgStartTime < 2000 ? 'good' : 'warning' },
        { name: 'Cache Hit Rate', value: avgCacheHitRate * 100, unit: '%', status: avgCacheHitRate > 0.8 ? 'good' : 'warning' },
        { name: 'Max Start Time', value: Math.max(...startTimes), unit: 'ms', status: 'info' }
      ],
      incidents: this.getIncidentCount('videoDelivery'),
      recommendations: this.getVideoRecommendations(avgStartTime, avgCacheHitRate)
    };
  }

  private analyzeDatabaseHealth(metrics: PerformanceMetrics[]): PerformanceSection {
    const queryTimes = metrics.map(m => m.databaseHealth.queryResponseTime);
    const deadlocks = metrics.map(m => m.databaseHealth.deadlockCount);

    const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
    const totalDeadlocks = Math.max(...deadlocks);

    const score = this.calculateDatabaseScore(avgQueryTime, totalDeadlocks);

    return {
      status: this.getStatusFromScore(score),
      score,
      keyMetrics: [
        { name: 'Avg Query Time', value: avgQueryTime, unit: 'ms', status: avgQueryTime < 100 ? 'good' : 'warning' },
        { name: 'Deadlocks', value: totalDeadlocks, unit: 'count', status: totalDeadlocks === 0 ? 'good' : 'critical' },
        { name: 'Max Query Time', value: Math.max(...queryTimes), unit: 'ms', status: 'info' }
      ],
      incidents: this.getIncidentCount('databaseHealth'),
      recommendations: this.getDatabaseRecommendations(avgQueryTime, totalDeadlocks)
    };
  }

  private analyzeAIService(metrics: PerformanceMetrics[]): PerformanceSection {
    const responseTimes = metrics.map(m => m.aiService.responseTime);
    const successRates = metrics.map(m => m.aiService.successRate);

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const avgSuccessRate = successRates.reduce((a, b) => a + b, 0) / successRates.length;

    const score = this.calculateAIScore(avgResponseTime, avgSuccessRate);

    return {
      status: this.getStatusFromScore(score),
      score,
      keyMetrics: [
        { name: 'AI Response Time', value: avgResponseTime, unit: 'ms', status: avgResponseTime < 3000 ? 'good' : 'warning' },
        { name: 'Success Rate', value: avgSuccessRate, unit: '%', status: avgSuccessRate > 95 ? 'good' : 'warning' },
        { name: 'Circuit Breaker', value: 0, unit: 'state', status: 'good' }
      ],
      incidents: this.getIncidentCount('aiService'),
      recommendations: this.getAIRecommendations(avgResponseTime, avgSuccessRate)
    };
  }

  private analyzeUserExperience(metrics: PerformanceMetrics[]): PerformanceSection {
    const loadTimes = metrics.map(m => m.userExperience.pageLoadTime);
    const bounceRates = metrics.map(m => m.userExperience.bounceRate);

    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    const avgBounceRate = bounceRates.reduce((a, b) => a + b, 0) / bounceRates.length;

    const score = this.calculateUXScore(avgLoadTime, avgBounceRate);

    return {
      status: this.getStatusFromScore(score),
      score,
      keyMetrics: [
        { name: 'Page Load Time', value: avgLoadTime, unit: 'ms', status: avgLoadTime < 3000 ? 'good' : 'warning' },
        { name: 'Bounce Rate', value: avgBounceRate, unit: '%', status: avgBounceRate < 20 ? 'good' : 'warning' },
        { name: 'Max Load Time', value: Math.max(...loadTimes), unit: 'ms', status: 'info' }
      ],
      incidents: this.getIncidentCount('userExperience'),
      recommendations: this.getUXRecommendations(avgLoadTime, avgBounceRate)
    };
  }

  private analyzeBusinessHealth(metrics: PerformanceMetrics[]): PerformanceSection {
    const conversionRates = metrics.map(m => m.businessHealth.conversionRate);
    const activeUsers = metrics.map(m => m.businessHealth.activeUsers);

    const avgConversionRate = conversionRates.reduce((a, b) => a + b, 0) / conversionRates.length;
    const avgActiveUsers = activeUsers.reduce((a, b) => a + b, 0) / activeUsers.length;

    const score = this.calculateBusinessScore(avgConversionRate, avgActiveUsers);

    return {
      status: this.getStatusFromScore(score),
      score,
      keyMetrics: [
        { name: 'Conversion Rate', value: avgConversionRate, unit: '%', status: avgConversionRate > 2 ? 'good' : 'warning' },
        { name: 'Active Users', value: avgActiveUsers, unit: 'count', status: 'info' },
        { name: 'Peak Users', value: Math.max(...activeUsers), unit: 'count', status: 'info' }
      ],
      incidents: this.getIncidentCount('businessHealth'),
      recommendations: this.getBusinessRecommendations(avgConversionRate, avgActiveUsers)
    };
  }

  // ============================================================================
  // HELPER METHODS FOR METRIC COLLECTION
  // ============================================================================

  private async getAverageResponseTime(): Promise<number> {
    // Mock implementation - in production, collect from Lambda/API Gateway metrics
    return Math.random() * 500 + 200; // 200-700ms
  }

  private async getErrorRate(): Promise<number> {
    // Mock implementation - in production, collect from error tracking
    return Math.random() * 2; // 0-2% error rate
  }

  private async getThroughput(): Promise<number> {
    // Mock implementation - in production, collect from API Gateway
    return Math.random() * 100 + 50; // 50-150 requests/second
  }

  private async calculateUptime(): Promise<number> {
    // Mock implementation - in production, calculate from health checks
    return 99.9 - Math.random() * 0.5; // 99.4-99.9% uptime
  }

  private async getCPUUsage(): Promise<number> {
    // Mock implementation - in production, collect from CloudWatch
    return Math.random() * 50 + 20; // 20-70% CPU usage
  }

  private async getVideoStartTime(): Promise<number> {
    // Mock implementation - in production, collect from CDN logs
    return Math.random() * 1000 + 1000; // 1-2 seconds
  }

  private async getBufferHealth(): Promise<number> {
    // Mock implementation - in production, collect from video player analytics
    return 0.9 + Math.random() * 0.09; // 90-99% buffer health
  }

  private async getVideoCompletionRate(): Promise<number> {
    // Mock implementation - in production, collect from video analytics
    return 70 + Math.random() * 20; // 70-90% completion rate
  }

  private async getBandwidthUtilization(): Promise<number> {
    // Mock implementation - in production, collect from CloudFront
    return Math.random() * 500 + 100; // 100-600 Mbps
  }

  private async getCacheHitRate(): Promise<number> {
    // Mock implementation - in production, collect from CloudFront
    return 0.8 + Math.random() * 0.15; // 80-95% cache hit rate
  }

  private async getVideoErrorRate(): Promise<number> {
    // Mock implementation - in production, collect from video delivery logs
    return Math.random() * 1; // 0-1% error rate
  }

  private async getDatabaseResponseTime(): Promise<number> {
    // Mock implementation - in production, collect from PostgreSQL metrics
    return Math.random() * 50 + 10; // 10-60ms
  }

  private async getConnectionPoolUsage(): Promise<number> {
    // Mock implementation - in production, collect from Prisma/PgBouncer
    return Math.random() * 60 + 20; // 20-80% pool usage
  }

  private async getSlowQueryCount(): Promise<number> {
    // Mock implementation - in production, collect from PostgreSQL slow query log
    return Math.floor(Math.random() * 5); // 0-5 slow queries
  }

  private async getLockContentionRate(): Promise<number> {
    // Mock implementation - in production, collect from pg_stat_activity
    return Math.random() * 5; // 0-5% lock contention
  }

  private async getIndexEfficiency(): Promise<number> {
    // Mock implementation - in production, collect from pg_stat_user_indexes
    return 0.95 + Math.random() * 0.04; // 95-99% index efficiency
  }

  private async getDeadlockCount(): Promise<number> {
    // Mock implementation - in production, collect from PostgreSQL logs
    return Math.floor(Math.random() * 3); // 0-2 deadlocks
  }

  private async getAIResponseTime(): Promise<number> {
    // Mock implementation - in production, collect from AI service monitoring
    return Math.random() * 2000 + 1000; // 1-3 seconds
  }

  private async getAISuccessRate(): Promise<number> {
    // Mock implementation - in production, collect from circuit breaker metrics
    return 95 + Math.random() * 4; // 95-99% success rate
  }

  private async getAIFallbackRate(): Promise<number> {
    // Mock implementation - in production, collect from AI service
    return Math.random() * 10; // 0-10% fallback rate
  }

  private async getCircuitBreakerState(): Promise<'CLOSED' | 'OPEN' | 'HALF_OPEN'> {
    // Mock implementation - in production, get from circuit breaker
    const states: ('CLOSED' | 'OPEN' | 'HALF_OPEN')[] = ['CLOSED', 'CLOSED', 'CLOSED', 'HALF_OPEN', 'OPEN'];
    return states[Math.floor(Math.random() * states.length)];
  }

  private async getTokensUsed(): Promise<number> {
    // Mock implementation - in production, collect from OpenAI usage
    return Math.floor(Math.random() * 10000 + 5000); // 5K-15K tokens per hour
  }

  private async getAICostPerHour(): Promise<number> {
    // Mock implementation - in production, calculate from token usage
    return Math.random() * 5 + 1; // $1-6 per hour
  }

  private async getPageLoadTime(): Promise<number> {
    // Mock implementation - in production, collect from RUM/Core Web Vitals
    return Math.random() * 2000 + 1000; // 1-3 seconds
  }

  private async getFCP(): Promise<number> {
    // Mock implementation - in production, collect from Core Web Vitals
    return Math.random() * 1000 + 500; // 0.5-1.5 seconds
  }

  private async getLCP(): Promise<number> {
    // Mock implementation - in production, collect from Core Web Vitals
    return Math.random() * 1500 + 1000; // 1-2.5 seconds
  }

  private async getCLS(): Promise<number> {
    // Mock implementation - in production, collect from Core Web Vitals
    return Math.random() * 0.1; // 0-0.1 CLS score
  }

  private async getFID(): Promise<number> {
    // Mock implementation - in production, collect from Core Web Vitals
    return Math.random() * 100 + 50; // 50-150ms
  }

  private async getBounceRate(): Promise<number> {
    // Mock implementation - in production, collect from analytics
    return Math.random() * 20 + 5; // 5-25% bounce rate
  }

  private async getActiveUsers(): Promise<number> {
    // Mock implementation - in production, collect from analytics
    return Math.floor(Math.random() * 500 + 100); // 100-600 active users
  }

  private async getConversionRate(): Promise<number> {
    // Mock implementation - in production, collect from e-commerce analytics
    return Math.random() * 3 + 1; // 1-4% conversion rate
  }

  private async getSessionDuration(): Promise<number> {
    // Mock implementation - in production, collect from analytics
    return Math.random() * 300 + 180; // 3-8 minutes
  }

  private async getRevenueRate(): Promise<number> {
    // Mock implementation - in production, collect from e-commerce platform
    return Math.random() * 100 + 20; // $20-120 per hour
  }

  private async getCSAT(): Promise<number> {
    // Mock implementation - in production, collect from support system
    return 4.0 + Math.random() * 1; // 4.0-5.0 CSAT score
  }

  private async getSupportTicketRate(): Promise<number> {
    // Mock implementation - in production, collect from support system
    return Math.random() * 3; // 0-3 tickets per hour
  }

  // ============================================================================
  // SCORE CALCULATION METHODS
  // ============================================================================

  private calculateOverallPerformanceScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;

    const latest = metrics[metrics.length - 1];

    // Weight different aspects of performance
    const applicationScore = this.calculateApplicationScore(
      latest.applicationHealth.responseTime,
      latest.applicationHealth.errorRate
    );
    const videoScore = this.calculateVideoScore(
      latest.videoDelivery.averageStartTime,
      latest.videoDelivery.cacheHitRate
    );
    const databaseScore = this.calculateDatabaseScore(
      latest.databaseHealth.queryResponseTime,
      latest.databaseHealth.deadlockCount
    );
    const aiScore = this.calculateAIScore(
      latest.aiService.responseTime,
      latest.aiService.successRate
    );
    const uxScore = this.calculateUXScore(
      latest.userExperience.pageLoadTime,
      latest.userExperience.bounceRate
    );

    // Weighted average (application and video delivery are most critical)
    return Math.round(
      (applicationScore * 0.25) +
      (videoScore * 0.25) +
      (databaseScore * 0.2) +
      (aiScore * 0.15) +
      (uxScore * 0.15)
    );
  }

  private calculateApplicationScore(responseTime: number, errorRate: number): number {
    let score = 100;

    // Response time penalties
    if (responseTime > 5000) score -= 40;
    else if (responseTime > 2000) score -= 20;
    else if (responseTime > 1000) score -= 10;

    // Error rate penalties
    if (errorRate > 5) score -= 40;
    else if (errorRate > 2) score -= 20;
    else if (errorRate > 1) score -= 10;

    return Math.max(0, score);
  }

  private calculateVideoScore(startTime: number, cacheHitRate: number): number {
    let score = 100;

    // Video start time penalties
    if (startTime > 5000) score -= 40;
    else if (startTime > 3000) score -= 25;
    else if (startTime > 2000) score -= 15;

    // Cache hit rate penalties
    if (cacheHitRate < 0.6) score -= 30;
    else if (cacheHitRate < 0.8) score -= 15;
    else if (cacheHitRate < 0.9) score -= 5;

    return Math.max(0, score);
  }

  private calculateDatabaseScore(queryTime: number, deadlocks: number): number {
    let score = 100;

    // Query time penalties
    if (queryTime > 1000) score -= 40;
    else if (queryTime > 500) score -= 20;
    else if (queryTime > 100) score -= 10;

    // Deadlock penalties
    score -= deadlocks * 10; // 10 points per deadlock

    return Math.max(0, score);
  }

  private calculateAIScore(responseTime: number, successRate: number): number {
    let score = 100;

    // Response time penalties
    if (responseTime > 10000) score -= 40;
    else if (responseTime > 5000) score -= 20;
    else if (responseTime > 3000) score -= 10;

    // Success rate penalties
    if (successRate < 90) score -= 40;
    else if (successRate < 95) score -= 20;
    else if (successRate < 98) score -= 10;

    return Math.max(0, score);
  }

  private calculateUXScore(loadTime: number, bounceRate: number): number {
    let score = 100;

    // Load time penalties
    if (loadTime > 5000) score -= 40;
    else if (loadTime > 3000) score -= 20;
    else if (loadTime > 2000) score -= 10;

    // Bounce rate penalties
    if (bounceRate > 40) score -= 30;
    else if (bounceRate > 25) score -= 15;
    else if (bounceRate > 15) score -= 5;

    return Math.max(0, score);
  }

  private calculateBusinessScore(conversionRate: number, activeUsers: number): number {
    let score = 100;

    // Conversion rate (relative to target)
    if (conversionRate < 1) score -= 30;
    else if (conversionRate < 2) score -= 15;
    else if (conversionRate < 3) score -= 5;

    // Active users (relative scoring based on growth)
    if (activeUsers < 50) score -= 20;
    else if (activeUsers < 100) score -= 10;

    return Math.max(0, score);
  }

  private calculateAverageUptime(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;

    const uptimes = metrics.map(m => m.applicationHealth.uptime);
    return uptimes.reduce((a, b) => a + b, 0) / uptimes.length;
  }

  private calculateMTTR(): number {
    // Mock implementation - in production, calculate from incident history
    return Math.random() * 60 + 15; // 15-75 minutes
  }

  private getHealthStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  private getStatusFromScore(score: number): 'healthy' | 'warning' | 'critical' {
    if (score >= 75) return 'healthy';
    if (score >= 50) return 'warning';
    return 'critical';
  }

  private getIncidentCount(category: string): number {
    return this.activeAlerts.filter(alert => alert.metric.startsWith(category)).length;
  }

  // ============================================================================
  // RECOMMENDATION ENGINES
  // ============================================================================

  private generateRecommendations(metrics: PerformanceMetrics[]): string[] {
    if (metrics.length === 0) return [];

    const latest = metrics[metrics.length - 1];
    const recommendations: string[] = [];

    // Application recommendations
    if (latest.applicationHealth.responseTime > 2000) {
      recommendations.push('🚀 Optimize application response time by implementing caching strategies');
    }
    if (latest.applicationHealth.errorRate > 2) {
      recommendations.push('🔧 Investigate and fix high error rate issues');
    }

    // Video delivery recommendations
    if (latest.videoDelivery.averageStartTime > 3000) {
      recommendations.push('📹 Optimize video delivery by improving CDN configuration');
    }
    if (latest.videoDelivery.cacheHitRate < 0.8) {
      recommendations.push('💾 Improve cache hit rate by adjusting TTL settings');
    }

    // Database recommendations
    if (latest.databaseHealth.queryResponseTime > 500) {
      recommendations.push('🗄️ Optimize database performance with better indexing');
    }
    if (latest.databaseHealth.deadlockCount > 0) {
      recommendations.push('⚠️ Review and optimize database transaction patterns to reduce deadlocks');
    }

    // AI service recommendations
    if (latest.aiService.fallbackRate > 20) {
      recommendations.push('🤖 Improve AI service reliability to reduce fallback usage');
    }

    // User experience recommendations
    if (latest.userExperience.bounceRate > 25) {
      recommendations.push('👥 Improve user engagement to reduce bounce rate');
    }

    return recommendations;
  }

  private getApplicationRecommendations(responseTime: number, errorRate: number): string[] {
    const recommendations: string[] = [];

    if (responseTime > 2000) {
      recommendations.push('Implement response caching');
      recommendations.push('Optimize database queries');
      recommendations.push('Consider Lambda cold start optimizations');
    }

    if (errorRate > 1) {
      recommendations.push('Review error logs for common issues');
      recommendations.push('Implement better error handling');
      recommendations.push('Add health checks and monitoring');
    }

    return recommendations;
  }

  private getVideoRecommendations(startTime: number, cacheHitRate: number): string[] {
    const recommendations: string[] = [];

    if (startTime > 2000) {
      recommendations.push('Optimize video encoding settings');
      recommendations.push('Implement adaptive bitrate streaming');
      recommendations.push('Review CDN edge configuration');
    }

    if (cacheHitRate < 0.8) {
      recommendations.push('Increase cache TTL for video content');
      recommendations.push('Review cache invalidation patterns');
      recommendations.push('Consider Origin Shield implementation');
    }

    return recommendations;
  }

  private getDatabaseRecommendations(queryTime: number, deadlocks: number): string[] {
    const recommendations: string[] = [];

    if (queryTime > 100) {
      recommendations.push('Review and optimize slow queries');
      recommendations.push('Implement query result caching');
      recommendations.push('Consider read replicas for read-heavy workloads');
    }

    if (deadlocks > 0) {
      recommendations.push('Review transaction ordering');
      recommendations.push('Implement retry logic with exponential backoff');
      recommendations.push('Consider optimistic locking where appropriate');
    }

    return recommendations;
  }

  private getAIRecommendations(responseTime: number, successRate: number): string[] {
    const recommendations: string[] = [];

    if (responseTime > 3000) {
      recommendations.push('Implement response caching for common queries');
      recommendations.push('Consider streaming responses for better UX');
      recommendations.push('Optimize prompt templates for faster processing');
    }

    if (successRate < 95) {
      recommendations.push('Review and improve error handling');
      recommendations.push('Implement circuit breaker pattern');
      recommendations.push('Add comprehensive fallback strategies');
    }

    return recommendations;
  }

  private getUXRecommendations(loadTime: number, bounceRate: number): string[] {
    const recommendations: string[] = [];

    if (loadTime > 3000) {
      recommendations.push('Implement progressive loading strategies');
      recommendations.push('Optimize image delivery and compression');
      recommendations.push('Review and minimize JavaScript bundle size');
    }

    if (bounceRate > 20) {
      recommendations.push('Improve page content relevance');
      recommendations.push('Optimize page loading performance');
      recommendations.push('Review user onboarding flow');
    }

    return recommendations;
  }

  private getBusinessRecommendations(conversionRate: number, activeUsers: number): string[] {
    const recommendations: string[] = [];

    if (conversionRate < 2) {
      recommendations.push('Optimize conversion funnel');
      recommendations.push('Review pricing and value proposition');
      recommendations.push('Implement A/B testing for key pages');
    }

    if (activeUsers < 100) {
      recommendations.push('Implement user retention strategies');
      recommendations.push('Improve content marketing');
      recommendations.push('Enhance user engagement features');
    }

    return recommendations;
  }

  private analyzeTrends(metrics: PerformanceMetrics[]) {
    if (metrics.length < 2) return [];

    const trends = [];
    const first = metrics[0];
    const last = metrics[metrics.length - 1];

    // Application health trend
    const responseTimeChange = ((last.applicationHealth.responseTime - first.applicationHealth.responseTime) / first.applicationHealth.responseTime) * 100;
    trends.push({
      metric: 'Application Response Time',
      trend: responseTimeChange > 10 ? 'degrading' : responseTimeChange < -10 ? 'improving' : 'stable',
      changePercentage: Math.round(responseTimeChange)
    });

    // Video delivery trend
    const videoStartTimeChange = ((last.videoDelivery.averageStartTime - first.videoDelivery.averageStartTime) / first.videoDelivery.averageStartTime) * 100;
    trends.push({
      metric: 'Video Start Time',
      trend: videoStartTimeChange > 10 ? 'degrading' : videoStartTimeChange < -10 ? 'improving' : 'stable',
      changePercentage: Math.round(videoStartTimeChange)
    });

    // Conversion rate trend
    const conversionChange = ((last.businessHealth.conversionRate - first.businessHealth.conversionRate) / first.businessHealth.conversionRate) * 100;
    trends.push({
      metric: 'Conversion Rate',
      trend: conversionChange > 5 ? 'improving' : conversionChange < -5 ? 'degrading' : 'stable',
      changePercentage: Math.round(conversionChange)
    });

    return trends;
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  public getCurrentMetrics(): PerformanceMetrics | undefined {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : undefined;
  }

  public getActiveAlerts(): PerformanceAlert[] {
    return this.activeAlerts.filter(alert => alert.status === 'active');
  }

  public getMetricsHistory(hoursBack: number = 1): PerformanceMetrics[] {
    const cutoff = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  public addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  public removeAlertRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (index >= 0) {
      this.alertRules.splice(index, 1);
      return true;
    }
    return false;
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      return true;
    }
    return false;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  public getHealthSummary(): { status: string; score: number; alerts: number } {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) {
      return { status: 'unknown', score: 0, alerts: 0 };
    }

    const score = this.calculateOverallPerformanceScore([currentMetrics]);
    const activeAlertsCount = this.getActiveAlerts().length;

    return {
      status: this.getHealthStatus(score),
      score,
      alerts: activeAlertsCount
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PerformanceMonitor;