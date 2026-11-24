// Extra questions by level (A2, B1, B2, C1, C2, US), in the same shape as lesson questions.
import { BANK_A2, BANK_B1 } from './bank-a'
import { BANK_B2, BANK_C1, BANK_C2, BANK_US } from './bank-b'
import type { BankQ } from './bank-a'

const toQ = (b: BankQ) => Object.assign([b[0], b[1]], { why: b[2] })
export const BANK: any[][] = [BANK_A2, BANK_B1, BANK_B2, BANK_C1, BANK_C2, BANK_US].map((l) => l.map(toQ))

// Deterministic shuffle for "of the day" content: same questions for everyone on the same day.
export function seeded(seed: string) {
  let h = 1779033703
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353), (h = (h << 13) | (h >>> 19))
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}
