import type { CSSProperties } from 'react'

import { CardinalityCoach } from '@/games/schema-sleuth/components/CardinalityCoach'
import type { Cardinality, CaseDefinition, DiagramRelationship, PlacedEntity } from '@/games/schema-sleuth/types'

type RelationshipDraft = {
  from: string
  to: string
  cardinality: Cardinality
}

interface EntityEditorModalProps {
  caseDefinition: CaseDefinition
  entities: PlacedEntity[]
  selectedEntityId: string | null
  relationships: DiagramRelationship[]
  relationshipDraft: RelationshipDraft
  onClose: () => void
  onToggleAttribute: (entityId: string, attributeId: string) => void
  onRelationshipDraftChange: (draft: RelationshipDraft) => void
  onAddRelationship: () => void
  onRemoveRelationship: (relationshipId: string) => void
  onRemoveEntity: (entityId: string) => void
}

function roleLabel(role: 'pk' | 'fk' | 'field') {
  if (role === 'pk') return 'PK'
  if (role === 'fk') return 'FK'
  return 'Field'
}

export function EntityEditorModal({
  caseDefinition,
  entities,
  selectedEntityId,
  relationships,
  relationshipDraft,
  onClose,
  onToggleAttribute,
  onRelationshipDraftChange,
  onAddRelationship,
  onRemoveRelationship,
  onRemoveEntity,
}: EntityEditorModalProps) {
  const selectedEntity = entities.find(entity => entity.id === selectedEntityId) ?? null
  const selectedBlueprint = selectedEntity
    ? caseDefinition.bank.find(entity => entity.id === selectedEntity.id) ?? null
    : null

  if (!selectedEntity || !selectedBlueprint) return null

  const relatedRelationships = relationships.filter(
    relationship => relationship.from === selectedEntity.id || relationship.to === selectedEntity.id
  )
  const showFields = caseDefinition.phase === 'attributes' || caseDefinition.phase === 'full'
  const showRelationships = caseDefinition.phase === 'relationships' || caseDefinition.phase === 'full'
  const showCardinalityCoach = caseDefinition.phase === 'relationships' && caseDefinition.cardinalityExample

  return (
    <div className="ss-editor-overlay" onClick={onClose}>
      <div className="aa-panel ss-panel ss-editor-card" onClick={event => event.stopPropagation()}>
        <div className="ss-editor-top">
          <div className="ss-editor-title-row" style={{ '--ss-accent': selectedBlueprint.accent } as CSSProperties}>
            <span className="ss-node-swatch" />
            <div>
              <p className="pal-kicker">Edit</p>
              <h2 className="ss-panel-title">{selectedBlueprint.label}</h2>
            </div>
          </div>

          <button className="pal-btn pal-btn-ghost ss-mini-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className={`ss-editor-grid ${showFields !== showRelationships ? 'is-single' : ''}`}>
          {showFields && (
            <section className="ss-editor-section">
              <div className="ss-section-head">
                <h3>Fields</h3>
              </div>

              <div className="ss-attr-grid">
                {selectedBlueprint.attributes.map(attribute => {
                  const isSelected = selectedEntity.attributeIds.includes(attribute.id)

                  return (
                    <button
                      key={attribute.id}
                      type="button"
                      className={`ss-attr-button ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => onToggleAttribute(selectedEntity.id, attribute.id)}
                    >
                      <span className="ss-attr-name">{attribute.label}</span>
                      <span className={`ss-role-pill role-${attribute.role}`}>{roleLabel(attribute.role)}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {showRelationships && (
            <section className="ss-editor-section">
              <div className="ss-section-head">
                <h3>Relationships</h3>
              </div>

              {showCardinalityCoach && (
                <CardinalityCoach example={showCardinalityCoach} />
              )}

              <div className="ss-inline-form">
                <label className="ss-form-field">
                  <span>To</span>
                  <select
                    className="ss-select"
                    value={relationshipDraft.to}
                    onChange={event => onRelationshipDraftChange({
                      ...relationshipDraft,
                      to: event.target.value,
                    })}
                  >
                    <option value="">Choose entity</option>
                    {entities
                      .filter(entity => entity.id !== selectedEntity.id)
                      .map(entity => {
                        const blueprint = caseDefinition.bank.find(item => item.id === entity.id)
                        return (
                          <option key={entity.id} value={entity.id}>
                            {blueprint?.label ?? entity.id}
                          </option>
                        )
                      })}
                  </select>
                </label>

                <label className="ss-form-field">
                  <span>Cardinality</span>
                  <select
                    className="ss-select"
                    value={relationshipDraft.cardinality}
                    onChange={event => onRelationshipDraftChange({
                      ...relationshipDraft,
                      cardinality: event.target.value as Cardinality,
                    })}
                  >
                    <option value="1:1">1:1</option>
                    <option value="1:M">1:M</option>
                    <option value="M:M">M:M</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                className="pal-btn pal-btn-primary ss-wide-btn"
                disabled={!relationshipDraft.to || relationshipDraft.to === selectedEntity.id}
                onClick={onAddRelationship}
              >
                Map link
              </button>

              <div className="ss-link-list">
                {relatedRelationships.length === 0 ? (
                  <div className="ss-empty-state">
                    <p>No links yet.</p>
                  </div>
                ) : (
                  relatedRelationships.map(relationship => {
                    const fromLabel = caseDefinition.bank.find(entity => entity.id === relationship.from)?.label ?? relationship.from
                    const toLabel = caseDefinition.bank.find(entity => entity.id === relationship.to)?.label ?? relationship.to

                    return (
                      <div key={relationship.id} className="ss-link-row">
                        <p className="ss-link-pill">
                          {fromLabel} <strong>{relationship.cardinality}</strong> → {toLabel}
                        </p>
                        <button
                          type="button"
                          className="pal-btn pal-btn-ghost ss-mini-btn"
                          onClick={() => onRemoveRelationship(relationship.id)}
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          )}
        </div>

        <div className="ss-editor-actions">
          <button
            className="pal-btn pal-btn-ghost"
            type="button"
            onClick={() => onRemoveEntity(selectedEntity.id)}
          >
            Remove card
          </button>
          <button className="pal-btn pal-btn-primary" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
