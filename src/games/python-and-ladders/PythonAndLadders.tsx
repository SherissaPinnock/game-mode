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

  // ─── Theme tokens ──────────────────────────────────────────────────
  const BG        = isDark
    ? 'bg-[radial-gradient(ellipse_at_50%_0%,_#2d0a5e_0%,_#080818_45%,_#021a0a_100%)]'
    : 'bg-gradient-to-br from-violet-100 via-sky-50 to-teal-100'
  const HEADER    = isDark ? 'bg-black/50 backdrop-blur-md border-b border-white/10' : 'bg-white/80 backdrop-blur-md border-b border-slate-200'
  const EXIT_BTN  = isDark
    ? 'border border-white/15 text-slate-400 hover:text-white hover:border-white/30 rounded-full px-3 py-1.5 text-sm font-medium transition-all'
    : 'border border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 rounded-full px-3 py-1.5 text-sm font-medium transition-all'
  const TITLE     = isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-violet-300' : 'text-slate-800'
  const CARD      = isDark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white border border-slate-200'
  const BODY_TEXT = isDark ? 'text-slate-300' : 'text-slate-600'
  const LABEL     = isDark ? 'text-slate-400' : 'text-slate-500'
  const INPUT     = isDark
    ? 'border-2 border-white/10 focus:border-cyan-400 bg-white/5 text-white placeholder:text-slate-600'
    : 'border-2 border-slate-200 focus:border-violet-400 bg-white text-slate-800 placeholder:text-slate-400'
  const ROLL_BTN  = isDark
    ? 'bg-gradient-to-b from-cyan-400 to-cyan-600 border-b-[5px] border-cyan-900 text-slate-900 font-black text-xl px-12 py-5 rounded-2xl shadow-xl shadow-cyan-500/30 hover:from-cyan-300 hover:to-cyan-500 active:border-b-[2px] active:translate-y-[3px] transition-all'
    : 'bg-gradient-to-b from-violet-500 to-violet-700 border-b-[5px] border-violet-900 text-white font-black text-xl px-12 py-5 rounded-2xl shadow-xl shadow-violet-500/30 hover:from-violet-400 hover:to-violet-600 active:border-b-[2px] active:translate-y-[3px] transition-all'
  const CORRECT_BG = isDark ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border border-emerald-300 text-emerald-700'
  const WRONG_BG   = isDark ? 'bg-rose-950/70 border border-rose-500/40 text-rose-300' : 'bg-rose-50 border border-rose-300 text-rose-700'
  const NEUTRAL_BG = isDark ? 'bg-sky-950/70 border border-sky-500/40 text-sky-300' : 'bg-sky-50 border border-sky-300 text-sky-700'
  const BOT_BG     = isDark ? 'bg-amber-950/70 border border-amber-500/40 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-700'
  const TURN_LABEL = isDark ? 'text-cyan-300' : 'text-violet-700'
  const MUTED      = isDark ? 'text-slate-500' : 'text-slate-400'

  const ThemeToggle = (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-10 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${isDark ? 'bg-indigo-600' : 'bg-amber-400'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${isDark ? 'left-5' : 'left-1'}`} />
    </button>
  )

  // ─── Intro Screen ──────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className={`min-h-screen ${BG} flex flex-col items-center justify-center px-4 py-8`}>
        {exitModal}
        <div className="w-full max-w-sm text-center space-y-6">
          {/* Theme toggle top-right */}
          <div className="flex justify-end">{ThemeToggle}</div>

          <div className="space-y-2">
            <div className="text-5xl">🐍🪜</div>
            <h1 className={`text-3xl font-black ${TITLE}`}>Python & Ladders</h1>
            <p className={`text-sm max-w-xs mx-auto leading-relaxed ${BODY_TEXT}`}>
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
                  ? isDark
                    ? 'border-sky-400 bg-sky-500/20 text-sky-200 shadow-lg shadow-sky-500/20'
                    : 'border-sky-500 bg-sky-50 text-sky-700 shadow-lg shadow-sky-200'
                  : isDark
                    ? 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
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
                  ? isDark
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-lg shadow-amber-500/20'
                    : 'border-amber-500 bg-amber-50 text-amber-700 shadow-lg shadow-amber-200'
                  : isDark
                    ? 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
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
              <label className={`text-xs font-semibold uppercase tracking-wider ${LABEL}`}>
                Friend's name
              </label>
              <input
                type="text"
                value={friendName}
                onChange={e => setFriendName(e.target.value)}
                placeholder="e.g. Sherissa"
                maxLength={20}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-colors ${INPUT}`}
              />
            </div>
          )}

          {/* How to play */}
          <div className={`rounded-2xl border p-4 space-y-2.5 text-left text-sm ${CARD} ${BODY_TEXT}`}>
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
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${EXIT_BTN}`}
            >
              Back
            </button>
            <button
              onClick={() => { playClick(); startGame(selectedMode, friendName, resumeState ?? undefined) }}
              className={`flex-1 px-4 py-3 rounded-xl text-white text-sm font-bold transition-all shadow-lg active:scale-95 ${
                selectedMode === 'vs-friend'
                  ? isDark ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30' : 'bg-amber-500 hover:bg-amber-400 shadow-amber-400/30'
                  : isDark ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-500/30' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/30'
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
      <div className={`min-h-screen ${BG} flex flex-col items-center justify-center px-4 py-8`}>
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
    <div className={`min-h-screen ${BG} flex flex-col`}>
      {exitModal}
      {/* Header */}
      <header className={`flex items-center justify-between px-4 py-3 shrink-0 ${HEADER}`}>
        <button onClick={() => { playClick(); setShowExitModal(true) }} className={EXIT_BTN}>
          ← Exit
        </button>
        <h1 className={`text-lg font-black ${TITLE}`}>🐍 Python & Ladders 🪜</h1>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2 py-1 rounded-full ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>Q{questionCount}</span>
          {ThemeToggle}
        </div>
      </header>

      {/* Player status bar */}
      <div className="grid grid-cols-2 gap-2 px-4 lg:px-8 py-2 shrink-0 max-w-7xl mx-auto w-full">
        <PlayerInfo player={p1} isActive={(isActiveTurn || isAnimating) && p1Active} isDark={isDark} playerIndex="p1" />
        <PlayerInfo player={p2} isActive={(isActiveTurn || isAnimating) && !p1Active || isBotTurn} isDark={isDark} playerIndex="p2" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row lg:items-start lg:justify-center lg:gap-8 px-4 lg:px-8 py-2 overflow-y-auto max-w-7xl mx-auto w-full">

        {/* Left panel */}
        <div className="lg:w-[340px] lg:shrink-0 lg:order-1 order-2">

          {/* Whose turn label */}
          {(isActiveTurn || isAnimating) && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{active.emoji}</span>
              <span className={`text-sm font-semibold ${TURN_LABEL}`}>{active.name}'s turn</span>
            </div>
          )}

          {/* Question */}
          {phase === 'question' && currentQuestion && (
            <QuestionPanel
              key={currentQuestion.id + '-' + questionCount}
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={false}
              isDark={isDark}
            />
          )}

          {/* Ready to roll */}
          {phase === 'ready-to-roll' && (
            <div className="flex flex-col items-center gap-5 py-6">
              <p className={`text-sm font-semibold px-4 py-2 rounded-lg ${CORRECT_BG}`}>
                {message}
              </p>
              <button onClick={handleRoll} className={ROLL_BTN}>
                🎲 Roll Dice
              </button>
            </div>
          )}

          {/* Answered wrong */}
          {phase === 'answered-wrong' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className={`text-sm font-semibold px-4 py-2 rounded-lg ${WRONG_BG}`}>
                {message}
              </p>
              <span className={`text-xs animate-pulse ${MUTED}`}>
                {inactive.name}'s turn next...
              </span>
            </div>
          )}

          {/* Rolling / sliding */}
          {(phase === 'rolling' || phase === 'sliding') && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className={`px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                activeSlide?.type === 'snake'   ? WRONG_BG :
                activeSlide?.type === 'ladder'  ? CORRECT_BG : NEUTRAL_BG
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
                  <span className={`text-sm font-semibold animate-pulse ${MUTED}`}>
                    PyBot is thinking...
                  </span>
                )}
              </div>
              {message && (
                <div className={`px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                  activeSlide?.type === 'snake'  ? WRONG_BG :
                  activeSlide?.type === 'ladder' ? CORRECT_BG : BOT_BG
                }`}>
                  {message}
                </div>
              )}
              {lastRoll && <Dice value={lastRoll.value} />}
              <span className={`text-xs animate-pulse ${MUTED}`}>Your turn next...</span>
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
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  )
}
