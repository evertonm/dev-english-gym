import { AdminDashboard } from './AdminDashboard'
import { disablePush, enablePush, pushHour, pushStatus, registerSW, reportState } from './push'
import type { PushStatus } from './push'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAction, useConvexAuth, useMutation, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { mountGym } from '@/gym/engine'
import type { GymHandle, GymProgress } from '@/gym/engine'

const LOCAL_KEY = 'devenglish'
// Which account this device's progress belongs to (empty = played as a guest).
const OWNER_KEY = 'devenglish-owner'
// Set just before a sign-in starts (survives the Google/LinkedIn redirect in this tab), so guest
// progress is only added on a real sign-in, never when an already signed-in session reloads.
const FRESH_KEY = 'devenglish-signin'
const markSignIn = () => {
  try {
    sessionStorage.setItem(FRESH_KEY, '1')
  } catch {
    /* ignore */
  }
}
const takeSignIn = () => {
  try {
    const v = sessionStorage.getItem(FRESH_KEY) === '1'
    sessionStorage.removeItem(FRESH_KEY)
    return v
  } catch {
    return false
  }
}
// Initials of the signed-in account, kept so a page refresh doesn't flash the signed-out screen
// while the session is being restored.
const WHO_KEY = 'devenglish-who'
const readWho = () => {
  try {
    return localStorage.getItem(WHO_KEY) || ''
  } catch {
    return ''
  }
}
const writeWho = (v: string) => {
  try {
    if (v) localStorage.setItem(WHO_KEY, v)
    else localStorage.removeItem(WHO_KEY)
  } catch {
    /* ignore */
  }
}
const readOwner = () => {
  try {
    return localStorage.getItem(OWNER_KEY) || ''
  } catch {
    return ''
  }
}
const writeOwner = (email: string) => {
  try {
    if (email) localStorage.setItem(OWNER_KEY, email)
    else localStorage.removeItem(OWNER_KEY)
  } catch {
    /* ignore */
  }
}

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

// "everton.martins@x.com" -> "EM"; "ana@x.com" -> "AN".
function initialsOf(email: string): string {
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  const s = parts.length >= 2 ? parts[0][0] + parts[1][0] : local.slice(0, 2)
  return s.toUpperCase()
}

// Days are stored as "2026-11-3" (unpadded); pad them so they compare correctly as strings.
const padDay = (d?: string) => (d ?? '').split('-').map((x, i) => (i ? x.padStart(2, '0') : x)).join('-')

const empty: GymProgress = { xp: 0, streak: 0, last: '', units: {}, lessons: {} }

// Combines this device's progress with the account's saved progress: best stars, highest XP and counters,
// newest streak (with its shields and today's goal), and the union of active days and badges.
function mergeProgress(a: Partial<GymProgress> | null, b: Partial<GymProgress> | null): GymProgress {
  const x = { ...empty, ...(a ?? {}) }
  const y = { ...empty, ...(b ?? {}) }
  const stars = (p: Record<string, number>, q: Record<string, number>) => {
    const out: Record<string, number> = { ...p }
    for (const [k, n] of Object.entries(q)) out[k] = Math.max(out[k] ?? 0, n)
    return out
  }
  const union = (p?: string[], q?: string[]) => Array.from(new Set([...(p ?? []), ...(q ?? [])]))
  const max = (p?: number, q?: number) => Math.max(p ?? 0, q ?? 0)
  const xDate = Date.parse(x.last) || 0
  const yDate = Date.parse(y.last) || 0
  const newer = xDate >= yDate ? x : y
  const sameDay = x.dayKey && x.dayKey === y.dayKey
  return {
    xp: Math.max(x.xp, y.xp),
    streak: newer.streak,
    last: newer.last,
    units: stars(x.units, y.units),
    lessons: stars(x.lessons, y.lessons),
    goal: newer.goal ?? x.goal ?? y.goal ?? 50,
    dayKey: newer.dayKey ?? '',
    dayXp: sameDay ? max(x.dayXp, y.dayXp) : (newer.dayXp ?? 0),
    freezes: newer.freezes ?? 0,
    days: union(x.days, y.days).slice(-60),
    badges: union(x.badges, y.badges),
    lvl: max(x.lvl, y.lvl),
    chats: max(x.chats, y.chats),
    reviews: max(x.reviews, y.reviews),
    goals: max(x.goals, y.goals),
    board: stars(x.board ?? {}, y.board ?? {}),
    // The account's roll wins: a guest roll only counts if the account hasn't rolled that day.
    diceDay: padDay(y.diceDay) >= padDay(x.diceDay) ? (y.diceDay ?? '') : (x.diceDay ?? ''),
    diceVal: padDay(y.diceDay) >= padDay(x.diceDay) ? (y.diceVal ?? 0) : (x.diceVal ?? 0),
    // Today's Termo: the copy with more guesses wins.
    termo: (() => {
      const a = x.termo, b = y.termo
      if (!a) return b
      if (!b) return a
      if (a.day !== b.day) return padDay(a.day) > padDay(b.day) ? a : b
      return b.guesses.length >= a.guesses.length ? b : a
    })(),
  }
}

// Random id for this browser, used only for anonymous usage metrics.
function anonId(): string {
  try {
    let id = localStorage.getItem('devenglish-anon')
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => (b % 36).toString(36)).join('')
      localStorage.setItem('devenglish-anon', id)
    }
    return id
  } catch {
    return 'nostorage00'
  }
}

type Modal = 'none' | 'login' | 'account' | 'admin'
const REVIEW_CHAT_KEY = 'devenglish-review-chat-after-login'

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
  const transcribe = useAction(api.ai.transcribe)
  const dueQuery = useQuery(api.mistakes.due, isAuthenticated ? {} : 'skip')
  const quotaQuery = useQuery(api.ai.quota, isAuthenticated ? {} : 'skip')
  const initials = initialsOf(me && me.ok ? me.email : '')
  const quota = quotaQuery && quotaQuery.ok ? quotaQuery : null
  const addMistake = useMutation(api.mistakes.add)
  const reviewMistake = useMutation(api.mistakes.review)
  const track = useMutation(api.analytics.track)
  const tts = useAction(api.tts.speak)
  const vapid = useQuery(api.push.publicKey)
  const pushSubscribe = useMutation(api.push.subscribe)
  const pushUnsubscribe = useMutation(api.push.unsubscribe)
  const pushState = useMutation(api.push.state)
  const pushInfo = useRef<{ status: PushStatus; hour: number }>({ status: 'unsupported', hour: pushHour() })
  const deleteAccount = useMutation(api.account.deleteAccount)
  const isAdmin = !!(quota && quota.admin)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const due = dueQuery && dueQuery.ok ? dueQuery.items : []
  const [modal, setModal] = useState<Modal>('none')
  // /admin opens the metrics panel directly (admins only); leaving the URL closes it.
  useEffect(() => {
    if (isAdmin && window.location.pathname === '/admin') setModal('admin')
    const onPop = () => setModal((m) => (m === 'admin' && window.location.pathname !== '/admin' ? 'none' : m))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isAdmin])
  const mergedFor = useRef<string | null>(null)
  const lastServer = useRef('')
  const email = me && me.ok ? me.email : ''

  // The engine is mounted once; it reads the latest values through this ref.
  const live = useRef({ vapid, pushSubscribe, pushUnsubscribe, pushState, isAuthenticated, isLoading, saveProgress, chat, correct, transcribe, tts, due, addMistake, reviewMistake, quota, initials, track })
  live.current = { vapid, pushSubscribe, pushUnsubscribe, pushState, isAuthenticated, isLoading, saveProgress, chat, correct, transcribe, tts, due, addMistake, reviewMistake, quota, initials, track }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const handle = mountGym(host, {
      initial: () => readLocal(),
      save: (p) => {
        writeLocal(p)
        if (pushInfo.current.status === 'on') void reportState(p.last || '', p.streak || 0, live.current.pushState)
        if (live.current.isAuthenticated) {
          void live.current.saveProgress(p).catch(() => undefined)
        }
      },
      // While the session is restoring, show the signed-in look if this device was signed in.
      isAuthed: () => live.current.isAuthenticated || (live.current.isLoading && !!readWho()),
      login: (next) => {
        if (next === 'review') {
          try { sessionStorage.setItem(REVIEW_CHAT_KEY, '1') } catch {}
        }
        setModal('login')
      },
      account: () => {
        if (live.current.isLoading) return
        setModal(live.current.isAuthenticated ? 'account' : 'login')
      },
      accountLabel: () =>
        live.current.isAuthenticated
          ? live.current.initials || readWho() || 'Conta'
          : live.current.isLoading && readWho()
            ? readWho()
            : 'Entrar',
      chat: (scenario, history, level) => live.current.chat({ scenario, history, level }),
      correct: (lessonId, text) => live.current.correct({ lessonId, text }),
      transcribe: (audio, mime) => live.current.transcribe({ audio, mime }),
      tts: (text, lang) => live.current.tts({ text, lang }),
      push: () => pushInfo.current,
      pushEnable: async (hour) => {
        const key = live.current.vapid
        if (!key) return pushInfo.current
        const status = await enablePush(key, anonId(), hour, live.current.pushSubscribe).catch(() => 'off' as PushStatus)
        pushInfo.current = { status, hour }
        if (status === 'on') {
          const p = readLocal()
          if (p) void reportState(p.last || '', p.streak || 0, live.current.pushState)
        }
        return pushInfo.current
      },
      pushDisable: async () => {
        const status = await disablePush(live.current.pushUnsubscribe)
        pushInfo.current = { ...pushInfo.current, status }
        return pushInfo.current
      },
      addMistake: (wrong, better, tip) => {
        if (!live.current.isAuthenticated) return
        void live.current.addMistake({ wrong, better, tip }).catch(() => undefined)
      },
      dueMistakes: () => {
        const now = Date.now()
        return live.current.due.filter((m) => m.due <= now)
      },
      quota: () => {
        const q = live.current.quota
        return q ? { used: q.used, limit: q.limit, rank: q.rank, next: q.next, admin: q.admin } : null
      },
      track: (name, props) => {
        void live.current.track({ name, anon: anonId(), props }).catch(() => undefined)
      },
      reviewMistake: (id, ok) => {
        void live.current.reviewMistake({ id: id as Id<'mistakes'>, ok }).catch(() => undefined)
      },
    })
    gymRef.current = handle
    setMounted(true)
    // Service worker for reminders; then read whether this browser already has them on.
    void registerSW().then(async () => {
      pushInfo.current = { status: await pushStatus(), hour: pushHour() }
      handle.refresh()
    })
    // One "open" per device per day: daily actives and retention.
    try {
      const d = new Date().toISOString().slice(0, 10)
      if (localStorage.getItem('devenglish-open') !== d) {
        localStorage.setItem('devenglish-open', d)
        void live.current.track({ name: 'open', anon: anonId() }).catch(() => undefined)
      }
    } catch {
      /* storage unavailable */
    }
    return () => {
      handle.destroy()
      gymRef.current = null
    }
  }, [])

  // Keep the header button and AI panel in sync with the sign-in state.
  useEffect(() => {
    gymRef.current?.refresh()
    if (isAuthenticated) {
      setModal((m) => (m === 'login' ? 'none' : m))
      const gym = gymRef.current
      if (gym) {
        let continueReview = false
        try {
          continueReview = sessionStorage.getItem(REVIEW_CHAT_KEY) === '1'
          sessionStorage.removeItem(REVIEW_CHAT_KEY)
        } catch {}
        if (continueReview) gym.openReviewChat()
      }
    }
    if (!isAuthenticated && !isLoading) mergedFor.current = null
  }, [isAuthenticated, isLoading, mounted])

  // Show the review card as soon as the due list changes.
  const dueCount = due.length
  const quotaKey = quota ? `${quota.used}/${quota.limit}/${quota.admin}` : ''
  useEffect(() => {
    gymRef.current?.refresh()
  }, [dueCount, quotaKey, initials, isAuthenticated, isLoading])
  useEffect(() => {
    if (isAuthenticated && initials) writeWho(initials)
    else if (!isAuthenticated && !isLoading) writeWho('')
  }, [isAuthenticated, isLoading, initials])

  // While signed in, pick up what other devices saved (finished squares, today's games, Termo guesses).
  // Merging only keeps the best of both, so nothing done here is lost.
  useEffect(() => {
    if (!isAuthenticated || !progress || !progress.ok || !progress.progress || !me || !me.ok) return
    if (mergedFor.current !== me.email) return
    const snap = JSON.stringify(progress.progress)
    if (snap === lastServer.current) return
    lastServer.current = snap
    const local = readLocal()
    const merged = mergeProgress(local, progress.progress)
    if (JSON.stringify(merged) === JSON.stringify({ ...empty, ...(local ?? {}) })) return
    writeLocal(merged)
    gymRef.current?.setState(merged)
  }, [isAuthenticated, progress, me])

  // After sign-in, merge this device's progress with the account's saved progress once.
  useEffect(() => {
    if (!isAuthenticated || !progress || !progress.ok || !me || !me.ok) return
    if (mergedFor.current === me.email) return
    mergedFor.current = me.email
    // Guest progress (no owner) is added to the account: stars/badges keep the best, XP is summed.
    // Progress left by another account on this device is never mixed in.
    const owner = readOwner()
    const local = readLocal()
    let merged: GymProgress
    if (owner && owner !== me.email) merged = mergeProgress(null, progress.progress)
    else if (takeSignIn() && !owner && local && (local.xp ?? 0) > 0 && progress.progress) {
      merged = mergeProgress(local, progress.progress)
      merged.xp = (progress.progress.xp ?? 0) + (local.xp ?? 0)
    } else merged = mergeProgress(local, progress.progress)
    writeOwner(me.email)
    lastServer.current = JSON.stringify(progress.progress)
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
      {modal === 'login' && <LoginSheet onClose={() => {
        try { sessionStorage.removeItem(REVIEW_CHAT_KEY) } catch {}
        setModal('none')
      }} />}
      {modal === 'account' && (
        <div className="sheet-bg" role="dialog" aria-label="Sua conta">
          <div className="sheet">
            <p className="sheet-title">Sua conta</p>
            <p className="note">
              Conectado como <b>{email || '…'}</b>. Seu progresso fica salvo e sincroniza em qualquer
              aparelho.
            </p>
            {isAdmin && (
              <button
                className="btn alt"
                type="button"
                onClick={() => {
                  try {
                    history.pushState({}, '', '/admin')
                  } catch {
                    /* ignore */
                  }
                  setModal('admin')
                }}
              >
                📊 Painel de métricas
              </button>
            )}
            <button
              className="btn alt"
              type="button"
              onClick={async () => {
                // Leaving clears this device, so the next person starts fresh.
                // The account keeps everything on the server and comes back on the next sign-in.
                await signOut()
                writeLocal(empty)
                writeOwner('')
                try {
                  localStorage.removeItem('devenglish-chatlv')
                } catch {
                  /* ignore */
                }
                gymRef.current?.reset()
                setModal('none')
              }}
            >
              Sair da conta
            </button>
            <button className="btn" type="button" onClick={() => setModal('none')}>
              Fechar
            </button>
            <p className="legal">
              <a href="/privacidade.html" target="_blank" rel="noopener">Privacidade</a> ·{' '}
              <a href="/termos.html" target="_blank" rel="noopener">Termos de uso</a>
            </p>
            <button
              className={'linkdanger' + (confirmDelete ? ' armed' : '')}
              type="button"
              onClick={async () => {
                if (!confirmDelete) {
                  setConfirmDelete(true)
                  return
                }
                await deleteAccount({}).catch(() => undefined)
                writeLocal(empty)
                writeOwner('')
                gymRef.current?.reset()
                await signOut()
                setConfirmDelete(false)
                setModal('none')
              }}
            >
              {confirmDelete ? 'Toque de novo para apagar tudo (não dá para desfazer)' : 'Excluir minha conta e meus dados'}
            </button>
          </div>
        </div>
      )}
      {modal === 'admin' && isAdmin && (
        <AdminDashboard
          onClose={() => {
            try {
              history.replaceState({}, '', '/perfil')
              window.dispatchEvent(new PopStateEvent('popstate'))
            } catch {
              /* ignore */
            }
            setModal('none')
          }}
        />
      )}
    </div>
  )
}

function LoginSheet({ onClose }: { onClose: () => void }) {
  const { signIn } = useAuthActions()
  const providers = useQuery(api.account.providers)
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const password = String(fd.get('password') ?? '')
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    fd.set('email', String(fd.get('email') ?? '').trim().toLowerCase())
    fd.set('flow', flow)
    setBusy(true)
    try {
      markSignIn()
      await signIn('password', fd)
    } catch (err) {
      const msg = String((err as Error)?.message ?? '')
      if (flow === 'signUp' && /EMAIL_IN_USE/.test(msg)) {
        setError('Esse e-mail já tem conta (talvez criada com Google ou LinkedIn). Entre pelo mesmo botão que usou antes.')
      } else if (flow === 'signUp' && /already exists/i.test(msg)) {
        setError('Esse e-mail já tem conta. Toque em "Já tenho conta" e entre com sua senha.')
      } else if (flow === 'signUp') {
        setError('Não consegui criar a conta. Confira o e-mail e tente de novo.')
      } else {
        setError('E-mail ou senha incorretos.')
      }
      setBusy(false)
    }
  }

  const signUp = flow === 'signUp'
  return (
    <div className="sheet-bg" role="dialog" aria-label={signUp ? 'Criar conta' : 'Entrar'}>
      <div className="sheet">
        <p className="sheet-title">{signUp ? 'Criar conta grátis' : 'Entrar'}</p>
        {(providers?.google || providers?.linkedin) && (
          <div className="social">
            {providers?.google && (
              <button className="btn social-btn" type="button" onClick={() => {
                markSignIn()
                void signIn('google', { redirectTo: window.location.origin })
              }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"/></svg>
                Continuar com Google
              </button>
            )}
            {providers?.linkedin && (
              <button className="btn social-btn" type="button" onClick={() => {
                markSignIn()
                void signIn('linkedin', { redirectTo: window.location.origin })
              }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" d="M7 9.5h2.6V18H7zM8.3 5.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11.2 9.5h2.5v1.2c.4-.7 1.3-1.4 2.7-1.4 2.8 0 3.3 1.8 3.3 4.2V18h-2.6v-4c0-1 0-2.2-1.3-2.2s-1.6 1-1.6 2.1V18h-2.6z"/></svg>
                Continuar com LinkedIn
              </button>
            )}
            <p className="or"><span>ou com e-mail</span></p>
          </div>
        )}
        <form onSubmit={submit} className="sheet-form">
          <p className="note">Salve seu progresso em qualquer aparelho e converse com a IA.</p>
          <input name="email" type="email" required autoComplete="email" placeholder="seu@email.com" aria-label="E-mail" />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={signUp ? 'new-password' : 'current-password'}
            placeholder={signUp ? 'Crie uma senha (mín. 8 caracteres)' : 'Sua senha'}
            aria-label="Senha"
          />
          <button className="btn" type="submit" disabled={busy}>
            {busy ? (signUp ? 'Criando…' : 'Entrando…') : signUp ? 'Criar conta' : 'Entrar'}
          </button>
          <button
            className="link"
            type="button"
            onClick={() => {
              setFlow(signUp ? 'signIn' : 'signUp')
              setError(null)
            }}
          >
            {signUp ? 'Já tenho conta' : 'Não tem conta? Criar agora'}
          </button>
        </form>
        {error && <p className="err">{error}</p>}
        <button className="btn alt" type="button" onClick={onClose}>
          Agora não
        </button>
        <p className="legal">
          Ao entrar, você concorda com os <a href="/termos.html" target="_blank" rel="noopener">Termos de uso</a> e a{' '}
          <a href="/privacidade.html" target="_blank" rel="noopener">Política de privacidade</a>.
        </p>
      </div>
    </div>
  )
}
