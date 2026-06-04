import { useState } from 'react'
import './GameCompleteModal.css'

export interface GameStat {
  label: string
  value: string | number
}

export interface GameCompletionData {
  gameEmoji: string
  gameName: string
  tagline: string
  score: number
  stats: GameStat[]
  keyLearnings: string[]
  devRelevance: string
  nextHint?: string
}

interface GameCompleteModalProps extends GameCompletionData {
  onPlayAgain?: () => void
  onBack: () => void
}

type Step = 'score' | 'learnings'

export function GameCompleteModal({
  gameEmoji,
  gameName,
  tagline,
  score,
  stats,
  keyLearnings,
  devRelevance,
  nextHint,
  onPlayAgain,
  onBack,
}: GameCompleteModalProps) {
  const [step, setStep] = useState<Step>('score')

  if (step === 'score') {
    return (
      <div className="gcm-overlay">
        <div className="gcm-card">
          <div className="gcm-badge">Level Complete</div>

          <div className="gcm-header">
            <div className="gcm-icon-wrap">
              <span className="gcm-icon" aria-hidden="true">{gameEmoji}</span>
            </div>
            <h2 className="gcm-title">{gameName}</h2>
            <p className="gcm-tagline">{tagline}</p>
          </div>

          <div className="gcm-score-block">
            <span className="gcm-score-label">Final Score</span>
            <span className="gcm-score-value">{score.toLocaleString()}</span>
          </div>

          {stats.length > 0 && (
            <div className="gcm-stats">
              {stats.map(stat => (
                <div key={stat.label} className="gcm-stat">
                  <span className="gcm-stat-value">{stat.value}</span>
                  <span className="gcm-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="gcm-actions">
            <button className="gcm-btn gcm-btn--primary" type="button" onClick={() => setStep('learnings')}>
              What did I learn? →
            </button>
            {onPlayAgain && (
              <button className="gcm-btn gcm-btn--secondary" type="button" onClick={onPlayAgain}>
                Play again
              </button>
            )}
            <button className="gcm-btn gcm-btn--ghost" type="button" onClick={onBack}>
              Back to roadmap
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gcm-overlay">
      <div className="gcm-card gcm-card--learnings">
        <div className="gcm-badge">What you learned</div>

        <h2 className="gcm-title gcm-title--sm">Key concepts from {gameName}</h2>

        <ul className="gcm-learnings">
          {keyLearnings.map((point, index) => (
            <li key={index} className="gcm-learning-item">{point}</li>
          ))}
        </ul>

        <div className="gcm-relevance">
          <span className="gcm-relevance-kicker">Why this matters in dev</span>
          <p className="gcm-relevance-body">{devRelevance}</p>
        </div>

        {nextHint && (
          <div className="gcm-next-hint">{nextHint}</div>
        )}

        <div className="gcm-actions">
          <button className="gcm-btn gcm-btn--primary" type="button" onClick={onBack}>
            Back to roadmap
          </button>
          {onPlayAgain && (
            <button className="gcm-btn gcm-btn--ghost" type="button" onClick={onPlayAgain}>
              Play again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
