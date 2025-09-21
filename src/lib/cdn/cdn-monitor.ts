/**
 * CDN Performance Monitoring System
 *
 * Real-time monitoring and alerting for video delivery performance
 * Tracks key metrics and triggers alerts for performance degradation
 */

export interface CDNMetrics {
  timestamp: number;
  videoDelivery: VideoDeliveryMetrics;
  cachePerformance: CacheMetrics;
  errorTracking: ErrorMetrics;
  costTracking: CostMetrics;
  userExperience: UserExperienceMetrics;
}

export interface VideoDeliveryMetrics {
  averageStartTime: number;        // ms
  p95StartTime: number;            // ms
  p99StartTime: number;            // ms
  throughputMbps: number;
  concurrentStreams: number;
  bandwidthUtilization: number;    // percentage
  qualityDistribution: Record<string, number>; // percentage per quality
}

export interface CacheMetrics {
  hitRate: number;                 // percentage
  missRate: number;                // percentage
  edgeHitRate: number;            // percentage
  originRequestRate: number;       // requests per second
  averageOriginLatency: number;    // ms
  topMissedContent: string[];      // URLs with highest miss rate
}

export interface ErrorMetrics {
  totalErrorRate: number;          // percentage
  errorsByType: Record<string, number>; // 4xx, 5xx counts
  timeoutRate: number;             // percentage
  connectionFailures: number;
  topErrorURLs: string[];          // URLs with most errors
}

export interface CostMetrics {
  currentMonthSpend: number;       // USD
  dailySpend: number;              // USD
  bandwidthCostPerGB: number;      // USD
  requestCostPer10K: number;       // USD
  projectedMonthlySpend: number;   // USD
  costPerUser: number;             // USD
}

export interface UserExperienceMetrics {
  averageBufferHealth: number;     // 0-1 score
  rebufferEvents: number;
  qualityUpgrades: number;
  qualityDowngrades: number;
  abandonmentRate: number;         // percentage
  completionRate: number;          // percentage
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  duration: number;               // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: AlertChannel[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  endpoint: string;
  config?: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: number;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: string;
  message: string;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * CDN Performance Monitor
 */
export class CDNMonitor {
  private metrics: CDNMetrics[] = [];
  private alertRules: AlertRule[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupDefaultAlertRules();
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    console.log('🔍 Starting CDN performance monitoring...');

    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.evaluateAlerts();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    console.log('⏹️ CDN monitoring stopped');
  }

  /**
   * Collect comprehensive CDN metrics
   */
  private async collectMetrics(): Promise<CDNMetrics> {
    const timestamp = Date.now();

    const metrics: CDNMetrics = {
      timestamp,
      videoDelivery: await this.collectVideoDeliveryMetrics(),
      cachePerformance: await this.collectCacheMetrics(),
      errorTracking: await this.collectErrorMetrics(),
      costTracking: await this.collectCostMetrics(),
      userExperience: await this.collectUserExperienceMetrics()
    };

    // Store metrics (keep last 1000 data points)
    this.metrics.push(metrics);
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }

    return metrics;
  }

  /**
   * Collect video delivery performance metrics
   */
  private async collectVideoDeliveryMetrics(): Promise<VideoDeliveryMetrics> {
    // In real implementation, this would query CloudWatch, access logs, or RUM data
    // For now, simulate with realistic data patterns

    const basePerformance = {
      averageStartTime: this.generateRealisticLatency(1500, 500),
      p95StartTime: this.generateRealisticLatency(3000, 800),
      p99StartTime: this.generateRealisticLatency(5000, 1200),
      throughputMbps: this.generateRealisticThroughput(),
      concurrentStreams: this.generateConcurrentStreams(),
      bandwidthUtilization: Math.random() * 100,
      qualityDistribution: {
        '4K': 25 + Math.random() * 10,
        '1080p': 40 + Math.random() * 10,
        '720p': 25 + Math.random() * 10,
        '480p': 10 + Math.random() * 5
      }
    };

    return basePerformance;
  }

  /**
   * Collect cache performance metrics
   */
  private async collectCacheMetrics(): Promise<CacheMetrics> {
    return {
      hitRate: 75 + Math.random() * 20,        // 75-95% hit rate
      missRate: 5 + Math.random() * 20,        // 5-25% miss rate
      edgeHitRate: 85 + Math.random() * 10,    // 85-95% edge hits
      originRequestRate: Math.random() * 50,   // 0-50 RPS to origin
      averageOriginLatency: 200 + Math.random() * 300, // 200-500ms
      topMissedContent: [
        '/videos/new-content-4k.mp4',
        '/videos/viral-demo-1080p.mp4',
        '/thumbnails/latest-thumb.jpg'
      ]
    };
  }

  /**
   * Collect error tracking metrics
   */
  private async collectErrorMetrics(): Promise<ErrorMetrics> {
    const errorRate = Math.random() * 0.05; // 0-5% error rate

    return {
      totalErrorRate: errorRate * 100,
      errorsByType: {
        '4xx': Math.floor(Math.random() * 10),
        '5xx': Math.floor(Math.random() * 5),
        'timeout': Math.floor(Math.random() * 3),
        'connection': Math.floor(Math.random() * 2)
      },
      timeoutRate: Math.random() * 0.02 * 100, // 0-2% timeout rate
      connectionFailures: Math.floor(Math.random() * 5),
      topErrorURLs: [
        '/videos/problematic-video.mp4',
        '/api/metadata/failing-endpoint'
      ]
    };
  }

  /**
   * Collect cost tracking metrics
   */
  private async collectCostMetrics(): Promise<CostMetrics> {
    const dailySpend = 50 + Math.random() * 200; // $50-250/day
    const currentMonthSpend = dailySpend * (new Date().getDate());

    return {
      currentMonthSpend,
      dailySpend,
      bandwidthCostPerGB: 0.085 + Math.random() * 0.02, // $0.085-0.105/GB
      requestCostPer10K: 0.0075 + Math.random() * 0.002, // ~$0.0075-0.0095/10K
      projectedMonthlySpend: dailySpend * 30,
      costPerUser: dailySpend / (100 + Math.random() * 500) // Depends on active users
    };
  }

  /**
   * Collect user experience metrics
   */
  private async collectUserExperienceMetrics(): Promise<UserExperienceMetrics> {
    return {
      averageBufferHealth: 0.85 + Math.random() * 0.1, // 85-95% buffer health
      rebufferEvents: Math.floor(Math.random() * 20),
      qualityUpgrades: Math.floor(Math.random() * 50),
      qualityDowngrades: Math.floor(Math.random() * 30),
      abandonmentRate: Math.random() * 0.15 * 100, // 0-15% abandonment
      completionRate: 70 + Math.random() * 25 // 70-95% completion
    };
  }

  /**
   * Generate realistic latency with time-of-day variations
   */
  private generateRealisticLatency(base: number, variance: number): number {
    const hour = new Date().getHours();

    // Higher latency during peak hours (evening US time)
    let peakMultiplier = 1;
    if (hour >= 19 && hour <= 23) {
      peakMultiplier = 1.3; // 30% higher during peak
    } else if (hour >= 7 && hour <= 9) {
      peakMultiplier = 1.1; // 10% higher during morning
    }

    return base * peakMultiplier + (Math.random() - 0.5) * variance;
  }

  /**
   * Generate realistic throughput
   */
  private generateRealisticThroughput(): number {
    const hour = new Date().getHours();
    let baseThroughput = 500; // Base 500 Mbps

    // Peak traffic variations
    if (hour >= 19 && hour <= 23) {
      baseThroughput = 1200; // Peak evening traffic
    } else if (hour >= 2 && hour <= 6) {
      baseThroughput = 200;  // Low overnight traffic
    }

    return baseThroughput + (Math.random() - 0.5) * 200;
  }

  /**
   * Generate realistic concurrent streams
   */
  private generateConcurrentStreams(): number {
    const hour = new Date().getHours();
    let baseStreams = 150;

    if (hour >= 19 && hour <= 23) {
      baseStreams = 800; // Peak evening
    } else if (hour >= 2 && hour <= 6) {
      baseStreams = 50;  // Overnight low
    }

    return Math.floor(baseStreams + (Math.random() - 0.5) * 100);
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'video-start-time-high',
        name: 'High Video Start Time',
        metric: 'videoDelivery.averageStartTime',
        condition: 'greater_than',
        threshold: 2000, // 2 seconds
        duration: 180,   // 3 minutes
        severity: 'high',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '' },
          { type: 'email', endpoint: 'alerts@cooling-education.com' }
        ]
      },
      {
        id: 'error-rate-critical',
        name: 'Critical Error Rate',
        metric: 'errorTracking.totalErrorRate',
        condition: 'greater_than',
        threshold: 5, // 5%
        duration: 60, // 1 minute
        severity: 'critical',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '' },
          { type: 'email', endpoint: 'critical@cooling-education.com' },
          { type: 'sms', endpoint: '+1234567890' }
        ]
      },
      {
        id: 'cache-hit-rate-low',
        name: 'Low Cache Hit Rate',
        metric: 'cachePerformance.hitRate',
        condition: 'less_than',
        threshold: 70, // 70%
        duration: 300, // 5 minutes
        severity: 'medium',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '' }
        ]
      },
      {
        id: 'cost-spike',
        name: 'Daily Cost Spike',
        metric: 'costTracking.dailySpend',
        condition: 'greater_than',
        threshold: 500, // $500/day
        duration: 3600, // 1 hour
        severity: 'high',
        enabled: true,
        channels: [
          { type: 'email', endpoint: 'finance@cooling-education.com' },
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '' }
        ]
      },
      {
        id: 'user-abandonment-high',
        name: 'High User Abandonment',
        metric: 'userExperience.abandonmentRate',
        condition: 'greater_than',
        threshold: 20, // 20%
        duration: 600, // 10 minutes
        severity: 'medium',
        enabled: true,
        channels: [
          { type: 'slack', endpoint: process.env.SLACK_WEBHOOK_URL || '' }
        ]
      }
    ];
  }

  /**
   * Evaluate alert rules against current metrics
   */
  private async evaluateAlerts(): Promise<void> {
    if (this.metrics.length === 0) return;

    const latestMetrics = this.metrics[this.metrics.length - 1];

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const currentValue = this.getMetricValue(latestMetrics, rule.metric);
      const shouldAlert = this.evaluateCondition(currentValue, rule.condition, rule.threshold);

      if (shouldAlert && !this.activeAlerts.has(rule.id)) {
        // New alert
        const alert: Alert = {
          id: `${rule.id}-${Date.now()}`,
          ruleId: rule.id,
          timestamp: Date.now(),
          metric: rule.metric,
          currentValue,
          threshold: rule.threshold,
          severity: rule.severity,
          message: this.generateAlertMessage(rule, currentValue),
          resolved: false
        };

        this.activeAlerts.set(rule.id, alert);
        await this.sendAlert(alert, rule.channels);

      } else if (!shouldAlert && this.activeAlerts.has(rule.id)) {
        // Resolve alert
        const alert = this.activeAlerts.get(rule.id)!;
        alert.resolved = true;
        alert.resolvedAt = Date.now();

        await this.sendResolutionNotification(alert, rule.channels);
        this.activeAlerts.delete(rule.id);
      }
    }
  }

  /**
   * Get metric value by dot notation path
   */
  private getMetricValue(metrics: CDNMetrics, path: string): number {
    const parts = path.split('.');
    let value: any = metrics;

    for (const part of parts) {
      value = value?.[part];
    }

    return typeof value === 'number' ? value : 0;
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'greater_than': return value > threshold;
      case 'less_than': return value < threshold;
      case 'equals': return value === threshold;
      default: return false;
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    return `🚨 ${rule.name}: ${rule.metric} is ${currentValue.toFixed(2)} (threshold: ${rule.threshold})`;
  }

  /**
   * Send alert notification
   */
  private async sendAlert(alert: Alert, channels: AlertChannel[]): Promise<void> {
    console.log(`🚨 ALERT: ${alert.message}`);

    for (const channel of channels) {
      try {
        await this.sendToChannel(alert.message, channel);
      } catch (error) {
        console.error(`Failed to send alert to ${channel.type}:`, error);
      }
    }
  }

  /**
   * Send resolution notification
   */
  private async sendResolutionNotification(alert: Alert, channels: AlertChannel[]): Promise<void> {
    const message = `✅ RESOLVED: ${alert.message} (resolved after ${Math.round((alert.resolvedAt! - alert.timestamp) / 1000)}s)`;
    console.log(message);

    for (const channel of channels) {
      try {
        await this.sendToChannel(message, channel);
      } catch (error) {
        console.error(`Failed to send resolution to ${channel.type}:`, error);
      }
    }
  }

  /**
   * Send message to specific channel
   */
  private async sendToChannel(message: string, channel: AlertChannel): Promise<void> {
    switch (channel.type) {
      case 'slack':
        if (channel.endpoint) {
          await fetch(channel.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message })
          });
        }
        break;

      case 'email':
        // In real implementation, integrate with email service (SES, SendGrid, etc.)
        console.log(`📧 Email to ${channel.endpoint}: ${message}`);
        break;

      case 'sms':
        // In real implementation, integrate with SMS service (Twilio, SNS, etc.)
        console.log(`📱 SMS to ${channel.endpoint}: ${message}`);
        break;

      case 'webhook':
        if (channel.endpoint) {
          await fetch(channel.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alert: message, timestamp: Date.now() })
          });
        }
        break;
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): CDNMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(hours: number = 24): CDNMetrics[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
      return true;
    }
    return false;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(hours: number = 24): string {
    const metrics = this.getHistoricalMetrics(hours);
    if (metrics.length === 0) return 'No metrics available';

    const latest = metrics[metrics.length - 1];
    const avgStartTime = metrics.reduce((sum, m) => sum + m.videoDelivery.averageStartTime, 0) / metrics.length;
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorTracking.totalErrorRate, 0) / metrics.length;
    const avgCacheHitRate = metrics.reduce((sum, m) => sum + m.cachePerformance.hitRate, 0) / metrics.length;

    return `
📊 CDN Performance Report (Last ${hours} hours)

🎥 Video Delivery:
   Current Avg Start Time: ${latest.videoDelivery.averageStartTime.toFixed(0)}ms
   ${hours}h Avg Start Time: ${avgStartTime.toFixed(0)}ms
   Current Throughput: ${latest.videoDelivery.throughputMbps.toFixed(0)} Mbps
   Concurrent Streams: ${latest.videoDelivery.concurrentStreams}

💾 Cache Performance:
   Current Hit Rate: ${latest.cachePerformance.hitRate.toFixed(1)}%
   ${hours}h Avg Hit Rate: ${avgCacheHitRate.toFixed(1)}%
   Origin Request Rate: ${latest.cachePerformance.originRequestRate.toFixed(1)} RPS

⚠️ Error Tracking:
   Current Error Rate: ${latest.errorTracking.totalErrorRate.toFixed(2)}%
   ${hours}h Avg Error Rate: ${avgErrorRate.toFixed(2)}%
   Active Alerts: ${this.activeAlerts.size}

💰 Cost Tracking:
   Current Daily Spend: $${latest.costTracking.dailySpend.toFixed(2)}
   Projected Monthly: $${latest.costTracking.projectedMonthlySpend.toFixed(2)}
   Cost Per User: $${latest.costTracking.costPerUser.toFixed(4)}

👥 User Experience:
   Buffer Health: ${(latest.userExperience.averageBufferHealth * 100).toFixed(1)}%
   Completion Rate: ${latest.userExperience.completionRate.toFixed(1)}%
   Abandonment Rate: ${latest.userExperience.abandonmentRate.toFixed(1)}%
`;
  }
}