import type { Player, GameMode } from '../types'
import type { CategoryStats } from '@/lib/performance'
import { GameRecommendations } from '@/components/GameRecommendations'
import '../PythonAndLadders.css'

interface ResultsScreenProps {
  winner: 'p1' | 'p2'
  winnerName: string
  p1: Player
  p2: Player
  gameMode: GameMode
  questionCount: number
  correctCount: number
  sessionStats?: CategoryStats[]
  onPlayAgain: () => void
  onExit: () => void
}

export function ResultsScreen({
  winner,
  winnerName,
  p1,
  p2,
  gameMode,
  questionCount,
  correctCount,
  sessionStats,
  onPlayAgain,
  onExit,
}: ResultsScreenProps) {
  const accuracy = questionCount > 0 ? Math.round((correctCount / questionCount) * 100) : 0
  const p1Won = winner === 'p1'
  const vsBot = gameMode === 'vs-bot'

  return (
    <div className="pal-results-card w-full mx-auto space-y-6">
      <div className="space-y-2">
        <div className="text-5xl">{p1Won ? '🏆' : vsBot ? '😤' : '🎉'}</div>
        <div className="pal-kicker">Match Complete</div>
        <h2 className="pal-title text-2xl">
          {p1Won
            ? vsBot ? 'You Won!' : `${winnerName} Wins!`
            : vsBot ? 'PyBot Wins!' : `${winnerName} Wins!`
          }
        </h2>
        <p className="pal-body-copy text-sm">
          {p1Won && vsBot && 'Your Python knowledge carried you to the top!'}
          {!p1Won && vsBot && 'PyBot slithered to the finish first. Try again!'}
          {!vsBot && `${winnerName} reached cell 36 first. Great game!`}
        </p>
      </div>

      <div className="pal-results-grid">
        <div className="pal-stat-card">
          <div className="pal-stat-value text-[#355c46]">{correctCount}</div>
          <div className="pal-stat-label">Correct</div>
        </div>
        <div className="pal-stat-card">
          <div className="pal-stat-value">{questionCount}</div>
          <div className="pal-stat-label">Questions</div>
        </div>
        <div className="pal-stat-card">
          <div className="pal-stat-value text-[#4d3821]">{accuracy}%</div>
          <div className="pal-stat-label">Accuracy</div>
        </div>
      </div>

      <div className="pal-position-row text-sm">
        <span>{p1.emoji} {p1.name}: cell {p1.position}</span>
        <span>{p2.emoji} {p2.name}: cell {p2.position}</span>
      </div>

      <GameRecommendations sessionStats={sessionStats} pinnedCategory="python" />

      <div className="pal-actions pt-2">
        <button
          onClick={onExit}
          className="pal-btn pal-btn-ghost flex-1 px-4 py-3 text-sm"
        >
          Exit
        </button>
        <button
          onClick={onPlayAgain}
          className="pal-btn pal-btn-primary flex-1 px-4 py-3 text-sm"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
