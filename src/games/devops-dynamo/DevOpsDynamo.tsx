import { useCallback, useRef, useState } from 'react'
import { SymptomBoard } from './SymptomBoard'
import { InvestigationPanel } from './InvestigationPanel'
import { ActionPanel } from './ActionPanel'
import { ResultsScreen } from './ResultsScreen'
import { DialogueBox } from './DialogueBox'
import { incidents as allIncidents } from './data/incidents'
import { usePerformance, type PerformanceEntry } from '@/lib/performance'
import { playCorrect, playWrong, playWasCorrectVoiceOver, playWasWrongVoiceOver } from '@/lib/sounds'
import { saveGame, clearGame } from '@/lib/resume'
import { ExitConfirmModal } from '@/components/ExitConfirmModal'
import { useGameTheme } from '@/lib/useGameTheme'
import type { Action, GamePhase, Incident, InvestigationLog, Investigation } from './types'

const INCIDENTS_PER_GAME = 3
const GAME_ID = 'devops-dynamo'

export interface DevOpsDynamoSave {
  incidentIds: string[]
  incidentIndex: number
  phase: GamePhase
  slaRemaining: number
  completedInvestigations: string[]
  investigationLog: InvestigationLog[]
  correctCount: number
  lastWasCorrect: boolean
}

function incidentsFromIds(ids: string[]): Incident[] {
  return ids.map(id => allIncidents.find(i => i.id === id)!).filter(Boolean)
}

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
  resumeState?: DevOpsDynamoSave | null
}

export default function DevOpsDynamo({ onExit, resumeState }: DevOpsDynamoProps) {
  const { isDark, toggle } = useGameTheme()

  // ── Session state (hydrated from save if present) ────────────────────────
  const [incidents, setIncidents] = useState<Incident[]>(() =>
    resumeState ? incidentsFromIds(resumeState.incidentIds) : pickIncidents(INCIDENTS_PER_GAME)
  )
  const [incidentIndex, setIncidentIndex] = useState(() => resumeState?.incidentIndex ?? 0)
  const [phase, setPhase] = useState<GamePhase>(() => resumeState?.phase ?? 'intro')

  // ── Per-incident state ───────────────────────────────────────────────────
  const [slaRemaining, setSlaRemaining] = useState(() => resumeState?.slaRemaining ?? 0)
  const [completedInvestigations, setCompletedInvestigations] = useState<Set<string>>(
    () => new Set(resumeState?.completedInvestigations ?? [])
  )
  const [investigationLog, setInvestigationLog] = useState<InvestigationLog[]>(
    () => resumeState?.investigationLog ?? []
  )
  const [chosenAction, setChosenAction] = useState<Action | null>(null)
  const [correctCount, setCorrectCount] = useState(() => resumeState?.correctCount ?? 0)
  const [lastWasCorrect, setLastWasCorrect] = useState(() => resumeState?.lastWasCorrect ?? true)
  const [showExitModal, setShowExitModal] = useState(false)

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

  // Initialize first incident SLA on fresh start only
  const initialized = useRef(false)
  if (!initialized.current) {
    initialized.current = true
    if (!resumeState) setSlaRemaining(incident.slaTotal)
  }

  // ── Exit handling ────────────────────────────────────────────────────────
  function handleSaveAndExit() {
    const save: DevOpsDynamoSave = {
      incidentIds: incidents.map(i => i.id),
      incidentIndex,
      phase,
      slaRemaining,
      completedInvestigations: [...completedInvestigations],
      investigationLog,
      correctCount,
      lastWasCorrect,
    }
    saveGame(GAME_ID, save, `Incident ${incidentIndex + 1} of ${incidents.length}`)
    onExit()
  }

  function handleQuit() {
    clearGame(GAME_ID)
    onExit()
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

  // ── Theme tokens ────────────────────────────────────────────────────────
  const BG = isDark
    ? 'bg-[radial-gradient(ellipse_at_top,_#0d1f3c_0%,_#060c18_50%,_#0a0d1a_100%)]'
    : 'bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-100'
  const HEADER_WRAP = isDark
    ? 'bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5'
    : 'bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm'
  const TITLE_CLS = isDark
    ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-sky-400 text-base font-black'
    : 'text-slate-800 text-base font-black'
  const BADGE = isDark
    ? 'text-sm text-slate-400 font-medium bg-white/5 border border-white/10 px-3 py-1 rounded-full'
    : 'text-sm text-slate-500 font-medium bg-slate-100 border border-slate-200 px-3 py-1 rounded-full'
  const BRIEFING_CARD = isDark
    ? 'rounded-xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm p-5 flex flex-col gap-4'
    : 'rounded-xl border-2 border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4'
  const BRIEFING_LABEL = isDark ? 'text-slate-500' : 'text-slate-600'
  const BRIEFING_TEXT = isDark ? 'text-slate-300' : 'text-slate-600'
  const BEGIN_BTN = isDark
    ? 'w-full px-6 py-3 rounded-xl bg-gradient-to-b from-cyan-500 to-cyan-700 border-b-[5px] border-cyan-900 text-slate-900 font-black text-sm hover:from-cyan-400 hover:to-cyan-600 active:border-b-[2px] active:translate-y-[3px] transition-all shadow-lg shadow-cyan-500/30'
    : 'w-full px-6 py-3 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-700 border-b-[5px] border-indigo-900 text-white font-black text-sm hover:from-indigo-400 hover:to-indigo-600 active:border-b-[2px] active:translate-y-[3px] transition-all shadow-lg shadow-indigo-500/30'

  const ThemeToggle = (
    <button onClick={toggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-10 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${isDark ? 'bg-cyan-700' : 'bg-amber-400'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${isDark ? 'left-5' : 'left-1'}`} />
    </button>
  )

  const exitBtn = (
    <button
      onClick={() => setShowExitModal(true)}
      className={isDark
        ? 'text-sm font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-full transition-all'
        : 'text-sm font-medium text-slate-500 hover:text-slate-800 border border-slate-300 hover:border-slate-400 px-3 py-1.5 rounded-full transition-all'}
    >
      ← Exit
    </button>
  )

  const exitModal = showExitModal && (
    <ExitConfirmModal
      progressLabel={`Incident ${incidentIndex + 1} of ${incidents.length}`}
      onSaveAndExit={handleSaveAndExit}
      onQuit={handleQuit}
      onCancel={() => setShowExitModal(false)}
    />
  )

  // ── Intro screen ────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className={`flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10 min-h-screen ${BG}`}>
        {exitModal}
        <div className={`flex items-center justify-between w-full max-w-2xl mb-8 ${HEADER_WRAP}`}>
          {exitBtn}
          <h2 className={`flex items-center gap-2 ${TITLE_CLS}`}>
            <span>🖥️</span> DevOps Dynamo
          </h2>
          {ThemeToggle}
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
      <div className={`flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10 min-h-screen ${BG}`}>
        {exitModal}
        <div className={`flex items-center justify-between w-full max-w-2xl mb-8 ${HEADER_WRAP}`}>
          {exitBtn}
          <span className={BADGE}>
            Up next: Incident {incidentIndex + 2}/{incidents.length}
          </span>
          {ThemeToggle}
        </div>
        <DialogueBox
          mood={lastWasCorrect ? 'explaining' : 'sad'}
          lines={getTransitionLines(incidentIndex + 1, lastWasCorrect)}
          buttonLabel="Ready!"
          onContinue={handleTransitionDone}
          voiceOverFn={lastWasCorrect ? playWasCorrectVoiceOver : playWasWrongVoiceOver}
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
        onExit={handleQuit}
        isLastIncident={isLastIncident}
      />
    )
  }

  // ── Main game screen ────────────────────────────────────────────────────
  const alertStripCls = incident.severity === 'P1'
    ? isDark ? 'bg-red-950/50 border border-red-500/40' : 'bg-red-50 border border-red-300'
    : isDark ? 'bg-amber-950/40 border border-amber-500/30' : 'bg-amber-50 border border-amber-300'
  const alertTitleCls = isDark ? 'text-slate-100' : 'text-slate-800'
  const alertSubCls   = isDark ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className={`flex flex-1 flex-col min-h-screen px-4 py-6 sm:px-8 sm:py-8 ${BG}`}>
      {exitModal}
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 max-w-7xl mx-auto w-full ${HEADER_WRAP}`}>
        {exitBtn}
        <h2 className={`flex items-center gap-2 ${TITLE_CLS}`}>
          🖥️ DevOps Dynamo
        </h2>
        <div className="flex items-center gap-2">
          <span className={BADGE}>
            Incident {incidentIndex + 1} / {incidents.length}
          </span>
          {ThemeToggle}
        </div>
      </div>

      {/* Two-column layout on desktop */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start mt-2">

        {/* ── Left: symptom monitor (dominant) ──────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Incident alert strip */}
          <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${alertStripCls}`}>
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              incident.severity === 'P1' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
            }`} />
            <div>
              <h3 className={`font-bold text-sm ${alertTitleCls}`}>{incident.title}</h3>
              <p className={`text-xs mt-0.5 ${alertSubCls}`}>
                Alert on <span className="font-mono font-semibold">{incident.service}</span>
              </p>
            </div>
          </div>

          <SymptomBoard
            service={incident.service}
            severity={incident.severity}
            symptoms={incident.symptoms}
            slaRemaining={slaRemaining}
            slaTotal={incident.slaTotal}
          />
        </div>

        {/* ── Right: investigation / action panel ───────────────────── */}
        <div className="flex flex-col gap-4">
          {phase === 'briefing' && (
            <div className={BRIEFING_CARD}>
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 ${BRIEFING_LABEL}`}>
                  Diagnosis Protocol
                </h3>
                <p className={`text-sm leading-relaxed ${BRIEFING_TEXT}`}>
                  Study the patient monitor carefully. Observe all vitals before you act.
                  When you're ready, begin running investigations to gather findings.
                </p>
              </div>
              <button onClick={handleStartInvestigating} className={BEGIN_BTN}>
                Begin Investigation
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
    </div>
  )
}
