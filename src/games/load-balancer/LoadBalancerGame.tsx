import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { LearningRoadmap } from '@/components/LearningRoadmap'
import { getCompletedLevels, markLevelComplete } from '@/lib/roadmap-progress'
import { remoteGetCompletedLevels, remoteMarkLevelComplete } from '@/lib/supabaseApi'
import { useAuth } from '@/lib/auth'
import {
  playClick,
  playClubMusic,
  playComplete,
  playCorrect,
  playGameOver,
  playPop,
  playServerCrash,
  playWarning,
  playWrong,
} from '@/lib/sounds'
import clubBackgroundSrc from '@/assets/bouncer/club background.png'
import partySheetSrc from '@/assets/bouncer/club goer sprites.png'
import djNarratorSrc from '@/assets/bouncer/dj narrator.png'
import { DJBytebeatIntro } from './components/DJBytebeatIntro'
import { FloatingText } from './components/FloatingText'
import { HUD } from './components/HUD'
import { PartyGoer } from './components/PartyGoer'
import { ServerDoor } from './components/ServerDoor'
import { GAME_ID, LOAD_BALANCER_LEVELS } from './data/roadmap'
import {
  createPartyGoer,
  getCrashDurationMs,
  getOverloadGraceMs,
  getServerProcessingRate,
  getSpawnIntervalMs,
} from './SpawnManager'
import { extractPartySprites } from './sprite-utils'
import type {
  DragState,
  FloatingTextState,
  GameState,
  ServerId,
  ServerState,
} from './types'
import './LoadBalancerGame.css'

interface LoadBalancerGameProps {
  onExit: () => void
}

type GameEvent =
  | 'correct'
  | 'wrong'
  | 'warning'
  | 'crash'
  | 'complete'
  | 'game-over'
  | 'bonus'

type UpdateResult = {
  state: GameState
  events: GameEvent[]
}

type DoorLayout = {
  id: ServerId
  centerX: number
  left: number
  top: number
  width: number
  height: number
  feedbackX: number
  feedbackY: number
}

const ROUND_DURATION_MS = 90_000
const PARTY_ESCAPE_X = 78
const DRAG_HOTSPOT_X = 0
const DRAG_HOTSPOT_Y = -7.5
const LANE_POSITIONS = [68.6, 74.4, 80.2]

const DOOR_LAYOUTS: DoorLayout[] = [
  { id: 1, centerX: 31.4, left: 23.8, top: 35.8, width: 15.2, height: 30.8, feedbackX: 31.4, feedbackY: 39.5 },
  { id: 2, centerX: 49.2, left: 41.5, top: 35.8, width: 15.2, height: 30.8, feedbackX: 49.2, feedbackY: 39.5 },
  { id: 3, centerX: 66.9, left: 59.3, top: 35.8, width: 15.2, height: 30.8, feedbackX: 66.9, feedbackY: 39.5 },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function createInitialServers(): ServerState[] {
  return [
    { id: 1, label: 'Server 1', color: 'red', load: 0, capacity: 6, crashTimerMs: 0, overloadTimerMs: 0, warnActive: false, totalAssigned: 0 },
    { id: 2, label: 'Server 2', color: 'blue', load: 0, capacity: 6, crashTimerMs: 0, overloadTimerMs: 0, warnActive: false, totalAssigned: 0 },
    { id: 3, label: 'Server 3', color: 'green', load: 0, capacity: 6, crashTimerMs: 0, overloadTimerMs: 0, warnActive: false, totalAssigned: 0 },
  ]
}

function createFloatingText(id: number, partial: Omit<FloatingTextState, 'id'>): FloatingTextState {
  return { id, ...partial }
}

function createInitialGameState(): GameState {
  return {
    phase: 'playing',
    timeLeftMs: ROUND_DURATION_MS,
    reputation: 100,
    score: 0,
    elapsedMs: 0,
    spawnCooldownMs: 750,
    balanceCooldownMs: 5_500,
    assignmentsSinceBonus: 0,
    trafficSpikeTimerMs: 2_000,
    nextId: 100,
    partyGoers: [],
    servers: createInitialServers(),
    floatingTexts: [
      createFloatingText(1, { text: 'Keep the club online!', x: 49, y: 14, driftX: 0, driftY: -2.2, lifeMs: 1_450, tone: 'bonus' }),
      createFloatingText(2, { text: 'Drag to matching server', x: 49, y: 19, driftX: 0, driftY: -2, lifeMs: 1_800, tone: 'good' }),
    ],
  }
}

function pushFloatingText(state: GameState, nextId: number, partial: Omit<FloatingTextState, 'id'>) {
  state.floatingTexts = [...state.floatingTexts, createFloatingText(nextId, partial)]
}

function getDoorAtPosition(x: number, y: number) {
  const hotspotX = x + DRAG_HOTSPOT_X
  const hotspotY = y + DRAG_HOTSPOT_Y
  return DOOR_LAYOUTS.find(door =>
    hotspotX >= door.left &&
    hotspotX <= door.left + door.width &&
    hotspotY >= door.top &&
    hotspotY <= door.top + door.height,
  ) ?? null
}

function nearestLane(y: number) {
  return LANE_POSITIONS.reduce((closest, lane) =>
    Math.abs(lane - y) < Math.abs(closest - y) ? lane : closest,
  )
}

function getLaneIndex(y: number) {
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < LANE_POSITIONS.length; index += 1) {
    const distance = Math.abs(LANE_POSITIONS[index] - y)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex
}

function spreadPartyGoers(goers: GameState['partyGoers']) {
  const next = goers.map(goer => ({ ...goer }))
  const minGap = 4.6

  for (let laneIndex = 0; laneIndex < LANE_POSITIONS.length; laneIndex += 1) {
    const laneGoers = next
      .filter(goer => getLaneIndex(goer.laneY) === laneIndex)
      .sort((a, b) => b.x - a.x)

    for (let index = 1; index < laneGoers.length; index += 1) {
      const leader = laneGoers[index - 1]
      const follower = laneGoers[index]
      const maxX = leader.x - minGap

      if (follower.x > maxX) {
        follower.x = maxX
      }
    }
  }

  return next
}

function resolveDoorDrop(x: number, y: number) {
  const directMatch = getDoorAtPosition(x, y)
  if (directMatch) return directMatch

  const snapCandidate = DOOR_LAYOUTS
    .map(door => {
      const dx = Math.abs((x + DRAG_HOTSPOT_X) - door.centerX)
      const dy = Math.abs((y + DRAG_HOTSPOT_Y) - (door.top + (door.height * 0.52)))
      return {
        door,
        dx,
        dy,
        score: dx + (dy * 0.55),
      }
    })
    .filter(candidate =>
      candidate.dx <= 8.8 &&
      candidate.dy <= 14 &&
      x >= candidate.door.left - 2 &&
      x <= candidate.door.left + candidate.door.width + 2,
    )
    .sort((a, b) => a.score - b.score)[0]

  return snapCandidate?.door ?? null
}

function getGoerRenderPosition(goer: GameState['partyGoers'][number], activeDrag: DragState | null) {
  if (activeDrag?.id === goer.id) {
    return {
      x: activeDrag.x,
      y: activeDrag.y,
    }
  }

  return {
    x: goer.x,
    y: goer.laneY + (Math.sin(goer.wobble) * 0.7),
  }
}

function pickPartyGoerAtPointer(
  partyGoers: GameState['partyGoers'],
  sceneRect: DOMRect,
  clientX: number,
  clientY: number,
) {
  const radiusX = sceneRect.width * 0.036
  const radiusTop = sceneRect.height * 0.13
  const radiusBottom = sceneRect.height * 0.1

  let bestMatch: { goer: GameState['partyGoers'][number]; renderX: number; renderY: number; score: number } | null = null

  for (const goer of partyGoers) {
    const render = getGoerRenderPosition(goer, null)
    const goerCenterX = sceneRect.left + ((render.x / 100) * sceneRect.width)
    const goerCenterY = sceneRect.top + ((render.y / 100) * sceneRect.height)
    const dx = clientX - goerCenterX
    const dy = clientY - goerCenterY

    if (Math.abs(dx) > radiusX) continue
    if (dy < -radiusTop || dy > radiusBottom) continue

    const verticalScale = dy < 0 ? radiusTop : radiusBottom
    const score = Math.abs(dx / radiusX) + Math.abs(dy / verticalScale)

    if (!bestMatch || score < bestMatch.score) {
      bestMatch = {
        goer,
        renderX: render.x,
        renderY: render.y,
        score,
      }
    }
  }

  return bestMatch
}

function applySoundEvents(events: GameEvent[]) {
  for (const event of events) {
    if (event === 'correct') playCorrect()
    if (event === 'wrong') playWrong()
    if (event === 'warning') playWarning()
    if (event === 'crash') playServerCrash()
    if (event === 'complete') playComplete()
    if (event === 'game-over') playGameOver()
    if (event === 'bonus') playPop()
  }
}

function getDragPositionFromPointer(
  pointerX: number,
  pointerY: number,
  sceneRect: DOMRect,
  drag: Pick<DragState, 'grabOffsetX' | 'grabOffsetY'>,
) {
  return {
    x: clamp((((pointerX - sceneRect.left) / sceneRect.width) * 100) - drag.grabOffsetX, -2, 88),
    y: clamp((((pointerY - sceneRect.top) / sceneRect.height) * 100) - drag.grabOffsetY, 18, 82),
  }
}

function advanceGameState(current: GameState, deltaMs: number, spriteCount: number, draggingId: number | null): UpdateResult {
  if (current.phase !== 'playing') {
    return { state: current, events: [] }
  }

  const next: GameState = {
    ...current,
    elapsedMs: current.elapsedMs + deltaMs,
    timeLeftMs: Math.max(0, current.timeLeftMs - deltaMs),
    spawnCooldownMs: current.spawnCooldownMs - deltaMs,
    balanceCooldownMs: current.balanceCooldownMs - deltaMs,
    trafficSpikeTimerMs: Math.max(0, current.trafficSpikeTimerMs - deltaMs),
    partyGoers: [],
    servers: [],
    floatingTexts: current.floatingTexts
      .map(text => ({
        ...text,
        x: text.x + (text.driftX * (deltaMs / 1000)),
        y: text.y + (text.driftY * (deltaMs / 1000)),
        lifeMs: text.lifeMs - deltaMs,
      }))
      .filter(text => text.lifeMs > 0),
  }

  const events: GameEvent[] = []
  let reputationPenalty = 0
  let nextFloatingId = next.nextId
  const processingRate = getServerProcessingRate(next.elapsedMs, ROUND_DURATION_MS)

  next.partyGoers = current.partyGoers
    .map(goer => {
      const isDragging = draggingId === goer.id
      const movedX = isDragging ? goer.x : goer.x + (goer.speed * (deltaMs / 1000))
      return { ...goer, x: movedX, wobble: goer.wobble + (deltaMs / 320) }
    })
    .map(goer => ({
      ...goer,
      laneY: nearestLane(goer.laneY),
    }))
  next.partyGoers = spreadPartyGoers(next.partyGoers)
    .filter(goer => {
      if (draggingId === goer.id) return true
      if (goer.x <= PARTY_ESCAPE_X) return true

      reputationPenalty += 8
      pushFloatingText(next, nextFloatingId, {
        text: 'Walkout!',
        x: 77,
        y: goer.laneY - 8,
        driftX: 0,
        driftY: -2.6,
        lifeMs: 1_100,
        tone: 'bad',
      })
      nextFloatingId += 1
      events.push('wrong')
      return false
    })

  next.servers = current.servers.map(server => {
    const clone: ServerState = { ...server }

    if (clone.crashTimerMs > 0) {
      clone.crashTimerMs = Math.max(0, clone.crashTimerMs - deltaMs)
      clone.load = Math.max(0, clone.load - (processingRate * 0.38 * (deltaMs / 1000)))
      if (clone.crashTimerMs === 0) {
        pushFloatingText(next, nextFloatingId, {
          text: `${clone.label} back online`,
          x: DOOR_LAYOUTS.find(door => door.id === clone.id)?.feedbackX ?? 50,
          y: 34,
          driftX: 0,
          driftY: -2.2,
          lifeMs: 1_200,
          tone: 'bonus',
        })
        nextFloatingId += 1
      }
      return clone
    }

    const overloadRatio = Math.max(0, (clone.load - clone.capacity) / clone.capacity)
    const slowdown = overloadRatio > 0 ? 0.58 : 1
    clone.load = Math.max(0, clone.load - (processingRate * slowdown * (deltaMs / 1000)))

    if (clone.load > clone.capacity) {
      clone.overloadTimerMs += deltaMs
      reputationPenalty += overloadRatio * 6.4 * (deltaMs / 1000)

      if (!clone.warnActive) {
        const layout = DOOR_LAYOUTS.find(door => door.id === clone.id)
        if (layout) {
          pushFloatingText(next, nextFloatingId, {
            text: 'Server Overloaded!',
            x: layout.feedbackX,
            y: layout.feedbackY,
            driftX: 0,
            driftY: -2.1,
            lifeMs: 1_250,
            tone: 'warn',
          })
          nextFloatingId += 1
        }
        clone.warnActive = true
        events.push('warning')
      }

      if (clone.overloadTimerMs >= getOverloadGraceMs(next.elapsedMs, ROUND_DURATION_MS)) {
        const layout = DOOR_LAYOUTS.find(door => door.id === clone.id)
        clone.crashTimerMs = getCrashDurationMs(next.elapsedMs, ROUND_DURATION_MS)
        clone.overloadTimerMs = 0
        clone.warnActive = false
        clone.load = round(clone.capacity * 0.58)
        if (layout) {
          pushFloatingText(next, nextFloatingId, {
            text: `${clone.label} crashed`,
            x: layout.feedbackX,
            y: layout.feedbackY,
            driftX: 0,
            driftY: -2.3,
            lifeMs: 1_450,
            tone: 'bad',
          })
          nextFloatingId += 1
        }
        events.push('crash')
      }
    } else {
      clone.overloadTimerMs = Math.max(0, clone.overloadTimerMs - (deltaMs * 1.4))
      clone.warnActive = false
    }

    return clone
  })

  while (next.spawnCooldownMs <= 0 && next.phase === 'playing') {
    next.partyGoers = [...next.partyGoers, createPartyGoer(next.nextId, next.elapsedMs, ROUND_DURATION_MS, spriteCount)]
    next.nextId += 1
    next.spawnCooldownMs += getSpawnIntervalMs(next.elapsedMs, ROUND_DURATION_MS)
  }

  if (next.partyGoers.length >= 7 && next.trafficSpikeTimerMs === 0) {
    pushFloatingText(next, nextFloatingId, {
      text: 'Traffic Spike!',
      x: 49,
      y: 24,
      driftX: 0,
      driftY: -2.1,
      lifeMs: 1_100,
      tone: 'warn',
    })
    nextFloatingId += 1
    next.trafficSpikeTimerMs = 2_800
    events.push('warning')
  }

  if (next.balanceCooldownMs <= 0) {
    const liveLoads = next.servers.map(server => server.load)
    const spread = Math.max(...liveLoads) - Math.min(...liveLoads)
    const noCrashes = next.servers.every(server => server.crashTimerMs === 0)

    if (next.assignmentsSinceBonus >= 4 && spread <= 1.25 && noCrashes) {
      next.score += 35
      next.reputation = Math.min(100, next.reputation + 6)
      pushFloatingText(next, nextFloatingId, {
        text: 'Perfect Balance!',
        x: 49,
        y: 18,
        driftX: 0,
        driftY: -2.4,
        lifeMs: 1_350,
        tone: 'bonus',
      })
      nextFloatingId += 1
      events.push('bonus')
    }

    next.assignmentsSinceBonus = 0
    next.balanceCooldownMs += 5_500
  }

  next.reputation = clamp(next.reputation - reputationPenalty, 0, 100)
  next.nextId = nextFloatingId

  const crashedCount = next.servers.filter(server => server.crashTimerMs > 0).length
  if (crashedCount >= 2 || next.reputation <= 0) {
    next.phase = 'lost'
    events.push('game-over')
  } else if (next.timeLeftMs <= 0) {
    next.phase = 'won'
    next.score += 100 + Math.round(next.reputation * 2)
    events.push('complete')
  }

  return { state: next, events }
}

function assignPartyGoer(current: GameState, goerId: number, dropDoorId: ServerId | null, dragX: number, dragY: number): UpdateResult {
  const goer = current.partyGoers.find(entry => entry.id === goerId)
  if (!goer || current.phase !== 'playing') {
    return { state: current, events: [] }
  }

  if (dropDoorId === null) {
    return {
      state: {
        ...current,
        partyGoers: current.partyGoers.map(entry =>
          entry.id === goerId
            ? {
              ...entry,
              x: clamp(dragX, -5, PARTY_ESCAPE_X - 1.2),
              laneY: nearestLane(clamp(dragY, 62, 82)),
            }
            : entry,
        ),
      },
      events: [],
    }
  }

  const next: GameState = {
    ...current,
    partyGoers: current.partyGoers.filter(entry => entry.id !== goerId),
    servers: current.servers.map(server => ({ ...server })),
    floatingTexts: [...current.floatingTexts],
  }
  const events: GameEvent[] = []
  let nextFloatingId = next.nextId
  const targetServer = next.servers.find(server => server.id === dropDoorId)
  const layout = DOOR_LAYOUTS.find(door => door.id === dropDoorId)

  if (!targetServer || !layout) {
    return { state: current, events: [] }
  }

  if (targetServer.crashTimerMs > 0) {
    next.reputation = clamp(next.reputation - 10, 0, 100)
    pushFloatingText(next, nextFloatingId, {
      text: 'Server down!',
      x: layout.feedbackX,
      y: layout.feedbackY,
      driftX: 0,
      driftY: -2.4,
      lifeMs: 1_150,
      tone: 'bad',
    })
    nextFloatingId += 1
    events.push('wrong')
    next.nextId = nextFloatingId
    return { state: next, events }
  }

  if (goer.answer !== dropDoorId) {
    next.reputation = clamp(next.reputation - 14, 0, 100)
    pushFloatingText(next, nextFloatingId, {
      text: 'Wrong door',
      x: layout.feedbackX,
      y: layout.feedbackY,
      driftX: 0,
      driftY: -2.6,
      lifeMs: 1_250,
      tone: 'bad',
    })
    nextFloatingId += 1
    events.push('wrong')
    next.nextId = nextFloatingId
    return { state: next, events }
  }

  next.score += 10
  next.assignmentsSinceBonus += 1
  targetServer.load = round(targetServer.load + 1)
  targetServer.totalAssigned += 1

  pushFloatingText(next, nextFloatingId, {
    text: '+10',
    x: layout.feedbackX,
    y: layout.feedbackY,
    driftX: 0,
    driftY: -2.6,
    lifeMs: 1_050,
    tone: 'good',
  })
  nextFloatingId += 1

  if (targetServer.load > targetServer.capacity) {
    next.reputation = clamp(next.reputation - 4, 0, 100)
    pushFloatingText(next, nextFloatingId, {
      text: 'Hot route!',
      x: layout.feedbackX,
      y: layout.feedbackY + 5,
      driftX: 0,
      driftY: -2.2,
      lifeMs: 1_150,
      tone: 'warn',
    })
    nextFloatingId += 1
    events.push('warning')
  } else {
    events.push('correct')
  }

  next.nextId = nextFloatingId
  return { state: next, events }
}

export default function LoadBalancerGame({ onExit }: LoadBalancerGameProps) {
  const { userId } = useAuth()
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<GameState>(createInitialGameState())
  const dragRef = useRef<DragState | null>(null)
  const completedIdsRef = useRef<Set<string>>(new Set())
  const winRecordedRef = useRef(false)
  const clubMusicRef = useRef<HTMLAudioElement | null>(null)

  const [view, setView] = useState<'roadmap' | 'intro' | 'game'>('roadmap')
  const [activeLevelIdx, setActiveLevelIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState(() => getCompletedLevels(GAME_ID))
  const [partySprites, setPartySprites] = useState<string[]>([])
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState())
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoveredDoorId, setHoveredDoorId] = useState<ServerId | null>(null)
  const [musicMuted, setMusicMuted] = useState(false)

  completedIdsRef.current = completedIds

  useEffect(() => {
    gameRef.current = gameState
  }, [gameState])

  useEffect(() => {
    dragRef.current = dragState
  }, [dragState])

  useEffect(() => {
    return () => {
      if (clubMusicRef.current) {
        clubMusicRef.current.pause()
        clubMusicRef.current.currentTime = 0
        clubMusicRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    extractPartySprites(partySheetSrc)
      .then(sprites => {
        if (!cancelled && sprites.length > 0) {
          setPartySprites(sprites)
        }
      })
      .catch(() => {
        if (!cancelled) setPartySprites([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    remoteGetCompletedLevels(userId, GAME_ID).then(remote => {
      if (remote.size === 0) return
      setCompletedIds(prev => new Set([...prev, ...remote]))
    })
  }, [userId])

  useEffect(() => {
    if (view !== 'game' || activeLevelIdx !== 0 || gameState.phase !== 'playing') return

    let frameId = 0
    let lastTick = performance.now()

    const tick = (now: number) => {
      const deltaMs = Math.min(40, now - lastTick)
      lastTick = now

      const result = advanceGameState(gameRef.current, deltaMs, Math.max(1, partySprites.length), dragRef.current?.id ?? null)
      gameRef.current = result.state
      setGameState(result.state)
      applySoundEvents(result.events)
      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [view, activeLevelIdx, gameState.phase, partySprites.length])

  useEffect(() => {
    if (!dragState) return

    function handlePointerMove(event: PointerEvent) {
      const activeDrag = dragRef.current
      const sceneRect = sceneRef.current?.getBoundingClientRect()
      if (!activeDrag || event.pointerId !== activeDrag.pointerId || !sceneRect) return

      const { x: nextX, y: nextY } = getDragPositionFromPointer(event.clientX, event.clientY, sceneRect, activeDrag)
      const nextDoor = resolveDoorDrop(nextX, nextY)?.id ?? null
      const updatedDrag = {
        ...activeDrag,
        x: nextX,
        y: nextY,
      }

      dragRef.current = updatedDrag
      setDragState(updatedDrag)
      setHoveredDoorId(nextDoor)
    }

    function handlePointerUp(event: PointerEvent) {
      const activeDrag = dragRef.current
      const sceneRect = sceneRef.current?.getBoundingClientRect()
      if (!activeDrag || event.pointerId !== activeDrag.pointerId || !sceneRect) return

      const finalPosition = getDragPositionFromPointer(event.clientX, event.clientY, sceneRect, activeDrag)
      const resolvedDrag = {
        ...activeDrag,
        ...finalPosition,
      }
      const doorId = resolveDoorDrop(resolvedDrag.x, resolvedDrag.y)?.id ?? null
      const result = assignPartyGoer(gameRef.current, resolvedDrag.id, doorId, resolvedDrag.x, resolvedDrag.y)

      dragRef.current = null
      gameRef.current = result.state
      setGameState(result.state)
      applySoundEvents(result.events)
      setDragState(null)
      setHoveredDoorId(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [dragState?.pointerId])

  useEffect(() => {
    if (view !== 'game' || activeLevelIdx !== 0 || gameState.phase !== 'won' || winRecordedRef.current) return

    const levelId = LOAD_BALANCER_LEVELS[0]?.id
    if (!levelId) return

    winRecordedRef.current = true
    if (!completedIdsRef.current.has(levelId)) {
      const before = completedIdsRef.current
      markLevelComplete(GAME_ID, levelId)
      const updated = getCompletedLevels(GAME_ID)
      setCompletedIds(updated)
      if (userId) remoteMarkLevelComplete(userId, GAME_ID, levelId, before)
    }
  }, [view, activeLevelIdx, gameState.phase, userId])

  function resetStage() {
    winRecordedRef.current = false
    const fresh = createInitialGameState()
    gameRef.current = fresh
    setGameState(fresh)
    setDragState(null)
    setHoveredDoorId(null)
  }

  function ensureClubMusicPlaying() {
    const existing = clubMusicRef.current

    if (existing) {
      existing.loop = true
      existing.volume = 0.35
      existing.muted = musicMuted
      existing.play().catch(() => {})
      return
    }

    clubMusicRef.current = playClubMusic({
      loop: true,
      volume: 0.35,
      muted: musicMuted,
    })
  }

  function stopClubMusic() {
    if (!clubMusicRef.current) return
    clubMusicRef.current.pause()
    clubMusicRef.current.currentTime = 0
    clubMusicRef.current = null
  }

  function handleToggleMusic() {
    const nextMuted = !musicMuted
    setMusicMuted(nextMuted)

    if (!clubMusicRef.current) {
      clubMusicRef.current = playClubMusic({
        loop: true,
        volume: 0.35,
        muted: nextMuted,
      })
      return
    }

    clubMusicRef.current.muted = nextMuted
    if (!nextMuted) {
      clubMusicRef.current.play().catch(() => {})
    }
  }

  function startLevel(levelIdx: number) {
    setActiveLevelIdx(levelIdx)
    if (levelIdx === 0) {
      resetStage()
      setView('intro')
      ensureClubMusicPlaying()
      playClick()
      return
    }

    setView('game')
    stopClubMusic()
  }

  function handleStartGameplay() {
    ensureClubMusicPlaying()
    setView('game')
    playClick()
  }

  function handleBackToRoadmap() {
    setView('roadmap')
    setDragState(null)
    setHoveredDoorId(null)
    stopClubMusic()
  }

  function handleExitGame() {
    stopClubMusic()
    onExit()
  }

  function handlePartyLayerPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (gameRef.current.phase !== 'playing') return
    if (dragRef.current) return

    const sceneRect = sceneRef.current?.getBoundingClientRect()
    if (!sceneRect) return

    const picked = pickPartyGoerAtPointer(gameRef.current.partyGoers, sceneRect, event.clientX, event.clientY)
    if (!picked) return

    const nextDrag: DragState = {
      id: picked.goer.id,
      pointerId: event.pointerId,
      x: picked.renderX,
      y: picked.renderY,
      grabOffsetX: (event.clientX - (sceneRect.left + ((picked.renderX / 100) * sceneRect.width))) / sceneRect.width * 100,
      grabOffsetY: (event.clientY - (sceneRect.top + ((picked.renderY / 100) * sceneRect.height))) / sceneRect.height * 100,
      answer: picked.goer.answer,
      prompt: picked.goer.prompt,
      spriteIndex: picked.goer.spriteIndex,
      wobble: picked.goer.wobble,
    }

    event.preventDefault()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Some browsers may reject pointer capture for synthetic edge cases.
    }
    dragRef.current = nextDrag
    setDragState(nextDrag)
    setHoveredDoorId(getDoorAtPosition(nextDrag.x, nextDrag.y)?.id ?? null)
    playClick()
  }

  function handleRetry() {
    resetStage()
  }

  if (view === 'roadmap') {
    return (
      <LearningRoadmap
        gameName="Level 1: The Load Balancer"
        gameEmoji="🪩"
        themeColor="#ff4fd8"
        completedIds={completedIds}
        levels={LOAD_BALANCER_LEVELS}
        onPlay={startLevel}
        onExit={handleExitGame}
      />
    )
  }

  if (view === 'intro') {
    return (
      <DJBytebeatIntro
        narratorSrc={djNarratorSrc}
        backgroundSrc={clubBackgroundSrc}
        onBack={handleBackToRoadmap}
        onStart={handleStartGameplay}
        musicMuted={musicMuted}
        onToggleMusic={handleToggleMusic}
      />
    )
  }

  if (activeLevelIdx !== 0) {
    return (
      <div className="lb-coming-soon">
        <div className="lb-coming-soon-card">
          <h2>{LOAD_BALANCER_LEVELS[activeLevelIdx]?.title ?? 'Next Stage'} is queued up</h2>
          <p>
            Stage {activeLevelIdx + 1} is unlocked in the roadmap, but this prototype only ships the
            full playable load balancer level right now.
          </p>
          <button className="lb-panel-btn" onClick={handleBackToRoadmap} type="button">
            ← Back to roadmap
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="lb-shell">
      <div className="lb-layout">
        <div className="lb-topbar">
          <div className="lb-topbar-actions">
            <button className="lb-back-btn" onClick={handleBackToRoadmap} type="button">
              ← Back to roadmap
            </button>
            <button className="lb-panel-btn" onClick={handleToggleMusic} type="button">
              Music {musicMuted ? 'Off' : 'On'}
            </button>
          </div>

          <div className="lb-title-block">
            <div className="lb-title-chip">🪩</div>
            <div>
              <div className="lb-title-kicker">Club Nexus Ops</div>
              <h1 className="lb-title-name">Level 1: The Load Balancer</h1>
              <p className="lb-title-sub">
                Sort each request to the correct server, spread traffic evenly, and keep the nightclub online for 90 seconds.
              </p>
            </div>
          </div>
        </div>

        <div className="lb-stage">
          <div className="lb-status-strip">
            <HUD
              timeLeftMs={gameState.timeLeftMs}
              reputation={gameState.reputation}
              score={gameState.score}
              activePartyCount={gameState.partyGoers.length}
            />

            <div className="lb-objective">
              <span className="lb-objective-badge">Stage Goal</span>
              <h2>Keep the club online for 90 seconds</h2>
              <p>
                Correct route: +10. Balance bonus lands every few seconds. Lose the room if two servers crash at once or reputation drains to zero.
              </p>
            </div>
          </div>

          <div
            className={`lb-scene ${gameState.trafficSpikeTimerMs > 0 ? 'is-spiking' : ''}`}
            ref={sceneRef}
            style={{ backgroundImage: `url(${clubBackgroundSrc})` }}
          >
            <div className="lb-rain" aria-hidden="true" />
            <div className="lb-reflections" aria-hidden="true" />

            <div className="lb-server-field">
              {gameState.servers.map(server => {
                const layout = DOOR_LAYOUTS.find(door => door.id === server.id)
                const hinted = dragState?.answer === server.id

                return (
                  <ServerDoor
                    key={server.id}
                    server={server}
                    centerX={layout?.centerX ?? 50}
                    isHovered={hoveredDoorId === server.id}
                    isHinted={!!hinted}
                    isDragging={dragState !== null}
                  />
                )
              })}
            </div>

            <div className="lb-party-layer" onPointerDown={handlePartyLayerPointerDown}>
              {gameState.partyGoers.map(goer => {
                const activeDrag = dragState?.id === goer.id ? dragState : null
                const displayGoer = activeDrag
                  ? {
                    ...goer,
                    answer: activeDrag.answer,
                    prompt: activeDrag.prompt,
                    spriteIndex: activeDrag.spriteIndex,
                    wobble: activeDrag.wobble,
                  }
                  : goer
                const spriteSrc = partySprites[displayGoer.spriteIndex % Math.max(1, partySprites.length)] ?? ''
                const render = getGoerRenderPosition(goer, activeDrag)

                return (
                  <PartyGoer
                    key={goer.id}
                    goer={displayGoer}
                    spriteSrc={spriteSrc}
                    renderX={render.x}
                    renderY={render.y}
                    isDragging={!!activeDrag}
                  />
                )
              })}
            </div>

            <div className="lb-floating-layer">
              {gameState.floatingTexts.map(text => (
                <FloatingText key={text.id} text={text} />
              ))}
            </div>

            {gameState.phase !== 'playing' && (
              <div className="lb-results">
                <div className="lb-results-card">
                  <div className={`lb-results-badge ${gameState.phase === 'won' ? 'good' : 'bad'}`}>
                    {gameState.phase === 'won' ? 'Club Online' : 'Service Disrupted'}
                  </div>
                  <h2>
                    {gameState.phase === 'won'
                      ? 'You survived the traffic storm.'
                      : 'The crowd overwhelmed the floor.'}
                  </h2>
                  <p>
                    {gameState.phase === 'won'
                      ? 'Stage 1 is cleared. Reverse Proxy is now unlocked on the roadmap.'
                      : 'Try tighter round-robin routing. Spreading requests earlier buys recovery time before the crash chain starts.'}
                  </p>

                  <div className="lb-results-stats">
                    <div className="lb-results-stat">
                      <span>Score</span>
                      <strong>{gameState.score}</strong>
                    </div>
                    <div className="lb-results-stat">
                      <span>Reputation</span>
                      <strong>{Math.round(gameState.reputation)}%</strong>
                    </div>
                    <div className="lb-results-stat">
                      <span>Handled</span>
                      <strong>{gameState.servers.reduce((sum, server) => sum + server.totalAssigned, 0)}</strong>
                    </div>
                  </div>

                  <div className="lb-results-actions">
                    <button className="lb-panel-btn" onClick={handleRetry} type="button">
                      Retry level
                    </button>
                    <button className="lb-panel-btn" onClick={handleBackToRoadmap} type="button">
                      Back to roadmap
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
