import './ExitConfirmModal.css'

interface ExitConfirmModalProps {
  /** If provided, shows "Save & Exit" button. If omitted, only "Quit" is available. */
  onSaveAndExit?: () => void
  onQuit: () => void
  onCancel: () => void
  progressLabel?: string
}

export function ExitConfirmModal({
  onSaveAndExit,
  onQuit,
  onCancel,
  progressLabel,
}: ExitConfirmModalProps) {
  return (
    <div className="exit-modal-overlay">
      <div className="exit-modal-card">
        <div className="exit-modal-badge">Session Check</div>

        <div className="exit-modal-header">
          <div className="exit-modal-icon-wrap">
            <div className="exit-modal-icon">🚪</div>
          </div>
          <h2 className="exit-modal-title">Exit game?</h2>
          {progressLabel ? (
            <p className="exit-modal-copy">
              You're at <span className="exit-modal-progress">{progressLabel}</span>.
              {onSaveAndExit
                ? ' Save your progress so you can pick up where you left off.'
                : ' Your progress will be lost.'}
            </p>
          ) : (
            <p className="exit-modal-copy">
              {onSaveAndExit
                ? 'Save your progress so you can pick up where you left off.'
                : 'Your progress will be lost.'}
            </p>
          )}
        </div>

        <div className="exit-modal-note">
          {onSaveAndExit
            ? 'Save first if you want to resume from this exact spot later.'
            : 'Leaving now will reset this run and send you back to the menu.'}
        </div>

        <div className="exit-modal-actions">
          {onSaveAndExit && (
            <button
              onClick={onSaveAndExit}
              className="exit-modal-btn exit-modal-btn-save"
            >
              Save & Exit
            </button>
          )}
          <button
            onClick={onQuit}
            className="exit-modal-btn exit-modal-btn-quit"
          >
            {onSaveAndExit ? 'Quit without saving' : 'Exit'}
          </button>
          <button
            onClick={onCancel}
            className="exit-modal-btn exit-modal-btn-cancel"
          >
            Cancel and keep playing
          </button>
        </div>
      </div>
    </div>
  )
}
