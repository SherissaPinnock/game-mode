import type { PartyGoerState, ServerId } from './types'

const EASY_CHALLENGES: Record<ServerId, string[]> = {
  1: ['1', '2-1', '3-2', '4-3'],
  2: ['2', '1+1', '3-1', '4-2'],
  3: ['3', '1+2', '4-1', '5-2'],
}

const MEDIUM_CHALLENGES: Record<ServerId, string[]> = {
  1: ['(2+1)-2', '(4-1)-2', '(3+2)-4', '6-(2+3)'],
  2: ['(2+1)-1', '(4-1)-1', '(1+3)-2', '6-(1+3)'],
  3: ['(2+2)-1', '(5-1)-1', '(1+4)-2', '6-(1+2)'],
}

const HARD_CHALLENGES: Record<ServerId, string[]> = {
  1: ['(2*2)-3', '(3*2)-5', '(8/2)-3', '(5+1)-5'],
  2: ['(2*2)-2', '(3*2)-4', '(8/2)-2', '(5+1)-4'],
  3: ['(2*2)-1', '(3*2)-3', '(8/2)-1', '(5+1)-3'],
}

const LANE_POSITIONS = [68.6, 74.4, 80.2]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function getStageProgress(elapsedMs: number, durationMs: number) {
  return clamp(elapsedMs / durationMs, 0, 1)
}

export function getSpawnIntervalMs(elapsedMs: number, durationMs: number) {
  const progress = getStageProgress(elapsedMs, durationMs)
  return 2_250 - (1_420 * Math.pow(progress, 0.9))
}

export function getServerProcessingRate(elapsedMs: number, durationMs: number) {
  const progress = getStageProgress(elapsedMs, durationMs)
  return 0.36 - (0.18 * progress)
}

export function getCrashDurationMs(elapsedMs: number, durationMs: number) {
  const progress = getStageProgress(elapsedMs, durationMs)
  return 2_900 + (2_400 * progress)
}

export function getOverloadGraceMs(elapsedMs: number, durationMs: number) {
  const progress = getStageProgress(elapsedMs, durationMs)
  return 1_900 - (700 * progress)
}

function buildPrompt(answer: ServerId, progress: number) {
  if (progress < 0.34) return pickRandom(EASY_CHALLENGES[answer])
  if (progress < 0.7) return pickRandom(MEDIUM_CHALLENGES[answer])
  return pickRandom(HARD_CHALLENGES[answer])
}

export function createPartyGoer(nextId: number, elapsedMs: number, durationMs: number, spriteCount: number): PartyGoerState {
  const progress = getStageProgress(elapsedMs, durationMs)
  const answer = (1 + Math.floor(Math.random() * 3)) as ServerId
  const spriteIndex = spriteCount > 0 ? Math.floor(Math.random() * spriteCount) : 0
  const laneY = pickRandom(LANE_POSITIONS) + ((Math.random() - 0.5) * 1.1)

  return {
    id: nextId,
    x: -14 - (Math.random() * 8),
    laneY,
    speed: 7.8 + (progress * 4.4) + (Math.random() * 2.4),
    spriteIndex,
    prompt: buildPrompt(answer, progress),
    answer,
    wobble: Math.random() * Math.PI * 2,
  }
}
