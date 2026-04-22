import type { Player } from '../types'
import { BOARD_SIZE } from '../data/board'
import '../PythonAndLadders.css'

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
  const progressColor  = isActive ? pc.bar : (isDark ? '#4f5969' : '#c7c1b8')

  return (
    <div className={`pal-player-card flex items-center gap-3 ${isActive ? `is-active is-active-${playerIndex}` : 'is-inactive'}`}>
      <span className="text-xl">{player.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`pal-player-name text-sm truncate transition-colors ${isActive ? pc.name : 'text-[#efe6da]'}`}>
            {player.name}
          </span>
          <span className="text-xs font-mono ml-2 opacity-70">
            {player.position}/{BOARD_SIZE}
          </span>
        </div>
        <div className="pal-progress-track">
          <div
            className="pal-progress-fill"
            style={{ width: `${progress}%`, backgroundColor: progressColor }}
          />
        </div>
      </div>
    </div>
  )
}
