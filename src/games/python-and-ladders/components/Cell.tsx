import type { Player, SnakeOrLadder } from '../types'
import { SNAKES_AND_LADDERS } from '../data/board'

interface CellProps {
  cellNumber: number
  players: Player[]
  isHighlighted: boolean
  activeSlide: SnakeOrLadder | null
}

export function Cell({ cellNumber, players, isHighlighted, activeSlide }: CellProps) {
  const playersHere = players.filter(p => p.position === cellNumber)

  const snakeOrLadder = SNAKES_AND_LADDERS.find(sl => sl.from === cellNumber)
  const isSnakeHead = snakeOrLadder?.type === 'snake'
  const isLadderBottom = snakeOrLadder?.type === 'ladder'

  const isSliding = activeSlide?.from === cellNumber || activeSlide?.to === cellNumber

  return (
    <div
      className={`
        relative flex items-center justify-center rounded-lg border-2 aspect-square text-xs
        transition-all duration-300
        ${isHighlighted
          ? 'border-blue-400 bg-blue-50 shadow-md scale-105'
          : isSliding
            ? 'border-yellow-400 bg-yellow-50'
            : isSnakeHead
              ? 'border-red-200 bg-red-50/50'
              : isLadderBottom
                ? 'border-green-200 bg-green-50/50'
                : 'border-slate-200 bg-white'
        }
      `}
    >
      {/* Cell number */}
      <span className="absolute top-0.5 left-1 text-[10px] text-slate-400 font-medium">
        {cellNumber}
      </span>

      {/* Snake or Ladder indicator */}
      {isSnakeHead && (
        <div className="absolute top-0.5 right-1 text-[10px]" title={`Snake → ${snakeOrLadder.to}`}>
          🐍
        </div>
      )}
      {isLadderBottom && (
        <div className="absolute top-0.5 right-1 text-[10px]" title={`Ladder → ${snakeOrLadder.to}`}>
          🪜
        </div>
      )}

      {/* Destination label */}
      {snakeOrLadder && (
        <span className={`absolute bottom-0.5 text-[8px] font-medium ${
          isSnakeHead ? 'text-red-400' : 'text-green-500'
        }`}>
          →{snakeOrLadder.to}
        </span>
      )}

      {/* Player tokens */}
      <div className="relative z-20 flex gap-0.5">
        {playersHere.map(p => (
          <span
            key={p.id}
            className="text-base sm:text-lg drop-shadow-sm animate-bounce-subtle"
            title={p.name}
          >
            {p.emoji}
          </span>
        ))}
      </div>
    </div>
  )
}
