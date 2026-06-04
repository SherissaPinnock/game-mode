export type GamePhase = 'intro' | 'roadmap' | 'playing' | 'summary' | 'complete'

export interface FileItem {
  id: string
  name: string
  status: 'modified' | 'staged' | 'committed'
}

export interface Commit {
  id: string
  message: string
  branch: string
  timestamp: number
  isMerge?: boolean
}

export interface PullRequest {
  id: string
  title: string
  fromBranch: string
  toBranch: string
  status: 'open' | 'reviewing' | 'approved' | 'merged'
  reviewer?: string
  description?: string
}

export interface ConflictState {
  file: string
  incoming: string
  current: string
  resolved: boolean
  choice?: 'incoming' | 'current' | 'both'
}

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  timestamp: number
  emoji?: string
}

export interface LevelState {
  currentBranch: string
  availableBranches: string[]
  workingDirectory: FileItem[]
  stagingArea: FileItem[]
  localRepo: Commit[]
  remoteRepo: Commit[]
  openPullRequests: PullRequest[]
  conflictState: ConflictState | null
  notifications: Notification[]
  completedObjectives: string[]
  actionHistory: string[]
  failState: boolean
  failReason?: string
  commitMessageDraft: string
  branchNameDraft: string
  prDraft: { title: string; description: string; reviewer: string }
}

export interface WinCondition {
  id: string
  check: (state: LevelState) => boolean
  label: string
}

export interface FailCondition {
  id: string
  check: (state: LevelState) => boolean
  label: string
  message: string
  emoji: string
}

export interface EtiquetteLesson {
  id: string
  title: string
  description: string
  icon: string
}

export interface TutorialStep {
  id: string
  title: string
  body: string
  targetZone?: string
}

export interface ActionConfig {
  id: string
  label: string
  emoji: string
  description: string
  requiresInput?: 'commit-message' | 'branch-name' | 'pr-form' | 'conflict-choice' | 'confirm'
  danger?: boolean
}

export interface ActionResult {
  stateUpdate: Partial<LevelState>
  notification: Omit<Notification, 'id' | 'timestamp'>
  animationHint?: 'file-move' | 'branch-split' | 'branch-switch' | 'push-up' | 'pull-down' | 'shake' | 'celebrate' | 'merge'
}

export interface LevelConfig {
  id: number
  title: string
  emoji: string
  scenario: string
  objective: string
  concepts: string[]
  startingState: Partial<LevelState>
  availableActions: string[]
  winConditions: WinCondition[]
  failConditions: FailCondition[]
  etiquetteLessons: EtiquetteLesson[]
  hints: string[]
  summaryContent: {
    whatYouDid: string
    bestPractice: string
    realTeamScenario: string
  }
}

export interface GameState {
  phase: GamePhase
  currentLevelIndex: number
  completedLevels: number[]
  tutorialSeen: boolean
  levelState: LevelState | null
  pendingAction: string | null
  animationHint: string | null
}
