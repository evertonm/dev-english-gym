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
  }).index("by_user_day", ["userId", "day"]),
})
