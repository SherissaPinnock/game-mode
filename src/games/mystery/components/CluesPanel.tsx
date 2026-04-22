import { useState } from 'react'
import type { Clue } from '../data/clues'
import './CluesPanel.css'

interface Props {
  clues: Clue[]
  /** ID of a freshly collected clue to highlight */
  newClueId?: string | null
}

export default function CluesPanel({ clues, newClueId }: Props) {
  const [open,     setOpen]     = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className={`clp-root ${open ? 'open' : ''}`}>
      {/* Toggle tab */}
      <button
        className="clp-toggle"
        onClick={() => setOpen(o => !o)}
        title={open ? 'Hide clues' : 'Show clues'}
      >
        <span className="clp-toggle-icon">🗂</span>
        <span className="clp-toggle-label">Evidence</span>
        {clues.length > 0 && (
          <span className="clp-badge">{clues.length}</span>
        )}
      </button>

      {/* Slide-out panel */}
      <div className="clp-panel">
        <h3 className="clp-heading">Evidence Collected</h3>

        {clues.length === 0 ? (
          <p className="clp-empty">No evidence yet. Begin your investigation.</p>
        ) : (
          <ul className="clp-list">
            {clues.map(clue => (
              <li
                key={clue.id}
                className={`clp-item ${clue.id === newClueId ? 'new' : ''} ${expanded === clue.id ? 'expanded' : ''}`}
                onClick={() => setExpanded(expanded === clue.id ? null : clue.id)}
              >
                <div className="clp-item-header">
                  <span className="clp-item-icon">{clue.icon}</span>
                  <span className="clp-item-title">{clue.title}</span>
                  <span className="clp-item-chevron">{expanded === clue.id ? '▲' : '▼'}</span>
                </div>
                <p className="clp-item-summary">{clue.summary}</p>
                {expanded === clue.id && (
                  <p className="clp-item-detail">{clue.detail}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
