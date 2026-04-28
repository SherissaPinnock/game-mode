import { useState } from 'react'

import type { GameBoyConceptLesson } from '../data/roadmap'

interface ConceptQuizLevelProps {
  levelNumber: number
  title: string
  subtitle: string
  lesson: GameBoyConceptLesson
  onBack: () => void
  onComplete: () => void
}

export function ConceptQuizLevel({
  levelNumber,
  title,
  subtitle,
  lesson,
  onBack,
  onComplete,
}: ConceptQuizLevelProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const isCorrect = selectedOption === lesson.correctOption

  return (
    <div className="gb-level">
      <header className="gb-level-header">
        <button className="gb-back-btn" onClick={onBack}>
          ← Back to roadmap
        </button>

        <div className="gb-level-title">
          <span className="gb-level-badge">Level {String(levelNumber).padStart(2, '0')}</span>
          <div>
            <p className="gb-level-kicker">Docker Game Boy</p>
            <h1 className="gb-level-name">{title}</h1>
          </div>
        </div>
      </header>

      <main className="gb-level-body">
        <div className="gb-concept-layout">
          <section className="gb-panel">
            <div className="gb-panel-chip">Stage Brief</div>
            <h2 className="gb-panel-title">{subtitle}</h2>
            <p className="gb-panel-copy">{lesson.conceptSummary}</p>

            <div className="gb-lesson-card">
              <span className="gb-lesson-label">Game Boy analogy</span>
              <h3>{lesson.analogyTitle}</h3>
              <p>{lesson.analogyBody}</p>
            </div>

            <div className="gb-fact-grid">
              {lesson.quickFacts.map((fact) => (
                <div key={fact} className="gb-fact-card">
                  {fact}
                </div>
              ))}
            </div>

            <div className="gb-command-card">
              <div>
                <span className="gb-lesson-label">{lesson.commandLabel}</span>
                <p>{lesson.commandExplanation}</p>
              </div>

              <pre className="gb-code-block">
                <code>{lesson.commandExample}</code>
              </pre>
            </div>
          </section>

          <aside className="gb-panel gb-panel-quiz">
            <div className="gb-panel-chip">Checkpoint</div>
            <h2 className="gb-panel-title">One quick challenge</h2>
            <p className="gb-panel-copy">{lesson.challengeQuestion}</p>

            <div className="gb-option-list">
              {lesson.challengeOptions.map((option) => {
                const isSelected = selectedOption === option
                const optionClass = isSelected
                  ? isCorrect
                    ? 'is-correct'
                    : 'is-wrong'
                  : ''

                return (
                  <button
                    key={option}
                    className={`gb-option-card ${optionClass}`}
                    onClick={() => setSelectedOption(option)}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            {selectedOption && (
              <div className={`gb-feedback-card ${isCorrect ? 'is-success' : 'is-warning'}`}>
                <p>{isCorrect ? lesson.successMessage : lesson.challengeHint}</p>
              </div>
            )}

            <button
              className="gb-primary-btn"
              disabled={!isCorrect}
              onClick={onComplete}
            >
              Clear stage
            </button>
          </aside>
        </div>
      </main>
    </div>
  )
}
