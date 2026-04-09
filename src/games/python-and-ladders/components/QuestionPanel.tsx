import { useState } from 'react'
import type { Question } from '../types'

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

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const card  = isDark
    ? 'bg-slate-900/70 border border-slate-700/60 backdrop-blur-sm'
    : 'bg-white border border-slate-200 shadow-sm'

  const questionText = isDark ? 'text-slate-100' : 'text-slate-900'
  const letterColor  = isDark ? 'text-slate-500' : 'text-slate-400'

  const diffBadge = (d: string) => {
    if (isDark) {
      if (d === 'easy')   return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
      if (d === 'medium') return 'bg-amber-500/20   text-amber-300   border border-amber-500/40'
      return                     'bg-rose-500/20    text-rose-300    border border-rose-500/40'
    }
    if (d === 'easy')   return 'bg-emerald-100 text-emerald-700 border border-emerald-300'
    if (d === 'medium') return 'bg-amber-100   text-amber-700   border border-amber-300'
    return                     'bg-rose-100    text-rose-700    border border-rose-300'
  }

  const diffAccent = (d: string) => {
    if (d === 'easy')   return isDark ? 'bg-emerald-500' : 'bg-emerald-400'
    if (d === 'medium') return isDark ? 'bg-amber-500'   : 'bg-amber-400'
    return                     isDark ? 'bg-rose-500'    : 'bg-rose-400'
  }

  const codeBlock = isDark
    ? 'bg-black/60 border border-white/10 text-cyan-300'
    : 'bg-slate-900 border border-slate-700 text-emerald-400'

  const answerBtn = (i: number) => {
    if (!isRevealed) {
      return isDark
        ? 'border-slate-700/60 bg-white/[0.03] text-slate-200 hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:text-white'
        : 'border-slate-200 bg-white text-slate-800 hover:border-violet-400 hover:bg-violet-50'
    }
    if (i === question.correctIndex)
      return isDark ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200' : 'border-emerald-400 bg-emerald-50 text-emerald-800'
    if (i === selected)
      return isDark ? 'border-rose-400 bg-rose-500/15 text-rose-200' : 'border-rose-400 bg-rose-50 text-rose-800'
    return isDark ? 'border-white/5 bg-transparent text-slate-600' : 'border-slate-100 bg-slate-50 text-slate-400'
  }

  return (
    <div className={`w-full max-w-md mx-auto rounded-xl overflow-hidden ${card}`}>
      {/* Difficulty accent bar */}
      <div className={`h-1 w-full ${diffAccent(question.difficulty)}`} />

      <div className="p-4 space-y-3">
        {/* Difficulty badge */}
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${diffBadge(question.difficulty)}`}>
          {question.difficulty}
        </span>

        {/* Question text */}
        <p className={`text-sm sm:text-base font-semibold leading-snug ${questionText}`}>
          {question.question}
        </p>

        {/* Code block */}
        {question.code && (
          <pre className={`text-xs sm:text-sm p-3 rounded-lg overflow-x-auto font-mono leading-relaxed ${codeBlock}`}>
            {question.code}
          </pre>
        )}

        {/* Options */}
        <div className="grid gap-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={disabled || isRevealed}
              className={`w-full text-left px-3 py-2.5 rounded-lg border-2 text-sm transition-all duration-200 font-medium
                ${answerBtn(i)}
                ${!isRevealed && !disabled ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
            >
              <span className={`mr-2 font-mono text-xs ${letterColor}`}>
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
