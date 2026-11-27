import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"
import { logEvent } from "./analytics"
import { addWeeklyXp } from "./social"
import { MAX_XP_FIRST_SAVE, MAX_XP_GAIN_PER_DAY, utcDay } from "./perks"
import { isWorkoutId } from "../shared/workout"
import { BOSS_TOPIC_KEY } from "../shared/boss-topics"

const ID_RE = /^[a-z0-9_-]{1,40}$/
const DAY_RE = /^\d{4}-\d{1,2}-\d{1,2}$/

// Board squares: keys like "w0t3", value 1 when cleared.
const BOARD_RE = /^w\d{1,2}t\d{1,2}$/
// Daily games done today ("termo:2026-11-23" = 1 done/won, 2 answers seen/lost). Kept for 8 days.
const GAME_RE = /^(daily|xword|termo|emoji):(\d{4})-(\d{1,2})-(\d{1,2})$/
function recentGame(k: string): boolean {
  const m = GAME_RE.exec(k)
  if (!m) return false
  const t = Date.UTC(+m[2], +m[3] - 1, +m[4])
  return Math.abs(Date.now() - t) < 8 * 86_400_000
}
function cleanBoard(b: Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, n] of Object.entries(b ?? {}).slice(0, 300)) {
    if (!(n > 0)) continue
    if (BOARD_RE.test(k) || BOSS_TOPIC_KEY.test(k)) out[k] = 1
    else if (isWorkoutId(k) && Number.isInteger(n) && n >= 20000101 && n <= 99991231) out[k] = n
    else if (recentGame(k)) out[k] = n >= 2 ? 2 : 1
  }
  return out
}
// Never lose a finished square or today's game result because another device saved an older copy.
function unionBoard(a: Record<string, number> | undefined, b: Record<string, number>): Record<string, number> {
  const out = cleanBoard(a)
  for (const [k, n] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, n)
  return out
}
type Termo = { day: string; guesses: string[] }
function cleanTermo(t: Termo | undefined): Termo | undefined {
  if (!t || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(t.day)) return undefined
  return { day: t.day, guesses: t.guesses.filter((g) => /^[a-z]{5}$/.test(g)).slice(0, 6) }
}
// Today's Termo: the copy with more guesses wins, so switching devices can't restart the game.
function pickTermo(a: Termo | undefined, b: Termo | undefined): Termo | undefined {
  if (!a) return b
  if (!b) return a
  if (a.day !== b.day) return a.day > b.day ? a : b
  return b.guesses.length >= a.guesses.length ? b : a
}

function clampInt(n: number | undefined, max: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.round(n as number))) : 0
}

function cleanStars(r: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, n] of Object.entries(r).slice(0, 100)) {
    if (ID_RE.test(k) && Number.isFinite(n)) out[k] = Math.max(0, Math.min(3, Math.round(n)))
  }
  return out
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: "UNAUTHENTICATED" as const }
    const user = await ctx.db.get(userId)
    return { ok: true as const, email: user?.email ?? "" }
  },
})

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: "UNAUTHENTICATED" as const }
    const p = await ctx.db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique()
    return {
      ok: true as const,
      progress: p
        ? {
            xp: p.xp, streak: p.streak, last: p.last, units: p.units, lessons: p.lessons,
            goal: p.goal, dayXp: p.dayXp, dayKey: p.dayKey, freezes: p.freezes, days: p.days,
            badges: p.badges, lvl: p.lvl, chats: p.chats, reviews: p.reviews, goals: p.goals,
            board: p.board, diceDay: p.diceDay, diceVal: p.diceVal, termo: p.termo,
          }
        : null,
    }
  },
})

export const save = mutation({
  args: {
    xp: v.number(),
    streak: v.number(),
    last: v.string(),
    units: v.record(v.string(), v.number()),
    lessons: v.record(v.string(), v.number()),
    goal: v.optional(v.number()),
    dayXp: v.optional(v.number()),
    dayKey: v.optional(v.string()),
    freezes: v.optional(v.number()),
    days: v.optional(v.array(v.string())),
    badges: v.optional(v.array(v.string())),
    lvl: v.optional(v.number()),
    chats: v.optional(v.number()),
    reviews: v.optional(v.number()),
    goals: v.optional(v.number()),
    board: v.optional(v.record(v.string(), v.number())),
    diceDay: v.optional(v.string()),
    diceVal: v.optional(v.number()),
    termo: v.optional(v.object({ day: v.string(), guesses: v.array(v.string()) })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: "UNAUTHENTICATED" as const }
    const data = {
      xp: Math.max(0, Math.min(10_000_000, Math.round(args.xp))),
      streak: Math.max(0, Math.min(100_000, Math.round(args.streak))),
      last: args.last.slice(0, 12),
      units: cleanStars(args.units),
      lessons: cleanStars(args.lessons),
      goal: [30, 50, 100].includes(args.goal ?? 50) ? (args.goal ?? 50) : 50,
      dayXp: clampInt(args.dayXp, 100_000),
      dayKey: (args.dayKey ?? "").slice(0, 12),
      freezes: clampInt(args.freezes, 2),
      days: (args.days ?? []).filter((d) => DAY_RE.test(d)).slice(-60),
      badges: (args.badges ?? []).filter((b) => ID_RE.test(b)).slice(0, 50),
      lvl: clampInt(args.lvl, 5),
      chats: clampInt(args.chats, 10_000_000),
      reviews: clampInt(args.reviews, 10_000_000),
      goals: clampInt(args.goals, 100_000),
      board: cleanBoard(args.board),
      diceDay: (args.diceDay ?? "").slice(0, 12),
      diceVal: clampInt(args.diceVal, 6),
      termo: cleanTermo(args.termo),
    }
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique()
    // XP guard: the rank (and with it the AI limit) comes from this number, so cap how fast it can grow.
    const day = utcDay()
    if (existing) {
      const gainedToday = existing.srvDay === day ? (existing.srvGain ?? 0) : 0
      const room = Math.max(0, MAX_XP_GAIN_PER_DAY - gainedToday)
      const xp = Math.max(existing.xp, Math.min(data.xp, existing.xp + room))
      const board = unionBoard(existing.board, data.board)
      const termo = pickTermo(existing.termo, data.termo)
      await ctx.db.patch(existing._id, { ...data, board, termo, xp, srvDay: day, srvGain: gainedToday + (xp - existing.xp) })
      await addWeeklyXp(ctx, userId, xp - existing.xp)
      return { ok: true as const, xp }
    }
    const xp = Math.min(data.xp, MAX_XP_FIRST_SAVE)
    await ctx.db.insert("progress", { userId, ...data, xp, srvDay: day, srvGain: 0 })
    await addWeeklyXp(ctx, userId, xp)
    await logEvent(ctx, "signup", userId)
    return { ok: true as const, xp }
  },
})
