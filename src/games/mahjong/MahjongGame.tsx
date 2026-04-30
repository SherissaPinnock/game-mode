import { useState } from 'react'
import { useGameLogic } from './hooks/useGameLogic'
import { useGameTheme } from '@/lib/useGameTheme'
import type { Tile, Question, GameResult } from './types'
import { playClick } from '@/lib/sounds'
import { ExitConfirmModal } from '@/components/ExitConfirmModal'
import './MahjongGame.css'

// ─── Tile component ────────────────────────────────────────────────────────────

function TileCard({
  tile,
  isSelected = false,
  isLastDrawn = false,
  onClick,
  faceDown = false,
  size = 'md',
}: {
  tile: Tile
  isSelected?: boolean
  isLastDrawn?: boolean
  onClick?: () => void
  faceDown?: boolean
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'sm' ? 'tmj-tile-sm' : 'tmj-tile-md'
  const stateClass = faceDown
    ? 'is-face-down'
    : isSelected
      ? 'is-selected'
      : isLastDrawn
        ? 'is-last-drawn'
        : 'is-default'

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`tmj-tile ${sizeClass} ${stateClass} ${onClick ? 'is-clickable' : ''} shrink-0`}
    >
      {faceDown
        ? <span className="tmj-tile-back">🀫</span>
        : <span className="leading-none select-none">{tile.unicode}</span>
      }
    </button>
  )
}

// ─── Hand display ──────────────────────────────────────────────────────────────

function PlayerHand({
  tiles, onDiscard, canDiscard, lastDrawnUid, selectedUid, onSelect,
}: {
  tiles: Tile[]
  onDiscard: (uid: string) => void
  canDiscard: boolean
  lastDrawnUid: string | null
  selectedUid: string | null
  onSelect: (uid: string | null) => void
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
    <div className="space-y-2">
      <div className="tmj-panel-header">
        <span className="tmj-panel-title">
          Your hand ({tiles.length})
        </span>
        {canDiscard && (
          <span className="tmj-panel-note animate-pulse">
            Tap once to select · tap again to discard
          </span>
        )}
      </div>
      <div className="tmj-tiles py-1">
        {tiles.map(tile => (
          <TileCard
            key={tile.uid}
            tile={tile}
            isSelected={selectedUid === tile.uid}
            isLastDrawn={lastDrawnUid === tile.uid}
            onClick={canDiscard ? () => handleTileClick(tile.uid) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function BotHand({ count }: { count: number }) {
  // Dummy tile for face-down rendering
  const dummy: Tile = { uid: 'x', suit: 'characters', value: 1, unicode: '🀫' }
  return (
    <div className="space-y-2">
      <div className="tmj-panel-header">
        <span className="tmj-panel-title">GrafBot ({count} tiles)</span>
        <span className="tmj-panel-note">Hidden hand</span>
      </div>
      <div className="tmj-tiles py-1">
        {Array.from({ length: Math.min(count, 14) }).map((_, i) => (
          <TileCard key={i} tile={dummy} faceDown size="sm" />
        ))}
      </div>
    </div>
  )
}

function DiscardPile({ tiles }: { tiles: Tile[] }) {
  const recent = tiles.slice(-18)
  return (
    <div className="space-y-2">
      <div className="tmj-panel-header">
        <span className="tmj-panel-title">Discards ({tiles.length})</span>
        <span className="tmj-panel-note">Latest 18 shown</span>
      </div>
      <div className="tmj-pile-tray">
        <div className="tmj-tiles">
          {recent.map((t, i) => (
            <TileCard key={`${t.uid}-${i}`} tile={t} size="sm" />
          ))}
          {tiles.length === 0 && (
            <span className="tmj-empty-state">No tiles discarded yet</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({
  question, onAnswer, disabled,
}: {
  question: Question
  onAnswer: (i: number) => void
  disabled: boolean
}) {
  const diffBadge: Record<string, string> = {
    easy: 'pal-difficulty-easy',
    medium: 'pal-difficulty-medium',
    hard: 'pal-difficulty-hard',
  }

  return (
    <div className="pal-question-card tmj-question-card w-full overflow-hidden">
      <div className="space-y-3">
        <div className="tmj-question-meta">
          <span className={`pal-difficulty-pill ${diffBadge[question.difficulty]}`}>
          {question.difficulty}
        </span>
          <span className="tmj-question-tag">Grafana trivia</span>
          <span className="tmj-question-note">Answer correctly to draw a tile</span>
        </div>
        <p className="tmj-question-copy text-sm">{question.question}</p>
        <div className="tmj-answer-grid">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { if (!disabled) onAnswer(i) }}
              disabled={disabled}
              className="pal-answer-btn text-sm"
            >
              <span className="tmj-answer-letter inline-block w-5 text-center mr-1 font-bold">
                {['一', '二', '三', '四'][i]}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  result, onPlayAgain, onExit,
}: {
  result: GameResult
  onPlayAgain: () => void
  onExit: () => void
}) {
  const won  = result.winner === 'player'
  const draw = result.winner === 'draw'
  const accuracy = result.questionCount > 0
    ? Math.round(result.correctCount / result.questionCount * 100)
    : 0

  return (
    <div className="pal-results-card tmj-results-card w-full mx-auto text-center space-y-6">
      <div className="space-y-2">
        <div className="text-6xl">{won ? '🏆' : draw ? '🤝' : '🀄'}</div>
        <div className="pal-kicker">
          {won ? 'Victory! 恭喜' : draw ? 'Draw Game' : 'GrafBot Wins'}
        </div>
        <h2 className="pal-title text-3xl">
          {won ? 'Tsumo!' : draw ? 'Game over' : 'Better luck next time'}
        </h2>
        <p className="pal-body-copy text-sm">
          {won && 'You completed a winning hand with strong Grafana knowledge.'}
          {draw && 'The wall ran dry before either side could complete a hand.'}
          {!won && !draw && 'GrafBot completed the stronger hand this round.'}
        </p>
      </div>

      <div className="tmj-results-grid">
        {[
          { label: 'Questions', value: result.questionCount },
          { label: 'Correct', value: result.correctCount },
          { label: 'Accuracy', value: `${accuracy}%` },
          { label: 'Turns', value: result.turnsPlayed },
        ].map(stat => (
          <div key={stat.label} className="pal-stat-card">
            <div className={`pal-stat-value ${stat.label === 'Accuracy' ? 'text-[#4d3821]' : stat.label === 'Correct' ? 'text-[#355c46]' : ''}`}>
              {stat.value}
            </div>
            <div className="pal-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <p className="tmj-results-copy text-sm">
        Winning hand target: 4 melds + 1 pair
      </p>

      <div className="tmj-actions pt-2">
        <button
          onClick={onExit}
          className="pal-btn pal-btn-ghost flex-1 px-4 py-3 text-sm"
        >
          Exit
        </button>
        <button
          onClick={onPlayAgain}
          className="pal-btn pal-btn-primary flex-1 px-4 py-3 text-sm"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}

// ─── Intro screen ─────────────────────────────────────────────────────────────

function IntroScreen({
  onStart, onExit,
}: {
  onStart: (mode: 'vs-bot' | 'solo') => void
  onExit: () => void
}) {
  const [selectedMode, setSelectedMode] = useState<'vs-bot' | 'solo'>('vs-bot')

  return (
    <div className="pal-intro-card tmj-intro-card text-center space-y-6">
      <div className="space-y-2">
        <div className="text-5xl">🀄</div>
        <div className="pal-kicker">观察性 · Observability</div>
        <h1 className="pal-title text-3xl">Grafana Mahjong</h1>
        <p className="pal-body-copy text-sm max-w-sm mx-auto leading-relaxed">
          Build a winning mahjong hand by answering Grafana trivia. Correct answers let
          you draw a tile, then discard one to shape your hand.
        </p>
      </div>

      <div className="tmj-mode-grid">
        {(['vs-bot', 'solo'] as const).map(mode => {
          const isActive = selectedMode === mode
          const config = mode === 'vs-bot'
            ? { icon: '🤖', label: 'vs GrafBot' }
            : { icon: '🧘', label: 'Solo Practice' }
          return (
            <button
              key={mode}
              onClick={() => { playClick(); setSelectedMode(mode) }}
              className={`pal-mode-card tmj-mode-card ${isActive ? 'is-selected' : 'is-unselected'}`}
            >
              <div className="text-2xl mb-1">{config.icon}</div>
              {config.label}
            </button>
          )
        })}
      </div>

      <div className="pal-rules-card tmj-rules-card text-left text-sm">
        <div className="tmj-rules-list">
          <div className="tmj-rule-row"><span>🀄</span><span>You start with 13 tiles</span></div>
          <div className="tmj-rule-row"><span>✅</span><span>Correct answer = draw a tile, then discard one</span></div>
          <div className="tmj-rule-row"><span>❌</span><span>Wrong answer = skip your turn</span></div>
          <div className="tmj-rule-row"><span>🏆</span><span>Win by making 4 melds and 1 pair</span></div>
          <div className="tmj-rule-row"><span>🤖</span><span>GrafBot plays back in versus mode</span></div>
        </div>
        <div className="tmj-rules-note text-[11px]">
          Meld = 3 consecutive tiles of the same suit or 3 identical tiles.
        </div>
      </div>

      <div className="tmj-actions">
        <button onClick={onExit} className="pal-btn pal-btn-ghost flex-1 px-4 py-3 text-sm">
          Back
        </button>
        <button
          onClick={() => { playClick(); onStart(selectedMode) }}
          className="pal-btn pal-btn-primary flex-1 px-4 py-3 text-sm"
        >
          Begin 开始
        </button>
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

  const ThemeToggle = (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="pal-theme-toggle"
    >
      <span className="pal-theme-toggle-knob" style={{ left: isDark ? '20px' : '4px' }} />
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
      <div className={`pal-shell tmj-shell tmj-intro-shell ${isDark ? 'pal-shell-dark' : ''}`}>
        {exitModal}
        <div className="absolute top-4 right-4 z-10">{ThemeToggle}</div>
        <IntroScreen onStart={startGame} onExit={() => { playClick(); setShowExitModal(true) }} />
      </div>
    )
  }

  // ─── Phase: finished ───────────────────────────────────────────────────────
  if (phase === 'finished' && result) {
    return (
      <div className={`pal-shell tmj-shell tmj-results-shell ${isDark ? 'pal-shell-dark' : ''}`}>
        <ResultsScreen
          result={result}
          onPlayAgain={() => startGame(gameMode)}
          onExit={onExit}
        />
      </div>
    )
  }

  // ─── Game screen ──────────────────────────────────────────────────────────
  const isQuestion   = phase === 'question'
  const mustDiscard  = phase === 'must-discard'
  const isBotTurn    = phase === 'bot-turn'
  const isWrongPhase = phase === 'wrong-answer'

  const messageTone = (() => {
    if (mustDiscard) return 'pal-status-success'
    if (isWrongPhase) return 'pal-status-danger'
    if (isBotTurn) return 'pal-status-warn'
    return 'pal-status-info'
  })()

  return (
    <div className={`pal-shell tmj-shell ${isDark ? 'pal-shell-dark' : ''}`}>
      {exitModal}
      <div className="tmj-content-wrap">
        <header className="pal-topbar tmj-topbar">
          <button onClick={() => { playClick(); setShowExitModal(true) }} className="pal-btn pal-btn-ghost px-4 py-2 text-sm">
            ← Exit
          </button>
          <h1 className="pal-subtitle text-center">🀄 Grafana Mahjong</h1>
          <div className="flex items-center gap-2">
            <span className="pal-badge font-mono">Q{questionCount}</span>
            {ThemeToggle}
          </div>
        </header>

        <div className="tmj-content">
          <div className="tmj-overview-row">
            <div className="pal-badge tmj-overview-badge">
              <span>🎴</span>
              <span>Draw pile: {drawPile.length} tiles</span>
            </div>
            {gameMode === 'vs-bot' && (
              <div className={`tmj-turn-indicator ${isBotTurn ? 'is-active' : ''}`}>
                <span className="tmj-turn-dot" />
                <span>{isBotTurn ? "GrafBot's turn" : 'Your turn'}</span>
              </div>
            )}
          </div>

          {gameMode === 'vs-bot' && (
            <div className="pal-status-card tmj-panel">
              <BotHand count={botHand.length} />
            </div>
          )}

          <div className="pal-status-card tmj-panel">
            <DiscardPile tiles={discardPile} />
          </div>

          {isQuestion && currentQuestion && (
            <QuestionCard
              key={currentQuestion.id + '-' + questionCount}
              question={currentQuestion}
              onAnswer={i => handleAnswer(i, drawPile, playerHand, botHand)}
              disabled={false}
            />
          )}

          {(mustDiscard || isBotTurn || isWrongPhase || (!isQuestion && message)) && (
            <div className="pal-status-card tmj-status-card">
              <p className={`pal-status-message text-sm ${messageTone}`}>
                {message || (mustDiscard ? 'Pick a tile to discard. Tap once to select it, then tap again to discard.' : '')}
              </p>
            </div>
          )}

          {isBotTurn && (
            <div className="tmj-wait-note pal-muted text-xs animate-pulse">
              Waiting for GrafBot...
            </div>
          )}

          <div className="pal-status-card tmj-panel mt-auto">
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
            />
          </div>

          {mustDiscard && (
            <div className="tmj-helper-note pal-muted text-[11px] leading-relaxed">
              Newly drawn tile is highlighted in green. Winning hand = 4 melds + 1 pair.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
