# AI Service Circuit Breaker Implementation

This directory contains a complete, production-ready implementation of an AI service with circuit breaker protection for the Two-Phase Cooling Education Center platform.

## Overview

The circuit breaker pattern prevents cascading failures when the OpenAI API becomes unavailable, providing graceful degradation to ensure users always receive helpful responses about cooling technology.

## Key Features

- **🔄 Circuit Breaker Protection** - Automatic failure detection and recovery
- **📚 Intelligent Fallback** - FAQ system with semantic search
- **⚡ Response Caching** - Fast responses for common questions
- **📊 Comprehensive Metrics** - Real-time monitoring and alerting
- **🎨 Graceful UI Degradation** - Seamless user experience during outages
- **🧪 Fully Tested** - Complete test suite with edge case coverage

## Architecture

```
User Question
     ↓
Circuit Breaker
     ├─ CLOSED → OpenAI API Call
     ├─ HALF_OPEN → Limited OpenAI Tests
     └─ OPEN → Fallback FAQ Search
           ↓
     Cached Response / FAQ / Default
```

## Quick Start

### 1. Basic Usage

```typescript
import { AIService } from '@/lib/ai/ai-service';

const aiService = new AIService(process.env.OPENAI_API_KEY!);

const response = await aiService.processMessage(
  "What is two-phase cooling?",
  {
    conversationId: "user-123",
    userLearningLevel: "beginner"
  }
);

console.log(response.content); // AI response or fallback
console.log(response.source);  // 'openai', 'cached', 'faq', or 'fallback'
```

### 2. React Component Usage

```tsx
import { AIAssistant } from '@/components/ai/ai-assistant';

export function MyPage() {
  return (
    <AIAssistant
      conversationId="user-session-123"
      userLearningLevel="intermediate"
      currentTopic="two-phase-cooling"
      onVideoSuggestion={(videoId) => navigateToVideo(videoId)}
      onFAQSuggestion={(faqId) => showFAQ(faqId)}
    />
  );
}
```

### 3. Custom Hook Usage

```tsx
import { useAIAssistant } from '@/hooks/use-ai-assistant';

function CustomAIChat() {
  const {
    messages,
    isLoading,
    isAIAvailable,
    circuitState,
    sendMessage,
    resetCircuitBreaker
  } = useAIAssistant({
    conversationId: "chat-123",
    userLearningLevel: "advanced"
  });

  return (
    <div>
      <div>Status: {circuitState}</div>
      {!isAIAvailable && (
        <button onClick={resetCircuitBreaker}>
          Retry AI Connection
        </button>
      )}
      {/* Your chat UI */}
    </div>
  );
}
```

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional (defaults shown)
NEXT_PUBLIC_AI_CIRCUIT_BREAKER_PRESET=balanced  # conservative|balanced|aggressive|sensitive
```

### Circuit Breaker Presets

```typescript
import { getCircuitBreakerPreset } from '@/lib/ai/config';

// Conservative: Slow to trip, production-safe
const conservative = getCircuitBreakerPreset('conservative');

// Balanced: Good for most use cases
const balanced = getCircuitBreakerPreset('balanced');

// Aggressive: Quick failover, good for development
const aggressive = getCircuitBreakerPreset('aggressive');

// Sensitive: Maximum user experience protection
const sensitive = getCircuitBreakerPreset('sensitive');
```

## Circuit Breaker States

### 🟢 CLOSED (Normal Operation)
- All requests go to OpenAI API
- Tracks failures for trip threshold
- Best user experience when API is healthy

### 🟡 HALF_OPEN (Testing Recovery)
- Limited requests test if API recovered
- Successful calls close the circuit
- Failed calls reopen the circuit

### 🔴 OPEN (Fallback Mode)
- All requests use fallback responses
- Automatically attempts recovery after timeout
- Users still get helpful cooling information

## Fallback System

### 1. Cached Responses (Fastest)
Previously successful AI responses for identical questions.

### 2. FAQ Database (Most Comprehensive)
Curated answers about two-phase cooling technology:

```typescript
const faqResponse = await fallbackService.searchFAQ(
  "Is two-phase cooling safe?"
);
// Returns: Detailed safety information with confidence score
```

### 3. Default Response (Always Available)
Helpful guidance when no specific match is found.

## Monitoring & Metrics

### Real-time Metrics
```typescript
const metrics = aiService.getMetrics();

console.log({
  circuitState: metrics.circuitBreaker.currentState,
  totalRequests: metrics.circuitBreaker.totalRequests,
  successRate: metrics.circuitBreaker.successfulRequests / metrics.circuitBreaker.totalRequests,
  fallbackResponses: metrics.circuitBreaker.fallbackResponses,
  averageResponseTime: metrics.circuitBreaker.averageResponseTime
});
```

### Health Checks
```typescript
// Check if AI service is available
const isHealthy = aiService.getMetrics().circuitBreaker.currentState === CircuitState.CLOSED;

// Manual recovery trigger
if (!isHealthy) {
  aiService.resetCircuitBreaker();
}
```

## Testing

### Running Tests
```bash
# Run all AI service tests
npm test src/lib/ai

# Run specific test file
npm test circuit-breaker.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Coverage
- ✅ Circuit breaker state transitions
- ✅ Failure threshold detection
- ✅ Recovery timeout behavior
- ✅ Timeout handling
- ✅ Metrics collection
- ✅ Concurrent request handling
- ✅ Edge cases and error conditions

## Performance Considerations

### Response Times
- **OpenAI API**: 1-5 seconds (variable)
- **Cached responses**: <50ms
- **FAQ search**: <100ms
- **Default fallback**: <10ms

### Memory Usage
- **Conversation cache**: ~50 messages per user
- **Response cache**: ~1000 cached responses
- **FAQ database**: Loaded once, ~50KB in memory

### Scalability
- **Circuit breaker**: Per-instance state (scales horizontally)
- **Caching**: In-memory (consider Redis for multi-instance)
- **FAQ search**: O(n) semantic matching (consider vector DB for scale)

## Production Deployment

### 1. Environment Setup
```bash
# Production environment variables
OPENAI_API_KEY=prod-key-here
NODE_ENV=production
NEXT_PUBLIC_AI_CIRCUIT_BREAKER_PRESET=conservative
```

### 2. Monitoring Setup
```typescript
// Set up alerts for circuit breaker trips
const metrics = aiService.getMetrics();
if (metrics.circuitBreaker.circuitBreakerTrips > 0) {
  // Alert operations team
  sendAlert('AI circuit breaker tripped', metrics);
}
```

### 3. Health Check Endpoint
```typescript
// /api/health/ai
export async function GET() {
  const metrics = aiService.getMetrics();
  const isHealthy = metrics.circuitBreaker.currentState === CircuitState.CLOSED;

  return Response.json({
    status: isHealthy ? 'healthy' : 'degraded',
    circuitState: metrics.circuitBreaker.currentState,
    metrics
  }, { status: isHealthy ? 200 : 503 });
}
```

## Troubleshooting

### Common Issues

**Circuit breaker stuck open?**
- Check OpenAI API status
- Verify API key is valid
- Try manual reset: `aiService.resetCircuitBreaker()`

**High fallback response rate?**
- Monitor OpenAI API latency
- Consider increasing timeout values
- Check for network connectivity issues

**Poor FAQ match quality?**
- Review FAQ database for completeness
- Add more keywords to FAQ entries
- Consider implementing vector search

**Memory usage growing?**
- Check conversation cache size limits
- Verify cache cleanup is working
- Monitor for memory leaks in long-running sessions

### Debug Mode
```typescript
// Enable detailed logging
const config = getAIServiceConfig();
config.monitoring.enableDetailedLogging = true;

// This will log all circuit breaker state changes and API calls
```

## Contributing

### Adding New FAQ Entries
```typescript
// Add to COOLING_FAQ_DATABASE in fallback-faq.ts
{
  id: 'faq-new',
  category: 'troubleshooting',
  question: 'Your new question?',
  answer: 'Detailed answer...',
  keywords: ['keyword1', 'keyword2'],
  relatedVideos: ['video-id']
}
```

### Customizing Circuit Breaker Behavior
```typescript
// Create custom configuration
const customConfig = {
  ...DEFAULT_AI_CIRCUIT_CONFIG,
  failureThreshold: 8,     // Your custom threshold
  recoveryTimeout: 45000   // Your custom timeout
};

const aiService = new AIService(apiKey, customConfig);
```

## Files Overview

- **`circuit-breaker.ts`** - Core circuit breaker implementation
- **`fallback-faq.ts`** - FAQ database and semantic search
- **`ai-service.ts`** - Main AI service with OpenAI integration
- **`config.ts`** - Configuration presets and validation
- **`use-ai-assistant.ts`** - React hook for state management
- **`ai-assistant.tsx`** - Complete UI component
- **`__tests__/`** - Comprehensive test suite

This implementation provides a robust, production-ready foundation for AI assistance with graceful degradation, ensuring users always receive value even when external services are unavailable.