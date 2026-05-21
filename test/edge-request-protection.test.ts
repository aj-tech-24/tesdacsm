import test from 'node:test'
import assert from 'node:assert'
import { applyEdgeRateLimit, resetEdgeRequestProtectionStateForTests } from '../lib/edge-request-protection'

test('edge request protection rate limits public API routes', () => {
  resetEdgeRequestProtectionStateForTests()

  const request = new Request('https://example.com/api/submit-feedback', {
    method: 'POST',
    headers: {
      'user-agent': 'TestAgent/1.0',
      'x-forwarded-for': '203.0.113.10',
    },
  })

  const allowed = applyEdgeRateLimit(request, '/api/submit-feedback')
  assert.strictEqual(allowed, null)

  for (let index = 0; index < 11; index += 1) {
    applyEdgeRateLimit(request, '/api/submit-feedback')
  }

  const blocked = applyEdgeRateLimit(request, '/api/submit-feedback')
  assert.ok(blocked)
  assert.strictEqual(blocked?.status, 429)
})