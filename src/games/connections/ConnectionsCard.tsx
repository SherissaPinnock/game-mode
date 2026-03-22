import { cn } from '@/lib/utils'

interface ConnectionsCardProps {
  item: string
  isSelected: boolean
  /** 'correct' and 'wrong' trigger CSS keyframe animations. */
  anim: 'idle' | 'correct' | 'wrong'
  /** Category colour used for the correct-flash animation background. */
  correctBg?: string
  onClick: () => void
}

/**
 * A single selectable card on the connections board.
 *
 * Animation states:
 *  - correct → bounces and shifts to the category colour before being removed
 *  - wrong   → shakes left-right
 */
export function ConnectionsCard({ item, isSelected, anim, correctBg, onClick }: ConnectionsCardProps) {
  return (
    <button
      onClick={onClick}
      style={anim === 'correct' && correctBg ? { backgroundColor: correctBg } : undefined}
      className={cn(
        // base
        'relative flex items-center justify-center rounded-md text-sm font-extrabold uppercase tracking-wider select-none',
        'transition-colors duration-100',
        'h-[72px] w-full',
        // idle / default
        !isSelected && anim !== 'correct' && 'bg-[#EFEFE6] text-[#2d2d2d] hover:bg-[#E0E0D4]',
        // selected
        isSelected && anim === 'idle' && 'bg-[#5A594E] text-white',
        // animations
        anim === 'correct' && 'animate-card-correct text-[#2d2d2d]',
        anim === 'wrong'   && 'animate-card-wrong bg-[#5A594E] text-white',
      )}
    >
      {item}
    </button>
  )
}
