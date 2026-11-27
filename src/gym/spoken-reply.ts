export type ReplyPhase = 'waiting' | 'speaking' | 'opening' | 'recording' | 'transcribing' | 'ready'
type Transcription = { ok: boolean; text?: string; code?: string }

const MUTE_KEY = 'devenglish-coach-muted'

export function coachMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1' } catch { return false }
}

export function setCoachMuted(muted: boolean) {
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0') } catch { /* storage unavailable */ }
}

export function replyControls(phase: ReplyPhase, hasMicrophone: boolean) {
  return { canRecord: phase === 'ready' && hasMicrophone, canStop: phase === 'recording', canType: phase === 'ready' }
}

export function canRecordReply() {
  return typeof MediaRecorder !== 'undefined' && typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
}

export function createReplyRecorder(
  transcribe: (audio: ArrayBuffer, mime: string) => Promise<Transcription>,
  onPhase: (phase: ReplyPhase) => void,
  onText: (text: string) => void,
  onError: (message: string) => void,
) {
  type Recording = { stream?: MediaStream; recorder?: MediaRecorder; timer?: ReturnType<typeof setTimeout> }
  let active: Recording | null = null
  const release = (recording: Recording) => {
    clearTimeout(recording.timer)
    recording.stream?.getTracks().forEach(track => track.stop())
  }
  function stop() {
    const recorder = active?.recorder
    if (recorder?.state === 'recording') recorder.stop()
  }
  function end(recording: Recording, message?: string) {
    release(recording)
    if (active !== recording) return
    active = null
    onPhase('ready')
    if (message) onError(message)
  }
  async function start() {
    if (active || !canRecordReply()) return
    const recording: Recording = {}
    active = recording
    onPhase('opening')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      recording.stream = stream
      if (active !== recording) { release(recording); return }
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(type => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      recording.recorder = recorder
      const chunks: Blob[] = []
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => end(recording, 'O microfone parou. Tente gravar de novo ou digite sua resposta.')
      recorder.onstop = async () => {
        release(recording)
        if (active !== recording) return
        onPhase('transcribing')
        const audio = new Blob(chunks, { type: recorder.mimeType || mime || 'audio/webm' })
        try {
          if (!audio.size) { end(recording, 'Nenhuma fala foi captada. Tente de novo.'); return }
          const result = await transcribe(await audio.arrayBuffer(), audio.type)
          if (active !== recording) return
          if (result.ok && result.text?.trim()) {
            end(recording)
            onText(result.text.trim())
          } else {
            end(recording, result.code === 'LIMIT'
              ? 'Você atingiu o limite diário de voz. Pode continuar digitando.'
              : 'Não consegui transcrever. Tente de novo ou digite sua resposta.')
          }
        } catch {
          end(recording, 'Não consegui transcrever. Tente de novo ou digite sua resposta.')
        }
      }
      recorder.start()
      recording.timer = setTimeout(stop, 30_000)
      onPhase('recording')
    } catch {
      end(recording, 'Não consegui abrir o microfone. Confira a permissão ou prefira digitar.')
    }
  }
  function cancel() {
    const recording = active
    if (!recording) return
    active = null
    if (recording.recorder?.state === 'recording') recording.recorder.stop()
    release(recording)
  }
  return { start, stop, cancel }
}
