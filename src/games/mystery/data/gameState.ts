import { CLUE_UNLOCKS, ALL_CLUES_UNLOCK, MAIN_CLUE_IDS, type Clue } from './clues'

export interface GameState {
  unlockedRooms: string[]
  collectedClues: Clue[]
  /** Per-suspect dialogue stage: 0 = before evidence, 1+ = post-confrontation */
  suspectStage: Record<string, number>
}

export const INITIAL_GAME_STATE: GameState = {
  unlockedRooms: ['kitchen'],
  collectedClues: [],
  suspectStage: {},
}

export function applyClue(prev: GameState, clue: Clue): GameState {
  if (prev.collectedClues.find(c => c.id === clue.id)) return prev

  const newClues    = [...prev.collectedClues, clue]
  const newUnlocked = [...prev.unlockedRooms]
  const newStage    = { ...prev.suspectStage }

  // Unlock next room from the progression chain
  const directUnlock = CLUE_UNLOCKS[clue.id]
  if (directUnlock && !newUnlocked.includes(directUnlock)) {
    newUnlocked.push(directUnlock)
  }

  // If all main clues are now collected, unlock the crime scene
  const allCollected = MAIN_CLUE_IDS.every(id =>
    newClues.find(c => c.id === id)
  )
  if (allCollected && !newUnlocked.includes(ALL_CLUES_UNLOCK)) {
    newUnlocked.push(ALL_CLUES_UNLOCK)
  }

  // Advance suspect dialogue stage
  if (clue.suspectId) {
    newStage[clue.suspectId] = (newStage[clue.suspectId] ?? 0) + 1
  }

  return { unlockedRooms: newUnlocked, collectedClues: newClues, suspectStage: newStage }
}
