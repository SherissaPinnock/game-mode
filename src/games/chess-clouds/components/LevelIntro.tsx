import type { Level } from '../data/levels'

interface Props {
  level: Level
  onStart: () => void
  onExit: () => void
}

export function LevelIntro({ level, onStart, onExit }: Props) {
  return (
    <div
      className="cc-intro-screen"
      style={{ background: `linear-gradient(160deg, ${level.bgFrom} 0%, ${level.bgTo} 100%)` }}
    >
      {/* Back */}
      <button className="cc-exit-btn" onClick={onExit}>← Exit</button>

      <div className="cc-intro-inner">
        {/* Level badge */}
        <div className="cc-level-badge" style={{ background: level.accentColor + '22', borderColor: level.accentColor + '66', color: level.accentColor }}>
          Level {level.id} · {level.missionName}
        </div>

        {/* Title */}
        <h1 className="cc-intro-title">{level.intro.headline}</h1>
        <p className="cc-intro-body">{level.intro.body}</p>

        {/* Concepts grid */}
        <div className="cc-concepts-grid">
          {level.intro.concepts.map(c => (
            <div key={c.title} className="cc-concept-card" style={{ borderColor: level.accentColor + '44' }}>
              <span className="cc-concept-icon">{c.icon}</span>
              <div>
                <p className="cc-concept-title" style={{ color: level.accentColor }}>{c.title}</p>
                <p className="cc-concept-body">{c.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mission brief */}
        <div className="cc-mission-brief" style={{ borderColor: level.accentColor + '55', background: level.accentColor + '11' }}>
          <p className="cc-mission-brief-label">🎯 Your Mission</p>
          <p className="cc-mission-brief-text">{level.missionBrief}</p>
        </div>

        <button
          className="cc-start-btn"
          style={{ background: level.accentColor }}
          onClick={onStart}
        >
          Begin Mission →
        </button>
      </div>
    </div>
  )
}
