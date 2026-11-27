import test from 'node:test'
import assert from 'node:assert/strict'
import { createSpeechPlayer } from '../src/gym/speech.ts'

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

function setup(wait = 20) {
  const audio = {
    src: '', plays: 0, onended: null, onerror: null,
    pause() {},
    async play() { this.plays++ },
  }
  return { audio, voice: createSpeechPlayer(audio, () => {}, wait) }
}

test('two clicks on the same phrase produce one request and one playback', async () => {
  const { audio, voice } = setup()
  let requests = 0
  const fetchUrl = async () => { requests++; return 'audio.mp3' }
  const options = { fetchUrl, fallback: () => assert.fail('unexpected fallback') }
  voice.play('en|hello', options)
  voice.play('en|hello', options)
  await tick()
  voice.play('en|hello', options)
  assert.equal(requests, 1)
  assert.equal(audio.plays, 1)
  audio.onended()
})

test('a slow response falls back once and is cached for the next play', async () => {
  const { audio, voice } = setup(1)
  let resolveUrl
  let requests = 0
  let localPlays = 0
  let finishLocal
  const fetchUrl = () => { requests++; return new Promise(resolve => { resolveUrl = resolve }) }
  const options = { fetchUrl, fallback: done => { localPlays++; finishLocal = done } }
  voice.play('en|hello', options)
  await tick()
  assert.equal(localPlays, 1)
  voice.play('en|hello', options)
  resolveUrl('late.mp3')
  await tick()
  assert.equal(localPlays, 1)
  assert.equal(audio.plays, 0)
  finishLocal()
  voice.play('en|hello', options)
  await tick()
  assert.equal(requests, 1)
  assert.equal(audio.plays, 1)
  audio.onended()
})

test('switching phrases discards a previous result even when it arrives last', async () => {
  const { audio, voice } = setup()
  let resolveOld
  voice.play('en|first', { fetchUrl: () => new Promise(resolve => { resolveOld = resolve }) })
  voice.play('en|next', { fetchUrl: async () => 'next.mp3' })
  resolveOld('older.mp3')
  await tick()
  assert.equal(audio.src, 'next.mp3')
  assert.equal(audio.plays, 1)
  audio.onended()
})
