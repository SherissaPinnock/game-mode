import { useState } from 'react'
import { playCorrect, playWrong, playComplete, playPop } from '@/lib/sounds'
import { StaticCourseRecommendation } from '@/components/GameRecommendations'
import { COURSE_MAP } from '@/lib/course-data'

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
  bg:          'radial-gradient(ellipse at 50% 0%, #1a0533 0%, #06040f 55%, #031020 100%)',
  surface:     '#120a28',
  surfaceAlt:  '#1a1040',
  border:      '#3a2d6a',
  boardDark:   '#1e0a3c',   // rich deep violet square
  boardLight:  '#0a1e14',   // rich deep forest green square
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
    const accentColor = won ? C.gold : C.red
    const accentGlow  = won ? '#fbbf2444' : '#ff444444'
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        fontFamily: 'system-ui, sans-serif', padding: 24, gap: 20,
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #160b30, #0d0820)',
          border: `2px solid ${accentColor}`,
          borderRadius: 20, padding: '40px 48px', maxWidth: 460, width: '100%',
          textAlign: 'center',
          boxShadow: `0 0 60px ${accentGlow}, 0 0 120px rgba(124,58,237,0.15), 0 20px 40px rgba(0,0,0,0.7)`,
        }}>
          <div style={{ fontSize: 64, marginBottom: 14, filter: `drop-shadow(0 0 20px ${accentColor})` }}>
            {won ? '🚀' : '💥'}
          </div>
          <h2 style={{
            margin: '0 0 8px', fontSize: 26, fontWeight: 900,
            background: `linear-gradient(90deg, ${accentColor}, #fff)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {won ? 'Merged to Main!' : 'Merge Conflict!'}
          </h2>
          <p style={{ color: C.muted, fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
            {won
              ? 'You defeated the bot and resolved all Git conflicts!'
              : 'The bot squashed all your commits. Better luck next time!'}
          </p>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 24,
            background: 'rgba(255,255,255,0.04)', borderRadius: 12,
            border: '1px solid #3a2d6a',
            padding: '16px 24px', marginBottom: 28,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.gold, lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.12em', marginTop: 4 }}>SCORE</div>
            </div>
            <div style={{ width: 1, background: '#3a2d6a' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.green, lineHeight: 1 }}>{playerCaptures}</div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.12em', marginTop: 4 }}>CAPTURED</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={onExit}  style={outlineBtn}>← Menu</button>
            <button onClick={restart} style={primaryBtn}>Play Again ↺</button>
          </div>
        </div>
        <div style={{ maxWidth: 460, width: '100%' }}>
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
    <div style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: 'system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        background: 'rgba(10,6,26,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid #3a2d6a`,
        padding: '10px 18px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
      }}>
        <button onClick={onExit} style={outlineBtn}>← Exit</button>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 17, fontWeight: 900,
            background: 'linear-gradient(90deg, #c084fc, #67e8f9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            ♟ Git Checkers
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: statusColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
            {statusLabel}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{
            textAlign: 'center', background: 'rgba(251,191,36,0.1)',
            border: `1px solid ${C.gold}44`, borderRadius: 8, padding: '4px 10px',
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.gold, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.08em' }}>PTS</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <PieceCount color={C.player} count={countPieces(board, 'player')} label="You" />
            <PieceCount color={C.bot}    count={countPieces(board, 'bot')}    label="Bot" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, display: 'flex', gap: 16,
        padding: '20px 16px', justifyContent: 'center', alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {/* Board */}
        <div>
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
        <div style={{
          minWidth: 200, maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* Legend */}
          <div style={{
            background: 'rgba(18,10,40,0.85)', backdropFilter: 'blur(8px)',
            border: `1px solid #3a2d6a`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }}>
              Legend
            </div>
            {[
              { color: C.player,    label: 'Your commits',       glow: '#ff603040' },
              { color: C.bot,       label: "Bot's commits",      glow: '#00d4ff40' },
              { color: C.selected,  label: 'Selected',           glow: '#7c3aed40' },
              { color: C.capture,   label: 'Capture available',  glow: '#fb923c40' },
            ].map(({ color, label, glow }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, white, ${color})`,
                  boxShadow: `0 0 6px ${glow}`, flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: C.text }}>{label}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid #3a2d6a`, marginTop: 10, paddingTop: 10 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Captures → trivia question</div>
              <div style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓ Correct: +20 pts</div>
              <div style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>✗ Wrong: −5 pts</div>
            </div>
          </div>

          {/* Git log */}
          <div style={{
            background: 'rgba(18,10,40,0.85)', backdropFilter: 'blur(8px)',
            border: `1px solid #3a2d6a`,
            borderRadius: 12, padding: '14px 16px', flex: 1,
          }}>
            <div style={{
              fontSize: 10, color: C.muted, letterSpacing: '0.12em', fontWeight: 700,
              textTransform: 'uppercase', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: C.green, fontFamily: 'monospace' }}>$</span>
              <span style={{ fontFamily: 'monospace', color: C.green }}>git log</span>
            </div>
            {log.length === 0 ? (
              <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>No moves yet…</div>
            ) : (
              log.map((entry, i) => (
                <div key={i} style={{
                  fontSize: 11,
                  color: i === 0 ? C.text : C.muted,
                  marginBottom: 6, lineHeight: 1.6,
                  borderLeft: i === 0 ? `2px solid ${C.green}` : `2px solid #3a2d6a`,
                  paddingLeft: 8,
                  fontFamily: 'monospace',
                  opacity: i === 0 ? 1 : Math.max(0.4, 1 - i * 0.12),
                }}>
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
    <div style={{
      display: 'inline-grid',
      gridTemplateColumns: `repeat(8, ${size})`,
      gridTemplateRows:    `repeat(8, ${size})`,
      border: `3px solid #4a3080`,
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 0 40px rgba(124,58,237,0.3), 0 8px 32px rgba(0,0,0,0.6)',
    }}>
      {board.map((row, r) =>
        row.map((cell, c) => {
          const isDarkSq   = (r + c) % 2 === 1
          const key        = `${r},${c}`
          const isSelected = selected?.[0] === r && selected?.[1] === c
          const isValid    = validDestinations.has(key)
          const isCapture  = captureDestinations.has(key)
          const isForced   = forcedPiece?.[0] === r && forcedPiece?.[1] === c

          let bg = isDarkSq ? C.boardDark : C.boardLight
          if (isSelected) bg = '#2d1060'
          if (isForced)   bg = '#1a3010'

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
              style={{
                background: bg,
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDarkSq ? 'pointer' : 'default',
                position: 'relative',
                transition: 'background 0.15s',
                boxShadow: isSelected ? `inset 0 0 0 2px ${C.selected}88` : undefined,
              }}
            >
              {/* Valid move dot */}
              {isValid && !cell.piece && (
                <div style={{
                  width: '32%', height: '32%',
                  borderRadius: '50%',
                  background: isCapture
                    ? `radial-gradient(circle, #fde68a, ${C.capture})`
                    : `radial-gradient(circle, #86efac, ${C.validMove})`,
                  boxShadow: isCapture ? `0 0 8px ${C.capture}` : `0 0 8px ${C.validMove}`,
                  opacity: 0.9,
                }} />
              )}

              {/* Piece */}
              {cell.piece && (
                <div style={{
                  width: '78%', height: '78%',
                  borderRadius: '50%',
                  background: cell.piece === 'player' ? playerGrad : botGrad,
                  border: isSelected
                    ? `2px solid rgba(255,255,255,0.9)`
                    : isForced
                      ? `2px solid ${C.gold}`
                      : `2px solid rgba(255,255,255,0.2)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: pieceGlow,
                  transition: 'all 0.15s',
                  fontSize: '42%',
                  fontWeight: 900,
                  color: cell.piece === 'player' ? '#fff8e6' : '#e0f7ff',
                  userSelect: 'none',
                }}>
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
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(3,2,12,0.92)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 20,
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #160b30, #0d0820)',
        border: `2px solid ${C.gold}`,
        borderRadius: 18, padding: '28px 32px',
        maxWidth: 540, width: '100%',
        boxShadow: `0 0 60px ${C.gold}33, 0 0 120px rgba(124,58,237,0.2), 0 20px 40px rgba(0,0,0,0.8)`,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            background: 'linear-gradient(135deg, #78350f, #451a03)',
            border: `1px solid ${C.gold}`,
            borderRadius: 8, padding: '5px 14px',
            fontSize: 11, fontWeight: 900, color: C.gold,
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            ⚡ Git Challenge
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            Answer correctly to confirm the capture!
          </div>
        </div>

        {/* Question box */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: `1px solid #3a2d6a`,
          borderRadius: 12, padding: '14px 18px', marginBottom: 18,
          borderLeft: `3px solid ${C.gold}`,
        }}>
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 600, color: C.text,
            lineHeight: 1.7, fontFamily: '"Fira Code", monospace',
          }}>
            {question.text}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {question.options.map((opt, idx) => {
            const isCorrect = answeredOk !== null && idx === question.correctIndex
            const cursor: React.CSSProperties['cursor'] = answeredOk !== null ? 'default' : 'pointer'
            const bg = isCorrect ? 'rgba(34,214,90,0.12)' : 'rgba(255,255,255,0.04)'
            const border = isCorrect ? `2px solid ${C.green}` : `2px solid #3a2d6a`
            const color  = isCorrect ? '#86efac' : C.text
            const labelBg = isCorrect ? C.green : '#2d1d5a'
            const labelColor = isCorrect ? '#000' : C.muted

            return (
              <button
                key={idx}
                onClick={() => answeredOk === null && onAnswer(idx)}
                style={{
                  background: bg, border, borderRadius: 10,
                  padding: '11px 16px', textAlign: 'left',
                  fontSize: 13, color, cursor,
                  fontFamily: 'inherit', fontWeight: 500, lineHeight: 1.5,
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  transition: 'all 0.2s',
                  boxShadow: isCorrect ? `0 0 12px ${C.green}44` : 'none',
                }}
              >
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                  background: labelBg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900, color: labelColor,
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            )
          })}
        </div>

        {answeredOk !== null && (
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 10, textAlign: 'center',
            background: answeredOk ? 'rgba(34,214,90,0.1)' : 'rgba(255,68,68,0.1)',
            border: `2px solid ${answeredOk ? C.green : C.red}`,
            fontSize: 14, fontWeight: 800,
            color: answeredOk ? '#86efac' : '#fca5a5',
            boxShadow: answeredOk ? `0 0 20px ${C.green}33` : `0 0 20px ${C.red}33`,
          }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{
        width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
        background: `radial-gradient(circle at 35% 35%, white, ${color})`,
        boxShadow: `0 0 6px ${color}88`,
      }} />
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 900, color: C.text }}>{count}</span>
    </div>
  )
}

// ─── Button styles ─────────────────────────────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  padding: '10px 24px',
  background: 'linear-gradient(to bottom, #fbbf24, #d97706)',
  borderBottom: '4px solid #92400e',
  border: 'none',
  borderRadius: 50,
  color: '#1c0a00', fontSize: 13, fontWeight: 900,
  cursor: 'pointer', fontFamily: 'inherit',
  boxShadow: '0 4px 16px rgba(251,191,36,0.3)',
}

const outlineBtn: React.CSSProperties = {
  padding: '8px 18px', background: 'transparent',
  border: `1px solid #3a2d6a`, borderRadius: 50,
  color: '#8b7fb8', fontSize: 12, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
}
