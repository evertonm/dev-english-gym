import { query, mutation } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"
import type { Doc, Id } from "./_generated/dataModel"
import { logEvent } from "./analytics"

import { prevWeek, weekEnds, weekKey } from "../shared/week"
export { weekKey }

export const DIVISIONS = ["Bronze", "Prata", "Ouro", "Safira", "Diamante"]
const GROUP = 20
const ZONE = 5 // top 5 go up, bottom 5 go down
const REF_BONUS_DAYS = 7
const REF_BONUS_AI = 10 // extra AI messages per day while the bonus lasts
const REF_MAX_REWARDS = 30
const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789"

function randomCode(n: number): string {
  const b = new Uint8Array(n)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => CODE_CHARS[x % CODE_CHARS.length]).join("")
}
function cleanNick(s: string): string {
  return s.normalize("NFC").replace(/[^\p{L}\p{N} _.-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 18)
}

async function profileOf(ctx: QueryCtx, userId: Id<"users">) {
  return ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique()
}
async function ensureProfile(ctx: MutationCtx, userId: Id<"users">): Promise<Doc<"profiles">> {
  const p = await profileOf(ctx, userId)
  if (p) return p
  const user = await ctx.db.get(userId)
  const first = cleanNick(String(user?.name ?? "").split(" ")[0] ?? "")
  let refCode = randomCode(6)
  while (await ctx.db.query("profiles").withIndex("by_code", (q) => q.eq("refCode", refCode)).first()) refCode = randomCode(6)
  const id = await ctx.db.insert("profiles", { userId, nick: first.length >= 2 ? first : "Dev " + refCode.slice(0, 4).toUpperCase(), refCode, refCount: 0 })
  return (await ctx.db.get(id))!
}

// Extra AI messages per day from a referral bonus (0 when none is active).
export async function aiBonus(ctx: QueryCtx, userId: Id<"users">): Promise<number> {
  const p = await profileOf(ctx, userId)
  return p?.bonusUntil && p.bonusUntil > Date.now() ? REF_BONUS_AI : 0
}

// ---------- Weekly leagues ----------
async function groupRows(ctx: QueryCtx, week: string, div: number, cohort: number) {
  return ctx.db
    .query("league")
    .withIndex("by_group", (q) => q.eq("week", week).eq("div", div).eq("cohort", cohort))
    .order("desc")
    .take(GROUP + 5)
}

// Where the learner starts this week: promoted, kept or relegated from last week's group.
async function startDivision(ctx: QueryCtx, userId: Id<"users">, week: string): Promise<number> {
  const prev = await ctx.db.query("league").withIndex("by_user_week", (q) => q.eq("userId", userId).eq("week", prevWeek(week))).unique()
  if (!prev) {
    const older = await ctx.db.query("league").withIndex("by_user_week", (q) => q.eq("userId", userId)).order("desc").first()
    return older ? Math.max(0, older.div - 1) : 0
  }
  const rows = await groupRows(ctx, prev.week, prev.div, prev.cohort)
  const rank = rows.findIndex((r) => r.userId === userId)
  if (rank >= 0 && rank < ZONE && prev.xp > 0) return Math.min(DIVISIONS.length - 1, prev.div + 1)
  if (rows.length >= 10 && rank >= rows.length - ZONE) return Math.max(0, prev.div - 1)
  return prev.div
}

// Called from progress.save with the XP the server accepted.
export async function addWeeklyXp(ctx: MutationCtx, userId: Id<"users">, gain: number) {
  if (!(gain > 0)) return
  const week = weekKey()
  const row = await ctx.db.query("league").withIndex("by_user_week", (q) => q.eq("userId", userId).eq("week", week)).unique()
  if (row) {
    await ctx.db.patch(row._id, { xp: row.xp + gain })
    return
  }
  const profile = await ensureProfile(ctx, userId)
  const div = await startDivision(ctx, userId, week)
  const last = await ctx.db.query("league").withIndex("by_group", (q) => q.eq("week", week).eq("div", div)).order("desc").first()
  let cohort = last?.cohort ?? 0
  if (last && (await groupRows(ctx, week, div, cohort)).length >= GROUP) cohort++
  await ctx.db.insert("league", { userId, week, div, cohort, xp: gain, nick: profile.nick })
}

export const league = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const week = weekKey()
    const mine = await ctx.db.query("league").withIndex("by_user_week", (q) => q.eq("userId", userId).eq("week", week)).unique()
    const ends = weekEnds(week)
    if (!mine) return { joined: false as const, div: await startDivision(ctx, userId, week), divisions: DIVISIONS, ends }
    const rows = (await groupRows(ctx, week, mine.div, mine.cohort)).slice(0, GROUP)
    const players = rows.map((r, i) => ({ pos: i + 1, nick: r.nick, xp: r.xp, me: r.userId === userId }))
    return { joined: true as const, div: mine.div, divisions: DIVISIONS, ends, players, zone: ZONE, size: rows.length }
  },
})

export const setNick = mutation({
  args: { nick: v.string() },
  handler: async (ctx, { nick }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: "UNAUTHENTICATED" }
    const n = cleanNick(nick)
    if (n.length < 2) return { ok: false as const, code: "BAD_INPUT" }
    const p = await ensureProfile(ctx, userId)
    await ctx.db.patch(p._id, { nick: n })
    const row = await ctx.db.query("league").withIndex("by_user_week", (q) => q.eq("userId", userId).eq("week", weekKey())).unique()
    if (row) await ctx.db.patch(row._id, { nick: n })
    return { ok: true as const, nick: n }
  },
})

// ---------- Profile, referral ----------
export const profile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const p = await profileOf(ctx, userId)
    if (!p) return { nick: "", refCode: "", refCount: 0, bonusUntil: 0, referred: false, bonusAi: REF_BONUS_AI, bonusDays: REF_BONUS_DAYS }
    return { nick: p.nick, refCode: p.refCode, refCount: p.refCount, bonusUntil: p.bonusUntil ?? 0, referred: !!p.refBy, bonusAi: REF_BONUS_AI, bonusDays: REF_BONUS_DAYS }
  },
})

// Creates the profile (and the invite code) on first use.
export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const p = await ensureProfile(ctx, userId)
    return { refCode: p.refCode }
  },
})

export const claimReferral = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: "UNAUTHENTICATED" }
    const c = code.trim().toLowerCase()
    if (!/^[a-z0-9]{6}$/.test(c)) return { ok: false as const, code: "BAD_INPUT" }
    const owner = await ctx.db.query("profiles").withIndex("by_code", (q) => q.eq("refCode", c)).unique()
    if (!owner) return { ok: false as const, code: "NOT_FOUND" }
    if (owner.userId === userId) return { ok: false as const, code: "SELF" }
    const me = await ensureProfile(ctx, userId)
    if (me.refBy) return { ok: false as const, code: "ALREADY" }
    const user = await ctx.db.get(userId)
    // Only new accounts can be invited (a week to use the link).
    if (!user || Date.now() - user._creationTime > 7 * 86_400_000) return { ok: false as const, code: "TOO_OLD" }
    const until = (from?: number) => Math.max(from ?? 0, Date.now()) + REF_BONUS_DAYS * 86_400_000
    await ctx.db.patch(me._id, { refBy: owner.userId, bonusUntil: until(me.bonusUntil) })
    if (owner.refCount < REF_MAX_REWARDS) await ctx.db.patch(owner._id, { refCount: owner.refCount + 1, bonusUntil: until(owner.bonusUntil) })
    else await ctx.db.patch(owner._id, { refCount: owner.refCount + 1 })
    await logEvent(ctx, "referral", userId)
    return { ok: true as const, days: REF_BONUS_DAYS, ai: REF_BONUS_AI }
  },
})

// ---------- Certificates (one per finished world; public and verifiable by code) ----------
export const issueCertificate = mutation({
  args: { world: v.number(), name: v.string() },
  handler: async (ctx, { world, name }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: "UNAUTHENTICATED" }
    const w = Math.round(world)
    const full = name.normalize("NFC").replace(/[^\p{L} '.-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 60)
    if (!(w >= 0 && w <= 20) || full.split(" ").length < 2 || full.length < 5) return { ok: false as const, code: "BAD_INPUT" }
    const p = await ctx.db.query("progress").withIndex("by_user", (q) => q.eq("userId", userId)).unique()
    if (!p?.board?.[`w${w}t15`]) return { ok: false as const, code: "NOT_DONE" }
    const old = await ctx.db.query("certificates").withIndex("by_user", (q) => q.eq("userId", userId).eq("world", w)).unique()
    if (old) {
      if (old.name !== full) await ctx.db.patch(old._id, { name: full })
      return { ok: true as const, code: old.code }
    }
    let code = randomCode(10)
    while (await ctx.db.query("certificates").withIndex("by_code", (q) => q.eq("code", code)).first()) code = randomCode(10)
    await ctx.db.insert("certificates", { code, userId, world: w, name: full, ts: Date.now() })
    await logEvent(ctx, "certificate", userId, undefined, String(w))
    return { ok: true as const, code }
  },
})

export const myCertificates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []
    const rows = await ctx.db.query("certificates").withIndex("by_user", (q) => q.eq("userId", userId)).take(25)
    return rows.map((r) => ({ code: r.code, world: r.world, name: r.name, ts: r.ts }))
  },
})

// Public: anyone with the code can check it. Shows only what is printed on the certificate.
export const certificate = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    if (!/^[a-z0-9]{10}$/.test(code)) return null
    const r = await ctx.db.query("certificates").withIndex("by_code", (q) => q.eq("code", code)).unique()
    return r ? { code: r.code, world: r.world, name: r.name, ts: r.ts } : null
  },
})

// ---------- Weekly report ----------
export const weeklyReport = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const week = weekKey()
    const row = (w: string) => ctx.db.query("league").withIndex("by_user_week", (q) => q.eq("userId", userId).eq("week", w)).unique()
    const [now, before] = await Promise.all([row(week), row(prevWeek(week))])
    const since = Date.parse(week + "T00:00:00Z")
    const ivs = (await ctx.db.query("interviews").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").take(30)).filter((r) => r.ts >= since)
    const events = await ctx.db
      .query("events")
      .withIndex("by_user_ts", (q) => q.eq("userId", userId).gte("ts", since))
      .take(500)
    const count = (n: string) => events.filter((e) => e.name === n).length
    let rank = 0
    if (now) rank = (await groupRows(ctx, week, now.div, now.cohort)).findIndex((r) => r.userId === userId) + 1
    return {
      week,
      xp: now?.xp ?? 0,
      lastXp: before?.xp ?? 0,
      div: now?.div ?? null,
      rank,
      interviews: ivs.length,
      interviewAvg: ivs.length ? Math.round(ivs.reduce((a, r) => a + r.overall, 0) / ivs.length) : 0,
      lessons: count("lesson_done"),
      squares: count("board_done"),
      ai: count("ai_call"),
      polish: count("polish"),
    }
  },
})
