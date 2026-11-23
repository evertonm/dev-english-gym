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
  }).index("by_user", ["userId"]),
  mistakes: defineTable({
    userId: v.id("users"),
    wrong: v.string(),
    better: v.string(),
    tip: v.string(),
    due: v.number(),
    interval: v.number(),
    reps: v.number(),
  })
    .index("by_user_due", ["userId", "due"])
    .index("by_user_better", ["userId", "better"]),
  aiUsage: defineTable({
    userId: v.id("users"),
    day: v.string(),
    count: v.number(),
    // Voice transcriptions today (cheap, so they don't use the message quota; capped separately)
    stt: v.optional(v.number()),
  }).index("by_user_day", ["userId", "day"]),
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
    .index("by_user", ["userId"]),
  // AI calls made by the whole app per day, to stay inside the Gemini project quota.
  aiGlobal: defineTable({
    day: v.string(),
    count: v.number(),
  }).index("by_day", ["day"]),
})
