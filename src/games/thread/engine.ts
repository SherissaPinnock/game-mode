import type {
  CodeBlock,
  Direction,
  DoorTile,
  FrameSnapshot,
  PresetInstruction,
  Point,
  RobotSnapshot,
  RobotStatus,
  SimulationCheck,
  SimulationResult,
  StageConfig,
} from '@/games/thread/types'

const TICK_MS = 60
const MAIN_BLOCK_MS = 120
const MOVE_MS = 420
const MAX_TIME_MS = 12000
const MONITOR_VISUAL_GAP_MS = 220
const GOAL_SETTLE_MS = 340

type ThreadInstruction =
  PresetInstruction

type RuntimeLock = {
  id: string
  holderId: string | null
  releasedOnce: boolean
  position: Point
}

type ActiveAction =
  | {
    kind: 'move'
    from: Point
    to: Point
    durationMs: number
    elapsedMs: number
    consumesInstruction: true
  }
  | {
    kind: 'sleep'
    durationMs: number
    elapsedMs: number
    consumesInstruction: boolean
  }

type RuntimeThread = {
  id: string
  currentCell: Point
  currentPos: Point
  builder: ThreadInstruction[]
  runtime: ThreadInstruction[]
  actionIndex: number
  activeAction: ActiveAction | null
  status: RobotStatus
  name: string
  started: boolean
  heldLocks: Set<string>
  waitingLockId: string | null
}

type SimulationState = {
  timeMs: number
  programLength: number
  threads: Record<string, RuntimeThread>
  locks: Record<string, RuntimeLock>
  mainPointer: number
  mainReadyAtMs: number
  waitingJoin: string | null
  deadlockAt: number | null
  checks: SimulationCheck[]
  goalReached: Set<string>
  goalReachedAt: Record<string, number | undefined>
  switchHits: Record<string, number | undefined>
  snapshots: FrameSnapshot[]
  failureReason?: string
}

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y }
}

function stepPoint(point: Point, direction: Direction): Point {
  if (direction === 'up') return { x: point.x, y: point.y - 1 }
  if (direction === 'down') return { x: point.x, y: point.y + 1 }
  if (direction === 'left') return { x: point.x - 1, y: point.y }
  return { x: point.x + 1, y: point.y }
}

function formatMs(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`
}

function isInBounds(stage: StageConfig, point: Point) {
  return point.y >= 0 && point.y < stage.grid.length && point.x >= 0 && point.x < stage.grid[0].length
}

function isWall(stage: StageConfig, point: Point) {
  return stage.grid[point.y]?.[point.x] === '#'
}

function getPad(stage: StageConfig, padId: string) {
  return stage.pads?.find(pad => pad.id === padId) ?? null
}

function getLock(state: SimulationState, lockId: string) {
  return state.locks[lockId] ?? null
}

function isRobotHoldingPad(thread: RuntimeThread, pad: Point) {
  const onPad = thread.currentCell.x === pad.x && thread.currentCell.y === pad.y
  if (!onPad) return false
  return thread.activeAction === null || thread.activeAction.kind === 'sleep'
}

function isDoorOpen(stage: StageConfig, state: SimulationState, door: DoorTile, thread: RuntimeThread) {
  if (door.rule.type === 'reach-goal') {
    return state.goalReached.has(door.rule.robotId)
  }
  if (door.rule.type === 'name') {
    return thread.name === door.rule.requiredName
  }
  if (door.rule.type === 'lock-held') {
    const lock = getLock(state, door.rule.lockId)
    if (!lock?.holderId) return false
    return door.rule.robotId ? lock.holderId === door.rule.robotId : true
  }
  if (door.rule.type === 'lock-released') {
    const lock = getLock(state, door.rule.lockId)
    return !!lock && lock.releasedOnce && !lock.holderId
  }

  const holder = state.threads[door.rule.robotId]
  const pad = getPad(stage, door.rule.padId)

  if (!holder || !pad) return false
  return isRobotHoldingPad(holder, pad)
}

function isDoorVisuallyOpen(stage: StageConfig, state: SimulationState, door: DoorTile) {
  if (door.rule.type === 'reach-goal') {
    return state.goalReached.has(door.rule.robotId)
  }
  if (door.rule.type === 'name') {
    const requiredName = door.rule.requiredName
    return Object.values(state.threads).some(thread => thread.name === requiredName)
  }
  if (door.rule.type === 'lock-held') {
    const lock = getLock(state, door.rule.lockId)
    if (!lock?.holderId) return false
    return door.rule.robotId ? lock.holderId === door.rule.robotId : true
  }
  if (door.rule.type === 'lock-released') {
    const lock = getLock(state, door.rule.lockId)
    return !!lock && lock.releasedOnce && !lock.holderId
  }

  const holder = state.threads[door.rule.robotId]
  const pad = getPad(stage, door.rule.padId)
  if (!holder || !pad) return false
  return isRobotHoldingPad(holder, pad)
}

function getDoorAt(stage: StageConfig, point: Point) {
  return stage.doors?.find(door => door.x === point.x && door.y === point.y) ?? null
}

function markGoalHits(stage: StageConfig, state: SimulationState, thread: RuntimeThread) {
  const goal = stage.goals.find(item => item.robotId === thread.id)
  if (goal && goal.x === thread.currentCell.x && goal.y === thread.currentCell.y) {
    state.goalReached.add(thread.id)
    if (state.goalReachedAt[thread.id] === undefined) {
      state.goalReachedAt[thread.id] = state.timeMs
    }
  }
}

function markSwitchHits(stage: StageConfig, state: SimulationState, thread: RuntimeThread) {
  const tile = stage.switches?.find(item => item.robotId === thread.id && item.x === thread.currentCell.x && item.y === thread.currentCell.y)
  if (tile && state.switchHits[tile.id] === undefined) {
    state.switchHits[tile.id] = state.timeMs
  }
}

function recordSnapshot(stage: StageConfig, state: SimulationState) {
  const robots = Object.fromEntries(
    Object.values(state.threads).map((thread): [string, RobotSnapshot] => [
      thread.id,
      {
        x: thread.currentPos.x,
        y: thread.currentPos.y,
        status: thread.status,
        name: thread.name,
        heldLocks: [...thread.heldLocks],
      },
    ]),
  )

  const doorStates = Object.fromEntries(
    (stage.doors ?? []).map(door => {
      return [door.id, isDoorVisuallyOpen(stage, state, door)]
    }),
  )

  const switchStates = Object.fromEntries(
    (stage.switches ?? []).map(tile => {
      const thread = state.threads[tile.robotId]
      const active = !!thread && thread.currentCell.x === tile.x && thread.currentCell.y === tile.y
      return [tile.id, active]
    }),
  )

  const lockStates = Object.fromEntries(
    Object.values(state.locks).map(lock => [lock.id, lock.holderId]),
  )

  state.snapshots.push({
    time: state.timeMs,
    robots,
    doorStates,
    switchStates,
    lockStates,
  })
}

function buildInstructions(block: CodeBlock): ThreadInstruction[] {
  if (block.kind === 'move' && block.direction) {
    const steps = Math.max(1, Math.floor(block.steps ?? 1))
    return Array.from({ length: steps }, () => ({ kind: 'move', direction: block.direction! }))
  }
  if (block.kind === 'sleep' && block.durationMs !== undefined) {
    return [{ kind: 'sleep', durationMs: block.durationMs }]
  }
  if (block.kind === 'acquire' && block.lockId) {
    return [{ kind: 'acquire', lockId: block.lockId }]
  }
  if (block.kind === 'release' && block.lockId) {
    return [{ kind: 'release', lockId: block.lockId }]
  }
  return []
}

function cloneInstruction(instruction: ThreadInstruction): ThreadInstruction {
  if (instruction.kind === 'move') {
    return { kind: 'move', direction: instruction.direction }
  }
  if (instruction.kind === 'sleep') {
    return { kind: 'sleep', durationMs: instruction.durationMs }
  }
  if (instruction.kind === 'acquire') {
    return { kind: 'acquire', lockId: instruction.lockId }
  }
  return { kind: 'release', lockId: instruction.lockId }
}

function startThread(thread: RuntimeThread) {
  thread.started = true
  thread.status = 'alive'
  thread.runtime = thread.builder.map(cloneInstruction)
  thread.actionIndex = 0
  thread.activeAction = null
}

function startImmediateSleep(state: SimulationState, thread: RuntimeThread, durationMs: number) {
  if (thread.status !== 'alive') {
    blockFailure(state, `${thread.name} cannot sleep because it is not running.`)
    return
  }

  if (thread.activeAction) {
    blockFailure(state, `${thread.name} cannot sleep mid-move in this stage setup.`)
    return
  }

  thread.activeAction = {
    kind: 'sleep',
    durationMs,
    elapsedMs: 0,
    consumesInstruction: false,
  }
}

function blockFailure(state: SimulationState, reason: string) {
  if (!state.failureReason) {
    state.failureReason = reason
  }
}

function enqueueInstructions(state: SimulationState, thread: RuntimeThread, instructions: ThreadInstruction[]) {
  if (instructions.length === 0) return

  if (thread.started) {
    if (thread.status !== 'alive') {
      blockFailure(state, `${thread.name} received more work after it had already finished.`)
      return
    }

    thread.runtime.push(...instructions)
    return
  }

  thread.builder.push(...instructions)
}

function tryAcquireLock(state: SimulationState, thread: RuntimeThread, lockId: string) {
  const lock = getLock(state, lockId)
  if (!lock) {
    blockFailure(state, `${thread.name} tried to acquire ${lockId}, but it does not exist in this stage.`)
    return
  }

  if (lock.holderId === thread.id || thread.heldLocks.has(lockId)) {
    thread.waitingLockId = null
    thread.actionIndex += 1
    return
  }

  if (lock.holderId && lock.holderId !== thread.id) {
    thread.waitingLockId = lockId
    return
  }

  if (thread.currentCell.x !== lock.position.x || thread.currentCell.y !== lock.position.y) {
    blockFailure(state, `${thread.name} tried to pick up ${lockId} without stepping onto its tile.`)
    thread.status = 'blocked'
    return
  }

  lock.holderId = thread.id
  thread.heldLocks.add(lockId)
  thread.waitingLockId = null
  thread.actionIndex += 1
}

function releaseLock(state: SimulationState, thread: RuntimeThread, lockId: string) {
  const lock = getLock(state, lockId)
  if (!lock || !thread.heldLocks.has(lockId) || lock.holderId !== thread.id) {
    blockFailure(state, `${thread.name} tried to release ${lockId} without holding it.`)
    thread.status = 'blocked'
    return
  }

  lock.holderId = null
  lock.position = clonePoint(thread.currentCell)
  lock.releasedOnce = true
  thread.heldLocks.delete(lockId)
  thread.waitingLockId = null
  thread.actionIndex += 1
}

function executeNextMainBlock(state: SimulationState, program: CodeBlock[]) {
  if (state.waitingJoin || state.mainPointer >= program.length || state.timeMs < state.mainReadyAtMs) return

  const block = program[state.mainPointer]
  const thread = state.threads[block.threadId]
  state.mainPointer += 1
  state.mainReadyAtMs = state.timeMs + MAIN_BLOCK_MS

  if (!thread) return

  if (block.kind === 'set-name') {
    if (thread.started) {
      blockFailure(state, `${thread.name} changed identity after start(), so the new name never reached the live worker.`)
    } else if (block.nameValue) {
      thread.name = block.nameValue
    }
    return
  }

  if (block.kind === 'sleep' && block.durationMs !== undefined) {
    if (thread.started) {
      startImmediateSleep(state, thread, block.durationMs)
    } else {
      enqueueInstructions(state, thread, [{ kind: 'sleep', durationMs: block.durationMs }])
    }
    return
  }

  const instructions = buildInstructions(block)
  if (instructions.length > 0) {
    enqueueInstructions(state, thread, instructions)
    return
  }

  if (block.kind === 'start') {
    if (!thread.started) startThread(thread)
    return
  }

  if (block.kind === 'join') {
    if (thread.status === 'alive') {
      state.waitingJoin = thread.id
    }
    return
  }

  if (block.kind === 'is-alive') {
    const previous = state.checks.at(-1)
    const visualTime = Math.max(state.timeMs, (previous?.visualTime ?? -MONITOR_VISUAL_GAP_MS) + MONITOR_VISUAL_GAP_MS)
    state.checks.push({
      result: thread.status === 'alive',
      targetId: thread.id,
      time: state.timeMs,
      visualTime,
      terminalIndex: state.checks.length,
    })
  }
}

function beginNextAction(stage: StageConfig, state: SimulationState, thread: RuntimeThread) {
  if (thread.status !== 'alive' || thread.activeAction) return

  const nextInstruction = thread.runtime[thread.actionIndex]
  if (!nextInstruction) {
    if (state.mainPointer >= state.programLength || state.waitingJoin === thread.id) {
      thread.status = 'terminated'
    }
    return
  }

  if (nextInstruction.kind === 'sleep') {
    thread.activeAction = {
      kind: 'sleep',
      durationMs: nextInstruction.durationMs,
      elapsedMs: 0,
      consumesInstruction: true,
    }
    return
  }

  if (nextInstruction.kind === 'acquire') {
    tryAcquireLock(state, thread, nextInstruction.lockId)
    return
  }

  if (nextInstruction.kind === 'release') {
    releaseLock(state, thread, nextInstruction.lockId)
    return
  }

  const target = stepPoint(thread.currentCell, nextInstruction.direction)
  if (!isInBounds(stage, target) || isWall(stage, target)) {
    thread.status = 'blocked'
    blockFailure(state, `${thread.name} walked into a wall at ${formatMs(state.timeMs)}.`)
    return
  }

  const door = getDoorAt(stage, target)
  if (door && !isDoorOpen(stage, state, door, thread)) {
    thread.status = 'blocked'
    if (door.rule.type === 'reach-goal') {
      blockFailure(state, `${thread.name} reached the relay door too early at ${formatMs(state.timeMs)}.`)
    } else if (door.rule.type === 'hold-pad') {
      blockFailure(state, `${thread.name} hit the lower door after the recharge hold had already dropped at ${formatMs(state.timeMs)}.`)
    } else {
      blockFailure(state, `${thread.name} reached the ${door.label} gate without the required name.`)
    }
    return
  }

  thread.activeAction = {
    kind: 'move',
    from: clonePoint(thread.currentCell),
    to: target,
    durationMs: MOVE_MS,
    elapsedMs: 0,
    consumesInstruction: true,
  }
}

function finishAction(stage: StageConfig, state: SimulationState, thread: RuntimeThread) {
  const action = thread.activeAction
  if (!action) return

  if (action.kind === 'move') {
    thread.currentCell = clonePoint(action.to)
    thread.currentPos = clonePoint(action.to)
  }

  if (action.consumesInstruction) {
    thread.actionIndex += 1
  }
  thread.activeAction = null
  markGoalHits(stage, state, thread)
  markSwitchHits(stage, state, thread)

  if (!thread.runtime[thread.actionIndex]) {
    thread.status = 'terminated'
  }
}

function updateWorkers(stage: StageConfig, state: SimulationState) {
  Object.values(state.threads).forEach(thread => {
    if (thread.status !== 'alive') return

    beginNextAction(stage, state, thread)
    const action = thread.activeAction
    if (!action) return

    action.elapsedMs = Math.min(action.durationMs, action.elapsedMs + TICK_MS)

    if (action.kind === 'move') {
      const progress = action.elapsedMs / action.durationMs
      thread.currentPos = {
        x: action.from.x + (action.to.x - action.from.x) * progress,
        y: action.from.y + (action.to.y - action.from.y) * progress,
      }
    } else {
      thread.currentPos = clonePoint(thread.currentCell)
    }

    if (action.elapsedMs >= action.durationMs) {
      finishAction(stage, state, thread)
    }
  })
}

function allWorkersSettled(state: SimulationState) {
  return Object.values(state.threads).every(thread => thread.status !== 'alive')
}

function isDeadlocked(state: SimulationState) {
  const liveThreads = Object.values(state.threads).filter(thread => thread.status === 'alive')
  if (liveThreads.length === 0) return false
  return liveThreads.every(thread => {
    if (!thread.waitingLockId) return false
    const lock = getLock(state, thread.waitingLockId)
    return !!lock?.holderId && lock.holderId !== thread.id
  })
}

function getSyncHitTimes(stage: StageConfig, state: SimulationState) {
  const switchIds = (stage.switches ?? []).map(tile => tile.id)
  const hitTimes = switchIds
    .map(id => state.switchHits[id])
    .filter((time): time is number => time !== undefined)

  return {
    expectedCount: switchIds.length,
    hitTimes,
  }
}

function buildSummary(stage: StageConfig, state: SimulationState, success: boolean) {
  if (!success && state.failureReason) return state.failureReason

  if (stage.goalMode === 'sync-switches') {
    const { expectedCount, hitTimes } = getSyncHitTimes(stage, state)
    if (expectedCount > 1 && hitTimes.length === expectedCount) {
      return `Switch delta ${Math.max(...hitTimes) - Math.min(...hitTimes)}ms.`
    }
  }

  if (stage.goalMode === 'probe-sequence') {
    return `Monitor saw ${state.checks.map(check => (check.result ? 'true' : 'false')).join(' → ')}.`
  }

  return success ? 'Matched the ghost choreography.' : 'The replay drifted away from the ghost.'
}

function evaluateSuccess(stage: StageConfig, state: SimulationState) {
  const goalsReached = stage.goals.every(goal => {
    const thread = state.threads[goal.robotId]
    return !!thread && thread.currentCell.x === goal.x && thread.currentCell.y === goal.y && thread.status !== 'blocked'
  })

  if (!goalsReached) return false

  if (stage.goalMode === 'sync-switches') {
    const { expectedCount, hitTimes } = getSyncHitTimes(stage, state)
    if (expectedCount < 2 || hitTimes.length !== expectedCount || stage.syncWindowMs === undefined) return false
    return Math.max(...hitTimes) - Math.min(...hitTimes) <= stage.syncWindowMs
  }

  if (stage.goalMode === 'probe-sequence') {
    const expected = stage.monitor?.expected ?? []
    if (state.checks.length < expected.length) return false
    return expected.every((value, index) => state.checks[index]?.result === value)
  }

  if (stage.goalMode === 'observe') {
    return state.deadlockAt !== null
  }

  return true
}

export function simulateStage(stage: StageConfig, program: CodeBlock[]): SimulationResult {
  const threads = Object.fromEntries(
    stage.robots.map(robot => [
      robot.id,
      {
        id: robot.id,
        currentCell: clonePoint(robot.start),
        currentPos: clonePoint(robot.start),
        builder: (stage.presetInstructions?.[robot.id] ?? []).map(cloneInstruction),
        runtime: [],
        actionIndex: 0,
        activeAction: null,
        status: 'new' as RobotStatus,
        name: robot.defaultName,
        started: false,
        heldLocks: new Set<string>(),
        waitingLockId: null,
      } satisfies RuntimeThread,
    ]),
  )

  const locks = Object.fromEntries(
    (stage.locks ?? []).map(lock => [
      lock.id,
      {
        id: lock.id,
        holderId: null,
        releasedOnce: false,
        position: clonePoint(lock),
      } satisfies RuntimeLock,
    ]),
  )

  const state: SimulationState = {
    timeMs: 0,
    programLength: program.length,
    threads,
    locks,
    mainPointer: 0,
    mainReadyAtMs: 0,
    waitingJoin: null,
    deadlockAt: null,
    checks: [],
    goalReached: new Set<string>(),
    goalReachedAt: {},
    switchHits: {},
    snapshots: [],
  }

  executeNextMainBlock(state, program)
  recordSnapshot(stage, state)

  while (state.timeMs < MAX_TIME_MS) {
    if (state.mainPointer >= program.length && allWorkersSettled(state)) break

    state.timeMs += TICK_MS
    updateWorkers(stage, state)

    if (state.waitingJoin) {
      const target = state.threads[state.waitingJoin]
      if (!target || target.status !== 'alive') {
        state.waitingJoin = null
        state.mainReadyAtMs = Math.min(state.mainReadyAtMs, state.timeMs)
      }
    }

    if (state.mainPointer >= program.length && isDeadlocked(state)) {
      state.deadlockAt ??= state.timeMs
      if (state.timeMs >= state.deadlockAt + 720) {
        recordSnapshot(stage, state)
        break
      }
    }

    executeNextMainBlock(state, program)
    recordSnapshot(stage, state)
  }

  const success = evaluateSuccess(stage, state)
  const lastCheckVisual = state.checks.at(-1)?.visualTime ?? 0
  const lastGoalArrival = Math.max(0, ...Object.values(state.goalReachedAt).filter((time): time is number => time !== undefined))
  const totalMs = Math.max(state.timeMs, lastCheckVisual + 320, lastGoalArrival + GOAL_SETTLE_MS)
  const expectedLength = stage.monitor?.expected.length ?? 0
  const terminalStates = Array.from({ length: expectedLength }, (_, index) => state.checks[index]?.result ?? false)

  return {
    success,
    totalMs,
    summary: buildSummary(stage, state, success),
    failureReason: success ? undefined : state.failureReason,
    snapshots: state.snapshots,
    checks: state.checks,
    switchHits: state.switchHits,
    terminalStates,
  }
}

function getSnapshotAtTime(result: SimulationResult, timeMs: number) {
  const clamped = Math.max(0, Math.min(timeMs, result.totalMs))
  let low = 0
  let high = result.snapshots.length - 1

  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (result.snapshots[mid].time <= clamped) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  return result.snapshots[low] ?? result.snapshots[0]
}

function compareChecks(a: SimulationResult, b: SimulationResult) {
  if (a.checks.length !== b.checks.length) return false
  return a.checks.every((check, index) => {
    const other = b.checks[index]
    return !!other && other.result === check.result
  })
}

export function compareReplayToGhost(stage: StageConfig, ghost: SimulationResult, attempt: SimulationResult) {
  if (!attempt.success) {
    return {
      matches: false,
      reason: attempt.failureReason ?? attempt.summary,
    }
  }

  if (stage.goalMode === 'probe-sequence' && !compareChecks(ghost, attempt)) {
    return {
      matches: false,
      reason: `The monitor saw ${attempt.checks.map(check => (check.result ? 'true' : 'false')).join(' → ')} instead of ${ghost.checks.map(check => (check.result ? 'true' : 'false')).join(' → ')}.`,
    }
  }

  const endTime = Math.max(ghost.totalMs, attempt.totalMs)
  for (let timeMs = 0; timeMs <= endTime; timeMs += 120) {
    const ghostFrame = getSnapshotAtTime(ghost, timeMs)
    const attemptFrame = getSnapshotAtTime(attempt, timeMs)

    for (const robot of stage.robots) {
      const ghostRobot = ghostFrame.robots[robot.id]
      const attemptRobot = attemptFrame.robots[robot.id]
      if (!ghostRobot || !attemptRobot) continue

      const dx = Math.abs(ghostRobot.x - attemptRobot.x)
      const dy = Math.abs(ghostRobot.y - attemptRobot.y)
      if (dx > 0.12 || dy > 0.12 || ghostRobot.status !== attemptRobot.status) {
        return {
          matches: false,
          reason: `The replay drifted from the ghost at ${formatMs(timeMs)}.`,
        }
      }
    }
  }

  return {
    matches: true,
    reason: 'Perfect sync.',
  }
}

export function getFrameAtTime(result: SimulationResult, timeMs: number) {
  return getSnapshotAtTime(result, timeMs)
}
