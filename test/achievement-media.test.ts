import test from 'node:test'
import assert from 'node:assert'
import { isSupportedAchievementImageType, isAchievementImageTooLarge } from '../lib/achievement-media'

test('achievement media validation helpers', () => {
  assert.strictEqual(isSupportedAchievementImageType('image/png'), true)
  assert.strictEqual(isSupportedAchievementImageType('image/jpeg'), true)
  assert.strictEqual(isSupportedAchievementImageType('text/plain'), false)

  assert.strictEqual(isAchievementImageTooLarge(5 * 1024 * 1024), true)
  assert.strictEqual(isAchievementImageTooLarge(1024), false)
})
