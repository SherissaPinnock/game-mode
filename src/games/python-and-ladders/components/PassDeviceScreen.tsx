import { playPop } from '@/lib/sounds'
import type { Player } from '../types'

interface PassDeviceScreenProps {
  nextPlayer: Player
  onReady: () => void
}

/**
 * Fullscreen "pass the device" gate between turns.
 * Keeps each player's questions private — the next player taps to reveal.
 */
export function PassDeviceScreen({ nextPlayer, onReady }: PassDeviceScreenProps) {
  return (
    <div className="min-h-screen bg-slate-800 flex flex-col items-center justify-center px-6 text-center select-none">
      <div className="space-y-8 max-w-xs">
        {/* Big emoji */}
        <div className="text-7xl">{nextPlayer.emoji}</div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-white/60 text-sm uppercase tracking-widest font-semibold">
            Next up
          </p>
          <h2 className="text-3xl font-bold text-white">
            {nextPlayer.name}
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Pass the device to {nextPlayer.name}.<br />
            Don't peek at the question!
          </p>
        </div>

        {/* Tap to reveal */}
        <button
          onClick={() => { playPop(); onReady() }}
          className="w-full py-4 rounded-2xl font-bold text-slate-800 text-base transition-all active:scale-95"
          style={{ backgroundColor: nextPlayer.color }}
        >
          I'm ready — show my question
        </button>
      </div>
    </div>
  )
}
