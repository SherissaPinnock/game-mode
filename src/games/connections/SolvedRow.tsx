import { COLOR_STYLES } from './types'
import type { ConnectionGroup } from './types'

interface SolvedRowProps {
  group: ConnectionGroup
}

/**
 * A revealed category row that slides in from above when a group is solved.
 * Plays the `animate-row-reveal` CSS animation on mount (defined in App.css).
 */
export function SolvedRow({ group }: SolvedRowProps) {
  const { bg, text } = COLOR_STYLES[group.color]

  return (
    <div
      className="animate-row-reveal w-full rounded-md flex flex-col items-center justify-center py-3 px-4 gap-1"
      style={{ backgroundColor: bg, color: text, minHeight: 72 }}
    >
      <p className="text-xs font-bold uppercase tracking-widest opacity-70">
        {group.category}
      </p>
      <p className="text-sm font-extrabold uppercase tracking-wider">
        {group.items.join(' · ')}
      </p>
    </div>
  )
}
