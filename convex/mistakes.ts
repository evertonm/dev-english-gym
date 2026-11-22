import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"

const DAY = 24 * 60 * 60 * 1000
const MAX_PER_USER = 500

export const due = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: "UNAUTHENTICATED" as const }
    // No Date.now() filter here: a time-bounded range would not refresh when new items arrive.
    // The client keeps only items whose `due` has passed.
    const items = await ctx.db
      .query("mistakes")
      .withIndex("by_user_due", (q) => q.eq("userId", userId))
      .take(30)
    return {
      ok: true as const,
      items: items.map((m) => ({ id: m._id, wrong: m.wrong, better: m.better, tip: m.tip, due: m.due })),
    }
  },
})

export const add = mutation({
  args: { wrong: v.string(), better: v.string(), tip: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: "UNAUTHENTICATED" as const }
    const wrong = args.wrong.trim().slice(0, 600)
    const better = args.better.trim().slice(0, 600)
    const tip = args.tip.trim().slice(0, 300)
    if (!wrong || !better) return { ok: false as const, code: "BAD_INPUT" as const }
    const existing = await ctx.db
      .query("mistakes")
      .withIndex("by_user_better", (q) => q.eq("userId", userId).eq("better", better))
      .first()
    if (existing) return { ok: true as const }
    const count = (
      await ctx.db
        .query("mistakes")
        .withIndex("by_user_due", (q) => q.eq("userId", userId))
        .take(MAX_PER_USER)
    ).length
    if (count >= MAX_PER_USER) return { ok: false as const, code: "LIMIT" as const }
    // Reviewable right away; correct answers then push it out to 1, 2.5, 6+ days.
    await ctx.db.insert("mistakes", {
      userId,
      wrong,
      better,
      tip,
      due: Date.now(),
      interval: 0,
      reps: 0,
    })
    return { ok: true as const }
  },
})

export const review = mutation({
  args: { id: v.id("mistakes"), ok: v.boolean() },
  handler: async (ctx, { id, ok }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: "UNAUTHENTICATED" as const }
    const m = await ctx.db.get(id)
    if (!m || m.userId !== userId) return { ok: false as const, code: "NOT_FOUND" as const }
    if (ok && m.reps >= 5) {
      // Learned: right 6 times in a row, spaced out over weeks.
      await ctx.db.delete(id)
      return { ok: true as const }
    }
    const interval = ok ? Math.min(60, m.interval < 1 ? 1 : m.interval * 2.5) : 1
    await ctx.db.patch(id, {
      interval,
      reps: ok ? m.reps + 1 : 0,
      due: Date.now() + interval * DAY,
    })
    return { ok: true as const }
  },
})
