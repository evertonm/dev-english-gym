import type { Id } from "./_generated/dataModel"

// Accounts listed in ADMIN_EMAILS (Convex dashboard) see the metrics panel and have no AI limits.
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean)
}

export async function isAdmin(ctx: { db: { get: (id: Id<"users">) => Promise<{ email?: string } | null> } }, userId: Id<"users"> | null): Promise<boolean> {
  if (!userId) return false
  const u = await ctx.db.get(userId)
  return !!u?.email && adminEmails().includes(u.email.toLowerCase())
}
