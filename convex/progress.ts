import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"
import { logEvent } from "./analytics"
import { MAX_XP_FIRST_SAVE, MAX_XP_GAIN_PER_DAY, utcDay } from "./perks"

const ID_RE = /^[a-z0-9_-]{1,40}$/
const DAY_RE = /^\d{4}-\d{1,2}-\d{1,2}$/

// Board squares: keys like "w0t3", value 1 when cleared.
const BOARD_RE = /^w\d{1,2}t\d{1,2}$/
function cleanBoard(b: Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, n] of Object.entries(b ?? {}).slice(0, 200)) if (BOARD_RE.test(k) && n > 0) out[k] = 1
  return out
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
            board: p.board, diceDay: p.diceDay, diceVal: p.diceVal,
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
      lvl: clampInt(args.lvl, 2),
      chats: clampInt(args.chats, 10_000_000),
      reviews: clampInt(args.reviews, 10_000_000),
      goals: clampInt(args.goals, 100_000),
      board: cleanBoard(args.board),
      diceDay: (args.diceDay ?? "").slice(0, 12),
      diceVal: clampInt(args.diceVal, 6),
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
      await ctx.db.patch(existing._id, { ...data, xp, srvDay: day, srvGain: gainedToday + (xp - existing.xp) })
      return { ok: true as const, xp }
    }
    const xp = Math.min(data.xp, MAX_XP_FIRST_SAVE)
    await ctx.db.insert("progress", { userId, ...data, xp, srvDay: day, srvGain: 0 })
    await logEvent(ctx, "signup", userId)
    return { ok: true as const, xp }
  },
})
