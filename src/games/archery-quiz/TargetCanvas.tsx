import { useEffect, useRef } from 'react'
import rough from 'roughjs'
import { TARGET_SIZE, TARGET_CENTER } from './utils'
import type { ArrowShot } from './types'

/**
 * Target ring definitions, drawn outermost first so inner rings sit on top.
 * Colours follow the standard archery target palette.
 */
const TARGET_RINGS = [
  { radius: 130, fill: '#f0ede0' }, // white  — miss zone
  { radius: 104, fill: '#b0a898' }, // black  — outer
  { radius: 78,  fill: '#4a8fd4' }, // blue   — middle
  { radius: 52,  fill: '#d44a4a' }, // red    — inner
  { radius: 26,  fill: '#f5c430' }, // gold   — bullseye
]

interface TargetCanvasProps {
  shots: ArrowShot[]
  /** Most recently fired shot — highlighted slightly differently. */
  latestShot?: ArrowShot | null
}

/**
 * Rough.js canvas that draws the archery target and all arrow positions.
 * Re-renders whenever the shots array changes.
 */
export function TargetCanvas({ shots, latestShot }: TargetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, TARGET_SIZE, TARGET_SIZE)

    const rc = rough.canvas(canvas)

    // --- Draw rings (outer → inner) ---
    for (const ring of TARGET_RINGS) {
      rc.circle(TARGET_CENTER, TARGET_CENTER, ring.radius * 2, {
        fill:        ring.fill,
        fillStyle:   'solid',
        stroke:      '#2d2d2d',
        strokeWidth: 1.5,
        roughness:   1.8,
      })
    }

    // Dashed crosshair at bullseye centre
    ctx.save()
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth   = 1
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.moveTo(TARGET_CENTER - 10, TARGET_CENTER)
    ctx.lineTo(TARGET_CENTER + 10, TARGET_CENTER)
    ctx.moveTo(TARGET_CENTER, TARGET_CENTER - 10)
    ctx.lineTo(TARGET_CENTER, TARGET_CENTER + 10)
    ctx.stroke()
    ctx.restore()

    // --- Draw arrows ---
    for (const shot of shots) {
      drawArrow(ctx, shot.canvasX, shot.canvasY, shot === latestShot)
    }
  }, [shots, latestShot])

  return (
    <canvas
      ref={canvasRef}
      width={TARGET_SIZE}
      height={TARGET_SIZE}
      className="rounded-full"
      style={{ border: '2px solid #2d2d2d', boxShadow: '4px 4px 0 #2d2d2d' }}
    />
  )
}

/**
 * Draws a single arrow stuck into the target at (x, y).
 * The shaft points straight up; the tip is at the impact point.
 * Latest shot is slightly bolder / more prominent.
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isLatest = false,
) {
  ctx.save()

  // Shaft
  ctx.strokeStyle = isLatest ? '#92400e' : '#5c3a1e'
  ctx.lineWidth   = isLatest ? 2.5 : 2
  ctx.beginPath()
  ctx.moveTo(x, y - 30) // top of visible shaft
  ctx.lineTo(x, y)
  ctx.stroke()

  // Metal tip (small grey dot at impact point)
  ctx.fillStyle = '#9ca3af'
  ctx.beginPath()
  ctx.arc(x, y, 3.5, 0, Math.PI * 2)
  ctx.fill()

  // Fletching (coloured bar at the top of the shaft)
  ctx.strokeStyle = isLatest ? '#dc2626' : '#6b7280'
  ctx.lineWidth   = 2
  ctx.beginPath()
  ctx.moveTo(x - 5, y - 30)
  ctx.lineTo(x + 5, y - 30)
  ctx.stroke()

  ctx.restore()
}
