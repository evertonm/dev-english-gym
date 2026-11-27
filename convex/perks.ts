// Rank perks, shared by the AI gate and the client (via the `quota` query).
// The rank comes from the XP stored on the server, never from what the client claims in a request.

// Same ladder as the app (src/gym/engine.ts RANKS).
export const RANKS: [number, string][] = [
  [0, "Estagiário"],
  [100, "Júnior I"],
  [250, "Júnior II"],
  [500, "Pleno I"],
  [900, "Pleno II"],
  [1500, "Sênior I"],
  [2400, "Sênior II"],
  [3600, "Tech Lead"],
  [5200, "Staff"],
  [7500, "Principal"],
]

// AI messages per day (chat replies + writing corrections) by minimum XP.
// Sized for Gemini Flash-Lite: about US$0.0006 per message on the paid tier.
export const AI_TIERS: { xp: number; limit: number }[] = [
  { xp: 0, limit: 10 },
  { xp: 100, limit: 15 },
  { xp: 500, limit: 20 },
  { xp: 1500, limit: 30 },
  { xp: 3600, limit: 40 },
]

export function rankName(xp: number): string {
  let name = RANKS[0][1]
  for (const [min, n] of RANKS) if (xp >= min) name = n
  return name
}

export function aiLimitFor(xp: number): number {
  let limit = AI_TIERS[0].limit
  for (const t of AI_TIERS) if (xp >= t.xp) limit = t.limit
  return limit
}

export function nextAiTier(xp: number): { xp: number; limit: number; rank: string } | null {
  const t = AI_TIERS.find((x) => x.xp > xp)
  return t ? { ...t, rank: rankName(t.xp) } : null
}

// Most XP an account can gain in one server day. A very active day with the 2x streak bonus
// stays well under it; it stops a tampered client from jumping straight to the top rank.
export const MAX_XP_GAIN_PER_DAY = 3000
// Most XP accepted when an account's progress is saved for the first time (device progress merged on sign-in).
export const MAX_XP_FIRST_SAVE = 3000

export const utcDay = () => new Date().toISOString().slice(0, 10)
