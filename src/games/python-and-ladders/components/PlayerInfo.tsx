import type { Player } from '../types'
import { BOARD_SIZE } from '../data/board'

interface PlayerInfoProps {
  player: Player
  isActive: boolean
}

export function PlayerInfo({ player, isActive }: PlayerInfoProps) {
  const progress = Math.round((player.position / BOARD_SIZE) * 100)

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-xl border-2 transition-all
        ${isActive
          ? 'border-blue-400 bg-blue-50 shadow-sm'
          : 'border-slate-200 bg-white'
        }
      `}
    >
      <span className="text-xl">{player.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700 truncate">
            {player.name}
          </span>
          <span className="text-xs text-slate-500 font-mono ml-2">
            {player.position}/{BOARD_SIZE}
          </span>
        </div>
        <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: player.color,
            }}
          />
        </div>
      </div>
    </div>
  )
}
