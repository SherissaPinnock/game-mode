import type { CSSProperties, DragEvent } from 'react'

import type { CaseDefinition } from '@/games/schema-sleuth/types'

interface EntityTrayProps {
  caseDefinition: CaseDefinition
  placedEntityIds: Set<string>
  onPlaceEntity: (entityId: string) => void
}

export function EntityTray({
  caseDefinition,
  placedEntityIds,
  onPlaceEntity,
}: EntityTrayProps) {
  function handleDragStart(event: DragEvent<HTMLDivElement>, entityId: string) {
    event.dataTransfer.setData('text/schema-entity', entityId)
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <section className="aa-panel ss-panel ss-tray-panel">
      <div className="ss-panel-header ss-tray-header">
        <div>
          <p className="pal-kicker">Tray</p>
          <h2 className="ss-panel-title">Entities</h2>
        </div>
        <p className="ss-panel-copy">Drag or tap.</p>
      </div>

      <div className="ss-tray-row">
        {caseDefinition.bank.map(entity => {
          const isPlaced = placedEntityIds.has(entity.id)
          const isRequired = caseDefinition.requiredEntityIds.includes(entity.id)

          return (
            <div
              key={entity.id}
              className={`ss-tray-card ${isPlaced ? 'is-placed' : ''} ${isRequired ? 'is-core' : 'is-extra'}`}
              draggable={!isPlaced}
              onDragStart={event => handleDragStart(event, entity.id)}
              onClick={() => {
                if (!isPlaced) onPlaceEntity(entity.id)
              }}
              style={{ '--ss-accent': entity.accent } as CSSProperties}
            >
              <span className="ss-tray-swatch" />
              <div className="ss-tray-copy">
                <h3 className="ss-tray-title">{entity.label}</h3>
                <p>{entity.description}</p>
              </div>
              <span className="ss-tray-status">{isPlaced ? 'Added' : '+'}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
