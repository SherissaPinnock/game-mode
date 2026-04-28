import { useCallback, useState } from 'react'
import { TargetCanvas } from './TargetCanvas'
import { PowerMeter } from './PowerMeter'
import { ZONE_META } from './utils'
import type { ArrowShot } from './types'
import './ArcheryArena.css'

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
    <div className="aa-shell aa-shell-center">
      <div className="aa-header">
        <button onClick={onExit} className="aa-btn aa-btn-ghost px-4 py-2 text-sm font-sketch">
          ← Exit
        </button>
        <h2 className="aa-heading aa-heading-center aa-heading-small font-sketch">🏹 Archery Range</h2>
        <div className="aa-progress-dots">
          {Array.from({ length: arrowCount }, (_, i) => (
            <div
              key={i}
              className={`aa-dot ${i < shots.length ? 'aa-dot-done' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="aa-main-row">
        <div className="flex flex-col items-center gap-3 shrink-0">
          <TargetCanvas shots={shots} latestShot={latestShot} />
          <p className="aa-caption aa-caption-center font-sketch">
            {shots.length} / {arrowCount} arrows shot
          </p>
        </div>

        <div className="aa-panel aa-side-panel">
          {shotPhase === 'aiming' ? (
            <PowerMeter
              arrowIndex={currentArrow}
              totalArrows={arrowCount}
              onShoot={handleShoot}
            />
          ) : resultMeta && latestShot ? (
            <div className="aa-feedback-stack">
              <span className="text-6xl">{resultMeta.emoji}</span>
              <p className="aa-zone-title font-sketch" style={{ color: resultMeta.color }}>
                {resultMeta.label}
              </p>
              <p className="aa-points-text font-sketch">
                +{latestShot.score} point{latestShot.score !== 1 ? 's' : ''}
              </p>
              <button
                onClick={handleNextArrow}
                className="aa-btn aa-btn-primary aa-btn-wide font-sketch"
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
