import { startTransition, useMemo, useState } from 'react'

import { ExitConfirmModal } from '@/components/ExitConfirmModal'
import { clearGameWithSync, saveGameWithSync } from '@/lib/resume'
import { useAuth } from '@/lib/auth'
import { persistSession } from '@/lib/supabaseApi'
import { playClick, playComplete, playCorrect, playNextLevel, playWrong } from '@/lib/sounds'
import { SCHEMA_SLEUTH_CASES } from '@/games/schema-sleuth/data/cases'
import { DiagramCanvas } from '@/games/schema-sleuth/components/DiagramCanvas'
import { EntityEditorModal } from '@/games/schema-sleuth/components/EntityEditorModal'
import { EntityTray } from '@/games/schema-sleuth/components/EntityTray'
import { TutorialShowcase } from '@/games/schema-sleuth/components/TutorialShowcase'
import { evaluateDiagram } from '@/games/schema-sleuth/engine'
import type {
  Cardinality,
  CaseDefinition,
  DiagramAttempt,
  EvaluationResult,
} from '@/games/schema-sleuth/types'
import './SchemaSleuth.css'

const GAME_ID = 'schema-sleuth'

type SchemaSleuthPhase = 'intro' | 'playing' | 'complete'

type LevelTutorialStep = {
  title: string
  body: string
  target: 'brief' | 'tray' | 'board' | 'progress'
}

const LEVEL_TUTORIALS: Array<LevelTutorialStep[]> = [
  // Level 1 — drag entities onto the board
  [
    {
      title: 'Start with the story',
      body: 'Read the client brief first. The important nouns are your best clues for entity cards.',
      target: 'brief',
    },
    {
      title: 'Use the entity tray',
      body: 'Drag or tap cards from the tray. Extra cards may appear, so compare each one to the story.',
      target: 'tray',
    },
    {
      title: 'Build on the board',
      body: 'Drop cards onto the board. Later levels let you tap a card to add fields and relationships.',
      target: 'board',
    },
    {
      title: 'Check your progress',
      body: 'The progress panel tells you what is still missing. Submit when the diagram matches the brief.',
      target: 'progress',
    },
  ],
  // Level 2 — tap entities to add fields
  [
    {
      title: 'Tap to add fields',
      body: 'Tap any entity on the board to open its field editor, then toggle which fields belong to it.',
      target: 'board',
    },
  ],
  // Level 3 — link entities with cardinality
  [
    {
      title: 'Link entities',
      body: 'Select an entity, pick a target, choose 1:M or M:M, then click Add link to draw the relationship.',
      target: 'board',
    },
  ],
]

export interface SchemaSleuthSave {
  phase: Exclude<SchemaSleuthPhase, 'complete'>
  caseIndex: number
  attempt: DiagramAttempt
  completedCaseIds: string[]
  bestScores: Record<string, number>
}

interface SchemaSleuthProps {
  onExit: () => void
  resumeState?: SchemaSleuthSave | null
}

const DEFAULT_RELATIONSHIP_DRAFT: {
  from: string
  to: string
  cardinality: Cardinality
} = {
  from: '',
  to: '',
  cardinality: '1:M',
}

function createEmptyAttempt(): DiagramAttempt {
  return {
    entities: [],
    relationships: [],
  }
}

function createAttemptFromCase(caseDefinition: CaseDefinition): DiagramAttempt {
  if (!caseDefinition.starterEntities || caseDefinition.starterEntities.length === 0) {
    return createEmptyAttempt()
  }

  return {
    entities: caseDefinition.starterEntities.map(entity => ({
      id: entity.id,
      x: entity.x,
      y: entity.y,
      attributeIds: entity.attributeIds ?? [],
    })),
    relationships: [],
  }
}

function getAutoPlacement(index: number) {
  const anchors = [
    { x: 0.08, y: 0.1 },
    { x: 0.54, y: 0.12 },
    { x: 0.18, y: 0.5 },
    { x: 0.58, y: 0.52 },
    { x: 0.33, y: 0.28 },
  ]

  return anchors[index % anchors.length] ?? anchors[0]
}

function countMatchedRequiredAttributes(caseDefinition: CaseDefinition, attempt: DiagramAttempt) {
  return caseDefinition.bank
    .filter(entity => caseDefinition.requiredEntityIds.includes(entity.id))
    .reduce((total, entity) => {
      const placed = attempt.entities.find(item => item.id === entity.id)
      if (!placed) return total

      return total + entity.attributes.filter(attribute => {
        return attribute.required && placed.attributeIds.includes(attribute.id)
      }).length
    }, 0)
}

function countRequiredAttributes(caseDefinition: CaseDefinition) {
  return caseDefinition.bank
    .filter(entity => caseDefinition.requiredEntityIds.includes(entity.id))
    .flatMap(entity => entity.attributes.filter(attribute => attribute.required)).length
}

function countMatchedRelationships(caseDefinition: CaseDefinition, attempt: DiagramAttempt) {
  return caseDefinition.relationships.filter(solution => {
    return attempt.relationships.some(relationship => {
      if (relationship.cardinality !== solution.cardinality) return false
      if (solution.cardinality === 'M:M') {
        return (
          (relationship.from === solution.from && relationship.to === solution.to) ||
          (relationship.from === solution.to && relationship.to === solution.from)
        )
      }

      return relationship.from === solution.from &&
        relationship.to === solution.to
    })
  }).length
}

function getResumeCaseIndex(resumeState?: SchemaSleuthSave | null) {
  if (!resumeState) return 0
  return Math.min(Math.max(resumeState.caseIndex, 0), SCHEMA_SLEUTH_CASES.length - 1)
}

function getProgressSummary(
  caseDefinition: CaseDefinition,
  attempt: DiagramAttempt,
  evaluation?: EvaluationResult | null
) {
  if (caseDefinition.phase === 'entities') {
    const matched = evaluation?.breakdown.entities.matched ?? attempt.entities
      .filter(entity => caseDefinition.requiredEntityIds.includes(entity.id)).length
    return `${matched}/${caseDefinition.requiredEntityIds.length} entities`
  }

  if (caseDefinition.phase === 'attributes') {
    const matched = evaluation?.breakdown.attributes.matched ?? countMatchedRequiredAttributes(caseDefinition, attempt)
    const total = evaluation?.breakdown.attributes.total ?? countRequiredAttributes(caseDefinition)
    return `${matched}/${total} fields`
  }

  if (caseDefinition.phase === 'full') {
    const matchedEntities = evaluation?.breakdown.entities.matched ?? attempt.entities
      .filter(entity => caseDefinition.requiredEntityIds.includes(entity.id)).length
    const matchedAttributes = evaluation?.breakdown.attributes.matched ?? countMatchedRequiredAttributes(caseDefinition, attempt)
    const attributeTotal = evaluation?.breakdown.attributes.total ?? countRequiredAttributes(caseDefinition)
    const matchedRelationships = evaluation?.breakdown.relationships.matched ?? countMatchedRelationships(caseDefinition, attempt)
    const relationshipTotal = evaluation?.breakdown.relationships.total ?? caseDefinition.relationships.length

    return `${matchedEntities}/${caseDefinition.requiredEntityIds.length} entities • ${matchedAttributes}/${attributeTotal} fields • ${matchedRelationships}/${relationshipTotal} links`
  }

  const matched = evaluation?.breakdown.relationships.matched ?? countMatchedRelationships(caseDefinition, attempt)
  const total = evaluation?.breakdown.relationships.total ?? caseDefinition.relationships.length
  return `${matched}/${total} links`
}

export default function SchemaSleuth({ onExit, resumeState }: SchemaSleuthProps) {
  const { userId } = useAuth()
  const initialCaseIndex = getResumeCaseIndex(resumeState)
  const [phase, setPhase] = useState<SchemaSleuthPhase>(() => resumeState?.phase ?? 'intro')
  const [caseIndex, setCaseIndex] = useState(initialCaseIndex)
  const [attempt, setAttempt] = useState<DiagramAttempt>(() => (
    resumeState?.attempt ?? createAttemptFromCase(SCHEMA_SLEUTH_CASES[initialCaseIndex])
  ))
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [relationshipDraft, setRelationshipDraft] = useState(DEFAULT_RELATIONSHIP_DRAFT)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [completedCaseIds, setCompletedCaseIds] = useState<string[]>(() => resumeState?.completedCaseIds ?? [])
  const [bestScores, setBestScores] = useState<Record<string, number>>(() => resumeState?.bestScores ?? {})
  const [showExitModal, setShowExitModal] = useState(false)
  const [tutorialStep, setTutorialStep] = useState<number | null>(() => resumeState ? null : 0)

  const caseDefinition = SCHEMA_SLEUTH_CASES[caseIndex]
  const placedEntityIds = useMemo(() => new Set(attempt.entities.map(entity => entity.id)), [attempt.entities])
  const levelTutorial = LEVEL_TUTORIALS[caseIndex] ?? null
  const activeTutorial = phase === 'playing' && levelTutorial && tutorialStep !== null
    ? (levelTutorial[tutorialStep] ?? null)
    : null

  function resetCaseState(nextCase: CaseDefinition = caseDefinition) {
    setAttempt(createAttemptFromCase(nextCase))
    setSelectedEntityId(null)
    setRelationshipDraft({ ...DEFAULT_RELATIONSHIP_DRAFT })
    setEvaluation(null)
    setReviewOpen(false)
  }

  function getSaveLabel() {
    return `Level ${caseIndex + 1} of ${SCHEMA_SLEUTH_CASES.length} • ${getProgressSummary(caseDefinition, attempt, evaluation)}`
  }

  function buildSaveState(): SchemaSleuthSave {
    return {
      phase: phase === 'complete' ? 'intro' : phase,
      caseIndex,
      attempt,
      completedCaseIds,
      bestScores,
    }
  }

  function handleSaveAndExit() {
    saveGameWithSync(GAME_ID, buildSaveState(), getSaveLabel(), userId)
    onExit()
  }

  function handleQuit() {
    clearGameWithSync(GAME_ID, userId)
    onExit()
  }

  function getTourClass(target: 'brief' | 'tray' | 'board' | 'progress') {
    return activeTutorial?.target === target ? 'ss-tour-focus' : ''
  }

  function handlePlaceEntity(entityId: string, x?: number, y?: number) {
    if (placedEntityIds.has(entityId)) return

    const fallback = getAutoPlacement(attempt.entities.length)
    const nextX = x ?? fallback.x
    const nextY = y ?? fallback.y

    playClick()
    setAttempt(previous => ({
      ...previous,
      entities: [
        ...previous.entities,
        {
          id: entityId,
          x: nextX,
          y: nextY,
          attributeIds: [],
        },
      ],
    }))

    if (caseDefinition.phase !== 'entities') {
      setSelectedEntityId(entityId)
      setRelationshipDraft(previous => ({
        from: entityId,
        to: '',
        cardinality: previous.cardinality,
      }))
    }
  }

  function handleMoveEntity(entityId: string, x: number, y: number) {
    setAttempt(previous => ({
      ...previous,
      entities: previous.entities.map(entity => {
        if (entity.id !== entityId) return entity
        return {
          ...entity,
          x,
          y,
        }
      }),
    }))
  }

  function handleRemoveEntity(entityId: string) {
    playClick()
    setAttempt(previous => ({
      entities: previous.entities.filter(entity => entity.id !== entityId),
      relationships: previous.relationships.filter(
        relationship => relationship.from !== entityId && relationship.to !== entityId
      ),
    }))

    if (selectedEntityId === entityId) {
      setSelectedEntityId(null)
    }

    setRelationshipDraft(previous => ({
      ...previous,
      from: previous.from === entityId ? '' : previous.from,
      to: previous.to === entityId ? '' : previous.to,
    }))
  }

  function handleToggleAttribute(entityId: string, attributeId: string) {
    playClick()
    setAttempt(previous => ({
      ...previous,
      entities: previous.entities.map(entity => {
        if (entity.id !== entityId) return entity

        const hasAttribute = entity.attributeIds.includes(attributeId)
        return {
          ...entity,
          attributeIds: hasAttribute
            ? entity.attributeIds.filter(id => id !== attributeId)
            : [...entity.attributeIds, attributeId],
        }
      }),
    }))
  }

  function handleAddRelationship() {
    const { from, to, cardinality } = relationshipDraft
    if (!from || !to || from === to) return

    playClick()
    setAttempt(previous => {
      const nextRelationship = {
        id: `${from}-${cardinality}-${to}`,
        from,
        to,
        cardinality,
      }

      return {
        ...previous,
        relationships: [
          ...previous.relationships.filter(relationship => {
            return !(
              (relationship.from === from && relationship.to === to) ||
              (relationship.from === to && relationship.to === from)
            )
          }),
          nextRelationship,
        ],
      }
    })
    setRelationshipDraft(current => ({
      ...current,
      to: '',
    }))
  }

  function handleSelectEntity(entityId: string | null) {
    if (caseDefinition.phase === 'entities') {
      setSelectedEntityId(null)
      return
    }

    setSelectedEntityId(entityId)

    if (!entityId) {
      setRelationshipDraft(previous => ({
        ...previous,
        from: '',
        to: '',
      }))
      return
    }

    setRelationshipDraft(previous => ({
      from: entityId,
      to: '',
      cardinality: previous.cardinality,
    }))
  }

  function handleSubmitDiagram() {
    const result = evaluateDiagram(caseDefinition, attempt)
    setSelectedEntityId(null)
    setEvaluation(result)
    setReviewOpen(true)
    setBestScores(previous => ({
      ...previous,
      [caseDefinition.id]: Math.max(previous[caseDefinition.id] ?? 0, result.score),
    }))

    if (result.passed) {
      playCorrect()
      setCompletedCaseIds(previous => {
        if (previous.includes(caseDefinition.id)) return previous
        return [...previous, caseDefinition.id]
      })
    } else {
      playWrong()
    }
  }

  function handleAdvance() {
    if (userId) {
      persistSession({
        userId,
        gameId: GAME_ID,
        score: evaluation?.score ?? 0,
        entries: [],
        metadata: { caseId: caseDefinition.id, caseIndex },
      })
    }

    if (caseIndex === SCHEMA_SLEUTH_CASES.length - 1) {
      playComplete()
      setReviewOpen(false)
      setPhase('complete')
      clearGameWithSync(GAME_ID, userId)
      return
    }

    const nextIndex = caseIndex + 1
    const nextCase = SCHEMA_SLEUTH_CASES[nextIndex]
    playNextLevel()
    startTransition(() => {
      setCaseIndex(nextIndex)
      resetCaseState(nextCase)
      setTutorialStep(LEVEL_TUTORIALS[nextIndex] !== undefined ? 0 : null)
      setPhase('playing')
    })
  }

  if (phase === 'intro') {
    return (
      <div className="pal-shell pal-shell-dark ss-shell ss-screen">
        <div className="pal-intro-card ss-intro-card">
          <div className="ss-intro-top">
            <div>
              <p className="pal-kicker">Schema Sleuth</p>
              <h1 className="ss-intro-title">{caseDefinition.title}</h1>
              <p className="ss-intro-subtitle">{caseDefinition.subtitle}</p>
            </div>
            <button className="pal-btn pal-btn-ghost" type="button" onClick={() => setShowExitModal(true)}>
              Exit
            </button>
          </div>

          <div className="ss-intro-grid">
            <TutorialShowcase caseDefinition={caseDefinition} />

            <section className="aa-panel ss-panel ss-case-rail">
              <div className="ss-panel-header">
                <div>
                  <p className="pal-kicker">Progression</p>
                  <h2 className="ss-panel-title">Case files</h2>
                </div>
              </div>

              <div className="ss-case-list ss-case-rail-list">
                {SCHEMA_SLEUTH_CASES.map((item, index) => {
                  const isCurrent = item.id === caseDefinition.id
                  const isDone = completedCaseIds.includes(item.id)
                  const isFuture = index > caseIndex

                  return (
                    <div
                      key={item.id}
                      className={`ss-case-card ${isCurrent ? 'is-current' : ''} ${isDone ? 'is-done' : ''} ${isFuture ? 'is-upcoming' : ''}`}
                    >
                      <div>
                        <p className="ss-case-step">Level {item.levelNumber}</p>
                        <h3>{item.title}</h3>
                        <p>{item.subtitle}</p>
                      </div>
                      <span className="ss-case-status">
                        {isDone ? 'Cleared' : isCurrent ? 'Ready' : isFuture ? 'Queued' : 'Open'}
                      </span>
                    </div>
                  )
                })}
              </div>

              <button
                className="pal-btn pal-btn-gold ss-start-btn"
                type="button"
                onClick={() => {
                  playClick()
                  setPhase('playing')
                }}
              >
                Start level
              </button>
            </section>
          </div>
        </div>
        {showExitModal && (
          <ExitConfirmModal
            progressLabel={getSaveLabel()}
            onSaveAndExit={handleSaveAndExit}
            onQuit={handleQuit}
            onCancel={() => setShowExitModal(false)}
          />
        )}
      </div>
    )
  }

  if (phase === 'complete') {
    const clearedCount = completedCaseIds.length
    const highestScore = Math.max(...Object.values(bestScores), 0)

    return (
      <div className="pal-shell pal-shell-dark ss-shell ss-screen">
        <div className="pal-intro-card ss-intro-card ss-complete-card">
          <p className="pal-kicker">All Cases Closed</p>
          <h1 className="ss-intro-title">Schema Sleuth Complete</h1>
          <p className="ss-intro-subtitle">
            You moved from warm-up drills into full case files.
          </p>

          <div className="ss-complete-stats">
            <div className="aa-panel ss-panel ss-stat-card">
              <span>Levels cleared</span>
              <strong>{clearedCount}/{SCHEMA_SLEUTH_CASES.length}</strong>
            </div>
            <div className="aa-panel ss-panel ss-stat-card">
              <span>Best score</span>
              <strong>{highestScore}</strong>
            </div>
          </div>

          <div className="ss-case-list">
            {SCHEMA_SLEUTH_CASES.map(item => (
              <div key={item.id} className="ss-case-card is-done">
                <div>
                  <p className="ss-case-step">Level {item.levelNumber}</p>
                  <h3>{item.title}</h3>
                </div>
                <span className="ss-case-status">{bestScores[item.id] ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="ss-complete-actions">
            <button
              className="pal-btn pal-btn-primary"
              type="button"
              onClick={() => {
                const firstCase = SCHEMA_SLEUTH_CASES[0]
                setCaseIndex(0)
                setCompletedCaseIds([])
                setBestScores({})
                resetCaseState(firstCase)
                setPhase('intro')
                clearGameWithSync(GAME_ID, userId)
              }}
            >
              Replay from level one
            </button>
            <button
              className="pal-btn pal-btn-ghost"
              type="button"
              onClick={() => {
                clearGameWithSync(GAME_ID, userId)
                onExit()
              }}
            >
              Back to games
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`pal-shell pal-shell-dark ss-shell ${activeTutorial ? 'ss-tour-active' : ''}`}>
      <header className="pal-topbar ss-topbar">
        <button className="pal-btn pal-btn-ghost" type="button" onClick={() => setShowExitModal(true)}>
          Exit
        </button>

        <div className="ss-topbar-copy">
          <p className="pal-kicker">Schema Sleuth</p>
          <h1 className="ss-topbar-title">{caseDefinition.title}</h1>
          <p className="ss-topbar-subtitle">{caseDefinition.difficulty} • {caseDefinition.client}</p>
          <div className="ss-level-pips" aria-label={`Level ${caseIndex + 1} of ${SCHEMA_SLEUTH_CASES.length}`}>
            {SCHEMA_SLEUTH_CASES.map((item, index) => (
              <span
                key={item.id}
                className={`ss-level-pip ${index === caseIndex ? 'is-current' : completedCaseIds.includes(item.id) ? 'is-done' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="ss-topbar-actions">
          {levelTutorial && (
            <button
              className="pal-btn pal-btn-ghost"
              type="button"
              onClick={() => {
                playClick()
                setTutorialStep(0)
              }}
            >
              How to play
            </button>
          )}
          <button
            className="pal-btn pal-btn-ghost"
            type="button"
            onClick={() => {
              playClick()
              resetCaseState()
            }}
          >
            Reset board
          </button>
        </div>
      </header>

      <main className="ss-workspace">
        <div className="ss-info-strip">
          <section className={`aa-panel ss-panel ss-brief-strip ${getTourClass('brief')}`}>
            <div className="ss-panel-header">
              <div>
                <p className="pal-kicker">Brief</p>
                <h2 className="ss-panel-title">{caseDefinition.client}</h2>
              </div>
            </div>
            <p className="ss-brief-quote">{caseDefinition.briefing}</p>
            <p className="ss-brief-focus">{caseDefinition.playHint}</p>
          </section>

          <section className={`aa-panel ss-panel ss-score-strip ${getTourClass('progress')}`}>
            <div className="ss-panel-header">
              <div>
                <p className="pal-kicker">Progress</p>
                <h2 className="ss-panel-title">{getProgressSummary(caseDefinition, attempt, evaluation)}</h2>
              </div>
            </div>

            {evaluation ? (
              <>
                <div className="ss-score-hero">
                  <div className={`ss-score-badge ${evaluation.passed ? 'is-pass' : 'is-fail'}`}>
                    {evaluation.score}
                  </div>
                  <div>
                    <p className="ss-score-summary">{evaluation.summary}</p>
                    <p className="ss-score-meta">{getProgressSummary(caseDefinition, attempt, evaluation)}</p>
                  </div>
                </div>

                {evaluation.praise.length > 0 && evaluation.perfect && (
                  <div className="ss-feedback-block is-positive">
                    {evaluation.praise.map(item => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                )}

                <div className="ss-feedback-block">
                  {evaluation.feedback.map(item => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </>
            ) : (
              <div className="ss-empty-state">
                <p>{getProgressSummary(caseDefinition, attempt, null)}</p>
              </div>
            )}
          </section>
        </div>

        <div className="ss-play-grid">
          <div className={getTourClass('board')}>
            <DiagramCanvas
              caseDefinition={caseDefinition}
              phase={caseDefinition.phase}
              entities={attempt.entities}
              relationships={attempt.relationships}
              selectedEntityId={selectedEntityId}
              onSelectEntity={handleSelectEntity}
              onPlaceEntity={handlePlaceEntity}
              onMoveEntity={handleMoveEntity}
              onRemoveEntity={handleRemoveEntity}
              onSubmit={handleSubmitDiagram}
            />
          </div>

          <div className={getTourClass('tray')}>
            <EntityTray
              caseDefinition={caseDefinition}
              placedEntityIds={placedEntityIds}
              onPlaceEntity={entityId => handlePlaceEntity(entityId)}
            />
          </div>
        </div>
      </main>

      <EntityEditorModal
        caseDefinition={caseDefinition}
        entities={attempt.entities}
        selectedEntityId={selectedEntityId}
        relationships={attempt.relationships}
        relationshipDraft={relationshipDraft}
        onClose={() => handleSelectEntity(null)}
        onToggleAttribute={handleToggleAttribute}
        onRelationshipDraftChange={setRelationshipDraft}
        onAddRelationship={handleAddRelationship}
        onRemoveRelationship={relationshipId => {
          playClick()
          setAttempt(previous => ({
            ...previous,
            relationships: previous.relationships.filter(item => item.id !== relationshipId),
          }))
        }}
        onRemoveEntity={handleRemoveEntity}
      />

      {reviewOpen && evaluation && (
        <div className="ss-review-overlay">
          <div className="aa-panel ss-panel ss-review-card">
            <p className="pal-kicker">{evaluation.passed ? 'Level cleared' : 'Keep going'}</p>
            <h2 className="ss-review-title">{evaluation.summary}</h2>
            <p className="ss-review-score">Score: {evaluation.score}</p>
            <div
              className={`ss-review-progress ${evaluation.passed ? 'is-complete' : ''}`}
              aria-label={`Score ${evaluation.score} percent`}
            >
              <span style={{ width: `${evaluation.score}%` }} />
            </div>

            {evaluation.feedback.length > 0 && (
              <div className="ss-feedback-block">
                {evaluation.feedback.slice(0, 3).map(item => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            )}

            <div className="ss-review-actions">
              <button
                className="pal-btn pal-btn-ghost"
                type="button"
                onClick={() => setReviewOpen(false)}
              >
                Back to board
              </button>
              {evaluation.passed && (
                <button
                  className="pal-btn pal-btn-primary"
                  type="button"
                  onClick={handleAdvance}
                >
                  {caseIndex === SCHEMA_SLEUTH_CASES.length - 1 ? 'Finish run' : 'Next level'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showExitModal && (
        <ExitConfirmModal
          progressLabel={getSaveLabel()}
          onSaveAndExit={handleSaveAndExit}
          onQuit={handleQuit}
          onCancel={() => setShowExitModal(false)}
        />
      )}

      {activeTutorial && (
        <>
          <div className="ss-tour-backdrop" />
          <div className={`ss-tour-card is-${activeTutorial.target}`}>
            <p className="pal-kicker">Quick tour</p>
            <h2>{activeTutorial.title}</h2>
            <p>{activeTutorial.body}</p>
            {levelTutorial && levelTutorial.length > 1 && (
              <div className="ss-tour-dots" aria-label="Tutorial progress">
                {levelTutorial.map((step, index) => (
                  <span key={step.title} className={index === tutorialStep ? 'is-active' : ''} />
                ))}
              </div>
            )}
            <div className="ss-tour-actions">
              <button
                className="pal-btn pal-btn-ghost"
                type="button"
                onClick={() => setTutorialStep(null)}
              >
                Skip
              </button>
              <button
                className="pal-btn pal-btn-gold"
                type="button"
                onClick={() => {
                  if (tutorialStep === null || !levelTutorial) return
                  if (tutorialStep === levelTutorial.length - 1) {
                    setTutorialStep(null)
                    return
                  }
                  setTutorialStep(tutorialStep + 1)
                }}
              >
                {tutorialStep === (levelTutorial?.length ?? 1) - 1
                  ? (caseIndex === 0 ? 'Start building' : 'Got it')
                  : 'Next'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
