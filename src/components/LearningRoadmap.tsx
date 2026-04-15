import { useState } from 'react'

export interface RoadmapLevel {
  id: string
  title: string        // e.g. "Traffic 101"
  subtitle: string     // e.g. "Why servers crash under load"
  icon: string
  conceptTitle: string
  conceptBody: string
  conceptHighlight?: string
}

interface LearningRoadmapProps {
  gameName: string
  gameEmoji: string
  themeColor: string   // hex, e.g. "#6366f1"
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

  // Derive which level is "current" — first not-yet-completed
  const currentIdx = levels.findIndex(l => !completedIds.has(l.id))
  const allDone = currentIdx === -1

  function getStatus(idx: number): NodeStatus {
    if (completedIds.has(levels[idx].id)) return 'done'
    if (idx === currentIdx || allDone) return 'current'
    return 'locked'
  }

  function handleNodeClick(idx: number) {
    const status = getStatus(idx)
    if (status === 'locked') return
    setExpandedIdx(prev => (prev === idx ? null : idx))
  }

  // Zigzag direction per node
  const SIDES = ['right', 'left', 'right', 'left', 'right', 'left', 'right', 'left'] as const

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 16px 60px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflowX: 'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 520,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 0 8px',
      }}>
        <button
          onClick={onExit}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#94a3b8', borderRadius: 10, padding: '8px 14px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Exit
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 2 }}>{gameEmoji}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>{gameName}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>Learning Journey</div>
        </div>
        {/* Progress fraction */}
        <div style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '8px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: themeColor }}>
            {completedIds.size}/{levels.length}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>done</div>
        </div>
      </div>

      {/* ── All-done banner ─────────────────────────────────────────────────── */}
      {allDone && (
        <div style={{
          width: '100%', maxWidth: 520, margin: '12px 0',
          background: hexToRgba(themeColor, 0.15),
          border: `1.5px solid ${hexToRgba(themeColor, 0.4)}`,
          borderRadius: 14, padding: '14px 18px',
          textAlign: 'center', color: themeColor,
          fontSize: 14, fontWeight: 700,
        }}>
          🎉 Journey complete! Replay any level below.
        </div>
      )}

      {/* ── Road path ────────────────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 520,
        position: 'relative',
        paddingTop: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}>
        {levels.map((level, idx) => {
          const status = getStatus(idx)
          const isExpanded = expandedIdx === idx
          const side = SIDES[idx % SIDES.length]
          const isLast = idx === levels.length - 1

          // Colours by status
          const nodeColor = status === 'done'
            ? '#22c55e'
            : status === 'current'
            ? themeColor
            : '#334155'
          const textColor = status === 'locked' ? '#475569' : '#e2e8f0'
          const subtitleColor = status === 'locked' ? '#334155' : '#94a3b8'

          return (
            <div key={level.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {/* Node row — alternates left/right */}
              <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
                position: 'relative',
                paddingLeft: side === 'left' ? 0 : 0,
              }}>
                {/* Connecting line on the opposite side (decorative) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 36,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 2,
                    height: isLast ? 0 : 64,
                    background: status === 'done'
                      ? `linear-gradient(to bottom, #22c55e, ${nextNodeColor(idx)})`
                      : 'rgba(255,255,255,0.06)',
                    borderRadius: 1,
                  }}
                />

                {/* Node card */}
                <button
                  onClick={() => handleNodeClick(idx)}
                  disabled={status === 'locked'}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: isExpanded
                      ? hexToRgba(themeColor, 0.12)
                      : status === 'locked'
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(255,255,255,0.06)',
                    border: isExpanded
                      ? `1.5px solid ${hexToRgba(themeColor, 0.5)}`
                      : status === 'done'
                      ? '1.5px solid rgba(34,197,94,0.3)'
                      : status === 'current'
                      ? `1.5px solid ${hexToRgba(themeColor, 0.4)}`
                      : '1.5px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    cursor: status === 'locked' ? 'default' : 'pointer',
                    textAlign: 'left',
                    width: 'calc(100% - 32px)',
                    maxWidth: 300,
                    margin: side === 'left' ? '0 0 0 0' : '0 0 0 auto',
                    transition: 'all 0.2s',
                    boxShadow: status === 'current' && !isExpanded
                      ? `0 0 0 3px ${hexToRgba(themeColor, 0.2)}`
                      : 'none',
                    animation: status === 'current' && !isExpanded ? 'rm-pulse 2.5s ease-in-out infinite' : 'none',
                  }}
                >
                  {/* Icon circle */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: status === 'done'
                      ? 'rgba(34,197,94,0.15)'
                      : status === 'current'
                      ? hexToRgba(themeColor, 0.15)
                      : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${nodeColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: status === 'locked' ? 18 : 22,
                    position: 'relative',
                  }}>
                    {status === 'locked' ? '🔒' : level.icon}
                    {/* Checkmark badge */}
                    {status === 'done' && (
                      <div style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#22c55e', border: '2px solid #0f172a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10,
                      }}>✓</div>
                    )}
                    {/* "Active" dot */}
                    {status === 'current' && (
                      <div style={{
                        position: 'absolute', top: -3, right: -3,
                        width: 12, height: 12, borderRadius: '50%',
                        background: themeColor, border: '2px solid #0f172a',
                      }} />
                    )}
                  </div>

                  {/* Text */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: nodeColor, marginBottom: 3,
                    }}>
                      {status === 'done' ? 'Completed' : status === 'current' ? 'Up Next' : `Level ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textColor, lineHeight: 1.3, marginBottom: 3 }}>
                      {level.title}
                    </div>
                    <div style={{ fontSize: 12, color: subtitleColor, lineHeight: 1.4 }}>
                      {level.subtitle}
                    </div>
                  </div>

                  {/* Chevron */}
                  {status !== 'locked' && (
                    <div style={{
                      color: '#475569', fontSize: 12, flexShrink: 0,
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}>▶</div>
                  )}
                </button>
              </div>

              {/* Expanded concept panel */}
              {isExpanded && (
                <div style={{
                  width: 'calc(100% - 0px)', maxWidth: 460,
                  margin: '12px 0 0',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${hexToRgba(themeColor, 0.25)}`,
                  borderRadius: 14,
                  padding: '18px 20px',
                  display: 'flex', flexDirection: 'column', gap: 14,
                  alignSelf: 'center',
                }}>
                  {/* Concept content */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                      Concept
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
                      {level.conceptTitle}
                    </div>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.75, margin: 0 }}>
                      {level.conceptBody}
                    </p>
                  </div>

                  {level.conceptHighlight && (
                    <div style={{
                      background: hexToRgba(themeColor, 0.08),
                      border: `1px solid ${hexToRgba(themeColor, 0.25)}`,
                      borderRadius: 10, padding: '10px 14px',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                      <span style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, fontWeight: 500 }}>
                        {level.conceptHighlight}
                      </span>
                    </div>
                  )}

                  {/* Play button */}
                  <button
                    onClick={() => { setExpandedIdx(null); onPlay(idx) }}
                    style={{
                      padding: '13px', borderRadius: 12, border: 'none',
                      background: themeColor, color: '#fff',
                      fontWeight: 800, fontSize: 14, cursor: 'pointer',
                      boxShadow: `0 4px 20px ${hexToRgba(themeColor, 0.4)}`,
                      width: '100%',
                    }}
                  >
                    {status === 'done' ? '↺ Replay Level' : '▶  Start Level'}
                  </button>
                </div>
              )}

              {/* Gap between nodes (path connector space) */}
              {!isLast && <div style={{ height: 28 }} />}
            </div>
          )
        })}
      </div>

      {/* Pulse animation injected globally */}
      <style>{`
        @keyframes rm-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
          50%       { box-shadow: 0 0 0 8px rgba(99,102,241,0.05); }
        }
      `}</style>
    </div>
  )

  // Helper: colour of the next node (for gradient line)
  function nextNodeColor(idx: number): string {
    const nextStatus = getStatus(idx + 1)
    return nextStatus === 'done' ? '#22c55e'
      : nextStatus === 'current' ? themeColor
      : 'rgba(255,255,255,0.06)'
  }
}
