import test from 'node:test'
import assert from 'node:assert/strict'
import { replyControls } from '../src/gym/spoken-reply.ts'

test('recording requires an explicit click after the other person finishes speaking', () => {
  for (const phase of ['waiting', 'speaking', 'opening', 'transcribing']) {
    assert.equal(replyControls(phase, true).canRecord, false)
  }
  assert.deepEqual(replyControls('ready', true), { canRecord: true, canStop: false, canType: true })
  assert.equal(replyControls('recording', true).canStop, true)
  assert.equal(replyControls('ready', false).canRecord, false)
})
