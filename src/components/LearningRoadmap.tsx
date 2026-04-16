import { useState, type CSSProperties } from 'react'
import './LearningRoadmap.css'

export interface RoadmapLevel {
  id: string
  title: string
  subtitle: string
  icon: string
  conceptTitle: string
  conceptBody: string
  conceptHighlight?: string
}

interface LearningRoadmapProps {
  gameName: string
  gameEmoji: string
  themeColor: string
  completedIds: Set<string>
  levels: RoadmapLevel[]
  onPlay: (levelIdx: number) => void
  onExit: () => void
}

type NodeStatus = 'done' | 'current' | 'locked'

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function LearningRoadmap({
  gameName,
  gameEmoji,
  themeColor,
  completedIds,
  levels,
  onPlay,
  onExit,
}: LearningRoadmapProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const currentIdx = levels.findIndex(level => !completedIds.has(level.id))
  const allDone = currentIdx === -1
  const sides = ['right', 'left', 'right', 'left', 'right', 'left'] as const

  function getStatus(idx: number): NodeStatus {
    if (completedIds.has(levels[idx].id)) return 'done'
    if (idx === currentIdx || allDone) return 'current'
    return 'locked'
  }

  function handleNodeClick(idx: number) {
    if (getStatus(idx) === 'locked') return
    setExpandedIdx(prev => (prev === idx ? null : idx))
  }

  const themeVars = {
    '--rm-theme': themeColor,
    '--rm-theme-soft': hexToRgba(themeColor, 0.18),
    '--rm-theme-faint': hexToRgba(themeColor, 0.1),
    '--rm-theme-border': hexToRgba(themeColor, 0.52),
    '--rm-theme-shadow': hexToRgba(themeColor, 0.32),
  } as CSSProperties

  return (
    <div className="rm-shell" style={themeVars}>
      <div className="rm-topbar">
        <button className="rm-ui-btn rm-ui-btn-ghost" onClick={onExit}>
          ← Exit
        </button>

        <div className="rm-title-banner">
          <div className="rm-title-sticker">{gameEmoji}</div>
          <div className="rm-title-copy">
            <p className="rm-title-kicker">Quest Board</p>
            <h1 className="rm-title-name">{gameName}</h1>
            <p className="rm-title-sub">Pick a stop on the path, crack the concept, then jump into the level.</p>
          </div>
        </div>

        <div className="rm-progress-panel" aria-label="Roadmap progress">
          <span className="rm-progress-value">{completedIds.size}/{levels.length}</span>
          <span className="rm-progress-label">stages cleared</span>
        </div>
      </div>

      {allDone && (
        <div className="rm-banner">
          <span className="rm-banner-burst">★</span>
          <span>Board cleared. Every stage is unlocked for replay.</span>
        </div>
      )}

      <div className="rm-track">
        <div className="rm-track-spine" aria-hidden="true" />

        {levels.map((level, idx) => {
          const status = getStatus(idx)
          const isExpanded = expandedIdx === idx
          const side = sides[idx % sides.length]
          const tilt = side === 'left' ? '-2deg' : '2deg'
          const statusLabel = status === 'done' ? 'Cleared' : status === 'current' ? 'Ready Now' : 'Locked'

          return (
            <div key={level.id} className={`rm-stage rm-stage-${side}`}>
              <button
                className={`rm-node rm-node-${status} ${isExpanded ? 'is-expanded' : ''}`}
                disabled={status === 'locked'}
                onClick={() => handleNodeClick(idx)}
                style={{ '--rm-tilt': tilt } as CSSProperties}
              >
                <div className="rm-node-icon-wrap">
                  <span className="rm-node-level">0{idx + 1}</span>
                  <span className="rm-node-icon" aria-hidden="true">
                    {status === 'locked' ? '🔒' : level.icon}
                  </span>
                  {status === 'done' && <span className="rm-node-status-mark">✓</span>}
                </div>

                <div className="rm-node-copy">
                  <span className="rm-node-status">{statusLabel}</span>
                  <div className="rm-node-title">{level.title}</div>
                  <div className="rm-node-subtitle">{level.subtitle}</div>
                </div>

                {status !== 'locked' && (
                  <span className={`rm-node-chevron ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">
                    ▶
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="rm-detail-card">
                  <div className="rm-detail-chip">Concept Card</div>
                  <h2 className="rm-detail-title">{level.conceptTitle}</h2>
                  <p className="rm-detail-body">{level.conceptBody}</p>

                  {level.conceptHighlight && (
                    <div className="rm-detail-highlight">
                      <span className="rm-detail-highlight-icon">!</span>
                      <p>{level.conceptHighlight}</p>
                    </div>
                  )}

                  <button
                    className="rm-ui-btn rm-ui-btn-primary"
                    onClick={() => {
                      setExpandedIdx(null)
                      onPlay(idx)
                    }}
                  >
                    {status === 'done' ? '↺ Replay Level' : '▶ Start Level'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
