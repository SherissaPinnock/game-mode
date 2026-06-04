import { useState, useMemo } from 'react'
import { ACTION_CONFIGS } from '../../data/actions'
import type { LevelState } from '../../types/game.types'

interface ActionPanelProps {
  availableActions: string[]
  levelState: LevelState
  onAction: (actionId: string, input?: string) => void
}

function shuffleOnce<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function ActionPanel({ availableActions, levelState, onAction }: ActionPanelProps) {
  const [inputModal, setInputModal] = useState<{ actionId: string; type: string } | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [prForm, setPrForm] = useState({ title: '', description: '', reviewer: '' })

  const shuffledActions = useMemo(() => shuffleOnce(availableActions), [availableActions])

  function handleActionClick(actionId: string) {
    const config = ACTION_CONFIGS[actionId]
    if (!config) return

    if (config.requiresInput === 'commit-message') {
      setInputModal({ actionId, type: 'commit-message' })
      setInputValue(levelState.commitMessageDraft ?? '')
    } else if (config.requiresInput === 'branch-name') {
      setInputModal({ actionId, type: 'branch-name' })
      setInputValue(levelState.branchNameDraft ?? '')
    } else if (config.requiresInput === 'pr-form') {
      setInputModal({ actionId, type: 'pr-form' })
      setPrForm(levelState.prDraft ?? { title: '', description: '', reviewer: '' })
    } else if (config.requiresInput === 'confirm') {
      const other = levelState.availableBranches.find(b => b !== levelState.currentBranch)
      if (!other) {
        onAction(actionId)
      } else {
        setInputModal({ actionId, type: 'confirm' })
        setInputValue(other)
      }
    } else if (config.requiresInput === 'conflict-choice') {
      setInputModal({ actionId, type: 'conflict-choice' })
    } else {
      onAction(actionId)
    }
  }

  function submitModal() {
    if (!inputModal) return

    if (inputModal.type === 'pr-form') {
      onAction(inputModal.actionId, JSON.stringify(prForm))
    } else {
      onAction(inputModal.actionId, inputValue)
    }
    setInputModal(null)
    setInputValue('')
    setPrForm({ title: '', description: '', reviewer: '' })
  }

  function cancelModal() {
    setInputModal(null)
    setInputValue('')
  }

  return (
    <>
      <div className="gcc-action-panel">
        <div className="gcc-action-panel-header">
          <span className="gcc-action-panel-title">Available Actions</span>
          <span className="gcc-action-panel-hint">Think before you click</span>
        </div>
        <div className="gcc-action-grid">
          {shuffledActions.map(actionId => {
            const config = ACTION_CONFIGS[actionId]
            if (!config) return null
            return (
              <button
                key={actionId}
                className={`gcc-action-btn ${config.danger ? 'gcc-action-btn-danger' : ''}`}
                onClick={() => handleActionClick(actionId)}
                title={config.description}
              >
                <span className="gcc-action-emoji">{config.emoji}</span>
                <span className="gcc-action-label">{config.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {inputModal && (
        <div className="gcc-modal-overlay" role="dialog" aria-modal="true">
          <div className="gcc-modal">
            {inputModal.type === 'commit-message' && (
              <>
                <h3 className="gcc-modal-title">💾 Write a Commit Message</h3>
                <p className="gcc-modal-hint">Explain WHY — future teammates will thank you.</p>
                <input
                  className="gcc-modal-input"
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder='e.g. "Fix null pointer in auth middleware"'
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && submitModal()}
                />
              </>
            )}

            {inputModal.type === 'branch-name' && (
              <>
                <h3 className="gcc-modal-title">🌿 Name Your Branch</h3>
                <p className="gcc-modal-hint">Use descriptive names like "feature/dark-mode" or "hotfix/login-bug".</p>
                <input
                  className="gcc-modal-input"
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder='e.g. "feature/dark-mode"'
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && submitModal()}
                />
              </>
            )}

            {inputModal.type === 'confirm' && (
              <>
                <h3 className="gcc-modal-title">🔀 Switch Branch</h3>
                <p className="gcc-modal-hint">
                  Switch to: <strong>{inputValue}</strong>
                </p>
              </>
            )}

            {inputModal.type === 'conflict-choice' && (
              <>
                <h3 className="gcc-modal-title">⚡ Resolve Conflict</h3>
                <p className="gcc-modal-hint">Use the Conflict Resolver panel to choose a resolution, then run Resolve again.</p>
                <div className="gcc-conflict-choice-btns">
                  <button className="gcc-btn gcc-btn-outline" onClick={() => { onAction(inputModal.actionId, 'current'); setInputModal(null) }}>Keep Current</button>
                  <button className="gcc-btn gcc-btn-outline gcc-btn-incoming" onClick={() => { onAction(inputModal.actionId, 'incoming'); setInputModal(null) }}>Keep Incoming</button>
                  <button className="gcc-btn gcc-btn-primary" onClick={() => { onAction(inputModal.actionId, 'both'); setInputModal(null) }}>Keep Both</button>
                </div>
                <button className="gcc-btn gcc-btn-ghost" style={{ marginTop: '0.5rem' }} onClick={cancelModal}>Cancel</button>
                <div style={{ display: 'none' }} />
              </>
            )}

            {inputModal.type === 'pr-form' && (
              <>
                <h3 className="gcc-modal-title">📬 Open Pull Request</h3>
                <label className="gcc-modal-label">Title *</label>
                <input
                  className="gcc-modal-input"
                  type="text"
                  value={prForm.title}
                  onChange={e => setPrForm(f => ({ ...f, title: e.target.value }))}
                  placeholder='e.g. "Add payment UI"'
                  autoFocus
                />
                <label className="gcc-modal-label">Description</label>
                <textarea
                  className="gcc-modal-input gcc-modal-textarea"
                  value={prForm.description}
                  onChange={e => setPrForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What does this PR do? Why?"
                  rows={3}
                />
                <label className="gcc-modal-label">Reviewer (optional)</label>
                <input
                  className="gcc-modal-input"
                  type="text"
                  value={prForm.reviewer}
                  onChange={e => setPrForm(f => ({ ...f, reviewer: e.target.value }))}
                  placeholder='e.g. "alex.dev"'
                />
              </>
            )}

            {inputModal.type !== 'conflict-choice' && (
              <div className="gcc-modal-actions">
                <button className="gcc-btn gcc-btn-primary" onClick={submitModal}>
                  Confirm
                </button>
                <button className="gcc-btn gcc-btn-ghost" onClick={cancelModal}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
