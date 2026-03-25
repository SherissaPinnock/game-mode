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

const WEAK_THRESHOLD = 70 // recommend if accuracy < 70%

/** Generate recommendations from performance stats — weakest categories first. */
export function getRecommendations(stats: CategoryStats[]): Recommendation[] {
  return stats
    .filter(s => s.accuracy < WEAK_THRESHOLD)
    .map(s => ({
      category: s.category,
      label: CATEGORY_LABELS[s.category],
      accuracy: s.accuracy,
      total: s.total,
      courses: COURSE_MAP[s.category] ?? [],
    }))
}
