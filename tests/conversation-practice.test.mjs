import test from 'node:test'
import assert from 'node:assert/strict'
import { CONVERSATION_SCENARIOS, conversationSuggestion } from '../shared/conversation.ts'

test('a first conversation recommends a daily at zero XP', () => {
  const suggestion = conversationSuggestion(0, 0, Date.UTC(2026, 10, 27))
  assert.deepEqual(suggestion, { scenario: 'standup', first: true })
  const daily = CONVERSATION_SCENARIOS.find(scene => scene.id === suggestion.scenario)
  assert.equal(daily.xp, undefined)
  assert.match(daily.opening.reply, /blocked|blocker/i)
})

test('the board pauses recommendations for seven days after an interaction', () => {
  const lastInteraction = Date.UTC(2026, 10, 27, 18)
  const nextWeek = lastInteraction + 7 * 86_400_000
  assert.equal(conversationSuggestion(0, lastInteraction, nextWeek - 1), null)
  assert.equal(conversationSuggestion(6, lastInteraction, nextWeek - 1), null)
  assert.equal(conversationSuggestion(0, lastInteraction, nextWeek)?.first, false)
  const later = conversationSuggestion(6, lastInteraction, nextWeek)
  assert.equal(later?.first, false)
  assert.notEqual(later?.scenario, conversationSuggestion(6, lastInteraction, nextWeek + 7 * 86_400_000)?.scenario)
})

test('realistic DevOps and remote handoff exercises are available without grinding XP', () => {
  for (const [id, topic] of [['pipeline', /CI|pipeline/i], ['rollback', /roll back/i], ['handoff', /taking over|handoff/i]]) {
    const scenario = CONVERSATION_SCENARIOS.find(scene => scene.id === id)
    assert.ok(scenario, id)
    assert.equal(scenario.xp, undefined)
    assert.match(scenario.opening.reply, topic)
    assert.match(scenario.opening.reply, /\?$/)
    assert.ok(scenario.opening.pt && scenario.opening.hint && scenario.role)
  }
  assert.deepEqual(
    Object.fromEntries(CONVERSATION_SCENARIOS.filter(scene => scene.xp).map(scene => [scene.id, scene.xp])),
    { incident: 500, salary: 1500, cto: 3600 },
  )
})
