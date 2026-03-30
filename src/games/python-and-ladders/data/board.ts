import type { SnakeOrLadder } from '../types'

export const BOARD_SIZE = 36
export const GRID_COLS = 6
export const GRID_ROWS = 6

/**
 * Snakes: head (higher) -> tail (lower). Landing on head slides you down.
 * Ladders: bottom (lower) -> top (higher). Landing on bottom climbs you up.
 * Varying lengths for gameplay variety.
 */
export const SNAKES_AND_LADDERS: SnakeOrLadder[] = [
  // Snakes (descend)
  { from: 35, to: 22, type: 'snake' },   // long  (-13)
  { from: 29, to: 16, type: 'snake' },   // medium (-13)
  { from: 21, to: 9,  type: 'snake' },   // long  (-12)
  { from: 17, to: 7,  type: 'snake' },   // medium (-10)

  // Ladders (ascend)
  { from: 3,  to: 15, type: 'ladder' },  // medium (+12)
  { from: 8,  to: 26, type: 'ladder' },  // long   (+18)
  { from: 11, to: 23, type: 'ladder' },  // medium (+12)
  { from: 20, to: 32, type: 'ladder' },  // medium (+12)
]

/**
 * Convert a 1-based cell number to { row, col } for the grid.
 * Board snakes from bottom-left: row 0 = bottom, col 0 = left.
 * Even rows go left-to-right, odd rows right-to-left (boustrophedon).
 */
export function cellToRowCol(cell: number): { row: number; col: number } {
  const index = cell - 1
  const row = Math.floor(index / GRID_COLS)
  const colRaw = index % GRID_COLS
  const col = row % 2 === 0 ? colRaw : GRID_COLS - 1 - colRaw
  return { row, col }
}

/** Check if landing on this cell triggers a snake or ladder. */
export function getSnakeOrLadder(cell: number): SnakeOrLadder | null {
  return SNAKES_AND_LADDERS.find(sl => sl.from === cell) ?? null
}
