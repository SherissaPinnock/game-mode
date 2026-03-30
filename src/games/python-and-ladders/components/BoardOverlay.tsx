import { SNAKES_AND_LADDERS, GRID_COLS, GRID_ROWS, cellToRowCol } from '../data/board'
import type { SnakeOrLadder } from '../types'

interface BoardOverlayProps {
  activeSlide: SnakeOrLadder | null
}

/**
 * SVG overlay that draws snakes and ladders stretched across the board.
 * Positioned absolutely over the grid. Uses cellToRowCol to compute
 * cell centers as percentages.
 */
export function BoardOverlay({ activeSlide }: BoardOverlayProps) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Glow filter for active snake/ladder */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {SNAKES_AND_LADDERS.map((sl, i) => {
        const from = getCellCenter(sl.from)
        const to = getCellCenter(sl.to)
        const isActive = activeSlide?.from === sl.from

        if (sl.type === 'ladder') {
          return <Ladder key={i} from={from} to={to} isActive={isActive} />
        }
        return <Snake key={i} from={from} to={to} isActive={isActive} />
      })}
    </svg>
  )
}

/** Convert cell number to (x%, y%) center point in the SVG viewBox (0-100). */
function getCellCenter(cell: number): { x: number; y: number } {
  const { row, col } = cellToRowCol(cell)
  // row 0 = bottom of board, displayed at bottom. In SVG y=0 is top.
  const displayRow = GRID_ROWS - 1 - row
  const cellW = 100 / GRID_COLS
  const cellH = 100 / GRID_ROWS
  return {
    x: col * cellW + cellW / 2,
    y: displayRow * cellH + cellH / 2,
  }
}

// ─── Ladder Drawing ──────────────────────────────────────────────────────

function Ladder({ from, to, isActive }: { from: { x: number; y: number }; to: { x: number; y: number }; isActive: boolean }) {
  const railOffset = 2.5
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy)
  // Perpendicular unit vector
  const px = (-dy / len) * railOffset
  const py = (dx / len) * railOffset

  // Two rails
  const rail1 = { x1: from.x + px, y1: from.y + py, x2: to.x + px, y2: to.y + py }
  const rail2 = { x1: from.x - px, y1: from.y - py, x2: to.x - px, y2: to.y - py }

  // Rungs (evenly spaced)
  const rungCount = Math.max(2, Math.round(len / 12))
  const rungs = Array.from({ length: rungCount }, (_, i) => {
    const t = (i + 1) / (rungCount + 1)
    const cx = from.x + dx * t
    const cy = from.y + dy * t
    return {
      x1: cx + px, y1: cy + py,
      x2: cx - px, y2: cy - py,
    }
  })

  const color = isActive ? '#16a34a' : '#92400e'
  const opacity = isActive ? 1 : 0.7

  return (
    <g filter={isActive ? 'url(#glow)' : undefined} opacity={opacity}>
      {/* Rails */}
      <line {...rail1} stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line {...rail2} stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Rungs */}
      {rungs.map((r, i) => (
        <line key={i} {...r} stroke={color} strokeWidth="0.9" strokeLinecap="round" />
      ))}
    </g>
  )
}

// ─── Snake Drawing ───────────────────────────────────────────────────────

function Snake({ from, to, isActive }: { from: { x: number; y: number }; to: { x: number; y: number }; isActive: boolean }) {
  // Create a wavy path between head (from) and tail (to)
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Number of curves based on distance
  const curves = Math.max(2, Math.round(dist / 15))
  const amplitude = Math.min(6, dist * 0.15)

  // Perpendicular direction for wave
  const px = -dy / dist
  const py = dx / dist

  let d = `M ${from.x} ${from.y}`
  for (let i = 0; i < curves; i++) {
    const t1 = (i + 0.5) / curves
    const t2 = (i + 1) / curves
    const sign = i % 2 === 0 ? 1 : -1
    const cpx = from.x + dx * t1 + px * amplitude * sign
    const cpy = from.y + dy * t1 + py * amplitude * sign
    const ex = from.x + dx * t2
    const ey = from.y + dy * t2
    d += ` Q ${cpx} ${cpy} ${ex} ${ey}`
  }

  const color = isActive ? '#dc2626' : '#16a34a'
  const opacity = isActive ? 1 : 0.7

  return (
    <g filter={isActive ? 'url(#glow)' : undefined} opacity={opacity}>
      {/* Snake body */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Snake body inner pattern */}
      <path
        d={d}
        fill="none"
        stroke={isActive ? '#fca5a5' : '#86efac'}
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
      {/* Head dot */}
      <circle cx={from.x} cy={from.y} r="2" fill={color} />
      {/* Eyes */}
      <circle cx={from.x - 0.8} cy={from.y - 0.8} r="0.6" fill="white" />
      <circle cx={from.x + 0.8} cy={from.y - 0.8} r="0.6" fill="white" />
      <circle cx={from.x - 0.8} cy={from.y - 0.8} r="0.3" fill="black" />
      <circle cx={from.x + 0.8} cy={from.y - 0.8} r="0.3" fill="black" />
      {/* Tail taper */}
      <circle cx={to.x} cy={to.y} r="1" fill={color} opacity="0.5" />
    </g>
  )
}
