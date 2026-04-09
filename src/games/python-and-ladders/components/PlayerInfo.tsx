import type { Player } from '../types'
import { BOARD_SIZE } from '../data/board'

interface PlayerInfoProps {
  player: Player
  isActive: boolean
  isDark: boolean
  playerIndex: 'p1' | 'p2'
}

// P1 = sky/blue identity, P2 = amber/orange identity — matches their token colors
const PLAYER_COLORS = {
  p1: {
    dark:  { border: 'border-sky-400',   bg: 'bg-sky-500/15',   shadow: 'shadow-sky-500/20',   name: 'text-sky-100',   bar: '#38bdf8' },
    light: { border: 'border-sky-500',   bg: 'bg-sky-50',       shadow: 'shadow-sky-400/20',   name: 'text-sky-900',   bar: '#0ea5e9' },
  },
  p2: {
    dark:  { border: 'border-amber-400', bg: 'bg-amber-500/15', shadow: 'shadow-amber-500/20', name: 'text-amber-100', bar: '#fbbf24' },
    light: { border: 'border-amber-500', bg: 'bg-amber-50',     shadow: 'shadow-amber-400/20', name: 'text-amber-900', bar: '#f59e0b' },
  },
}

export function PlayerInfo({ player, isActive, isDark, playerIndex }: PlayerInfoProps) {
  const progress = Math.round((player.position / BOARD_SIZE) * 100)
  const pc = PLAYER_COLORS[playerIndex][isDark ? 'dark' : 'light']

  const inactiveBg     = isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white'
  const inactiveName   = isDark ? 'text-slate-400' : 'text-slate-600'
  const inactiveBar    = isDark ? '#334155' : '#e2e8f0'
  const progressColor  = isActive ? pc.bar : inactiveBar
  const posColor       = isDark ? 'text-slate-500' : 'text-slate-400'
  const trackBg        = isDark ? 'bg-white/10' : 'bg-slate-100'

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border-2 transition-all duration-300
      ${isActive
        ? `${pc.border} ${pc.bg} shadow-lg ${pc.shadow}`
        : inactiveBg
      }`}
    >
      <span className="text-xl">{player.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold truncate transition-colors ${isActive ? pc.name : inactiveName}`}>
            {player.name}
          </span>
          <span className={`text-xs font-mono ml-2 ${posColor}`}>
            {player.position}/{BOARD_SIZE}
          </span>
        </div>
        <div className={`mt-1 h-1.5 rounded-full overflow-hidden ${trackBg}`}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: progressColor }}
          />
        </div>
      </div>
    </div>
  )
}
