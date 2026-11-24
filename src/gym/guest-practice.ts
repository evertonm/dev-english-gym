export const GUEST_PRACTICE_LIMIT = 3
export const GUEST_PRACTICE_KEY = 'devenglish-guest-practice-v1'

const games = ['daily', 'emoji', 'termo', 'xword'] as const
type Game = (typeof games)[number]
export type PracticeTarget = `game:${Game}` | `${'lesson' | 'unit' | 'workout' | 'board'}:${string}`
export type LoginTarget = PracticeTarget | 'review-chat' | `placement:w${number}t15`
export type LoginResume = { target: LoginTarget; limited: boolean }

function isPracticeTarget(value: unknown): value is PracticeTarget {
  return typeof value === 'string' && /^(?:(?:lesson|unit|workout):[a-z0-9_-]{1,40}|board:w\d{1,2}t\d{1,2}|game:(?:daily|emoji|termo|xword))$/.test(value)
}

export function readGuestCompletions(raw: string | null): PracticeTarget[] {
  try {
    const values: unknown = JSON.parse(raw ?? '[]')
    return Array.isArray(values) ? [...new Set(values.filter(isPracticeTarget))].slice(0, GUEST_PRACTICE_LIMIT) : []
  } catch {
    return []
  }
}

export function addGuestCompletion(done: PracticeTarget[], target: PracticeTarget): PracticeTarget[] {
  return done.length >= GUEST_PRACTICE_LIMIT || done.includes(target) ? done : [...done, target]
}

export function guestRemaining(done: PracticeTarget[]): number {
  return Math.max(0, GUEST_PRACTICE_LIMIT - done.length)
}

type GuestProgress = Partial<Record<'units' | 'lessons' | 'board', Record<string, number>>>

export function guestActivitiesFromProgress(
  progress: GuestProgress,
  quizKeys: readonly string[],
  workoutIds: readonly string[],
): PracticeTarget[] {
  let done: PracticeTarget[] = []
  const record = (target: PracticeTarget) => { done = addGuestCompletion(done, target) }
  for (const [id, score] of Object.entries(progress.units ?? {})) if (score > 0) record(`unit:${id}`)
  for (const [id, score] of Object.entries(progress.lessons ?? {})) if (score > 0) record(`lesson:${id}`)
  for (const [key, score] of Object.entries(progress.board ?? {})) {
    if (score <= 0) continue
    const game = games.find(name => key.startsWith(name + ':'))
    if (game) record(`game:${game}`)
    else if (workoutIds.includes(key)) record(`workout:${key}`)
    else if (quizKeys.includes(key)) record(`board:${key}`)
  }
  return done
}

export function parseLoginResume(raw: string | null): LoginResume | null {
  try {
    const value = JSON.parse(raw ?? 'null')
    if (typeof value?.limited !== 'boolean') return null
    const placement = typeof value.target === 'string' && /^placement:w\d{1,2}t15$/.test(value.target)
    return value.target === 'review-chat' || placement || isPracticeTarget(value.target)
      ? { target: value.target, limited: value.limited }
      : null
  } catch {
    return null
  }
}
