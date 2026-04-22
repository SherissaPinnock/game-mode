import './ArcheryArena.css'

interface ArrowSummaryProps {
  correctCount: number
  totalQuestions: number
  onStartArchery: () => void
  onExit: () => void
}

/**
 * Transition screen between the quiz and the archery range.
 * Shows how many correct answers were earned, then how many arrows that translates to.
 * Players always get at least 1 arrow even with 0 correct.
 */
export function ArrowSummary({ correctCount, totalQuestions, onStartArchery, onExit }: ArrowSummaryProps) {
  // Consolation: always at least 1 arrow so every player gets to shoot
  const arrowCount = Math.max(1, correctCount)
  const isConsolation = correctCount === 0

  return (
    <div className="aa-shell aa-shell-center aa-shell-tall">
      <div className="aa-panel aa-summary-card">
        <h2 className="aa-heading aa-heading-large font-sketch">Quiz Complete!</h2>

        <p className="aa-summary-copy font-sketch text-xl">
          You got{' '}
          <span className="aa-summary-score">{correctCount}</span>
          {' '}out of{' '}
          <span className="aa-summary-total">{totalQuestions}</span> correct
        </p>

        <div className="aa-divider" />

        <div className="aa-summary-stack">
          <p className="aa-summary-copy font-sketch text-lg">
            {isConsolation
              ? "No worries — you still get 1 consolation arrow!"
              : `You've earned ${arrowCount} arrow${arrowCount !== 1 ? 's' : ''}!`}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({ length: arrowCount }, (_, i) => (
              <span key={i} className="text-4xl">🏹</span>
            ))}
          </div>
        </div>

        <button
          onClick={onStartArchery}
          className="aa-btn aa-btn-primary aa-btn-wide font-sketch text-2xl"
        >
          🎯 Head to the Range!
        </button>

        <button
          onClick={onExit}
          className="aa-link-btn font-sketch text-sm"
        >
          Return to menu
        </button>
      </div>
    </div>
  )
}
