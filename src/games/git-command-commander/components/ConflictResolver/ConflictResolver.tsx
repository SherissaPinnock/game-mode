import type { ConflictState } from '../../types/game.types'

interface ConflictResolverProps {
  conflict: ConflictState
  onResolve: (choice: 'incoming' | 'current' | 'both') => void
}

export function ConflictResolver({ conflict, onResolve }: ConflictResolverProps) {
  if (conflict.resolved) return null

  return (
    <div className="gcc-conflict-overlay">
      <div className="gcc-conflict-panel">
        <div className="gcc-conflict-header">
          <span className="gcc-conflict-icon">⚡</span>
          <div>
            <h3 className="gcc-conflict-title">Merge Conflict</h3>
            <p className="gcc-conflict-file">{conflict.file}</p>
          </div>
        </div>

        <p className="gcc-conflict-hint">
          Two teammates edited the same file. Read both versions and choose how to resolve.
        </p>

        <div className="gcc-conflict-diff">
          <div className="gcc-diff-pane gcc-diff-current">
            <div className="gcc-diff-pane-header">
              <span className="gcc-diff-tag">CURRENT (main)</span>
            </div>
            <pre className="gcc-diff-code">{conflict.current}</pre>
          </div>
          <div className="gcc-diff-pane gcc-diff-incoming">
            <div className="gcc-diff-pane-header">
              <span className="gcc-diff-tag">INCOMING (feature-login)</span>
            </div>
            <pre className="gcc-diff-code">{conflict.incoming}</pre>
          </div>
        </div>

        <div className="gcc-conflict-actions">
          <button
            className="gcc-btn gcc-btn-outline"
            onClick={() => onResolve('current')}
          >
            Keep Current
          </button>
          <button
            className="gcc-btn gcc-btn-outline gcc-btn-incoming"
            onClick={() => onResolve('incoming')}
          >
            Keep Incoming
          </button>
          <button
            className="gcc-btn gcc-btn-primary"
            onClick={() => onResolve('both')}
          >
            Keep Both ✓
          </button>
        </div>
      </div>
    </div>
  )
}
