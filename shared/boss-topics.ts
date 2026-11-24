// Use the existing synced board record for up to three evidenced topics per boss.
export const BOSS_TOPIC_KEY = /^boss-topic:\d{1,2}:[a-z0-9_-]{1,48}$/

export function savedBossTopicIds(board: Record<string, number>, world: number): string[] {
  const prefix = `boss-topic:${world}:`
  return Object.keys(board).filter(key => key.startsWith(prefix) && BOSS_TOPIC_KEY.test(key) && board[key] > 0)
    .slice(0, 3).map(key => key.slice(prefix.length))
}

export function rememberBossTopics(board: Record<string, number>, world: number, topicIds: Iterable<string>): void {
  const saved = new Set(savedBossTopicIds(board, world))
  for (const id of topicIds) {
    if (saved.size >= 3) break
    const key = `boss-topic:${world}:${id}`
    if (!BOSS_TOPIC_KEY.test(key)) continue
    board[key] = 1
    saved.add(id)
  }
}
