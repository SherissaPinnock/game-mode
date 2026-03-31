export interface SavedGame<T = unknown> {
  gameId: string
  savedAt: number
  label: string   // e.g. "Incident 2 of 3" or "Level 3 of 5"
  state: T
}

const key = (gameId: string) => `resume_${gameId}`

export function saveGame<T>(gameId: string, state: T, label: string): void {
  try {
    const data: SavedGame<T> = { gameId, savedAt: Date.now(), label, state }
    localStorage.setItem(key(gameId), JSON.stringify(data))
  } catch { /* storage quota */ }
}

export function loadGame<T>(gameId: string): SavedGame<T> | null {
  try {
    const raw = localStorage.getItem(key(gameId))
    if (!raw) return null
    return JSON.parse(raw) as SavedGame<T>
  } catch {
    return null
  }
}

export function clearGame(gameId: string): void {
  localStorage.removeItem(key(gameId))
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000)        return 'just now'
  if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}
