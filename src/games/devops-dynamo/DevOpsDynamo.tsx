import { useCallback, useRef, useState } from 'react'
import { SymptomBoard } from './SymptomBoard'
import { InvestigationPanel } from './InvestigationPanel'
import { ActionPanel } from './ActionPanel'
import { ResultsScreen } from './ResultsScreen'
import { DialogueBox } from './DialogueBox'
import { incidents as allIncidents } from './data/incidents'
import { usePerformance, type PerformanceEntry } from '@/lib/performance'
import { playCorrect, playWrong } from '@/lib/sounds'
import type { Action, GamePhase, Incident, InvestigationLog, Investigation } from './types'

const INCIDENTS_PER_GAME = 3

function pickIncidents(count: number): Incident[] {
  return [...allIncidents].sort(() => Math.random() - 0.5).slice(0, count)
}

// ── Dialogue lines for each phase ──────────────────────────────────────────

const INTRO_LINES = [
  "Hey there! Welcome to DevOps Dynamo!",
  "You're the on-call engineer today. When an alert fires, you'll see a symptom board with metrics like response time, error rate, CPU, and memory.",
  "Don't panic! Read the board first, then investigate to gather clues. Each investigation costs precious SLA time, so choose wisely.",
  "After 2–3 clues you should have enough info to pick a fix. Choose wrong and you'll waste time — or make things worse!",
]

function getTransitionLines(incidentIndex: number, wasCorrect: boolean): string[] {
  if (wasCorrect) {
    return [
      "Nice work on that one! You kept your cool and followed the clues.",
      `Alright, incident ${incidentIndex + 1} incoming. A new alert just hit the dashboard.`,
      "Same drill — read the symptoms, investigate carefully, then act. You've got this!",
    ]
  }
  return [
    "That one was tough, but every mistake is a lesson. You'll remember this for next time.",
    `Heads up — incident ${incidentIndex + 1} just came in. Let's get back at it.`,
    "Take a breath, read the board, and follow the clues before jumping to a fix.",
  ]
}

// ── Component ──────────────────────────────────────────────────────────────

interface DevOpsDynamoProps {
  onExit: () => void
}

export default function DevOpsDynamo({ onExit }: DevOpsDynamoProps) {
  // ── Session state ────────────────────────────────────────────────────────
  const [incidents, setIncidents] = useState<Incident[]>(() => pickIncidents(INCIDENTS_PER_GAME))
  const [incidentIndex, setIncidentIndex] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('intro')

  // ── Per-incident state ───────────────────────────────────────────────────
  const [slaRemaining, setSlaRemaining] = useState(0)
  const [completedInvestigations, setCompletedInvestigations] = useState<Set<string>>(new Set())
  const [investigationLog, setInvestigationLog] = useState<InvestigationLog[]>([])
  const [chosenAction, setChosenAction] = useState<Action | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [lastWasCorrect, setLastWasCorrect] = useState(true)

  // ── Performance tracking ─────────────────────────────────────────────────
  const { report } = usePerformance()
  const perfEntries = useRef<PerformanceEntry[]>([])
  const hasReported = useRef(false)

  const incident = incidents[incidentIndex]
  const isLastIncident = incidentIndex >= incidents.length - 1

  // ── Initialize an incident ───────────────────────────────────────────────
  const resetIncidentState = useCallback((inc: Incident) => {
    setSlaRemaining(inc.slaTotal)
    setCompletedInvestigations(new Set())
    setInvestigationLog([])
    setChosenAction(null)
  }, [])

  // Initialize first incident on mount
  const initialized = useRef(false)
  if (!initialized.current) {
    initialized.current = true
    setSlaRemaining(incident.slaTotal)
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleIntroDone = useCallback(() => {
    setPhase('briefing')
  }, [])

  const handleStartInvestigating = useCallback(() => {
    setPhase('investigating')
  }, [])

  const handleInvestigate = useCallback((inv: Investigation) => {
    setSlaRemaining(prev => Math.max(0, prev - inv.cost))
    setCompletedInvestigations(prev => new Set([...prev, inv.id]))
    setInvestigationLog(prev => [...prev, {
      investigationId: inv.id,
      clue: inv.clue,
      cost: inv.cost,
    }])
    perfEntries.current.push({
      category: inv.category,
      correct: true,
      gameId: 'devops-dynamo',
      timestamp: Date.now(),
    })
  }, [])

  const handleReadyToAct = useCallback(() => {
    setPhase('acting')
  }, [])

  const handleAct = useCallback((action: Action) => {
    setSlaRemaining(prev => Math.max(0, prev - action.timeCost))
    setChosenAction(action)
    setLastWasCorrect(action.isCorrect)
    if (action.isCorrect) {
      playCorrect()
      setCorrectCount(prev => prev + 1)
    } else {
      playWrong()
    }
    perfEntries.current.push({
      category: 'devops',
      correct: action.isCorrect,
      gameId: 'devops-dynamo',
      timestamp: Date.now(),
    })
    setPhase('outcome')
  }, [])

  const handleNext = useCallback(() => {
    if (isLastIncident) {
      // Play again — reset everything
      const newIncidents = pickIncidents(INCIDENTS_PER_GAME)
      setIncidents(newIncidents)
      setIncidentIndex(0)
      setCorrectCount(0)
      setLastWasCorrect(true)
      perfEntries.current = []
      hasReported.current = false
      initialized.current = false
      resetIncidentState(newIncidents[0])
      setPhase('intro')
    } else {
      // Go to transition dialogue before next incident
      setPhase('transition')
    }
  }, [isLastIncident, resetIncidentState])

  const handleTransitionDone = useCallback(() => {
    const nextIdx = incidentIndex + 1
    setIncidentIndex(nextIdx)
    const nextIncident = incidents[nextIdx]
    resetIncidentState(nextIncident)
    setPhase('briefing')
  }, [incidentIndex, incidents, resetIncidentState])

  // ── Report performance on final outcome ──────────────────────────────────
  if (phase === 'outcome' && isLastIncident && !hasReported.current) {
    hasReported.current = true
    report(perfEntries.current)
  }

  // ── Intro screen ────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10 min-h-screen bg-slate-50">
        <div className="flex items-center justify-between w-full max-w-2xl mb-8">
          <button
            onClick={onExit}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-white transition-colors"
          >
            ← Exit
          </button>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>🖥️</span> DevOps Dynamo
          </h2>
          <div className="w-16" />
        </div>
        <DialogueBox
          mood="explaining"
          lines={INTRO_LINES}
          buttonLabel="Let's go!"
          onContinue={handleIntroDone}
        />
      </div>
    )
  }

  // ── Transition screen between incidents ─────────────────────────────────
  if (phase === 'transition') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10 min-h-screen bg-slate-50">
        <div className="flex items-center justify-between w-full max-w-2xl mb-8">
          <button
            onClick={onExit}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-white transition-colors"
          >
            ← Exit
          </button>
          <span className="text-sm text-slate-500 font-medium">
            Up next: Incident {incidentIndex + 2}/{incidents.length}
          </span>
        </div>
        <DialogueBox
          mood={lastWasCorrect ? 'explaining' : 'sad'}
          lines={getTransitionLines(incidentIndex + 1, lastWasCorrect)}
          buttonLabel="Ready!"
          onContinue={handleTransitionDone}
        />
      </div>
    )
  }

  // ── Outcome screen ──────────────────────────────────────────────────────
  if (phase === 'outcome' && chosenAction) {
    return (
      <ResultsScreen
        incidentTitle={incident.title}
        wasCorrect={chosenAction.isCorrect}
        outcome={chosenAction.outcome}
        postmortem={incident.postmortem}
        slaRemaining={slaRemaining}
        slaTotal={incident.slaTotal}
        cluesFound={investigationLog.length}
        totalIncidents={incidents.length}
        completedIncidents={incidentIndex + 1}
        correctCount={correctCount}
        sessionEntries={perfEntries.current}
        onNext={handleNext}
        onExit={onExit}
        isLastIncident={isLastIncident}
      />
    )
  }

  // ── Main game screen ────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-6 sm:px-6 sm:py-10 min-h-screen bg-slate-50">
      <div className="w-full max-w-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-white transition-colors"
          >
            ← Exit
          </button>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>🖥️</span> DevOps Dynamo
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            {incidentIndex + 1}/{incidents.length}
          </span>
        </div>

        {/* Desk surface */}
        <div className="rounded-2xl border-2 border-slate-300 bg-gradient-to-b from-amber-50 to-orange-50 p-4 sm:p-6 shadow-md">
          {/* Desk items */}
          <div className="flex items-center gap-3 mb-4 text-lg">
            <span title="Coffee">☕</span>
            <span title="Terminal">💻</span>
            <span title="Pager alert">{incident.severity === 'P1' ? '🚨' : '⚠️'}</span>
            <span className="flex-1" />
            <span title="Docker">🐳</span>
            <span title="Sticky notes">📝</span>
          </div>

          {/* Incident title card */}
          <div className="rounded-lg bg-yellow-100 border border-yellow-300 px-4 py-3 mb-4 shadow-sm -rotate-[0.5deg]">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">{incident.title}</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Incoming alert on <span className="font-mono font-semibold">{incident.service}</span>
            </p>
          </div>

          {/* Symptom board */}
          <SymptomBoard
            service={incident.service}
            severity={incident.severity}
            symptoms={incident.symptoms}
            slaRemaining={slaRemaining}
            slaTotal={incident.slaTotal}
          />
        </div>

        {/* Phase-specific panel */}
        {phase === 'briefing' && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-slate-600 text-center max-w-md">
              Read the symptom board carefully. Don't react — think. When you're ready, start investigating to gather clues.
            </p>
            <button
              onClick={handleStartInvestigating}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-sm"
            >
              Start Investigating
            </button>
          </div>
        )}

        {phase === 'investigating' && (
          <InvestigationPanel
            investigations={incident.investigations}
            completedIds={completedInvestigations}
            log={investigationLog}
            onInvestigate={handleInvestigate}
            onReady={handleReadyToAct}
          />
        )}

        {phase === 'acting' && (
          <ActionPanel
            actions={incident.actions}
            onAct={handleAct}
          />
        )}
      </div>
    </div>
  )
}
