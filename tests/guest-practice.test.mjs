import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addGuestCompletion,
  guestActivitiesFromProgress,
  guestRemaining,
  parseLoginResume,
} from '../src/gym/guest-practice.ts'

test('counts distinct activities and caps the guest allowance at three', () => {
  let done = addGuestCompletion([], 'workout:pr-query-timeout')
  done = addGuestCompletion(done, 'workout:pr-query-timeout')
  assert.equal(guestRemaining(done), 2)
  done = addGuestCompletion(done, 'lesson:past')
  done = addGuestCompletion(done, 'game:termo')
  assert.equal(guestRemaining(done), 0)
  assert.deepEqual(addGuestCompletion(done, 'game:daily'), done)
})

test('uses existing guest activities and ignores dice, chests and duplicate board entries', () => {
  assert.deepEqual(guestActivitiesFromProgress({
    units: { standup: 2 },
    lessons: { past: 1 },
    board: { w0t3: 1, w0t6: 0, 'termo:2026-11-13': 2, 'termo:2026-11-14': 1, 'pr-query-timeout': 20261113 },
  }, ['w0t6'], ['pr-query-timeout']), ['unit:standup', 'lesson:past', 'game:termo'])
  assert.deepEqual(guestActivitiesFromProgress({
    xp: 80,
    board: { w0t3: 1, w0t9: 1 },
  }, ['w0t6'], ['pr-query-timeout']), [])
})

test('validates pending login destinations without accepting URLs or arbitrary routes', () => {
  assert.deepEqual(parseLoginResume('{"target":"game:xword","limited":true}'), { target: 'game:xword', limited: true })
  assert.deepEqual(parseLoginResume('{"target":"review-chat","limited":false}'), { target: 'review-chat', limited: false })
  assert.deepEqual(parseLoginResume('{"target":"placement:w2t15","limited":true}'), { target: 'placement:w2t15', limited: true })
  assert.equal(parseLoginResume('{"target":"https://example.com","limited":true}'), null)
  assert.equal(parseLoginResume('{"target":"game:unknown","limited":true}'), null)
  assert.equal(parseLoginResume('{"target":"review-chat","limited":"true"}'), null)
  assert.equal(parseLoginResume('bad JSON'), null)
})
