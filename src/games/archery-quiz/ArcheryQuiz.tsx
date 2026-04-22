import { useCallback, useRef, useState } from 'react'
import { QuestionCard }  from './QuestionCard'
import { PowerMeter }    from './PowerMeter'
import { TargetCanvas }  from './TargetCanvas'
import { ResultsScreen } from './ResultsScreen'
import { ZONE_META }     from './utils'
import { questions as allQuestions } from './data/questions'
import { usePerformance, type PerformanceEntry } from '@/lib/performance'
import { playCorrect, playWrong, playArrow, playComplete } from '@/lib/sounds'
import type { Question, ArrowShot } from './types'
import './ArcheryArena.css'

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

  // Performance tracking
  const { report } = usePerformance()
  const perfEntries = useRef<PerformanceEntry[]>([])
  const sessionStart = useRef(Date.now())

  const question = sessionQuestions[qIndex]
  const isLastQuestion = qIndex >= sessionQuestions.length - 1
  const wasCorrect = selectedAnswer !== null && selectedAnswer === question?.correctIndex
  const totalScore = shots.reduce((sum, s) => sum + s.score, 0)

  // --- Handlers ---

  const handleAnswer = useCallback((index: number) => {
    setSelectedAnswer(index)
    const correct = index === question.correctIndex
    if (correct) { setCorrectCount(prev => prev + 1); playCorrect() } else { playWrong() }
    setQuestionResults(prev => [...prev, correct ? 'correct' : 'wrong'])
    // Track for recommendations
    perfEntries.current.push({
      category: question.category,
      correct,
      gameId: 'archery-quiz',
      timestamp: Date.now(),
    })
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
      playArrow()
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
    perfEntries.current = []
    hasReported.current = false
    sessionStart.current = Date.now()
  }, [])

  // ── Results screen ────────────────────────────────────────────────────────
  // Report performance when entering results
  const hasReported = useRef(false)
  if (subPhase === 'results' && !hasReported.current) {
    playComplete()
    hasReported.current = true
    report(perfEntries.current)
  }

  if (subPhase === 'results') {
    return (
      <ResultsScreen
        shots={shots}
        totalScore={totalScore}
        correctCount={correctCount}
        totalQuestions={sessionQuestions.length}
        sessionEntries={perfEntries.current}
        onPlayAgain={handlePlayAgain}
        onExit={onExit}
      />
    )
  }

  // ── Progress dots ─────────────────────────────────────────────────────────
  const progressDots = (
    <div className="aa-progress-dots">
      {sessionQuestions.map((_, i) => {
        const result = questionResults[i]
        let stateClass = ''
        if (result === 'correct') stateClass = 'aa-dot-correct'
        else if (result === 'wrong') stateClass = 'aa-dot-wrong'
        else if (i === qIndex) stateClass = 'aa-dot-active'

        return (
          <div
            key={i}
            className={`aa-dot ${stateClass}`}
          />
        )
      })}
    </div>
  )

  const resultMeta = latestShot ? ZONE_META[latestShot.zone] : null

  // ── Aiming / Shot feedback: show target + controls ────────────────────────
  if (subPhase === 'aiming' || subPhase === 'shot-feedback') {
    return (
      <div className="aa-shell aa-shell-center">
        <div className="aa-header">
          <button onClick={onExit} className="aa-btn aa-btn-ghost px-4 py-2 text-sm font-sketch">
            ← Exit
          </button>
          <h2 className="aa-heading aa-heading-center aa-heading-small font-sketch">🏹 Take Your Shot!</h2>
          {progressDots}
        </div>

        <div className="aa-banner aa-banner-good">
          <p className="font-sketch text-lg">
            ✓ Correct answer! Arrow #{shots.length + (subPhase === 'aiming' ? 1 : 0)} earned
          </p>
        </div>

        <div className="aa-main-row">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <TargetCanvas shots={shots} latestShot={latestShot} />
            <p className="aa-caption aa-caption-center font-sketch">
              {shots.length} arrow{shots.length !== 1 ? 's' : ''} on target
            </p>
          </div>

          <div className="aa-panel aa-side-panel">
            {subPhase === 'aiming' ? (
              <PowerMeter
                arrowIndex={shots.length}
                totalArrows={shots.length + 1}
                onShoot={handleShoot}
              />
            ) : resultMeta && latestShot ? (
              <div className="aa-feedback-stack">
                <span className="text-6xl">{resultMeta.emoji}</span>
                <p className="aa-zone-title font-sketch" style={{ color: resultMeta.color }}>
                  {resultMeta.label}
                </p>
                <p className="aa-points-text font-sketch">
                  +{latestShot.score} point{latestShot.score !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={handleAfterShot}
                  className="aa-btn aa-btn-primary aa-btn-wide font-sketch"
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
    <div className="aa-shell aa-shell-center">
      <div className="aa-header">
        <button onClick={onExit} className="aa-btn aa-btn-ghost px-4 py-2 text-sm font-sketch">
          ← Exit
        </button>
        <h2 className="aa-heading aa-heading-center aa-heading-small font-sketch">
          🎯 Q{qIndex + 1}/{sessionQuestions.length}
        </h2>
        {progressDots}
      </div>

      <div className="aa-main-row">
        {shots.length > 0 && (
          <div className="flex flex-col items-center gap-2 shrink-0">
            <TargetCanvas shots={shots} />
            <p className="aa-caption aa-caption-center font-sketch">
              {shots.length} arrow{shots.length !== 1 ? 's' : ''} landed
            </p>
          </div>
        )}

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
              className="aa-btn aa-btn-primary aa-btn-wide font-sketch"
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
