import { useEffect, useMemo, useState } from 'react'
import { ExitConfirmModal } from '@/components/ExitConfirmModal'
import { playClick, playComplete, playCorrect, playPop, playWrong } from '@/lib/sounds'
import { HACKGAMMON_QUESTIONS, type HackgammonQuestion } from './data/questions'

type Side = 'player' | 'bot'
type Phase = 'intro' | 'player-question' | 'player-roll' | 'player-move' | 'bot-turn' | 'finished'
type Location = number | 'bar' | 'off'
type MoveFrom = number | 'bar'
type MoveTo = number | 'off'

interface BoardState {
  points: Record<Side, number[]>
  bar: Record<Side, number>
  off: Record<Side, number>
}

interface Move {
  from: MoveFrom
  to: MoveTo
  die: number
  hit: boolean
}

interface GameState {
  board: BoardState
  phase: Phase
  currentQuestion: HackgammonQuestion | null
  usedQuestionIds: number[]
  turnMessage: string
  rolledDice: number[]
  remainingDice: number[]
  selectedFrom: Location | null
  lastMoveSummary: string
  questionCount: number
  playerCorrect: number
  botCorrect: number
  playerHits: number
  botHits: number
  winner: Side | null
}

interface Props {
  onExit: () => void
}

const TOTAL_CHECKERS = 15
const TOP_LEFT_POINTS = [13, 14, 15, 16, 17, 18]
const TOP_RIGHT_POINTS = [19, 20, 21, 22, 23, 24]
const BOTTOM_LEFT_POINTS = [12, 11, 10, 9, 8, 7]
const BOTTOM_RIGHT_POINTS = [6, 5, 4, 3, 2, 1]
const BOT_TURN_DELAY_MS = 2400

const PIP_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
}

function createPointCounts() {
  return Array(25).fill(0)
}

function createInitialBoard(): BoardState {
  const player = createPointCounts()
  const bot = createPointCounts()

  player[24] = 2
  player[13] = 5
  player[8] = 3
  player[6] = 5

  bot[1] = 2
  bot[12] = 5
  bot[17] = 3
  bot[19] = 5

  return {
    points: { player, bot },
    bar: { player: 0, bot: 0 },
    off: { player: 0, bot: 0 },
  }
}

function createInitialState(): GameState {
  return {
    board: createInitialBoard(),
    phase: 'intro',
    currentQuestion: null,
    usedQuestionIds: [],
    turnMessage: 'Answer correctly to unlock your dice roll.',
    rolledDice: [],
    remainingDice: [],
    selectedFrom: null,
    lastMoveSummary: '',
    questionCount: 0,
    playerCorrect: 0,
    botCorrect: 0,
    playerHits: 0,
    botHits: 0,
    winner: null,
  }
}

function cloneBoard(board: BoardState): BoardState {
  return {
    points: {
      player: [...board.points.player],
      bot: [...board.points.bot],
    },
    bar: { ...board.bar },
    off: { ...board.off },
  }
}

function randomDie() {
  return Math.floor(Math.random() * 6) + 1
}

function locationKey(location: Location | null) {
  return location === null ? 'none' : String(location)
}

function sameLocation(a: Location | null, b: Location | null) {
  return locationKey(a) === locationKey(b)
}

function opponentOf(side: Side): Side {
  return side === 'player' ? 'bot' : 'player'
}

function formatLocation(location: Location) {
  if (location === 'bar') return 'bar'
  if (location === 'off') return 'home'
  return `point ${location}`
}

function describeMove(move: Move) {
  const start = formatLocation(move.from)
  const finish = formatLocation(move.to)

  if (move.hit) {
    return `${start} -> ${finish} on ${move.die}, hit`
  }

  return `${start} -> ${finish} on ${move.die}`
}

function describeSequence(sequence: Move[]) {
  if (sequence.length === 0) return 'No legal move from that roll.'
  return sequence.map(describeMove).join('  •  ')
}

function getQuestion(usedIds: number[]) {
  const available = HACKGAMMON_QUESTIONS.filter(question => !usedIds.includes(question.id))
  const pool = available.length > 0 ? available : HACKGAMMON_QUESTIONS
  const question = pool[Math.floor(Math.random() * pool.length)]
  const nextUsedIds = available.length > 0 ? [...usedIds, question.id] : [question.id]
  return { question, nextUsedIds }
}

function startPlayerQuestion(state: GameState, message: string): GameState {
  const { question, nextUsedIds } = getQuestion(state.usedQuestionIds)

  return {
    ...state,
    phase: 'player-question',
    currentQuestion: question,
    usedQuestionIds: nextUsedIds,
    turnMessage: message,
    rolledDice: [],
    remainingDice: [],
    selectedFrom: null,
  }
}

function startBotTurn(state: GameState, message: string): GameState {
  return {
    ...state,
    phase: 'bot-turn',
    currentQuestion: null,
    turnMessage: message,
    rolledDice: [],
    remainingDice: [],
    selectedFrom: null,
  }
}

function finishIfNeeded(state: GameState): GameState {
  if (state.board.off.player >= TOTAL_CHECKERS) {
    return {
      ...state,
      phase: 'finished',
      winner: 'player',
      turnMessage: 'You bore off all fifteen checkers before DeployBot.',
      remainingDice: [],
      selectedFrom: null,
    }
  }

  if (state.board.off.bot >= TOTAL_CHECKERS) {
    return {
      ...state,
      phase: 'finished',
      winner: 'bot',
      turnMessage: 'DeployBot cleared the board first and closed the release.',
      remainingDice: [],
      selectedFrom: null,
    }
  }

  return state
}

function allInHome(board: BoardState, side: Side) {
  if (board.bar[side] > 0) return false

  if (side === 'player') {
    for (let point = 7; point <= 24; point++) {
      if (board.points.player[point] > 0) return false
    }
    return true
  }

  for (let point = 1; point <= 18; point++) {
    if (board.points.bot[point] > 0) return false
  }
  return true
}

function canBearOff(board: BoardState, side: Side, from: number, die: number) {
  if (!allInHome(board, side)) return false

  if (side === 'player') {
    const target = from - die
    if (target === 0) return true
    if (target < 0) {
      for (let point = 6; point > from; point--) {
        if (board.points.player[point] > 0) return false
      }
      return true
    }
    return false
  }

  const target = from + die
  if (target === 25) return true
  if (target > 25) {
    for (let point = 19; point < from; point++) {
      if (board.points.bot[point] > 0) return false
    }
    return true
  }
  return false
}

function getLegalMovesForDie(board: BoardState, side: Side, die: number): Move[] {
  const enemy = opponentOf(side)
  const sources: MoveFrom[] = board.bar[side] > 0 ? ['bar'] : []
  const moves: Move[] = []

  if (board.bar[side] === 0) {
    for (let point = 1; point <= 24; point++) {
      if (board.points[side][point] > 0) {
        sources.push(point)
      }
    }
  }

  for (const from of sources) {
    let destination: MoveTo | null = null

    if (from === 'bar') {
      destination = side === 'player' ? 25 - die : die
    } else {
      const target = side === 'player' ? from - die : from + die

      if (target >= 1 && target <= 24) {
        destination = target
      } else if (canBearOff(board, side, from, die)) {
        destination = 'off'
      }
    }

    if (destination === null) continue

    if (destination !== 'off') {
      const enemyCount = board.points[enemy][destination]
      if (enemyCount >= 2) continue

      moves.push({
        from,
        to: destination,
        die,
        hit: enemyCount === 1,
      })
      continue
    }

    moves.push({
      from,
      to: 'off',
      die,
      hit: false,
    })
  }

  return moves
}

function applyMove(board: BoardState, side: Side, move: Move): BoardState {
  const nextBoard = cloneBoard(board)
  const enemy = opponentOf(side)

  if (move.from === 'bar') {
    nextBoard.bar[side] -= 1
  } else {
    nextBoard.points[side][move.from] -= 1
  }

  if (move.to === 'off') {
    nextBoard.off[side] += 1
    return nextBoard
  }

  if (move.hit) {
    nextBoard.points[enemy][move.to] -= 1
    nextBoard.bar[enemy] += 1
  }

  nextBoard.points[side][move.to] += 1
  return nextBoard
}

function moveKey(move: Move) {
  return `${move.from}-${move.to}-${move.die}-${move.hit ? 'hit' : 'plain'}`
}

function sequenceKey(sequence: Move[]) {
  return sequence.map(moveKey).join('|')
}

function generateMoveSequences(board: BoardState, side: Side, dice: number[]): Move[][] {
  if (dice.length === 0) return [[]]

  let foundAnyMove = false
  const sequences: Move[][] = []
  const triedDice = new Set<number>()

  for (let index = 0; index < dice.length; index++) {
    const die = dice[index]
    if (triedDice.has(die)) continue
    triedDice.add(die)

    const moves = Array.from(new Map(
      getLegalMovesForDie(board, side, die).map(move => [moveKey(move), move]),
    ).values())

    if (moves.length === 0) continue
    foundAnyMove = true

    for (const move of moves) {
      const nextBoard = applyMove(board, side, move)
      const remainingDice = [...dice.slice(0, index), ...dice.slice(index + 1)]
      const tails = generateMoveSequences(nextBoard, side, remainingDice)

      for (const tail of tails) {
        sequences.push([move, ...tail])
      }
    }
  }

  return foundAnyMove ? sequences : [[]]
}

function getBestSequences(board: BoardState, side: Side, dice: number[]) {
  const raw = generateMoveSequences(board, side, dice)
  const maxLength = Math.max(...raw.map(sequence => sequence.length))
  let filtered = raw.filter(sequence => sequence.length === maxLength)

  if (maxLength === 1) {
    const highestDie = Math.max(...filtered.map(sequence => sequence[0]?.die ?? 0))
    filtered = filtered.filter(sequence => (sequence[0]?.die ?? 0) === highestDie)
  }

  return Array.from(new Map(
    filtered.map(sequence => [sequenceKey(sequence), sequence]),
  ).values())
}

function getFirstMoves(sequences: Move[][]) {
  return Array.from(new Map(
    sequences
      .filter(sequence => sequence.length > 0)
      .map(sequence => [moveKey(sequence[0]), sequence[0]]),
  ).values())
}

function scoreSequence(sequence: Move[]) {
  return sequence.reduce((score, move) => {
    const offBonus = move.to === 'off' ? 40 : 0
    const hitBonus = move.hit ? 25 : 0
    const barBonus = move.from === 'bar' ? 10 : 0
    return score + offBonus + hitBonus + barBonus + move.die
  }, 0)
}

function chooseBotSequence(sequences: Move[][]) {
  return [...sequences].sort((left, right) => {
    const scoreDiff = scoreSequence(right) - scoreSequence(left)
    if (scoreDiff !== 0) return scoreDiff
    return sequenceKey(left).localeCompare(sequenceKey(right))
  })[0] ?? []
}

function difficultyTone(difficulty: HackgammonQuestion['difficulty']) {
  if (difficulty === 'easy') return 'bg-green-100 text-green-700'
  if (difficulty === 'medium') return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

function stackTone(stack: HackgammonQuestion['stack']) {
  return stack === 'NestJS'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-sky-100 text-sky-700'
}

function checkerStyles(side: Side) {
  if (side === 'player') {
    return {
      border: '#7f1d1d',
      outer: 'radial-gradient(circle at 32% 28%, #ffb4b4 0%, #ff7070 20%, #d62424 55%, #8c1414 100%)',
      shadow: 'rgba(127, 29, 29, 0.45)',
    }
  }

  return {
    border: '#94a3b8',
    outer: 'radial-gradient(circle at 32% 28%, #ffffff 0%, #f8fafc 22%, #d7dee7 58%, #8c99aa 100%)',
    shadow: 'rgba(100, 116, 139, 0.4)',
  }
}

function DieFace({ value, subtle = false }: { value: number; subtle?: boolean }) {
  const pips = PIP_POSITIONS[value] ?? PIP_POSITIONS[1]

  return (
    <div
      className={`relative h-12 w-12 rounded-2xl border-2 ${subtle ? 'border-slate-300' : 'border-slate-400'} ${
        subtle ? 'bg-white/85' : 'bg-white'
      } shadow-sm`}
    >
      {pips.map(([left, top], index) => (
        <span
          key={`${value}-${index}`}
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
      ))}
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
  meta,
}: {
  label: string
  value: string
  accent: string
  meta: string
}) {
  return (
    <div className="rounded-[1.5rem] border-2 border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-black ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{meta}</div>
    </div>
  )
}

function QuestionOverlay({
  question,
  onComplete,
}: {
  question: HackgammonQuestion
  onComplete: (correct: boolean) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const revealed = selected !== null
  const correct = selected === question.correctIndex

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border-2 border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${difficultyTone(question.difficulty)}`}>
            {question.difficulty}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${stackTone(question.stack)}`}>
            {question.stack}
          </span>
        </div>

        <p className="text-base font-semibold leading-7 text-slate-800 sm:text-lg">
          {question.prompt}
        </p>

        {question.code && (
          <pre className="mt-4 overflow-x-auto rounded-[1.5rem] bg-slate-950 px-4 py-3 text-xs leading-6 text-emerald-300 sm:text-sm">
            {question.code}
          </pre>
        )}

        <div className="mt-5 grid gap-2">
          {question.options.map((option, index) => {
            const isCorrect = index === question.correctIndex
            const isSelected = index === selected

            let tone = 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
            if (revealed) {
              if (isCorrect) tone = 'border-emerald-400 bg-emerald-50 text-emerald-800'
              else if (isSelected) tone = 'border-rose-400 bg-rose-50 text-rose-800'
              else tone = 'border-slate-200 bg-slate-50 text-slate-400'
            }

            return (
              <button
                key={option}
                type="button"
                disabled={revealed}
                onClick={() => {
                  if (revealed) return
                  setSelected(index)
                  if (index === question.correctIndex) playCorrect()
                  else playWrong()
                }}
                className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${tone}`}
              >
                <span className="mr-2 font-mono text-xs text-slate-400">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            )
          })}
        </div>

        {revealed && (
          <div className={`mt-5 rounded-[1.5rem] border px-4 py-3 ${
            correct
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-rose-200 bg-rose-50'
          }`}>
            <div className={`text-sm font-semibold ${correct ? 'text-emerald-800' : 'text-rose-800'}`}>
              {correct ? 'Correct. The board is yours, now roll the dice.' : 'Incorrect. DeployBot gets the next turn.'}
            </div>
            <button
              type="button"
              onClick={() => {
                playClick()
                onComplete(correct)
              }}
              className={`mt-3 rounded-2xl px-4 py-2 text-sm font-semibold text-white ${
                correct ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {correct ? 'Continue To Roll' : 'Pass Turn'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function PointSlot({
  point,
  orientation,
  occupant,
  count,
  isSelectable,
  isSelected,
  destinationDice,
  onClick,
}: {
  point: number
  orientation: 'top' | 'bottom'
  occupant: Side | null
  count: number
  isSelectable: boolean
  isSelected: boolean
  destinationDice: number[]
  onClick: () => void
}) {
  const isDarkTriangle = point % 2 === 0
  const triangleTone = isDarkTriangle ? '#6f2612' : '#c66a2c'
  const interactive = isSelectable || destinationDice.length > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-[170px] rounded-[1.25rem] border border-black/10 bg-white/10 p-0 transition-all sm:h-[210px] ${
        interactive ? 'cursor-pointer' : 'cursor-default'
      } ${
        isSelected
          ? 'ring-4 ring-emerald-300'
          : destinationDice.length > 0
            ? 'ring-2 ring-sky-300 shadow-lg'
            : isSelectable
              ? 'ring-2 ring-amber-200'
              : 'shadow-sm'
      }`}
    >
      <div
        className={`absolute inset-x-2 ${orientation === 'top' ? 'top-2' : 'bottom-2'}`}
        style={{
          height: 'calc(100% - 16px)',
          background: triangleTone,
          opacity: 0.96,
          clipPath: orientation === 'top'
            ? 'polygon(50% 100%, 0 0, 100% 0)'
            : 'polygon(0 100%, 100% 100%, 50% 0)',
          borderRadius: 14,
        }}
      />

      <span className={`absolute left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold tracking-[0.18em] text-white ${
        orientation === 'top' ? 'top-2' : 'bottom-2'
      }`}>
        {point}
      </span>

      {destinationDice.length > 0 && (
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center gap-1">
          {destinationDice.map((die, index) => (
            <span
              key={`${point}-${die}-${index}`}
              className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white shadow"
            >
              {die}
            </span>
          ))}
        </div>
      )}

      {occupant && count > 0 && (
        <div className="absolute inset-x-0 top-0 bottom-0">
          {Array.from({ length: Math.min(count, 5) }).map((_, index, items) => {
            const style = checkerStyles(occupant)
            const offset = 16 + index * 24

            return (
              <div
                key={`${point}-${occupant}-${index}`}
                className="absolute left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border-2 sm:h-11 sm:w-11"
                style={{
                  top: orientation === 'top' ? `${offset}px` : undefined,
                  bottom: orientation === 'bottom' ? `${offset}px` : undefined,
                  zIndex: items.length - index,
                  background: style.outer,
                  borderColor: style.border,
                  boxShadow: `0 6px 12px ${style.shadow}`,
                }}
              >
                <div className="absolute inset-[6px] rounded-full border border-white/35 bg-white/10" />
              </div>
            )
          })}

          {count > 5 && (
            <span className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white ${
              orientation === 'top' ? 'top-[138px] sm:top-[160px]' : 'bottom-[138px] sm:bottom-[160px]'
            }`}>
              +{count - 5}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

function RailStack({
  side,
  count,
  align,
  compact = false,
}: {
  side: Side
  count: number
  align: 'start' | 'end'
  compact?: boolean
}) {
  const style = checkerStyles(side)
  const stackStart = compact ? 8 : 10
  const stackOffset = compact ? 16 : 20

  return (
    <div className={`flex ${compact ? 'min-h-[108px]' : 'min-h-[140px]'} flex-1 ${align === 'start' ? 'items-start' : 'items-end'} justify-center`}>
      <div className="relative h-full w-full">
        {Array.from({ length: Math.min(count, 5) }).map((_, index, items) => (
          <div
            key={`${side}-${align}-${index}`}
            className={`absolute left-1/2 -translate-x-1/2 rounded-full border-2 ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
            style={{
              top: align === 'start' ? `${stackStart + index * stackOffset}px` : undefined,
              bottom: align === 'end' ? `${stackStart + index * stackOffset}px` : undefined,
              zIndex: items.length - index,
              background: style.outer,
              borderColor: style.border,
              boxShadow: `0 5px 10px ${style.shadow}`,
            }}
          >
            <div className="absolute inset-[5px] rounded-full border border-white/30 bg-white/10" />
          </div>
        ))}

        {count > 5 && (
          <span className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white ${
            align === 'start'
              ? compact
                ? 'top-[88px]'
                : 'top-[112px]'
              : compact
                ? 'bottom-[88px]'
                : 'bottom-[112px]'
          }`}>
            +{count - 5}
          </span>
        )}
      </div>
    </div>
  )
}

function RailTray({
  label,
  side,
  count,
  isActive,
  onClick,
  compact = false,
}: {
  label: string
  side: Side
  count: number
  isActive: boolean
  onClick?: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full flex-col justify-between border text-left ${
        compact ? 'h-[148px] rounded-[1.2rem] px-2 py-2.5' : 'h-[180px] rounded-[1.4rem] px-2 py-3'
      } ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${
        isActive
          ? 'border-sky-300 bg-sky-50/80 ring-2 ring-sky-300'
          : 'border-black/10 bg-black/10'
      }`}
    >
      <span className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">
        {label}
      </span>
      <RailStack side={side} count={count} align={side === 'bot' ? 'start' : 'end'} compact={compact} />
      <span className="text-center text-xs font-semibold text-white/85">
        {count}/{TOTAL_CHECKERS}
      </span>
    </button>
  )
}

function BarColumn({
  botCount,
  playerCount,
  playerBarActive,
  playerBarSelected,
  onPlayerBarClick,
  compact = false,
}: {
  botCount: number
  playerCount: number
  playerBarActive: boolean
  playerBarSelected: boolean
  onPlayerBarClick: () => void
  compact?: boolean
}) {
  return (
    <div className={`flex shrink-0 flex-col justify-between rounded-[1.5rem] bg-[#55210f]/80 shadow-inner ${
      compact ? 'w-[4.5rem] p-1.5' : 'w-20 p-2'
    }`}>
      <div className={`rounded-[1.25rem] border border-white/10 bg-black/10 px-2 ${
        compact ? 'py-2' : 'py-3'
      }`}>
        <div className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">Bot Bar</div>
        <RailStack side="bot" count={botCount} align="start" compact={compact} />
      </div>

      <button
        type="button"
        onClick={onPlayerBarClick}
        className={`rounded-[1.25rem] border px-2 ${
          compact ? 'mt-2 py-2' : 'mt-3 py-3'
        } ${
          playerBarSelected
            ? 'border-emerald-300 bg-emerald-50/90 ring-4 ring-emerald-300'
            : playerBarActive
              ? 'border-amber-200 bg-amber-50/90 ring-2 ring-amber-200'
              : 'border-white/10 bg-black/10'
        }`}
      >
        <div className={`text-center text-[10px] font-bold uppercase tracking-[0.18em] ${
          playerBarActive || playerBarSelected ? 'text-slate-700' : 'text-white/80'
        }`}>
          Your Bar
        </div>
        <RailStack side="player" count={playerCount} align="end" compact={compact} />
      </button>
    </div>
  )
}

export default function Hackgammon({ onExit }: Props) {
  const [state, setState] = useState<GameState>(() => createInitialState())
  const [showExitModal, setShowExitModal] = useState(false)

  const isPlayerTurn = state.phase === 'player-question' || state.phase === 'player-roll' || state.phase === 'player-move'

  const playerSequences = useMemo(
    () => state.phase === 'player-move'
      ? getBestSequences(state.board, 'player', state.remainingDice)
      : [],
    [state.board, state.phase, state.remainingDice],
  )

  const legalPlayerMoves = useMemo(
    () => getFirstMoves(playerSequences),
    [playerSequences],
  )

  const sourceKeys = useMemo(
    () => new Set(legalPlayerMoves.map(move => locationKey(move.from))),
    [legalPlayerMoves],
  )

  const selectedMoves = useMemo(
    () => legalPlayerMoves.filter(move => sameLocation(move.from, state.selectedFrom)),
    [legalPlayerMoves, state.selectedFrom],
  )

  const destinationMap = useMemo(() => {
    const map = new Map<string, number[]>()

    for (const move of selectedMoves) {
      const key = locationKey(move.to)
      const existing = map.get(key) ?? []
      map.set(key, [...existing, move.die].sort((left, right) => left - right))
    }

    return map
  }, [selectedMoves])

  useEffect(() => {
    if (state.phase !== 'finished' || !state.winner) return

    if (state.winner === 'player') playComplete()
    else playWrong()
  }, [state.phase, state.winner])

  useEffect(() => {
    if (state.phase !== 'bot-turn') return

    const timeoutId = window.setTimeout(() => {
      setState(current => {
        if (current.phase !== 'bot-turn') return current

        const { question, nextUsedIds } = getQuestion(current.usedQuestionIds)
        const chance = question.difficulty === 'easy'
          ? 0.82
          : question.difficulty === 'medium'
            ? 0.64
            : 0.46

        const correct = Math.random() < chance
        const nextQuestionCount = current.questionCount + 1

        if (!correct) {
          playPop()
          return startPlayerQuestion({
            ...current,
            usedQuestionIds: nextUsedIds,
            questionCount: nextQuestionCount,
            lastMoveSummary: `DeployBot missed: ${question.prompt}`,
          }, `DeployBot missed a ${question.stack} question. Answer yours and claim the dice.`)
        }

        const dieOne = randomDie()
        const dieTwo = randomDie()
        const expandedDice = dieOne === dieTwo
          ? [dieOne, dieOne, dieOne, dieOne]
          : [dieOne, dieTwo]

        const sequences = getBestSequences(current.board, 'bot', expandedDice)
        const chosen = chooseBotSequence(sequences)

        if (chosen.length === 0) {
          playPop()
          return startPlayerQuestion({
            ...current,
            usedQuestionIds: nextUsedIds,
            questionCount: nextQuestionCount,
            botCorrect: current.botCorrect + 1,
            rolledDice: [dieOne, dieTwo],
            lastMoveSummary: 'DeployBot rolled but had no legal move.',
          }, 'DeployBot solved the trivia but the board blocked every lane. Your turn.')
        }

        playPop()
        let nextBoard = current.board
        let hits = 0

        for (const move of chosen) {
          if (move.hit) hits += 1
          nextBoard = applyMove(nextBoard, 'bot', move)
        }

        const resolved = finishIfNeeded({
          ...current,
          board: nextBoard,
          usedQuestionIds: nextUsedIds,
          questionCount: nextQuestionCount,
          botCorrect: current.botCorrect + 1,
          botHits: current.botHits + hits,
          rolledDice: [dieOne, dieTwo],
          remainingDice: [],
          selectedFrom: null,
          lastMoveSummary: describeSequence(chosen),
          turnMessage: hits > 0
            ? 'DeployBot answered correctly, rolled, and hit your blot.'
            : 'DeployBot answered correctly and advanced its checkers.',
        })

        if (resolved.phase === 'finished') return resolved

        return startPlayerQuestion(resolved, 'Your turn. Answer correctly to earn the dice.')
      })
    }, BOT_TURN_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [state.phase])

  function startGame() {
    playClick()
    setState(startPlayerQuestion(createInitialState(), 'Your turn. Answer correctly to earn the dice.'))
  }

  function handleQuestionComplete(correct: boolean) {
    setState(current => {
      if (!current.currentQuestion) return current

      const nextQuestionCount = current.questionCount + 1

      if (correct) {
        return {
          ...current,
          phase: 'player-roll',
          currentQuestion: null,
          questionCount: nextQuestionCount,
          playerCorrect: current.playerCorrect + 1,
          turnMessage: 'Question cleared. Roll the dice, then choose the checker you want to move.',
        }
      }

      return startBotTurn({
        ...current,
        questionCount: nextQuestionCount,
        currentQuestion: null,
        lastMoveSummary: `${current.currentQuestion.stack} question missed.`,
      }, 'Incorrect answer. DeployBot steps in for the next turn.')
    })
  }

  function handlePlayerRoll() {
    playClick()

    setState(current => {
      if (current.phase !== 'player-roll') return current

      const dieOne = randomDie()
      const dieTwo = randomDie()
      const expandedDice = dieOne === dieTwo
        ? [dieOne, dieOne, dieOne, dieOne]
        : [dieOne, dieTwo]

      const sequences = getBestSequences(current.board, 'player', expandedDice)
      const hasLegalMove = sequences.some(sequence => sequence.length > 0)

      if (!hasLegalMove) {
        return startBotTurn({
          ...current,
          rolledDice: [dieOne, dieTwo],
          remainingDice: [],
          selectedFrom: null,
          lastMoveSummary: 'You rolled but had no legal move.',
        }, 'No legal move from that roll. DeployBot gets the board.')
      }

      return {
        ...current,
        phase: 'player-move',
        rolledDice: [dieOne, dieTwo],
        remainingDice: expandedDice,
        selectedFrom: null,
        lastMoveSummary: '',
        turnMessage: 'Select a highlighted checker, then tap a glowing destination to use a die.',
      }
    })
  }

  function handleLocationClick(location: Location) {
    setState(current => {
      if (current.phase !== 'player-move') return current

      const sequences = getBestSequences(current.board, 'player', current.remainingDice)
      const moves = getFirstMoves(sequences)
      const currentSelectedMoves = moves.filter(move => sameLocation(move.from, current.selectedFrom))
      const targetMove = currentSelectedMoves.find(move => sameLocation(move.to, location))

      if (targetMove) {
        let nextBoard = current.board
        if (targetMove.hit) playPop()
        nextBoard = applyMove(nextBoard, 'player', targetMove)

        const dieIndex = current.remainingDice.findIndex(die => die === targetMove.die)
        const nextRemainingDice = dieIndex >= 0
          ? [...current.remainingDice.slice(0, dieIndex), ...current.remainingDice.slice(dieIndex + 1)]
          : []

        const updated = finishIfNeeded({
          ...current,
          board: nextBoard,
          remainingDice: nextRemainingDice,
          selectedFrom: null,
          playerHits: current.playerHits + (targetMove.hit ? 1 : 0),
          lastMoveSummary: current.lastMoveSummary
            ? `${current.lastMoveSummary}  •  ${describeMove(targetMove)}`
            : describeMove(targetMove),
          turnMessage: nextRemainingDice.length > 0
            ? 'Nice. Use the remaining dice to continue your turn.'
            : 'Turn complete. DeployBot is getting ready.',
        })

        if (updated.phase === 'finished') return updated

        const nextSequences = nextRemainingDice.length > 0
          ? getBestSequences(nextBoard, 'player', nextRemainingDice)
          : []

        const canKeepMoving = nextSequences.some(sequence => sequence.length > 0)

        if (!canKeepMoving) {
          return startBotTurn({
            ...updated,
            remainingDice: [],
            selectedFrom: null,
            turnMessage: nextRemainingDice.length > 0
              ? 'Some dice were left but every legal lane closed. DeployBot is up next.'
              : 'Turn complete. DeployBot is up next.',
          }, nextRemainingDice.length > 0
            ? 'You used every legal move available from that roll. DeployBot is up next.'
            : 'Turn complete. DeployBot is up next.')
        }

        return updated
      }

      const canSelectSource = moves.some(move => sameLocation(move.from, location))
      if (!canSelectSource) return current

      const reselecting = sameLocation(current.selectedFrom, location)

      return {
        ...current,
        selectedFrom: reselecting ? null : location,
        turnMessage: reselecting
          ? 'Checker deselected. Pick a highlighted checker to continue.'
          : `Selected ${formatLocation(location)}. Now choose one of the glowing destinations.`,
      }
    })
  }

  const exitModal = showExitModal ? (
    <ExitConfirmModal
      progressLabel={`${state.board.off.player}/${TOTAL_CHECKERS} checkers home`}
      onQuit={onExit}
      onCancel={() => setShowExitModal(false)}
    />
  ) : null

  if (state.phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8">
        {exitModal}
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
          <div className="grid w-full gap-6 [grid-template-columns:repeat(auto-fit,minmax(22rem,1fr))]">
            <div className="rounded-[2rem] border-2 border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="space-y-3">
                <div className="text-sm font-bold uppercase tracking-[0.24em] text-slate-400">Hackgammon</div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Full-stack trivia meets real move choices.</h1>
                <p className="text-sm leading-7 text-slate-600">
                  Clear a NestJS or Next.js question, roll your own dice, then decide exactly which checker moves.
                  It keeps the playful academy shell, but the board now behaves much closer to real backgammon.
                </p>
              </div>

              <div className="mt-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
                <div className="h-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Turn Flow</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Answer, roll, pick a checker, then pick a legal destination.</p>
                </div>
                <div className="h-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Proper Stacks</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Fifteen checkers per side, stacked on 24 points with a center bar and home trays.</p>
                </div>
                <div className="h-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Real Tension</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Single exposed checkers can be hit. Two or more on a point lock the lane.</p>
                </div>
                <div className="h-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Finish Line</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Bear off all 15 checkers before DeployBot ships the release.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]">
                <button
                  type="button"
                  onClick={() => setShowExitModal(true)}
                  className="rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={startGame}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Start Match
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border-2 border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Board Preview</div>
                  <div className="text-lg font-extrabold text-slate-800">Stacked checkers, center bar, home trays</div>
                </div>
                <div className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
                  PvBot
                </div>
              </div>

              <div
                className="rounded-[1.8rem] p-3 shadow-inner"
                style={{ background: 'linear-gradient(145deg, #6c2a12 0%, #8b451d 45%, #5a240f 100%)' }}
              >
                <div
                  className="overflow-x-auto rounded-[1.4rem] p-3"
                  style={{ background: 'linear-gradient(145deg, #f5c56f 0%, #e79a3c 50%, #d47a23 100%)' }}
                >
                  <div className="flex min-w-[820px] gap-3">
                    <div className="grid flex-1 grid-rows-2 gap-3">
                      <div className="grid grid-cols-6 gap-2">
                        {TOP_LEFT_POINTS.map(point => (
                          <PointSlot
                            key={point}
                            point={point}
                            orientation="top"
                            occupant={point === 13 ? 'player' : point === 17 ? 'bot' : null}
                            count={point === 13 ? 5 : point === 17 ? 3 : 0}
                            isSelectable={false}
                            isSelected={false}
                            destinationDice={[]}
                            onClick={() => {}}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {BOTTOM_LEFT_POINTS.map(point => (
                          <PointSlot
                            key={point}
                            point={point}
                            orientation="bottom"
                            occupant={point === 8 ? 'player' : point === 12 ? 'bot' : null}
                            count={point === 8 ? 3 : point === 12 ? 5 : 0}
                            isSelectable={false}
                            isSelected={false}
                            destinationDice={[]}
                            onClick={() => {}}
                          />
                        ))}
                      </div>
                    </div>

                    <BarColumn
                      botCount={1}
                      playerCount={1}
                      playerBarActive={false}
                      playerBarSelected={false}
                      onPlayerBarClick={() => {}}
                      compact
                    />

                    <div className="grid flex-1 grid-rows-2 gap-3">
                      <div className="grid grid-cols-6 gap-2">
                        {TOP_RIGHT_POINTS.map(point => (
                          <PointSlot
                            key={point}
                            point={point}
                            orientation="top"
                            occupant={point === 24 ? 'player' : point === 19 ? 'bot' : null}
                            count={point === 24 ? 2 : point === 19 ? 5 : 0}
                            isSelectable={false}
                            isSelected={false}
                            destinationDice={point === 21 ? [3] : []}
                            onClick={() => {}}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {BOTTOM_RIGHT_POINTS.map(point => (
                          <PointSlot
                            key={point}
                            point={point}
                            orientation="bottom"
                            occupant={point === 6 ? 'player' : point === 1 ? 'bot' : null}
                            count={point === 6 ? 5 : point === 1 ? 2 : 0}
                            isSelectable={false}
                            isSelected={false}
                            destinationDice={[]}
                            onClick={() => {}}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex w-[5.5rem] shrink-0 flex-col justify-between gap-2 rounded-[1.35rem] bg-[#55210f]/80 p-1.5 shadow-inner">
                      <RailTray label="Bot Home" side="bot" count={2} isActive={false} compact />
                      <RailTray label="Your Home" side="player" count={3} isActive compact />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state.phase === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center">
          <div className="w-full rounded-[2rem] border-2 border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="text-center">
              <div className="mb-3 text-6xl">{state.winner === 'player' ? '🏆' : '🤖'}</div>
              <h1 className="text-3xl font-black text-slate-800">
                {state.winner === 'player' ? 'Release shipped.' : 'DeployBot took the match.'}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {state.turnMessage}
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <StatCard
                label="Your Home"
                value={`${state.board.off.player}/${TOTAL_CHECKERS}`}
                accent="text-rose-700"
                meta={`${state.playerHits} hits landed`}
              />
              <StatCard
                label="Bot Home"
                value={`${state.board.off.bot}/${TOTAL_CHECKERS}`}
                accent="text-slate-800"
                meta={`${state.botHits} hits landed`}
              />
              <StatCard
                label="Questions"
                value={String(state.questionCount)}
                accent="text-emerald-700"
                meta={`${state.playerCorrect} yours, ${state.botCorrect} bot`}
              />
              <StatCard
                label="Last Turn"
                value={state.rolledDice.length > 0 ? state.rolledDice.join(' / ') : 'None'}
                accent="text-amber-600"
                meta="Most recent rolled pair"
              />
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Last Sequence</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{state.lastMoveSummary || 'No move summary recorded.'}</p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={startGame}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={onExit}
                className="flex-1 rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {exitModal}

      {state.phase === 'player-question' && state.currentQuestion && (
        <QuestionOverlay
          key={state.currentQuestion.id}
          question={state.currentQuestion}
          onComplete={handleQuestionComplete}
        />
      )}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => {
              playClick()
              setShowExitModal(true)
            }}
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
          >
            ← Exit
          </button>
          <h1 className="text-sm font-bold text-slate-700">Hackgammon</h1>
          <span className="text-xs font-mono text-slate-400">Q{state.questionCount}</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.75rem] border-2 border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Turn Status</div>
                <div className="mt-1 text-2xl font-black text-slate-800">
                  {isPlayerTurn ? 'Your board' : 'DeployBot board'}
                </div>
              </div>
              <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                isPlayerTurn ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {isPlayerTurn ? 'Human Turn' : 'Bot Turn'}
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">{state.turnMessage}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Rolled Pair</div>
                <div className="mt-2 flex gap-2">
                  {state.rolledDice.length > 0 ? (
                    state.rolledDice.map((die, index) => <DieFace key={`${die}-${index}`} value={die} />)
                  ) : (
                    <span className="text-sm text-slate-400">Waiting for a roll</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Dice Left</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {state.remainingDice.length > 0 ? (
                    state.remainingDice.map((die, index) => <DieFace key={`${die}-${index}-left`} value={die} subtle />)
                  ) : (
                    <span className="text-sm text-slate-400">No unused dice</span>
                  )}
                </div>
              </div>
            </div>

            {state.lastMoveSummary && (
              <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Latest Sequence</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{state.lastMoveSummary}</p>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Your Home"
              value={`${state.board.off.player}/${TOTAL_CHECKERS}`}
              accent="text-rose-700"
              meta={`${state.playerCorrect} correct answers`}
            />
            <StatCard
              label="Bot Home"
              value={`${state.board.off.bot}/${TOTAL_CHECKERS}`}
              accent="text-slate-800"
              meta={`${state.botCorrect} correct answers`}
            />
            <StatCard
              label="Hits"
              value={`${state.playerHits}-${state.botHits}`}
              accent="text-amber-600"
              meta="You vs DeployBot"
            />
          </div>
        </div>

        <div className="relative mt-4 rounded-[2rem] border-2 border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Backgammon Board</div>
              <div className="text-lg font-extrabold text-slate-800">Select your checker, then select the destination point</div>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
              24 points + center bar
            </div>
          </div>

          <div
            className="rounded-[1.8rem] p-3 shadow-inner"
            style={{ background: 'linear-gradient(145deg, #6c2a12 0%, #8b451d 45%, #5a240f 100%)' }}
          >
            <div
              className="overflow-x-auto rounded-[1.4rem] p-3"
              style={{ background: 'linear-gradient(145deg, #f5c56f 0%, #e79a3c 50%, #d47a23 100%)' }}
            >
              <div className="flex min-w-[980px] gap-3">
                <div className="grid flex-1 grid-rows-2 gap-3">
                  <div className="grid grid-cols-6 gap-2">
                    {TOP_LEFT_POINTS.map(point => {
                      const occupant = state.board.points.player[point] > 0
                        ? 'player'
                        : state.board.points.bot[point] > 0
                          ? 'bot'
                          : null
                      const count = occupant ? state.board.points[occupant][point] : 0

                      return (
                        <PointSlot
                          key={point}
                          point={point}
                          orientation="top"
                          occupant={occupant}
                          count={count}
                          isSelectable={sourceKeys.has(String(point))}
                          isSelected={sameLocation(state.selectedFrom, point)}
                          destinationDice={destinationMap.get(String(point)) ?? []}
                          onClick={() => handleLocationClick(point)}
                        />
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {BOTTOM_LEFT_POINTS.map(point => {
                      const occupant = state.board.points.player[point] > 0
                        ? 'player'
                        : state.board.points.bot[point] > 0
                          ? 'bot'
                          : null
                      const count = occupant ? state.board.points[occupant][point] : 0

                      return (
                        <PointSlot
                          key={point}
                          point={point}
                          orientation="bottom"
                          occupant={occupant}
                          count={count}
                          isSelectable={sourceKeys.has(String(point))}
                          isSelected={sameLocation(state.selectedFrom, point)}
                          destinationDice={destinationMap.get(String(point)) ?? []}
                          onClick={() => handleLocationClick(point)}
                        />
                      )
                    })}
                  </div>
                </div>

                <BarColumn
                  botCount={state.board.bar.bot}
                  playerCount={state.board.bar.player}
                  playerBarActive={sourceKeys.has('bar')}
                  playerBarSelected={sameLocation(state.selectedFrom, 'bar')}
                  onPlayerBarClick={() => handleLocationClick('bar')}
                />

                <div className="grid flex-1 grid-rows-2 gap-3">
                  <div className="grid grid-cols-6 gap-2">
                    {TOP_RIGHT_POINTS.map(point => {
                      const occupant = state.board.points.player[point] > 0
                        ? 'player'
                        : state.board.points.bot[point] > 0
                          ? 'bot'
                          : null
                      const count = occupant ? state.board.points[occupant][point] : 0

                      return (
                        <PointSlot
                          key={point}
                          point={point}
                          orientation="top"
                          occupant={occupant}
                          count={count}
                          isSelectable={sourceKeys.has(String(point))}
                          isSelected={sameLocation(state.selectedFrom, point)}
                          destinationDice={destinationMap.get(String(point)) ?? []}
                          onClick={() => handleLocationClick(point)}
                        />
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {BOTTOM_RIGHT_POINTS.map(point => {
                      const occupant = state.board.points.player[point] > 0
                        ? 'player'
                        : state.board.points.bot[point] > 0
                          ? 'bot'
                          : null
                      const count = occupant ? state.board.points[occupant][point] : 0

                      return (
                        <PointSlot
                          key={point}
                          point={point}
                          orientation="bottom"
                          occupant={occupant}
                          count={count}
                          isSelectable={sourceKeys.has(String(point))}
                          isSelected={sameLocation(state.selectedFrom, point)}
                          destinationDice={destinationMap.get(String(point)) ?? []}
                          onClick={() => handleLocationClick(point)}
                        />
                      )
                    })}
                  </div>
                </div>

                <div className="flex w-24 shrink-0 flex-col justify-between gap-3 rounded-[1.5rem] bg-[#55210f]/80 p-2 shadow-inner">
                  <RailTray
                    label="Bot Home"
                    side="bot"
                    count={state.board.off.bot}
                    isActive={false}
                  />
                  <RailTray
                    label="Your Home"
                    side="player"
                    count={state.board.off.player}
                    isActive={destinationMap.has('off')}
                    onClick={destinationMap.has('off') ? () => handleLocationClick('off') : undefined}
                  />
                </div>
              </div>
            </div>
          </div>

          {state.phase === 'player-roll' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/15 p-4">
              <div className="w-full max-w-md rounded-[1.75rem] border-2 border-slate-200 bg-white p-5 text-center shadow-xl">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Roll Window</div>
                <h2 className="mt-2 text-2xl font-black text-slate-800">Your answer landed. Roll the dice.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  After the roll, you will pick the checker and destination yourself, just like a real backgammon turn.
                </p>
                <button
                  type="button"
                  onClick={handlePlayerRoll}
                  className="mt-5 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Roll Dice
                </button>
              </div>
            </div>
          )}

          {state.phase === 'bot-turn' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/15 p-4">
              <div className="w-full max-w-md rounded-[1.75rem] border-2 border-slate-200 bg-white p-5 text-center shadow-xl">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">DeployBot Turn</div>
                <h2 className="mt-2 text-2xl font-black text-slate-800">DeployBot is solving trivia and planning moves.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  The bot still has to earn its roll by answering correctly. The board will reopen to you after its turn resolves.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
