import { playClick } from '@/lib/sounds'
import './ExplorePhase.css'

interface Props {
  onRoomClick: (roomId: string) => void
  onExit: () => void
}

/**
 * ExplorePhase — the topbar UI shown when the player is freely
 * navigating Blackwood Manor. The mansion board + suspects are
 * always rendered by MysteryGame behind this overlay.
 */
export default function ExplorePhase({ onExit }: Props) {
  return (
    <div className="exp-topbar">
      <button
        className="exp-exit-btn"
        onClick={() => { playClick(); onExit() }}
      >
        ← Exit
      </button>
      <span className="exp-title">🕯️ Blackwood Manor</span>
      <span className="exp-hint">Click a room to investigate</span>
    </div>
  )
}
