import { useCallback, useEffect, useRef, useState } from 'react'
import { getZoneFromPower, calculateHitPosition, ZONE_META } from './utils'
import type { ArrowShot } from './types'

/** Percentage points moved per animation frame (~60 fps). Increase to go faster. */
const NEEDLE_SPEED = 3.5

const ZONE_BANDS = [
  { from: 0,  to: 17, color: '#d1d5db' }, // miss
  { from: 17, to: 28, color: '#93c5fd' }, // outer
  { from: 28, to: 38, color: '#3b82f6' }, // middle
  { from: 38, to: 45, color: '#ef4444' }, // inner
  { from: 45, to: 55, color: '#fbbf24' }, // bullseye ★
  { from: 55, to: 62, color: '#ef4444' }, // inner
  { from: 62, to: 72, color: '#3b82f6' }, // middle
  { from: 72, to: 83, color: '#93c5fd' }, // outer
  { from: 83, to: 100, color: '#d1d5db' }, // miss
]

interface PowerMeterProps {
  arrowIndex:  number
  totalArrows: number
  onShoot: (shot: Pick<ArrowShot, 'power' | 'zone' | 'score' | 'canvasX' | 'canvasY'>) => void
}

/**
 * Animated power bar with a bouncing needle.
 *
 * The needle and zone label are updated via direct DOM ref mutation inside the
 * RAF loop — this completely bypasses React's render cycle so speed changes
 * are immediately visible at true 60 fps.
 */
export function PowerMeter({ arrowIndex, totalArrows, onShoot }: PowerMeterProps) {
  const powerRef  = useRef(0)
  const dirRef    = useRef<1 | -1>(1)
  const rafRef    = useRef<number | null>(null)
  const hasShotRef = useRef(false)

  // DOM refs — mutated directly in the RAF loop, no setState involved
  const needleRef    = useRef<HTMLDivElement>(null)
  const zoneLabelRef = useRef<HTMLParagraphElement>(null)

  const [hasShot, setHasShot] = useState(false)

  // Reset everything when moving to a new arrow
  useEffect(() => {
    powerRef.current   = 0
    dirRef.current     = 1
    hasShotRef.current = false
    setHasShot(false)

    // Reset DOM nodes directly so they don't flicker on the next render
    if (needleRef.current)    needleRef.current.style.left = '0%'
    if (zoneLabelRef.current) {
      const meta = ZONE_META['miss']
      zoneLabelRef.current.textContent = `${meta.emoji} ${meta.label}`
      zoneLabelRef.current.style.color = meta.color
    }
  }, [arrowIndex])

  // RAF loop — runs while the player is aiming
  useEffect(() => {
    if (hasShot) return

    function step() {
      powerRef.current += dirRef.current * NEEDLE_SPEED
      if (powerRef.current >= 100) { powerRef.current = 100; dirRef.current = -1 }
      else if (powerRef.current <= 0) { powerRef.current = 0; dirRef.current = 1 }

      // ── Direct DOM updates — zero React overhead ──
      if (needleRef.current) {
        needleRef.current.style.left = `${powerRef.current}%`
      }
      if (zoneLabelRef.current) {
        const { zone } = getZoneFromPower(powerRef.current)
        const meta     = ZONE_META[zone]
        zoneLabelRef.current.textContent = `${meta.emoji} ${meta.label}`
        zoneLabelRef.current.style.color = meta.color
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [hasShot])

  const handleShoot = useCallback(() => {
    if (hasShotRef.current) return
    hasShotRef.current = true
    setHasShot(true)

    const power = powerRef.current
    const { zone, score }      = getZoneFromPower(power)
    const { canvasX, canvasY } = calculateHitPosition(zone)
    onShoot({ power, zone, score, canvasX, canvasY })
  }, [onShoot])

  // Spacebar shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') { e.preventDefault(); handleShoot() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleShoot])

  return (
    <div className="flex flex-col gap-5 w-full">
      <p className="font-sketch text-sm text-center text-[#6b7280]">
        Arrow {arrowIndex + 1} of {totalArrows} — tap at the right moment!
      </p>

      {/* Live zone label — updated directly via zoneLabelRef */}
      <p
        ref={zoneLabelRef}
        className="font-sketch text-2xl font-bold text-center"
        style={{ color: ZONE_META['miss'].color }}
      >
        {ZONE_META['miss'].emoji} {ZONE_META['miss'].label}
      </p>

      {/* Power bar */}
      <div
        className="relative h-14 w-full overflow-hidden"
        style={{ border: '2px solid #2d2d2d', borderRadius: 3, boxShadow: '3px 3px 0 #2d2d2d' }}
      >
        {ZONE_BANDS.map((band, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{ left: `${band.from}%`, width: `${band.to - band.from}%`, backgroundColor: band.color }}
          />
        ))}

        {/* Bullseye zone dashed marker */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-r-2 border-dashed border-amber-700 opacity-60"
          style={{ left: '45%', width: '10%' }}
        />

        {/* Needle — position updated directly via needleRef */}
        <div
          ref={needleRef}
          className="absolute top-0 bottom-0 w-[3px] bg-white"
          style={{ left: '0%', transform: 'translateX(-50%)', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }}
        />
      </div>

      <button
        onClick={handleShoot}
        disabled={hasShot}
        className="sketch-btn w-full py-5 font-sketch text-2xl font-bold tracking-wide"
      >
        {hasShot ? '✓ Arrow released!' : '🏹  SHOOT!  (or press Space)'}
      </button>
    </div>
  )
}
