import assert from 'node:assert/strict'
import { test } from 'node:test'
import { highestUnlockedWorld, worldUnlocked } from '../src/gym/world-progression.ts'

test('regular cleared squares do not unlock the next world', () => {
  const board = { w0t1: 1, w0t11: 1, w1t14: 1 }
  assert.equal(worldUnlocked(board, 0), true)
  assert.equal(worldUnlocked(board, 1), false)
  assert.equal(worldUnlocked(board, 2), false)
  assert.equal(highestUnlockedWorld(board, 5), 0)
})

test('the senior world requires the preceding boss, including a placement victory', () => {
  assert.equal(worldUnlocked({ w0t15: 1 }, 2), false)
  assert.equal(worldUnlocked({ w1t15: 1 }, 2), true)
  assert.equal(worldUnlocked({ w1t15: 1 }, 1), false)
  assert.equal(highestUnlockedWorld({ w1t15: 1, w4t15: 1 }, 5), 2)
})
