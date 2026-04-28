import { useState } from 'react'
import type { Question } from '../types'
import '../PythonAndLadders.css'

interface QuestionPanelProps {
  question: Question
  onAnswer: (index: number) => void
  disabled: boolean
  isDark: boolean
}

export function QuestionPanel({ question, onAnswer, disabled, isDark }: QuestionPanelProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (index: number) => {
    if (disabled || selected !== null) return
    setSelected(index)
    onAnswer(index)
  }

  const isRevealed = selected !== null

  const diffBadge = (d: string) => {
    if (d === 'easy') return 'pal-difficulty-easy'
    if (d === 'medium') return 'pal-difficulty-medium'
    return 'pal-difficulty-hard'
  }

  const answerBtn = (i: number) => {
    if (!isRevealed) {
      return 'pal-answer-default'
    }
    if (i === question.correctIndex)
      return 'pal-answer-correct'
    if (i === selected)
      return 'pal-answer-wrong'
    return 'pal-answer-muted'
  }

  return (
    <div className="pal-question-card w-full max-w-md mx-auto overflow-hidden">
      <div className="space-y-3">
        <span className={`pal-difficulty-pill ${diffBadge(question.difficulty)}`}>
          {question.difficulty}
        </span>

        <p className="text-sm sm:text-base font-semibold leading-snug text-[#fbf4e8]">
          {question.question}
        </p>

        {question.code && (
          <pre className={`pal-code-block text-xs sm:text-sm p-3 overflow-x-auto font-mono leading-relaxed ${isDark ? 'opacity-95' : ''}`}>
            {question.code}
          </pre>
        )}

        <div className="grid gap-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={disabled || isRevealed}
              className={`pal-answer-btn text-sm ${answerBtn(i)}`}
            >
              <span className="pal-answer-letter mr-2 font-mono text-xs">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
