import { useCallback, useState } from 'react'
import { QuestionCard }  from './QuestionCard'
import { PowerMeter }    from './PowerMeter'
import { TargetCanvas }  from './TargetCanvas'
import { ResultsScreen } from './ResultsScreen'
import { ZONE_META }     from './utils'
import { questions as allQuestions } from './data/questions'
import type { Question, ArrowShot } from './types'

const QUESTIONS_PER_GAME = 5

/** Picks `count` random questions from the full pool each session. */
function pickQuestions(count: number): Question[] {
  return [...allQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

interface ArcheryQuizProps {
  onExit: () => void
}

/**
 * Interleaved flow: question → (if correct) shoot → next question → …
 *
 * Sub-phases per question:
 *   'question'      – answering the quiz question
 *   'answered'      – feedback shown, waiting for user to proceed
 *   'aiming'        – power meter active (correct answers only)
 *   'shot-feedback'  – shot result shown
 *
 * After all questions: 'results'
 */
type SubPhase = 'question' | 'answered' | 'aiming' | 'shot-feedback' | 'results'

export function ArcheryQuiz({ onExit }: ArcheryQuizProps) {
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>(() =>
    pickQuestions(QUESTIONS_PER_GAME),
  )

  const [qIndex,        setQIndex]        = useState(0)
  const [subPhase,      setSubPhase]      = useState<SubPhase>('question')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [shots,         setShots]         = useState<ArrowShot[]>([])
  const [latestShot,    setLatestShot]    = useState<ArrowShot | null>(null)
  const [correctCount,  setCorrectCount]  = useState(0)

  // Track per-question result for progress dots
  const [questionResults, setQuestionResults] = useState<('correct' | 'wrong')[]>([])

  const question = sessionQuestions[qIndex]
  const isLastQuestion = qIndex >= sessionQuestions.length - 1
  const wasCorrect = selectedAnswer !== null && selectedAnswer === question?.correctIndex
  const totalScore = shots.reduce((sum, s) => sum + s.score, 0)

  // --- Handlers ---

  const handleAnswer = useCallback((index: number) => {
    setSelectedAnswer(index)
    const correct = index === question.correctIndex
    if (correct) setCorrectCount(prev => prev + 1)
    setQuestionResults(prev => [...prev, correct ? 'correct' : 'wrong'])
    setSubPhase('answered')
  }, [question])

  /** After seeing the answer feedback, proceed to shooting or next question. */
  const handleProceed = useCallback(() => {
    if (wasCorrect) {
      // Correct — let them shoot!
      setSubPhase('aiming')
    } else {
      // Wrong — skip to next question or results
      if (isLastQuestion) {
        setSubPhase('results')
      } else {
        setQIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setSubPhase('question')
      }
    }
  }, [wasCorrect, isLastQuestion])

  const handleShoot = useCallback(
    (shotData: Pick<ArrowShot, 'power' | 'zone' | 'score' | 'canvasX' | 'canvasY'>) => {
      const shot: ArrowShot = { arrowIndex: shots.length, ...shotData }
      setShots(prev => [...prev, shot])
      setLatestShot(shot)
      setSubPhase('shot-feedback')
    },
    [shots.length],
  )

  /** After seeing shot feedback, go to next question or results. */
  const handleAfterShot = useCallback(() => {
    setLatestShot(null)
    if (isLastQuestion) {
      setSubPhase('results')
    } else {
      setQIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setSubPhase('question')
    }
  }, [isLastQuestion])

  const handlePlayAgain = useCallback(() => {
    setSessionQuestions(pickQuestions(QUESTIONS_PER_GAME))
    setQIndex(0)
    setSubPhase('question')
    setSelectedAnswer(null)
    setShots([])
    setLatestShot(null)
    setCorrectCount(0)
    setQuestionResults([])
  }, [])

  // ── Results screen ────────────────────────────────────────────────────────
  if (subPhase === 'results') {
    return (
      <ResultsScreen
        shots={shots}
        totalScore={totalScore}
        correctCount={correctCount}
        totalQuestions={sessionQuestions.length}
        onPlayAgain={handlePlayAgain}
        onExit={onExit}
      />
    )
  }

  // ── Progress dots ─────────────────────────────────────────────────────────
  const progressDots = (
    <div className="flex gap-2">
      {sessionQuestions.map((_, i) => {
        const result = questionResults[i]
        let bgClass = 'bg-transparent'
        if (result === 'correct') bgClass = 'bg-green-500'
        else if (result === 'wrong') bgClass = 'bg-red-400'
        else if (i === qIndex) bgClass = 'bg-amber-400'

        return (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 border-[#2d2d2d] transition-colors ${bgClass}`}
          />
        )
      })}
    </div>
  )

  const resultMeta = latestShot ? ZONE_META[latestShot.zone] : null

  // ── Aiming / Shot feedback: show target + controls ────────────────────────
  if (subPhase === 'aiming' || subPhase === 'shot-feedback') {
    return (
      <div className="sketch-bg flex flex-1 flex-col items-center px-6 py-12 gap-8 min-h-screen">
        {/* Header */}
        <div className="w-full max-w-3xl flex items-center justify-between">
          <button onClick={onExit} className="sketch-btn px-4 py-2 text-sm font-sketch">
            ← Exit
          </button>
          <h2 className="font-sketch text-2xl text-[#2d2d2d]">🏹 Take Your Shot!</h2>
          {progressDots}
        </div>

        {/* Earned shot banner */}
        <div className="sketch-card px-6 py-3 text-center bg-green-50 border-green-400">
          <p className="font-sketch text-lg text-green-700">
            ✓ Correct answer! Arrow #{shots.length + (subPhase === 'aiming' ? 1 : 0)} earned
          </p>
        </div>

        {/* Main layout: target left, controls right */}
        <div className="w-full max-w-3xl flex flex-col sm:flex-row gap-8 items-center justify-center">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <TargetCanvas shots={shots} latestShot={latestShot} />
            <p className="font-sketch text-sm text-[#9ca3af]">
              {shots.length} arrow{shots.length !== 1 ? 's' : ''} on target
            </p>
          </div>

          <div className="sketch-card p-6 flex-1 w-full flex flex-col gap-4">
            {subPhase === 'aiming' ? (
              <PowerMeter
                arrowIndex={shots.length}
                totalArrows={shots.length + 1}
                onShoot={handleShoot}
              />
            ) : resultMeta && latestShot ? (
              <div className="flex flex-col items-center gap-5 text-center py-4">
                <span className="text-6xl">{resultMeta.emoji}</span>
                <p className="font-sketch text-3xl font-bold" style={{ color: resultMeta.color }}>
                  {resultMeta.label}
                </p>
                <p className="font-sketch text-xl text-[#2d2d2d]">
                  +{latestShot.score} point{latestShot.score !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={handleAfterShot}
                  className="sketch-btn px-8 py-3 font-sketch text-lg font-bold"
                >
                  {isLastQuestion ? '📊 See Results' : '➡ Next Question'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  // ── Question / Answered: show quiz card ───────────────────────────────────
  return (
    <div className="sketch-bg flex flex-1 flex-col items-center px-6 py-12 gap-8 min-h-screen">
      {/* Header */}
      <div className="w-full max-w-3xl flex items-center justify-between">
        <button onClick={onExit} className="sketch-btn px-4 py-2 text-sm font-sketch">
          ← Exit
        </button>
        <h2 className="font-sketch text-2xl text-[#2d2d2d]">
          🎯 Question {qIndex + 1} / {sessionQuestions.length}
        </h2>
        {progressDots}
      </div>

      {/* Target preview (small) + question side by side */}
      <div className="w-full max-w-3xl flex flex-col sm:flex-row gap-8 items-center justify-center">
        {/* Small target preview showing accumulated shots */}
        {shots.length > 0 && (
          <div className="flex flex-col items-center gap-2 shrink-0">
            <TargetCanvas shots={shots} />
            <p className="font-sketch text-sm text-[#9ca3af]">
              {shots.length} arrow{shots.length !== 1 ? 's' : ''} landed
            </p>
          </div>
        )}

        {/* Question card + action button */}
        <div className="flex flex-col gap-4 flex-1 w-full">
          <QuestionCard
            question={question}
            selectedAnswer={selectedAnswer}
            hasAnswered={subPhase === 'answered'}
            onAnswer={handleAnswer}
          />

          {subPhase === 'answered' && (
            <button
              onClick={handleProceed}
              className="sketch-btn w-full py-4 font-sketch text-xl font-bold tracking-wide"
            >
              {wasCorrect
                ? '🏹 Take Your Shot!'
                : isLastQuestion
                  ? '📊 See Results'
                  : '➡ Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
