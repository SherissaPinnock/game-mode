import { useState } from 'react'
import { LEVELS } from './data/levels'
import { LevelIntro } from './components/LevelIntro'
import { CloudBoard } from './components/CloudBoard'
import { LevelComplete } from './components/LevelComplete'
import './ChessClouds.css'

type Screen = 'title' | 'intro' | 'game' | 'complete'

interface Props {
  onExit: () => void
}

export default function ChessClouds({ onExit }: Props) {
  const [screen, setScreen]       = useState<Screen>('title')
  const [levelIdx, setLevelIdx]   = useState(0)
  const [gameKey, setGameKey]     = useState(0) // force remount of board on replay
  const [lastCorrect, setLastCorrect] = useState(0)
  const [lastTotal, setLastTotal]     = useState(0)

  const level = LEVELS[levelIdx]

  function startLevel() { setScreen('intro') }
  function beginGame()  { setScreen('game') }

  function handleComplete(correct: number, total: number) {
    setLastCorrect(correct)
    setLastTotal(total)
    setScreen('complete')
  }

  function handleNext() {
    if (levelIdx < LEVELS.length - 1) {
      setLevelIdx(i => i + 1)
      setGameKey(k => k + 1)
      setScreen('intro')
    } else {
      onExit()
    }
  }

  function handleReplay() {
    setGameKey(k => k + 1)
    setScreen('game')
  }

  // ── Title / Level Select ──────────────────────────────────────────────────
  if (screen === 'title') {
    return (
      <div className="cc-title-screen">
        <button className="cc-exit-btn" onClick={onExit}>← Exit</button>

        <div className="cc-title-inner">
          {/* Cloud deco */}
          <div className="cc-clouds-deco" aria-hidden="true">
            <span className="cc-cloud cc-cloud-1">☁️</span>
            <span className="cc-cloud cc-cloud-2">☁️</span>
            <span className="cc-cloud cc-cloud-3">☁️</span>
            <span className="cc-cloud cc-cloud-4">☁️</span>
          </div>

          <div className="cc-title-chess-icon">♛</div>
          <h1 className="cc-title-heading">Chess in the Clouds</h1>
          <p className="cc-title-sub">
            Master cloud computing one capture at a time.<br />
            To take a piece, you must answer a cloud question.
          </p>

          {/* Level cards */}
          <div className="cc-level-cards">
            {LEVELS.map((lv, i) => (
              <button
                key={lv.id}
                className="cc-level-card"
                style={{ borderColor: lv.accentColor + '66' }}
                onClick={() => { setLevelIdx(i); setGameKey(k => k + 1); startLevel() }}
              >
                <span className="cc-lc-num" style={{ color: lv.accentColor }}>
                  {lv.id}
                </span>
                <div className="cc-lc-body">
                  <p className="cc-lc-title">{lv.title}</p>
                  <p className="cc-lc-topic">{lv.topic}</p>
                </div>
                <span className="cc-lc-arrow" style={{ color: lv.accentColor }}>→</span>
              </button>
            ))}
          </div>

          <button
            className="cc-play-btn"
            onClick={() => { setLevelIdx(0); setGameKey(k => k + 1); startLevel() }}
          >
            ▶ Play from Level 1
          </button>
        </div>
      </div>
    )
  }

  if (screen === 'intro') {
    return (
      <LevelIntro
        level={level}
        onStart={beginGame}
        onExit={() => setScreen('title')}
      />
    )
  }

  if (screen === 'game') {
    return (
      <CloudBoard
        key={gameKey}
        level={level}
        onComplete={handleComplete}
        onExit={() => setScreen('title')}
      />
    )
  }

  if (screen === 'complete') {
    return (
      <LevelComplete
        level={level}
        correct={lastCorrect}
        total={lastTotal}
        isLast={levelIdx === LEVELS.length - 1}
        onNext={handleNext}
        onReplay={handleReplay}
        onExit={() => setScreen('title')}
      />
    )
  }

  return null
}
