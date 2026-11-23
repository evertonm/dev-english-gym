import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { utcDay } from "./perks"

// First-party usage metrics (no cookies, no third parties). Devices are a random id kept in the browser.
const NAMES = new Set(["open", "lesson_done", "unit_done", "board_done", "dice", "chest", "signup", "ai_call", "ai_limit", "stt"])
const ANON_RE = /^[a-z0-9]{8,40}$/

export async function logEvent(ctx: MutationCtx, name: string, userId: Id<"users"> | null, anon = "", props = "") {
  await ctx.db.insert("events", { name, anon, userId: userId ?? undefined, props: props.slice(0, 60), day: utcDay(), ts: Date.now() })
}

export const track = mutation({
  args: { name: v.string(), anon: v.string(), props: v.optional(v.string()) },
  handler: async (ctx, { name, anon, props }) => {
    if (!NAMES.has(name) || !ANON_RE.test(anon)) return
    // Light abuse guard: at most 300 events per device per day.
    const today = await ctx.db
      .query("events")
      .withIndex("by_anon_day", (q) => q.eq("anon", anon).eq("day", utcDay()))
      .take(301)
    if (today.length > 300) return
    await logEvent(ctx, name, await getAuthUserId(ctx), anon, props ?? "")
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

// Admin-only summary of the last 14 days (ADMIN_EMAILS in the Convex dashboard).
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const me = await ctx.db.get(userId)
    const admins = (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean)
    if (!me?.email || !admins.includes(me.email.toLowerCase())) return null

    const today = utcDay()
    const from = dayOffset(today, -21)
    const events = await ctx.db.query("events").withIndex("by_day", (q) => q.gte("day", from)).take(50_000)
    const days = Array.from({ length: 14 }, (_, i) => dayOffset(today, i - 13))
    const per: Record<string, { devices: Set<string>; counts: Record<string, number> }> = {}
    for (const d of days) per[d] = { devices: new Set(), counts: {} }
    const openDays: Record<string, Set<string>> = {}
    for (const e of events) {
      if (e.name === "open" && e.anon) (openDays[e.anon] ??= new Set()).add(e.day)
      const p = per[e.day]
      if (!p) continue
      if (e.name === "open" && e.anon) p.devices.add(e.anon)
      p.counts[e.name] = (p.counts[e.name] ?? 0) + 1
    }
    // Retention: of the devices first seen on a day, how many came back the next day / 7 days later.
    let c1 = 0, r1 = 0, c7 = 0, r7 = 0
    for (const set of Object.values(openDays)) {
      const first = [...set].sort()[0]
      if (first < from) continue
      if (dayOffset(first, 1) <= today) { c1++; if (set.has(dayOffset(first, 1))) r1++ }
      if (dayOffset(first, 7) <= today) {
        c7++
        if ([...set].some((d) => d > first && d <= dayOffset(first, 7) && d >= dayOffset(first, 6))) r7++
      }
    }
    const users = (await ctx.db.query("users").take(100_000)).length
    return {
      users,
      days: days.map((d) => ({ day: d, devices: per[d].devices.size, ...per[d].counts })),
      d1: c1 ? r1 / c1 : null, d1n: c1,
      d7: c7 ? r7 / c7 : null, d7n: c7,
    }
  },
})
