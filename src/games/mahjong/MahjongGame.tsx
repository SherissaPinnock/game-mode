import { useState } from 'react'
import { useGameLogic } from './hooks/useGameLogic'
import { useGameTheme } from '@/lib/useGameTheme'
import type { Tile, Question, GameResult } from './types'
import { playClick } from '@/lib/sounds'
import { ExitConfirmModal } from '@/components/ExitConfirmModal'

// ─── Tile component ────────────────────────────────────────────────────────────

function TileCard({
  tile,
  isDark,
  isSelected = false,
  isLastDrawn = false,
  onClick,
  faceDown = false,
  size = 'md',
}: {
  tile: Tile
  isDark: boolean
  isSelected?: boolean
  isLastDrawn?: boolean
  onClick?: () => void
  faceDown?: boolean
  size?: 'sm' | 'md'
}) {
  const w = size === 'sm' ? 'w-7 h-9' : 'w-9 h-12'
  const txt = size === 'sm' ? 'text-base' : 'text-xl'

  let bg: string
  if (faceDown) {
    bg = isDark
      ? 'bg-gradient-to-b from-[#7f1d1d] to-[#3d0000] border border-[#d4af37]/30'
      : 'bg-gradient-to-b from-rose-700 to-rose-900 border border-rose-400'
  } else if (isSelected) {
    bg = isDark
      ? 'bg-[#d4af37]/20 border-2 border-[#d4af37] shadow-lg shadow-[#d4af37]/30 -translate-y-2'
      : 'bg-amber-100 border-2 border-amber-500 shadow-lg shadow-amber-300/50 -translate-y-2'
  } else if (isLastDrawn) {
    bg = isDark
      ? 'bg-emerald-950/60 border-2 border-emerald-400/60 shadow-md shadow-emerald-900/30 -translate-y-1'
      : 'bg-emerald-50 border-2 border-emerald-400 shadow-md shadow-emerald-200 -translate-y-1'
  } else {
    bg = isDark
      ? 'bg-[#1a0008] border border-[#d4af37]/30 hover:border-[#d4af37]/70 hover:-translate-y-1'
      : 'bg-[#fef9e7] border border-rose-300 hover:border-rose-500 hover:-translate-y-1'
  }

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`${w} ${bg} rounded flex items-center justify-center transition-all duration-150 shrink-0 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {faceDown
        ? <span className="text-[#d4af37]/40 text-xs">🀫</span>
        : <span className={`${txt} leading-none select-none`}>{tile.unicode}</span>
      }
    </button>
  )
}

// ─── Hand display ──────────────────────────────────────────────────────────────

function PlayerHand({
  tiles, onDiscard, canDiscard, lastDrawnUid, selectedUid, onSelect, isDark,
}: {
  tiles: Tile[]
  onDiscard: (uid: string) => void
  canDiscard: boolean
  lastDrawnUid: string | null
  selectedUid: string | null
  onSelect: (uid: string | null) => void
  isDark: boolean
}) {
  const handleTileClick = (uid: string) => {
    if (!canDiscard) return
    if (selectedUid === uid) {
      // Second click discards
      onDiscard(uid)
      onSelect(null)
    } else {
      onSelect(uid)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#d4af37]/60' : 'text-rose-500'}`}>
          Your hand ({tiles.length})
        </span>
        {canDiscard && (
          <span className={`text-[10px] animate-pulse ${isDark ? 'text-amber-400' : 'text-rose-500'}`}>
            Tap once to select · tap again to discard
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 py-1">
        {tiles.map(tile => (
          <TileCard
            key={tile.uid}
            tile={tile}
            isDark={isDark}
            isSelected={selectedUid === tile.uid}
            isLastDrawn={lastDrawnUid === tile.uid}
            onClick={canDiscard ? () => handleTileClick(tile.uid) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function BotHand({ count, isDark }: { count: number; isDark: boolean }) {
  // Dummy tile for face-down rendering
  const dummy: Tile = { uid: 'x', suit: 'characters', value: 1, unicode: '🀫' }
  return (
    <div className="space-y-1">
      <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#d4af37]/60' : 'text-rose-500'}`}>
        GrafBot ({count} tiles)
      </span>
      <div className="flex flex-wrap gap-1 py-1">
        {Array.from({ length: Math.min(count, 14) }).map((_, i) => (
          <TileCard key={i} tile={dummy} isDark={isDark} faceDown size="sm" />
        ))}
      </div>
    </div>
  )
}

function DiscardPile({ tiles, isDark }: { tiles: Tile[]; isDark: boolean }) {
  const recent = tiles.slice(-18)
  const label = isDark ? 'text-[#d4af37]/60' : 'text-rose-500'
  const wrap  = isDark
    ? 'bg-black/30 border border-[#d4af37]/10 rounded-xl p-2 min-h-[52px]'
    : 'bg-white/50 border border-rose-200 rounded-xl p-2 min-h-[52px]'
  return (
    <div className="space-y-1">
      <span className={`text-xs font-semibold uppercase tracking-wider ${label}`}>
        Discards ({tiles.length})
      </span>
      <div className={wrap}>
        <div className="flex flex-wrap gap-1">
          {recent.map((t, i) => (
            <TileCard key={`${t.uid}-${i}`} tile={t} isDark={isDark} size="sm" />
          ))}
          {tiles.length === 0 && (
            <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No tiles discarded yet</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({
  question, onAnswer, disabled, isDark,
}: {
  question: Question
  onAnswer: (i: number) => void
  disabled: boolean
  isDark: boolean
}) {
  const card  = isDark
    ? 'bg-black/40 border border-[#d4af37]/20 rounded-2xl p-4 space-y-3'
    : 'bg-[#fef9e7] border border-rose-200 rounded-2xl p-4 space-y-3'
  const qText = isDark
    ? 'text-sm font-medium text-amber-100 leading-relaxed'
    : 'text-sm font-medium text-rose-950 leading-relaxed'
  const diffBadge: Record<string, string> = {
    easy:   isDark ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    medium: isDark ? 'bg-amber-900/40 text-amber-400 border border-amber-500/30'      : 'bg-amber-50 text-amber-700 border border-amber-300',
    hard:   isDark ? 'bg-rose-900/40 text-rose-400 border border-rose-500/30'         : 'bg-rose-50 text-rose-700 border border-rose-300',
  }
  const optBase = isDark
    ? 'w-full text-left px-3 py-2.5 rounded-xl text-sm border border-white/10 bg-white/5 text-slate-300 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/10 hover:text-amber-200 transition-all font-medium disabled:opacity-50'
    : 'w-full text-left px-3 py-2.5 rounded-xl text-sm border border-rose-200 bg-white text-rose-900 hover:border-rose-500 hover:bg-rose-50 transition-all font-medium disabled:opacity-50'

  return (
    <div className={card}>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${diffBadge[question.difficulty]}`}>
          {question.difficulty}
        </span>
        <span className={`text-xs ${isDark ? 'text-[#d4af37]/60' : 'text-rose-400'}`}>Grafana trivia</span>
        <span className={`ml-auto text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Answer correctly to draw a tile
        </span>
      </div>
      <p className={qText}>{question.question}</p>
      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => { if (!disabled) onAnswer(i) }}
            disabled={disabled}
            className={optBase}
          >
            <span className={`inline-block w-5 text-center mr-1 font-bold ${isDark ? 'text-[#d4af37]' : 'text-rose-600'}`}>
              {['一', '二', '三', '四'][i]}
            </span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  result, onPlayAgain, onExit, isDark,
}: {
  result: GameResult
  onPlayAgain: () => void
  onExit: () => void
  isDark: boolean
}) {
  const won  = result.winner === 'player'
  const draw = result.winner === 'draw'
  const accuracy = result.questionCount > 0
    ? Math.round(result.correctCount / result.questionCount * 100)
    : 0

  const BG   = isDark
    ? 'bg-[radial-gradient(ellipse_at_50%_0%,_#3d0010_0%,_#0d0005_40%,_#050005_100%)]'
    : 'bg-gradient-to-br from-amber-50 via-rose-50 to-red-50'
  const CARD = isDark
    ? 'bg-black/40 border border-[#d4af37]/20 rounded-2xl p-3'
    : 'bg-[#fef9e7] border border-rose-200 rounded-2xl p-3'

  return (
    <div className={`min-h-screen ${BG} flex flex-col items-center justify-center px-4 py-8`}>
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-6xl">{won ? '🏆' : draw ? '🤝' : '🀄'}</div>
        <div>
          <p className={`text-xs uppercase tracking-widest mb-1 ${won ? 'text-[#d4af37]' : draw ? 'text-slate-400' : 'text-rose-400'}`}>
            {won ? 'Victory! 恭喜' : draw ? 'Draw — No winner' : 'GrafBot wins'}
          </p>
          <h2 className="text-3xl font-black text-white">
            {won ? 'Tsumo!' : draw ? 'Game over' : 'Better luck next time'}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Questions', value: result.questionCount },
            { label: 'Correct',   value: result.correctCount },
            { label: 'Accuracy',  value: `${accuracy}%` },
            { label: 'Turns',     value: result.turnsPlayed },
          ].map(s => (
            <div key={s.label} className={CARD}>
              <div className="text-xl font-black text-[#d4af37]">{s.value}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-3 rounded-xl border border-white/15 text-slate-400 hover:text-white text-sm font-semibold transition-all"
          >
            Exit
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 rounded-xl bg-gradient-to-b from-rose-600 to-rose-800 border-b-4 border-rose-950 text-white text-sm font-black shadow-xl shadow-rose-900/40 active:border-b-2 active:translate-y-0.5 transition-all"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Intro screen ─────────────────────────────────────────────────────────────

function IntroScreen({
  isDark, onStart, onExit,
}: {
  isDark: boolean
  onStart: (mode: 'vs-bot' | 'solo') => void
  onExit: () => void
}) {
  const [selectedMode, setSelectedMode] = useState<'vs-bot' | 'solo'>('vs-bot')

  const BG    = isDark
    ? 'bg-[radial-gradient(ellipse_at_50%_0%,_#3d0010_0%,_#0d0005_40%,_#050005_100%)]'
    : 'bg-gradient-to-br from-amber-50 via-rose-50 to-red-50'
  const CARD  = isDark
    ? 'bg-black/40 border border-[#d4af37]/20 rounded-2xl p-4'
    : 'bg-[#fef9e7] border border-rose-200 rounded-2xl p-4'
  const TITLE = isDark
    ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-yellow-200'
    : 'text-rose-950'
  const BODY  = isDark ? 'text-slate-300' : 'text-rose-900'
  const LABEL = isDark ? 'text-slate-400' : 'text-rose-500'
  const EXIT  = isDark
    ? 'border border-white/15 text-slate-400 hover:text-white hover:border-white/30 rounded-full px-3 py-1.5 text-sm font-medium transition-all'
    : 'border border-rose-200 text-slate-500 hover:text-rose-800 hover:border-rose-400 rounded-full px-3 py-1.5 text-sm font-medium transition-all'

  return (
    <div className={`min-h-screen ${BG} flex flex-col items-center justify-center px-4 py-8`}>
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="space-y-2">
          <div className="text-5xl">🀄</div>
          <h1 className={`text-3xl font-black ${TITLE}`}>Grafana Mahjong</h1>
          <p className={`text-xs uppercase tracking-widest ${LABEL}`}>观察性 · Observability</p>
          <p className={`text-sm max-w-xs mx-auto leading-relaxed ${BODY}`}>
            Build a winning mahjong hand (4 melds + 1 pair) by answering Grafana trivia. Answer correctly to draw a tile — then discard one to keep your hand at 13.
          </p>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-3">
          {(['vs-bot', 'solo'] as const).map(mode => {
            const isActive = selectedMode === mode
            const cfg = mode === 'vs-bot'
              ? { icon: '🤖', label: 'vs GrafBot' }
              : { icon: '🧘', label: 'Solo Practice' }
            return (
              <button
                key={mode}
                onClick={() => { playClick(); setSelectedMode(mode) }}
                className={`py-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                  isActive
                    ? isDark ? 'border-[#d4af37]/60 bg-[#d4af37]/10 text-amber-200 shadow-lg shadow-[#d4af37]/10'
                             : 'border-rose-500 bg-rose-50 text-rose-700 shadow-lg shadow-rose-200'
                    : isDark ? 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                             : 'border-slate-200 bg-white text-slate-500 hover:border-rose-300'
                }`}
              >
                <div className="text-2xl mb-1">{cfg.icon}</div>
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* How to play */}
        <div className={`${CARD} space-y-2 text-left text-sm ${BODY}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${LABEL}`}>How to play</p>
          <div className="flex items-start gap-2"><span>🀄</span><span>You start with 13 tiles</span></div>
          <div className="flex items-start gap-2"><span>✅</span><span>Answer correctly → draw a tile (14 tiles)</span></div>
          <div className="flex items-start gap-2"><span>🗑️</span><span>Discard one tile to return to 13</span></div>
          <div className="flex items-start gap-2"><span>❌</span><span>Wrong answer → skip your turn</span></div>
          <div className="flex items-start gap-2"><span>🏆</span><span>Win: 4 melds + 1 pair (Tsumo!)</span></div>
          <div className={`text-[11px] mt-1 pt-2 border-t ${isDark ? 'border-white/10 text-slate-500' : 'border-rose-200 text-slate-400'}`}>
            Meld = 3 consecutive tiles of the same suit (sequence) or 3 identical tiles (triplet)
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onExit} className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold ${EXIT}`}>
            Back
          </button>
          <button
            onClick={() => { playClick(); onStart(selectedMode) }}
            className={`flex-1 px-4 py-3 rounded-xl text-white text-sm font-black shadow-lg active:scale-95 transition-all ${
              isDark ? 'bg-rose-700 hover:bg-rose-600 shadow-rose-900/40'
                     : 'bg-rose-600 hover:bg-rose-500 shadow-rose-400/30'
            }`}
          >
            Begin 开始
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  onExit: () => void
}

export default function MahjongGame({ onExit }: Props) {
  const [showExitModal, setShowExitModal] = useState(false)
  const [selectedTile,  setSelectedTile]  = useState<string | null>(null)

  const { isDark, toggle: toggleTheme } = useGameTheme()

  const {
    phase, gameMode, playerHand, botHand, drawPile, discardPile,
    currentQuestion, questionCount, correctCount,
    message, result, lastDrawnUid,
    startGame, handleAnswer, handleDiscard, resetGame,
  } = useGameLogic()

  // ─── Theme tokens ───────────────────────────────────────────────────────────
  const BG     = isDark
    ? 'bg-[radial-gradient(ellipse_at_50%_0%,_#3d0010_0%,_#0d0005_40%,_#050005_100%)]'
    : 'bg-gradient-to-br from-amber-50 via-rose-50 to-red-50'
  const HEADER = isDark
    ? 'bg-black/60 backdrop-blur-md border-b border-[#d4af37]/20'
    : 'bg-white/80 backdrop-blur-md border-b border-rose-200'
  const EXIT_BTN = isDark
    ? 'border border-white/15 text-slate-400 hover:text-white hover:border-white/30 rounded-full px-3 py-1.5 text-sm font-medium transition-all'
    : 'border border-rose-200 text-slate-500 hover:text-rose-800 hover:border-rose-400 rounded-full px-3 py-1.5 text-sm font-medium transition-all'
  const TITLE  = isDark
    ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-yellow-200'
    : 'text-rose-950'
  const NEUTRAL_BG = isDark
    ? 'bg-amber-950/70 border border-amber-500/40 text-amber-300'
    : 'bg-amber-50 border border-amber-300 text-amber-700'
  const CORRECT_BG = isDark
    ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
    : 'bg-emerald-50 border border-emerald-300 text-emerald-700'
  const WRONG_BG = isDark
    ? 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
    : 'bg-rose-50 border border-rose-300 text-rose-700'
  const MUTED  = isDark ? 'text-slate-500' : 'text-slate-400'

  const ThemeToggle = (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`relative w-10 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${isDark ? 'bg-rose-800' : 'bg-amber-400'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${isDark ? 'left-5' : 'left-1'}`} />
    </button>
  )

  const exitModal = showExitModal && (
    <ExitConfirmModal
      progressLabel={`Q${questionCount} · ${correctCount} correct`}
      onQuit={() => { resetGame(); onExit() }}
      onCancel={() => setShowExitModal(false)}
    />
  )

  // ─── Phase: intro ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="relative">
        {exitModal}
        <div className="absolute top-4 right-4 z-10">{ThemeToggle}</div>
        <IntroScreen
          isDark={isDark}
          onStart={startGame}
          onExit={() => { playClick(); setShowExitModal(true) }}
        />
      </div>
    )
  }

  // ─── Phase: finished ───────────────────────────────────────────────────────
  if (phase === 'finished' && result) {
    return (
      <ResultsScreen
        result={result}
        isDark={isDark}
        onPlayAgain={() => startGame(gameMode)}
        onExit={onExit}
      />
    )
  }

  // ─── Game screen ──────────────────────────────────────────────────────────
  const isQuestion   = phase === 'question'
  const mustDiscard  = phase === 'must-discard'
  const isBotTurn    = phase === 'bot-turn'
  const isWrongPhase = phase === 'wrong-answer'

  const msgBg = (() => {
    if (mustDiscard)  return CORRECT_BG
    if (isWrongPhase) return WRONG_BG
    if (isBotTurn)    return NEUTRAL_BG
    if (message)      return NEUTRAL_BG
    return NEUTRAL_BG
  })()

  return (
    <div className={`min-h-screen ${BG} flex flex-col`}>
      {exitModal}

      {/* Header */}
      <header className={`flex items-center justify-between px-4 py-3 shrink-0 ${HEADER}`}>
        <button onClick={() => { playClick(); setShowExitModal(true) }} className={EXIT_BTN}>
          ← Exit
        </button>
        <h1 className={`text-sm font-black ${TITLE}`}>🀄 Grafana Mahjong</h1>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2 py-1 rounded-full ${isDark ? 'bg-white/5 text-slate-400' : 'bg-rose-100 text-rose-500'}`}>
            Q{questionCount}
          </span>
          {ThemeToggle}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-3 px-4 py-3 overflow-y-auto max-w-3xl mx-auto w-full">

        {/* Draw pile counter */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-white/5 text-slate-400 border border-white/10' : 'bg-white/60 text-slate-500 border border-rose-200'}`}>
            <span>🎴</span>
            <span>Draw pile: <span className="font-bold">{drawPile.length}</span> tiles</span>
          </div>
          {gameMode === 'vs-bot' && (
            <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isBotTurn ? 'bg-amber-400 animate-pulse' : isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
              <span>{isBotTurn ? "GrafBot\u2019s turn" : 'Your turn'}</span>
            </div>
          )}
        </div>

        {/* Bot hand (vs-bot only) */}
        {gameMode === 'vs-bot' && (
          <BotHand count={botHand.length} isDark={isDark} />
        )}

        {/* Discard pile */}
        <DiscardPile tiles={discardPile} isDark={isDark} />

        {/* Question or status */}
        {isQuestion && currentQuestion && (
          <QuestionCard
            key={currentQuestion.id + '-' + questionCount}
            question={currentQuestion}
            onAnswer={i => handleAnswer(i, drawPile, playerHand, botHand)}
            disabled={false}
            isDark={isDark}
          />
        )}

        {(mustDiscard || isBotTurn || isWrongPhase || (!isQuestion && message)) && (
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center ${msgBg}`}>
            {message || (mustDiscard ? 'Pick a tile to discard — tap once to select, tap again to discard.' : '')}
          </div>
        )}

        {isBotTurn && (
          <div className={`text-center text-xs animate-pulse ${MUTED}`}>
            Waiting for GrafBot...
          </div>
        )}

        {/* Player hand */}
        <div className="mt-auto pt-2">
          <PlayerHand
            tiles={playerHand}
            onDiscard={uid => {
              handleDiscard(uid, drawPile, botHand)
              setSelectedTile(null)
            }}
            canDiscard={mustDiscard}
            lastDrawnUid={lastDrawnUid}
            selectedUid={selectedTile}
            onSelect={setSelectedTile}
            isDark={isDark}
          />
        </div>

        {/* Win hint when must-discard */}
        {mustDiscard && (
          <div className={`text-center text-[11px] leading-relaxed ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Newly drawn tile is highlighted in green · Winning hand = 4 melds + 1 pair
          </div>
        )}
      </div>
    </div>
  )
}
