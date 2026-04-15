import type { Player, SnakeOrLadder } from '../types'
import { SNAKES_AND_LADDERS } from '../data/board'

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

  // Checkerboard alternation for visual rhythm
  const checkerDark  = cellNumber % 2 === 0 ? 'border-white/[0.07] bg-slate-800/50' : 'border-white/[0.04] bg-slate-900/40'
  const checkerLight = cellNumber % 2 === 0 ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'

  let cellClass: string
  if (isHighlighted) {
    cellClass = isDark
      ? 'border-cyan-400 bg-cyan-500/25 shadow-md shadow-cyan-400/40 scale-105 z-10'
      : 'border-violet-500 bg-violet-100 shadow-md shadow-violet-300/50 scale-105 z-10'
  } else if (isSliding) {
    cellClass = isDark ? 'border-amber-400 bg-amber-500/20' : 'border-amber-400 bg-amber-100'
  } else if (isSnakeHead) {
    cellClass = isDark ? 'border-rose-500/60 bg-rose-900/35' : 'border-rose-400 bg-rose-100'
  } else if (isLadderBottom) {
    cellClass = isDark ? 'border-emerald-500/60 bg-emerald-900/35' : 'border-emerald-400 bg-emerald-100'
  } else {
    cellClass = isDark ? checkerDark : checkerLight
  }

  const numColor      = isDark ? 'text-slate-600' : 'text-slate-400'
  const snakeColor    = isDark ? 'text-rose-400' : 'text-rose-500'
  const ladderColor   = isDark ? 'text-emerald-400' : 'text-emerald-600'
  const destColor     = isSnakeHead ? snakeColor : ladderColor

  return (
    <div className={`relative flex items-center justify-center rounded-lg border aspect-square text-xs transition-all duration-300 ${cellClass}`}>
      <span className={`absolute top-0.5 left-1 text-[10px] font-medium ${numColor}`}>
        {cellNumber}
      </span>

      {isSnakeHead && (
        <div className="absolute top-0.5 right-1 text-[10px]" title={`Snake → ${snakeOrLadder.to}`}>🐍</div>
      )}
      {isLadderBottom && (
        <div className="absolute top-0.5 right-1 text-[10px]" title={`Ladder → ${snakeOrLadder.to}`}>🪜</div>
      )}
      {snakeOrLadder && (
        <span className={`absolute bottom-0.5 text-[8px] font-bold ${destColor}`}>
          →{snakeOrLadder.to}
        </span>
      )}

      <div className="relative z-20 flex gap-0.5 items-center justify-center">
        {playersHere.map(p => (
          <span
            key={p.id}
            className="text-2xl sm:text-3xl drop-shadow-lg animate-bounce-subtle leading-none"
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
