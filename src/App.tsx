import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAction, useConvexAuth, useMutation, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { mountGym } from '@/gym/engine'
import type { GymHandle, GymProgress } from '@/gym/engine'

const LOCAL_KEY = 'devenglish'

function readLocal(): Partial<GymProgress> | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? (parsed as Partial<GymProgress>) : null
  } catch {
    return null
  }
}

function writeLocal(p: GymProgress) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(p))
  } catch {
    /* storage unavailable */
  }
}

const empty: GymProgress = { xp: 0, streak: 0, last: '', units: {}, lessons: {} }

// Combines this device's progress with the account's saved progress: best stars, highest XP, newest streak.
function mergeProgress(a: Partial<GymProgress> | null, b: Partial<GymProgress> | null): GymProgress {
  const x = { ...empty, ...(a ?? {}) }
  const y = { ...empty, ...(b ?? {}) }
  const stars = (p: Record<string, number>, q: Record<string, number>) => {
    const out: Record<string, number> = { ...p }
    for (const [k, n] of Object.entries(q)) out[k] = Math.max(out[k] ?? 0, n)
    return out
  }
  const xDate = Date.parse(x.last) || 0
  const yDate = Date.parse(y.last) || 0
  const newer = xDate >= yDate ? x : y
  return {
    xp: Math.max(x.xp, y.xp),
    streak: newer.streak,
    last: newer.last,
    units: stars(x.units, y.units),
    lessons: stars(x.lessons, y.lessons),
  }
}

type Modal = 'none' | 'login' | 'account'

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null)
  const gymRef = useRef<GymHandle | null>(null)
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signOut } = useAuthActions()
  const progress = useQuery(api.progress.get, isAuthenticated ? {} : 'skip')
  const me = useQuery(api.progress.me, isAuthenticated ? {} : 'skip')
  const saveProgress = useMutation(api.progress.save)
  const chat = useAction(api.ai.chat)
  const correct = useAction(api.ai.correct)
  const dueQuery = useQuery(api.mistakes.due, isAuthenticated ? {} : 'skip')
  const addMistake = useMutation(api.mistakes.add)
  const reviewMistake = useMutation(api.mistakes.review)
  const due = dueQuery && dueQuery.ok ? dueQuery.items : []
  const [modal, setModal] = useState<Modal>('none')
  const mergedFor = useRef<string | null>(null)
  const email = me && me.ok ? me.email : ''

  // The engine is mounted once; it reads the latest values through this ref.
  const live = useRef({ isAuthenticated, saveProgress, chat, correct, due, addMistake, reviewMistake })
  live.current = { isAuthenticated, saveProgress, chat, correct, due, addMistake, reviewMistake }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const handle = mountGym(host, {
      initial: () => readLocal(),
      save: (p) => {
        writeLocal(p)
        if (live.current.isAuthenticated) {
          void live.current.saveProgress(p).catch(() => undefined)
        }
      },
      isAuthed: () => live.current.isAuthenticated,
      login: () => setModal('login'),
      account: () => setModal(live.current.isAuthenticated ? 'account' : 'login'),
      accountLabel: () => (live.current.isAuthenticated ? 'Conta' : 'Entrar'),
      chat: (scenario, history) => live.current.chat({ scenario, history }),
      correct: (lessonId, text) => live.current.correct({ lessonId, text }),
      addMistake: (wrong, better, tip) => {
        if (!live.current.isAuthenticated) return
        void live.current.addMistake({ wrong, better, tip }).catch(() => undefined)
      },
      dueMistakes: () => {
        const now = Date.now()
        return live.current.due.filter((m) => m.due <= now)
      },
      reviewMistake: (id, ok) => {
        void live.current.reviewMistake({ id: id as Id<'mistakes'>, ok }).catch(() => undefined)
      },
    })
    gymRef.current = handle
    setMounted(true)
    return () => {
      handle.destroy()
      gymRef.current = null
    }
  }, [])

  // Keep the header button and AI panel in sync with the sign-in state.
  useEffect(() => {
    gymRef.current?.refresh()
    if (isAuthenticated) setModal((m) => (m === 'login' ? 'none' : m))
    if (!isAuthenticated && !isLoading) mergedFor.current = null
  }, [isAuthenticated, isLoading, mounted])

  // Show the review card as soon as the due list changes.
  const dueCount = due.length
  useEffect(() => {
    gymRef.current?.refresh()
  }, [dueCount])

  // After sign-in, merge this device's progress with the account's saved progress once.
  useEffect(() => {
    if (!isAuthenticated || !progress || !progress.ok || !me || !me.ok) return
    if (mergedFor.current === me.email) return
    mergedFor.current = me.email
    const merged = mergeProgress(readLocal(), progress.progress)
    writeLocal(merged)
    gymRef.current?.setState(merged)
    void saveProgress(merged).catch(() => undefined)
  }, [isAuthenticated, progress, me, saveProgress])

  return (
    <div className="gym">
      {!mounted && (
        <div className="boot" aria-hidden="true">
          Dev English
        </div>
      )}
      <div ref={hostRef} style={{ height: '100%' }} />
      {modal === 'login' && <LoginSheet onClose={() => setModal('none')} />}
      {modal === 'account' && (
        <div className="sheet-bg" role="dialog" aria-label="Sua conta">
          <div className="sheet">
            <p className="sheet-title">Sua conta</p>
            <p className="note">
              Conectado como <b>{email || '…'}</b>. Seu progresso fica salvo e sincroniza em qualquer
              aparelho.
            </p>
            <button
              className="btn alt"
              type="button"
              onClick={() => {
                void signOut()
                setModal('none')
              }}
            >
              Sair da conta
            </button>
            <button className="btn" type="button" onClick={() => setModal('none')}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LoginSheet({ onClose }: { onClose: () => void }) {
  const { signIn } = useAuthActions()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submitEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const fd = new FormData(e.currentTarget)
      setEmail(String(fd.get('email') ?? ''))
      await signIn('resend-otp', fd)
      setStep('code')
    } catch {
      setError('Não consegui enviar o código. Confira o e-mail e tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signIn('resend-otp', new FormData(e.currentTarget))
    } catch {
      setError('Código inválido ou expirado. Tente de novo.')
      setBusy(false)
    }
  }

  return (
    <div className="sheet-bg" role="dialog" aria-label="Entrar">
      <div className="sheet">
        <p className="sheet-title">{step === 'email' ? 'Entrar ou criar conta' : 'Digite o código'}</p>
        {step === 'email' ? (
          <form onSubmit={submitEmail} className="sheet-form">
            <p className="note">
              Salve seu progresso em qualquer aparelho e converse com a IA. Enviamos um código de 6
              dígitos para o seu e-mail, sem senha.
            </p>
            <input name="email" type="email" required autoComplete="email" placeholder="seu@email.com" aria-label="E-mail" />
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Enviando…' : 'Receber código'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="sheet-form">
            <p className="note">Enviamos o código para {email}. Confira também o spam.</p>
            <input
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
              placeholder="000000"
              aria-label="Código de 6 dígitos"
            />
            <input name="email" type="hidden" value={email} />
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
            <button className="link" type="button" onClick={() => setStep('email')}>
              Usar outro e-mail
            </button>
          </form>
        )}
        {error && <p className="err">{error}</p>}
        <button className="btn alt" type="button" onClick={onClose}>
          Agora não
        </button>
      </div>
    </div>
  )
}
