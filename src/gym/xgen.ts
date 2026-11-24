// Small crossword generator: places words so each new one crosses an existing one,
// with no accidental side-by-side letters. Deterministic for a given random function.
export type XEntry = { num: number; dir: 'a' | 'd'; r: number; c: number; word: string; clue: string; en: string }
export type XPuzzle = { rows: number; cols: number; grid: (string | null)[][]; entries: XEntry[] }

export function makeCrossword(list: [string, string, string][], rnd: () => number, target = 7, maxSize = 11): XPuzzle {
  const seen = new Set<string>()
  const pool = list
    .filter(([w]) => /^[a-z]{3,9}$/.test(w) && !seen.has(w) && (seen.add(w), true))
    .map((x) => [rnd(), x] as const)
    .sort((a, b) => a[0] - b[0])
    .map((x) => x[1])
  const cells = new Map<string, string>()
  const placed: { r: number; c: number; dir: 'a' | 'd'; word: string; clue: string; en: string }[] = []
  const at = (r: number, c: number) => cells.get(r + ',' + c)
  const bounds = () => {
    let r0 = 0, r1 = 0, c0 = 0, c1 = 0, first = true
    for (const k of cells.keys()) {
      const [r, c] = k.split(',').map(Number)
      if (first) { r0 = r1 = r; c0 = c1 = c; first = false } else { r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c) }
    }
    return { r0, r1, c0, c1 }
  }
  const fits = (word: string, r: number, c: number, dir: 'a' | 'd') => {
    const dr = dir === 'd' ? 1 : 0, dc = dir === 'a' ? 1 : 0
    if (at(r - dr, c - dc) || at(r + dr * word.length, c + dc * word.length)) return false
    let crosses = 0
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i, cc = c + dc * i, ex = at(rr, cc)
      if (ex) { if (ex !== word[i]) return false; crosses++; continue }
      // no letters directly beside a new (non-crossing) cell
      if (at(rr + dc, cc + dr) || at(rr - dc, cc - dr)) return false
    }
    if (crosses === 0 || crosses === word.length) return false
    // keep the grid small enough for a phone
    const b = bounds()
    const r0 = Math.min(b.r0, r), r1 = Math.max(b.r1, r + dr * (word.length - 1))
    const c0 = Math.min(b.c0, c), c1 = Math.max(b.c1, c + dc * (word.length - 1))
    return r1 - r0 + 1 <= maxSize && c1 - c0 + 1 <= maxSize
  }
  const put = (word: string, clue: string, en: string, r: number, c: number, dir: 'a' | 'd') => {
    for (let i = 0; i < word.length; i++) cells.set((dir === 'd' ? r + i : r) + ',' + (dir === 'a' ? c + i : c), word[i])
    placed.push({ r, c, dir, word, clue, en })
  }
  // start with a longer word across
  const firstIdx = pool.findIndex(([w]) => w.length >= 6)
  const [w0, k0, e0] = pool.splice(firstIdx < 0 ? 0 : firstIdx, 1)[0]
  put(w0, k0, e0, 0, 0, 'a')
  for (const [w, clue, en] of pool) {
    if (placed.length >= target) break
    const options: [number, number, 'a' | 'd'][] = []
    for (const p of placed) {
      const dir = p.dir === 'a' ? 'd' : 'a'
      for (let i = 0; i < w.length; i++)
        for (let j = 0; j < p.word.length; j++) {
          if (w[i] !== p.word[j]) continue
          const pr = p.dir === 'd' ? p.r + j : p.r, pc = p.dir === 'a' ? p.c + j : p.c
          const r = dir === 'd' ? pr - i : pr, c = dir === 'a' ? pc - i : pc
          if (fits(w, r, c, dir)) options.push([r, c, dir])
        }
    }
    if (options.length) {
      const [r, c, dir] = options[Math.floor(rnd() * options.length)]
      put(w, clue, en, r, c, dir)
    }
  }
  const b = bounds()
  const rows = b.r1 - b.r0 + 1, cols = b.c1 - b.c0 + 1
  const grid: (string | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
  for (const [k, v] of cells) {
    const [r, c] = k.split(',').map(Number)
    grid[r - b.r0][c - b.c0] = v
  }
  // number the starts in reading order
  const starts = placed.map((p) => ({ ...p, r: p.r - b.r0, c: p.c - b.c0 })).sort((a, b2) => a.r - b2.r || a.c - b2.c)
  const nums = new Map<string, number>()
  let n = 0
  const entries: XEntry[] = starts.map((p) => {
    const key = p.r + ',' + p.c
    if (!nums.has(key)) nums.set(key, ++n)
    return { num: nums.get(key)!, dir: p.dir, r: p.r, c: p.c, word: p.word, clue: p.clue, en: p.en }
  })
  return { rows, cols, grid, entries }
}
