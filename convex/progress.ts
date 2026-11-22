import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"

const ID_RE = /^[a-z0-9_-]{1,40}$/

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
        ? { xp: p.xp, streak: p.streak, last: p.last, units: p.units, lessons: p.lessons }
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
    }
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique()
    if (existing) await ctx.db.patch(existing._id, data)
    else await ctx.db.insert("progress", { userId, ...data })
    return { ok: true as const }
  },
})
