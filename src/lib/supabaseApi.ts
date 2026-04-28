/**
 * supabaseApi.ts
 * All remote database operations.  Every function is safe to call even when
 * `supabase` is null (missing env vars) — it returns a sensible no-op value
 * so the app works fully offline with localStorage as the fallback.
 */

import { supabase } from './supabase'
import type { PerformanceEntry } from './performance'
import { computeStats } from './performance'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionPayload {
  userId:      string
  gameId:      string
  /** Raw in-game score (optional — derived from entries if omitted). */
  score?:      number
  /** Seconds the session lasted (optional). */
  durationSec?: number
  /** All question attempts for this session. */
  entries:     PerformanceEntry[]
  /** Game-specific extras stored in the metadata jsonb column. */
  metadata?:   Record<string, unknown>
}

export interface LeaderEntry {
  rank:           number
  userId:         string
  displayName:    string
  avatarInitials: string
  totalXp:        number
  sessionsPlayed: number
  avgAccuracyPct: number
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Derive XP and accuracy from a batch of performance entries. */
function deriveStats(entries: PerformanceEntry[]) {
  const total   = entries.length
  const correct = entries.filter(e => e.correct).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  // 10 XP per correct answer + accuracy bonus (0–50 XP)
  const xp = correct * 10 + Math.floor(accuracy / 10) * 5
  return { xp, accuracy, correct, total }
}

// ─── Sessions & Attempts ──────────────────────────────────────────────────────

/**
 * Insert a completed game session and all its question attempts.
 * The database trigger automatically updates `game_leaderboard`.
 * Returns the new session UUID, or null if offline.
 */
export async function persistSession(payload: SessionPayload): Promise<string | null> {
  if (!supabase) return null

  const { xp, accuracy, correct, total } = deriveStats(payload.entries)

  const { data: session, error: sessionErr } = await supabase
    .from('game_sessions')
    .insert({
      user_id:       payload.userId,
      game_id:       payload.gameId,
      score:         payload.score ?? xp,
      xp_earned:     xp,
      accuracy,
      correct_count: correct,
      total_count:   total,
      duration_sec:  payload.durationSec ?? null,
      metadata:      payload.metadata ?? {},
    })
    .select('id')
    .single()

  if (sessionErr || !session) {
    console.error('[supabaseApi] persistSession error:', sessionErr?.message)
    return null
  }

  if (payload.entries.length > 0) {
    const { error: attemptsErr } = await supabase
      .from('game_attempts')
      .insert(
        payload.entries.map(e => ({
          session_id: session.id,
          user_id:    payload.userId,
          game_id:    payload.gameId,
          category:   e.category,
          is_correct: e.correct,
          created_at: new Date(e.timestamp).toISOString(),
        })),
      )
    if (attemptsErr) {
      console.error('[supabaseApi] persistAttempts error:', attemptsErr.message)
    }
  }

  return session.id as string
}

// ─── Game Saves ───────────────────────────────────────────────────────────────

/** Upsert a resume-state slot for a user + game combination. */
export async function remoteSaveGame<T>(
  userId: string,
  gameId: string,
  state: T,
  label: string,
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('game_saves').upsert(
    {
      user_id:    userId,
      game_id:    gameId,
      save_state: state as unknown as Record<string, unknown>,
      label,
      saved_at:   new Date().toISOString(),
    },
    { onConflict: 'user_id,game_id' },
  )
  if (error) console.error('[supabaseApi] remoteSaveGame error:', error.message)
}

/** Load the saved resume state for a user + game. Returns null if not found or offline. */
export async function remoteLoadGame<T>(
  userId: string,
  gameId: string,
): Promise<{ state: T; label: string; savedAt: number } | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('game_saves')
    .select('save_state, label, saved_at')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle()

  if (error || !data) return null
  return {
    state:   data.save_state as T,
    label:   data.label as string,
    savedAt: new Date(data.saved_at as string).getTime(),
  }
}

/** Delete a user's save for a specific game. */
export async function remoteDeleteGame(userId: string, gameId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('game_saves')
    .delete()
    .eq('user_id', userId)
    .eq('game_id', gameId)
  if (error) console.error('[supabaseApi] remoteDeleteGame error:', error.message)
}

// ─── Roadmap Progress ─────────────────────────────────────────────────────────

/** Load the set of completed level IDs for a user + game. */
export async function remoteGetCompletedLevels(
  userId: string,
  gameId: string,
): Promise<Set<string>> {
  if (!supabase) return new Set()
  const { data, error } = await supabase
    .from('roadmap_progress')
    .select('completed_levels')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle()

  if (error || !data) return new Set()
  return new Set(data.completed_levels as string[])
}

/** Add a completed level ID and persist remotely. */
export async function remoteMarkLevelComplete(
  userId: string,
  gameId: string,
  levelId: string,
  existing: Set<string>,
): Promise<void> {
  if (!supabase) return
  const updated = [...existing, levelId]
  const { error } = await supabase.from('roadmap_progress').upsert(
    { user_id: userId, game_id: gameId, completed_levels: updated, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,game_id' },
  )
  if (error) console.error('[supabaseApi] remoteMarkLevelComplete error:', error.message)
}

/** Reset all completed levels for a user + game. */
export async function remoteResetProgress(userId: string, gameId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('roadmap_progress').upsert(
    { user_id: userId, game_id: gameId, completed_levels: [], updated_at: new Date().toISOString() },
    { onConflict: 'user_id,game_id' },
  )
  if (error) console.error('[supabaseApi] remoteResetProgress error:', error.message)
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

/** Fetch the global XP leaderboard, ranked by total_xp. */
export async function fetchGlobalLeaderboard(limit = 10): Promise<LeaderEntry[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('v_leaderboard_global')
    .select('user_id, display_name, avatar_initials, total_xp, sessions_played, avg_accuracy_pct, rank')
    .order('rank', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[supabaseApi] fetchGlobalLeaderboard error:', error.message)
    return []
  }

  return (data ?? []).map(row => ({
    rank:           row.rank           as number,
    userId:         row.user_id        as string,
    displayName:    row.display_name   as string,
    avatarInitials: row.avatar_initials as string,
    totalXp:        row.total_xp       as number,
    sessionsPlayed: row.sessions_played as number,
    avgAccuracyPct: row.avg_accuracy_pct as number,
  }))
}

/** Fetch the leaderboard for a specific game, ranked by total_xp. */
export async function fetchGameLeaderboard(
  gameId: string,
  limit = 10,
): Promise<LeaderEntry[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('v_leaderboard_by_game')
    .select('user_id, display_name, avatar_initials, total_xp, sessions_played, avg_accuracy_pct, rank')
    .eq('game_id', gameId)
    .order('rank', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[supabaseApi] fetchGameLeaderboard error:', error.message)
    return []
  }

  return (data ?? []).map(row => ({
    rank:           row.rank            as number,
    userId:         row.user_id         as string,
    displayName:    row.display_name    as string,
    avatarInitials: row.avatar_initials as string,
    totalXp:        row.total_xp        as number,
    sessionsPlayed: row.sessions_played as number,
    avgAccuracyPct: row.avg_accuracy_pct as number,
  }))
}

// ─── Game Config ──────────────────────────────────────────────────────────────

export interface GameConfigEntry {
  gameId:    string
  published: boolean
  featured:  boolean
  sortOrder: number
}

/** Fetch the full game config map (game_id → flags). Returns empty map if offline. */
export async function fetchGameConfig(): Promise<Map<string, GameConfigEntry>> {
  if (!supabase) return new Map()
  const { data, error } = await supabase
    .from('game_config')
    .select('game_id, published, featured, sort_order')

  if (error || !data) {
    console.error('[supabaseApi] fetchGameConfig error:', error?.message)
    return new Map()
  }

  return new Map(
    data.map(row => [
      row.game_id as string,
      {
        gameId:    row.game_id    as string,
        published: row.published  as boolean,
        featured:  row.featured   as boolean,
        sortOrder: row.sort_order as number,
      },
    ]),
  )
}

/** Upsert a single game's config flags. Returns error message on failure, null on success. */
export async function updateGameConfig(
  gameId: string,
  patch: Partial<Pick<GameConfigEntry, 'published' | 'featured' | 'sortOrder'>>,
): Promise<string | null> {
  if (!supabase) return 'Supabase not configured'
  const { sortOrder, ...rest } = patch
  const { error } = await supabase
    .from('game_config')
    .upsert(
      {
        game_id: gameId,
        ...rest,
        ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'game_id' },
    )
  if (error) {
    console.error('[supabaseApi] updateGameConfig error:', error.message)
    return error.message
  }
  return null
}

/** Save sort positions for multiple games at once. */
export async function bulkUpdateSortOrder(
  updates: Array<{ gameId: string; sortOrder: number }>,
): Promise<string | null> {
  if (!supabase) return 'Supabase not configured'
  const { error } = await supabase
    .from('game_config')
    .upsert(
      updates.map(u => ({
        game_id:    u.gameId,
        sort_order: u.sortOrder,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'game_id' },
    )
  if (error) {
    console.error('[supabaseApi] bulkUpdateSortOrder error:', error.message)
    return error.message
  }
  return null
}

// Re-export computeStats so callers can derive category breakdowns from entries
export { computeStats }
