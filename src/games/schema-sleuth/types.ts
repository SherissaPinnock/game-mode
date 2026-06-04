export type Cardinality = '1:1' | '1:M' | 'M:M'

export type AttributeRole = 'pk' | 'fk' | 'field'
export type LessonPhase = 'entities' | 'attributes' | 'relationships' | 'full'

export interface AttributeOption {
  id: string
  label: string
  role: AttributeRole
  required: boolean
}

export interface EntityBlueprint {
  id: string
  label: string
  accent: string
  description: string
  investigationNote: string
  attributes: AttributeOption[]
}

export interface RelationshipSolution {
  id: string
  from: string
  to: string
  cardinality: Cardinality
  guidance: string
}

export interface StarterEntity {
  id: string
  x: number
  y: number
  attributeIds?: string[]
}

export interface CardinalityExample {
  fromLabel: string
  toLabel: string
  fromRule: string
  toRule: string
  result: Cardinality
  nextExample?: CardinalityExample
}

export interface CaseDefinition {
  id: string
  levelNumber: number
  phase: LessonPhase
  title: string
  subtitle: string
  client: string
  difficulty: string
  briefing: string
  learningFocus: string
  playHint: string
  bank: EntityBlueprint[]
  requiredEntityIds: string[]
  starterEntities?: StarterEntity[]
  cardinalityExample?: CardinalityExample
  relationships: RelationshipSolution[]
}

export interface PlacedEntity {
  id: string
  x: number
  y: number
  attributeIds: string[]
}

export interface DiagramRelationship {
  id: string
  from: string
  to: string
  cardinality: Cardinality
}

export interface DiagramAttempt {
  entities: PlacedEntity[]
  relationships: DiagramRelationship[]
}

export interface EvaluationBreakdown {
  matched: number
  total: number
}

export interface EvaluationResult {
  score: number
  passed: boolean
  perfect: boolean
  summary: string
  praise: string[]
  feedback: string[]
  missingEntityIds: string[]
  extraEntityIds: string[]
  breakdown: {
    entities: EvaluationBreakdown
    attributes: EvaluationBreakdown
    relationships: EvaluationBreakdown
  }
}
