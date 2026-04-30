import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
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

type RoadmapPoint = {
  x: number
  y: number
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function buildConnectorPath(points: RoadmapPoint[]) {
  if (points.length === 0) return ''

  let path = `M ${points[0].x} ${points[0].y}`

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const next = points[index]
    const verticalDistance = next.y - previous.y
    const controlOffset = Math.max(32, Math.min(120, Math.abs(verticalDistance) * 0.42))

    path += ` C ${previous.x} ${previous.y + controlOffset} ${next.x} ${next.y - controlOffset} ${next.x} ${next.y}`
  }

  return path
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
  const [mapPoints, setMapPoints] = useState<RoadmapPoint[]>([])
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 })
  const trackRef = useRef<HTMLDivElement | null>(null)
  const nodeRefs = useRef<Array<HTMLButtonElement | null>>([])

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
  const mapPath = buildConnectorPath(mapPoints)

  useLayoutEffect(() => {
    function updateMapLayout() {
      const trackElement = trackRef.current
      if (!trackElement) return

      const trackRect = trackElement.getBoundingClientRect()
      const midpoint = trackRect.width / 2
      const points = nodeRefs.current
        .slice(0, levels.length)
        .map(node => {
          if (!node) return null

          const rect = node.getBoundingClientRect()
          const leftEdge = rect.left - trackRect.left
          const rightEdge = rect.right - trackRect.left
          const leftDistance = Math.abs(leftEdge - midpoint)
          const rightDistance = Math.abs(rightEdge - midpoint)
          const anchorOffset = 12
          const anchorX = leftDistance <= rightDistance ? leftEdge - anchorOffset : rightEdge + anchorOffset
          const anchorY = rect.top - trackRect.top + rect.height / 2

          return {
            x: Math.max(18, Math.min(trackRect.width - 18, anchorX)),
            y: anchorY,
          }
        })
        .filter((point): point is RoadmapPoint => point !== null)

      setMapPoints(points)
      setMapSize({
        width: trackRect.width,
        height: trackRect.height,
      })
    }

    const frameId = window.requestAnimationFrame(updateMapLayout)
    window.addEventListener('resize', updateMapLayout)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', updateMapLayout)
    }
  }, [expandedIdx, levels.length])

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

      <div className="rm-track" ref={trackRef}>
        {mapPath && (
          <svg
            className="rm-track-map"
            aria-hidden="true"
            viewBox={`0 0 ${mapSize.width} ${mapSize.height}`}
            preserveAspectRatio="none"
          >
            <path className="rm-track-map-shadow" d={mapPath} />
            <path className="rm-track-map-path" d={mapPath} />

            {mapPoints.map((point, index) => (
              <circle
                key={`stop-${levels[index]?.id ?? index}`}
                className="rm-track-map-stop"
                cx={point.x}
                cy={point.y}
                r="7"
              />
            ))}
          </svg>
        )}

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
                ref={node => {
                  nodeRefs.current[idx] = node
                }}
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
