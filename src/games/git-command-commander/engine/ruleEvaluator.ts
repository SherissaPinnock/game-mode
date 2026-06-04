import type { LevelConfig, LevelState } from '../types/game.types'

export interface EvaluationResult {
  won: boolean
  failed: boolean
  failMessage?: string
  failEmoji?: string
  unmetWinConditions: string[]
}

export function evaluateRules(state: LevelState, level: LevelConfig): EvaluationResult {
  const failResult = level.failConditions.find(fc => fc.check(state))
  if (failResult) {
    return {
      won: false,
      failed: true,
      failMessage: failResult.message,
      failEmoji: failResult.emoji,
      unmetWinConditions: [],
    }
  }

  if (state.failState) {
    return {
      won: false,
      failed: true,
      failMessage: state.failReason ?? 'Something went wrong.',
      failEmoji: '💥',
      unmetWinConditions: [],
    }
  }

  const unmet = level.winConditions.filter(wc => !wc.check(state)).map(wc => wc.label)
  const won = unmet.length === 0

  return { won, failed: false, unmetWinConditions: unmet }
}
