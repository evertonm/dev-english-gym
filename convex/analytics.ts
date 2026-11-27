import { isAdmin } from "./admin"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { RANKS, rankName, utcDay } from "./perks"
import { brasiliaDay as brDay, isWorkoutId, summarizeWorkout, WORKOUT_EVENTS, workoutEventAllowed } from "../shared/workout"
import { GUEST_LIMIT_SEEN, GUEST_LIMIT_SIGNED_IN, guestMetricEvents, summarizeGuestLimit } from "../shared/guest-metrics"

const GLOBAL_AI_CAP = Number(process.env.AI_GLOBAL_DAILY_LIMIT ?? 450)

// First-party usage metrics (no cookies, no third parties). Devices are a random id kept in the browser.
const NAMES = new Set(["open", "lesson_done", "unit_done", "board_done", "dice", "chest", "signup", "ai_call", "ai_limit", "stt", "onboard", "placement", "ref_share", "cert_share", "tool_open", GUEST_LIMIT_SEEN, GUEST_LIMIT_SIGNED_IN, ...Object.values(WORKOUT_EVENTS)])
const ANON_RE = /^[a-z0-9]{8,40}$/

export async function logEvent(ctx: MutationCtx, name: string, userId: Id<"users"> | null, anon = "", props = "") {
  await ctx.db.insert("events", { name, anon, userId: userId ?? undefined, props: props.slice(0, 60), day: utcDay(), ts: Date.now() })
}

export const track = mutation({
  args: { name: v.string(), anon: v.string(), props: v.optional(v.string()) },
  handler: async (ctx, { name, anon, props }) => {
    if (!NAMES.has(name) || !ANON_RE.test(anon) || !workoutEventAllowed(name, props)) return
    const userId = await getAuthUserId(ctx)
    if (name === GUEST_LIMIT_SIGNED_IN && !userId) return
    // Light abuse guard: at most 300 events per device per day.
    const today = await ctx.db
      .query("events")
      .withIndex("by_anon_day", (q) => q.eq("anon", anon).eq("day", utcDay()))
      .take(301)
    if (today.length > 300) return
    await logEvent(ctx, name, userId, anon, props ?? "")
  },
})

export const serverEvent = internalMutation({
  args: { name: v.string(), userId: v.optional(v.id("users")) },
  handler: async (ctx, { name, userId }) => logEvent(ctx, name, userId ?? null),
})

const dayOffset = (day: string, n: number) => {
  const d = new Date(day + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Kept so pages opened before an update don't break; the app now uses `dashboard`.
export const summary = query({ args: {}, handler: async () => null })

// Reads are capped (Convex limits documents per query); fine until a few thousand users,
// then switch to pre-aggregated daily counters.
// ---------- Admin dashboard (ADMIN_EMAILS in the Convex dashboard) ----------
// Days and hours are in Brasília time (UTC-3).
const BR = -3 * 3600_000
const brHour = (ts: number) => new Date(ts + BR).getUTCHours()
const WINDOW = 30
// The app stores days as "2026-11-3" (local, unpadded); pad so they compare as strings.
const padDay = (d: string) => d.split("-").map((x, i) => (i ? x.padStart(2, "0") : x)).join("-")

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!(await isAdmin(ctx, userId))) return null
    const now = Date.now()
    const today = brDay(now)
    const days = Array.from({ length: WINDOW }, (_, i) => dayOffset(today, i - (WINDOW - 1)))
    const since = new Date(days[0] + "T03:00:00Z").getTime() - 8 * 86_400_000 // extra week for retention
    type Day = { devices: Set<string>; users: Set<string>; c: Record<string, number> }
    const per: Record<string, Day> = {}
    for (const d of days) per[d] = { devices: new Set(), users: new Set(), c: {} }
    const bump = (d: string, k: string) => { const p = per[d]; if (p) p.c[k] = (p.c[k] ?? 0) + 1 }

    // Events (app usage)
    const events = await ctx.db.query("events").withIndex("by_day", (q) => q.gte("day", dayOffset(today, -(WINDOW + 9)))).order("desc").take(6000)
    const openDays: Record<string, Set<string>> = {}
    const hours = Array(24).fill(0) as number[]
    const lessons: Record<string, number> = {}
    const funnelDev = { open: new Set<string>(), lesson: new Set<string>() }
    const workoutEvents: Parameters<typeof summarizeWorkout>[0] = []
    const guestEvents: Parameters<typeof summarizeGuestLimit>[0] = []
    for (const e of events) {
      if (e.ts < since) continue
      const d = brDay(e.ts)
      if (isWorkoutId(e.props)) workoutEvents.push({ name: e.name, props: e.props, anon: e.anon, day: d })
      if (e.name === "open" && e.anon) (openDays[e.anon] ??= new Set()).add(d)
      const p = per[d]
      if (!p) continue
      hours[brHour(e.ts)]++
      if (e.anon) p.devices.add(e.anon)
      if (e.userId) p.users.add(e.userId)
      bump(d, e.name)
      if (guestMetricEvents.has(e.name)) guestEvents.push({ name: e.name, anon: e.anon, day: d, userId: e.userId })
      if (e.name === "lesson_done" && e.props) lessons[e.props] = (lessons[e.props] ?? 0) + 1
      if (e.anon && e.name === "open") funnelDev.open.add(e.anon)
      if (e.anon && (e.name === "lesson_done" || e.name === "unit_done" || e.name === "board_done")) funnelDev.lesson.add(e.anon)
    }

    // Accounts, sign-in methods and logins
    const users = await ctx.db.query("users").order("desc").take(1500)
    const accounts = await ctx.db.query("authAccounts").order("desc").take(1500)
    const methods: Record<string, number> = {}
    const methodOf: Record<string, string[]> = {}
    for (const a of accounts) {
      const m = a.provider === "password" ? "E-mail e senha" : a.provider === "google" ? "Google" : a.provider === "linkedin" ? "LinkedIn" : a.provider
      methods[m] = (methods[m] ?? 0) + 1
      ;(methodOf[a.userId] ??= []).push(m)
    }
    for (const u of users) bump(brDay(u._creationTime), "signups")
    const sessions = await ctx.db.query("authSessions").order("desc").take(1500)
    for (const s of sessions) bump(brDay(s._creationTime), "logins")

    // Learning state
    const progress = await ctx.db.query("progress").order("desc").take(1500)
    const byUser: Record<string, (typeof progress)[number]> = {}
    for (const p of progress) byUser[p.userId] = p
    const ranks: Record<string, number> = {}
    for (const [, name] of RANKS) ranks[name] = 0
    let xpSum = 0, streakSum = 0, streakMax = 0, active7 = 0
    const weekAgo = dayOffset(today, -6)
    for (const p of progress) {
      ranks[rankName(p.xp)] = (ranks[rankName(p.xp)] ?? 0) + 1
      xpSum += p.xp
      streakSum += p.streak
      streakMax = Math.max(streakMax, p.streak)
      if ((p.days ?? []).some((d) => padDay(d) >= weekAgo)) active7++
    }
    const aiUsers = new Set((await ctx.db.query("aiUsage").order("desc").take(1500)).map((r) => r.userId))
    const funnel = [
      { k: "Abriram o app (30 dias)", n: funnelDev.open.size },
      { k: "Fizeram uma atividade", n: funnelDev.lesson.size },
      { k: "Criaram conta", n: users.length },
      { k: "Estudaram logados", n: progress.filter((p) => p.xp > 0).length },
      { k: "Conversaram com a IA", n: aiUsers.size },
      { k: "Voltaram em outro dia", n: progress.filter((p) => (p.days ?? []).length >= 2).length },
    ]

    // Retention by device
    let c1 = 0, r1 = 0, c7 = 0, r7 = 0
    for (const set of Object.values(openDays)) {
      const first = [...set].sort()[0]
      if (first < days[0]) continue
      if (dayOffset(first, 1) <= today) { c1++; if (set.has(dayOffset(first, 1))) r1++ }
      if (dayOffset(first, 7) <= today) { c7++; if ([...set].some((d) => d >= dayOffset(first, 6) && d <= dayOffset(first, 8))) r7++ }
    }
    const distinct = (from: string) => {
      const s = new Set<string>()
      for (const [anon, set] of Object.entries(openDays)) if ([...set].some((d) => d >= from && d <= today)) s.add(anon)
      return s.size
    }

    // AI today (server day = UTC, same as the limits)
    const g = await ctx.db.query("aiGlobal").withIndex("by_day", (q) => q.eq("day", utcDay())).unique()

    const recent = [...users]
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 40)
      .map((u) => {
        const p = byUser[u._id]
        return {
          email: u.email ?? "—",
          created: u._creationTime,
          via: [...new Set(methodOf[u._id] ?? [])],
          xp: p?.xp ?? 0,
          rank: rankName(p?.xp ?? 0),
          streak: p?.streak ?? 0,
          last: p?.last ? padDay(p.last) : "",
          lessons: p ? Object.keys(p.lessons).length + Object.keys(p.units).length : 0,
          chats: p?.chats ?? 0,
        }
      })

    return {
      today,
      totals: {
        users: users.length,
        new7: users.filter((u) => brDay(u._creationTime) >= weekAgo).length,
        dau: distinct(today),
        wau: distinct(weekAgo),
        mau: distinct(days[0]),
        active7,
        avgXp: progress.length ? Math.round(xpSum / progress.length) : 0,
        avgStreak: progress.length ? Math.round((streakSum / progress.length) * 10) / 10 : 0,
        maxStreak: streakMax,
        aiToday: g?.count ?? 0,
        aiCap: GLOBAL_AI_CAP,
      },
      retention: { d1: c1 ? r1 / c1 : null, d1n: c1, d7: c7 ? r7 / c7 : null, d7n: c7 },
      workout: summarizeWorkout(workoutEvents, days[0], today),
      guestLimit: summarizeGuestLimit(guestEvents, today),
      days: days.map((d) => ({
        day: d,
        devices: per[d].devices.size,
        users: per[d].users.size,
        ...per[d].c,
      })) as ({ day: string; devices: number; users: number } & Record<string, number | string>)[],
      hours,
      methods: Object.entries(methods).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n),
      ranks: Object.entries(ranks).map(([k, n]) => ({ k, n })),
      lessons: Object.entries(lessons).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n).slice(0, 10),
      funnel,
      recent,
    }
  },
})
