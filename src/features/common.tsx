import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

// Parses the JSON object a model returned, tolerating code fences or text around it.
export function parseJson<T>(text: string): T | null {
  const s = text.replace(/```(?:json)?/gi, '')
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  if (a < 0 || b <= a) return null
  try {
    return JSON.parse(s.slice(a, b + 1)) as T
  } catch {
    return null
  }
}

export function aiError(code: string): string {
  if (code === 'LIMIT') return 'Você usou todas as mensagens com a IA de hoje. Volte amanhã ou suba de patente para ganhar mais.'
  if (code === 'BUSY') return 'A IA está muito ocupada agora. Tente de novo em alguns minutos.'
  if (code === 'UNAUTHENTICATED') return 'Entre na sua conta para usar a IA.'
  if (code === 'BAD_INPUT') return 'Não deu para enviar esse texto. Confira e tente de novo.'
  return 'Algo deu errado. Tente de novo.'
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Full-screen view with a close button; Esc closes it and focus starts inside.
export function FullPanel({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('.fx-x')?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fx" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
      <div className="fx-top">
        <button className="fx-x" type="button" aria-label="Fechar" onClick={onClose}>
          <Icon name="x" />
        </button>
        <h2>{title}</h2>
      </div>
      <div className="fx-body">
        <div className="fx-in">{children}</div>
      </div>
      {footer && <div className="fx-foot">{footer}</div>}
    </div>
  )
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([k, t]) => (
        <button key={k} type="button" className="pill" aria-pressed={value === k} onClick={() => onChange(k)}>
          {t}
        </button>
      ))}
    </div>
  )
}

export function NeedLogin({ text, onLogin }: { text: string; onLogin: () => void }) {
  return (
    <div className="card">
      <p style={{ margin: 0 }}>{text}</p>
      <button className="btn" type="button" onClick={onLogin}>
        Entrar grátis
      </button>
    </div>
  )
}

// Plays text with the app's natural voice (cached on the server).
let current: HTMLAudioElement | null = null
export function stopVoice() {
  if (current) {
    current.pause()
    current = null
  }
}
export async function playVoice(tts: ((a: { text: string; lang: 'pt' | 'en' }) => Promise<{ ok: boolean; url?: string }>) | null, text: string) {
  stopVoice()
  if (tts) {
    try {
      const r = await tts({ text: text.slice(0, 600), lang: 'en' })
      if (r.ok && r.url) {
        current = new Audio(r.url)
        await current.play()
        return
      }
    } catch {
      /* fall back to the browser voice */
    }
  }
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
  } catch {
    /* no voice available */
  }
}
