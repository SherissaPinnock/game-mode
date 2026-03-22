import { useState } from 'react'
import { QuestionCard } from './QuestionCard'
import type { Question } from './types'

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
    <div className="sketch-bg flex flex-1 flex-col items-center px-6 py-12 gap-8 min-h-screen">

      {/* Header bar */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <button onClick={onExit} className="sketch-btn px-4 py-2 text-sm font-sketch">
          ← Exit
        </button>
        <span className="font-sketch text-[#6b7280] text-lg">
          Question {currentIndex + 1} / {questions.length}
        </span>
        {/* Progress dots */}
        <div className="flex gap-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 border-[#2d2d2d] transition-colors ${
                i < currentIndex
                  ? 'bg-green-500'
                  : i === currentIndex
                    ? 'bg-amber-400'
                    : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <QuestionCard
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        hasAnswered={hasAnswered}
        onAnswer={handleSelectAnswer}
      />

      {/* Next button — only appears after answering */}
      {hasAnswered && (
        <button
          onClick={handleNext}
          className="sketch-btn px-10 py-4 font-sketch text-xl font-bold"
        >
          {isLastQuestion ? '🏹 Head to the Range!' : 'Next Question →'}
        </button>
      )}
    </div>
  )
}
