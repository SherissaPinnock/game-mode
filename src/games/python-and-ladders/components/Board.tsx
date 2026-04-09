import type { Player, SnakeOrLadder } from '../types'
import { GRID_COLS, GRID_ROWS, BOARD_SIZE } from '../data/board'
import { Cell } from './Cell'
import { BoardOverlay } from './BoardOverlay'

interface BoardProps {
  players: Player[]
  highlightedCell: number | null
  activeSlide: SnakeOrLadder | null
  isDark: boolean
}

export function Board({ players, highlightedCell, activeSlide, isDark }: BoardProps) {
  const rows: number[][] = []
  for (let row = GRID_ROWS - 1; row >= 0; row--) {
    const cells: number[] = []
    for (let col = 0; col < GRID_COLS; col++) {
      const actualCol = row % 2 === 0 ? col : GRID_COLS - 1 - col
      const cellNum = row * GRID_COLS + actualCol + 1
      cells.push(cellNum)
    }
    rows.push(cells)
  }

  const finishLabel = isDark
    ? 'text-rose-400 bg-rose-500/20 border border-rose-500/30'
    : 'text-rose-600 bg-rose-100 border border-rose-300'

  const startLabel = isDark
    ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30'
    : 'text-emerald-600 bg-emerald-100 border border-emerald-300'

  const boardWrap = isDark
    ? 'bg-slate-900/40 border border-white/[0.07] rounded-xl p-2 shadow-2xl'
    : 'bg-white border border-slate-200 rounded-xl p-2 shadow-lg'

  return (
    <div className="w-full max-w-[360px] lg:max-w-[520px] mx-auto">
      <div className="flex justify-start mb-1.5">
        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${finishLabel}`}>
          Finish {BOARD_SIZE}
        </span>
      </div>

      <div className={`relative ${boardWrap}`}>
        <div className="grid grid-rows-6 gap-1">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-6 gap-1">
              {row.map(cellNum => (
                <Cell
                  key={cellNum}
                  cellNumber={cellNum}
                  players={players}
                  isHighlighted={highlightedCell === cellNum}
                  activeSlide={activeSlide}
                  isDark={isDark}
                />
              ))}
            </div>
          ))}
        </div>
        <BoardOverlay activeSlide={activeSlide} />
      </div>

      <div className="flex justify-start mt-1.5">
        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${startLabel}`}>
          Start
        </span>
      </div>
    </div>
  )
}
