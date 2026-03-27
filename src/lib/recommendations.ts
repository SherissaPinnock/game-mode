import type { Category, CategoryStats } from './performance'
import { COURSE_MAP, CATEGORY_LABELS } from './course-data'
import type { CourseLink } from './course-data'

// Re-export so existing imports from other files still work
export { CATEGORY_LABELS }
export type { CourseLink }

// ─── Recommendation logic ───────────────────────────────────────────────────

export interface Recommendation {
  category: Category
  label: string
  accuracy: number
  total: number
  courses: CourseLink[]
}

const WEAK_THRESHOLD = 70   // recommend if accuracy < 70%
const MIN_ATTEMPTS = 1      // need at least 1 attempt to make a recommendation
const MAX_RECOMMENDATIONS = 3 // don't overwhelm — show top 3 weakest

/** Generate recommendations from performance stats — weakest categories first. */
export function getRecommendations(stats: CategoryStats[]): Recommendation[] {
  return stats
    .filter(s => s.accuracy < WEAK_THRESHOLD && s.total >= MIN_ATTEMPTS)
    .sort((a, b) => a.accuracy - b.accuracy) // weakest first
    .slice(0, MAX_RECOMMENDATIONS)
    .map(s => ({
      category: s.category,
      label: CATEGORY_LABELS[s.category],
      accuracy: s.accuracy,
      total: s.total,
      courses: COURSE_MAP[s.category] ?? [],
    }))
}

/** Identify strong categories — accuracy >= threshold with enough data. */
export function getStrengths(stats: CategoryStats[], threshold = 70, minAttempts = 2): CategoryStats[] {
  return stats
    .filter(s => s.accuracy >= threshold && s.total >= minAttempts)
    .sort((a, b) => b.accuracy - a.accuracy) // strongest first
}
