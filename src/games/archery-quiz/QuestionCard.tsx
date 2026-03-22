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
    <div className="sketch-card p-8 w-full max-w-2xl">
      <h2 className="font-sketch text-2xl text-[#2d2d2d] mb-8 leading-snug">
        {question.question}
      </h2>

      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => {
          const isCorrect  = index === question.correctIndex
          const isSelected = index === selectedAnswer

          // Colour feedback after answering
          const feedbackClass = hasAnswered
            ? isCorrect
              ? 'bg-green-50 !border-green-500'
              : isSelected
                ? 'bg-red-50 !border-red-500'
                : 'opacity-50'
            : ''

          return (
            <button
              key={index}
              onClick={() => onAnswer(index)}
              disabled={hasAnswered}
              className={cn(
                'sketch-btn text-left px-5 py-4 font-sketch text-lg w-full flex items-center gap-3',
                feedbackClass,
              )}
            >
              <span className="font-bold text-[#6b7280] shrink-0">{LETTERS[index]}.</span>
              <span className="text-[#2d2d2d] flex-1">{option}</span>
              {hasAnswered && isCorrect  && <span className="text-green-600 font-bold">✓</span>}
              {hasAnswered && isSelected && !isCorrect && <span className="text-red-600 font-bold">✗</span>}
            </button>
          )
        })}
      </div>

      {/* Feedback banner */}
      {hasAnswered && (
        <div
          className={cn(
            'mt-6 p-4 rounded-sm border-2 text-center font-sketch text-lg',
            selectedAnswer === question.correctIndex
              ? 'bg-green-50 border-green-400 text-green-700'
              : 'bg-red-50 border-red-400 text-red-700',
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
