import type { Category } from '@/lib/performance'

/** Status level for a metric on the symptom board. */
export type MetricStatus = 'critical' | 'warning' | 'normal'

/** A single metric displayed on the symptom board. */
export interface Symptom {
  metric: string
  value: string
  status: MetricStatus
}

/** An investigation the player can perform to gather clues. */
export interface Investigation {
  id: string
  label: string
  icon: string
  cost: number        // SLA seconds consumed
  clue: string        // revealed after investigating
  category: Category  // for performance tracking
}

/** A diagnosis/action the player can take to resolve the incident. */
export interface Action {
  id: string
  label: string
  description: string
  isCorrect: boolean
  timeCost: number    // SLA seconds consumed
  outcome: string     // narrative result
}

/** A complete incident scenario. */
export interface Incident {
  id: string
  title: string
  service: string            // e.g. "api-gateway", "payment-service"
  severity: 'P1' | 'P2'
  slaTotal: number           // total SLA budget in seconds
  symptoms: Symptom[]
  investigations: Investigation[]
  actions: Action[]
  correctActionId: string
  postmortem: string         // educational takeaway
}

/** Game phase state machine. */
export type GamePhase = 'intro' | 'briefing' | 'investigating' | 'acting' | 'outcome' | 'transition' | 'results'

/** Tracks a single investigation the player performed. */
export interface InvestigationLog {
  investigationId: string
  clue: string
  cost: number
}
