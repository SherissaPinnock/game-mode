import { cn } from '@/lib/utils'
import type { Card } from './types'

interface MemoryCardProps {
  card: Card
  isDisabled: boolean
  forceReveal?: boolean
  isDark: boolean
  onClick: () => void
}

export function MemoryCard({ card, isDisabled, forceReveal = false, isDark, onClick }: MemoryCardProps) {
  const isRevealed = forceReveal || card.state === 'flipped' || card.state === 'matched'
  const isMatched  = card.state === 'matched'
  const clickable  = !isDisabled && card.state === 'hidden'

  const backGradient = isDark
    ? 'linear-gradient(135deg, #4a1080 0%, #1a0533 50%, #0d1a4a 100%)'
    : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6366f1 100%)'

  const faceStyle = isMatched
    ? isDark
      ? { background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(5,150,105,0.15) 100%)', border: '2px solid rgba(52,211,153,0.5)', color: '#6ee7b7' }
      : { background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '2px solid #34d399', color: '#065f46' }
    : isDark
      ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)', border: '2px solid rgba(167,139,250,0.35)', color: '#c4b5fd' }
      : { background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)', border: '2px solid #a78bfa', color: '#4c1d95' }

  return (
    <div
      role="button"
      aria-pressed={isRevealed}
      onClick={clickable ? onClick : undefined}
      className={cn('memory-card', clickable && 'memory-card-clickable')}
    >
      <div className={cn('memory-card-inner', isRevealed && 'is-flipped')}>

        {/* Back (face-down) */}
        <div className="memory-card-back" style={{ background: backGradient, border: '1px solid rgba(167,139,250,0.3)' }}>
          <span className="font-mono text-fuchsia-300 text-base select-none opacity-80">{'</>'}</span>
        </div>

        {/* Face (face-up) */}
        <div className="memory-card-face" style={faceStyle}>
          <span className="font-mono font-bold text-[1rem] select-none tracking-tight text-center leading-tight">
            {card.display}
          </span>
        </div>

      </div>
    </div>
  )
}
