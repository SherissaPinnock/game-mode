import { cn } from '@/lib/utils'
import type { Card } from './types'

interface MemoryCardProps {
  card: Card
  /** Block clicks while a mismatch is being checked or the game is won. */
  isDisabled: boolean
  /** Forces the card face-up regardless of its state — used for the opening peek. */
  forceReveal?: boolean
  onClick: () => void
}

/**
 * A single memory card with a CSS 3D flip animation.
 *
 * Structure (CSS preserve-3d):
 *   .memory-card-inner          ← rotates on flip
 *     .memory-card-back         ← face-down side (always visible first)
 *     .memory-card-face         ← face-up side (rotated 180° in CSS, shown after flip)
 *
 * States:
 *   hidden  → showing back, clickable
 *   flipped → showing face (previewing, awaiting match check)
 *   matched → showing face with green tint, permanently face-up
 */
export function MemoryCard({ card, isDisabled, forceReveal = false, onClick }: MemoryCardProps) {
  const isRevealed = forceReveal || card.state === 'flipped' || card.state === 'matched'
  const isMatched  = card.state === 'matched'

  const clickable = !isDisabled && card.state === 'hidden'

  return (
    <div
      role="button"
      aria-pressed={isRevealed}
      onClick={clickable ? onClick : undefined}
      className={cn('memory-card', clickable && 'memory-card-clickable')}
    >
      <div className={cn('memory-card-inner', isRevealed && 'is-flipped')}>

        {/* ── Back (face-down) ── */}
        <div className="memory-card-back">
          <span className="font-mono text-slate-500 text-base select-none opacity-60">{'</>'}</span>
        </div>

        {/* ── Face (face-up) ── */}
        <div
          className={cn(
            'memory-card-face',
            isMatched
              ? 'bg-green-100 border-green-300 text-green-700'
              : 'bg-white border-slate-200 text-slate-800',
          )}
        >
          <span className="font-mono font-bold text-[1.1rem] select-none tracking-tight">
            {card.display}
          </span>
        </div>

      </div>
    </div>
  )
}
