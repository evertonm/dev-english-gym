// Weeks run Monday to Sunday in UTC (Sunday 21:00 in Brasília). The key is the Monday's date.
export function weekKey(t = Date.now()): string {
  const d = new Date(t)
  const day = (d.getUTCDay() + 6) % 7
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString().slice(0, 10)
}
export function prevWeek(w: string): string {
  return weekKey(Date.parse(w + "T12:00:00Z") - 7 * 86_400_000)
}
export function weekEnds(w: string): number {
  return Date.parse(w + "T00:00:00Z") + 7 * 86_400_000
}
// Placement test: the level is the highest one passed (2 of 3 right) with every level below it passed too.
export function placementLevel(rightByLevel: number[], maxLevel: number, need = 2): number {
  let lv = 0
  for (let w = 0; w < rightByLevel.length; w++) {
    if (rightByLevel[w] >= need) lv = w + 1
    else break
  }
  return Math.min(lv, maxLevel)
}
