import { TargetCanvas } from './TargetCanvas'
import { ZONE_META } from './utils'
import type { ArrowShot } from './types'

interface ResultsScreenProps {
  shots:          ArrowShot[]
  totalScore:     number
  correctCount:   number
  totalQuestions: number
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
  onPlayAgain,
  onExit,
}: ResultsScreenProps) {
  const maxScore = shots.length * 10

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
    <div className="sketch-bg flex flex-1 flex-col items-center px-4 py-6 sm:px-6 sm:py-12 gap-4 sm:gap-8 min-h-screen">

      <div className="w-full max-w-3xl flex items-center justify-between">
        <button onClick={onExit} className="sketch-btn px-4 py-2 text-sm font-sketch">
          ← Menu
        </button>
        <h2 className="font-sketch text-3xl text-[#2d2d2d]">📊 Final Results</h2>
        <div /> {/* spacer */}
      </div>

      {/* Grade banner */}
      <div className="sketch-card px-8 py-4 text-center">
        <p className="font-sketch text-4xl">{grade.emoji} {grade.label}</p>
      </div>

      {/* Target + breakdown side by side */}
      <div className="w-full max-w-3xl flex flex-col sm:flex-row gap-4 sm:gap-8 items-center sm:items-start justify-center">

        {/* Target with all arrows */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <TargetCanvas shots={shots} />
          <p className="font-sketch text-sm text-[#9ca3af]">Your grouping</p>
        </div>

        {/* Score breakdown card */}
        <div className="sketch-card p-6 flex-1 flex flex-col gap-4">
          <h3 className="font-sketch text-xl text-[#2d2d2d] pb-3"
              style={{ borderBottom: '2px dashed #2d2d2d' }}>
            Arrow Breakdown
          </h3>

          <div className="flex flex-col gap-2">
            {shots.map((shot, i) => {
              const meta = ZONE_META[shot.zone]
              return (
                <div
                  key={i}
                  className="flex items-center justify-between font-sketch text-base gap-2"
                >
                  <span className="text-[#6b7280]">Arrow {i + 1}</span>
                  <span style={{ color: meta.color }}>{meta.emoji} {meta.label}</span>
                  <span className="font-bold text-[#2d2d2d]">+{shot.score} pts</span>
                </div>
              )
            })}
          </div>

          {/* Total */}
          <div
            className="flex items-center justify-between font-sketch text-xl font-bold pt-3"
            style={{ borderTop: '2px solid #2d2d2d' }}
          >
            <span>Total</span>
            <span>{totalScore} / {maxScore} pts</span>
          </div>

          <p className="font-sketch text-sm text-[#9ca3af] text-center">
            Quiz: {correctCount} / {totalQuestions} correct
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={onPlayAgain} className="sketch-btn px-8 py-3 font-sketch text-lg font-bold">
          🔄 Play Again
        </button>
        <button onClick={onExit} className="sketch-btn px-8 py-3 font-sketch text-lg">
          ← Menu
        </button>
      </div>
    </div>
  )
}
