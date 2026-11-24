import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()
// Daily reminders: every hour, each subscriber whose local reminder hour it is.
crons.hourly("push reminders", { minuteUTC: 0 }, internal.pushNode.sendDue, {})
export default crons
