import type { CaseDefinition } from '@/games/schema-sleuth/types'

interface TutorialShowcaseProps {
  caseDefinition: CaseDefinition
}

export function TutorialShowcase({ caseDefinition }: TutorialShowcaseProps) {
  const isFullCase = caseDefinition.phase === 'full'

  return (
    <section className="aa-panel ss-panel ss-showcase-panel">
      <div className="ss-showcase-head">
        <p className="pal-kicker">Welcome</p>
        <h2 className="ss-panel-title">Welcome to Schema Sleuth</h2>
        <p className="ss-panel-copy">
          Build ERDs one layer at a time.
        </p>
      </div>

      <div className="ss-showcase-grid">
        <div className="ss-showcase-block">
          <p className="ss-showcase-label">What you&apos;ll learn</p>
          <div className="ss-learn-pills">
            <span className={`ss-learn-pill ${caseDefinition.phase === 'entities' || isFullCase ? 'is-active' : ''}`}>Entities</span>
            <span className={`ss-learn-pill ${caseDefinition.phase === 'attributes' || isFullCase ? 'is-active' : ''}`}>Fields</span>
            <span className={`ss-learn-pill ${caseDefinition.phase === 'relationships' || isFullCase ? 'is-active' : ''}`}>Cardinality</span>
          </div>
        </div>

        <div className="ss-showcase-block">
          <p className="ss-showcase-label">How to play</p>
          <div className="ss-how-grid">
            <div className={`ss-how-card ${caseDefinition.phase === 'entities' || isFullCase ? 'is-active' : ''}`}>
              <div className="ss-mini-flow">
                <span className="ss-mini-chip">BOOK</span>
                <span className="ss-mini-arrow">→</span>
                <span className="ss-mini-slot">BOARD</span>
              </div>
              <p>Drag</p>
            </div>

            <div className={`ss-how-card ${caseDefinition.phase === 'attributes' || isFullCase ? 'is-active' : ''}`}>
              <div className="ss-mini-modal">
                <span className="ss-mini-line is-on">userId</span>
                <span className="ss-mini-line is-on">handle</span>
                <span className="ss-mini-line">themeColor</span>
              </div>
              <p>Tap</p>
            </div>

            <div className={`ss-how-card ${caseDefinition.phase === 'relationships' || isFullCase ? 'is-active' : ''}`}>
              <div className="ss-mini-flow">
                <span className="ss-mini-chip">USER</span>
                <span className="ss-mini-arrow">→</span>
                <span className="ss-mini-chip">POST</span>
              </div>
              <p>Link</p>
            </div>
          </div>
        </div>
      </div>

      <div className="ss-showcase-brief">
        <p className="ss-meta-line">{caseDefinition.difficulty}</p>
        <p className="ss-brief-quote">{caseDefinition.briefing}</p>
        <p className="ss-brief-focus">{caseDefinition.learningFocus}</p>
      </div>
    </section>
  )
}
