import { TargetCanvas } from './TargetCanvas'
import { ZONE_META } from './utils'
import { GameRecommendations } from '@/components/GameRecommendations'
import { computeStats, type PerformanceEntry } from '@/lib/performance'
import type { ArrowShot } from './types'
import './ArcheryArena.css'

interface ResultsScreenProps {
  shots:          ArrowShot[]
  totalScore:     number
  correctCount:   number
  totalQuestions: number
  sessionEntries?: PerformanceEntry[]
  onPlayAgain:    () => void
  onExit:         () => void
}

/**
 * Final results screen.
 * Shows the grouping on the target, a per-arrow breakdown, and total score.
 */
export function ResultsScreen({
  shots,
  totalScore,
  correctCount,
  totalQuestions,
  sessionEntries,
  onPlayAgain,
  onExit,
}: ResultsScreenProps) {
  const maxScore = shots.length * 10
  const sessionStats = sessionEntries ? computeStats(sessionEntries) : undefined

  // Simple grade based on ratio
  function getGrade() {
    const ratio = totalScore / (maxScore || 1)
    if (ratio >= 0.9) return { label: 'Robin Hood', emoji: '🏆' }
    if (ratio >= 0.7) return { label: 'Skilled Archer', emoji: '⭐' }
    if (ratio >= 0.5) return { label: 'Apprentice', emoji: '🎯' }
    return { label: 'Keep Practising', emoji: '💪' }
  }

  const grade = getGrade()

  return (
    <div className="aa-shell aa-shell-center">
      <div className="aa-header">
        <button onClick={onExit} className="aa-btn aa-btn-ghost px-4 py-2 text-sm font-sketch">
          ← Menu
        </button>
        <h2 className="aa-heading aa-heading-center aa-heading-small font-sketch">📊 Final Results</h2>
        <div className="w-[86px]" />
      </div>

      <div className="aa-panel aa-grade-banner">
        <p className="aa-grade-title font-sketch">{grade.emoji} {grade.label}</p>
      </div>

      <div className="aa-results-row">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <TargetCanvas shots={shots} />
          <p className="aa-caption aa-caption-center font-sketch">Your grouping</p>
        </div>

        <div className="aa-panel aa-results-card">
          <h3 className="aa-results-heading font-sketch">
            Arrow Breakdown
          </h3>

          <div className="aa-results-list font-sketch">
            {shots.map((shot, i) => {
              const meta = ZONE_META[shot.zone]
              return (
                <div
                  key={i}
                  className="aa-result-row"
                >
                  <span className="aa-result-label">Arrow {i + 1}</span>
                  <span style={{ color: meta.color }}>{meta.emoji} {meta.label}</span>
                  <span className="aa-result-score">+{shot.score} pts</span>
                </div>
              )
            })}
          </div>

          <div className="aa-total-row font-sketch">
            <span>Total</span>
            <span>{totalScore} / {maxScore} pts</span>
          </div>

          <p className="aa-caption aa-caption-center font-sketch mt-4">
            Quiz: {correctCount} / {totalQuestions} correct
          </p>
        </div>
      </div>

      <GameRecommendations sessionStats={sessionStats} />

      <div className="aa-action-row">
        <button onClick={onPlayAgain} className="aa-btn aa-btn-primary px-8 py-3 font-sketch text-lg">
          🔄 Play Again
        </button>
        <button onClick={onExit} className="aa-btn aa-btn-ghost px-8 py-3 font-sketch text-lg">
          ← Menu
        </button>
      </div>
    </div>
  )
}
