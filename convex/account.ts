import { getAuthUserId } from "@convex-dev/auth/server"
import { mutation, query } from "./_generated/server"

// Which social sign-in buttons the app should show.
export const providers = query({
  args: {},
  handler: async () => ({
    google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    linkedin: !!(process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET),
  }),
})

// LGPD: the learner can erase their account and everything tied to it.
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const }
    for (const p of await ctx.db.query("progress").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      await ctx.db.delete(p._id)
    for (const m of await ctx.db.query("mistakes").withIndex("by_user_due", (q) => q.eq("userId", userId)).collect())
      await ctx.db.delete(m._id)
    for (const u of await ctx.db.query("aiUsage").withIndex("by_user_day", (q) => q.eq("userId", userId)).collect())
      await ctx.db.delete(u._id)
    for (const e of await ctx.db.query("events").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      await ctx.db.delete(e._id)
    for (const s of await ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", userId)).collect()) {
      for (const t of await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q) => q.eq("sessionId", s._id)).collect())
        await ctx.db.delete(t._id)
      await ctx.db.delete(s._id)
    }
    for (const a of await ctx.db.query("authAccounts").withIndex("userIdAndProvider", (q) => q.eq("userId", userId)).collect()) {
      for (const c of await ctx.db.query("authVerificationCodes").withIndex("accountId", (q) => q.eq("accountId", a._id)).collect())
        await ctx.db.delete(c._id)
      await ctx.db.delete(a._id)
    }
    await ctx.db.delete(userId)
    return { ok: true as const }
  },
})
