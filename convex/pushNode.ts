"use node"
import webpush from "web-push"
import { internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { APP_HOME } from "../shared/routes"

// Delivers the reminders chosen by push.due (runs every hour from crons.ts).
export const sendDue = internalAction({
  args: {},
  handler: async (ctx) => {
    const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY
    if (!pub || !priv) return { sent: 0 }
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:everton.martins1995@gmail.com", pub, priv)
    const list = await ctx.runQuery(internal.push.due, {})
    let sent = 0
    for (const s of list) {
      let gone = false
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: s.title, body: s.body, url: APP_HOME }),
          { TTL: 6 * 3600, urgency: "normal" },
        )
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        gone = code === 404 || code === 410 // the browser dropped this subscription
        if (!gone) console.warn("push failed", code)
      }
      await ctx.runMutation(internal.push.markSent, { id: s.id as Id<"pushSubs">, day: s.day, gone })
    }
    return { sent }
  },
})
