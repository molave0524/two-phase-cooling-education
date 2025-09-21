/**
 * Circuit Breaker Implementation for AI Service Resilience
 *
 * Prevents cascading failures when OpenAI API is unavailable
 * Provides graceful degradation with fallback responses
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation - requests go through
  OPEN = 'OPEN',         // Circuit tripped - all requests use fallback
  HALF_OPEN = 'HALF_OPEN' // Testing recovery - limited requests allowed
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before tripping
  recoveryTimeout: number;     // Time before attempting recovery (ms)
  requestTimeout: number;      // Individual request timeout (ms)
  monitoringWindow: number;    // Time window for failure counting (ms)
  halfOpenMaxCalls: number;    // Max calls allowed in HALF_OPEN state
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  circuitBreakerTrips: number;
  fallbackResponses: number;
  averageResponseTime: number;
  currentState: CircuitState;
  lastFailureTime: number;
  lastRecoveryAttempt: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private lastRecoveryAttempt: number = 0;
  private halfOpenCallCount: number = 0;
  private metrics: CircuitBreakerMetrics;
  private recentRequests: Array<{ timestamp: number; success: boolean; responseTime: number }> = [];

  constructor(private config: CircuitBreakerConfig) {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitBreakerTrips: 0,
      fallbackResponses: 0,
      averageResponseTime: 0,
      currentState: this.state,
      lastFailureTime: 0,
      lastRecoveryAttempt: 0
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => Promise<T>
  ): Promise<T> {
    this.updateMetrics();

    // Check if circuit should allow the request
    if (!this.shouldAllowRequest()) {
      this.metrics.fallbackResponses++;
      return await fallbackOperation();
    }

    const startTime = Date.now();

    try {
      // Execute the operation with timeout
      const result = await this.executeWithTimeout(operation);

      // Record success
      this.onSuccess(Date.now() - startTime);
      return result;

    } catch (error) {
      // Record failure
      this.onFailure(Date.now() - startTime);
      this.metrics.fallbackResponses++;
      return await fallbackOperation();
    }
  }

  /**
   * Check if the circuit should allow a request
   */
  private shouldAllowRequest(): boolean {
    const now = Date.now();

    switch (this.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if enough time has passed to attempt recovery
        if (now - this.lastFailureTime >= this.config.recoveryTimeout) {
          this.state = CircuitState.HALF_OPEN;
          this.halfOpenCallCount = 0;
          this.lastRecoveryAttempt = now;
          this.metrics.currentState = this.state;
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        // Allow limited requests to test recovery
        if (this.halfOpenCallCount < this.config.halfOpenMaxCalls) {
          this.halfOpenCallCount++;
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Circuit breaker timeout'));
      }, this.config.requestTimeout);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Handle successful operation
   */
  private onSuccess(responseTime: number): void {
    this.recordRequest(true, responseTime);
    this.metrics.successfulRequests++;

    // Reset failure count and potentially close circuit
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      // Recovery successful - close the circuit
      this.state = CircuitState.CLOSED;
      this.metrics.currentState = this.state;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(responseTime: number): void {
    this.recordRequest(false, responseTime);
    this.metrics.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // Check if we should trip the circuit
    if (this.shouldTripCircuit()) {
      this.tripCircuit();
    }
  }

  /**
   * Determine if circuit should be tripped
   */
  private shouldTripCircuit(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.monitoringWindow;

    // Count recent failures within the monitoring window
    const recentFailures = this.recentRequests.filter(
      req => req.timestamp >= windowStart && !req.success
    ).length;

    return recentFailures >= this.config.failureThreshold;
  }

  /**
   * Trip the circuit breaker
   */
  private tripCircuit(): void {
    this.state = CircuitState.OPEN;
    this.metrics.circuitBreakerTrips++;
    this.metrics.currentState = this.state;
    this.halfOpenCallCount = 0;

    // Log circuit breaker trip for monitoring
    console.warn(`🔴 Circuit breaker TRIPPED - State: ${this.state}, Failures: ${this.failureCount}`);
  }

  /**
   * Record request for metrics and failure rate calculation
   */
  private recordRequest(success: boolean, responseTime: number): void {
    const now = Date.now();
    this.recentRequests.push({ timestamp: now, success, responseTime });

    // Clean up old requests outside monitoring window
    const windowStart = now - this.config.monitoringWindow;
    this.recentRequests = this.recentRequests.filter(req => req.timestamp >= windowStart);

    this.metrics.totalRequests++;
  }

  /**
   * Update calculated metrics
   */
  private updateMetrics(): void {
    if (this.recentRequests.length > 0) {
      const totalResponseTime = this.recentRequests.reduce((sum, req) => sum + req.responseTime, 0);
      this.metrics.averageResponseTime = totalResponseTime / this.recentRequests.length;
    }
    this.metrics.currentState = this.state;
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Manually reset the circuit breaker (for testing/admin)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.halfOpenCallCount = 0;
    this.recentRequests = [];
    this.metrics.currentState = this.state;
    console.info('🟢 Circuit breaker manually RESET');
  }
}

/**
 * Default configuration for AI service circuit breaker
 */
export const DEFAULT_AI_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,        // Trip after 5 failures
  recoveryTimeout: 30000,     // Wait 30 seconds before testing recovery
  requestTimeout: 10000,      // 10 second timeout for AI requests
  monitoringWindow: 60000,    // Monitor failures over 1 minute window
  halfOpenMaxCalls: 3         // Allow 3 test calls during recovery
};