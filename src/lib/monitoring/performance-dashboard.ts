// Performance Dashboard Component
// Two-Phase Cooling Education Center
//
// React component for real-time performance monitoring dashboard
// Integrates with PerformanceMonitor for comprehensive system visibility

import React, { useState, useEffect } from 'react';
import { PerformanceMonitor, PerformanceMetrics, PerformanceAlert, PerformanceReport } from './performance-monitor';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface DashboardProps {
  monitor: PerformanceMonitor;
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  target?: number;
}

interface AlertSummaryProps {
  alerts: PerformanceAlert[];
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

interface ChartData {
  timestamp: string;
  value: number;
}

// ============================================================================
// PERFORMANCE DASHBOARD COMPONENT
// ============================================================================

export const PerformanceDashboard: React.FC<DashboardProps> = ({
  monitor,
  refreshInterval = 30000, // 30 seconds
  autoRefresh = true
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<PerformanceAlert[]>([]);
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<number>(1); // hours
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ============================================================================
  // DATA FETCHING AND UPDATES
  // ============================================================================

  const refreshData = async () => {
    try {
      const metrics = monitor.getCurrentMetrics();
      const alerts = monitor.getActiveAlerts();
      const health = monitor.getHealthSummary();
      const history = monitor.getMetricsHistory(selectedTimeRange);

      setCurrentMetrics(metrics || null);
      setActiveAlerts(alerts);
      setHealthSummary(health);
      setMetricsHistory(history);
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial data load
    refreshData();

    // Set up auto-refresh
    let interval: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      interval = setInterval(refreshData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [monitor, refreshInterval, autoRefresh, selectedTimeRange]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleAcknowledgeAlert = (alertId: string) => {
    monitor.acknowledgeAlert(alertId);
    refreshData();
  };

  const handleResolveAlert = (alertId: string) => {
    monitor.resolveAlert(alertId);
    refreshData();
  };

  const handleTimeRangeChange = (hours: number) => {
    setSelectedTimeRange(hours);
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    refreshData();
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good':
      case 'healthy':
      case 'excellent': return '#10B981'; // green
      case 'warning':
      case 'fair': return '#F59E0B'; // yellow
      case 'critical':
      case 'poor': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'good':
      case 'healthy':
      case 'excellent': return '✅';
      case 'warning':
      case 'fair': return '⚠️';
      case 'critical':
      case 'poor': return '🚨';
      default: return '❓';
    }
  };

  const formatValue = (value: number, unit: string): string => {
    switch (unit) {
      case 'ms':
        return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
      case '%':
        return `${value.toFixed(1)}%`;
      case 'count':
        return Math.round(value).toString();
      case 'Mbps':
        return `${value.toFixed(1)} Mbps`;
      default:
        return value.toFixed(1);
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading && !currentMetrics) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">⏳</div>
        <p>Loading performance dashboard...</p>
      </div>
    );
  }

  // ============================================================================
  // MAIN DASHBOARD RENDER
  // ============================================================================

  return (
    <div className="performance-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Performance Dashboard</h1>
          <div className="header-info">
            {healthSummary && (
              <div className="health-indicator">
                <span className="health-icon">
                  {getStatusIcon(healthSummary.status)}
                </span>
                <span className="health-text">
                  System {healthSummary.status} ({healthSummary.score}/100)
                </span>
              </div>
            )}
            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-controls">
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(Number(e.target.value))}
            >
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={168}>Last Week</option>
            </select>
          </div>
          <button
            className="refresh-button"
            onClick={handleManualRefresh}
            disabled={isLoading}
          >
            {isLoading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Alert Summary */}
      {activeAlerts.length > 0 && (
        <AlertSummary
          alerts={activeAlerts}
          onAcknowledge={handleAcknowledgeAlert}
          onResolve={handleResolveAlert}
        />
      )}

      {/* Main Metrics Grid */}
      {currentMetrics && (
        <div className="metrics-grid">
          {/* Application Health Section */}
          <div className="metrics-section">
            <h2>Application Health</h2>
            <div className="metric-cards">
              <MetricCard
                title="Response Time"
                value={currentMetrics.applicationHealth.responseTime}
                unit="ms"
                status={currentMetrics.applicationHealth.responseTime < 1000 ? 'good' :
                       currentMetrics.applicationHealth.responseTime < 2000 ? 'warning' : 'critical'}
                target={1000}
              />
              <MetricCard
                title="Error Rate"
                value={currentMetrics.applicationHealth.errorRate}
                unit="%"
                status={currentMetrics.applicationHealth.errorRate < 1 ? 'good' :
                       currentMetrics.applicationHealth.errorRate < 5 ? 'warning' : 'critical'}
                target={1}
              />
              <MetricCard
                title="Throughput"
                value={currentMetrics.applicationHealth.throughput}
                unit="req/s"
                status="good"
              />
              <MetricCard
                title="Uptime"
                value={currentMetrics.applicationHealth.uptime}
                unit="%"
                status={currentMetrics.applicationHealth.uptime > 99.5 ? 'good' :
                       currentMetrics.applicationHealth.uptime > 99 ? 'warning' : 'critical'}
                target={99.9}
              />
            </div>
          </div>

          {/* Video Delivery Section */}
          <div className="metrics-section">
            <h2>Video Delivery</h2>
            <div className="metric-cards">
              <MetricCard
                title="Video Start Time"
                value={currentMetrics.videoDelivery.averageStartTime}
                unit="ms"
                status={currentMetrics.videoDelivery.averageStartTime < 2000 ? 'good' :
                       currentMetrics.videoDelivery.averageStartTime < 5000 ? 'warning' : 'critical'}
                target={2000}
              />
              <MetricCard
                title="Buffer Health"
                value={currentMetrics.videoDelivery.bufferHealthRatio * 100}
                unit="%"
                status={currentMetrics.videoDelivery.bufferHealthRatio > 0.95 ? 'good' :
                       currentMetrics.videoDelivery.bufferHealthRatio > 0.9 ? 'warning' : 'critical'}
                target={95}
              />
              <MetricCard
                title="Cache Hit Rate"
                value={currentMetrics.videoDelivery.cacheHitRate * 100}
                unit="%"
                status={currentMetrics.videoDelivery.cacheHitRate > 0.8 ? 'good' :
                       currentMetrics.videoDelivery.cacheHitRate > 0.7 ? 'warning' : 'critical'}
                target={80}
              />
              <MetricCard
                title="Completion Rate"
                value={currentMetrics.videoDelivery.completionRate}
                unit="%"
                status={currentMetrics.videoDelivery.completionRate > 80 ? 'good' :
                       currentMetrics.videoDelivery.completionRate > 70 ? 'warning' : 'critical'}
              />
            </div>
          </div>

          {/* Database Health Section */}
          <div className="metrics-section">
            <h2>Database Health</h2>
            <div className="metric-cards">
              <MetricCard
                title="Query Time"
                value={currentMetrics.databaseHealth.queryResponseTime}
                unit="ms"
                status={currentMetrics.databaseHealth.queryResponseTime < 100 ? 'good' :
                       currentMetrics.databaseHealth.queryResponseTime < 500 ? 'warning' : 'critical'}
                target={100}
              />
              <MetricCard
                title="Pool Usage"
                value={currentMetrics.databaseHealth.connectionPoolUsage}
                unit="%"
                status={currentMetrics.databaseHealth.connectionPoolUsage < 70 ? 'good' :
                       currentMetrics.databaseHealth.connectionPoolUsage < 90 ? 'warning' : 'critical'}
              />
              <MetricCard
                title="Slow Queries"
                value={currentMetrics.databaseHealth.slowQueryCount}
                unit="count"
                status={currentMetrics.databaseHealth.slowQueryCount === 0 ? 'good' :
                       currentMetrics.databaseHealth.slowQueryCount < 5 ? 'warning' : 'critical'}
                target={0}
              />
              <MetricCard
                title="Index Efficiency"
                value={currentMetrics.databaseHealth.indexEfficiency * 100}
                unit="%"
                status={currentMetrics.databaseHealth.indexEfficiency > 0.95 ? 'good' :
                       currentMetrics.databaseHealth.indexEfficiency > 0.9 ? 'warning' : 'critical'}
                target={95}
              />
            </div>
          </div>

          {/* AI Service Section */}
          <div className="metrics-section">
            <h2>AI Service</h2>
            <div className="metric-cards">
              <MetricCard
                title="AI Response Time"
                value={currentMetrics.aiService.responseTime}
                unit="ms"
                status={currentMetrics.aiService.responseTime < 3000 ? 'good' :
                       currentMetrics.aiService.responseTime < 7000 ? 'warning' : 'critical'}
                target={3000}
              />
              <MetricCard
                title="Success Rate"
                value={currentMetrics.aiService.successRate}
                unit="%"
                status={currentMetrics.aiService.successRate > 95 ? 'good' :
                       currentMetrics.aiService.successRate > 90 ? 'warning' : 'critical'}
                target={95}
              />
              <MetricCard
                title="Fallback Rate"
                value={currentMetrics.aiService.fallbackRate}
                unit="%"
                status={currentMetrics.aiService.fallbackRate < 10 ? 'good' :
                       currentMetrics.aiService.fallbackRate < 30 ? 'warning' : 'critical'}
                target={10}
              />
              <MetricCard
                title="Circuit Breaker"
                value={currentMetrics.aiService.circuitBreakerState === 'CLOSED' ? 1 : 0}
                unit="state"
                status={currentMetrics.aiService.circuitBreakerState === 'CLOSED' ? 'good' :
                       currentMetrics.aiService.circuitBreakerState === 'HALF_OPEN' ? 'warning' : 'critical'}
              />
            </div>
          </div>

          {/* User Experience Section */}
          <div className="metrics-section">
            <h2>User Experience</h2>
            <div className="metric-cards">
              <MetricCard
                title="Page Load Time"
                value={currentMetrics.userExperience.pageLoadTime}
                unit="ms"
                status={currentMetrics.userExperience.pageLoadTime < 2000 ? 'good' :
                       currentMetrics.userExperience.pageLoadTime < 4000 ? 'warning' : 'critical'}
                target={2000}
              />
              <MetricCard
                title="First Contentful Paint"
                value={currentMetrics.userExperience.firstContentfulPaint}
                unit="ms"
                status={currentMetrics.userExperience.firstContentfulPaint < 1500 ? 'good' :
                       currentMetrics.userExperience.firstContentfulPaint < 2500 ? 'warning' : 'critical'}
                target={1500}
              />
              <MetricCard
                title="Bounce Rate"
                value={currentMetrics.userExperience.bounceRate}
                unit="%"
                status={currentMetrics.userExperience.bounceRate < 15 ? 'good' :
                       currentMetrics.userExperience.bounceRate < 25 ? 'warning' : 'critical'}
                target={15}
              />
              <MetricCard
                title="CLS Score"
                value={currentMetrics.userExperience.cumulativeLayoutShift}
                unit=""
                status={currentMetrics.userExperience.cumulativeLayoutShift < 0.1 ? 'good' :
                       currentMetrics.userExperience.cumulativeLayoutShift < 0.25 ? 'warning' : 'critical'}
                target={0.1}
              />
            </div>
          </div>

          {/* Business Health Section */}
          <div className="metrics-section">
            <h2>Business Metrics</h2>
            <div className="metric-cards">
              <MetricCard
                title="Active Users"
                value={currentMetrics.businessHealth.activeUsers}
                unit="count"
                status="good"
              />
              <MetricCard
                title="Conversion Rate"
                value={currentMetrics.businessHealth.conversionRate}
                unit="%"
                status={currentMetrics.businessHealth.conversionRate > 2 ? 'good' :
                       currentMetrics.businessHealth.conversionRate > 1 ? 'warning' : 'critical'}
                target={2}
              />
              <MetricCard
                title="Revenue/Hour"
                value={currentMetrics.businessHealth.revenuePerHour}
                unit="$"
                status="good"
              />
              <MetricCard
                title="CSAT Score"
                value={currentMetrics.businessHealth.customerSatisfaction}
                unit=""
                status={currentMetrics.businessHealth.customerSatisfaction > 4.5 ? 'good' :
                       currentMetrics.businessHealth.customerSatisfaction > 4.0 ? 'warning' : 'critical'}
                target={4.5}
              />
            </div>
          </div>
        </div>
      )}

      {/* Performance Trends */}
      {metricsHistory.length > 1 && (
        <div className="trends-section">
          <h2>Performance Trends</h2>
          <div className="trend-charts">
            <SimpleChart
              title="Response Time Trend"
              data={metricsHistory.map(m => ({
                timestamp: m.timestamp.toLocaleTimeString(),
                value: m.applicationHealth.responseTime
              }))}
              unit="ms"
              target={1000}
            />
            <SimpleChart
              title="Video Start Time Trend"
              data={metricsHistory.map(m => ({
                timestamp: m.timestamp.toLocaleTimeString(),
                value: m.videoDelivery.averageStartTime
              }))}
              unit="ms"
              target={2000}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .performance-dashboard {
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f8fafc;
          min-height: 100vh;
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          color: #6b7280;
        }

        .loading-spinner {
          font-size: 2rem;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content h1 {
          margin: 0;
          color: #1f2937;
          font-size: 1.875rem;
          font-weight: bold;
        }

        .header-info {
          display: flex;
          gap: 20px;
          margin-top: 8px;
        }

        .health-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .last-updated {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .dashboard-controls {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .time-range-selector label {
          margin-right: 8px;
          font-weight: 500;
        }

        .time-range-selector select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
        }

        .refresh-button {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .refresh-button:hover {
          background: #2563eb;
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .metrics-grid {
          display: grid;
          gap: 30px;
        }

        .metrics-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .metrics-section h2 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .metric-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .trends-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-top: 30px;
        }

        .trends-section h2 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .trend-charts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  status,
  trend,
  target
}) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  const formatValue = (value: number, unit: string): string => {
    switch (unit) {
      case 'ms':
        return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
      case '%':
        return `${value.toFixed(1)}%`;
      case 'count':
        return Math.round(value).toString();
      case '$':
        return `$${value.toFixed(0)}`;
      case 'req/s':
        return `${Math.round(value)} req/s`;
      case 'state':
        return value === 1 ? 'CLOSED' : value === 0.5 ? 'HALF_OPEN' : 'OPEN';
      default:
        return value.toFixed(2);
    }
  };

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <span className="metric-status">{getStatusIcon(status)}</span>
      </div>
      <div className="metric-value" style={{ color: getStatusColor(status) }}>
        {formatValue(value, unit)}
      </div>
      {target && (
        <div className="metric-target">
          Target: {formatValue(target, unit)}
        </div>
      )}
      {trend && (
        <div className="metric-trend">
          {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
        </div>
      )}

      <style jsx>{`
        .metric-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          position: relative;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .metric-title {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .metric-status {
          font-size: 1rem;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .metric-target {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .metric-trend {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// ALERT SUMMARY COMPONENT
// ============================================================================

const AlertSummary: React.FC<AlertSummaryProps> = ({
  alerts,
  onAcknowledge,
  onResolve
}) => {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <div className="alert-summary">
      <h2>🚨 Active Alerts ({alerts.length})</h2>
      <div className="alert-list">
        {alerts.map(alert => (
          <div key={alert.id} className="alert-item">
            <div className="alert-content">
              <div className="alert-header">
                <span className="alert-name">{alert.ruleName}</span>
                <span
                  className="alert-severity"
                  style={{ color: getSeverityColor(alert.severity) }}
                >
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <div className="alert-details">
                <span className="alert-metric">{alert.metric}</span>
                <span className="alert-value">
                  Current: {alert.currentValue.toFixed(2)} |
                  Threshold: {alert.threshold}
                </span>
              </div>
              <div className="alert-time">
                Triggered: {alert.triggeredAt.toLocaleString()}
              </div>
            </div>
            <div className="alert-actions">
              <button
                className="alert-button acknowledge"
                onClick={() => onAcknowledge(alert.id)}
              >
                Acknowledge
              </button>
              <button
                className="alert-button resolve"
                onClick={() => onResolve(alert.id)}
              >
                Resolve
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .alert-summary {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .alert-summary h2 {
          margin: 0 0 16px 0;
          color: #dc2626;
          font-size: 1.125rem;
        }

        .alert-list {
          display: grid;
          gap: 12px;
        }

        .alert-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .alert-content {
          flex: 1;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .alert-name {
          font-weight: 600;
          color: #1f2937;
        }

        .alert-severity {
          font-size: 0.75rem;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.1);
        }

        .alert-details {
          margin-bottom: 4px;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .alert-metric {
          font-weight: 500;
          margin-right: 8px;
        }

        .alert-time {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .alert-actions {
          display: flex;
          gap: 8px;
          margin-left: 16px;
        }

        .alert-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
        }

        .alert-button.acknowledge {
          background: #3b82f6;
          color: white;
        }

        .alert-button.resolve {
          background: #10b981;
          color: white;
        }

        .alert-button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// SIMPLE CHART COMPONENT
// ============================================================================

const SimpleChart: React.FC<{
  title: string;
  data: ChartData[];
  unit: string;
  target?: number;
}> = ({ title, data, unit, target }) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="simple-chart">
      <h3>{title}</h3>
      <div className="chart-container">
        <svg width="100%" height="200" viewBox="0 0 400 200">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => (
            <line
              key={percent}
              x1="0"
              y1={percent * 2}
              x2="400"
              y2={percent * 2}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Target line */}
          {target && (
            <line
              x1="0"
              y1={((maxValue - target) / range) * 200}
              x2="400"
              y2={((maxValue - target) / range) * 200}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}

          {/* Data line */}
          <polyline
            points={data.map((d, i) =>
              `${(i / (data.length - 1)) * 400},${((maxValue - d.value) / range) * 200}`
            ).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />

          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={(i / (data.length - 1)) * 400}
              cy={((maxValue - d.value) / range) * 200}
              r="3"
              fill="#3b82f6"
            />
          ))}
        </svg>
      </div>
      <div className="chart-legend">
        <span>Range: {minValue.toFixed(0)} - {maxValue.toFixed(0)} {unit}</span>
        {target && <span>Target: {target} {unit}</span>}
      </div>

      <style jsx>{`
        .simple-chart {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
        }

        .simple-chart h3 {
          margin: 0 0 12px 0;
          font-size: 1rem;
          color: #1f2937;
        }

        .chart-container {
          margin-bottom: 8px;
        }

        .chart-legend {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default PerformanceDashboard;