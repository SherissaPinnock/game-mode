import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Recognised topic categories across all games. */
export type Category =
  | 'html-css'
  | 'javascript'
  | 'networking'
  | 'cloud-aws'
  | 'scaling'
  | 'devops'
  | 'databases'
  | 'security'
  | 'architecture'
  | 'git'
  | 'react'
  | 'python'
  | 'agile'
  | 'design-patterns'
  | 'prompting'


/** A single recorded attempt at a question/task. */
export interface PerformanceEntry {
  category: Category
  correct: boolean
  gameId: string
  timestamp: number
}

/** Aggregated stats per category. */
export interface CategoryStats {
  category: Category
  total: number
  correct: number
  accuracy: number // 0–100
}

// ─── LocalStorage helpers ───────────────────────────────────────────────────

const STORAGE_KEY = 'gm-performance'

function loadEntries(): PerformanceEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveEntries(entries: PerformanceEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

// ─── Stats computation ──────────────────────────────────────────────────────

export function computeStats(entries: PerformanceEntry[]): CategoryStats[] {
  const map = new Map<Category, { correct: number; total: number }>()

  for (const e of entries) {
    const cur = map.get(e.category) ?? { correct: 0, total: 0 }
    cur.total += 1
    if (e.correct) cur.correct += 1
    map.set(e.category, cur)
  }

  return Array.from(map.entries())
    .map(([category, { correct, total }]) => ({
      category,
      total,
      correct,
      accuracy: Math.round((correct / total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy) // weakest first
}

/** Get stats for entries from a specific game session (by gameId + recent timestamp). */
export function computeSessionStats(
  entries: PerformanceEntry[],
  gameId: string,
  since: number,
): CategoryStats[] {
  return computeStats(entries.filter(e => e.gameId === gameId && e.timestamp >= since))
}

// ─── React Context ──────────────────────────────────────────────────────────

interface PerformanceContextValue {
  entries: PerformanceEntry[]
  /** Report a batch of results from a game session. */
  report: (entries: PerformanceEntry[]) => void
  /** Get overall stats across all games. */
  allStats: () => CategoryStats[]
  /** Get stats for a specific game. */
  gameStats: (gameId: string) => CategoryStats[]
  /** Clear all stored performance data. */
  clear: () => void
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null)

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<PerformanceEntry[]>(loadEntries)

  const report = useCallback((newEntries: PerformanceEntry[]) => {
    setEntries(prev => {
      const updated = [...prev, ...newEntries]
      saveEntries(updated)
      return updated
    })
  }, [])

  const allStats = useCallback(() => computeStats(entries), [entries])
  const gameStats = useCallback(
    (gameId: string) => computeStats(entries.filter(e => e.gameId === gameId)),
    [entries],
  )
  const clear = useCallback(() => { setEntries([]); localStorage.removeItem(STORAGE_KEY) }, [])

  return (
    <PerformanceContext.Provider value={{ entries, report, allStats, gameStats, clear }}>
      {children}
    </PerformanceContext.Provider>
  )
}

export function usePerformance() {
  const ctx = useContext(PerformanceContext)
  if (!ctx) throw new Error('usePerformance must be used within <PerformanceProvider>')
  return ctx
}
