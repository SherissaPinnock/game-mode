interface IntroModalProps {
  onStart: () => void
  onExit: () => void
}

export function IntroModal({ onStart, onExit }: IntroModalProps) {
  return (
    <div className="gcc-intro-shell">
      <div className="gcc-intro-card">
        <div className="gcc-intro-badge">⚡ Git Command Commander</div>

        <h1 className="gcc-intro-title">
          Tame the <span className="gcc-accent">Repository</span>
        </h1>

        <p className="gcc-intro-tagline">
          A puzzle game about Git workflow thinking — not command memorization.
        </p>

        <div className="gcc-intro-grid">
          <div className="gcc-intro-feature">
            <span className="gcc-intro-feature-icon">🧠</span>
            <div>
              <strong>Decision-first</strong>
              <p>Learn WHY workflows exist, not just what to type.</p>
            </div>
          </div>
          <div className="gcc-intro-feature">
            <span className="gcc-intro-feature-icon">🎭</span>
            <div>
              <strong>Visual State Machine</strong>
              <p>Watch commits, branches, and repos respond to your choices.</p>
            </div>
          </div>
          <div className="gcc-intro-feature">
            <span className="gcc-intro-feature-icon">🤝</span>
            <div>
              <strong>Team Etiquette</strong>
              <p>Discover how bad habits destroy team trust — the fun way.</p>
            </div>
          </div>
          <div className="gcc-intro-feature">
            <span className="gcc-intro-feature-icon">🏆</span>
            <div>
              <strong>5 Escalating Levels</strong>
              <p>From your first commit to pull request mastery.</p>
            </div>
          </div>
        </div>

        <div className="gcc-intro-quote">
          <em>"Into the Breach meets Git training."</em>
          <br />
          <small>No terminal required. Pure workflow thinking.</small>
        </div>

        <div className="gcc-intro-actions">
          <button className="gcc-btn gcc-btn-primary gcc-btn-lg" onClick={onStart}>
            ▶ Start Playing
          </button>
          <button className="gcc-btn gcc-btn-ghost" onClick={onExit}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
