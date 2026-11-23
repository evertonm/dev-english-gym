import { internalMutation } from "./_generated/server"
import { encrypt, isEncrypted, lookupHash } from "./crypto"

// One-off: encrypt review items saved before encryption, and drop social name/photo.
// Run with: npx convex run migrations:encryptExisting (add --prod for production).
export const encryptExisting = internalMutation({
  args: {},
  handler: async (ctx) => {
    let mistakes = 0
    for (const m of await ctx.db.query("mistakes").collect()) {
      if (isEncrypted(m.better) && m.bh) continue
      const better = isEncrypted(m.better) ? null : m.better
      await ctx.db.patch(m._id, {
        wrong: isEncrypted(m.wrong) ? m.wrong : await encrypt(m.wrong),
        better: better === null ? m.better : await encrypt(better),
        tip: isEncrypted(m.tip) ? m.tip : await encrypt(m.tip),
        ...(better !== null ? { bh: await lookupHash(better) } : {}),
      })
      mistakes++
    }
    let users = 0
    for (const u of await ctx.db.query("users").collect()) {
      if (u.name !== undefined || u.image !== undefined) {
        await ctx.db.patch(u._id, { name: undefined, image: undefined })
        users++
      }
    }
    return { mistakes, users }
  },
})
