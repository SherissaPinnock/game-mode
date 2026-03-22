import { useCallback, useState } from 'react'
import { TargetCanvas } from './TargetCanvas'
import { PowerMeter } from './PowerMeter'
import { ZONE_META } from './utils'
import type { ArrowShot } from './types'

type ShotPhase = 'aiming' | 'feedback'

interface ArcheryPhaseProps {
  arrowCount: number
  onShotFired: (shot: ArrowShot) => void
  onComplete:  () => void
  onExit:      () => void
}

/**
 * Main archery screen.
 * Alternates between 'aiming' (power meter active) and 'feedback' (show result)
 * for each arrow. After all arrows are shot, calls onComplete().
 */
export function ArcheryPhase({ arrowCount, onShotFired, onComplete, onExit }: ArcheryPhaseProps) {
  const [currentArrow, setCurrentArrow] = useState(0)
  const [shots,        setShots]        = useState<ArrowShot[]>([])
  const [latestShot,   setLatestShot]   = useState<ArrowShot | null>(null)
  const [shotPhase,    setShotPhase]    = useState<ShotPhase>('aiming')

  const isLastArrow = currentArrow === arrowCount - 1

  const handleShoot = useCallback(
    (shotData: Pick<ArrowShot, 'power' | 'zone' | 'score' | 'canvasX' | 'canvasY'>) => {
      const shot: ArrowShot = { arrowIndex: currentArrow, ...shotData }
      setShots(prev => [...prev, shot])
      setLatestShot(shot)
      setShotPhase('feedback')
      onShotFired(shot)
    },
    [currentArrow, onShotFired],
  )

  function handleNextArrow() {
    if (isLastArrow) {
      onComplete()
    } else {
      setCurrentArrow(prev => prev + 1)
      setLatestShot(null)
      setShotPhase('aiming')
    }
  }

  const resultMeta = latestShot ? ZONE_META[latestShot.zone] : null

  return (
    <div className="sketch-bg flex flex-1 flex-col items-center px-6 py-12 gap-8 min-h-screen">

      {/* Header */}
      <div className="w-full max-w-3xl flex items-center justify-between">
        <button onClick={onExit} className="sketch-btn px-4 py-2 text-sm font-sketch">
          ← Exit
        </button>
        <h2 className="font-sketch text-2xl text-[#2d2d2d]">🏹 Archery Range</h2>
        {/* Arrow progress dots */}
        <div className="flex gap-2">
          {Array.from({ length: arrowCount }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 border-[#2d2d2d] transition-colors ${
                i < shots.length ? 'bg-[#2d2d2d]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main layout: target left, controls right */}
      <div className="w-full max-w-3xl flex flex-col sm:flex-row gap-8 items-center justify-center">

        {/* Target canvas */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <TargetCanvas shots={shots} latestShot={latestShot} />
          <p className="font-sketch text-sm text-[#9ca3af]">
            {shots.length} / {arrowCount} arrows shot
          </p>
        </div>

        {/* Right panel: power meter OR feedback */}
        <div className="sketch-card p-6 flex-1 w-full flex flex-col gap-4">
          {shotPhase === 'aiming' ? (
            <PowerMeter
              arrowIndex={currentArrow}
              totalArrows={arrowCount}
              onShoot={handleShoot}
            />
          ) : resultMeta && latestShot ? (
            /* Result feedback */
            <div className="flex flex-col items-center gap-5 text-center py-4">
              <span className="text-6xl">{resultMeta.emoji}</span>
              <p
                className="font-sketch text-3xl font-bold"
                style={{ color: resultMeta.color }}
              >
                {resultMeta.label}
              </p>
              <p className="font-sketch text-xl text-[#2d2d2d]">
                +{latestShot.score} point{latestShot.score !== 1 ? 's' : ''}
              </p>
              <button
                onClick={handleNextArrow}
                className="sketch-btn px-8 py-3 font-sketch text-lg font-bold"
              >
                {isLastArrow ? '📊 See Results' : '➡ Next Arrow'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
