import { useState } from 'react'
import { Board } from './components/Board'
import { Dice } from './components/Dice'
import { QuestionPanel } from './components/QuestionPanel'
import { PlayerInfo } from './components/PlayerInfo'
import { ResultsScreen } from './components/ResultsScreen'
import { PassDeviceScreen } from './components/PassDeviceScreen'
import { useGameLogic } from './hooks/useGameLogic'
import type { GameMode, Player } from './types'
import { playClick } from '@/lib/sounds'
import { saveGame, clearGame } from '@/lib/resume'
import { ExitConfirmModal } from '@/components/ExitConfirmModal'

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

  // ─── Intro Screen ──────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 py-8">
        {exitModal}
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="space-y-2">
            <div className="text-5xl">🐍🪜</div>
            <h1 className="text-3xl font-bold text-slate-800">Python & Ladders</h1>
            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              Answer Python trivia to roll the dice. Land on a ladder to climb up,
              but watch out for snakes!
            </p>
          </div>

          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { playClick(); setSelectedMode('vs-bot') }}
              className={`py-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                selectedMode === 'vs-bot'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-1">🤖</div>
              vs PyBot
            </button>
            <button
              onClick={() => { playClick(); setSelectedMode('vs-friend') }}
              className={`py-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                selectedMode === 'vs-friend'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-1">👫</div>
              vs Friend
            </button>
          </div>

          {/* Friend name input */}
          {selectedMode === 'vs-friend' && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Friend's name
              </label>
              <input
                type="text"
                value={friendName}
                onChange={e => setFriendName(e.target.value)}
                placeholder="e.g. Sherissa"
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:outline-none text-sm font-medium text-slate-700 bg-white transition-colors"
              />
            </div>
          )}

          {/* How to play */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 space-y-2.5 text-left text-sm text-slate-600">
            <div className="flex items-start gap-2"><span>✅</span><span>Answer correctly to roll the dice</span></div>
            <div className="flex items-start gap-2"><span>❌</span><span>Wrong answer = skip your turn</span></div>
            <div className="flex items-start gap-2"><span>🪜</span><span>Ladders boost you up the board</span></div>
            <div className="flex items-start gap-2"><span>🐍</span><span>Snakes slide you back down</span></div>
            {selectedMode === 'vs-friend' && (
              <div className="flex items-start gap-2"><span>📱</span><span>Pass the device between turns</span></div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { playClick(); setShowExitModal(true) }}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => { playClick(); startGame(selectedMode, friendName, resumeState ?? undefined) }}
              className={`flex-1 px-4 py-3 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm ${
                selectedMode === 'vs-friend'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 py-8">
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {exitModal}
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-sm shrink-0">
        <button
          onClick={() => { playClick(); setShowExitModal(true) }}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← Exit
        </button>
        <h1 className="text-sm font-bold text-slate-700">🐍 Python & Ladders 🪜</h1>
        <span className="text-xs text-slate-400 font-mono">Q{questionCount}</span>
      </header>

      {/* Player status bar */}
      <div className="grid grid-cols-2 gap-2 px-4 lg:px-8 py-2 shrink-0 max-w-7xl mx-auto w-full">
        <PlayerInfo player={p1} isActive={(isActiveTurn || isAnimating) && p1Active} />
        <PlayerInfo player={p2} isActive={(isActiveTurn || isAnimating) && !p1Active || isBotTurn} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row lg:items-start lg:justify-center lg:gap-8 px-4 lg:px-8 py-2 overflow-y-auto max-w-7xl mx-auto w-full">

        {/* Left panel */}
        <div className="lg:w-[340px] lg:shrink-0 lg:order-1 order-2">

          {/* Whose turn label */}
          {(isActiveTurn || isAnimating) && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{active.emoji}</span>
              <span className="text-sm font-semibold text-slate-600">{active.name}'s turn</span>
            </div>
          )}

          {/* Question */}
          {phase === 'question' && currentQuestion && (
            <QuestionPanel
              key={currentQuestion.id + '-' + questionCount}
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={false}
            />
          )}

          {/* Ready to roll */}
          {phase === 'ready-to-roll' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-sm font-semibold text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                {message}
              </p>
              <button
                onClick={handleRoll}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                🎲 Roll Dice
              </button>
            </div>
          )}

          {/* Answered wrong */}
          {phase === 'answered-wrong' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm font-semibold text-red-700 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                {message}
              </p>
              <span className="text-xs text-slate-400 animate-pulse">
                {inactive.name}'s turn next...
              </span>
            </div>
          )}

          {/* Rolling / sliding */}
          {(phase === 'rolling' || phase === 'sliding') && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className={`px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                activeSlide?.type === 'snake'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : activeSlide?.type === 'ladder'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {message}
              </div>
              {lastRoll && <Dice value={lastRoll.value} />}
            </div>
          )}

          {/* Bot turn (vs-bot only) */}
          {isBotTurn && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                {phase === 'bot-turn' && (
                  <span className="text-sm font-semibold text-slate-500 animate-pulse">
                    PyBot is thinking...
                  </span>
                )}
              </div>
              {message && (
                <div className={`px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                  activeSlide?.type === 'snake'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : activeSlide?.type === 'ladder'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                  {message}
                </div>
              )}
              {lastRoll && <Dice value={lastRoll.value} />}
              <span className="text-xs text-slate-400 animate-pulse">Your turn next...</span>
            </div>
          )}
        </div>

        {/* Board — dominant element */}
        <div className="lg:flex-1 lg:order-2 order-1 flex justify-center mb-4 lg:mb-0 lg:max-w-[520px]">
          <Board
            players={players}
            highlightedCell={
              isAnimating ? players.find(p => p.id === activePlayer)?.position ?? null
              : isBotTurn ? p2.position
              : null
            }
            activeSlide={activeSlide}
          />
        </div>
      </div>
    </div>
  )
}
