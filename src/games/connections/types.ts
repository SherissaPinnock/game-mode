export type CategoryColor = 'yellow' | 'green' | 'blue' | 'purple'

import type { Category } from '@/lib/performance'

export interface ConnectionGroup {
  id: string
  category: string   // e.g. "HTTP Methods"
  color: CategoryColor
  items: string[]    // exactly 4 items
  /** Topic category for performance tracking. */
  topic: Category
}

export interface ConnectionsRound {
  id: number
  groups: ConnectionGroup[]
}

export type GamePhase = 'playing' | 'won' | 'lost'

/** Visual config per difficulty colour. */
export const COLOR_STYLES: Record<CategoryColor, { bg: string; text: string }> = {
  yellow: { bg: '#F9DF6D', text: '#2d2d2d' },
  green:  { bg: '#A0C35A', text: '#2d2d2d' },
  blue:   { bg: '#B0C4EF', text: '#2d2d2d' },
  purple: { bg: '#BA81C5', text: '#fff'    },
}
