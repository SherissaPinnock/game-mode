interface HUDProps {
  timeLeftMs: number
  reputation: number
  score: number
  activePartyCount: number
}

function formatTimer(timeLeftMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(timeLeftMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function HUD({ timeLeftMs, reputation, score, activePartyCount }: HUDProps) {
  return (
    <div className="lb-hud" aria-label="Level status">
      <div className="lb-hud-row">
        <div className="lb-hud-chip">
          <span className="lb-hud-label">Timer</span>
          <strong>{formatTimer(timeLeftMs)}</strong>
        </div>

        <div className="lb-hud-chip">
          <span className="lb-hud-label">Score</span>
          <strong>{score}</strong>
        </div>
      </div>

      <div className="lb-hud-reputation">
        <div className="lb-hud-reputation-head">
          <span className="lb-hud-label">Reputation</span>
          <strong>{Math.max(0, Math.round(reputation))}%</strong>
        </div>

        <div className="lb-hud-reputation-track" aria-hidden="true">
          <div
            className="lb-hud-reputation-fill"
            style={{ width: `${Math.max(0, Math.min(100, reputation))}%` }}
          />
        </div>
      </div>

      <div className="lb-hud-chip lb-hud-chip-wide">
        <span className="lb-hud-label">Queue</span>
        <strong>{activePartyCount} live requests</strong>
      </div>
    </div>
  )
}
