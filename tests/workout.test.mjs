import assert from 'node:assert/strict'
import { test } from 'node:test'
import { brasiliaDay, summarizeWorkout, workoutForDay, WORKOUT_EVENTS, WORKOUT_IDS, workoutEventAllowed } from '../shared/workout.ts'

const [first, followUp] = WORKOUT_IDS

test('practice and analytics switch days at midnight in Brasília', () => {
  assert.equal(brasiliaDay(Date.parse('2026-11-25T02:59:59Z')), '2026-11-24')
  assert.equal(brasiliaDay(Date.parse('2026-11-25T03:00:00Z')), '2026-11-25')
})

test('offers the follow-up in a new calendar day even across months', () => {
  assert.equal(workoutForDay({}, 20261231), first)
  assert.equal(workoutForDay({ [first]: 20261231 }, 20261231), first)
  assert.equal(workoutForDay({ [first]: 20261231 }, 20270101), followUp)
  assert.equal(workoutForDay({ [first]: 20261231, [followUp]: 20270101 }, 20270102), followUp)
})

test('workout events only accept published scenario IDs', () => {
  assert.equal(workoutEventAllowed(WORKOUT_EVENTS.submitted, first), true)
  assert.equal(workoutEventAllowed(WORKOUT_EVENTS.submitted, 'My private answer'), false)
  assert.equal(workoutEventAllowed(WORKOUT_EVENTS.completed, undefined), false)
  assert.equal(workoutEventAllowed('lesson_done', 'standup'), true)
})

test('counts unique devices and only measures follow-up after a complete observation window', () => {
  const event = (name, anon, day, props = first) => ({ name, anon, day, props })
  const { offered, started, submitted, completed } = WORKOUT_EVENTS
  const events = [
    event(offered, 'a', '2026-11-01'),
    event(offered, 'a', '2026-11-01'),
    event(started, 'a', '2026-11-01'),
    event(submitted, 'a', '2026-11-01'),
    event(completed, 'a', '2026-11-01'),
    event(completed, 'a', '2026-11-08', followUp),
    event(completed, 'b', '2026-11-01'),
    event(completed, 'b', '2026-11-01', followUp),
    event(completed, 'c', '2026-11-05'),
    event(completed, 'd', '2026-11-01'),
    event(completed, 'd', '2026-11-09', followUp),
    event(completed, 'e', '2026-10-31'),
    event(completed, 'e', '2026-11-01'),
  ].reverse()
  assert.deepEqual(summarizeWorkout(events, '2026-11-01', '2026-11-10'), {
    offered: 1, started: 1, submitted: 1, completed: 5, eligible: 3, returned: 1,
  })
})
