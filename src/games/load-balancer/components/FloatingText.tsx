import type { CSSProperties } from 'react'
import type { FloatingTextState } from '../types'

interface FloatingTextProps {
  text: FloatingTextState
}

export function FloatingText({ text }: FloatingTextProps) {
  return (
    <div
      className={`lb-floating-text lb-floating-${text.tone}`}
      style={{
        left: `${text.x}%`,
        top: `${text.y}%`,
        '--lb-float-alpha': `${Math.max(0.2, Math.min(1, text.lifeMs / 1_100))}`,
      } as CSSProperties}
    >
      {text.text}
    </div>
  )
}
