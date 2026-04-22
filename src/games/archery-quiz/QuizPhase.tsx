import { useState } from 'react'
import { QuestionCard } from './QuestionCard'
import type { Question } from './types'
import './ArcheryArena.css'

interface QuizPhaseProps {
  questions: Question[]
  onComplete: (correctCount: number) => void
  onExit: () => void
}

/**
 * Cycles through all questions one by one.
 * Calls onComplete(correctCount) when the last question is answered and dismissed.
 */
export function QuizPhase({ questions, onComplete, onExit }: QuizPhaseProps) {
  const [currentIndex, setCurrentIndex]     = useState(0)
  const [correctCount, setCorrectCount]     = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered]       = useState(false)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion  = currentIndex === questions.length - 1
  const isCorrect       = selectedAnswer === currentQuestion.correctIndex

  function handleSelectAnswer(optionIndex: number) {
    if (hasAnswered) return
    setSelectedAnswer(optionIndex)
    setHasAnswered(true)
    if (optionIndex === currentQuestion.correctIndex) {
      setCorrectCount(prev => prev + 1)
    }
  }

  function handleNext() {
    if (isLastQuestion) {
      // correctCount is committed from the previous click event — safe to read here
      onComplete(correctCount + (isCorrect ? 1 : 0))
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setHasAnswered(false)
    }
  }

  return (
    <div className="aa-shell aa-shell-center">
      <div className="aa-header aa-header-narrow">
        <button onClick={onExit} className="aa-btn aa-btn-ghost px-4 py-2 text-sm font-sketch">
          ← Exit
        </button>
        <span className="aa-heading aa-heading-small font-sketch">
          Question {currentIndex + 1} / {questions.length}
        </span>
        <div className="aa-progress-dots">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`aa-dot ${
                i < currentIndex
                  ? 'aa-dot-correct'
                  : i === currentIndex
                    ? 'aa-dot-active'
                    : ''
              }`}
            />
          ))}
        </div>
      </div>

      <QuestionCard
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        hasAnswered={hasAnswered}
        onAnswer={handleSelectAnswer}
      />

      {hasAnswered && (
        <button
          onClick={handleNext}
          className="aa-btn aa-btn-primary px-10 py-4 font-sketch text-xl"
        >
          {isLastQuestion ? '🏹 Head to the Range!' : 'Next Question →'}
        </button>
      )}
    </div>
  )
}
