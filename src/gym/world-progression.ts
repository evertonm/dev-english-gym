export function worldUnlocked(board: Record<string, number>, level: number): boolean {
  return level === 0 || (level > 0 && board[`w${level - 1}t15`] > 0)
}

export function highestUnlockedWorld(board: Record<string, number>, worldCount: number): number {
  for (let level = worldCount - 1; level > 0; level--) {
    if (worldUnlocked(board, level)) return level
  }
  return 0
}
