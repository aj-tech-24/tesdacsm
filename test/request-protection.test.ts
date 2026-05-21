import test from 'node:test'
import assert from 'node:assert'
import {
  enforceRateLimit,
  rejectIfRequestTooLarge,
  resetRequestProtectionStateForTests,
} from '../lib/request-protection'

test('request protection enforces burst limits per request fingerprint', async () => {
  resetRequestProtectionStateForTests()

  const request = new Request('https://example.com/api/submit-feedback', {
    method: 'POST',
    headers: {
      'user-agent': 'TestAgent/1.0',
      'x-forwarded-for': '203.0.113.10',
    },
  })

  const first = await enforceRateLimit(request, {
    scope: 'submit-feedback:burst',
    limit: 2,
    windowMs: 60_000,
  })
  const second = await enforceRateLimit(request, {
    scope: 'submit-feedback:burst',
    limit: 2,
    windowMs: 60_000,
  })
  const third = await enforceRateLimit(request, {
    scope: 'submit-feedback:burst',
    limit: 2,
    windowMs: 60_000,
  })

  assert.strictEqual(first.allowed, true)
  assert.strictEqual(first.remaining, 1)
  assert.strictEqual(second.allowed, true)
  assert.strictEqual(second.remaining, 0)
  assert.strictEqual(third.allowed, false)
  assert.strictEqual(third.retryAfterSeconds > 0, true)
})

test('request protection rejects oversized requests from headers', () => {
  const request = new Request('https://example.com/api/admin/login', {
    method: 'POST',
    headers: {
      'content-length': String(64 * 1024),
    },
  })

  const response = rejectIfRequestTooLarge(request, 16 * 1024)

  assert.ok(response)
  assert.strictEqual(response?.status, 413)
})