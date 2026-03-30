import { useState } from 'react'
import type { Question } from '../types'

interface QuestionPanelProps {
  question: Question
  onAnswer: (index: number) => void
  disabled: boolean
}

export function QuestionPanel({ question, onAnswer, disabled }: QuestionPanelProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (index: number) => {
    if (disabled || selected !== null) return
    setSelected(index)
    onAnswer(index)
  }

  const isRevealed = selected !== null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* Difficulty badge */}
      <div className="flex items-center gap-2">
        <span className={`
          text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full
          ${question.difficulty === 'easy'
            ? 'bg-green-100 text-green-700'
            : question.difficulty === 'medium'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }
        `}>
          {question.difficulty}
        </span>
      </div>

      {/* Question text */}
      <p className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
        {question.question}
      </p>

      {/* Code block */}
      {question.code && (
        <pre className="bg-slate-900 text-green-400 text-xs sm:text-sm p-3 rounded-lg overflow-x-auto font-mono leading-relaxed">
          {question.code}
        </pre>
      )}

      {/* Options */}
      <div className="grid gap-2">
        {question.options.map((opt, i) => {
          let style = 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50'
          if (isRevealed) {
            if (i === question.correctIndex) {
              style = 'border-green-500 bg-green-50 text-green-800'
            } else if (i === selected && i !== question.correctIndex) {
              style = 'border-red-500 bg-red-50 text-red-800'
            } else {
              style = 'border-slate-200 bg-slate-50 text-slate-400'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={disabled || isRevealed}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg border-2 text-sm
                transition-all duration-200 font-medium
                ${style}
                ${!isRevealed && !disabled ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}
              `}
            >
              <span className="text-slate-400 mr-2 font-mono text-xs">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
