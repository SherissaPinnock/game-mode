import { collisions } from '../collisions'
import { ROOM_MARGIN, MAX_WANDER_DIST } from '../data/constants'
import type { Room } from '../data/rooms'

export const GRID_COLS = 70
export const GRID_ROWS = 50

export function isColliding(x: number, y: number): boolean {
  const col = Math.floor((x / 100) * GRID_COLS)
  const row = Math.floor((y / 100) * GRID_ROWS)
  if (row < 0 || row >= collisions.length || col < 0 || col >= (collisions[0]?.length ?? 0)) return true
  return collisions[row][col] === 1
}

/**
 * Walk the straight line from (x1,y1) → (x2,y2) in 0.8% steps.
 * Returns true only if every point is walkable.
 */
export function pathClear(x1: number, y1: number, x2: number, y2: number): boolean {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return true
  const steps = Math.ceil(len / 0.8)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    if (isColliding(x1 + dx * t, y1 + dy * t)) return false
  }
  return true
}

/**
 * Pick a nearby walkable point with a clear straight-line path from (cx, cy).
 * Tries 120 random directions before falling back to staying put.
 */
export function pickWaypoint(cx: number, cy: number): { x: number; y: number } {
  for (let attempt = 0; attempt < 120; attempt++) {
    const angle = Math.random() * Math.PI * 2
    const dist  = 4 + Math.random() * MAX_WANDER_DIST
    const x = Math.min(96, Math.max(4, cx + Math.cos(angle) * dist))
    const y = Math.min(96, Math.max(4, cy + Math.sin(angle) * dist))
    if (!isColliding(x, y) && pathClear(cx, cy, x, y)) return { x, y }
  }
  return { x: cx, y: cy }
}

/** Random walkable spawn point inside a room zone. */
export function randomInRoom(room: Room): { x: number; y: number } {
  for (let attempt = 0; attempt < 50; attempt++) {
    const x = room.zone.x + ROOM_MARGIN + Math.random() * (room.zone.w - ROOM_MARGIN * 2)
    const y = room.zone.y + ROOM_MARGIN + Math.random() * (room.zone.h - ROOM_MARGIN * 2)
    if (!isColliding(x, y)) return { x, y }
  }
  return { x: room.cx, y: room.cy }
}
