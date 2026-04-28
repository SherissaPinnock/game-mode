import type { Player, SnakeOrLadder } from '../types'
import { SNAKES_AND_LADDERS } from '../data/board'
import '../PythonAndLadders.css'

interface CellProps {
  cellNumber: number
  players: Player[]
  isHighlighted: boolean
  activeSlide: SnakeOrLadder | null
  isDark: boolean
}

export function Cell({ cellNumber, players, isHighlighted, activeSlide, isDark }: CellProps) {
  const playersHere   = players.filter(p => p.position === cellNumber)
  const snakeOrLadder = SNAKES_AND_LADDERS.find(sl => sl.from === cellNumber)
  const isSnakeHead   = snakeOrLadder?.type === 'snake'
  const isLadderBottom = snakeOrLadder?.type === 'ladder'
  const isSliding     = activeSlide?.from === cellNumber || activeSlide?.to === cellNumber

  let cellClass: string
  if (isHighlighted) {
    cellClass = 'pal-cell-highlighted'
  } else if (isSliding) {
    cellClass = 'pal-cell-sliding'
  } else if (isSnakeHead) {
    cellClass = 'pal-cell-snake'
  } else if (isLadderBottom) {
    cellClass = 'pal-cell-ladder'
  } else {
    cellClass = cellNumber % 2 === 0 ? 'pal-cell-even' : 'pal-cell-odd'
  }
  const darkTone = isDark ? 'opacity-95' : ''

  return (
    <div className={`pal-cell ${cellClass} ${darkTone}`}>
      <span className="pal-cell-number">
        {cellNumber}
      </span>

      {isSnakeHead && (
        <div className="pal-cell-corner" title={`Snake → ${snakeOrLadder.to}`}>🐍</div>
      )}
      {isLadderBottom && (
        <div className="pal-cell-corner" title={`Ladder → ${snakeOrLadder.to}`}>🪜</div>
      )}
      {snakeOrLadder && (
        <span className={`pal-cell-destination ${isSnakeHead ? 'is-snake' : 'is-ladder'}`}>
          →{snakeOrLadder.to}
        </span>
      )}

      <div className="relative z-20 flex gap-0.5 items-center justify-center">
        {playersHere.map(p => (
          <span
            key={p.id}
            className="pal-token text-2xl sm:text-3xl animate-bounce-subtle"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
            title={p.name}
          >
            {p.emoji}
          </span>
        ))}
      </div>
    </div>
  )
}
