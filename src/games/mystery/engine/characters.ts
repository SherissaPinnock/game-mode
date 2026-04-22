import { ROOMS } from '../data/rooms'
import { TICK_MS, WALK_SPEED, FRAME_MS, PAUSE_MIN, PAUSE_MAX, FRAME_COUNT } from '../data/constants'
import { isColliding, pickWaypoint, randomInRoom } from './collision'
import type { Suspect } from '../data/suspects'

export interface Char {
  id: string
  name: string
  src: string
  x: number       // % of board
  y: number
  tx: number      // walk target
  ty: number
  frame: number   // 0=back 1=left 2=front 3=right
  frameMs: number // ms on current frame
  moving: boolean
  pauseMs: number // ms remaining before next waypoint
}

/** 0=back(up) 1=left 2=front(down/idle) 3=right */
function directionFrame(dx: number, dy: number): number {
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 1 : 3
  return dy < 0 ? 0 : 2
}

export function makeChar(suspect: Suspect): Char {
  const room = ROOMS.find(r => r.id === suspect.spawnRoomId)!
  const pos  = randomInRoom(room)
  return {
    id: suspect.id,
    name: suspect.name,
    src: suspect.src,
    x: pos.x, y: pos.y,
    tx: pos.x, ty: pos.y,
    frame: 2, frameMs: 0,
    moving: false,
    pauseMs: suspect.initialDelay,
  }
}

/** Pure — advances one character by TICK_MS. */
export function tickChar(c: Char): Char {
  // ── Paused ────────────────────────────────────────────────────
  if (!c.moving) {
    const remaining = c.pauseMs - TICK_MS
    if (remaining > 0) return { ...c, pauseMs: remaining, frame: 2 }
    const { x: tx, y: ty } = pickWaypoint(c.x, c.y)
    return { ...c, pauseMs: 0, tx, ty, moving: true }
  }

  // ── Walking ───────────────────────────────────────────────────
  const dx   = c.tx - c.x
  const dy   = c.ty - c.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const step = (WALK_SPEED * TICK_MS) / 1000

  if (dist <= step) {
    return {
      ...c,
      x: c.tx, y: c.ty,
      moving: false, frame: 2, frameMs: 0,
      pauseMs: PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN),
    }
  }

  const ndx = dx / dist
  const ndy = dy / dist
  let nx = c.x + ndx * step
  let ny = c.y + ndy * step

  // Collision slide / reroute
  if (isColliding(nx, ny)) {
    if (!isColliding(c.x + ndx * step, c.y)) {
      ny = c.y
    } else if (!isColliding(c.x, c.y + ndy * step)) {
      nx = c.x
    } else {
      const { x: tx, y: ty } = pickWaypoint(c.x, c.y)
      return { ...c, moving: true, tx, ty, frame: 2 }
    }
  }

  const newFMs  = c.frameMs + TICK_MS
  const advance = newFMs >= FRAME_MS
  return {
    ...c,
    x: nx, y: ny,
    frame:   advance ? directionFrame(ndx, ndy) : c.frame,
    frameMs: advance ? 0 : newFMs,
  }
}

export type { Suspect }
export { FRAME_COUNT }
