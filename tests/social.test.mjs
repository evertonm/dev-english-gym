import test from 'node:test'
import assert from 'node:assert/strict'
import { weekKey, prevWeek, placementLevel } from '../shared/week.ts'

test('weeks start on Monday (UTC)', () => {
  assert.equal(weekKey(Date.UTC(2026, 10, 26, 15)), '2026-11-23')
  assert.equal(weekKey(Date.UTC(2026, 10, 23, 0)), '2026-11-23')
  assert.equal(weekKey(Date.UTC(2026, 10, 29, 23, 59)), '2026-11-23')
  assert.equal(weekKey(Date.UTC(2026, 10, 30, 0)), '2026-11-30')
  assert.equal(weekKey(Date.UTC(2027, 0, 1)), '2026-12-28')
  assert.equal(prevWeek('2026-11-23'), '2026-11-16')
})

test('placement level needs every level below it', () => {
  assert.equal(placementLevel([0, 0, 0, 0, 0], 4), 0)
  assert.equal(placementLevel([3, 1, 3, 3, 3], 4), 1)
  assert.equal(placementLevel([2, 2, 2, 0, 3], 4), 3)
  assert.equal(placementLevel([3, 3, 3, 3, 3], 4), 4)
})
