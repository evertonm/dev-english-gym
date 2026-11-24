import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"
import { pushMeme } from "./pushMemes"

// Daily reminders by web push. The browser subscribes; an hourly cron (crons.ts) asks `due` who should get
// a reminder right now (their local reminder hour, not practised today, nothing sent yet today) and
// pushNode.sendDue delivers it.

export const publicKey = query({ args: {}, handler: async () => process.env.VAPID_PUBLIC_KEY ?? null })

const ANON_RE = /^[a-z0-9]{8,40}$/
const clampHour = (h: number) => Math.max(6, Math.min(23, Math.round(h)))

export const subscribe = mutation({
  args: { endpoint: v.string(), p256dh: v.string(), auth: v.string(), anon: v.string(), tz: v.number(), hour: v.number() },
  handler: async (ctx, a) => {
    if (!a.endpoint.startsWith("https://") || a.endpoint.length > 1000 || !ANON_RE.test(a.anon)) return { ok: false as const }
    const userId = (await getAuthUserId(ctx)) ?? undefined
    const row = { p256dh: a.p256dh.slice(0, 200), auth: a.auth.slice(0, 100), anon: a.anon, userId, tz: Math.max(-720, Math.min(840, Math.round(a.tz))), hour: clampHour(a.hour) }
    const ex = await ctx.db.query("pushSubs").withIndex("by_endpoint", (q) => q.eq("endpoint", a.endpoint)).first()
    if (ex) await ctx.db.patch(ex._id, row)
    else await ctx.db.insert("pushSubs", { endpoint: a.endpoint, ...row })
    return { ok: true as const }
  },
})

export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const ex = await ctx.db.query("pushSubs").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).first()
    if (ex) await ctx.db.delete(ex._id)
  },
})

// The app reports the learner's last practice day (local "2026-11-23") and streak whenever they change.
export const state = mutation({
  args: { endpoint: v.string(), last: v.string(), streak: v.number() },
  handler: async (ctx, { endpoint, last, streak }) => {
    const ex = await ctx.db.query("pushSubs").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).first()
    if (!ex) return
    const userId = (await getAuthUserId(ctx)) ?? ex.userId
    await ctx.db.patch(ex._id, { last: last.slice(0, 10), streak: Math.max(0, Math.min(10000, Math.floor(streak))), userId })
  },
})

const pad = (d: string) => d.split("-").map((x, i) => (i ? x.padStart(2, "0") : x)).join("-")
const localNow = (tz: number) => new Date(Date.now() + tz * 60_000)
const dayOf = (d: Date) => d.toISOString().slice(0, 10)
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000)

export const due = internalQuery({
  args: {},
  handler: async (ctx) => {
    const out: { id: string; endpoint: string; p256dh: string; auth: string; title: string; body: string; day: string }[] = []
    for (const s of await ctx.db.query("pushSubs").take(5000)) {
      const now = localNow(s.tz)
      if (now.getUTCHours() !== s.hour) continue
      const today = dayOf(now)
      if (s.lastSent === today) continue
      const since = s.last ? daysBetween(pad(s.last), today) : 99
      let kind: "risk" | "back" | "hello" | null = null
      if (since === 0) kind = null // already practised today
      else if (since === 1) kind = (s.streak ?? 0) > 0 ? "risk" : "hello"
      else if ([2, 3, 5, 7, 14, 30].includes(since)) kind = "back"
      else if (since === 99) kind = "hello"
      if (!kind) continue
      const end = Date.UTC(now.getUTCFullYear(), 11, 31)
      const left = Math.max(0, Math.ceil((end - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 86_400_000))
      const m = pushMeme(kind, today + s.endpoint.slice(-12), { streak: s.streak ?? 0, days: since, left })
      out.push({ id: s._id, endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth, title: m.title, body: m.body, day: today })
    }
    return out
  },
})

export const markSent = internalMutation({
  args: { id: v.id("pushSubs"), day: v.string(), gone: v.boolean() },
  handler: async (ctx, { id, day, gone }) => {
    if (gone) await ctx.db.delete(id)
    else await ctx.db.patch(id, { lastSent: day })
  },
})
