import type {
  CaseDefinition,
  DiagramAttempt,
  DiagramRelationship,
  EntityBlueprint,
  EvaluationResult,
} from '@/games/schema-sleuth/types'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getRequiredAttributes(entity: EntityBlueprint) {
  return entity.attributes.filter(attribute => attribute.required)
}

function isSameUndirectedPair(left: DiagramRelationship, right: DiagramRelationship) {
  return (
    (left.from === right.from && left.to === right.to) ||
    (left.from === right.to && left.to === right.from)
  )
}

export function evaluateDiagram(caseDefinition: CaseDefinition, attempt: DiagramAttempt): EvaluationResult {
  const { phase } = caseDefinition
  const usesAttributes = phase === 'attributes' || phase === 'full'
  const usesRelationships = phase === 'relationships' || phase === 'full'
  const requiredEntityIds = caseDefinition.requiredEntityIds
  const requiredEntitySet = new Set(requiredEntityIds)
  const placedEntitySet = new Set(attempt.entities.map(entity => entity.id))
  const entityLookup = new Map(caseDefinition.bank.map(entity => [entity.id, entity]))

  const matchedEntityIds = requiredEntityIds.filter(entityId => placedEntitySet.has(entityId))
  const missingEntityIds = requiredEntityIds.filter(entityId => !placedEntitySet.has(entityId))
  const extraEntityIds = attempt.entities
    .map(entity => entity.id)
    .filter(entityId => !requiredEntitySet.has(entityId))

  let requiredAttributeTotal = 0
  let matchedAttributeCount = 0
  const feedback: string[] = []
  const praise: string[] = []

  let entityStructureIssues = 0

  for (const requiredEntityId of requiredEntityIds) {
    const entity = entityLookup.get(requiredEntityId)
    const placedEntity = attempt.entities.find(item => item.id === requiredEntityId)

    if (!entity) continue

    const requiredAttributes = getRequiredAttributes(entity)
    requiredAttributeTotal += requiredAttributes.length

    if (!placedEntity) continue

    const selectedAttributeSet = new Set(placedEntity.attributeIds)
    const matchedAttributes = requiredAttributes.filter(attribute => selectedAttributeSet.has(attribute.id))
    const missingAttributes = requiredAttributes.filter(attribute => !selectedAttributeSet.has(attribute.id))

    matchedAttributeCount += matchedAttributes.length

    if (missingAttributes.length > 0) {
      entityStructureIssues += 1
    }
  }

  const relationshipTotal = usesRelationships ? caseDefinition.relationships.length : 0
  let relationshipMatches = 0
  let reversedLinkCount = 0
  let wrongCardinalityCount = 0
  let missingLinkCount = 0

  for (const solution of usesRelationships ? caseDefinition.relationships : []) {
    const exactMatch = attempt.relationships.find(
      relationship => {
        if (relationship.cardinality !== solution.cardinality) {
          return false
        }

        if (solution.cardinality === 'M:M') {
          return isSameUndirectedPair(relationship, solution)
        }

        return relationship.from === solution.from && relationship.to === solution.to
      }
    )

    if (exactMatch) {
      relationshipMatches += 1
      continue
    }

    const sameDirection = attempt.relationships.find(
      relationship => relationship.from === solution.from && relationship.to === solution.to
    )
    const reverseDirection = attempt.relationships.find(
      relationship => relationship.from === solution.to && relationship.to === solution.from
    )

    if (sameDirection) {
      wrongCardinalityCount += 1
      continue
    }

    if (reverseDirection) {
      reversedLinkCount += 1
      continue
    }

    missingLinkCount += 1
  }

  const unexpectedRelationships = attempt.relationships.filter(relationship => {
    return !caseDefinition.relationships.some(solution => isSameUndirectedPair(relationship, solution))
  })

  if (missingEntityIds.length > 0) {
    feedback.push('The entity set does not match the brief yet.')
  }

  if (usesAttributes && entityStructureIssues > 0) {
    feedback.push('One or more cards still need cleaner fields or keys.')
  }

  if (usesRelationships && reversedLinkCount > 0) {
    feedback.push('At least one relationship reads backwards.')
  }

  if (usesRelationships && wrongCardinalityCount > 0) {
    feedback.push('At least one relationship uses the wrong cardinality.')
  }

  if (usesRelationships && missingLinkCount > 0) {
    feedback.push('The relationship map is still incomplete.')
  }

  if ((phase === 'entities' || phase === 'full') && extraEntityIds.length > 0) {
    feedback.push('The board may be modeling more concepts than this case needs.')
  }

  if (usesRelationships && unexpectedRelationships.length > 0) {
    feedback.push('One or more links are not supported by the brief.')
  }

  const entityScore = requiredEntityIds.length === 0 ? 1 : matchedEntityIds.length / requiredEntityIds.length
  const attributeScore = usesAttributes
    ? requiredAttributeTotal === 0 ? 1 : matchedAttributeCount / requiredAttributeTotal
    : 0
  const relationshipScore = usesRelationships
    ? relationshipTotal === 0 ? 1 : relationshipMatches / relationshipTotal
    : 0
  const baseScore = phase === 'entities'
    ? Math.round(entityScore * 100)
    : phase === 'attributes'
      ? Math.round(entityScore * 40 + attributeScore * 60)
      : phase === 'relationships'
        ? Math.round(entityScore * 35 + relationshipScore * 65)
        : Math.round(entityScore * 25 + attributeScore * 35 + relationshipScore * 40)
  const penalties =
    (phase === 'entities' || phase === 'full' ? Math.min(20, extraEntityIds.length * 6) : 0) +
    (usesRelationships ? Math.min(20, unexpectedRelationships.length * 5) : 0)
  const score = clamp(baseScore - penalties, 0, 100)
  const perfect =
    missingEntityIds.length === 0 &&
    (phase !== 'entities' && phase !== 'full' || extraEntityIds.length === 0) &&
    (!usesAttributes || matchedAttributeCount === requiredAttributeTotal) &&
    (!usesRelationships || (relationshipMatches === relationshipTotal && unexpectedRelationships.length === 0))
  const passed = phase === 'entities'
    ? missingEntityIds.length === 0 && score >= 80
    : phase === 'attributes'
      ? missingEntityIds.length === 0 && score >= 72
      : phase === 'relationships'
        ? missingEntityIds.length === 0 && relationshipMatches === relationshipTotal && score >= 72
        : (
          missingEntityIds.length === 0 &&
          matchedAttributeCount === requiredAttributeTotal &&
          relationshipMatches === relationshipTotal &&
          unexpectedRelationships.length === 0 &&
          score >= 78
        )

  if (matchedEntityIds.length === requiredEntityIds.length) {
    praise.push('The entity set fits the story.')
  }

  if (usesAttributes && matchedAttributeCount === requiredAttributeTotal) {
    praise.push('The cards are structurally clean.')
  }

  if (usesRelationships && relationshipMatches === relationshipTotal) {
    praise.push('The relationships hold together.')
  }

  if (perfect) {
    praise.unshift('Clean solve.')
  }

  const summary = perfect
    ? 'Case cracked.'
    : passed
      ? 'Case cleared.'
      : score >= 50
        ? 'Close, but the structure still slips in a few places.'
        : 'The board needs another pass.'

  return {
    score,
    passed,
    perfect,
    summary,
    praise,
    feedback: feedback.slice(0, 6),
    missingEntityIds,
    extraEntityIds,
    breakdown: {
      entities: {
        matched: matchedEntityIds.length,
        total: requiredEntityIds.length,
      },
      attributes: {
        matched: usesAttributes ? matchedAttributeCount : 0,
        total: usesAttributes ? requiredAttributeTotal : 0,
      },
      relationships: {
        matched: usesRelationships ? relationshipMatches : 0,
        total: usesRelationships ? relationshipTotal : 0,
      },
    },
  }
}
