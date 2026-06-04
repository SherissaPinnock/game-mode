import { LEVELS } from '../data/levels'
import type { LevelState, LevelConfig } from '../types/game.types'

export function loadLevel(levelIndex: number): { config: LevelConfig; state: LevelState } | null {
  const config = LEVELS[levelIndex]
  if (!config) return null

  const base: LevelState = {
    currentBranch: 'main',
    availableBranches: ['main'],
    workingDirectory: [],
    stagingArea: [],
    localRepo: [],
    remoteRepo: [],
    openPullRequests: [],
    conflictState: null,
    notifications: [],
    completedObjectives: [],
    actionHistory: [],
    failState: false,
    commitMessageDraft: '',
    branchNameDraft: '',
    prDraft: { title: '', description: '', reviewer: '' },
  }

  const state: LevelState = { ...base, ...config.startingState }

  return { config, state }
}

export function getLevelCount() {
  return LEVELS.length
}
