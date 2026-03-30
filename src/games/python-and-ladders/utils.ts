import { BOARD_SIZE } from './data/board'

/** Roll a die returning 1-6. */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}

/** Bot answers correctly ~55% of the time. */
export function botAnswersCorrectly(): boolean {
  return Math.random() < 0.55
}

/** Clamp position to board bounds. Must land exactly on final cell. */
export function clampPosition(current: number, roll: number): number {
  const next = current + roll
  if (next > BOARD_SIZE) return current // must land exactly
  return next
}

/** Check if someone has won. */
export function hasWon(position: number): boolean {
  return position >= BOARD_SIZE
}
