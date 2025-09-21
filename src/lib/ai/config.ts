/**
 * AI Service Configuration
 *
 * Centralized configuration for AI service with circuit breaker settings
 * Allows easy tuning of resilience parameters
 */

import { CircuitBreakerConfig } from './circuit-breaker';

export interface AIServiceConfig {
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
  };
  circuitBreaker: CircuitBreakerConfig;
  cache: {
    maxConversationHistory: number;
    maxResponseCache: number;
    cacheExpirationMs: number;
  };
  monitoring: {
    metricsUpdateInterval: number;
    enableDetailedLogging: boolean;
  };
}

/**
 * Production configuration
 */
export const PRODUCTION_CONFIG: AIServiceConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 1000,
    presencePenalty: 0.1,
    frequencyPenalty: 0.1
  },
  circuitBreaker: {
    failureThreshold: 5,        // Trip after 5 failures
    recoveryTimeout: 30000,     // Wait 30 seconds before testing recovery
    requestTimeout: 10000,      // 10 second timeout for AI requests
    monitoringWindow: 60000,    // Monitor failures over 1 minute window
    halfOpenMaxCalls: 3         // Allow 3 test calls during recovery
  },
  cache: {
    maxConversationHistory: 50,  // Keep last 50 messages per conversation
    maxResponseCache: 1000,      // Cache up to 1000 responses
    cacheExpirationMs: 3600000   // Cache expires after 1 hour
  },
  monitoring: {
    metricsUpdateInterval: 5000, // Update metrics every 5 seconds
    enableDetailedLogging: false
  }
};

/**
 * Development configuration (more lenient for testing)
 */
export const DEVELOPMENT_CONFIG: AIServiceConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 1000,
    presencePenalty: 0.1,
    frequencyPenalty: 0.1
  },
  circuitBreaker: {
    failureThreshold: 3,        // Trip after 3 failures (faster for testing)
    recoveryTimeout: 10000,     // Wait 10 seconds (faster recovery)
    requestTimeout: 15000,      // 15 second timeout (more lenient)
    monitoringWindow: 30000,    // Monitor failures over 30 second window
    halfOpenMaxCalls: 2         // Allow 2 test calls during recovery
  },
  cache: {
    maxConversationHistory: 20,  // Smaller cache for development
    maxResponseCache: 100,
    cacheExpirationMs: 600000    // Cache expires after 10 minutes
  },
  monitoring: {
    metricsUpdateInterval: 1000, // Update metrics every second
    enableDetailedLogging: true
  }
};

/**
 * Test configuration (very fast failure/recovery for unit tests)
 */
export const TEST_CONFIG: AIServiceConfig = {
  openai: {
    apiKey: 'test-api-key',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 100,
    presencePenalty: 0.1,
    frequencyPenalty: 0.1
  },
  circuitBreaker: {
    failureThreshold: 2,        // Trip after 2 failures
    recoveryTimeout: 1000,      // Wait 1 second
    requestTimeout: 2000,       // 2 second timeout
    monitoringWindow: 5000,     // Monitor failures over 5 second window
    halfOpenMaxCalls: 1         // Allow 1 test call during recovery
  },
  cache: {
    maxConversationHistory: 10,
    maxResponseCache: 10,
    cacheExpirationMs: 60000    // Cache expires after 1 minute
  },
  monitoring: {
    metricsUpdateInterval: 100,  // Update metrics every 100ms
    enableDetailedLogging: true
  }
};

/**
 * Get configuration based on environment
 */
export function getAIServiceConfig(): AIServiceConfig {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return PRODUCTION_CONFIG;
    case 'test':
      return TEST_CONFIG;
    default:
      return DEVELOPMENT_CONFIG;
  }
}

/**
 * Environment-specific circuit breaker configurations
 */
export const CIRCUIT_BREAKER_PRESETS = {
  // Conservative: Slow to trip, slow to recover (production default)
  conservative: {
    failureThreshold: 8,
    recoveryTimeout: 60000,     // 1 minute
    requestTimeout: 15000,      // 15 seconds
    monitoringWindow: 120000,   // 2 minutes
    halfOpenMaxCalls: 5
  },

  // Balanced: Moderate settings (recommended for most cases)
  balanced: {
    failureThreshold: 5,
    recoveryTimeout: 30000,     // 30 seconds
    requestTimeout: 10000,      // 10 seconds
    monitoringWindow: 60000,    // 1 minute
    halfOpenMaxCalls: 3
  },

  // Aggressive: Quick to trip, quick to recover (development/testing)
  aggressive: {
    failureThreshold: 3,
    recoveryTimeout: 10000,     // 10 seconds
    requestTimeout: 5000,       // 5 seconds
    monitoringWindow: 30000,    // 30 seconds
    halfOpenMaxCalls: 2
  },

  // Sensitive: Very quick to protect user experience
  sensitive: {
    failureThreshold: 2,
    recoveryTimeout: 5000,      // 5 seconds
    requestTimeout: 3000,       // 3 seconds
    monitoringWindow: 15000,    // 15 seconds
    halfOpenMaxCalls: 1
  }
} as const;

/**
 * Configuration validation
 */
export function validateAIServiceConfig(config: AIServiceConfig): string[] {
  const errors: string[] = [];

  // Validate OpenAI config
  if (!config.openai.apiKey) {
    errors.push('OpenAI API key is required');
  }

  if (config.openai.temperature < 0 || config.openai.temperature > 2) {
    errors.push('OpenAI temperature must be between 0 and 2');
  }

  if (config.openai.maxTokens < 1 || config.openai.maxTokens > 4000) {
    errors.push('OpenAI maxTokens must be between 1 and 4000');
  }

  // Validate circuit breaker config
  if (config.circuitBreaker.failureThreshold < 1) {
    errors.push('Circuit breaker failure threshold must be at least 1');
  }

  if (config.circuitBreaker.recoveryTimeout < 1000) {
    errors.push('Circuit breaker recovery timeout must be at least 1000ms');
  }

  if (config.circuitBreaker.requestTimeout < 1000) {
    errors.push('Circuit breaker request timeout must be at least 1000ms');
  }

  if (config.circuitBreaker.monitoringWindow < config.circuitBreaker.recoveryTimeout) {
    errors.push('Monitoring window should be larger than recovery timeout');
  }

  // Validate cache config
  if (config.cache.maxConversationHistory < 1) {
    errors.push('Max conversation history must be at least 1');
  }

  if (config.cache.maxResponseCache < 1) {
    errors.push('Max response cache must be at least 1');
  }

  if (config.cache.cacheExpirationMs < 60000) {
    errors.push('Cache expiration must be at least 60000ms (1 minute)');
  }

  return errors;
}

/**
 * Get circuit breaker preset by name
 */
export function getCircuitBreakerPreset(preset: keyof typeof CIRCUIT_BREAKER_PRESETS): CircuitBreakerConfig {
  return { ...CIRCUIT_BREAKER_PRESETS[preset] };
}