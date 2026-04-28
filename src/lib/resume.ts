import { remoteSaveGame, remoteLoadGame, remoteDeleteGame } from './supabaseApi'

export interface SavedGame<T = unknown> {
  gameId: string
  savedAt: number
  label: string   // e.g. "Incident 2 of 3" or "Level 3 of 5"
  state: T
}

const key = (gameId: string) => `resume_${gameId}`

// ─── localStorage (sync, instant) ────────────────────────────────────────────

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

// ─── Supabase (async, cross-device) ──────────────────────────────────────────

/**
 * Write to both localStorage (instant) and Supabase (cross-device).
 * Call this instead of `saveGame` from components that have a userId.
 */
export async function saveGameWithSync<T>(
  gameId: string,
  state: T,
  label: string,
  userId: string | null,
): Promise<void> {
  saveGame(gameId, state, label)
  console.log('[saveGameWithSync] userId=', userId, 'gameId=', gameId)
  if (userId) {
    await remoteSaveGame(userId, gameId, state, label)
    console.log('[saveGameWithSync] remote save complete')
  } else {
    console.warn('[saveGameWithSync] userId is null — remote save skipped')
  }
}

/**
 * Load from Supabase first (newest across devices), fall back to localStorage.
 * Returns null if no save exists anywhere.
 */
export async function loadGameWithSync<T>(
  gameId: string,
  userId: string | null,
): Promise<SavedGame<T> | null> {
  if (userId) {
    const remote = await remoteLoadGame<T>(userId, gameId)
    if (remote) {
      // Write remote state back to localStorage so sync ops stay fast
      saveGame(gameId, remote.state, remote.label)
      return { gameId, savedAt: remote.savedAt, label: remote.label, state: remote.state }
    }
  }
  return loadGame<T>(gameId)
}

/**
 * Delete from both localStorage and Supabase.
 */
export async function clearGameWithSync(
  gameId: string,
  userId: string | null,
): Promise<void> {
  clearGame(gameId)
  if (userId) {
    await remoteDeleteGame(userId, gameId)
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000)        return 'just now'
  if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}
