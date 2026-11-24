export const GUEST_LIMIT_SEEN = 'guest_limit_seen'
export const GUEST_LIMIT_SIGNED_IN = 'guest_limit_signed_in'

const practiceEvents = new Set(['lesson_done', 'unit_done', 'board_done', 'workout_completed'])
export const guestMetricEvents = new Set([GUEST_LIMIT_SEEN, GUEST_LIMIT_SIGNED_IN, ...practiceEvents])

type GuestMetricEvent = { name: string; anon: string; userId?: string; day: string }

export function summarizeGuestLimit(events: GuestMetricEvent[], today: string) {
  const invitations = new Set(
    events.filter(event => event.name === GUEST_LIMIT_SEEN && event.anon).map(event => event.anon),
  )
  const signedInDevices = new Set<string>()
  const firstSignIn = new Map<string, string>()
  const practiceDays = new Map<string, Set<string>>()

  for (const { name, anon, userId, day } of events) {
    if (!userId) continue
    if (name === GUEST_LIMIT_SIGNED_IN && invitations.has(anon)) {
      signedInDevices.add(anon)
      const first = firstSignIn.get(userId)
      if (!first || day < first) firstSignIn.set(userId, day)
    }
    if (practiceEvents.has(name)) {
      const days = practiceDays.get(userId) ?? new Set<string>()
      days.add(day)
      practiceDays.set(userId, days)
    }
  }

  let eligible = 0
  let returned = 0
  for (const [userId, day] of firstSignIn) {
    const end = new Date(Date.parse(day + 'T00:00:00Z') + 7 * 86_400_000).toISOString().slice(0, 10)
    if (end >= today) continue
    eligible++
    if ([...(practiceDays.get(userId) ?? [])].some(date => date > day && date <= end)) returned++
  }
  return { seen: invitations.size, signedIn: signedInDevices.size, eligible, returned }
}
