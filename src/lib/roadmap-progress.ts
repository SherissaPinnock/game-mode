const KEY = (gameId: string) => `roadmap-progress-${gameId}`

export function getCompletedLevels(gameId: string): Set<string> {
  try {
    const raw = localStorage.getItem(KEY(gameId))
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function markLevelComplete(gameId: string, levelId: string): void {
  const completed = getCompletedLevels(gameId)
  completed.add(levelId)
  localStorage.setItem(KEY(gameId), JSON.stringify([...completed]))
}

export function resetProgress(gameId: string): void {
  localStorage.removeItem(KEY(gameId))
}
