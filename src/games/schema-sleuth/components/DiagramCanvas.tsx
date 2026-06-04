import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent } from 'react'

import type {
  Cardinality,
  CaseDefinition,
  DiagramRelationship,
  LessonPhase,
  PlacedEntity,
} from '@/games/schema-sleuth/types'

const MOBILE_CARD_WIDTH = 172
const DESKTOP_CARD_WIDTH = 196
const CARD_TOP = 58
const ROW_HEIGHT = 20
const CARD_BOTTOM = 14
const MAX_PREVIEW_ROWS = 3

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getCardinalitySides(cardinality: string) {
  const [fromSide = '1', toSide = '1'] = cardinality.split(':')
  return {
    fromSide,
    toSide,
  }
}

function getCardinalityMarker(side: string) {
  return side === 'M'
    ? 'url(#schema-sleuth-cardinality-many)'
    : 'url(#schema-sleuth-cardinality-one)'
}

function getQuadraticPoint(
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number,
  t: number
) {
  const inverse = 1 - t

  return {
    x: inverse * inverse * startX + 2 * inverse * t * controlX + t * t * endX,
    y: inverse * inverse * startY + 2 * inverse * t * controlY + t * t * endY,
  }
}

function getQuadraticTangent(
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number,
  t: number
) {
  return {
    x: 2 * (1 - t) * (controlX - startX) + 2 * t * (endX - controlX),
    y: 2 * (1 - t) * (controlY - startY) + 2 * t * (endY - controlY),
  }
}

function normalizeVector(x: number, y: number) {
  const length = Math.hypot(x, y) || 1

  return {
    x: x / length,
    y: y / length,
  }
}

function getRectangleCenter(position: { left: number; top: number; width: number; height: number }) {
  return {
    x: position.left + position.width / 2,
    y: position.top + position.height / 2,
  }
}

function getRectangleEdgePoint(
  position: { left: number; top: number; width: number; height: number },
  targetX: number,
  targetY: number
) {
  const center = getRectangleCenter(position)
  const halfWidth = Math.max(position.width / 2, 1)
  const halfHeight = Math.max(position.height / 2, 1)
  const dx = targetX - center.x
  const dy = targetY - center.y

  if (dx === 0 && dy === 0) {
    return center
  }

  const scale = 1 / Math.max(Math.abs(dx) / halfWidth, Math.abs(dy) / halfHeight)

  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  }
}

function getOffsetCurvePoint(
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number,
  t: number,
  offset: number
) {
  const point = getQuadraticPoint(startX, startY, controlX, controlY, endX, endY, t)
  const tangent = getQuadraticTangent(startX, startY, controlX, controlY, endX, endY, t)
  const tangentUnit = normalizeVector(tangent.x, tangent.y)
  const normalCandidate = {
    x: -tangentUnit.y,
    y: tangentUnit.x,
  }
  const controlVector = {
    x: controlX - point.x,
    y: controlY - point.y,
  }
  const normal = normalCandidate.x * controlVector.x + normalCandidate.y * controlVector.y >= 0
    ? normalCandidate
    : {
        x: -normalCandidate.x,
        y: -normalCandidate.y,
      }

  return {
    x: point.x + normal.x * offset,
    y: point.y + normal.y * offset,
  }
}

interface RelationshipLayout {
  id: string
  path: string
  cardinality: Cardinality
  fromSide: string
  toSide: string
  fromLabelPoint: { x: number; y: number }
  toLabelPoint: { x: number; y: number }
  centerLabelPoint: { x: number; y: number }
}

function getNodeMetrics(boardWidth: number, attributeCount: number) {
  const width = boardWidth < 720 ? MOBILE_CARD_WIDTH : DESKTOP_CARD_WIDTH
  const rows = Math.max(Math.min(attributeCount, MAX_PREVIEW_ROWS), 1)
  const height = CARD_TOP + rows * ROW_HEIGHT + CARD_BOTTOM
  return {
    width,
    height,
  }
}

function getPixelPosition(entity: PlacedEntity, boardSize: { width: number; height: number }) {
  const metrics = getNodeMetrics(boardSize.width, entity.attributeIds.length)
  const usableWidth = Math.max(boardSize.width - metrics.width, 1)
  const usableHeight = Math.max(boardSize.height - metrics.height, 1)

  return {
    left: entity.x * usableWidth,
    top: entity.y * usableHeight,
    ...metrics,
  }
}

interface DiagramCanvasProps {
  caseDefinition: CaseDefinition
  phase: LessonPhase
  entities: PlacedEntity[]
  relationships: DiagramRelationship[]
  selectedEntityId: string | null
  onSelectEntity: (entityId: string | null) => void
  onPlaceEntity: (entityId: string, x: number, y: number) => void
  onMoveEntity: (entityId: string, x: number, y: number) => void
  onRemoveEntity: (entityId: string) => void
  onSubmit: () => void
}

export function DiagramCanvas({
  caseDefinition,
  phase,
  entities,
  relationships,
  selectedEntityId,
  onSelectEntity,
  onPlaceEntity,
  onMoveEntity,
  onRemoveEntity,
  onSubmit,
}: DiagramCanvasProps) {
  const boardRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<{
    entityId: string
    offsetX: number
    offsetY: number
    attributeCount: number
  } | null>(null)
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 })
  const blueprintMap = new Map(caseDefinition.bank.map(entity => [entity.id, entity]))

  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const boardElement = board

    function updateBoardSize() {
      setBoardSize({
        width: boardElement.clientWidth,
        height: boardElement.clientHeight,
      })
    }

    updateBoardSize()

    const observer = new ResizeObserver(updateBoardSize)
    observer.observe(boardElement)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function handlePointerMove(event: globalThis.PointerEvent) {
      const dragState = dragStateRef.current
      const board = boardRef.current
      if (!dragState || !board) return

      const rect = board.getBoundingClientRect()
      const metrics = getNodeMetrics(rect.width, dragState.attributeCount)
      const usableWidth = Math.max(rect.width - metrics.width, 1)
      const usableHeight = Math.max(rect.height - metrics.height, 1)
      const nextLeft = event.clientX - rect.left - dragState.offsetX
      const nextTop = event.clientY - rect.top - dragState.offsetY

      onMoveEntity(
        dragState.entityId,
        clamp(nextLeft / usableWidth, 0, 1),
        clamp(nextTop / usableHeight, 0, 1)
      )
    }

    function handlePointerUp() {
      dragStateRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [onMoveEntity])

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()

    const entityId = event.dataTransfer.getData('text/schema-entity')
    const board = boardRef.current
    if (!entityId || !board) return

    const rect = board.getBoundingClientRect()
    const metrics = getNodeMetrics(rect.width, 0)
    const usableWidth = Math.max(rect.width - metrics.width, 1)
    const usableHeight = Math.max(rect.height - metrics.height, 1)
    const nextLeft = event.clientX - rect.left - metrics.width / 2
    const nextTop = event.clientY - rect.top - 32

    onPlaceEntity(
      entityId,
      clamp(nextLeft / usableWidth, 0, 1),
      clamp(nextTop / usableHeight, 0, 1)
    )
  }

  function handlePointerDown(entity: PlacedEntity, event: PointerEvent<HTMLDivElement>) {
    const board = boardRef.current
    if (!board) return

    const rect = board.getBoundingClientRect()
    const position = getPixelPosition(entity, boardSize)

    dragStateRef.current = {
      entityId: entity.id,
      offsetX: event.clientX - rect.left - position.left,
      offsetY: event.clientY - rect.top - position.top,
      attributeCount: entity.attributeIds.length,
    }
  }

  const relationshipLayouts: RelationshipLayout[] = relationships.flatMap(relationship => {
      const fromEntity = entities.find(entity => entity.id === relationship.from)
      const toEntity = entities.find(entity => entity.id === relationship.to)
      if (!fromEntity || !toEntity) return []

      const fromPosition = getPixelPosition(fromEntity, boardSize)
      const toPosition = getPixelPosition(toEntity, boardSize)
      const fromCenter = getRectangleCenter(fromPosition)
      const toCenter = getRectangleCenter(toPosition)
      const direction = normalizeVector(toCenter.x - fromCenter.x, toCenter.y - fromCenter.y)
      const gap = Math.min(18, Math.max(10, Math.hypot(toCenter.x - fromCenter.x, toCenter.y - fromCenter.y) * 0.08))
      const rawFromPoint = getRectangleEdgePoint(fromPosition, toCenter.x, toCenter.y)
      const rawToPoint = getRectangleEdgePoint(toPosition, fromCenter.x, fromCenter.y)
      const fromX = rawFromPoint.x + direction.x * gap
      const fromY = rawFromPoint.y + direction.y * gap
      const toX = rawToPoint.x - direction.x * gap
      const toY = rawToPoint.y - direction.y * gap
      const midpoint = {
        x: (fromX + toX) / 2,
        y: (fromY + toY) / 2,
      }
      const baseNormal = normalizeVector(-direction.y, direction.x)
      const curveNormal = baseNormal.y <= 0 ? baseNormal : { x: -baseNormal.x, y: -baseNormal.y }
      const curveOffset = Math.max(34, Math.min(74, Math.hypot(toX - fromX, toY - fromY) * 0.2))
      const controlX = midpoint.x + curveNormal.x * curveOffset
      const controlY = midpoint.y + curveNormal.y * curveOffset
      const { fromSide, toSide } = getCardinalitySides(relationship.cardinality)

      return [{
        id: relationship.id,
        path: `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`,
        cardinality: relationship.cardinality,
        fromSide,
        toSide,
        fromLabelPoint: getOffsetCurvePoint(fromX, fromY, controlX, controlY, toX, toY, 0.18, 18),
        toLabelPoint: getOffsetCurvePoint(fromX, fromY, controlX, controlY, toX, toY, 0.82, 18),
        centerLabelPoint: getOffsetCurvePoint(fromX, fromY, controlX, controlY, toX, toY, 0.5, 22),
      }]
    })

  return (
    <section className="aa-panel ss-panel ss-board-panel">
      <div className="ss-panel-header">
        <div>
          <p className="pal-kicker">Case Board</p>
          <h2 className="ss-panel-title">Organize the chaos</h2>
        </div>
        <button className="pal-btn pal-btn-primary" type="button" onClick={onSubmit}>
          Submit diagram
        </button>
      </div>

      <div
        ref={boardRef}
        className="ss-board-surface"
        onDragOver={event => event.preventDefault()}
        onDrop={handleDrop}
      >
        <svg className="ss-links-layer" aria-hidden="true">
          <defs>
            <marker
              id="schema-sleuth-cardinality-one"
              markerWidth="12"
              markerHeight="14"
              refX="0"
              refY="7"
              orient="auto-start-reverse"
              markerUnits="strokeWidth"
            >
              <path d="M 0 1 L 0 13" className="ss-cardinality-marker" />
            </marker>
            <marker
              id="schema-sleuth-cardinality-many"
              markerWidth="14"
              markerHeight="14"
              refX="0"
              refY="7"
              orient="auto-start-reverse"
              markerUnits="strokeWidth"
            >
              <path d="M 0 7 L 13 1 M 0 7 L 13 7 M 0 7 L 13 13" className="ss-cardinality-marker" />
            </marker>
          </defs>

          {relationshipLayouts.map(layout => (
            <path
              key={layout.id}
              d={layout.path}
              className="ss-link-path"
              markerStart={getCardinalityMarker(layout.fromSide)}
              markerEnd={getCardinalityMarker(layout.toSide)}
            />
          ))}
        </svg>

        <svg className="ss-link-labels-layer" aria-hidden="true">
          {relationshipLayouts.map(layout => (
            <g key={`${layout.id}-labels`}>
              <text
                x={layout.fromLabelPoint.x}
                y={layout.fromLabelPoint.y}
                textAnchor="middle"
                className="ss-link-end-text"
              >
                {layout.fromSide}
              </text>
              <text
                x={layout.toLabelPoint.x}
                y={layout.toLabelPoint.y}
                textAnchor="middle"
                className="ss-link-end-text"
              >
                {layout.toSide}
              </text>
              <text
                x={layout.centerLabelPoint.x}
                y={layout.centerLabelPoint.y}
                textAnchor="middle"
                className="ss-link-text"
              >
                {layout.cardinality}
              </text>
            </g>
          ))}
        </svg>

        {entities.length === 0 && (
          <div className="ss-board-empty">
            <p>Drop cards here.</p>
          </div>
        )}

        {entities.map(entity => {
          const blueprint = blueprintMap.get(entity.id)
          if (!blueprint) return null

          const selectedAttributes = blueprint.attributes.filter(attribute => entity.attributeIds.includes(attribute.id))
          const visibleAttributes = selectedAttributes.slice(0, MAX_PREVIEW_ROWS)
          const hiddenCount = Math.max(0, selectedAttributes.length - visibleAttributes.length)
          const position = getPixelPosition(entity, boardSize)

          return (
            <article
              key={entity.id}
              className={`ss-node-card ${selectedEntityId === entity.id ? 'is-selected' : ''}`}
              style={{
                '--ss-accent': blueprint.accent,
                left: `${position.left}px`,
                top: `${position.top}px`,
                width: `${position.width}px`,
                minHeight: `${position.height}px`,
              } as CSSProperties}
              onClick={() => onSelectEntity(entity.id)}
            >
              <div className="ss-node-header">
                <div
                  className="ss-node-handle"
                  onPointerDown={event => {
                    event.stopPropagation()
                    handlePointerDown(entity, event)
                  }}
                  onClick={event => event.stopPropagation()}
                >
                  <span className="ss-node-grip" aria-hidden="true">⋮⋮</span>
                </div>
                <button
                  className="ss-node-remove"
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    onRemoveEntity(entity.id)
                  }}
                >
                  ×
                </button>
              </div>

              <div className="ss-node-title-row">
                <span className="ss-node-swatch" />
                <h3>{blueprint.label}</h3>
              </div>

              <div className="ss-node-attrs">
                {selectedAttributes.length > 0 ? (
                  visibleAttributes.map(attribute => (
                    <div key={attribute.id} className="ss-node-attr-row">
                      <span>{attribute.label}</span>
                      <span className={`ss-role-pill role-${attribute.role}`}>
                        {attribute.role === 'pk' ? 'PK' : attribute.role === 'fk' ? 'FK' : 'Field'}
                      </span>
                    </div>
                  )).concat(
                    hiddenCount > 0
                      ? [
                          <div key={`${entity.id}-more`} className="ss-node-attr-row is-empty">
                            <span>+{hiddenCount} more</span>
                          </div>,
                        ]
                      : []
                  )
                ) : (
                  <div className="ss-node-attr-row is-empty">
                    <span>{phase === 'entities' ? 'Placed' : 'Tap to edit'}</span>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
