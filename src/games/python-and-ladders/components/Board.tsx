import type { Player, SnakeOrLadder } from '../types'
import { GRID_COLS, GRID_ROWS, BOARD_SIZE } from '../data/board'
import { Cell } from './Cell'
import { BoardOverlay } from './BoardOverlay'
import '../PythonAndLadders.css'

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

  const boardTone = isDark ? 'opacity-95' : ''

  return (
    <div className="w-full max-w-[360px] lg:max-w-[520px] mx-auto">
      <div className="flex justify-start mb-1.5">
        <span className="pal-board-badge">
          Finish {BOARD_SIZE}
        </span>
      </div>

      <div className={`pal-board-wrap ${boardTone}`}>
        <div className="pal-board-grid grid grid-rows-6 gap-1">
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
        <span className="pal-board-badge">
          Start
        </span>
      </div>
    </div>
  )
}
