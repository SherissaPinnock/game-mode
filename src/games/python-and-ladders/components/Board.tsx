import type { Player, SnakeOrLadder } from '../types'
import { GRID_COLS, GRID_ROWS, BOARD_SIZE } from '../data/board'
import { Cell } from './Cell'
import { BoardOverlay } from './BoardOverlay'

interface BoardProps {
  players: Player[]
  highlightedCell: number | null
  activeSlide: SnakeOrLadder | null
}

/**
 * Renders the 6x6 board grid with boustrophedon numbering
 * and an SVG overlay for snakes & ladders stretched across cells.
 */
export function Board({ players, highlightedCell, activeSlide }: BoardProps) {
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

  return (
    <div className="w-full max-w-[360px] lg:max-w-[520px] mx-auto">
      {/* Finish label */}
      <div className="flex justify-start mb-1.5">
        <span className="text-[10px] uppercase tracking-widest font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
          Finish {BOARD_SIZE}
        </span>
      </div>

      {/* Board with SVG overlay */}
      <div className="relative">
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
                />
              ))}
            </div>
          ))}
        </div>

        {/* SVG snakes & ladders overlay */}
        <BoardOverlay activeSlide={activeSlide} />
      </div>

      {/* Start label */}
      <div className="flex justify-start mt-1.5">
        <span className="text-[10px] uppercase tracking-widest font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
          Start
        </span>
      </div>
    </div>
  )
}
