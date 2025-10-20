/**
 * Rate Limit Testing Script
 * Tests the AI chat endpoint to verify rate limiting works correctly
 */

const testRateLimit = async () => {
  console.log('Testing rate limit on AI chat endpoint...\n')

  const testPayload = {
    messages: [{ role: 'user', content: 'What is two-phase cooling?' }],
    context: {},
  }

  // Make 15 requests rapidly (limit is 10 per 10 seconds)
  for (let i = 1; i <= 15; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      })

      const data = await response.json()

      console.log(`Request ${i}:`)
      console.log(`  Status: ${response.status}`)
      console.log(`  Limit: ${response.headers.get('x-ratelimit-limit')}`)
      console.log(`  Remaining: ${response.headers.get('x-ratelimit-remaining')}`)
      console.log(`  Reset: ${response.headers.get('x-ratelimit-reset')}`)

      if (response.status === 429) {
        console.log(`  ✓ Rate limit exceeded (as expected)`)
        console.log(`  Message: ${data.message}`)
        console.log(`  Retry-After: ${response.headers.get('retry-after')} seconds\n`)
      } else if (response.status === 200) {
        console.log(`  ✓ Request successful\n`)
      } else {
        console.log(`  Error: ${data.error || 'Unknown error'}\n`)
      }
    } catch (error) {
      console.log(`Request ${i}: Network error - ${error.message}\n`)
    }
  }

  console.log('\n✓ Rate limit test completed!')
}

testRateLimit()
