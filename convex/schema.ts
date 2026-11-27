import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }).index("email", ["email"]),
  progress: defineTable({
    userId: v.id("users"),
    xp: v.number(),
    streak: v.number(),
    last: v.string(),
    units: v.record(v.string(), v.number()),
    lessons: v.record(v.string(), v.number()),
    // Gamification (optional: rows saved before it existed stay valid)
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
    // Board game: squares cleared (chests, quizzes, bosses) and today's dice roll
    board: v.optional(v.record(v.string(), v.number())),
    diceDay: v.optional(v.string()),
    diceVal: v.optional(v.number()),
    // Server-side XP guard: XP gained on the server day `srvDay` so far.
    srvDay: v.optional(v.string()),
    srvGain: v.optional(v.number()),
    // Today's Termo guesses, so the game continues (and stays locked) on any device.
    termo: v.optional(v.object({ day: v.string(), guesses: v.array(v.string()) })),
  }).index("by_user", ["userId"]),
  mistakes: defineTable({
    userId: v.id("users"),
    wrong: v.string(),
    better: v.string(),
    tip: v.string(),
    due: v.number(),
    interval: v.number(),
    reps: v.number(),
    // wrong/better/tip are stored encrypted (convex/crypto.ts); bh = HMAC of `better` for de-duplication.
    bh: v.optional(v.string()),
  })
    .index("by_user_due", ["userId", "due"])
    .index("by_user_bh", ["userId", "bh"]),
  aiUsage: defineTable({
    userId: v.id("users"),
    day: v.string(),
    count: v.number(),
    // Voice transcriptions today (cheap, so they don't use the message quota; capped separately)
    stt: v.optional(v.number()),
  }).index("by_user_day", ["userId", "day"]),
  // Web push subscriptions (one per browser). The client keeps last/streak up to date so reminders
  // work for guests too. tz = minutes east of UTC (Brasília = -180); hour = local reminder hour.
  pushSubs: defineTable({
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    anon: v.string(),
    userId: v.optional(v.id("users")),
    tz: v.number(),
    hour: v.number(),
    last: v.optional(v.string()),
    streak: v.optional(v.number()),
    lastSent: v.optional(v.string()),
  })
    .index("by_endpoint", ["endpoint"])
    .index("by_hour", ["hour"]),
  // Public nickname and invite code (no e-mail is ever shown to other learners).
  profiles: defineTable({
    userId: v.id("users"),
    nick: v.string(),
    refCode: v.string(),
    refBy: v.optional(v.id("users")),
    refCount: v.number(),
    bonusUntil: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["refCode"]),
  // Weekly league: one row per learner per week; groups of 20 inside a division.
  league: defineTable({ userId: v.id("users"), week: v.string(), div: v.number(), cohort: v.number(), xp: v.number(), nick: v.string() })
    .index("by_user_week", ["userId", "week"])
    .index("by_group", ["week", "div", "cohort", "xp"]),
  // Course certificates, one per finished world, checked publicly by code.
  certificates: defineTable({ code: v.string(), userId: v.id("users"), world: v.number(), name: v.string(), ts: v.number() })
    .index("by_code", ["code"])
    .index("by_user", ["userId", "world"]),
  // Mock interview results (score only; the transcript is not stored).
  interviews: defineTable({ userId: v.id("users"), role: v.string(), stage: v.string(), overall: v.number(), ts: v.number() }).index("by_user", ["userId"]),
  // Cached text-to-speech audio (see tts.ts) and the daily count of new generations.
  ttsCache: defineTable({ hash: v.string(), storageId: v.id("_storage"), ts: v.number() }).index("by_hash", ["hash"]),
  ttsDaily: defineTable({ day: v.string(), count: v.number() }).index("by_day", ["day"]),
  // First-party usage events for the admin dashboard (see analytics.ts).
  events: defineTable({
    name: v.string(),
    anon: v.string(),
    userId: v.optional(v.id("users")),
    props: v.optional(v.string()),
    day: v.string(),
    ts: v.number(),
  })
    .index("by_day", ["day"])
    .index("by_anon_day", ["anon", "day"])
    .index("by_user", ["userId"])
    .index("by_user_ts", ["userId", "ts"]),
  // AI calls made by the whole app per day, to stay inside the Gemini project quota.
  aiGlobal: defineTable({
    day: v.string(),
    count: v.number(),
  }).index("by_day", ["day"]),
})
