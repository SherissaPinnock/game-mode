import { playPop } from '@/lib/sounds'
import type { Player } from '../types'
import '../PythonAndLadders.css'

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
    <div className="pal-shell pal-shell-dark pal-pass-shell px-6 text-center select-none">
      <div className="pal-pass-card space-y-8 max-w-xs">
        <div className="text-7xl">{nextPlayer.emoji}</div>

        <div className="space-y-2">
          <p className="pal-kicker">
            Next up
          </p>
          <h2 className="pal-title text-3xl">
            {nextPlayer.name}
          </h2>
          <p className="pal-body-copy text-sm leading-relaxed">
            Pass the device to {nextPlayer.name}.<br />
            Don't peek at the question!
          </p>
        </div>

        <button
          onClick={() => { playPop(); onReady() }}
          className="pal-btn pal-btn-wide text-base"
          style={{
            background: `linear-gradient(180deg, ${nextPlayer.color} 0%, ${nextPlayer.color}cc 100%)`,
            color: '#241c31',
          }}
        >
          I'm ready — show my question
        </button>
      </div>
    </div>
  )
}
