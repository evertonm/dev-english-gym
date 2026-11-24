import assert from 'node:assert/strict'
import { test } from 'node:test'
import { summarizeGuestLimit } from '../shared/guest-metrics.ts'

test('deduplicates invitations and measures practice return across linked devices', () => {
  const event = (name, day, anon, userId) => ({ name, day, anon, userId })
  const events = [
    event('guest_limit_seen', '2026-11-01', 'first'),
    event('guest_limit_seen', '2026-11-01', 'first'),
    event('guest_limit_seen', '2026-11-02', 'second'),
    event('guest_limit_seen', '2026-11-11', 'recent'),
    event('guest_limit_signed_in', '2026-11-01', 'first', 'a'),
    event('guest_limit_signed_in', '2026-11-02', 'second', 'b'),
    event('guest_limit_signed_in', '2026-11-11', 'recent', 'c'),
    event('guest_limit_signed_in', '2026-11-01', 'no-invitation', 'd'),
    event('workout_completed', '2026-11-08', 'different-device', 'a'),
    event('lesson_done', '2026-11-02', 'second', 'b'),
    event('open', '2026-11-03', 'second', 'b'),
    event('unit_done', '2026-11-10', 'second', 'b'),
  ].reverse()
  assert.deepEqual(summarizeGuestLimit(events, '2026-11-13'), {
    seen: 3, signedIn: 3, eligible: 2, returned: 1,
  })
})
