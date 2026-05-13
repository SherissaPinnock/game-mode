import type { RoadmapLevel } from '@/components/LearningRoadmap'

export type Direction = 'up' | 'down' | 'left' | 'right'

export type BlockKind = 'start' | 'join' | 'move' | 'sleep' | 'set-name' | 'is-alive' | 'acquire' | 'release'

export type RobotStatus = 'new' | 'alive' | 'blocked' | 'terminated'

export type StageGoalMode = 'all-goals' | 'sync-switches' | 'probe-sequence' | 'observe'

export interface Point {
  x: number
  y: number
}

export interface CodeBlock {
  id: string
  threadId: string
  kind: BlockKind
  editableThread?: boolean
  lockId?: string
  direction?: Direction
  steps?: number
  durationMs?: number
  nameValue?: string
  editableDirection?: boolean
  editableSteps?: boolean
  minSteps?: number
  maxSteps?: number
}

export type PresetInstruction =
  | {
    kind: 'move'
    direction: Direction
  }
  | {
    kind: 'sleep'
    durationMs: number
  }
  | {
    kind: 'acquire'
    lockId: string
  }
  | {
    kind: 'release'
    lockId: string
  }

export interface RobotConfig {
  id: string
  displayName: string
  accent: string
  trail: string
  start: Point
  defaultName: string
  bodyLength?: number
}

export interface GoalTile extends Point {
  robotId: string
  label: string
}

export interface SwitchTile extends Point {
  id: string
  robotId: string
  label: string
}

export interface RechargePad extends Point {
  id: string
  label: string
}

export interface LockTile extends Point {
  id: string
  label: string
}

export type DoorRule =
  | {
    type: 'reach-goal'
    robotId: string
  }
  | {
    type: 'hold-pad'
    robotId: string
    padId: string
  }
  | {
    type: 'name'
    requiredName: string
  }
  | {
    type: 'lock-held'
    lockId: string
    robotId?: string
  }
  | {
    type: 'lock-released'
    lockId: string
  }

export interface DoorTile extends Point {
  id: string
  label: string
  rule: DoorRule
}

export interface MonitorTerminal extends Point {
  label: string
}

export interface AutoMonitor {
  id: string
  accent: string
  trail: string
  start: Point
}

export interface StageConfig extends RoadmapLevel {
  stageNumber: string
  briefing: string
  objective: string
  ghostTip: string
  grid: string[]
  robots: RobotConfig[]
  goals: GoalTile[]
  availableBlocks: CodeBlock[]
  ghostProgram: CodeBlock[]
  interactionMode?: 'build' | 'observe'
  doors?: DoorTile[]
  switches?: SwitchTile[]
  pads?: RechargePad[]
  locks?: LockTile[]
  presetInstructions?: Record<string, PresetInstruction[]>
  monitor?: {
    robot: AutoMonitor
    terminals: MonitorTerminal[]
    expected: boolean[]
  }
  goalMode: StageGoalMode
  syncWindowMs?: number
}

export interface SimulationCheck {
  result: boolean
  targetId: string
  time: number
  visualTime: number
  terminalIndex: number
}

export interface RobotSnapshot {
  x: number
  y: number
  status: RobotStatus
  name: string
  heldLocks: string[]
}

export interface FrameSnapshot {
  time: number
  robots: Record<string, RobotSnapshot>
  doorStates: Record<string, boolean>
  switchStates: Record<string, boolean>
  lockStates: Record<string, string | null>
}

export interface SimulationResult {
  success: boolean
  totalMs: number
  summary: string
  failureReason?: string
  snapshots: FrameSnapshot[]
  checks: SimulationCheck[]
  switchHits: Record<string, number | undefined>
  terminalStates: boolean[]
}
