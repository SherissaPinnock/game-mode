import { useState, type CSSProperties } from 'react'
import { playCorrect, playWrong, playComplete, playPop } from '@/lib/sounds'
import { StaticCourseRecommendation } from '@/components/GameRecommendations'
import { COURSE_MAP } from '@/lib/course-data'
import './CheckersGame.css'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Piece = 'player' | 'bot'
interface Cell   { piece: Piece | null; king: boolean }
type Board       = Cell[][]
interface Move   { fromR: number; fromC: number; toR: number; toC: number; captR: number | null; captC: number | null }
interface GitQuestion {
  id:           number
  text:         string
  options:      [string, string, string, string]
  correctIndex: number
}

// ─── Git Question Bank ─────────────────────────────────────────────────────────

const GIT_QUESTIONS: GitQuestion[] = [
  {
    id: 1,
    text: 'What does `git init` do?',
    options: [
      'Initializes a new Git repository in the current directory',
      'Connects the project to a remote GitHub repository',
      'Creates the first commit with all current files',
      'Downloads a remote repository to your machine',
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    text: 'Which command stages a file for the next commit?',
    options: ['git commit -m', 'git push origin', 'git add <file>', 'git stash'],
    correctIndex: 2,
  },
  {
    id: 3,
    text: 'What does a commit represent in Git?',
    options: [
      'A connection to a remote server',
      'A list of file names that changed',
      'A branch pointing to a tag',
      'A snapshot of all tracked files at a point in time',
    ],
    correctIndex: 3,
  },
  {
    id: 4,
    text: 'What does `git push` do?',
    options: [
      'Downloads changes from the remote repository',
      'Sends local commits to a remote repository',
      'Creates a new branch on the remote',
      'Merges two branches together',
    ],
    correctIndex: 1,
  },
  {
    id: 5,
    text: 'What is HEAD in Git?',
    options: [
      'The first commit ever made in the repository',
      'Always the same as the main/master branch',
      'A special pointer to the currently checked-out branch or commit',
      'The most recent tag applied to the project',
    ],
    correctIndex: 2,
  },
  {
    id: 6,
    text: 'What is a branch in Git?',
    options: [
      'A read-only copy of the entire repository',
      'A lightweight, movable pointer to a specific commit',
      'A connection to a remote repository',
      'A compressed archive of the project',
    ],
    correctIndex: 1,
  },
  {
    id: 7,
    text: 'What does `git pull` do?',
    options: [
      'Uploads local changes to the remote',
      'Creates a new branch from the remote',
      'Fetches and merges remote changes into the current branch',
      'Shows the difference between local and remote',
    ],
    correctIndex: 2,
  },
  {
    id: 8,
    text: 'What does `.gitignore` specify?',
    options: [
      'Files that are automatically committed on each save',
      'Users who are not allowed to push to the repo',
      'Files and folders Git should not track or commit',
      'Branches that are locked from merging',
    ],
    correctIndex: 2,
  },
  {
    id: 9,
    text: 'What does `git clone` do?',
    options: [
      'Creates an empty new repository on the remote',
      'Duplicates an existing branch locally',
      'Makes a local copy of a remote repository',
      'Commits and pushes in one step',
    ],
    correctIndex: 2,
  },
  {
    id: 10,
    text: 'What information does `git status` show?',
    options: [
      'The full commit history of the repository',
      'Staged, unstaged, and untracked changes in the working tree',
      'The remote URL and current user credentials',
      'The list of all existing branches',
    ],
    correctIndex: 1,
  },
  {
    id: 11,
    text: 'What does `git log` display?',
    options: [
      'Only the single most recent commit',
      'The list of active remote branches',
      'The current working directory file structure',
      'The commit history with hashes, authors, and messages',
    ],
    correctIndex: 3,
  },
  {
    id: 12,
    text: 'What is a merge conflict?',
    options: [
      'When two branches share the same name',
      'When a push is rejected because the remote is ahead',
      'When Git cannot automatically reconcile changes from two branches',
      'When a commit message is left empty',
    ],
    correctIndex: 2,
  },
  {
    id: 13,
    text: 'What does `git stash` do?',
    options: [
      'Permanently deletes all uncommitted changes',
      'Saves uncommitted changes temporarily so you can switch branches cleanly',
      'Creates a new branch from the current uncommitted state',
      'Squashes all commits into one',
    ],
    correctIndex: 1,
  },
  {
    id: 14,
    text: 'What does `git reset --hard HEAD` do?',
    options: [
      'Deletes the entire repository',
      'Moves HEAD back one commit while keeping changes staged',
      'Discards all uncommitted changes and resets to the last commit',
      'Forces a push to the remote',
    ],
    correctIndex: 2,
  },
  {
    id: 15,
    text: 'What is a tag in Git used for?',
    options: [
      'A branch that auto-tracks the latest commit',
      'A named reference pointing to a specific commit, typically used for releases',
      'A label applied to each file in the repository',
      'An alias for a remote connection',
    ],
    correctIndex: 1,
  },
  {
    id: 16,
    text: 'What is the difference between `git fetch` and `git pull`?',
    options: [
      'They are identical commands with different syntax',
      '`git fetch` also merges; `git pull` only downloads',
      '`git fetch` downloads without merging; `git pull` downloads and merges',
      '`git fetch` only works on tags; `git pull` works on branches',
    ],
    correctIndex: 2,
  },
  {
    id: 17,
    text: 'What does `git revert <commit>` do?',
    options: [
      'Permanently removes the commit from history',
      'Resets all files to an empty repository state',
      'Creates a new commit that undoes the changes of a previous commit',
      'Removes the last tag from that commit',
    ],
    correctIndex: 2,
  },
  {
    id: 18,
    text: 'What is `git rebase` used for?',
    options: [
      'Deleting old commits to save space',
      'Re-applying commits from one branch onto the tip of another branch',
      'Viewing a list of all remote branches',
      'Creating a new repository from an existing one',
    ],
    correctIndex: 1,
  },
  {
    id: 19,
    text: 'What is a fork on a Git hosting platform like GitHub?',
    options: [
      'A type of unresolvable merge conflict',
      'A personal copy of someone else\'s repository under your account',
      'An alias for a local branch',
      'A method to archive and delete a repository',
    ],
    correctIndex: 1,
  },
  {
    id: 20,
    text: 'What does `git cherry-pick <hash>` do?',
    options: [
      'Picks the best commit message from the log',
      'Removes duplicate commits automatically',
      'Shows only uncommitted changes in the working tree',
      'Applies the changes of a specific commit to the current branch',
    ],
    correctIndex: 3,
  },
  {
    id: 21,
    text: 'What does `git diff` show by default?',
    options: [
      'All commit messages in the repository',
      'Only files that have been deleted',
      'Differences between the working tree and the staging area',
      'The diff between the local branch and the remote',
    ],
    correctIndex: 2,
  },
  {
    id: 22,
    text: 'What is `git merge` used for?',
    options: [
      'Splitting a single branch into two separate branches',
      'Combining changes from one branch into the current branch',
      'Deleting merged branches automatically',
      'Uploading local changes to the remote server',
    ],
    correctIndex: 1,
  },
  {
    id: 23,
    text: 'What does `git checkout -b <branch>` do?',
    options: [
      'Deletes the specified branch',
      'Checks out an existing remote branch',
      'Creates a new branch and switches to it immediately',
      'Lists all local and remote branches',
    ],
    correctIndex: 2,
  },
  {
    id: 24,
    text: 'What is a remote in Git?',
    options: [
      'A branch that has never been pushed',
      'A version of the repository hosted on another server',
      'A local alias for the HEAD pointer',
      'A temporary stash of uncommitted changes',
    ],
    correctIndex: 1,
  },
  {
    id: 25,
    text: 'What does `git blame <file>` show?',
    options: [
      'All commits that deleted lines from the file',
      'Each line of the file annotated with who last modified it and in which commit',
      'Only the lines that caused merge conflicts',
      'The full diff history of every change to the file',
    ],
    correctIndex: 1,
  },
]

// ─── Colour palette ────────────────────────────────────────────────────────────

const C = {
  bg:          'radial-gradient(circle at top left, rgba(255,255,255,0.14), transparent 18%), linear-gradient(180deg, #58b88c 0%, #328764 48%, #184e3b 100%)',
  surface:     '#120a28',
  surfaceAlt:  '#1a1040',
  border:      '#3a2d6a',
  boardDark:   '#6d5ba8',
  boardLight:  '#ffe8b0',
  player:      '#ff6030',   // hot orange-red
  playerKing:  '#ffd700',   // gold king
  bot:         '#00d4ff',   // electric cyan
  botKing:     '#c084fc',   // violet king
  selected:    '#7c3aed',   // vivid violet
  validMove:   '#22d65a',   // bright green
  capture:     '#fb923c',   // hot amber
  text:        '#f0eeff',
  muted:       '#8b7fb8',
  green:       '#22d65a',
  red:         '#ff4444',
  gold:        '#fbbf24',
}

// ─── Board helpers ─────────────────────────────────────────────────────────────

function createBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => ({ piece: null, king: false }))
  )
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 !== 1) continue
      if (r < 3)  board[r][c] = { piece: 'bot',    king: false }
      if (r > 4)  board[r][c] = { piece: 'player', king: false }
    }
  }
  return board
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => ({ ...cell })))
}

function inBounds(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8 }

function getDirs(piece: Piece, king: boolean): [number, number][] {
  if (king) return [[-1,-1],[-1,1],[1,-1],[1,1]]
  return piece === 'player' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]
}

/** All moves for a specific piece at (r,c). Returns captures separately. */
function getMovesFrom(board: Board, r: number, c: number): { normals: Move[]; captures: Move[] } {
  const cell = board[r][c]
  if (!cell.piece) return { normals: [], captures: [] }

  const normals: Move[] = []
  const captures: Move[] = []

  for (const [dr, dc] of getDirs(cell.piece, cell.king)) {
    const nr = r + dr, nc = c + dc
    if (!inBounds(nr, nc)) continue

    const neighbour = board[nr][nc]

    if (!neighbour.piece) {
      normals.push({ fromR: r, fromC: c, toR: nr, toC: nc, captR: null, captC: null })
    } else if (neighbour.piece !== cell.piece) {
      const jr = r + 2 * dr, jc = c + 2 * dc
      if (inBounds(jr, jc) && !board[jr][jc].piece) {
        captures.push({ fromR: r, fromC: c, toR: jr, toC: jc, captR: nr, captC: nc })
      }
    }
  }

  return { normals, captures }
}

/** All valid moves for a player. Captures are mandatory if available. */
function getAllMoves(board: Board, player: Piece): Move[] {
  const allCaptures: Move[] = []
  const allNormals:  Move[] = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c].piece !== player) continue
      const { normals, captures } = getMovesFrom(board, r, c)
      allCaptures.push(...captures)
      allNormals.push(...normals)
    }
  }

  return allCaptures.length > 0 ? allCaptures : allNormals
}

function applyMove(board: Board, move: Move): Board {
  const next = cloneBoard(board)
  const piece = next[move.fromR][move.fromC]

  next[move.toR][move.toC] = { ...piece }
  next[move.fromR][move.fromC] = { piece: null, king: false }

  if (move.captR !== null && move.captC !== null) {
    next[move.captR][move.captC] = { piece: null, king: false }
  }

  // Kinging
  if (piece.piece === 'player' && move.toR === 0) next[move.toR][move.toC].king = true
  if (piece.piece === 'bot'    && move.toR === 7) next[move.toR][move.toC].king = true

  return next
}

function countPieces(board: Board, player: Piece): number {
  let n = 0
  board.forEach(row => row.forEach(cell => { if (cell.piece === player) n++ }))
  return n
}

// ─── Bot AI ────────────────────────────────────────────────────────────────────

function scoreBotMove(board: Board, move: Move): number {
  let s = 0
  if (move.captR !== null) s += 30          // prefer captures
  const newBoard = applyMove(board, move)
  if (newBoard[move.toR][move.toC].king) s += 20   // kinging
  // Prefer advancing toward player territory (rows 6-7)
  s += move.toR * 2
  // Prefer center columns
  s += 4 - Math.abs(move.toC - 3.5)
  return s
}

function getBotMove(board: Board, moves: Move[]): Move {
  const scored = moves.map(m => ({ m, s: scoreBotMove(board, m) }))
  scored.sort((a, b) => b.s - a.s)
  // Pick from top-tier moves with some randomness
  const best = scored[0].s
  const top  = scored.filter(x => x.s >= best - 2)
  return top[Math.floor(Math.random() * top.length)].m
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface Props { onExit: () => void }

type Phase = 'player-turn' | 'bot-thinking' | 'trivia' | 'game-over'

export default function CheckersGame({ onExit }: Props) {
  const [board,            setBoard]            = useState<Board>(createBoard)
  const [phase,            setPhase]            = useState<Phase>('player-turn')
  const [selected,         setSelected]         = useState<[number, number] | null>(null)
  const [validForSelected, setValidForSelected] = useState<Move[]>([])
  const [continueCaptureFrom, setContinueCaptureFrom] = useState<[number, number] | null>(null)
  const [activeQuestion,   setActiveQuestion]   = useState<GitQuestion | null>(null)
  const [pendingCapture,   setPendingCapture]   = useState<Move | null>(null)
  const [answeredOk,       setAnsweredOk]       = useState<boolean | null>(null)
  const [usedQIds,         setUsedQIds]         = useState<Set<number>>(new Set())
  const [score,            setScore]            = useState(0)
  const [playerCaptures,   setPlayerCaptures]   = useState(0)
  const [_botCaptures,     setBotCaptures]      = useState(0)
  const [winner,           setWinner]           = useState<Piece | 'draw' | null>(null)
  const [log,              setLog]              = useState<string[]>([])

  // ── Game over check ─────────────────────────────────────────────────────────
  function checkGameOver(nextBoard: Board, nextPlayer: Piece): boolean {
    const playerCount = countPieces(nextBoard, 'player')
    const botCount    = countPieces(nextBoard, 'bot')

    if (playerCount === 0) {
      setWinner('bot'); setPhase('game-over'); return true
    }
    if (botCount === 0) {
      setWinner('player'); setPhase('game-over'); playComplete(); return true
    }
    if (getAllMoves(nextBoard, nextPlayer).length === 0) {
      setWinner(nextPlayer === 'player' ? 'bot' : 'player')
      setPhase('game-over')
      if (nextPlayer === 'bot') playComplete()
      return true
    }
    return false
  }

  // ── Pick a git question ─────────────────────────────────────────────────────
  function pickQuestion(): GitQuestion {
    const available = GIT_QUESTIONS.filter(q => !usedQIds.has(q.id))
    const pool = available.length > 0 ? available : GIT_QUESTIONS
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // ── Handle cell click ───────────────────────────────────────────────────────
  function handleCellClick(r: number, c: number) {
    if (phase !== 'player-turn') return

    const cell = board[r][c]
    const allMoves = getAllMoves(board, 'player')

    // If a piece is forced to continue capturing, only allow that piece
    if (continueCaptureFrom) {
      const [fr, fc] = continueCaptureFrom
      if (r === fr && c === fc) {
        // Clicked the forced piece — re-show its captures
        const { captures } = getMovesFrom(board, r, c)
        setSelected([r, c])
        setValidForSelected(captures)
        return
      }
      // Clicked a destination while forced piece is selected
      if (selected) {
        const move = validForSelected.find(m => m.toR === r && m.toC === c)
        if (move) { executePlayerMove(move); return }
      }
      return
    }

    // Clicking own piece → select it
    if (cell.piece === 'player') {
      const movesForPiece = allMoves.filter(m => m.fromR === r && m.fromC === c)
      setSelected([r, c])
      setValidForSelected(movesForPiece)
      playPop()
      return
    }

    // Clicking a valid destination
    if (selected) {
      const move = validForSelected.find(m => m.toR === r && m.toC === c)
      if (move) { executePlayerMove(move); return }
    }

    // Deselect
    setSelected(null)
    setValidForSelected([])
  }

  // ── Execute player move ─────────────────────────────────────────────────────
  function executePlayerMove(move: Move) {
    setSelected(null)
    setValidForSelected([])

    const nextBoard = applyMove(board, move)

    if (move.captR !== null) {
      // Show trivia after a capture
      const question = pickQuestion()
      setUsedQIds(prev => new Set([...prev, question.id]))
      setActiveQuestion(question)
      setPendingCapture(move)
      setBoard(nextBoard)
      setPlayerCaptures(c => c + 1)
      setPhase('trivia')
      addLog(`You captured an opponent commit!`)
    } else {
      // Regular move — check for kinging
      const kinged = !board[move.fromR][move.fromC].king && nextBoard[move.toR][move.toC].king
      if (kinged) addLog(`👑 Commit promoted to Tag (king)!`)
      setBoard(nextBoard)
      if (!checkGameOver(nextBoard, 'bot')) {
        startBotTurn(nextBoard)
      }
    }
  }

  // ── Trivia answer ───────────────────────────────────────────────────────────
  function handleAnswer(idx: number) {
    if (!activeQuestion || !pendingCapture) return
    const correct = idx === activeQuestion.correctIndex
    setAnsweredOk(correct)

    if (correct) {
      playCorrect()
      setScore(s => s + 20)
      addLog(`✓ Correct! +20 pts`)
    } else {
      playWrong()
      setScore(s => Math.max(0, s - 5))
      addLog(`✗ Wrong. -5 pts. Answer: ${activeQuestion.options[activeQuestion.correctIndex].slice(0, 40)}…`)
    }

    const move = pendingCapture
    setTimeout(() => {
      setActiveQuestion(null)
      setPendingCapture(null)
      setAnsweredOk(null)

      // Check if player can continue capturing from landing square
      const { captures: continuations } = getMovesFrom(board, move.toR, move.toC)
      if (continuations.length > 0 && move.captR !== null) {
        // Multi-jump: force the player to capture again
        setContinueCaptureFrom([move.toR, move.toC])
        setSelected([move.toR, move.toC])
        setValidForSelected(continuations)
        setPhase('player-turn')
        addLog(`Chain capture available — keep going!`)
      } else {
        setContinueCaptureFrom(null)
        if (!checkGameOver(board, 'bot')) {
          startBotTurn(board)
        }
      }
    }, 900)
  }

  // ── Bot turn ────────────────────────────────────────────────────────────────
  function startBotTurn(currentBoard: Board) {
    setPhase('bot-thinking')
    setTimeout(() => {
      const moves = getAllMoves(currentBoard, 'bot')
      if (moves.length === 0) {
        setWinner('player'); setPhase('game-over'); playComplete(); return
      }
      const move = getBotMove(currentBoard, moves)
      const nextBoard = applyMove(currentBoard, move)

      if (move.captR !== null) {
        setBotCaptures(c => c + 1)
        addLog(`Bot squashed your commit 💀`)
      } else {
        const kinged = !currentBoard[move.fromR][move.fromC].king && nextBoard[move.toR][move.toC].king
        if (kinged) addLog(`Bot's commit promoted to Tag!`)
      }

      setBoard(nextBoard)
      if (!checkGameOver(nextBoard, 'player')) {
        setPhase('player-turn')
      }
    }, 900)
  }

  function addLog(msg: string) {
    setLog(prev => [msg, ...prev].slice(0, 8))
  }

  function restart() {
    setBoard(createBoard())
    setPhase('player-turn')
    setSelected(null)
    setValidForSelected([])
    setContinueCaptureFrom(null)
    setActiveQuestion(null)
    setPendingCapture(null)
    setAnsweredOk(null)
    setUsedQIds(new Set())
    setScore(0)
    setPlayerCaptures(0)
    setBotCaptures(0)
    setWinner(null)
    setLog([])
  }

  // ── Compute highlight sets ──────────────────────────────────────────────────
  const validDestinations = new Set(validForSelected.map(m => `${m.toR},${m.toC}`))
  const captureDestinations = new Set(
    validForSelected.filter(m => m.captR !== null).map(m => `${m.toR},${m.toC}`)
  )

  // ─── Render: game over ───────────────────────────────────────────────────────
  if (phase === 'game-over' && winner) {
    const won = winner === 'player'
    const gameOverVars = {
      '--ck-accent': won ? C.gold : '#ef7f98',
      '--ck-accent-soft': won ? '#fff0b9' : '#ffd7df',
    } as CSSProperties
    return (
      <div className="ck-shell ck-shell-outcome">
        <div className="ck-outcome-card" style={gameOverVars}>
          <div className="ck-outcome-emoji">
            {won ? '🚀' : '💥'}
          </div>
          <div className="ck-outcome-ribbon">{won ? 'Release Cleared' : 'Repo Trouble'}</div>
          <h2 className="ck-outcome-title">
            {won ? 'Merged to Main!' : 'Merge Conflict!'}
          </h2>
          <p className="ck-outcome-subtitle">
            {won
              ? 'You defeated the bot and resolved all Git conflicts!'
              : 'The bot squashed all your commits. Better luck next time!'}
          </p>
          <div className="ck-outcome-stats">
            <div className="ck-outcome-stat">
              <div className="ck-outcome-stat-num">{score}</div>
              <div className="ck-outcome-stat-label">Score</div>
            </div>
            <div className="ck-outcome-divider" />
            <div className="ck-outcome-stat">
              <div className="ck-outcome-stat-num">{playerCaptures}</div>
              <div className="ck-outcome-stat-label">Captured</div>
            </div>
          </div>
          <div className="ck-outcome-actions">
            <button onClick={onExit} className="ck-btn ck-btn-ghost">← Menu</button>
            <button onClick={restart} className="ck-btn ck-btn-primary">Play Again ↺</button>
          </div>
        </div>
        <div className="ck-reco-wrap">
          <StaticCourseRecommendation courses={COURSE_MAP.git} />
        </div>
      </div>
    )
  }

  // ─── Render: main game ───────────────────────────────────────────────────────
  const statusLabel = phase === 'bot-thinking' ? '🤖 Bot is thinking…'
    : phase === 'trivia'    ? '📖 Answer the Git question!'
    : continueCaptureFrom   ? '⚡ Chain capture — keep going!'
    : '🎯 Your turn'

  const statusColor = phase === 'bot-thinking' ? C.bot
    : phase === 'trivia'  ? C.gold
    : continueCaptureFrom ? C.capture
    : C.validMove

  return (
    <div className="ck-shell">
      {/* Top bar */}
      <div className="ck-topbar">
        <button onClick={onExit} className="ck-btn ck-btn-ghost">← Exit</button>

        <div className="ck-title-wrap">
          <div className="ck-title-ribbon">Repository Arena</div>
          <div className="ck-title">
            ♟ Git Checkers
          </div>
          <div className="ck-status" style={{ color: statusColor }}>
            {statusLabel}
          </div>
        </div>

        <div className="ck-score-stack">
          <div className="ck-score-badge">
            <div className="ck-score-num">{score}</div>
            <div className="ck-score-label">Pts</div>
          </div>
          <div className="ck-piece-stack">
            <PieceCount color={C.player} count={countPieces(board, 'player')} label="You" />
            <PieceCount color={C.bot}    count={countPieces(board, 'bot')}    label="Bot" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="ck-body">
        {/* Board */}
        <div className="ck-board-column">
          <div className="ck-board-banner">
            <span className="ck-board-banner-label">Board State</span>
            <span className="ck-board-banner-text">Dark tiles are playable. Captures still trigger Git trivia.</span>
          </div>
          <BoardGrid
            board={board}
            selected={selected}
            validDestinations={validDestinations}
            captureDestinations={captureDestinations}
            forcedPiece={continueCaptureFrom}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Side panel: legend + log */}
        <div className="ck-side-column">
          {/* Legend */}
          <div className="ck-panel">
            <div className="ck-panel-kicker">
              Legend
            </div>
            {[
              { color: C.player,    label: 'Your commits',       glow: '#ff603040' },
              { color: C.bot,       label: "Bot's commits",      glow: '#00d4ff40' },
              { color: C.selected,  label: 'Selected',           glow: '#7c3aed40' },
              { color: C.capture,   label: 'Capture available',  glow: '#fb923c40' },
            ].map(({ color, label, glow }) => (
              <div key={label} className="ck-legend-row">
                <div
                  className="ck-legend-dot"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, white, ${color})`,
                    boxShadow: `0 0 6px ${glow}`,
                  }}
                />
                <span className="ck-legend-text">{label}</span>
              </div>
            ))}
            <div className="ck-panel-sep">
              <div className="ck-legend-sub">Captures → trivia question</div>
              <div className="ck-legend-reward">✓ Correct: +20 pts</div>
              <div className="ck-legend-penalty">✗ Wrong: −5 pts</div>
            </div>
          </div>

          {/* Git log */}
          <div className="ck-panel ck-log-panel">
            <div className="ck-log-head">
              <span className="ck-log-prompt">$</span>
              <span className="ck-log-title">git log</span>
            </div>
            {log.length === 0 ? (
              <div className="ck-log-empty">No moves yet…</div>
            ) : (
              log.map((entry, i) => (
                <div
                  key={i}
                  className={`ck-log-entry ${i === 0 ? 'is-latest' : ''}`}
                  style={{ opacity: i === 0 ? 1 : Math.max(0.4, 1 - i * 0.12) }}
                >
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Trivia modal */}
      {phase === 'trivia' && activeQuestion && (
        <TriviaModal
          question={activeQuestion}
          answeredOk={answeredOk}
          onAnswer={handleAnswer}
        />
      )}
    </div>
  )
}

// ─── Board Grid ─────────────────────────────────────────────────────────────────

function BoardGrid({
  board, selected, validDestinations, captureDestinations, forcedPiece, onCellClick,
}: {
  board:               Board
  selected:            [number, number] | null
  validDestinations:   Set<string>
  captureDestinations: Set<string>
  forcedPiece:         [number, number] | null
  onCellClick:         (r: number, c: number) => void
}) {
  const size = 'min(56px, calc((100vw - 48px) / 8))'

  return (
    <div
      className="ck-board-frame"
      style={{
        gridTemplateColumns: `repeat(8, ${size})`,
        gridTemplateRows: `repeat(8, ${size})`,
      }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const isDarkSq   = (r + c) % 2 === 1
          const key        = `${r},${c}`
          const isSelected = selected?.[0] === r && selected?.[1] === c
          const isValid    = validDestinations.has(key)
          const isCapture  = captureDestinations.has(key)
          const isForced   = forcedPiece?.[0] === r && forcedPiece?.[1] === c

          let bg = isDarkSq ? C.boardDark : C.boardLight
          if (isSelected) bg = '#8f78da'
          if (isForced)   bg = '#bff0bf'

          const playerGrad = cell.king
            ? 'radial-gradient(circle at 35% 35%, #ffe566, #fbbf24 60%, #b45309)'
            : 'radial-gradient(circle at 35% 35%, #ff9066, #ff6030 55%, #b91c1c)'
          const botGrad = cell.king
            ? 'radial-gradient(circle at 35% 35%, #e879f9, #c084fc 60%, #6b21a8)'
            : 'radial-gradient(circle at 35% 35%, #67e8f9, #00d4ff 55%, #0369a1)'

          const pieceGlow = cell.piece === 'player'
            ? (isSelected ? `0 0 16px #ff6030cc, 0 0 4px #ff6030` : '0 3px 8px rgba(0,0,0,0.7), 0 0 6px #ff603040')
            : (isSelected ? `0 0 16px #00d4ffcc, 0 0 4px #00d4ff` : '0 3px 8px rgba(0,0,0,0.7), 0 0 6px #00d4ff40')

          return (
            <div
              key={key}
              onClick={() => onCellClick(r, c)}
              className={[
                'ck-square',
                isDarkSq ? 'ck-square-dark' : 'ck-square-light',
                isSelected ? 'is-selected' : '',
                isForced ? 'is-forced' : '',
              ].join(' ')}
              style={{
                background: bg,
                cursor: isDarkSq ? 'pointer' : 'default',
                boxShadow: isSelected ? `inset 0 0 0 4px #2c2144` : undefined,
              }}
            >
              {/* Valid move dot */}
              {isValid && !cell.piece && (
                <div
                  className={`ck-move-dot ${isCapture ? 'is-capture' : ''}`}
                  style={{
                    background: isCapture
                      ? `radial-gradient(circle, #fde68a, ${C.capture})`
                      : `radial-gradient(circle, #86efac, ${C.validMove})`,
                  }}
                />
              )}

              {/* Piece */}
              {cell.piece && (
                <div
                  className={[
                    'ck-piece',
                    cell.piece === 'player' ? 'ck-piece-player' : 'ck-piece-bot',
                    cell.king ? 'is-king' : '',
                  ].join(' ')}
                  style={{
                    background: cell.piece === 'player' ? playerGrad : botGrad,
                    border: isSelected
                      ? '3px solid rgba(255,255,255,0.92)'
                      : isForced
                        ? `3px solid ${C.gold}`
                        : '3px solid rgba(44,33,68,0.6)',
                    boxShadow: pieceGlow,
                    color: cell.piece === 'player' ? '#fff8e6' : '#e0f7ff',
                  }}
                >
                  {cell.king ? '♛' : ''}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Trivia Modal ───────────────────────────────────────────────────────────────

function TriviaModal({
  question, answeredOk, onAnswer,
}: {
  question:   GitQuestion
  answeredOk: boolean | null
  onAnswer:   (idx: number) => void
}) {
  return (
    <div className="ck-modal-overlay">
      <div className="ck-modal">
        {/* Header */}
        <div className="ck-modal-header">
          <div className="ck-modal-chip">
            ⚡ Git Challenge
          </div>
          <div className="ck-modal-sub">
            Answer correctly to confirm the capture!
          </div>
        </div>

        {/* Question box */}
        <div className="ck-question-box">
          <p className="ck-question-text">
            {question.text}
          </p>
        </div>

        {/* Options */}
        <div className="ck-options">
          {question.options.map((opt, idx) => {
            const isCorrect = answeredOk !== null && idx === question.correctIndex
            const cursor: CSSProperties['cursor'] = answeredOk !== null ? 'default' : 'pointer'
            const bg = isCorrect ? 'rgba(34,214,90,0.12)' : 'rgba(255,255,255,0.04)'
            const border = isCorrect ? `2px solid ${C.green}` : `2px solid #3a2d6a`
            const color  = isCorrect ? '#86efac' : C.text
            const labelBg = isCorrect ? C.green : '#2d1d5a'
            const labelColor = isCorrect ? '#000' : C.muted

            return (
              <button
                key={idx}
                onClick={() => answeredOk === null && onAnswer(idx)}
                className={`ck-option ${isCorrect ? 'is-correct' : ''}`}
                style={{
                  background: bg, border, borderRadius: 10,
                  padding: '11px 16px', textAlign: 'left',
                  fontSize: 13, color, cursor,
                  fontFamily: 'inherit', fontWeight: 500, lineHeight: 1.5,
                  transition: 'all 0.2s',
                  boxShadow: isCorrect ? `0 0 12px ${C.green}44` : 'none',
                }}
              >
                <span
                  className="ck-option-letter"
                  style={{ background: labelBg, color: labelColor }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            )
          })}
        </div>

        {answeredOk !== null && (
          <div className={`ck-answer-banner ${answeredOk ? 'is-correct' : 'is-wrong'}`}>
            {answeredOk ? '✅ Conflict resolved! +20 pts' : '❌ Merge failed! −5 pts'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Piece Count Indicator ─────────────────────────────────────────────────────

function PieceCount({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <div className="ck-piece-count">
      <div
        className="ck-piece-count-dot"
        style={{
          background: `radial-gradient(circle at 35% 35%, white, ${color})`,
          boxShadow: `0 0 6px ${color}88`,
        }}
      />
      <span className="ck-piece-count-label">{label}:</span>
      <span className="ck-piece-count-value">{count}</span>
    </div>
  )
}

// ─── Button styles ─────────────────────────────────────────────────────────────
