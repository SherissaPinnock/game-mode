import { useState} from 'react'
import { playCorrect, playWrong, playComplete } from '@/lib/sounds'
import { StaticCourseRecommendation } from '@/components/GameRecommendations'
import { COURSE_MAP } from '@/lib/course-data'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CSharpQuestion {
  id: number
  text: string
  options: [string, string, string, string]
  correctIndex: number
}

// ─── C# Architecture Question Bank ────────────────────────────────────────────

const QUESTIONS: CSharpQuestion[] = [
  {
    id: 1,
    text: 'What is the main purpose of an interface in C#?',
    options: [
      'To define a contract of methods/properties a class must implement',
      'To store data fields in memory',
      'To handle runtime exceptions',
      'To create instances of abstract types',
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    text: 'Which symbol is used to inherit from a base class in C#?',
    options: ['extends', 'implements', 'inherits', ': (colon)'],
    correctIndex: 3,
  },
  {
    id: 3,
    text: 'What does the "abstract" keyword mean for a class?',
    options: [
      'The class is static and cannot have instances',
      'The class is sealed and cannot be extended',
      'The class cannot be instantiated directly',
      'The class has no public members',
    ],
    correctIndex: 2,
  },
  {
    id: 4,
    text: 'What is encapsulation in OOP?',
    options: [
      'Inheriting all properties from a parent class',
      'Bundling data and methods that operate on that data within a class',
      'Having a method appear in multiple forms',
      'Splitting a class into smaller sub-classes',
    ],
    correctIndex: 1,
  },
  {
    id: 5,
    text: 'Which access modifier makes a member visible only within its own class?',
    options: ['public', 'protected', 'internal', 'private'],
    correctIndex: 3,
  },
  {
    id: 6,
    text: 'What is a constructor in C#?',
    options: [
      'A static factory method for creating objects',
      'A method that destructs and frees objects',
      'A special method automatically called when an object is created',
      'A method that always returns "this"',
    ],
    correctIndex: 2,
  },
  {
    id: 7,
    text: 'Which SOLID principle states that a class should have only one reason to change?',
    options: [
      'Open/Closed Principle',
      'Liskov Substitution Principle',
      'Interface Segregation Principle',
      'Single Responsibility Principle',
    ],
    correctIndex: 3,
  },
  {
    id: 8,
    text: 'What is polymorphism in C#?',
    options: [
      'Hiding all implementation details from callers',
      'A class having multiple constructors',
      'An object taking many forms through inheritance or interfaces',
      'A method that calls itself recursively',
    ],
    correctIndex: 2,
  },
  {
    id: 9,
    text: 'Which keyword makes a method overridable in a derived class?',
    options: ['abstract', 'override', 'virtual', 'sealed'],
    correctIndex: 2,
  },
  {
    id: 10,
    text: 'What is the key difference between a class and a struct in C#?',
    options: [
      'Structs support inheritance; classes do not',
      'Classes are reference types; structs are value types',
      'Classes are always faster than structs',
      'There is no meaningful difference',
    ],
    correctIndex: 1,
  },
  {
    id: 11,
    text: 'What does a "static" member belong to?',
    options: [
      'The current instance of the class',
      'The derived class only',
      'The class itself, shared across all instances',
      'The interface it implements',
    ],
    correctIndex: 2,
  },
  {
    id: 12,
    text: 'What is Dependency Injection (DI)?',
    options: [
      'Injecting SQL commands into a query',
      'Providing an object\'s dependencies from outside rather than creating them internally',
      'Adding new methods to an existing class at runtime',
      'A technique for handling null reference exceptions',
    ],
    correctIndex: 1,
  },
  {
    id: 13,
    text: 'What is the Repository pattern primarily used for?',
    options: [
      'Storing application log files on disk',
      'Managing user authentication tokens',
      'Abstracting data access logic away from business logic',
      'Routing HTTP requests to controllers',
    ],
    correctIndex: 2,
  },
  {
    id: 14,
    text: 'Which keyword prevents a class from being inherited?',
    options: ['abstract', 'static', 'private', 'sealed'],
    correctIndex: 3,
  },
  {
    id: 15,
    text: 'What advantage do C# properties have over public fields?',
    options: [
      'Properties execute faster than fields',
      'Properties are always read-only',
      'Properties provide controlled access through get/set accessors',
      'Properties automatically serialize to JSON',
    ],
    correctIndex: 2,
  },
  {
    id: 16,
    text: 'What does the "override" keyword do in C#?',
    options: [
      'Creates an entirely new method unrelated to the parent',
      'Hides the parent method without polymorphic dispatch',
      'Provides a new implementation of a virtual or abstract method',
      'Forces the compiler to inline the method',
    ],
    correctIndex: 2,
  },
  {
    id: 17,
    text: 'What does the Open/Closed Principle state?',
    options: [
      'All classes should be open to direct modification at all times',
      'Software entities should be open for extension but closed for modification',
      'Open-source classes should never be modified',
      'Methods must be either public or closed (private)',
    ],
    correctIndex: 1,
  },
  {
    id: 18,
    text: 'What is an abstract method?',
    options: [
      'A method that runs asynchronously',
      'A private method with no return value',
      'A static method on an abstract class',
      'A method declared without implementation that derived classes must override',
    ],
    correctIndex: 3,
  },
  {
    id: 19,
    text: 'What is a namespace in C#?',
    options: [
      'A naming convention for variables',
      'A container that organises types and prevents naming conflicts',
      'A special type of class with no methods',
      'An access modifier for assemblies',
    ],
    correctIndex: 1,
  },
  {
    id: 20,
    text: 'What does MVC stand for and what does it separate?',
    options: [
      'Multiple Virtual Classes — runtime types from compile-time types',
      'Main View Component — HTML from CSS from JavaScript',
      'Model-View-Controller — data, UI presentation, and business logic',
      'Managed Virtual Code — managed from unmanaged memory',
    ],
    correctIndex: 2,
  },
  {
    id: 21,
    text: 'What does the "protected" access modifier allow?',
    options: [
      'Access from any class in any assembly',
      'Access only within the declaring class itself',
      'Access within the declaring class and all derived classes',
      'Access within the same assembly only',
    ],
    correctIndex: 2,
  },
  {
    id: 22,
    text: 'What is method overloading?',
    options: [
      'A method that calls itself with different arguments',
      'Multiple methods sharing the same name but with different parameter signatures',
      'Replacing a base class method in a derived class',
      'A method that throws multiple exception types',
    ],
    correctIndex: 1,
  },
  {
    id: 23,
    text: 'What does the Liskov Substitution Principle require?',
    options: [
      'Classes should be kept as small as possible',
      'Derived classes must be substitutable for their base classes without breaking behaviour',
      'Interfaces should cover all possible behaviours',
      'Each method should have exactly one responsibility',
    ],
    correctIndex: 1,
  },
  {
    id: 24,
    text: 'What is "coupling" in software architecture?',
    options: [
      'A structural design pattern connecting two classes',
      'The degree of interdependence between software modules',
      'A technique for joining two database tables',
      'A method for concatenating strings efficiently',
    ],
    correctIndex: 1,
  },
  {
    id: 25,
    text: 'What is "cohesion" in software architecture?',
    options: [
      'How tightly classes depend on each other',
      'The total number of methods in a class',
      'How well the elements within a module belong together for one purpose',
      'The average execution speed of a module',
    ],
    correctIndex: 2,
  },
  {
    id: 26,
    text: 'What does the Interface Segregation Principle state?',
    options: [
      'Interfaces should cover as many behaviours as possible',
      'Every class must implement at least one interface',
      'Clients should not be forced to depend on interfaces they do not use',
      'Interfaces cannot contain property definitions',
    ],
    correctIndex: 2,
  },
  {
    id: 27,
    text: 'Which keyword is used to call a base class constructor in C#?',
    options: ['super()', 'parent()', 'base()', 'this()'],
    correctIndex: 2,
  },
  {
    id: 28,
    text: 'What is the Dependency Inversion Principle?',
    options: [
      'Dependencies should always be avoided in clean architecture',
      'High-level modules should depend on abstractions, not concretions',
      'Classes should depend directly on each other for tight cohesion',
      'Only interfaces — never abstract classes — should be used',
    ],
    correctIndex: 1,
  },
  {
    id: 29,
    text: 'What is a generic class in C#?',
    options: [
      'A class with no methods or properties',
      'The ultimate base class from which all objects derive',
      'A class that operates on any type using type parameters (e.g. List<T>)',
      'A class that cannot be instantiated',
    ],
    correctIndex: 2,
  },
  {
    id: 30,
    text: 'What is the Service Locator pattern?',
    options: [
      'A pattern that resolves dependencies through a central registry',
      'A pattern for locating files on the server filesystem',
      'A pattern for routing HTTP requests to service endpoints',
      'A database lookup pattern using indexed keys',
    ],
    correctIndex: 0,
  },
]

// ─── Puzzles ───────────────────────────────────────────────────────────────────

// Each puzzle is a 9×9 grid; 0 = empty cell
// Three shuffled-difficulty easy puzzles

const PUZZLES: { puzzle: number[][]; solution: number[][] }[] = [
  {
    puzzle: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  },
  {
    puzzle: [
      [0, 0, 3, 0, 2, 0, 6, 0, 0],
      [9, 0, 0, 3, 0, 5, 0, 0, 1],
      [0, 0, 1, 8, 0, 6, 4, 0, 0],
      [0, 0, 8, 1, 0, 2, 9, 0, 0],
      [7, 0, 0, 0, 0, 0, 0, 0, 8],
      [0, 0, 6, 7, 0, 8, 2, 0, 0],
      [0, 0, 2, 6, 0, 9, 5, 0, 0],
      [8, 0, 0, 2, 0, 3, 0, 0, 9],
      [0, 0, 5, 0, 1, 0, 3, 0, 0],
    ],
    solution: [
      [4, 8, 3, 9, 2, 1, 6, 5, 7],
      [9, 6, 7, 3, 4, 5, 8, 2, 1],
      [2, 5, 1, 8, 7, 6, 4, 9, 3],
      [5, 4, 8, 1, 3, 2, 9, 7, 6],
      [7, 2, 9, 5, 6, 4, 1, 3, 8],
      [1, 3, 6, 7, 9, 8, 2, 4, 5],
      [3, 7, 2, 6, 8, 9, 5, 1, 4],
      [8, 1, 4, 2, 5, 3, 7, 6, 9],
      [6, 9, 5, 4, 1, 7, 3, 8, 2],
    ],
  },
  {
    puzzle: [
      [0, 2, 0, 6, 0, 8, 0, 0, 0],
      [5, 8, 0, 0, 0, 9, 7, 0, 0],
      [0, 0, 0, 0, 4, 0, 0, 0, 0],
      [3, 7, 0, 0, 0, 0, 5, 0, 0],
      [6, 0, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 8, 0, 0, 0, 0, 1, 3],
      [0, 0, 0, 0, 2, 0, 0, 0, 0],
      [0, 0, 9, 8, 0, 0, 0, 3, 6],
      [0, 0, 0, 3, 0, 6, 0, 9, 0],
    ],
    solution: [
      [1, 2, 3, 6, 7, 8, 9, 4, 5],
      [5, 8, 4, 2, 3, 9, 7, 6, 1],
      [9, 6, 7, 1, 4, 5, 3, 2, 8],
      [3, 7, 2, 4, 6, 1, 5, 8, 9],
      [6, 9, 1, 5, 8, 3, 2, 7, 4],
      [4, 5, 8, 7, 9, 2, 6, 1, 3],
      [8, 3, 6, 9, 2, 4, 1, 5, 7],
      [2, 4, 9, 8, 5, 7, 4, 3, 6],
      [7, 1, 5, 3, 1, 6, 8, 9, 2],
    ],
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function cloneBoard(b: number[][]): number[][] {
  return b.map(row => [...row])
}

function getConflicts(board: number[][]): Set<string> {
  const conflicts = new Set<string>()

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c]
      if (val === 0) continue

      // Row
      for (let cc = 0; cc < 9; cc++) {
        if (cc !== c && board[r][cc] === val) {
          conflicts.add(`${r},${c}`)
          conflicts.add(`${r},${cc}`)
        }
      }
      // Col
      for (let rr = 0; rr < 9; rr++) {
        if (rr !== r && board[rr][c] === val) {
          conflicts.add(`${r},${c}`)
          conflicts.add(`${rr},${c}`)
        }
      }
      // Box
      const br = Math.floor(r / 3) * 3
      const bc = Math.floor(c / 3) * 3
      for (let rr = br; rr < br + 3; rr++) {
        for (let cc = bc; cc < bc + 3; cc++) {
          if ((rr !== r || cc !== c) && board[rr][cc] === val) {
            conflicts.add(`${r},${c}`)
            conflicts.add(`${rr},${cc}`)
          }
        }
      }
    }
  }
  return conflicts
}

function isSolved(board: number[][], solution: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== solution[r][c]) return false
    }
  }
  return true
}

function pickQuestion(used: Set<number>): CSharpQuestion {
  const available = QUESTIONS.filter(q => !used.has(q.id))
  const pool = available.length > 0 ? available : QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Colour palette ────────────────────────────────────────────────────────────

const C = {
  bg:         '#0f172a',
  surface:    '#1e293b',
  surfaceAlt: '#253347',
  border:     '#334155',
  boxBorder:  '#64748b',
  accent:     '#3b82f6',
  accentDark: '#1d4ed8',
  gold:       '#f59e0b',
  goldDark:   '#b45309',
  green:      '#22c55e',
  red:        '#ef4444',
  text:       '#f1f5f9',
  muted:      '#94a3b8',
  given:      '#1e3a5f',
  givenText:  '#93c5fd',
  selected:   '#1d4ed8',
  conflict:   '#7f1d1d',
  correct:    '#14532d',
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface SudokuGameProps { onExit: () => void }

export default function SudokuGame({ onExit }: SudokuGameProps) {
  const [puzzleIdx,     setPuzzleIdx]     = useState(0)
  const [board,         setBoard]         = useState(() => cloneBoard(PUZZLES[0].puzzle))
  const [selectedCell,  setSelectedCell]  = useState<[number, number] | null>(null)
  const [pendingMove,   setPendingMove]   = useState<{
    digit: number
    question: CSharpQuestion
    row: number
    col: number
  } | null>(null)
  const [usedQIds,      setUsedQIds]      = useState<Set<number>>(new Set())
  const [errors,        setErrors]        = useState(0)
  const [score,         setScore]         = useState(0)
  const [gameOver,      setGameOver]      = useState<'win' | 'lose' | null>(null)
  const [answeredOk,    setAnsweredOk]    = useState<boolean | null>(null) // feedback flash

  const MAX_ERRORS = 3
  const { puzzle: givensGrid, solution } = PUZZLES[puzzleIdx]
  const givens: boolean[][] = givensGrid.map(row => row.map(v => v !== 0))
  const conflicts = getConflicts(board)

  // ── Select cell ─────────────────────────────────────────────────────────────
  function handleCellClick(r: number, c: number) {
    if (gameOver || pendingMove) return
    if (givens[r][c]) { setSelectedCell([r, c]); return }
    setSelectedCell([r, c])
  }

  // ── Press digit ─────────────────────────────────────────────────────────────
  function handleDigitPress(digit: number) {
    if (!selectedCell || gameOver) return
    const [r, c] = selectedCell
    if (givens[r][c]) return

    if (digit === 0) {
      // Erase
      const next = cloneBoard(board)
      next[r][c] = 0
      setBoard(next)
      return
    }

    const question = pickQuestion(usedQIds)
    setPendingMove({ digit, question, row: r, col: c })
    setAnsweredOk(null)
  }

  // ── Answer trivia ────────────────────────────────────────────────────────────
  function handleAnswer(idx: number) {
    if (!pendingMove) return
    const { digit, question, row, col } = pendingMove
    const correct = idx === question.correctIndex

    setUsedQIds(prev => new Set([...prev, question.id]))
    setAnsweredOk(correct)

    if (correct) {
      playCorrect()
      const next = cloneBoard(board)
      next[row][col] = digit
      setBoard(next)

      const pts = digit === solution[row][col] ? 15 : 5
      setScore(s => s + pts)

      // Check win
      if (isSolved(next, solution) && getConflicts(next).size === 0) {
        setTimeout(() => {
          playComplete()
          setGameOver('win')
        }, 600)
      }
    } else {
      playWrong()
      const nextErrors = errors + 1
      setErrors(nextErrors)
      if (nextErrors >= MAX_ERRORS) {
        setTimeout(() => setGameOver('lose'), 600)
      }
    }

    setTimeout(() => {
      setPendingMove(null)
      setAnsweredOk(null)
    }, 700)
  }

  // ── Restart ──────────────────────────────────────────────────────────────────
  function handleRestart(nextIdx?: number) {
    const idx = nextIdx ?? puzzleIdx
    setPuzzleIdx(idx)
    setBoard(cloneBoard(PUZZLES[idx].puzzle))
    setSelectedCell(null)
    setPendingMove(null)
    setUsedQIds(new Set())
    setErrors(0)
    setScore(0)
    setGameOver(null)
    setAnsweredOk(null)
  }

  // ── Render: game over ────────────────────────────────────────────────────────
  if (gameOver) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        fontFamily: 'system-ui, sans-serif', padding: 24, gap: 16,
      }}>
        <div style={{
          background: C.surface, border: `3px solid ${gameOver === 'win' ? C.gold : C.red}`,
          borderRadius: 16, padding: '36px 44px', maxWidth: 440, width: '100%',
          textAlign: 'center', boxShadow: `0 0 40px ${gameOver === 'win' ? C.gold : C.red}44`,
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{gameOver === 'win' ? '🏆' : '💀'}</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: gameOver === 'win' ? C.gold : C.red, margin: '0 0 8px' }}>
            {gameOver === 'win' ? 'Puzzle Solved!' : 'Too Many Errors!'}
          </h2>
          <p style={{ color: C.muted, fontSize: 14, margin: '0 0 6px' }}>
            {gameOver === 'win'
              ? 'You completed the Sudoku by answering C# trivia!'
              : 'You made 3 mistakes. Better luck next time!'}
          </p>
          <div style={{
            background: C.surfaceAlt, borderRadius: 10, padding: '14px 20px',
            marginBottom: 24, marginTop: 16,
          }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.gold }}>{score}</div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>points</div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={onExit} style={outlineBtn}>← Menu</button>
            <button onClick={() => handleRestart((puzzleIdx + 1) % PUZZLES.length)} style={primaryBtn}>
              Next Puzzle ↺
            </button>
          </div>
        </div>
        <div style={{ maxWidth: 440, width: '100%' }}>
          <StaticCourseRecommendation courses={COURSE_MAP.architecture} />
        </div>
      </div>
    )
  }

  // ── Render: main game ────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: 'system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        background: C.surface, borderBottom: `2px solid ${C.border}`,
        padding: '12px 20px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <button onClick={onExit} style={outlineBtn}>← EXIT</button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text, letterSpacing: '0.04em' }}>
            C# Sudoku
          </div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Beginner Architecture
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {/* Errors */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {Array.from({ length: MAX_ERRORS }).map((_, i) => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: i < errors ? C.red : C.border,
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 2, letterSpacing: '0.08em' }}>ERRORS</div>
          </div>
          {/* Score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.gold }}>{score}</div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.08em' }}>PTS</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px', gap: 20,
      }}>

        {/* Grid */}
        <SudokuGrid
          board={board}
          givens={givens}
          conflicts={conflicts}
          solution={solution}
          selectedCell={selectedCell}
          onCellClick={handleCellClick}
        />

        {/* Hint */}
        {selectedCell && !givens[selectedCell[0]][selectedCell[1]] && (
          <p style={{ fontSize: 12, color: C.muted, margin: 0, textAlign: 'center' }}>
            Pick a number below — answer a C# question to place it!
          </p>
        )}

        {/* Number pad */}
        <NumberPad onDigit={handleDigitPress} disabled={!selectedCell || !!pendingMove} />
      </div>

      {/* Trivia modal */}
      {pendingMove && (
        <TriviaModal
          question={pendingMove.question}
          answeredOk={answeredOk}
          onAnswer={handleAnswer}
        />
      )}
    </div>
  )
}

// ─── Sudoku Grid ───────────────────────────────────────────────────────────────

function SudokuGrid({
  board, givens, conflicts, solution, selectedCell, onCellClick,
}: {
  board:         number[][]
  givens:        boolean[][]
  conflicts:     Set<string>
  solution:      number[][]
  selectedCell:  [number, number] | null
  onCellClick:   (r: number, c: number) => void
}) {
  const [selR, selC] = selectedCell ?? [-1, -1]

  function getCellBg(r: number, c: number): string {
    const key = `${r},${c}`
    const isSelected  = r === selR && c === selC
    const isConflict  = conflicts.has(key)
    const isCorrect   = board[r][c] !== 0 && board[r][c] === solution[r][c] && !givens[r][c]
    const isHighlight = selectedCell !== null && !isSelected && (r === selR || c === selC || (
      Math.floor(r / 3) === Math.floor(selR / 3) && Math.floor(c / 3) === Math.floor(selC / 3)
    ))

    if (isSelected)  return C.selected
    if (isConflict)  return C.conflict
    if (isCorrect)   return C.correct
    if (givens[r][c]) return C.given
    if (isHighlight) return C.surfaceAlt
    return C.surface
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(9, 1fr)',
      border: `3px solid ${C.boxBorder}`,
      borderRadius: 8,
      overflow: 'hidden',
      maxWidth: 450,
      width: '100%',
      aspectRatio: '1',
    }}>
      {board.map((row, r) =>
        row.map((val, c) => {
          const isGiven   = givens[r][c]
          const key       = `${r},${c}`
          const isConflict = conflicts.has(key)
          const isSelected = r === selR && c === selC

          // Border styles for 3×3 box separation
          const borderRight  = (c + 1) % 3 === 0 && c < 8 ? `2px solid ${C.boxBorder}` : `1px solid ${C.border}`
          const borderBottom = (r + 1) % 3 === 0 && r < 8 ? `2px solid ${C.boxBorder}` : `1px solid ${C.border}`

          return (
            <div
              key={key}
              onClick={() => onCellClick(r, c)}
              style={{
                background: getCellBg(r, c),
                borderRight,
                borderBottom,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isGiven ? 'default' : 'pointer',
                transition: 'background 0.15s',
                userSelect: 'none',
                position: 'relative',
              }}
            >
              <span style={{
                fontSize: 'clamp(11px, 3vw, 18px)',
                fontWeight: isGiven ? 800 : 600,
                color: isGiven
                  ? C.givenText
                  : isConflict
                    ? '#fca5a5'
                    : isSelected
                      ? '#fff'
                      : C.text,
                lineHeight: 1,
              }}>
                {val !== 0 ? val : ''}
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Number Pad ────────────────────────────────────────────────────────────────

function NumberPad({ onDigit, disabled }: { onDigit: (d: number) => void; disabled: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
        <button
          key={d}
          onClick={() => !disabled && onDigit(d)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            border: `2px solid ${disabled ? C.border : C.accent}`,
            background: disabled ? C.surface : C.surfaceAlt,
            color: disabled ? C.muted : C.text,
            fontSize: 18,
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
        >
          {d}
        </button>
      ))}
      <button
        onClick={() => !disabled && onDigit(0)}
        style={{
          padding: '0 14px',
          height: 44,
          borderRadius: 8,
          border: `2px solid ${disabled ? C.border : '#64748b'}`,
          background: disabled ? C.surface : C.surfaceAlt,
          color: disabled ? C.muted : '#94a3b8',
          fontSize: 12,
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
        }}
      >
        ✕ Erase
      </button>
    </div>
  )
}

// ─── Trivia Modal ──────────────────────────────────────────────────────────────

function TriviaModal({
  question, answeredOk, onAnswer,
}: {
  question:   CSharpQuestion
  answeredOk: boolean | null
  onAnswer:   (idx: number) => void
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 20,
    }}>
      <div style={{
        background: C.surface,
        border: `3px solid ${C.accent}`,
        borderRadius: 14,
        padding: '28px 32px',
        maxWidth: 540,
        width: '100%',
        boxShadow: `0 0 40px ${C.accent}44`,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 20,
        }}>
          <div style={{
            background: '#1e3a5f', border: `2px solid ${C.accent}`,
            borderRadius: 8, padding: '4px 12px',
            fontSize: 11, fontWeight: 800, color: C.accent,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            C# Challenge
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>Answer correctly to place your number!</div>
        </div>

        {/* Question */}
        <div style={{
          background: C.surfaceAlt, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '14px 16px', marginBottom: 18,
        }}>
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.6,
          }}>
            {question.text}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {question.options.map((opt, idx) => {
            let bg = C.surfaceAlt
            let border = `2px solid ${C.border}`
            let color = C.text
            let cursor: React.CSSProperties['cursor'] = 'pointer'

            if (answeredOk !== null) {
              if (idx === question.correctIndex) {
                bg = '#14532d'; border = `2px solid ${C.green}`; color = '#bbf7d0'
              }
              cursor = 'default'
            }

            return (
              <button
                key={idx}
                onClick={() => answeredOk === null && onAnswer(idx)}
                style={{
                  background: bg, border, borderRadius: 8,
                  padding: '11px 14px', textAlign: 'left',
                  fontSize: 13, color, cursor,
                  fontFamily: 'inherit', fontWeight: 500,
                  lineHeight: 1.5, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
              >
                <span style={{
                  flexShrink: 0, width: 22, height: 22,
                  borderRadius: 6, background: C.border,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: C.muted,
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {answeredOk !== null && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 8, textAlign: 'center',
            background: answeredOk ? '#14532d' : '#7f1d1d',
            border: `2px solid ${answeredOk ? C.green : C.red}`,
            fontSize: 13, fontWeight: 700,
            color: answeredOk ? '#86efac' : '#fca5a5',
          }}>
            {answeredOk ? '✓ Correct! Number placed.' : '✗ Wrong! That costs you an error.'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Button styles ─────────────────────────────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  padding: '11px 22px',
  background: C.gold,
  border: 'none',
  borderRadius: 50,
  color: '#1a0f00',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const outlineBtn: React.CSSProperties = {
  padding: '9px 18px',
  background: 'transparent',
  border: `2px solid ${C.border}`,
  borderRadius: 50,
  color: C.muted,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
