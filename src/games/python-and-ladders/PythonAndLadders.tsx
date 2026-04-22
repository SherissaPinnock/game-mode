import { useState } from 'react'
import { Board } from './components/Board'
import { Dice } from './components/Dice'
import { QuestionPanel } from './components/QuestionPanel'
import { PlayerInfo } from './components/PlayerInfo'
import { ResultsScreen } from './components/ResultsScreen'
import { PassDeviceScreen } from './components/PassDeviceScreen'
import { useGameLogic } from './hooks/useGameLogic'
import { useGameTheme } from '@/lib/useGameTheme'
import type { GameMode, Player } from './types'
import { playClick } from '@/lib/sounds'
import { saveGame, clearGame } from '@/lib/resume'
import { ExitConfirmModal } from '@/components/ExitConfirmModal'
import './PythonAndLadders.css'

export interface PythonAndLaddersSave {
  gameMode: GameMode
  players: Player[]
  activePlayer: 'p1' | 'p2'
  questionCount: number
  correctCount: number
  friendName: string
}

const GAME_ID = 'python-and-ladders'

interface Props {
  onExit: () => void
  resumeState?: PythonAndLaddersSave | null
}

export default function PythonAndLadders({ onExit, resumeState }: Props) {
  const [selectedMode, setSelectedMode] = useState<GameMode>(resumeState?.gameMode ?? 'vs-bot')
  const [friendName, setFriendName] = useState(resumeState?.friendName ?? '')
  const [showExitModal, setShowExitModal] = useState(false)

  const { isDark, toggle: toggleTheme } = useGameTheme()

  const {
    phase,
    gameMode,
    players,
    p1,
    p2,
    active,
    inactive,
    activePlayer,
    currentQuestion,
    lastRoll,
    activeSlide,
    winner,
    message,
    questionCount,
    correctCount,
    sessionStats,
    startGame,
    handleAnswer,
    handleRoll,
    handlePassReady,
  } = useGameLogic()

  function handleSaveAndExit() {
    const save: PythonAndLaddersSave = {
      gameMode, players, activePlayer, questionCount, correctCount,
      friendName: gameMode === 'vs-friend' ? p2.name : '',
    }
    saveGame(GAME_ID, save, `${p1.name} on cell ${p1.position} vs ${p2.name} on cell ${p2.position}`)
    onExit()
  }

  function handleQuitToMenu() {
    clearGame(GAME_ID)
    onExit()
  }

  const exitModal = showExitModal && (
    <ExitConfirmModal
      progressLabel={`Cell ${p1.position} / 36`}
      onSaveAndExit={phase !== 'intro' && phase !== 'finished' ? handleSaveAndExit : undefined}
      onQuit={handleQuitToMenu}
      onCancel={() => setShowExitModal(false)}
    />
  )

  const ThemeToggle = (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="pal-theme-toggle"
    >
      <span className="pal-theme-toggle-knob" style={{ left: isDark ? '20px' : '4px' }} />
    </button>
  )

  // ─── Intro Screen ──────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className={`pal-shell pal-intro-shell ${isDark ? 'pal-shell-dark' : ''}`}>
        {exitModal}
        <div className="pal-intro-card text-center space-y-6">
          <div className="flex justify-end">{ThemeToggle}</div>

          <div className="space-y-2">
            <div className="text-5xl">🐍🪜</div>
            <div className="pal-kicker">Code Race</div>
            <h1 className="pal-title">Python &amp; Ladders</h1>
            <p className="pal-body-copy text-sm max-w-xs mx-auto leading-relaxed">
              Answer Python trivia to roll the dice. Land on a ladder to climb up,
              but watch out for snakes!
            </p>
          </div>

          <div className="pal-mode-grid">
            <button
              onClick={() => { playClick(); setSelectedMode('vs-bot') }}
              className={`pal-mode-card ${selectedMode === 'vs-bot' ? 'is-selected' : 'is-unselected'}`}
            >
              <div className="text-2xl mb-1">🤖</div>
              vs PyBot
            </button>
            <button
              onClick={() => { playClick(); setSelectedMode('vs-friend') }}
              className={`pal-mode-card ${selectedMode === 'vs-friend' ? 'is-selected' : 'is-unselected'}`}
            >
              <div className="text-2xl mb-1">👫</div>
              vs Friend
            </button>
          </div>

          {selectedMode === 'vs-friend' && (
            <div className="pal-input-wrap">
              <label className="pal-label">
                Friend's name
              </label>
              <input
                type="text"
                value={friendName}
                onChange={e => setFriendName(e.target.value)}
                placeholder="e.g. Sherissa"
                maxLength={20}
                className="pal-input px-4 py-2.5 text-sm font-medium"
              />
            </div>
          )}

          <div className="pal-rules-card text-left text-sm">
            <div className="pal-rules-list">
            <div className="pal-rule-row"><span>✅</span><span>Answer correctly to roll the dice</span></div>
            <div className="pal-rule-row"><span>❌</span><span>Wrong answer = skip your turn</span></div>
            <div className="pal-rule-row"><span>🪜</span><span>Ladders boost you up the board</span></div>
            <div className="pal-rule-row"><span>🐍</span><span>Snakes slide you back down</span></div>
            {selectedMode === 'vs-friend' && (
              <div className="pal-rule-row"><span>📱</span><span>Pass the device between turns</span></div>
            )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { playClick(); setShowExitModal(true) }}
              className="pal-btn pal-btn-ghost flex-1 px-4 py-3 text-sm"
            >
              Back
            </button>
            <button
              onClick={() => { playClick(); startGame(selectedMode, friendName, resumeState ?? undefined) }}
              className={`pal-btn flex-1 px-4 py-3 text-sm ${selectedMode === 'vs-friend' ? 'pal-btn-gold' : 'pal-btn-primary'}`}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Pass Device Screen (vs-friend only) ──────────────────────────

  if (phase === 'pass-device') {
    return <PassDeviceScreen nextPlayer={active} onReady={handlePassReady} />
  }

  // ─── Results Screen ────────────────────────────────────────────────

  if (phase === 'finished' && winner) {
    return (
      <div className={`pal-shell pal-finished-shell ${isDark ? 'pal-shell-dark' : ''}`}>
        <ResultsScreen
          winner={winner}
          winnerName={winner === 'p1' ? p1.name : p2.name}
          p1={p1}
          p2={p2}
          gameMode={gameMode}
          questionCount={questionCount}
          correctCount={correctCount}
          sessionStats={sessionStats}
          onPlayAgain={() => startGame(gameMode, gameMode === 'vs-friend' ? p2.name : '')}
          onExit={handleQuitToMenu}
        />
      </div>
    )
  }

  // ─── Game Screen ───────────────────────────────────────────────────

  const isActiveTurn = phase === 'question' || phase === 'ready-to-roll' || phase === 'answered-wrong'
  const isAnimating = phase === 'rolling' || phase === 'sliding'
  const isBotTurn = phase === 'bot-turn' || phase === 'bot-result'
  const p1Active = activePlayer === 'p1'

  return (
    <div className={`pal-shell ${isDark ? 'pal-shell-dark' : ''}`}>
      {exitModal}
      <div className="pal-content-wrap">
      <header className="pal-topbar">
        <button onClick={() => { playClick(); setShowExitModal(true) }} className="pal-btn pal-btn-ghost px-4 py-2 text-sm">
          ← Exit
        </button>
        <h1 className="pal-subtitle">🐍 Python &amp; Ladders 🪜</h1>
        <div className="flex items-center gap-2">
          <span className="pal-badge font-mono">Q{questionCount}</span>
          {ThemeToggle}
        </div>
      </header>

      <div className="pal-player-grid">
        <PlayerInfo player={p1} isActive={(isActiveTurn || isAnimating) && p1Active} isDark={isDark} playerIndex="p1" />
        <PlayerInfo player={p2} isActive={(isActiveTurn || isAnimating) && !p1Active || isBotTurn} isDark={isDark} playerIndex="p2" />
      </div>

      <div className="pal-main-layout">
        <div className="pal-left-column">
          {(isActiveTurn || isAnimating) && (
            <div className="pal-turn-chip">
              <span className="text-lg">{active.emoji}</span>
              <span className="text-sm">{active.name}'s turn</span>
            </div>
          )}

          {phase === 'question' && currentQuestion && (
            <QuestionPanel
              key={currentQuestion.id + '-' + questionCount}
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={false}
              isDark={isDark}
            />
          )}

          {phase === 'ready-to-roll' && (
            <div className="pal-status-card flex flex-col items-center gap-5">
              <p className="pal-status-message pal-status-success text-sm">
                {message}
              </p>
              <button onClick={handleRoll} className="pal-btn pal-btn-gold pal-btn-wide text-xl px-12 py-5">
                🎲 Roll Dice
              </button>
            </div>
          )}

          {phase === 'answered-wrong' && (
            <div className="pal-status-card flex flex-col items-center gap-3">
              <p className="pal-status-message pal-status-danger text-sm">
                {message}
              </p>
              <span className="pal-muted text-xs animate-pulse">
                {inactive.name}'s turn next...
              </span>
            </div>
          )}

          {(phase === 'rolling' || phase === 'sliding') && (
            <div className="pal-status-card flex flex-col items-center gap-4">
              <div className={`pal-status-message text-sm ${
                activeSlide?.type === 'snake'   ? 'pal-status-danger' :
                activeSlide?.type === 'ladder'  ? 'pal-status-success' : 'pal-status-info'
              }`}>
                {message}
              </div>
              {lastRoll && <Dice value={lastRoll.value} />}
            </div>
          )}

          {isBotTurn && (
            <div className="pal-status-card flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                {phase === 'bot-turn' && (
                  <span className="pal-muted text-sm font-semibold animate-pulse">
                    PyBot is thinking...
                  </span>
                )}
              </div>
              {message && (
                <div className={`pal-status-message text-sm ${
                  activeSlide?.type === 'snake'  ? 'pal-status-danger' :
                  activeSlide?.type === 'ladder' ? 'pal-status-success' : 'pal-status-warn'
                }`}>
                  {message}
                </div>
              )}
              {lastRoll && <Dice value={lastRoll.value} />}
              <span className="pal-muted text-xs animate-pulse">Your turn next...</span>
            </div>
          )}
        </div>

        <div className="pal-board-column">
          <Board
            players={players}
            highlightedCell={
              isAnimating ? players.find(p => p.id === activePlayer)?.position ?? null
              : isBotTurn ? p2.position
              : null
            }
            activeSlide={activeSlide}
            isDark={isDark}
          />
        </div>
      </div>
      </div>
    </div>
  )
}
