import { useEffect, useRef, useState } from 'react'
import { LearningRoadmap } from '@/components/LearningRoadmap'
import { useGameState } from './hooks/useGameState'
import { LEVELS, ROADMAP_LEVELS } from './data/levels'
import { getLevelCount } from './engine/levelLoader'
import { IntroModal } from './components/IntroModal/IntroModal'
import { Workbench } from './components/Workbench/Workbench'
import { ActionPanel } from './components/ActionPanel/ActionPanel'
import { NotificationSystem } from './components/NotificationSystem/NotificationSystem'
import { SummaryModal } from './components/SummaryModal/SummaryModal'
import { ConflictResolver } from './components/ConflictResolver/ConflictResolver'
import { TutorialOverlay } from './components/TutorialOverlay/TutorialOverlay'

import './styles/GitCommandCommander.css'

interface GitCommandCommanderProps {
  onExit: () => void
}

export default function GitCommandCommander({ onExit }: GitCommandCommanderProps) {
  const {
    state,
    startGame,
    startLevel,
    executeAction,
    dismissFail,
    completeLevel,
    goToRoadmap,
    clearAnimation,
  } = useGameState()

  // Tutorial: active only on Level 1, only the first time it's played
  const [tutorialActive, setTutorialActive] = useState(false)
  const [tutorialSeen, setTutorialSeen] = useState(false)
  const [spotlightZone, setSpotlightZone] = useState<string | null>(null)

  type BranchEvent =
    | { type: 'create'; from: string; branch: string }
    | { type: 'switch'; from: string; to: string }
    | null
  const [branchEvent, setBranchEvent] = useState<BranchEvent>(null)
  const prevBranchRef = useRef<string>('main')
  const prevBranchCountRef = useRef<number>(1)

  // Fire tutorial when Level 1 starts for the first time
  useEffect(() => {
    if (state.phase === 'playing' && state.currentLevelIndex === 0 && !tutorialSeen) {
      setTutorialActive(true)
      setSpotlightZone(null)
    }
  }, [state.phase, state.currentLevelIndex, tutorialSeen])

  useEffect(() => {
    if (!state.animationHint) return
    const timer = setTimeout(clearAnimation, 700)
    return () => clearTimeout(timer)
  }, [state.animationHint])

  // Reset branch event when level changes
  useEffect(() => {
    setBranchEvent(null)
    prevBranchRef.current = state.levelState?.currentBranch ?? 'main'
    prevBranchCountRef.current = state.levelState?.availableBranches.length ?? 1
  }, [state.currentLevelIndex, state.phase === 'playing'])

  // Detect branch creation — stays visible until next event
  useEffect(() => {
    const ls = state.levelState
    if (!ls || state.phase !== 'playing') return
    const count = ls.availableBranches.length
    if (count > prevBranchCountRef.current) {
      const newest = ls.availableBranches[ls.availableBranches.length - 1]
      setBranchEvent({ type: 'create', from: ls.currentBranch, branch: newest })
    }
    prevBranchCountRef.current = count
  }, [state.levelState?.availableBranches.length])

  // Detect branch switch — stays visible until next event
  useEffect(() => {
    const ls = state.levelState
    if (!ls || state.phase !== 'playing') return
    const cur = ls.currentBranch
    if (cur !== prevBranchRef.current) {
      setBranchEvent({ type: 'switch', from: prevBranchRef.current, to: cur })
    }
    prevBranchRef.current = cur
  }, [state.levelState?.currentBranch])

  function handleTutorialDone() {
    setTutorialActive(false)
    setTutorialSeen(true)
    setSpotlightZone(null)
  }

  const completedIds = new Set(state.completedLevels.map(String))
  const currentLevel = LEVELS[state.currentLevelIndex]
  const isLastLevel = state.currentLevelIndex >= getLevelCount() - 1

  if (state.phase === 'intro') {
    return <IntroModal onStart={startGame} onExit={onExit} />
  }

  if (state.phase === 'roadmap') {
    return (
      <LearningRoadmap
        gameName="Git Command Commander"
        gameEmoji="⚡"
        themeColor="#f78166"
        completedIds={completedIds}
        levels={ROADMAP_LEVELS}
        onPlay={startLevel}
        onExit={onExit}
      />
    )
  }

  if (state.phase === 'complete') {
    return (
      <div className="gcc-complete-screen">
        <div className="gcc-complete-card">
          <div className="gcc-complete-burst">🎉</div>
          <h1 className="gcc-complete-title">You Did It!</h1>
          <p className="gcc-complete-sub">
            You've mastered Git workflow thinking. Your future team will be very, very grateful.
          </p>
          <div className="gcc-complete-stats">
            <div className="gcc-stat">
              <span className="gcc-stat-num">{getLevelCount()}</span>
              <span className="gcc-stat-label">Levels Cleared</span>
            </div>
            <div className="gcc-stat">
              <span className="gcc-stat-num">0</span>
              <span className="gcc-stat-label">Force Pushes</span>
            </div>
            <div className="gcc-stat">
              <span className="gcc-stat-num">💯</span>
              <span className="gcc-stat-label">Team Trust</span>
            </div>
          </div>
          <div className="gcc-complete-lessons">
            <p>You learned:</p>
            <ul>
              <li>✅ Stage intentionally, commit with purpose</li>
              <li>✅ Feature branches protect production</li>
              <li>✅ Conflicts are normal — resolve thoughtfully</li>
              <li>✅ Pull before you push. Always.</li>
              <li>✅ PRs are conversations, not just code drops</li>
            </ul>
          </div>
          <div className="gcc-complete-actions">
            <button className="gcc-btn gcc-btn-primary gcc-btn-lg" onClick={goToRoadmap}>
              ↺ Play Again
            </button>
            <button className="gcc-btn gcc-btn-ghost" onClick={onExit}>
              ← Exit
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.phase === 'summary' && currentLevel && state.levelState) {
    return (
      <SummaryModal
        level={currentLevel}
        isLastLevel={isLastLevel}
        onNext={() => {
          completeLevel()
          if (!isLastLevel) {
            startLevel(state.currentLevelIndex + 1)
          }
        }}
        onRoadmap={() => {
          completeLevel()
        }}
      />
    )
  }

  if (!state.levelState || !currentLevel) {
    return null
  }

  const showConflict =
    state.levelState.conflictState !== null && !state.levelState.conflictState.resolved

  return (
    <div className={`gcc-shell ${tutorialActive ? 'gcc-tutorial-mode' : ''}`}>
      <header className={`gcc-topbar ${spotlightZone === 'topbar' ? 'gcc-spotlight' : ''}`}>
        <div className="gcc-topbar-left">
          <button className="gcc-btn gcc-btn-ghost gcc-btn-sm" onClick={goToRoadmap}>
            ← Roadmap
          </button>
          <span className="gcc-level-badge">
            Level {state.currentLevelIndex + 1}/{getLevelCount()}
          </span>
        </div>

        <div className="gcc-topbar-center">
          <span className="gcc-level-emoji">{currentLevel.emoji}</span>
          <div>
            <h1 className="gcc-level-title">{currentLevel.title}</h1>
            <p className="gcc-level-objective">{currentLevel.objective}</p>
          </div>
        </div>

        <div className="gcc-topbar-right">
          <div className="gcc-progress-bar">
            <div
              className="gcc-progress-fill"
              style={{
                width: `${
                  (currentLevel.winConditions.filter(wc => wc.check(state.levelState!)).length /
                    currentLevel.winConditions.length) *
                  100
                }%`,
              }}
            />
          </div>
          <span className="gcc-progress-label">
            {currentLevel.winConditions.filter(wc => wc.check(state.levelState!)).length}/
            {currentLevel.winConditions.length} objectives
          </span>
        </div>
      </header>

      <div className={`gcc-scenario-bar ${spotlightZone === 'scenario' ? 'gcc-spotlight' : ''}`}>
        <span className="gcc-scenario-icon">📖</span>
        <p className="gcc-scenario-text">{currentLevel.scenario}</p>
      </div>

      <main className="gcc-main">
        <Workbench
          levelState={state.levelState}
          animationHint={state.animationHint}
          spotlightZone={spotlightZone}
          branchEvent={branchEvent}
        />

        <aside className="gcc-sidebar">
          <div className={spotlightZone === 'actions' ? 'gcc-spotlight gcc-spotlight-radius' : ''}>
            <ActionPanel
              availableActions={currentLevel.availableActions}
              levelState={state.levelState}
              onAction={executeAction}
            />
          </div>

          <div className={`gcc-objectives-panel ${spotlightZone === 'objectives' ? 'gcc-spotlight' : ''}`}>
            <p className="gcc-objectives-title">Objectives</p>
            {currentLevel.winConditions.map(wc => (
              <div
                key={wc.id}
                className={`gcc-objective ${wc.check(state.levelState!) ? 'gcc-objective-done' : ''}`}
              >
                <span className="gcc-objective-dot" />
                <span>{wc.label}</span>
              </div>
            ))}
          </div>

          {currentLevel.hints.length > 0 && (
            <details className="gcc-hints-panel">
              <summary className="gcc-hints-toggle">💡 Hints</summary>
              <ul className="gcc-hints-list">
                {currentLevel.hints.map((hint, i) => (
                  <li key={i}>{hint}</li>
                ))}
              </ul>
            </details>
          )}
        </aside>
      </main>

      <NotificationSystem notifications={state.levelState.notifications} />

      {showConflict && (
        <ConflictResolver
          conflict={state.levelState.conflictState!}
          onResolve={(choice) => executeAction('resolve-conflict', choice)}
        />
      )}

      {state.levelState.failState && (
        <div className="gcc-fail-overlay">
          <div className="gcc-fail-panel">
            <div className="gcc-fail-icon">💥</div>
            <h3 className="gcc-fail-title">Oops — That Went Wrong</h3>
            <p className="gcc-fail-message">
              {state.levelState.failReason ?? 'Something went very wrong.'}
            </p>
            <div className="gcc-fail-actions">
              <button className="gcc-btn gcc-btn-primary" onClick={dismissFail}>
                ↺ Try Again
              </button>
              <button className="gcc-btn gcc-btn-ghost" onClick={goToRoadmap}>
                ← Roadmap
              </button>
            </div>
          </div>
        </div>
      )}

      {tutorialActive && (
        <TutorialOverlay
          onDone={handleTutorialDone}
          activeZone={spotlightZone}
          onZoneChange={setSpotlightZone}
        />
      )}
    </div>
  )
}
