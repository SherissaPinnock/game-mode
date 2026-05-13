import type { CSSProperties } from 'react'
import type { PartyGoerState } from '../types'

interface PartyGoerProps {
  goer: PartyGoerState
  spriteSrc: string
  renderX: number
  renderY: number
  isDragging: boolean
}

export function PartyGoer({
  goer,
  spriteSrc,
  renderX,
  renderY,
  isDragging,
}: PartyGoerProps) {
  return (
    <div
      className={`lb-goer ${isDragging ? 'is-dragging' : ''}`}
      style={{
        left: `${renderX}%`,
        top: `${renderY}%`,
        '--lb-goer-tilt': `${Math.sin(goer.wobble) * 2.6}deg`,
      } as CSSProperties}
    >
      <span className="lb-goer-problem">{goer.prompt}</span>
      <span className="lb-goer-shadow" aria-hidden="true" />
      <span className="lb-goer-glow" aria-hidden="true" />
      {spriteSrc ? (
        <img src={spriteSrc} alt="" className="lb-goer-sprite" draggable={false} />
      ) : (
        <span className="lb-goer-placeholder" aria-hidden="true" />
      )}
    </div>
  )
}
