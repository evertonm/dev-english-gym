type AudioPlayer = Pick<HTMLAudioElement, 'src' | 'playbackRate' | 'play' | 'pause' | 'onended' | 'onerror'>
type SpeechOptions = {
  fetchUrl?: () => Promise<string | undefined>
  fallback?: (done: () => void) => void
  done?: () => void
  rate?: number
}
type Playback = { key: string; rate: number; local: boolean; timer?: ReturnType<typeof setTimeout> }

export function createSpeechPlayer(audio: AudioPlayer | null, cancelLocal: () => void, waitMs = 650) {
  const urls = new Map<string, string>()
  const pending = new Map<string, Promise<string | undefined>>()
  let active: Playback | null = null
  let unlocked = false

  // Prime the audio element from a user gesture before asynchronous replies arrive.
  function unlock() {
    if (!audio || active || unlocked) return
    unlocked = true
    audio.src = 'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='
    void audio.play().catch(() => { unlocked = false })
  }

  function stop() {
    const previous = active
    active = null
    if (previous?.timer !== undefined) clearTimeout(previous.timer)
    if (audio) {
      audio.onended = null
      audio.onerror = null
      audio.pause()
    }
    if (previous?.local) cancelLocal()
  }

  function requestUrl(key: string, fetchUrl: NonNullable<SpeechOptions['fetchUrl']>) {
    const cached = urls.get(key)
    if (cached) return Promise.resolve(cached)
    const inFlight = pending.get(key)
    if (inFlight) return inFlight
    const request = fetchUrl().then(url => {
      if (url) urls.set(key, url)
      return url
    }).catch(() => undefined).finally(() => pending.delete(key))
    pending.set(key, request)
    return request
  }

  function play(key: string, options: SpeechOptions) {
    const rate = options.rate ?? 1
    if (active?.key === key && active.rate === rate) return
    stop()
    const line: Playback = { key, rate, local: false }
    active = line

    function finish() {
      if (active !== line) return
      if (line.timer !== undefined) clearTimeout(line.timer)
      active = null
      options.done?.()
    }

    function playLocal() {
      if (active !== line || line.local) return
      if (line.timer !== undefined) clearTimeout(line.timer)
      line.local = true
      if (audio) {
        audio.onended = null
        audio.onerror = null
        audio.pause()
      }
      try {
        if (options.fallback) options.fallback(finish)
        else finish()
      } catch {
        finish()
      }
    }

    if (!audio || !options.fetchUrl) {
      playLocal()
      return
    }

    const player = audio
    if (options.fallback) line.timer = setTimeout(playLocal, waitMs)
    void requestUrl(key, options.fetchUrl).then(async url => {
      if (active !== line || line.local) return
      if (!url) {
        playLocal()
        return
      }
      try {
        player.onended = finish
        player.onerror = () => {
          urls.delete(key)
          playLocal()
        }
        player.src = url
        player.playbackRate = rate
        await player.play()
        if (line.timer !== undefined) clearTimeout(line.timer)
      } catch {
        playLocal()
      }
    })
  }

  return { play, stop, unlock }
}
