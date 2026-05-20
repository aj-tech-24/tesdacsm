import test from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToString } from 'react-dom/server'
import AchievementPreview from '../components/achievement-preview'

test('AchievementPreview renders title, description and image', () => {
  const html = renderToString(
    React.createElement(AchievementPreview, { title: 'Award', description: 'Great work', image: '/uploads/achievements/test.jpg', iconName: 'StarIcon' })
  )

  assert.ok(html.includes('Award'))
  assert.ok(html.includes('Great work'))
  assert.ok(html.includes('/uploads/achievements/test.jpg'))
  assert.ok(html.includes('StarIcon'))
})

test('AchievementPreview renders fallback when no image', () => {
  const html = renderToString(
    React.createElement(AchievementPreview, { title: 'NoImg', description: 'No image provided', image: null, iconName: null })
  )

  assert.ok(html.includes('No image provided'))
  assert.ok(html.includes('StarIcon'))
})
