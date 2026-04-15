import { useRef, useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import type { Level } from '../data/levels'
import { QuestionModal } from './QuestionModal'

const WHITE_PIECES: Record<string, string> = {
  k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙',
}
const BLACK_PIECES: Record<string, string> = {
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

const PIECE_LABELS: Record<string, string> = {
  p: 'Pawn', r: 'Rook', n: 'Knight', b: 'Bishop', q: 'Queen', k: 'King',
}

const FILES = 'abcdefgh'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Props {
  level: Level
  onComplete: (correct: number, total: number) => void
  onExit: () => void
}

export function CloudBoard({ level, onComplete, onExit }: Props) {
  const chessRef = useRef<Chess>(new Chess(level.fen))
  const [boardState, setBoardState] = useState(() => chessRef.current.board())
  const [selected, setSelected] = useState<string | null>(null)
  const [validMoves, setValidMoves] = useState<string[]>([])
  const [pendingCapture, setPendingCapture] = useState<{ from: string; to: string; piece: string } | null>(null)
  const [capturedCount, setCapturedCount] = useState<Record<string, number>>({})
  const [questions] = useState(() => shuffle(level.questions))
  const [qIdx, setQIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null)
  const [blackThinking, setBlackThinking] = useState(false)

  // After white moves, black plays: captures first, otherwise random.
  function playBlackRandom() {
    const moves = chessRef.current.moves({ verbose: true })
    if (moves.length === 0) return

    // Always take a capture when one is available
    const captures = moves.filter(m => m.captured)
    const pool = captures.length > 0 ? captures : moves
    const chosen = pool[Math.floor(Math.random() * pool.length)]

    chessRef.current.move(chosen)
    setBoardState([...chessRef.current.board()])
  }

  // Check mission complete
  useEffect(() => {
    const done = level.targets.every(t => (capturedCount[t.piece] ?? 0) >= t.count)
    if (done && Object.values(capturedCount).some(v => v > 0)) {
      setTimeout(() => onComplete(correct, total), 600)
    }
  }, [capturedCount]) // eslint-disable-line react-hooks/exhaustive-deps

  function sq(row: number, col: number) {
    return `${FILES[col]}${8 - row}` as `${string}${number}`
  }

  function handleSquareClick(row: number, col: number) {
    if (pendingCapture || blackThinking) return
    const square = sq(row, col)
    const piece = chessRef.current.get(square)

    // No piece selected yet
    if (!selected) {
      if (piece?.color === 'w') {
        setSelected(square)
        const moves = chessRef.current.moves({ square, verbose: true })
        setValidMoves(moves.map(m => m.to))
      }
      return
    }

    // Deselect
    if (square === selected) {
      setSelected(null); setValidMoves([]); return
    }

    // Switch to another own piece
    if (piece?.color === 'w') {
      setSelected(square)
      const moves = chessRef.current.moves({ square, verbose: true })
      setValidMoves(moves.map(m => m.to))
      return
    }

    // Valid destination
    if (validMoves.includes(square)) {
      const target = chessRef.current.get(square)
      if (target?.color === 'b') {
        // Capture — require question (don't move yet; wait for answer)
        setPendingCapture({ from: selected, to: square, piece: target.type })
      } else {
        // Normal move — execute, then black replies after a short delay
        chessRef.current.move({ from: selected, to: square, promotion: 'q' })
        setBoardState([...chessRef.current.board()])
        setTimeout(playBlackRandom, 600)
      }
      setSelected(null); setValidMoves([])
      return
    }

    // Invalid — clear selection
    setSelected(null); setValidMoves([])
  }

  function handleAnswer(isCorrect: boolean) {
    if (!pendingCapture) return
    setTotal(t => t + 1)

    if (isCorrect) {
      setCorrect(c => c + 1)
      setLastResult('correct')
      const capturedType = pendingCapture.piece
      chessRef.current.move({ from: pendingCapture.from, to: pendingCapture.to, promotion: 'q' })
      setBoardState([...chessRef.current.board()])
      setTimeout(playBlackRandom, 800)
      setCapturedCount(prev => ({ ...prev, [capturedType]: (prev[capturedType] ?? 0) + 1 }))
    } else {
      setLastResult('wrong')
    }

    setPendingCapture(null)
    setQIdx(i => i + 1)
    setTimeout(() => setLastResult(null), 1000)
  }

  const currentQ = questions[qIdx % questions.length]
  const totalTargets = level.targets.reduce((s, t) => s + t.count, 0)
  const totalCaptured = Object.values(capturedCount).reduce((s, v) => s + v, 0)

  return (
    <div
      className="cc-game-screen"
      style={{ background: `linear-gradient(160deg, ${level.bgFrom} 0%, ${level.bgTo} 100%)` }}
    >
      {/* Top bar */}
      <div className="cc-topbar">
        <button className="cc-exit-btn" onClick={onExit}>← Exit</button>
        <div className="cc-topbar-center">
          <span className="cc-topbar-level" style={{ color: level.accentColor }}>Level {level.id}</span>
          <span className="cc-topbar-title">
            {level.title}
            {blackThinking && <span className="cc-thinking-dot"> ···</span>}
          </span>
        </div>
        <div className="cc-topbar-score">
          <span className="cc-score-correct" style={{ color: level.accentColor }}>{correct}</span>
          <span className="cc-score-sep">/</span>
          <span className="cc-score-total">{total}</span>
          <span className="cc-score-label">correct</span>
        </div>
      </div>

      <div className="cc-game-body">

        {/* Mission Panel */}
        <aside className="cc-mission-panel">
          <p className="cc-panel-heading">🎯 Mission</p>
          <div className="cc-progress-bar-wrap">
            <div
              className="cc-progress-bar-fill"
              style={{
                width: totalTargets > 0 ? `${(totalCaptured / totalTargets) * 100}%` : '0%',
                background: level.accentColor,
              }}
            />
          </div>
          <p className="cc-progress-text">{totalCaptured} / {totalTargets} captured</p>

          <div className="cc-target-list">
            {level.targets.map(t => {
              const captured = capturedCount[t.piece] ?? 0
              const done = captured >= t.count
              return (
                <div key={t.piece} className={`cc-target-item ${done ? 'cc-target-done' : ''}`}>
                  <span className="cc-target-emoji">{t.emoji}</span>
                  <span className="cc-target-label">{t.label}</span>
                  <span className="cc-target-count" style={{ color: done ? '#4ade80' : level.accentColor }}>
                    {captured}/{t.count}
                  </span>
                  {done && <span className="cc-target-check">✓</span>}
                </div>
              )
            })}
          </div>

          <div className="cc-tip-box">
            <p className="cc-tip-title">☁️ Topic</p>
            <p className="cc-tip-body">{level.topic}</p>
            <p className="cc-tip-sub">Answer cloud questions to capture enemy pieces</p>
          </div>

          {lastResult && (
            <div className={`cc-flash-msg ${lastResult === 'correct' ? 'cc-flash-good' : 'cc-flash-bad'}`}>
              {lastResult === 'correct' ? '✓ Captured!' : '✗ Retreated!'}
            </div>
          )}
        </aside>

        {/* Board */}
        <div className="cc-board-container">
          <div className="cc-board-glow" style={{ boxShadow: `0 0 60px ${level.accentColor}33` }}>
            <div className="cc-board">
              {boardState.map((rank, rowIdx) =>
                rank.map((cell, colIdx) => {
                  const square = sq(rowIdx, colIdx)
                  const isLight = (rowIdx + colIdx) % 2 === 0
                  const isSelected = selected === square
                  const isValidMove = validMoves.includes(square)
                  const isEnemy = cell?.color === 'b'
                  const isTargetPiece = isEnemy && level.targets.some(
                    t => t.piece === cell?.type && (capturedCount[t.piece] ?? 0) < t.count
                  )

                  return (
                    <div
                      key={square}
                      className={[
                        'cc-square',
                        isLight ? 'cc-sq-light' : 'cc-sq-dark',
                        isSelected ? 'cc-sq-selected' : '',
                        isValidMove && isEnemy && !isTargetPiece ? 'cc-sq-capturable' : '',
                        isTargetPiece && isValidMove ? 'cc-sq-target-capturable' : '',
                      ].join(' ')}
                      onClick={() => handleSquareClick(rowIdx, colIdx)}
                      title={square}
                    >
                      {/* File label on rank 1 */}
                      {rowIdx === 7 && (
                        <span className="cc-coord cc-coord-file">{FILES[colIdx]}</span>
                      )}
                      {/* Rank label on file a */}
                      {colIdx === 0 && (
                        <span className="cc-coord cc-coord-rank">{8 - rowIdx}</span>
                      )}

                      {/* Valid move dot */}
                      {isValidMove && !cell && (
                        <div className="cc-move-dot" style={{ background: level.accentColor }} />
                      )}

                      {/* Piece */}
                      {cell && (
                        <span
                          className={[
                            'cc-piece',
                            cell.color === 'w' ? 'cc-piece-white' : 'cc-piece-black',
                            isTargetPiece ? 'cc-piece-target' : '',
                          ].join(' ')}
                        >
                          {cell.color === 'w' ? WHITE_PIECES[cell.type] : BLACK_PIECES[cell.type]}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Question Modal */}
      {pendingCapture && (
        <QuestionModal
          question={currentQ}
          accentColor={level.accentColor}
          pieceName={PIECE_LABELS[pendingCapture.piece]}
          onAnswer={handleAnswer}
        />
      )}
    </div>
  )
}
