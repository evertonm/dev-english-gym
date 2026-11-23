import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import LinkedIn from "@auth/core/providers/linkedin";
import { ResendOTP } from "./ResendOTP";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// E-mail + password works without sending any e-mail, so it needs no domain.
// ResendOTP (code by e-mail) stays configured for when a verified sending domain exists.
const EmailPassword = Password({
  profile(params) {
    const email = String(params.email ?? "")
      .trim()
      .toLowerCase();
    return { email };
  },
  validatePasswordRequirements(password: string) {
    if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT");
  },
});

// Social sign-in turns on only when its credentials are set in the Convex dashboard:
// AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET and AUTH_LINKEDIN_ID / AUTH_LINKEDIN_SECRET.
const social = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [Google]
    : []),
  ...(process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET
    ? [LinkedIn]
    : []),
];

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [EmailPassword, ResendOTP, ...social],
  callbacks: {
    // One person = one account, whatever the sign-in method.
    // Google / LinkedIn / e-mail code prove the address, so they join the account that
    // already has that e-mail. Password sign-up proves nothing (no confirmation e-mail),
    // so it may never take over an e-mail that already has an account.
    async createOrUpdateUser(anyCtx, args) {
      return await linkUser(anyCtx as unknown as MutationCtx, args);
    },
  },
});

export async function linkUser(
  ctx: MutationCtx,
  args: {
    existingUserId: Id<"users"> | null;
    provider: { type: string };
    profile: Record<string, unknown>;
  },
): Promise<Id<"users">> {
  {
    const type = args.provider.type;
    const trusted = type === "oauth" || type === "oidc" || type === "email";
    const p = args.profile as Record<string, unknown>;
    const email =
      typeof p.email === "string" ? p.email.trim().toLowerCase() : undefined;
    const extra: { name?: string; image?: string } = {};
    // Data minimisation: the app needs only the e-mail, so name and photo from Google/LinkedIn are not kept.
    const verified =
      trusted && email ? { emailVerificationTime: Date.now() } : {};

    const owners = email
      ? (
          await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", email))
            .collect()
        ).sort((a, b) => a._creationTime - b._creationTime)
      : [];

    if (args.existingUserId) {
      const current = args.existingUserId;
      const main = trusted ? owners.find((u) => u._id !== current) : undefined;
      if (main) {
        await mergeUser(ctx, current, main._id);
        await ctx.db.patch(main._id, {
          ...fillMissing(main, extra),
          ...verified,
        });
        return main._id;
      }
      const me = await ctx.db.get(current);
      if (me)
        await ctx.db.patch(current, { ...fillMissing(me, extra), ...verified });
      return current;
    }

    const main = owners[0];
    if (main) {
      if (!trusted) throw new Error("EMAIL_IN_USE");
      await ctx.db.patch(main._id, {
        ...fillMissing(main, extra),
        ...verified,
      });
      return main._id;
    }
    return await ctx.db.insert("users", {
      ...(email ? { email } : {}),
      ...extra,
      ...verified,
    });
  }
}

function fillMissing(
  user: { name?: string; image?: string },
  extra: { name?: string; image?: string },
) {
  return {
    ...(extra.name && !user.name ? { name: extra.name } : {}),
    ...(extra.image && !user.image ? { image: extra.image } : {}),
  };
}

// Folds a duplicate account into the main one (same e-mail): keeps the further-along
// progress, moves mistakes, usage and sign-in methods, then removes the duplicate.
async function mergeUser(ctx: MutationCtx, from: Id<"users">, to: Id<"users">) {
  const fromP = await ctx.db
    .query("progress")
    .withIndex("by_user", (q) => q.eq("userId", from))
    .first();
  const toP = await ctx.db
    .query("progress")
    .withIndex("by_user", (q) => q.eq("userId", to))
    .first();
  if (fromP) {
    if (!toP) await ctx.db.patch(fromP._id, { userId: to });
    else {
      if (fromP.xp > toP.xp) {
        const { _id, _creationTime, userId, ...rest } = fromP;
        void _id;
        void _creationTime;
        void userId;
        await ctx.db.patch(toP._id, rest);
      }
      await ctx.db.delete(fromP._id);
    }
  }
  for (const m of await ctx.db
    .query("mistakes")
    .withIndex("by_user_due", (q) => q.eq("userId", from))
    .collect())
    await ctx.db.patch(m._id, { userId: to });
  for (const u of await ctx.db
    .query("aiUsage")
    .withIndex("by_user_day", (q) => q.eq("userId", from))
    .collect()) {
    const same = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_day", (q) => q.eq("userId", to).eq("day", u.day))
      .first();
    if (same) {
      await ctx.db.patch(same._id, {
        count: same.count + u.count,
        stt: (same.stt ?? 0) + (u.stt ?? 0),
      });
      await ctx.db.delete(u._id);
    } else await ctx.db.patch(u._id, { userId: to });
  }
  for (const e of await ctx.db
    .query("events")
    .withIndex("by_user", (q) => q.eq("userId", from))
    .collect())
    await ctx.db.patch(e._id, { userId: to });
  for (const a of await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", from))
    .collect())
    await ctx.db.patch(a._id, { userId: to });
  for (const s of await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", from))
    .collect()) {
    for (const t of await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", s._id))
      .collect())
      await ctx.db.delete(t._id);
    await ctx.db.delete(s._id);
  }
  await ctx.db.delete(from);
}
