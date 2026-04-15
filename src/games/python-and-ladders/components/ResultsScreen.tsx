import type { Player, GameMode } from '../types'
import type { CategoryStats } from '@/lib/performance'
import { GameRecommendations } from '@/components/GameRecommendations'

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
    <div className="w-full max-w-md mx-auto space-y-6 text-center py-4">
      {/* Trophy / Result */}
      <div className="space-y-2">
        <div className="text-5xl">{p1Won ? '🏆' : vsBot ? '😤' : '🎉'}</div>
        <h2 className="text-2xl font-bold text-slate-800">
          {p1Won
            ? vsBot ? 'You Won!' : `${winnerName} Wins!`
            : vsBot ? 'PyBot Wins!' : `${winnerName} Wins!`
          }
        </h2>
        <p className="text-sm text-slate-500">
          {p1Won && vsBot && 'Your Python knowledge carried you to the top!'}
          {!p1Won && vsBot && 'PyBot slithered to the finish first. Try again!'}
          {!vsBot && `${winnerName} reached cell 36 first. Great game!`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border-2 border-slate-200 p-3">
          <div className="text-2xl font-bold text-blue-600">{correctCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Correct</div>
        </div>
        <div className="bg-white rounded-xl border-2 border-slate-200 p-3">
          <div className="text-2xl font-bold text-slate-700">{questionCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Questions</div>
        </div>
        <div className="bg-white rounded-xl border-2 border-slate-200 p-3">
          <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Accuracy</div>
        </div>
      </div>

      {/* Final positions */}
      <div className="flex justify-center gap-6 text-sm text-slate-600">
        <span>{p1.emoji} {p1.name}: cell {p1.position}</span>
        <span>{p2.emoji} {p2.name}: cell {p2.position}</span>
      </div>

      <GameRecommendations sessionStats={sessionStats} pinnedCategory="python" />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onExit}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Exit
        </button>
        <button
          onClick={onPlayAgain}
          className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
