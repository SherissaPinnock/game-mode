interface Props {
  onComplete: () => void
  onBack: () => void
}

export default function IndexingLevel({ onComplete, onBack }: Props) {
  return (
    <div className="dbq-level">
      <div className="dbq-level-header">
        <button className="dbq-back-btn" onClick={onBack}>← Map</button>
        <div className="dbq-level-title">
          <span className="dbq-level-tag">Level 2</span>
          <span className="dbq-level-name">🗂️ The Index Vault</span>
        </div>
      </div>

      <div className="dbq-level-body">
        <div className="dbq-phase-screen dbq-phase-center">
          <div className="dbq-coming-soon-card">
            <div className="dbq-coming-soon-icon">🚧</div>
            <h2 className="dbq-coming-soon-title">Level Coming Soon</h2>
            <p className="dbq-coming-soon-body">
              The Index Vault will teach you how database indexes work —
              turning full table scans into millisecond lookups.
            </p>
            <div className="dbq-coming-soon-preview">
              <div className="dbq-preview-item">⚡ Visualise a full table scan vs index seek</div>
              <div className="dbq-preview-item">🌲 B-tree index structure walkthrough</div>
              <div className="dbq-preview-item">🎯 Pick the right columns to index</div>
              <div className="dbq-preview-item">⚠️ When indexes hurt write performance</div>
            </div>
            <div className="dbq-coming-soon-actions">
              <button className="dbq-primary-btn" onClick={onComplete}>
                ✓ Mark Complete &amp; Back to Map
              </button>
              <button className="dbq-ghost-btn" onClick={onBack}>
                ← Back to Map
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
