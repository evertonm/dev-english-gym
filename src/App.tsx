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

// "everton.martins@x.com" -> "EM"; "ana@x.com" -> "AN".
function initialsOf(email: string): string {
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  const s = parts.length >= 2 ? parts[0][0] + parts[1][0] : local.slice(0, 2)
  return s.toUpperCase()
}

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
    board: { ...(x.board ?? {}), ...(y.board ?? {}) },
    diceDay: newer.diceDay ?? '',
    diceVal: newer.diceVal ?? 0,
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

type Stats = NonNullable<ReturnType<typeof useQuery<typeof api.analytics.summary>>>

function AdminSheet({ stats, onClose }: { stats: Stats; onClose: () => void }) {
  const pct = (n: number | null) => (n === null ? '—' : Math.round(n * 100) + '%')
  const days = [...stats.days].reverse()
  const cols: [string, string][] = [
    ['devices', 'Ativos'],
    ['signup', 'Cadastros'],
    ['lesson_done', 'Aulas'],
    ['unit_done', 'Treinos'],
    ['board_done', 'Casas'],
    ['ai_call', 'IA'],
    ['ai_limit', 'Limite'],
    ['stt', 'Voz'],
  ]
  return (
    <div className="sheet-bg" role="dialog" aria-label="Painel de métricas">
      <div className="sheet admin">
        <p className="sheet-title">Painel de métricas</p>
        <div className="kpis">
          <div><b>{stats.users}</b>contas</div>
          <div><b>{pct(stats.d1)}</b>voltam no dia seguinte<small>{stats.d1n} aparelhos</small></div>
          <div><b>{pct(stats.d7)}</b>voltam após 7 dias<small>{stats.d7n} aparelhos</small></div>
        </div>
        <div className="tablebox">
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                {cols.map(([, label]) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.day}>
                  <td>{d.day.slice(5).split('-').reverse().join('/')}</td>
                  {cols.map(([k]) => (
                    <td key={k}>{(d as Record<string, number | string>)[k] ?? 0}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">Últimos 14 dias (UTC). "Ativos" = aparelhos que abriram o app. "Limite" = vezes que alguém bateu o limite diário da IA.</p>
        <button className="btn" type="button" onClick={onClose}>
          Voltar
        </button>
      </div>
    </div>
  )
}

type Modal = 'none' | 'login' | 'account' | 'admin'

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
  const deleteAccount = useMutation(api.account.deleteAccount)
  const stats = useQuery(api.analytics.summary, isAuthenticated ? {} : 'skip')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const due = dueQuery && dueQuery.ok ? dueQuery.items : []
  const [modal, setModal] = useState<Modal>('none')
  const mergedFor = useRef<string | null>(null)
  const email = me && me.ok ? me.email : ''

  // The engine is mounted once; it reads the latest values through this ref.
  const live = useRef({ isAuthenticated, saveProgress, chat, correct, transcribe, due, addMistake, reviewMistake, quota, initials, track })
  live.current = { isAuthenticated, saveProgress, chat, correct, transcribe, due, addMistake, reviewMistake, quota, initials, track }

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
      accountLabel: () => (live.current.isAuthenticated ? live.current.initials || 'Conta' : 'Entrar'),
      chat: (scenario, history) => live.current.chat({ scenario, history }),
      correct: (lessonId, text) => live.current.correct({ lessonId, text }),
      transcribe: (audio, mime) => live.current.transcribe({ audio, mime }),
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
        return q ? { used: q.used, limit: q.limit, rank: q.rank, next: q.next } : null
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
    if (isAuthenticated) setModal((m) => (m === 'login' ? 'none' : m))
    if (!isAuthenticated && !isLoading) mergedFor.current = null
  }, [isAuthenticated, isLoading, mounted])

  // Show the review card as soon as the due list changes.
  const dueCount = due.length
  const quotaKey = quota ? `${quota.used}/${quota.limit}` : ''
  useEffect(() => {
    gymRef.current?.refresh()
  }, [dueCount, quotaKey, initials])

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
            {stats && (
              <button className="btn alt" type="button" onClick={() => setModal('admin')}>
                📊 Painel de métricas
              </button>
            )}
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
                gymRef.current?.setState(empty)
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
      {modal === 'admin' && stats && <AdminSheet stats={stats} onClose={() => setModal('account')} />}
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
      await signIn('password', fd)
    } catch (err) {
      const msg = String((err as Error)?.message ?? '')
      if (flow === 'signUp' && /already exists/i.test(msg)) {
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
              <button className="btn social-btn" type="button" onClick={() => void signIn('google', { redirectTo: window.location.origin })}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"/></svg>
                Continuar com Google
              </button>
            )}
            {providers?.linkedin && (
              <button className="btn social-btn" type="button" onClick={() => void signIn('linkedin', { redirectTo: window.location.origin })}>
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
