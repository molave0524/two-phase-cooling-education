import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { logger } from '../lib/logger.js'

const cloudwatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
})

export interface MetricData {
  MetricName: string
  Value: number
  Unit: string
  Dimensions?: Array<{
    Name: string
    Value: string
  }>
  Timestamp?: Date
}

export class CloudWatchLogger {
  private namespace: string

  constructor(namespace: string = 'TwoPhaseCooling/Education') {
    this.namespace = namespace
  }

  async putMetric(metric: MetricData): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: [
          {
            MetricName: metric.MetricName,
            Value: metric.Value,
            Unit: metric.Unit,
            Dimensions: metric.Dimensions,
            Timestamp: metric.Timestamp || new Date(),
          },
        ],
      })

      await cloudwatch.send(command)
      logger.info('Metric sent to CloudWatch', {
        metricName: metric.MetricName,
        value: metric.Value,
      })
    } catch (error) {
      logger.error('Failed to send metric to CloudWatch', error)
    }
  }

  async logApiRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): Promise<void> {
    const metrics: MetricData[] = [
      {
        MetricName: 'ApiRequests',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          { Name: 'Endpoint', Value: endpoint },
          { Name: 'Method', Value: method },
          { Name: 'StatusCode', Value: statusCode.toString() },
        ],
      },
      {
        MetricName: 'ApiLatency',
        Value: duration,
        Unit: 'Milliseconds',
        Dimensions: [
          { Name: 'Endpoint', Value: endpoint },
          { Name: 'Method', Value: method },
        ],
      },
    ]

    for (const metric of metrics) {
      await this.putMetric(metric)
    }
  }

  async logError(errorType: string, endpoint?: string): Promise<void> {
    await this.putMetric({
      MetricName: 'Errors',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'ErrorType', Value: errorType },
        ...(endpoint ? [{ Name: 'Endpoint', Value: endpoint }] : []),
      ],
    })
  }

  async logVideoPlay(videoId: string, userId?: string): Promise<void> {
    await this.putMetric({
      MetricName: 'VideoPlays',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'VideoId', Value: videoId },
        ...(userId ? [{ Name: 'UserId', Value: userId }] : []),
      ],
    })
  }

  async logVideoCompletion(
    videoId: string,
    duration: number,
    completionRate: number
  ): Promise<void> {
    const metrics: MetricData[] = [
      {
        MetricName: 'VideoCompletions',
        Value: 1,
        Unit: 'Count',
        Dimensions: [{ Name: 'VideoId', Value: videoId }],
      },
      {
        MetricName: 'VideoWatchTime',
        Value: duration,
        Unit: 'Seconds',
        Dimensions: [{ Name: 'VideoId', Value: videoId }],
      },
      {
        MetricName: 'VideoCompletionRate',
        Value: completionRate,
        Unit: 'Percent',
        Dimensions: [{ Name: 'VideoId', Value: videoId }],
      },
    ]

    for (const metric of metrics) {
      await this.putMetric(metric)
    }
  }
}

export const cloudWatchLogger = new CloudWatchLogger()
