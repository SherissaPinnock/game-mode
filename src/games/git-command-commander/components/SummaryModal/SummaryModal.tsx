import type { LevelConfig } from '../../types/game.types'

interface SummaryModalProps {
  level: LevelConfig
  onNext: () => void
  onRoadmap: () => void
  isLastLevel: boolean
}

export function SummaryModal({ level, onNext, onRoadmap, isLastLevel }: SummaryModalProps) {
  return (
    <div className="gcc-summary-overlay">
      <div className="gcc-summary-panel">
        <div className="gcc-summary-badge">
          <span className="gcc-summary-badge-icon">🏆</span>
          <span>Level Complete!</span>
        </div>

        <h2 className="gcc-summary-title">{level.emoji} {level.title}</h2>

        <div className="gcc-summary-sections">
          <div className="gcc-summary-section">
            <div className="gcc-summary-section-header">
              <span>✅</span> What You Did
            </div>
            <p>{level.summaryContent.whatYouDid}</p>
          </div>

          <div className="gcc-summary-section">
            <div className="gcc-summary-section-header">
              <span>⭐</span> Best Practice
            </div>
            <p>{level.summaryContent.bestPractice}</p>
          </div>

          <div className="gcc-summary-section">
            <div className="gcc-summary-section-header">
              <span>🏢</span> Real Team Scenario
            </div>
            <p>{level.summaryContent.realTeamScenario}</p>
          </div>
        </div>

        {level.etiquetteLessons.length > 0 && (
          <div className="gcc-etiquette-strip">
            <p className="gcc-etiquette-heading">📋 Etiquette Takeaways</p>
            <div className="gcc-etiquette-cards">
              {level.etiquetteLessons.map(lesson => (
                <div key={lesson.id} className="gcc-etiquette-card">
                  <span className="gcc-etiquette-icon">{lesson.icon}</span>
                  <div>
                    <strong>{lesson.title}</strong>
                    <p>{lesson.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="gcc-summary-actions">
          {isLastLevel ? (
            <button className="gcc-btn gcc-btn-primary gcc-btn-lg" onClick={onNext}>
              🎉 Finish Game
            </button>
          ) : (
            <button className="gcc-btn gcc-btn-primary gcc-btn-lg" onClick={onNext}>
              Next Level →
            </button>
          )}
          <button className="gcc-btn gcc-btn-ghost" onClick={onRoadmap}>
            ↩ View Roadmap
          </button>
        </div>
      </div>
    </div>
  )
}
