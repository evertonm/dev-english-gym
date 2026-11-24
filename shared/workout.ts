export const WORKOUT_IDS = ['pr-query-timeout', 'pr-duplicate-retry'] as const
export type WorkoutId = (typeof WORKOUT_IDS)[number]

export const WORKOUT_EVENTS = {
  offered: 'workout_offered',
  started: 'workout_started',
  submitted: 'workout_submitted',
  completed: 'workout_completed',
} as const

export function isWorkoutId(id: string | undefined): id is WorkoutId {
  return WORKOUT_IDS.some((scenario) => scenario === id)
}

export function workoutEventAllowed(name: string, props: string | undefined): boolean {
  return !Object.values<string>(WORKOUT_EVENTS).includes(name) || isWorkoutId(props)
}

export function brasiliaDay(timestamp: number): string {
  return new Date(timestamp - 3 * 3_600_000).toISOString().slice(0, 10)
}

export function workoutForDay(board: Record<string, number>, day: number): WorkoutId {
  const [first, followUp] = WORKOUT_IDS
  return board[first] && board[first] < day ? followUp : first
}

type WorkoutEvent = { anon: string; name: string; props: string; day: string }

export function summarizeWorkout(events: WorkoutEvent[], from: string, today: string) {
  const [first, followUp] = WORKOUT_IDS
  const { offered, started, submitted, completed } = WORKOUT_EVENTS
  const stages = new Map<string, Set<string>>(
    Object.values(WORKOUT_EVENTS).map((name) => [name, new Set<string>()]),
  )
  const firstDay = new Map<string, string>()
  const followUpDays = new Map<string, Set<string>>()
  for (const { anon, name, props, day } of events) {
    if (!anon || !isWorkoutId(props) || day > today) continue
    if (props === first && day >= from) stages.get(name)?.add(anon)
    if (name !== completed) continue
    if (props === first && day < (firstDay.get(anon) ?? '9999-12-31')) firstDay.set(anon, day)
    if (props === followUp) {
      const dates = followUpDays.get(anon) ?? new Set<string>()
      dates.add(day)
      followUpDays.set(anon, dates)
    }
  }

  let eligible = 0
  let returned = 0
  for (const [anon, day] of firstDay) {
    const end = new Date(Date.parse(day + 'T00:00:00Z') + 7 * 86_400_000).toISOString().slice(0, 10)
    if (day < from || end >= today) continue
    eligible++
    if ([...(followUpDays.get(anon) ?? [])].some((date) => date > day && date <= end)) returned++
  }
  return {
    offered: stages.get(offered)!.size,
    started: stages.get(started)!.size,
    submitted: stages.get(submitted)!.size,
    completed: stages.get(completed)!.size,
    eligible,
    returned,
  }
}
