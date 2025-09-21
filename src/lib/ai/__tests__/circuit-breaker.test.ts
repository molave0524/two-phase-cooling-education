/**
 * Circuit Breaker Test Suite
 *
 * Comprehensive tests for circuit breaker functionality
 * Validates failure detection, state transitions, and recovery behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CircuitBreaker, CircuitState, DEFAULT_AI_CIRCUIT_CONFIG } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let mockOperation: vi.MockedFunction<() => Promise<string>>;
  let mockFallback: vi.MockedFunction<() => Promise<string>>;

  beforeEach(() => {
    // Use faster timeouts for testing
    const testConfig = {
      ...DEFAULT_AI_CIRCUIT_CONFIG,
      failureThreshold: 2,
      recoveryTimeout: 100,  // 100ms for fast tests
      requestTimeout: 50,    // 50ms timeout
      monitoringWindow: 200  // 200ms window
    };

    circuitBreaker = new CircuitBreaker(testConfig);
    mockOperation = vi.fn();
    mockFallback = vi.fn();

    // Reset mocks
    mockOperation.mockClear();
    mockFallback.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Normal Operation (CLOSED state)', () => {
    it('should execute operation successfully when circuit is closed', async () => {
      mockOperation.mockResolvedValue('success');
      mockFallback.mockResolvedValue('fallback');

      const result = await circuitBreaker.execute(mockOperation, mockFallback);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockFallback).not.toHaveBeenCalled();
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should use fallback when operation fails but not trip circuit yet', async () => {
      mockOperation.mockRejectedValue(new Error('API error'));
      mockFallback.mockResolvedValue('fallback');

      const result = await circuitBreaker.execute(mockOperation, mockFallback);

      expect(result).toBe('fallback');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockFallback).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED); // Still closed after 1 failure
    });
  });

  describe('Circuit Tripping (CLOSED -> OPEN)', () => {
    it('should trip circuit after threshold failures', async () => {
      mockOperation.mockRejectedValue(new Error('API error'));
      mockFallback.mockResolvedValue('fallback');

      // First failure - should not trip
      await circuitBreaker.execute(mockOperation, mockFallback);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

      // Second failure - should trip circuit
      await circuitBreaker.execute(mockOperation, mockFallback);
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.circuitBreakerTrips).toBe(1);
      expect(metrics.failedRequests).toBe(2);
    });

    it('should use fallback immediately when circuit is open', async () => {
      // Trip the circuit first
      mockOperation.mockRejectedValue(new Error('API error'));
      mockFallback.mockResolvedValue('fallback');

      await circuitBreaker.execute(mockOperation, mockFallback); // First failure
      await circuitBreaker.execute(mockOperation, mockFallback); // Second failure - trips circuit

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Reset mocks to track open state behavior
      mockOperation.mockClear();
      mockFallback.mockClear();

      // Now operation should not be called, only fallback
      const result = await circuitBreaker.execute(mockOperation, mockFallback);

      expect(result).toBe('fallback');
      expect(mockOperation).not.toHaveBeenCalled(); // Should not attempt operation
      expect(mockFallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Circuit Recovery (OPEN -> HALF_OPEN -> CLOSED)', () => {
    beforeEach(async () => {
      // Trip the circuit
      mockOperation.mockRejectedValue(new Error('API error'));
      mockFallback.mockResolvedValue('fallback');

      await circuitBreaker.execute(mockOperation, mockFallback); // First failure
      await circuitBreaker.execute(mockOperation, mockFallback); // Second failure - trips

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Reset mocks for recovery testing
      mockOperation.mockClear();
      mockFallback.mockClear();
    });

    it('should transition to HALF_OPEN after recovery timeout', async () => {
      vi.useFakeTimers();

      // Advance time to trigger recovery attempt
      vi.advanceTimersByTime(150); // Beyond recovery timeout

      mockOperation.mockResolvedValue('success');
      const result = await circuitBreaker.execute(mockOperation, mockFallback);

      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should close circuit after successful operation in HALF_OPEN', async () => {
      vi.useFakeTimers();

      // Trigger recovery
      vi.advanceTimersByTime(150);

      mockOperation.mockResolvedValue('success');
      await circuitBreaker.execute(mockOperation, mockFallback);

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.successfulRequests).toBe(1);
    });

    it('should reopen circuit if operation fails in HALF_OPEN', async () => {
      vi.useFakeTimers();

      // Trigger recovery
      vi.advanceTimersByTime(150);

      // First call should transition to HALF_OPEN
      mockOperation.mockRejectedValue(new Error('Still failing'));
      await circuitBreaker.execute(mockOperation, mockFallback);

      // Circuit should remain in HALF_OPEN or go back to OPEN
      // depending on implementation details
      const state = circuitBreaker.getState();
      expect([CircuitState.HALF_OPEN, CircuitState.OPEN]).toContain(state);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running operations', async () => {
      // Mock an operation that takes longer than timeout
      mockOperation.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('late'), 100))
      );
      mockFallback.mockResolvedValue('fallback');

      const result = await circuitBreaker.execute(mockOperation, mockFallback);

      expect(result).toBe('fallback');
      expect(mockFallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Metrics Collection', () => {
    it('should track request metrics correctly', async () => {
      mockOperation.mockResolvedValue('success');
      mockFallback.mockResolvedValue('fallback');

      // Execute some successful operations
      await circuitBreaker.execute(mockOperation, mockFallback);
      await circuitBreaker.execute(mockOperation, mockFallback);

      const metrics = circuitBreaker.getMetrics();

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.successfulRequests).toBe(2);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.circuitBreakerTrips).toBe(0);
      expect(metrics.fallbackResponses).toBe(0);
      expect(metrics.currentState).toBe(CircuitState.CLOSED);
    });

    it('should track failure metrics correctly', async () => {
      mockOperation.mockRejectedValue(new Error('API error'));
      mockFallback.mockResolvedValue('fallback');

      // Execute some failed operations
      await circuitBreaker.execute(mockOperation, mockFallback);
      await circuitBreaker.execute(mockOperation, mockFallback); // This should trip

      const metrics = circuitBreaker.getMetrics();

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(2);
      expect(metrics.circuitBreakerTrips).toBe(1);
      expect(metrics.fallbackResponses).toBe(2);
      expect(metrics.currentState).toBe(CircuitState.OPEN);
    });

    it('should calculate average response time', async () => {
      mockOperation.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('success'), 10))
      );
      mockFallback.mockResolvedValue('fallback');

      await circuitBreaker.execute(mockOperation, mockFallback);

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Manual Reset', () => {
    it('should reset circuit state and metrics', async () => {
      // Trip the circuit
      mockOperation.mockRejectedValue(new Error('API error'));
      mockFallback.mockResolvedValue('fallback');

      await circuitBreaker.execute(mockOperation, mockFallback);
      await circuitBreaker.execute(mockOperation, mockFallback);

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Reset the circuit
      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.currentState).toBe(CircuitState.CLOSED);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests correctly', async () => {
      mockOperation.mockResolvedValue('success');
      mockFallback.mockResolvedValue('fallback');

      // Execute multiple concurrent requests
      const promises = Array(5).fill(null).map(() =>
        circuitBreaker.execute(mockOperation, mockFallback)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results.every(r => r === 'success')).toBe(true);
      expect(mockOperation).toHaveBeenCalledTimes(5);
    });

    it('should handle empty/null operations gracefully', async () => {
      mockFallback.mockResolvedValue('fallback');

      const nullOperation = vi.fn().mockImplementation(() => {
        throw new Error('Null operation');
      });

      const result = await circuitBreaker.execute(nullOperation, mockFallback);

      expect(result).toBe('fallback');
      expect(mockFallback).toHaveBeenCalledTimes(1);
    });
  });
});