import type { Level } from '../data/levels'

interface Props {
  level: Level
  correct: number
  total: number
  isLast: boolean
  onNext: () => void
  onReplay: () => void
  onExit: () => void
}

function accuracy(c: number, t: number) {
  if (t === 0) return 100
  return Math.round((c / t) * 100)
}

function grade(pct: number) {
  if (pct === 100) return { label: 'Perfect', emoji: '⭐', color: '#fbbf24' }
  if (pct >= 80)  return { label: 'Great',   emoji: '🌟', color: '#34d399' }
  if (pct >= 60)  return { label: 'Good',    emoji: '✓',  color: '#60a5fa' }
  return                  { label: 'Keep at it', emoji: '💪', color: '#f87171' }
}

export function LevelComplete({ level, correct, total, isLast, onNext, onReplay, onExit }: Props) {
  const pct = accuracy(correct, total)
  const g = grade(pct)

  return (
    <div
      className="cc-complete-screen"
      style={{ background: `linear-gradient(160deg, ${level.bgFrom} 0%, ${level.bgTo} 100%)` }}
    >
      <div className="cc-complete-card" style={{ borderColor: level.accentColor + '55' }}>

        {/* Grade */}
        <div className="cc-grade-emoji">{g.emoji}</div>
        <p className="cc-grade-label" style={{ color: g.color }}>{g.label}</p>
        <h2 className="cc-complete-title">{isLast ? 'Cloud Master!' : `Level ${level.id} Complete`}</h2>
        <p className="cc-complete-subtitle">{level.victoryLine}</p>

        {/* Stats */}
        <div className="cc-stats-row">
          <div className="cc-stat-box">
            <span className="cc-stat-num" style={{ color: level.accentColor }}>{pct}%</span>
            <span className="cc-stat-lbl">Accuracy</span>
          </div>
          <div className="cc-stat-box">
            <span className="cc-stat-num" style={{ color: '#4ade80' }}>{correct}</span>
            <span className="cc-stat-lbl">Correct</span>
          </div>
          <div className="cc-stat-box">
            <span className="cc-stat-num" style={{ color: '#f87171' }}>{total - correct}</span>
            <span className="cc-stat-lbl">Missed</span>
          </div>
        </div>

        {/* What you learned */}
        <div className="cc-learned-box" style={{ borderColor: level.accentColor + '44' }}>
          <p className="cc-learned-title" style={{ color: level.accentColor }}>What you learned</p>
          <div className="cc-learned-concepts">
            {level.intro.concepts.map(c => (
              <div key={c.title} className="cc-learned-item">
                <span>{c.icon}</span>
                <span className="cc-learned-name">{c.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="cc-complete-actions">
          {!isLast && (
            <button
              className="cc-btn-primary"
              style={{ background: level.accentColor }}
              onClick={onNext}
            >
              Next Level →
            </button>
          )}
          {isLast && (
            <button
              className="cc-btn-primary"
              style={{ background: level.accentColor }}
              onClick={onExit}
            >
              🏆 Claim Victory
            </button>
          )}
          <button className="cc-btn-ghost" onClick={onReplay}>Replay Level</button>
          <button className="cc-btn-ghost" onClick={onExit}>Exit</button>
        </div>
      </div>
    </div>
  )
}
