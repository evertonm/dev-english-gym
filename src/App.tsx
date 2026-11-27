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
import { GUEST_PRACTICE_LIMIT, parseLoginResume } from '@/gym/guest-practice'
import type { LoginResume } from '@/gym/guest-practice'
import { GUEST_LIMIT_SEEN, GUEST_LIMIT_SIGNED_IN } from '../shared/guest-metrics'
import { InterviewPanel } from './features/Interview'
import { ToolsPanel } from './features/Tools'
import { CertsPanel, InvitePanel, LeaguePanel, ReportPanel } from './features/Social'
import { Onboarding } from './features/Onboarding'
import { Icon } from './features/Icon'
import type { OnboardChoice } from './features/Onboarding'
import { APP_ADMIN, APP_HOME, APP_PANELS, APP_TABS, normalizedPath } from '../shared/routes'

// Full-screen panels opened from the engine; each has its own URL.
const panelFromPath = (): string | null => {
  const path = normalizedPath(location.pathname)
  for (const key in APP_PANELS) if (APP_PANELS[key] === path) return key
  return null
}
const lsGet = (k: string) => {
  try {
    return localStorage.getItem(k) || ''
  } catch {
    return ''
  }
}
const lsSet = (k: string, v: string) => {
  try {
    if (v) localStorage.setItem(k, v)
    else localStorage.removeItem(k)
  } catch {
    /* ignore */
  }
}
const REF_KEY = 'devenglish-ref'
const ONBOARD_KEY = 'devenglish-onboarded'
const REPORT_KEY = 'devenglish-report-week'
// An invite link (?ref=CODE) is remembered until the visitor signs in, then claimed once.
{
  try {
    const u = new URL(location.href)
    const ref = u.searchParams.get('ref')
    if (ref && /^[a-z0-9]{6}$/i.test(ref)) {
      lsSet(REF_KEY, ref.toLowerCase())
      u.searchParams.delete('ref')
      history.replaceState(history.state, '', u.pathname + u.search + u.hash)
    }
  } catch {
    /* ignore */
  }
}

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

type Modal = 'none' | 'login' | 'guest-login' | 'account' | 'admin'
const LOGIN_RESUME_KEY = 'devenglish-resume-after-login'

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null)
  const gymRef = useRef<GymHandle | null>(null)
  const loginResume = useRef<LoginResume | null>(null)
  const loginTrigger = useRef<HTMLElement | null>(null)
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
  const [requestedLogin] = useState(() => new URLSearchParams(location.search).get('entrar') === '1')
  const [modal, setModal] = useState<Modal>(requestedLogin ? 'login' : 'none')
  const [panel, setPanel] = useState<string | null>(null)
  const panelBack = useRef(APP_HOME)
  const [onboard, setOnboard] = useState(() => {
    if (normalizedPath(location.pathname) !== APP_HOME || requestedLogin || new URLSearchParams(location.search).has('code') || readWho() || lsGet(ONBOARD_KEY)) return false
    const p = readLocal()
    return !p || !(p.xp && p.xp > 0)
  })
  useEffect(() => {
    if (!requestedLogin) return
    const url = new URL(location.href)
    url.searchParams.delete('entrar')
    history.replaceState(history.state, '', url)
  }, [requestedLogin])
  const [notice, setNotice] = useState('')
  const claimReferral = useMutation(api.social.claimReferral)
  const weekly = useQuery(api.social.weeklyReport, isAuthenticated ? {} : 'skip')
  const openPanel = (name: string) => {
    const key = name.split(':')[0]
    if (!APP_PANELS[key]) return
    if (!panelFromPath()) panelBack.current = location.pathname
    try {
      history.pushState({ panel: name }, '', APP_PANELS[key])
    } catch {
      /* ignore */
    }
    setPanel(name)
  }
  const closePanel = () => {
    setPanel(null)
    try {
      history.replaceState({}, '', panelBack.current)
      window.dispatchEvent(new PopStateEvent('popstate'))
      if (panel === 'interview' && panelBack.current === APP_TABS.chat) {
        requestAnimationFrame(() => hostRef.current?.querySelector<HTMLElement>('[data-panel="interview"]')?.focus())
      }
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    const onPop = () => {
      const key = panelFromPath()
      const stored = history.state?.panel
      setPanel(key && typeof stored === 'string' && stored.split(':')[0] === key ? stored : key)
    }
    window.addEventListener('popstate', onPop)
    onPop()
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  // Claim a saved invite once signed in.
  useEffect(() => {
    const code = lsGet(REF_KEY)
    if (!isAuthenticated || !code) return
    void claimReferral({ code })
      .then((r) => {
        lsSet(REF_KEY, '')
        if (r.ok) setNotice(`Convite aceito: você ganhou +${r.ai} mensagens por dia com a IA durante ${r.days} dias.`)
      })
      .catch(() => undefined)
  }, [isAuthenticated, claimReferral])
  // Once a week, show how last week went (only to people who trained last week).
  useEffect(() => {
    if (!weekly || weekly.lastXp <= 0 || lsGet(REPORT_KEY) === weekly.week || panel || modal !== 'none' || onboard) return
    lsSet(REPORT_KEY, weekly.week)
    openPanel('report')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekly])
  const finishOnboarding = (c: OnboardChoice) => {
    lsSet(ONBOARD_KEY, c.purpose || '1')
    setOnboard(false)
    void track({ name: 'onboard', anon: anonId(), props: (c.purpose || 'none') + ':' + c.goal }).catch(() => undefined)
    gymRef.current?.patch({ goal: c.goal })
    if (c.placement) gymRef.current?.startPlacement()
  }
  // The admin URL opens the metrics panel for administrators.
  useEffect(() => {
    const onPop = () => {
      const adminRoute = normalizedPath(location.pathname) === APP_ADMIN
      setModal(current => (adminRoute && isAdmin ? 'admin' : current === 'admin' ? 'none' : current))
    }
    onPop()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isAdmin])
  const mergedFor = useRef<string | null>(null)
  const lastServer = useRef('')
  const email = me && me.ok ? me.email : ''
  const conversationAccount = me && me.ok && progress?.ok ? me.userId : null

  // The engine is mounted once; it reads the latest values through this ref.
  const live = useRef({ vapid, pushSubscribe, pushUnsubscribe, pushState, isAuthenticated, isLoading, saveProgress, chat, correct, transcribe, tts, due, addMistake, reviewMistake, quota, initials, track, conversationAccount })
  live.current = { vapid, pushSubscribe, pushUnsubscribe, pushState, isAuthenticated, isLoading, saveProgress, chat, correct, transcribe, tts, due, addMistake, reviewMistake, quota, initials, track, conversationAccount }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const handle = mountGym(host, {
      initial: () => readLocal(),
      initialGuestProgress: () => readOwner() ? null : readLocal(),
      save: (p) => {
        writeLocal(p)
        if (pushInfo.current.status === 'on') void reportState(p.last || '', p.streak || 0, live.current.pushState)
        if (live.current.isAuthenticated) {
          void live.current.saveProgress(p).catch(() => undefined)
        }
      },
      // While the session is restoring, show the signed-in look if this device was signed in.
      isAuthed: () => live.current.isAuthenticated || (live.current.isLoading && !!readWho()),
      practiceAccess: () => live.current.isAuthenticated ? 'member' : live.current.isLoading && readWho() ? 'restoring' : 'guest',
      login: (target, limited = false) => {
        const pending = target ? { target, limited } : null
        if (limited && document.activeElement instanceof HTMLElement) loginTrigger.current = document.activeElement
        if (limited && loginResume.current?.target !== target) {
          void live.current.track({ name: GUEST_LIMIT_SEEN, anon: anonId() }).catch(() => undefined)
        }
        loginResume.current = pending
        try {
          if (pending) sessionStorage.setItem(LOGIN_RESUME_KEY, JSON.stringify(pending))
          else sessionStorage.removeItem(LOGIN_RESUME_KEY)
        } catch {}
        setModal(limited ? 'guest-login' : 'login')
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
      conversationAccount: () => live.current.conversationAccount,
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
      open: (name) => openPanel(name),
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
      const status = await pushStatus()
      if (gymRef.current !== handle) return
      pushInfo.current = { status, hour: pushHour() }
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
    if (isAuthenticated) setModal((m) => (m === 'login' || m === 'guest-login' ? 'none' : m))
    if (!isAuthenticated && !isLoading) mergedFor.current = null
  }, [isAuthenticated, isLoading, mounted])

  // Show the review card as soon as the due list changes.
  const dueCount = due.length
  const quotaKey = quota ? `${quota.used}/${quota.limit}/${quota.admin}` : ''
  useEffect(() => {
    gymRef.current?.refresh()
  }, [dueCount, quotaKey, initials, isAuthenticated, isLoading, conversationAccount])
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

  // Resume only after Convex confirms authentication and the guest progress has merged.
  useEffect(() => {
    const gym = gymRef.current
    if (!gym || !isAuthenticated || !progress?.ok || !me?.ok || mergedFor.current !== me.email || modal === 'login' || modal === 'guest-login') return
    let pending = loginResume.current
    loginResume.current = null
    try {
      pending ??= parseLoginResume(sessionStorage.getItem(LOGIN_RESUME_KEY))
      sessionStorage.removeItem(LOGIN_RESUME_KEY)
    } catch {}
    if (!pending) return
    loginTrigger.current = null
    if (pending.limited) void track({ name: GUEST_LIMIT_SIGNED_IN, anon: anonId() }).catch(() => undefined)
    gym.resumePractice(pending.target)
  }, [isAuthenticated, progress, me, mounted, modal, track])

  const authed = isAuthenticated
  const toLogin = () => setModal('login')
  const panelTrack = (name: string) => (what: string) => void track({ name, anon: anonId(), props: what }).catch(() => undefined)
  const gs = gymRef.current?.getState()
  const certFocus = panel?.startsWith('cert:') ? Number(panel.split(':')[1]) : null

  return (
    <div className="gym">
      {!mounted && (
        <div className="boot" aria-hidden="true">
          Dev English
        </div>
      )}
      <div ref={hostRef} style={{ height: '100%' }} inert={modal === 'guest-login' || panel !== null} />
      {(modal === 'login' || modal === 'guest-login') && <LoginSheet key={modal} limited={modal === 'guest-login'} onClose={() => {
        loginResume.current = null
        try { sessionStorage.removeItem(LOGIN_RESUME_KEY) } catch {}
        setModal('none')
        if (modal === 'guest-login') {
          const trigger = loginTrigger.current
          loginTrigger.current = null
          requestAnimationFrame(() => {
            if (trigger?.isConnected && hostRef.current?.contains(trigger)) trigger.focus({ preventScroll: true })
            else hostRef.current?.querySelector<HTMLElement>('.today-practice .btn')?.focus({ preventScroll: true })
          })
        }
      }} />}
      {panel === 'interview' && <InterviewPanel authed={authed} onClose={closePanel} onLogin={toLogin} />}
      {panel === 'tools' && <ToolsPanel authed={authed} onClose={closePanel} onLogin={toLogin} />}
      {panel === 'league' && <LeaguePanel authed={authed} onClose={closePanel} onLogin={toLogin} />}
      {panel === 'report' && <ReportPanel authed={authed} streak={gs?.streak ?? 0} onClose={closePanel} onLogin={toLogin} />}
      {panel === 'invite' && <InvitePanel authed={authed} onClose={closePanel} onLogin={toLogin} onTrack={panelTrack('ref_share')} />}
      {(panel === 'certs' || panel?.startsWith('cert:')) && (
        <CertsPanel authed={authed} board={gs?.board ?? {}} focus={certFocus} onClose={closePanel} onLogin={toLogin} onTrack={panelTrack('cert_share')} />
      )}
      {onboard && !authed && (
        <Onboarding
          onDone={finishOnboarding}
          onSkip={() => {
            lsSet(ONBOARD_KEY, 'skip')
            setOnboard(false)
          }}
        />
      )}
      {notice && (
        <div className="sheet-bg" role="dialog" aria-label="Aviso" onClick={() => setNotice('')}>
          <div className="sheet">
            <p style={{ margin: 0 }}>{notice}</p>
            <button className="btn" type="button" onClick={() => setNotice('')}>
              Valeu!
            </button>
          </div>
        </div>
      )}
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
                    history.pushState({}, '', APP_ADMIN)
                  } catch {
                    /* ignore */
                  }
                  setModal('admin')
                }}
              >
                <Icon name="chart-bar" /> Painel de métricas
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
              history.replaceState({}, '', APP_TABS.me)
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

function LoginSheet({ limited, onClose }: { limited: boolean; onClose: () => void }) {
  const { signIn } = useAuthActions()
  const providers = useQuery(api.account.providers)
  const [flow, setFlow] = useState<'signIn' | 'signUp'>(limited ? 'signUp' : 'signIn')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const titleRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (limited) titleRef.current?.focus()
  }, [limited])

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
  const title = limited ? 'Salve seu progresso e continue treinando' : signUp ? 'Criar conta grátis' : 'Entrar'
  return (
    <div className="sheet-bg" role="dialog" aria-label={title} aria-modal={limited || undefined} onKeyDown={(event) => {
      if (event.key === 'Escape') onClose()
    }}>
      <div className="sheet">
        <p className="sheet-title" ref={titleRef} tabIndex={limited ? -1 : undefined}>{title}</p>
        {limited && (
          <p className="note">
            Você concluiu suas {GUEST_PRACTICE_LIMIT} atividades grátis. Crie uma conta em poucos passos para guardar seu XP e continuar de onde parou.
          </p>
        )}
        {(providers?.google || providers?.linkedin) && (
          <div className="social">
            {providers?.google && (
              <button className="btn social-btn" type="button" onClick={() => {
                markSignIn()
                void signIn('google', { redirectTo: location.origin + location.pathname + location.search })
              }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"/></svg>
                Continuar com Google
              </button>
            )}
            {providers?.linkedin && (
              <button className="btn social-btn" type="button" onClick={() => {
                markSignIn()
                void signIn('linkedin', { redirectTo: location.origin + location.pathname + location.search })
              }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" d="M7 9.5h2.6V18H7zM8.3 5.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11.2 9.5h2.5v1.2c.4-.7 1.3-1.4 2.7-1.4 2.8 0 3.3 1.8 3.3 4.2V18h-2.6v-4c0-1 0-2.2-1.3-2.2s-1.6 1-1.6 2.1V18h-2.6z"/></svg>
                Continuar com LinkedIn
              </button>
            )}
            <p className="or"><span>ou com e-mail</span></p>
          </div>
        )}
        <form onSubmit={submit} className="sheet-form">
          {!limited && <p className="note">Salve seu progresso em qualquer aparelho e converse com a IA.</p>}
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
