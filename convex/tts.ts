import { v } from "convex/values"
import { action, internalMutation, internalQuery } from "./_generated/server"
import { internal } from "./_generated/api"
import { utcDay } from "./perks"

// Natural voice for lesson narration and English sentences (OpenAI text-to-speech).
// Every distinct text is generated once and cached in Convex file storage, so repeated plays are free.
// New generations are capped per day for the whole app to keep cost predictable.
const TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts"
const DAILY_NEW = Number(process.env.TTS_DAILY_NEW ?? 400)
const MAX_CHARS = 900

const VOICES = {
  // Lesson narration: Brazilian Portuguese explanation with English examples, one voice.
  pt: {
    voice: process.env.OPENAI_TTS_VOICE_PT || "nova",
    instructions:
      "You are a friendly, upbeat Brazilian English teacher. Speak the Portuguese parts in natural Brazilian Portuguese (São Paulo accent), warm and clear, at a relaxed pace. " +
      "Speak every English word or sentence with a natural General American accent, as a native speaker would, then continue in Portuguese. Pause briefly between examples.",
  },
  // English sentences and phrases.
  en: {
    voice: process.env.OPENAI_TTS_VOICE_EN || "nova",
    instructions: "Speak in natural, clear General American English at a calm, conversational pace, like a friendly coworker.",
  },
} as const

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("")
}

export const lookup = internalQuery({
  args: { hash: v.string() },
  handler: async (ctx, { hash }) => {
    const row = await ctx.db.query("ttsCache").withIndex("by_hash", (q) => q.eq("hash", hash)).first()
    return row ? await ctx.storage.getUrl(row.storageId) : null
  },
})

// Reserves one new generation for today; false when the daily cap is reached.
export const reserve = internalMutation({
  args: {},
  handler: async (ctx) => {
    const day = utcDay()
    const row = await ctx.db.query("ttsDaily").withIndex("by_day", (q) => q.eq("day", day)).first()
    if (row && row.count >= DAILY_NEW) return false
    if (row) await ctx.db.patch(row._id, { count: row.count + 1 })
    else await ctx.db.insert("ttsDaily", { day, count: 1 })
    return true
  },
})

export const save = internalMutation({
  args: { hash: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { hash, storageId }) => {
    const dup = await ctx.db.query("ttsCache").withIndex("by_hash", (q) => q.eq("hash", hash)).first()
    if (dup) {
      await ctx.storage.delete(storageId)
      return await ctx.storage.getUrl(dup.storageId)
    }
    await ctx.db.insert("ttsCache", { hash, storageId, ts: Date.now() })
    return await ctx.storage.getUrl(storageId)
  },
})

export const speak = action({
  args: { text: v.string(), lang: v.union(v.literal("pt"), v.literal("en")) },
  handler: async (ctx, { text, lang }): Promise<{ ok: true; url: string } | { ok: false; code: string }> => {
    const input = text.replace(/\s+/g, " ").trim()
    if (!input || input.length > MAX_CHARS) return { ok: false, code: "BAD_INPUT" }
    const cfg = VOICES[lang]
    const hash = await sha256([TTS_MODEL, cfg.voice, cfg.instructions, input].join("|"))
    const cached = await ctx.runQuery(internal.tts.lookup, { hash })
    if (cached) return { ok: true, url: cached }

    const key = process.env.OPENAI_API_KEY
    if (!key) return { ok: false, code: "NO_PROVIDER" }
    if (!(await ctx.runMutation(internal.tts.reserve, {}))) return { ok: false, code: "BUSY" }
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20_000)
    try {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: TTS_MODEL, voice: cfg.voice, input, instructions: cfg.instructions, response_format: "mp3" }),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        console.warn(`TTS failed (${res.status})`)
        return { ok: false, code: "ERROR" }
      }
      const storageId = await ctx.storage.store(new Blob([await res.arrayBuffer()], { type: "audio/mpeg" }))
      const url = await ctx.runMutation(internal.tts.save, { hash, storageId })
      return url ? { ok: true, url } : { ok: false, code: "ERROR" }
    } catch {
      return { ok: false, code: "ERROR" }
    } finally {
      clearTimeout(timer)
    }
  },
})
