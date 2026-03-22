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
    <div className="sketch-bg flex flex-1 flex-col items-center justify-center px-6 py-16 min-h-screen">
      <div className="sketch-card p-10 max-w-md w-full flex flex-col items-center gap-6 text-center">

        <h2 className="font-sketch text-4xl text-[#2d2d2d]">Quiz Complete!</h2>

        {/* Score */}
        <p className="font-sketch text-xl text-[#6b7280]">
          You got{' '}
          <span className="text-[#2d2d2d] font-bold text-4xl">{correctCount}</span>
          {' '}out of{' '}
          <span className="font-bold">{totalQuestions}</span> correct
        </p>

        {/* Divider */}
        <div className="w-full border-t-2 border-dashed border-[#2d2d2d]" />

        {/* Arrow reward */}
        <div className="flex flex-col items-center gap-3">
          <p className="font-sketch text-lg text-[#6b7280]">
            {isConsolation
              ? "No worries — you still get 1 consolation arrow!"
              : `You've earned ${arrowCount} arrow${arrowCount !== 1 ? 's' : ''}!`}
          </p>
          {/* Arrow icons */}
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({ length: arrowCount }, (_, i) => (
              <span key={i} className="text-4xl">🏹</span>
            ))}
          </div>
        </div>

        <button
          onClick={onStartArchery}
          className="sketch-btn w-full py-4 font-sketch text-2xl font-bold"
        >
          🎯 Head to the Range!
        </button>

        <button
          onClick={onExit}
          className="font-sketch text-sm text-[#9ca3af] underline hover:text-[#2d2d2d]"
        >
          Return to menu
        </button>
      </div>
    </div>
  )
}
