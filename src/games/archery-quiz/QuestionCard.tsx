import { cn } from '@/lib/utils'
import type { Question } from './types'

const LETTERS = ['A', 'B', 'C', 'D']

interface QuestionCardProps {
  question: Question
  selectedAnswer: number | null
  hasAnswered: boolean
  onAnswer: (index: number) => void
}

/**
 * Renders a single quiz question with four answer buttons.
 * After answering, buttons show correct / incorrect colouring.
 */
export function QuestionCard({ question, selectedAnswer, hasAnswered, onAnswer }: QuestionCardProps) {
  return (
    <div className="aa-panel aa-question-card">
      <h2 className="aa-question-title font-sketch">
        {question.question}
      </h2>

      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => {
          const isCorrect  = index === question.correctIndex
          const isSelected = index === selectedAnswer

          // Colour feedback after answering
          const feedbackClass = hasAnswered
            ? isCorrect
              ? 'aa-option-correct'
              : isSelected
                ? 'aa-option-wrong'
                : 'aa-option-muted'
            : ''

          return (
            <button
              key={index}
              onClick={() => onAnswer(index)}
              disabled={hasAnswered}
              className={cn(
                'aa-btn aa-option-btn font-sketch',
                feedbackClass,
              )}
            >
              <span className="aa-option-letter font-bold">{LETTERS[index]}.</span>
              <span className="aa-option-text">{option}</span>
              {hasAnswered && isCorrect && <span className="aa-option-mark aa-option-mark-good font-bold">✓</span>}
              {hasAnswered && isSelected && !isCorrect && <span className="aa-option-mark aa-option-mark-bad font-bold">✗</span>}
            </button>
          )
        })}
      </div>

      {hasAnswered && (
        <div
          className={cn(
            'aa-feedback-banner font-sketch text-lg',
            selectedAnswer === question.correctIndex
              ? 'aa-feedback-good'
              : 'aa-feedback-bad',
          )}
        >
          {selectedAnswer === question.correctIndex
            ? '✓ Correct! Nice shot, Robin Hood!'
            : `✗ Correct answer: ${question.options[question.correctIndex]}`}
        </div>
      )}
    </div>
  )
}
