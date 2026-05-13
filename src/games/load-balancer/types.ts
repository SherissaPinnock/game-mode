export type ServerId = 1 | 2 | 3

export type ServerColor = 'red' | 'blue' | 'green'

export type FloatingTone = 'good' | 'bad' | 'warn' | 'bonus'

export type GamePhase = 'playing' | 'won' | 'lost'

export interface ServerState {
  id: ServerId
  label: string
  color: ServerColor
  load: number
  capacity: number
  crashTimerMs: number
  overloadTimerMs: number
  warnActive: boolean
  totalAssigned: number
}

export interface PartyGoerState {
  id: number
  x: number
  laneY: number
  speed: number
  spriteIndex: number
  prompt: string
  answer: ServerId
  wobble: number
}

export interface FloatingTextState {
  id: number
  text: string
  x: number
  y: number
  driftX: number
  driftY: number
  lifeMs: number
  tone: FloatingTone
}

export interface GameState {
  phase: GamePhase
  timeLeftMs: number
  reputation: number
  score: number
  elapsedMs: number
  spawnCooldownMs: number
  balanceCooldownMs: number
  assignmentsSinceBonus: number
  trafficSpikeTimerMs: number
  nextId: number
  partyGoers: PartyGoerState[]
  servers: ServerState[]
  floatingTexts: FloatingTextState[]
}

export interface DragState {
  id: number
  pointerId: number
  x: number
  y: number
  grabOffsetX: number
  grabOffsetY: number
  answer: ServerId
  prompt: string
  spriteIndex: number
  wobble: number
}
