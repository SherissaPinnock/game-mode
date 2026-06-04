import { useReducer } from 'react'
import { processAction } from '../engine/actionProcessor'
import { evaluateRules } from '../engine/ruleEvaluator'
import { loadLevel, getLevelCount } from '../engine/levelLoader'
import { LEVELS } from '../data/levels'
import type { GameState, LevelState } from '../types/game.types'

type GameAction =
  | { type: 'START_GAME' }
  | { type: 'START_LEVEL'; levelIndex: number }
  | { type: 'EXECUTE_ACTION'; actionId: string; input?: string }
  | { type: 'DISMISS_FAIL' }
  | { type: 'COMPLETE_LEVEL' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'GO_TO_ROADMAP' }
  | { type: 'SET_ANIMATION'; hint: string | null }
  | { type: 'UPDATE_DRAFT'; field: keyof LevelState; value: unknown }

function initialState(): GameState {
  return {
    phase: 'intro',
    currentLevelIndex: 0,
    completedLevels: [],
    tutorialSeen: false,
    levelState: null,
    pendingAction: null,
    animationHint: null,
  }
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, phase: 'roadmap' }

    case 'START_LEVEL': {
      const loaded = loadLevel(action.levelIndex)
      if (!loaded) return state
      return {
        ...state,
        phase: 'playing',
        currentLevelIndex: action.levelIndex,
        levelState: loaded.state,
        animationHint: null,
      }
    }

    case 'EXECUTE_ACTION': {
      if (!state.levelState) return state
      const level = LEVELS[state.currentLevelIndex]
      if (!level) return state

      const { newState, animationHint } = processAction(action.actionId, state.levelState, action.input)
      const evaluation = evaluateRules(newState, level)

      if (evaluation.failed) {
        return {
          ...state,
          levelState: { ...newState, failState: true, failReason: evaluation.failMessage },
          animationHint: 'shake',
        }
      }

      if (evaluation.won) {
        return {
          ...state,
          levelState: newState,
          animationHint: 'celebrate',
          phase: 'summary',
        }
      }

      return { ...state, levelState: newState, animationHint }
    }

    case 'DISMISS_FAIL': {
      const loaded = loadLevel(state.currentLevelIndex)
      if (!loaded) return state
      return {
        ...state,
        levelState: loaded.state,
        animationHint: null,
      }
    }

    case 'COMPLETE_LEVEL': {
      const next = [...state.completedLevels]
      if (!next.includes(state.currentLevelIndex)) {
        next.push(state.currentLevelIndex)
      }
      const isLast = state.currentLevelIndex >= getLevelCount() - 1
      return {
        ...state,
        completedLevels: next,
        phase: isLast ? 'complete' : 'roadmap',
      }
    }

    case 'GO_TO_ROADMAP':
      return { ...state, phase: 'roadmap', levelState: null }

    case 'SET_ANIMATION':
      return { ...state, animationHint: action.hint }

    case 'UPDATE_DRAFT': {
      if (!state.levelState) return state
      return {
        ...state,
        levelState: { ...state.levelState, [action.field]: action.value },
      }
    }

    default:
      return state
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  function startGame() {
    dispatch({ type: 'START_GAME' })
  }

  function startLevel(idx: number) {
    dispatch({ type: 'START_LEVEL', levelIndex: idx })
  }

  function executeAction(actionId: string, input?: string) {
    dispatch({ type: 'EXECUTE_ACTION', actionId, input })
  }

  function dismissFail() {
    dispatch({ type: 'DISMISS_FAIL' })
  }

  function completeLevel() {
    dispatch({ type: 'COMPLETE_LEVEL' })
  }

  function goToRoadmap() {
    dispatch({ type: 'GO_TO_ROADMAP' })
  }

  function clearAnimation() {
    dispatch({ type: 'SET_ANIMATION', hint: null })
  }

  function updateDraft(field: keyof LevelState, value: unknown) {
    dispatch({ type: 'UPDATE_DRAFT', field, value })
  }

  return {
    state,
    startGame,
    startLevel,
    executeAction,
    dismissFail,
    completeLevel,
    goToRoadmap,
    clearAnimation,
    updateDraft,
  }
}
