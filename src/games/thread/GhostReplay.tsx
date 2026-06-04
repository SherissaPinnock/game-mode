import { useEffect, useMemo, useRef, useState } from 'react'

import { LearningRoadmap } from '@/components/LearningRoadmap'
import { getCompletedLevels, markLevelComplete } from '@/lib/roadmap-progress'
import { persistSession, remoteGetCompletedLevels, remoteMarkLevelComplete } from '@/lib/supabaseApi'
import { useAuth } from '@/lib/auth'
import { playCorrect } from '@/lib/sounds'

import { THREAD_GAME_ID, THREAD_STAGES } from '@/games/thread/data/stages'
import { compareReplayToGhost, getFrameAtTime, simulateStage } from '@/games/thread/engine'
import type { CodeBlock, Direction, Point, SimulationResult, StageConfig } from '@/games/thread/types'
import './GhostReplay.css'

interface GhostReplayProps {
  onExit: () => void
}

type ViewMode = 'intro' | 'roadmap' | 'stage'
type HelpKey = 'objective' | 'concept' | 'tip'

type AttemptState = {
  result: SimulationResult
  matches: boolean
  reason: string
  startedAtMs: number
} | null

type PlacedBlock = CodeBlock & {
  instanceId: string
}

const DIRECTION_OPTIONS: Array<{ value: Direction; label: string }> = [
  { value: 'up', label: 'moveUp' },
  { value: 'down', label: 'moveDown' },
  { value: 'left', label: 'moveLeft' },
  { value: 'right', label: 'moveRight' },
]

const INTRO_STORAGE_KEY = 'ghost-replay-thread-intro-seen-v1'

const INTRO_SLIDES = [
  {
    kicker: 'Thread Basics',
    title: 'A thread is one worker inside a bigger program.',
    body: 'In real life, think of a restaurant kitchen. One worker chops vegetables, another plates food, and another handles the oven. They are all part of the same restaurant, but each worker has their own job to do.',
    gameBridgeTitle: 'How that maps here',
    gameBridgeBody: 'In Ghost Replay, each worm robot is one thread. The whole level is the program, and each robot is one worker moving through its own instructions.',
  },
  {
    kicker: 'Concurrency',
    title: 'Concurrency means multiple tasks can make progress during the same stretch of time.',
    body: 'Back in that kitchen, the cook and the cashier can both be busy during the same order. They are separate workers whose jobs overlap, even if they are not doing the exact same thing.',
    gameBridgeTitle: 'How that maps here',
    gameBridgeBody: 'When two robots are alive at once, their movement overlaps on the grid. That is the core idea we will practice, but we will keep the first puzzles very small.',
  },
  {
    kicker: 'start()',
    title: 'In Java, start() tells a thread to begin running.',
    body: 'Calling start() does not mean “do everything instantly.” It hands the worker off to run. If you never call start(), that thread never actually begins its work.',
    gameBridgeTitle: 'How that maps here',
    gameBridgeBody: 'In this game, movement blocks describe the robot’s route. start() is the moment the robot wakes up and begins following that route on the board.',
  },
  {
    kicker: 'join()',
    title: 'In Java, join() means “wait until that thread finishes.”',
    body: 'If one task depends on another being done first, join() is how the caller pauses and waits. It is a coordination tool, not a movement tool.',
    gameBridgeTitle: 'How that maps here',
    gameBridgeBody: 'In Ghost Replay, join() makes the next block wait until that robot reaches the end of its route. You will use that when one robot must finish before another begins.',
  },
  {
    kicker: 'What Comes Later',
    title: 'We are intentionally not teaching everything up front.',
    body: 'You do not need sleep(), setName(), or isAlive() yet. Those make more sense once start() and join() feel natural, so the later levels introduce them one at a time.',
    gameBridgeTitle: 'What to do now',
    gameBridgeBody: 'Watch the reference ghost, rebuild the sequence with code blocks, and use the board to see what each thread command actually changes.',
  },
] as const

function clampStepCount(block: CodeBlock, value: number) {
  const min = block.minSteps ?? 1
  const max = block.maxSteps ?? 6
  return Math.max(min, Math.min(max, value))
}

function normalizeMoveBlock<T extends CodeBlock>(block: T): T {
  if (block.kind !== 'move') return block
  const nextSteps = clampStepCount(block, Math.floor(block.steps ?? 1))
  return {
    ...block,
    direction: block.direction ?? 'right',
    steps: nextSteps,
  }
}

function formatThreadLabel(threadId: string) {
  return threadId.replace('thread', 'Thread ')
}

function paletteThreadLabel(block: CodeBlock) {
  return block.editableThread ? 'Thread' : formatThreadLabel(block.threadId)
}

function methodLabel(block: CodeBlock) {
  if (block.kind === 'move') {
    if (block.direction === 'up') return 'moveUp'
    if (block.direction === 'down') return 'moveDown'
    if (block.direction === 'left') return 'moveLeft'
    return 'moveRight'
  }
  if (block.kind === 'acquire') return 'acquire'
  if (block.kind === 'release') return 'release'
  if (block.kind === 'sleep') return 'sleep'
  if (block.kind === 'set-name') return 'setName'
  if (block.kind === 'is-alive') return 'isAlive'
  return block.kind
}

function blockCodeParts(block: CodeBlock) {
  if (block.kind === 'move') {
    return { method: block.editableDirection ? 'moveDir' : methodLabel(block), value: String(block.editableSteps ? 'n' : block.steps ?? 1), valueType: 'number' as const }
  }
  const method = methodLabel(block)
  if ((block.kind === 'acquire' || block.kind === 'release') && block.lockId) {
    return { method, value: block.lockId, valueType: 'lock' as const }
  }
  if (block.kind === 'sleep') {
    return { method, value: String(block.durationMs ?? 0), valueType: 'number' as const }
  }
  if (block.kind === 'set-name') {
    return { method, value: `"${block.nameValue ?? ''}"`, valueType: 'string' as const }
  }
  return { method, value: '', valueType: 'empty' as const }
}

function stagePaletteColor(stage: StageConfig, block: CodeBlock) {
  return stage.robots.find(robot => robot.id === block.threadId)?.accent ?? '#7a8ba5'
}

function ghostLoopTime(durationMs: number, clockMs: number) {
  const total = durationMs + 720
  const mod = total === 0 ? 0 : clockMs % total
  return Math.min(mod, durationMs)
}

function sampleRobotPath(result: SimulationResult, robotId: string, timeMs: number, length: number) {
  return Array.from({ length }, (_, index) => {
    const frame = getFrameAtTime(result, Math.max(0, timeMs - index * 140))
    return frame.robots[robotId]
  }).filter(Boolean)
}

function goalArrivalTime(result: SimulationResult, robotId: string, goal: Point | null) {
  if (!goal) return null

  const arrival = result.snapshots.find(snapshot => {
    const robot = snapshot.robots[robotId]
    return !!robot && Math.abs(robot.x - goal.x) < 0.001 && Math.abs(robot.y - goal.y) < 0.001
  })

  return arrival?.time ?? null
}

function monitorPosition(stage: StageConfig, result: SimulationResult, timeMs: number) {
  if (!stage.monitor) return null

  const points = [stage.monitor.robot.start, ...stage.monitor.terminals]
  let current = points[0]

  for (let index = 0; index < result.checks.length; index += 1) {
    const check = result.checks[index]
    const next = points[index + 1] ?? points.at(-1) ?? current
    if (timeMs < check.visualTime) break

    const progress = Math.min(1, (timeMs - check.visualTime) / 280)
    current = {
      x: current.x + (next.x - current.x) * progress,
      y: current.y + (next.y - current.y) * progress,
    }

    if (progress < 1) return current
    current = next
  }

  return current
}

function renderRotation(from: Point, to: Point) {
  const radians = Math.atan2(to.y - from.y, to.x - from.x)
  return `${radians * (180 / Math.PI)}deg`
}

function ThreadIntroSlides({
  index,
  onBack,
  onNext,
  onFinish,
  onSkip,
  onJump,
}: {
  index: number
  onBack: () => void
  onNext: () => void
  onFinish: () => void
  onSkip: () => void
  onJump: (index: number) => void
}) {
  const slide = INTRO_SLIDES[index]
  const isFirst = index === 0
  const isLast = index === INTRO_SLIDES.length - 1

  return (
    <div className="gr-intro-shell">
      <div className="gr-intro-card">
        <div className="gr-intro-topbar">
          <div className="gr-intro-heading">
            <div className="gr-stage-chip">Thread Basics</div>
            <div className="gr-intro-count">
              {index + 1} / {INTRO_SLIDES.length}
            </div>
          </div>
          <button type="button" className="gr-btn ghost" onClick={onSkip}>
            Skip to Roadmap
          </button>
        </div>

        <div className="gr-intro-progress" aria-label="Intro progress">
          {INTRO_SLIDES.map((item, itemIndex) => (
            <button
              key={item.title}
              type="button"
              className={`gr-intro-dot ${itemIndex === index ? 'is-active' : ''}`}
              aria-label={`Go to slide ${itemIndex + 1}`}
              onClick={() => onJump(itemIndex)}
              disabled={itemIndex === index}
            />
          ))}
        </div>

        <div className="gr-intro-body">
          <div className="gr-intro-copy">
            <p className="gr-intro-kicker">{slide.kicker}</p>
            <h1>{slide.title}</h1>
            <p>{slide.body}</p>
          </div>

          <div className="gr-intro-bridge">
            <div className="gr-intro-bridge-label">In Ghost Replay</div>
            <strong>{slide.gameBridgeTitle}</strong>
            <p>{slide.gameBridgeBody}</p>
          </div>
        </div>

        <div className="gr-intro-actions">
          <button type="button" className="gr-btn ghost" onClick={onBack} disabled={isFirst}>
            ← Back
          </button>
          {isLast ? (
            <button type="button" className="gr-btn primary" onClick={onFinish}>
              Open Roadmap
            </button>
          ) : (
            <button type="button" className="gr-btn primary" onClick={onNext}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReplayBoard({
  title,
  subtitle,
  chip,
  stage,
  result,
  timeMs,
}: {
  title: string
  subtitle: string
  chip: string
  stage: StageConfig
  result: SimulationResult
  timeMs: number
}) {
  const frame = getFrameAtTime(result, timeMs)
  const terminalsHit = result.checks.filter(check => timeMs >= check.visualTime)
  const monitorBot = monitorPosition(stage, result, timeMs)

  return (
    <div className="gr-board-card">
      <div className="gr-board-head">
        <div className="gr-board-title">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        <span className="gr-board-chip">{chip}</span>
      </div>

      <div className="gr-board">
        <div className="gr-grid">
          {stage.grid.flatMap((row, y) =>
            row.split('').map((cell, x) => {
              const goal = stage.goals.find(item => item.x === x && item.y === y)
              const switchTile = stage.switches?.find(item => item.x === x && item.y === y)
              const pad = stage.pads?.find(item => item.x === x && item.y === y)
              const lockTile = stage.locks?.find(item => item.x === x && item.y === y)
              const door = stage.doors?.find(item => item.x === x && item.y === y)
              const terminalIndex = stage.monitor?.terminals.findIndex(item => item.x === x && item.y === y) ?? -1
              const terminalCheck = terminalIndex >= 0 ? terminalsHit.find(check => check.terminalIndex === terminalIndex) : undefined
              const lockGlow = !!lockTile && (
                !!frame.lockStates[lockTile.id]
                || stage.robots.some(robot => {
                  const liveRobot = frame.robots[robot.id]
                  return !!liveRobot && Math.abs(liveRobot.x - x) < 0.001 && Math.abs(liveRobot.y - y) < 0.001
                })
              )

              return (
                <div key={`${x}-${y}`} className={`gr-cell ${cell === '#' ? 'wall' : ''}`}>
                  {goal && <div className="gr-goal-flag" />}
                  {switchTile && (
                    <div className={`gr-switch ${frame.switchStates[switchTile.id] ? 'is-active' : ''}`} />
                  )}
                  {pad && <div className="gr-pad" />}
                  {lockTile && <div className={`gr-lock ${lockGlow ? 'is-active' : ''}`} />}
                  {door && (
                    <>
                      <div className={`gr-door ${frame.doorStates[door.id] ? 'is-open' : ''}`} />
                      <div className="gr-door-label">{door.label}</div>
                    </>
                  )}
                  {terminalIndex >= 0 && (
                    <div className={`gr-terminal ${terminalCheck ? 'is-hit' : ''} ${terminalCheck && !terminalCheck.result ? 'is-false' : ''}`} />
                  )}
                </div>
              )
            }),
          )}
        </div>

        <div className="gr-robot-layer">
          {stage.robots.map(robot => {
            const samples = sampleRobotPath(result, robot.id, timeMs, robot.bodyLength ?? 5)
            const head = samples[0]
            if (!head) return null
            const robotGoal = stage.goals.find(goal => goal.robotId === robot.id)
            const isAtGoal = !!robotGoal
              && Math.abs(head.x - robotGoal.x) < 0.001
              && Math.abs(head.y - robotGoal.y) < 0.001
            const rawTail = samples.at(-1) ?? head
            const arrivalMs = goalArrivalTime(result, robot.id, robotGoal ?? null)
            const settleProgress = isAtGoal && arrivalMs !== null
              ? Math.max(0, Math.min(1, (timeMs - arrivalMs) / 340))
              : 0
            const tail = isAtGoal
              ? {
                x: rawTail.x + (head.x - rawTail.x) * settleProgress,
                y: rawTail.y + (head.y - rawTail.y) * settleProgress,
              }
              : rawTail
            const bodyCenter = {
              x: (head.x + tail.x) / 2,
              y: (head.y + tail.y) / 2,
            }
            const distance = Math.hypot(head.x - tail.x, head.y - tail.y)
            const bodyWidth = Math.max(8.5, ((distance + 0.68) / 8) * 100)

            return (
              <div key={robot.id}>
                <div
                  className="gr-robot-label"
                  style={{
                    left: `${((head.x + 0.5) / 8) * 100}%`,
                    top: `${((head.y + 0.5) / 8) * 100}%`,
                  }}
                >
                  {head.name}
                </div>

                {head.heldLocks.length > 0 && (
                  <div
                    className="gr-robot-key"
                    style={{
                      left: `${((head.x + 0.5) / 8) * 100}%`,
                      top: `${((head.y + 0.5) / 8) * 100}%`,
                    }}
                  >
                    {head.heldLocks[0]}
                  </div>
                )}

                <div
                  className="gr-robot-body"
                  style={{
                    left: `${((bodyCenter.x + 0.5) / 8) * 100}%`,
                    top: `${((bodyCenter.y + 0.5) / 8) * 100}%`,
                    width: `${bodyWidth}%`,
                    transform: `translate(-50%, -50%) rotate(${renderRotation(tail, head)})`,
                    background: robot.accent,
                    boxShadow: `0 0 0 4px ${robot.trail}`,
                  }}
                />

                <div
                  className="gr-robot-head"
                  style={{
                    left: `${((head.x + 0.5) / 8) * 100}%`,
                    top: `${((head.y + 0.5) / 8) * 100}%`,
                    background: robot.accent,
                    boxShadow: `0 0 0 4px ${robot.trail}`,
                  }}
                />
              </div>
            )
          })}

          {stage.monitor && monitorBot && (
            <div
              className="gr-monitor-bot"
              style={{
                left: `${((monitorBot.x + 0.5) / 8) * 100}%`,
                top: `${((monitorBot.y + 0.5) / 8) * 100}%`,
                background: stage.monitor.robot.accent,
                boxShadow: `0 0 0 4px ${stage.monitor.robot.trail}`,
              }}
            />
          )}
        </div>
      </div>

      {stage.monitor && (
        <div className="gr-monitor-panel">
          {stage.monitor.terminals.map((terminal, index) => {
            const check = terminalsHit.find(item => item.terminalIndex === index)
            return (
              <div key={terminal.label} className="gr-monitor-pill">
                <strong>{terminal.label}</strong>
                {check ? (
                  <span className={`gr-bool ${check.result ? 'true' : 'false'}`}>
                    {check.result ? 'true' : 'false'}
                  </span>
                ) : (
                  <span className="gr-bool false" style={{ opacity: 0.48 }}>pending</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CodeBlockCard({
  block,
  stage,
  draggable = true,
  onDragStart,
  onDragEnd,
  onAdd,
  onRemove,
  onChange,
  sourceSlot = null,
}: {
  block: CodeBlock
  stage: StageConfig
  draggable?: boolean
  onDragStart?: (block: CodeBlock, sourceSlot: number | null) => void
  onDragEnd?: () => void
  onAdd?: (block: CodeBlock) => void
  onRemove?: () => void
  onChange?: (patch: Partial<CodeBlock>) => void
  sourceSlot?: number | null
}) {
  const parts = blockCodeParts(block)
  const accent = block.editableThread && sourceSlot === null ? '#9b91aa' : stagePaletteColor(stage, block)
  const isEditableMove = block.kind === 'move' && sourceSlot !== null && (block.editableDirection || block.editableSteps)
  const isEditableThread = !!block.editableThread && sourceSlot !== null

  return (
    <div
      className="gr-block"
      draggable={draggable}
      onDragStart={() => onDragStart?.(block, sourceSlot)}
      onDragEnd={onDragEnd}
      onClick={() => onAdd?.(block)}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onAdd?.(block)
        }
      }}
    >
      <span className="gr-block-thread" style={{ background: accent }}>
        {paletteThreadLabel(block)}
      </span>

      <div className="gr-code">
        {isEditableThread ? (
          <select
            className="gr-code-select gr-code-thread-select"
            value={block.threadId}
            onChange={event => onChange?.({ threadId: event.target.value })}
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.stopPropagation()}
          >
            {stage.robots.map(robot => (
              <option key={robot.id} value={robot.id}>
                {robot.id}
              </option>
            ))}
          </select>
        ) : (
          <span className="gr-code-thread">{block.editableThread ? 'thread?' : block.threadId}</span>
        )}
        <span className="gr-code-dot">.</span>
        {block.kind === 'move' && isEditableMove ? (
          <select
            className="gr-code-select"
            value={block.direction ?? 'right'}
            onChange={event => onChange?.({ direction: event.target.value as Direction })}
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.stopPropagation()}
          >
            {DIRECTION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="gr-code-method">{parts.method}</span>
        )}
        <span className="gr-code-paren">(</span>
        {block.kind === 'move' && isEditableMove ? (
          <input
            type="number"
            inputMode="numeric"
            className="gr-code-input"
            min={block.minSteps ?? 1}
            max={block.maxSteps ?? 6}
            value={block.steps ?? 1}
            onChange={event => {
              const raw = Number.parseInt(event.target.value, 10)
              const nextValue = Number.isFinite(raw) ? clampStepCount(block, raw) : block.minSteps ?? 1
              onChange?.({ steps: nextValue })
            }}
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.stopPropagation()}
          />
        ) : parts.valueType === 'string' ? (
          <span className="gr-code-string">{parts.value}</span>
        ) : parts.valueType === 'lock' ? (
          <span className="gr-code-number">{parts.value}</span>
        ) : parts.valueType === 'number' ? (
          <span className="gr-code-number">{parts.value}</span>
        ) : null}
        {parts.valueType === 'empty' && <span className="gr-code-empty" />}
        <span className="gr-code-paren">)</span>
        <span className="gr-code-dot">;</span>
      </div>

      {onRemove && (
        <button
          type="button"
          className="gr-remove"
          onClick={event => {
            event.stopPropagation()
            onRemove()
          }}
          aria-label="Remove block"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default function GhostReplay({ onExit }: GhostReplayProps) {
  const { userId } = useAuth()
  const placementSeed = useRef(0)
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(INTRO_STORAGE_KEY) === '1' ? 'roadmap' : 'intro'
    } catch {
      return 'intro'
    }
  })
  const [introIndex, setIntroIndex] = useState(0)
  const [activeStageIdx, setActiveStageIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState(() => getCompletedLevels(THREAD_GAME_ID))
  const [placements, setPlacements] = useState<Array<PlacedBlock | null>>([])
  const [dragging, setDragging] = useState<{ block: CodeBlock; sourceSlot: number | null } | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [clockMs, setClockMs] = useState(0)
  const [attempt, setAttempt] = useState<AttemptState>(null)
  const [stageCleared, setStageCleared] = useState(false)
  const [helpOpen, setHelpOpen] = useState<HelpKey | null>(null)

  useEffect(() => {
    if (!userId) return
    remoteGetCompletedLevels(userId, THREAD_GAME_ID).then(remote => {
      if (remote.size > 0) {
        setCompletedIds(prev => new Set([...prev, ...remote]))
      }
    })
  }, [userId])

  useEffect(() => {
    let raf = 0
    const start = performance.now()

    const frame = (now: number) => {
      setClockMs(now - start)
      raf = window.requestAnimationFrame(frame)
    }

    raf = window.requestAnimationFrame(frame)
    return () => window.cancelAnimationFrame(raf)
  }, [])

  const stage = THREAD_STAGES[activeStageIdx]
  const isObserveStage = stage.interactionMode === 'observe'
  const slotCount = stage.ghostProgram.length

  const helpItems: Array<{ key: HelpKey; icon: string; label: string; body: string }> = [
    { key: 'objective', icon: '◎', label: 'Objective', body: stage.objective },
    { key: 'concept', icon: 'i', label: stage.conceptTitle, body: stage.conceptBody },
    { key: 'tip', icon: '?', label: 'Ghost Tip', body: stage.ghostTip },
  ]
  const activeHelp = helpItems.find(item => item.key === helpOpen) ?? null

  useEffect(() => {
    setPlacements(Array.from({ length: slotCount }, () => null))
    setAttempt(null)
    setStageCleared(false)
    setHelpOpen(null)
  }, [slotCount, stage.id])

  const ghostResult = useMemo(
    () => simulateStage(stage, stage.ghostProgram),
    [stage],
  )

  const isReady = placements.every(Boolean)

  const ghostTimeMs = attempt?.matches
    ? Math.min(clockMs - attempt.startedAtMs, ghostResult.totalMs)
    : ghostLoopTime(ghostResult.totalMs, clockMs)

  const attemptTimeMs = attempt
    ? Math.min(Math.max(0, clockMs - attempt.startedAtMs), attempt.result.totalMs)
    : 0

  useEffect(() => {
    if (isObserveStage || !attempt?.matches || stageCleared) return
    if (clockMs - attempt.startedAtMs < attempt.result.totalMs + 320) return

    playCorrect()
    setStageCleared(true)
    markLevelComplete(THREAD_GAME_ID, stage.id)
    const updated = getCompletedLevels(THREAD_GAME_ID)
    setCompletedIds(updated)
    if (userId) {
      remoteMarkLevelComplete(userId, THREAD_GAME_ID, stage.id, updated)
      persistSession({ userId, gameId: THREAD_GAME_ID, score: 100, entries: [] })
    }
  }, [attempt, clockMs, isObserveStage, stage.id, stageCleared, userId])

  function clearTransientState() {
    setAttempt(null)
    setStageCleared(false)
    setDragging(null)
    setDragOverSlot(null)
    setHelpOpen(null)
  }

  function resetStageRun() {
    setPlacements(Array.from({ length: slotCount }, () => null))
    clearTransientState()
  }

  function startStage(index: number) {
    const nextStage = THREAD_STAGES[index]
    setPlacements(Array.from({ length: nextStage.ghostProgram.length }, () => null))
    clearTransientState()
    setActiveStageIdx(index)
    setView('stage')
  }

  function returnToRoadmap() {
    clearTransientState()
    setView('roadmap')
  }

  function finishIntro() {
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, '1')
    } catch {
      // ignore storage failures and continue into the roadmap
    }
    setIntroIndex(0)
    setView('roadmap')
  }

  function reopenIntro() {
    setIntroIndex(0)
    setView('intro')
  }

  function createPlacement(template: CodeBlock): PlacedBlock {
    return {
      ...normalizeMoveBlock(template),
      instanceId: `placed-${placementSeed.current += 1}`,
    }
  }

  function placeBlock(block: CodeBlock, slotIndex?: number, sourceSlot: number | null = null) {
    setPlacements(prev => {
      const next = [...prev]
      const targetIndex = slotIndex ?? next.findIndex(item => item === null)
      if (targetIndex < 0) return prev

      if (sourceSlot !== null) {
        if (sourceSlot === targetIndex) return prev

        const movingBlock = next[sourceSlot]
        if (!movingBlock) return prev

        const displaced = next[targetIndex]
        next[targetIndex] = movingBlock
        next[sourceSlot] = displaced ?? null
        return next
      }

      next[targetIndex] = createPlacement(block)
      return next
    })
  }

  function updatePlacement(slotIndex: number, patch: Partial<CodeBlock>) {
    setPlacements(prev =>
      prev.map((block, index) => {
        if (index !== slotIndex || !block) return block
        return normalizeMoveBlock({
          ...block,
          ...patch,
        }) as PlacedBlock
      }),
    )
  }

  function removeBlock(slotIndex: number) {
    setPlacements(prev => prev.map((value, index) => (index === slotIndex ? null : value)))
  }

  function handlePlay() {
    if (!isReady) return
    const program = placements
      .filter((block): block is PlacedBlock => !!block)
      .map(({ instanceId, ...block }) => block)
    const result = simulateStage(stage, program)
    const comparison = compareReplayToGhost(stage, ghostResult, result)

    setAttempt({
      result,
      matches: comparison.matches,
      reason: comparison.reason,
      startedAtMs: clockMs,
    })
    setStageCleared(false)
  }

  function markStageSeen() {
    playCorrect()
    markLevelComplete(THREAD_GAME_ID, stage.id)
    const updated = getCompletedLevels(THREAD_GAME_ID)
    setCompletedIds(updated)
    if (userId) {
      remoteMarkLevelComplete(userId, THREAD_GAME_ID, stage.id, updated)
      persistSession({ userId, gameId: THREAD_GAME_ID, score: 100, entries: [] })
    }
    setStageCleared(true)
  }

  if (view === 'intro') {
    return (
      <ThreadIntroSlides
        index={introIndex}
        onBack={() => setIntroIndex(current => Math.max(0, current - 1))}
        onNext={() => setIntroIndex(current => Math.min(INTRO_SLIDES.length - 1, current + 1))}
        onFinish={finishIntro}
        onSkip={finishIntro}
        onJump={setIntroIndex}
      />
    )
  }

  if (view === 'roadmap') {
    return (
      <LearningRoadmap
        gameName="Thread Lightly"
        gameEmoji="👻"
        themeColor="#7fc4c8"
        completedIds={completedIds}
        levels={THREAD_STAGES}
        onPlay={startStage}
        onExit={onExit}
        secondaryActionLabel="Thread Basics"
        onSecondaryAction={reopenIntro}
      />
    )
  }

  return (
    <div className="gr-shell">
      <div className="gr-level">
        <div className="gr-wrap">
          <div className="gr-topbar">
            <div className="gr-title-wrap">
              <button className="gr-btn ghost" onClick={returnToRoadmap}>
                ← Roadmap
              </button>
              <div>
                <div className="gr-stage-chip">{stage.stageNumber}</div>
                <h1>Thread Lightly</h1>
                <p>{stage.title} • {stage.subtitle}</p>
              </div>
            </div>

            <div className="gr-topbar-side">
              <div className="gr-help-row" aria-label="Stage help">
                {helpItems.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    className={`gr-help-btn ${helpOpen === item.key ? 'is-active' : ''}`}
                    onClick={() => setHelpOpen(current => (current === item.key ? null : item.key))}
                    title={item.label}
                    aria-label={item.label}
                  >
                    {item.icon}
                  </button>
                ))}
              </div>

              <div className="gr-inline-chip">
                {completedIds.size}/{THREAD_STAGES.length} cleared
              </div>
            </div>
          </div>

          {activeHelp && (
            <div className="gr-help-pop">
              <div className="gr-help-pop-head">
                <strong>{activeHelp.label}</strong>
                <button
                  type="button"
                  className="gr-help-close"
                  onClick={() => setHelpOpen(null)}
                  aria-label="Close help"
                >
                  ×
                </button>
              </div>
              <p>{activeHelp.body}</p>
            </div>
          )}

          <div className={`gr-layout ${attempt ? 'is-split' : 'is-solo'}`}>
            <div className="gr-main">
              <div className={`gr-boards ${attempt ? 'is-split' : 'is-solo'}`}>
                <div className={`gr-board-priority ${attempt ? 'is-split' : 'is-solo'}`}>
                  <ReplayBoard
                    title="Reference Ghost"
                    subtitle="Watch the full loop first, then match it."
                    chip="ghost"
                    stage={stage}
                    result={ghostResult}
                    timeMs={ghostTimeMs}
                  />
                </div>

                {attempt && (
                  <div className="gr-board-secondary">
                    <ReplayBoard
                      title="Your Replay"
                      subtitle={attempt.matches ? 'Synced with the ghost.' : 'Runs fully so you can inspect the break.'}
                      chip={attempt.matches ? 'sync' : 'attempt'}
                      stage={stage}
                      result={attempt.result}
                      timeMs={attemptTimeMs}
                    />
                  </div>
                )}
              </div>
            </div>

            <aside className="gr-program">
              <div className="gr-program-head">
                <h2>Program Stack</h2>
                <p>{stage.briefing}</p>
              </div>

              {isObserveStage ? (
                <>
                  <div className="gr-status warning">
                    Two workers each grabbed one lock, then each tried to pick up the other. Nobody moves. Nobody gives way.
                  </div>

                  <div>
                    <h2>Deadlock</h2>
                    <p>Nothing crashed here. The replay just freezes because each thread is waiting for a lock the other one refuses to let go of.</p>
                  </div>

                  <div className="gr-actions">
                    <button className="gr-btn primary" onClick={markStageSeen}>
                      Continue
                    </button>
                    <button className="gr-btn secondary" onClick={returnToRoadmap}>
                      Back to Roadmap
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="gr-actions">
                    <button className="gr-btn primary" disabled={!isReady} onClick={handlePlay}>
                      ▶ Play Attempt
                    </button>
                    <button className="gr-btn secondary" onClick={resetStageRun}>
                      Reset Stack
                    </button>
                  </div>

                  <div className={`gr-status ${attempt ? (attempt.matches ? 'success' : 'warning') : 'info'}`}>
                    {attempt ? attempt.reason : 'Build the exact execution order.'}
                  </div>

                  <div>
                    <h2>Palette</h2>
                    <p>Drag any block in. After you place a move, you can choose its direction and step count inside the stack.</p>
                  </div>

                  <div className="gr-palette">
                    {stage.availableBlocks.map(block => (
                      <CodeBlockCard
                        key={block.id}
                        block={block}
                        stage={stage}
                        onDragStart={(draggedBlock, sourceSlot) => setDragging({ block: draggedBlock, sourceSlot })}
                        onDragEnd={() => setDragging(null)}
                        onAdd={(nextBlock) => placeBlock(nextBlock)}
                      />
                    ))}
                  </div>

                  <div>
                    <h2>Program Stack</h2>
                    <p>Top slots run first. Drag within the stack to reorder the sequence.</p>
                  </div>

                  <div className="gr-stack">
                    {placements.map((block, index) => (
                      <div
                        key={block?.instanceId ?? `slot-${index}`}
                        className={`gr-slot ${dragOverSlot === index ? 'is-over' : ''}`}
                        onDragOver={event => {
                          event.preventDefault()
                          setDragOverSlot(index)
                        }}
                        onDragLeave={() => setDragOverSlot(prev => (prev === index ? null : prev))}
                        onDrop={event => {
                          event.preventDefault()
                          if (dragging) placeBlock(dragging.block, index, dragging.sourceSlot)
                          setDragOverSlot(null)
                          setDragging(null)
                        }}
                      >
                        <div className="gr-slot-index">{index + 1}</div>
                        {block ? (
                          <CodeBlockCard
                            block={block}
                            stage={stage}
                            sourceSlot={index}
                            onDragStart={(draggedBlock, sourceSlot) => setDragging({ block: draggedBlock, sourceSlot })}
                            onDragEnd={() => setDragging(null)}
                            onChange={(patch) => updatePlacement(index, patch)}
                            onRemove={() => removeBlock(index)}
                          />
                        ) : (
                          <div className="gr-slot-empty">Drop code here</div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </aside>
          </div>

          {stageCleared && (
            <div className="gr-complete-overlay">
              <div className="gr-complete-card">
                <div className="gr-stage-chip">Stage Cleared</div>
                <h2>{isObserveStage ? `${stage.title} observed` : `${stage.title} locked in`}</h2>
                <p>{isObserveStage ? 'You watched the freeze frame and unlocked the next lock concept.' : 'The ghost and your replay stayed in sync all the way through. You can replay this stage or move on to the next thread concept.'}</p>
                <div className="gr-complete-actions">
                  {activeStageIdx < THREAD_STAGES.length - 1 && (
                    <button className="gr-btn primary" onClick={() => startStage(activeStageIdx + 1)}>
                      Next Stage →
                    </button>
                  )}
                  <button className="gr-btn ghost" onClick={returnToRoadmap}>
                    Back to Roadmap
                  </button>
                  {!isObserveStage && (
                    <button className="gr-btn secondary" onClick={resetStageRun}>
                      Replay Stage
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
