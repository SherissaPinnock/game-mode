import { describe, expect, it } from 'vitest'

import { THREAD_STAGES } from '@/games/thread/data/stages'
import { compareReplayToGhost, simulateStage } from '@/games/thread/engine'

describe('thread engine', () => {
  it('keeps immediate sleep from consuming later grouped movement in the nap stage', () => {
    const stage = THREAD_STAGES.find(item => item.id === 'the-nap')
    expect(stage).toBeTruthy()
    if (!stage) return

    const ghost = simulateStage(stage, stage.ghostProgram)
    const attempt = simulateStage(stage, [
      { id: 'test-a-start', threadId: 'threadA', kind: 'start' },
      { id: 'test-a-sleep', threadId: 'threadA', kind: 'sleep', durationMs: 960 },
      { id: 'test-b-start', threadId: 'threadB', kind: 'start' },
      { id: 'test-b-move', threadId: 'threadB', kind: 'move', direction: 'left', steps: 5 },
      { id: 'test-a-move', threadId: 'threadA', kind: 'move', direction: 'right', steps: 4 },
    ])
    const comparison = compareReplayToGhost(stage, ghost, attempt)

    expect({
      ghostSuccess: ghost.success,
      attemptSuccess: attempt.success,
      comparison,
      attemptFailure: attempt.failureReason,
      attemptSummary: attempt.summary,
    }).toEqual({
      ghostSuccess: true,
      attemptSuccess: true,
      comparison: { matches: true, reason: 'Perfect sync.' },
      attemptFailure: undefined,
      attemptSummary: 'Matched the ghost choreography.',
    })
  })

  it('treats grouped movement as a full route in relay race', () => {
    const stage = THREAD_STAGES.find(item => item.id === 'relay-race')
    expect(stage).toBeTruthy()
    if (!stage) return

    const result = simulateStage(stage, stage.ghostProgram)

    expect({
      success: result.success,
      summary: result.summary,
      failureReason: result.failureReason,
    }).toEqual({
      success: true,
      summary: 'Matched the ghost choreography.',
      failureReason: undefined,
    })
  })
})
