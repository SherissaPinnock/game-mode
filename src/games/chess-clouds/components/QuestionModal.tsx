import { useState } from 'react'
import type { Question } from '../data/levels'

interface Props {
  question: Question
  accentColor: string
  pieceName: string
  onAnswer: (correct: boolean) => void
}

export function QuestionModal({ question, accentColor, pieceName, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  function handlePick(idx: number) {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    const correct = idx === question.answer
    setTimeout(() => onAnswer(correct), 1600)
  }

  return (
    <div className="cc-modal-overlay">
      <div className="cc-modal">
        {/* Header */}
        <div className="cc-modal-header" style={{ borderBottomColor: accentColor + '44' }}>
          <div className="cc-modal-chip" style={{ background: accentColor + '22', color: accentColor }}>
            ⚔️ Capture Attempt
          </div>
          <p className="cc-modal-sub">Answer correctly to capture the {pieceName}</p>
        </div>

        {/* Question */}
        <p className="cc-modal-question">{question.q}</p>

        {/* Options */}
        <div className="cc-modal-options">
          {question.options.map((opt, i) => {
            let cls = 'cc-modal-option'
            if (revealed) {
              if (i === question.answer) cls += ' cc-option-correct'
              else if (i === selected && i !== question.answer) cls += ' cc-option-wrong'
            }
            return (
              <button key={i} className={cls} onClick={() => handlePick(i)}>
                <span className="cc-option-letter">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <div className={`cc-modal-explanation ${selected === question.answer ? 'cc-explain-good' : 'cc-explain-bad'}`}>
            <span className="cc-explain-icon">{selected === question.answer ? '✓' : '✗'}</span>
            <div>
              <p className="cc-explain-headline">
                {selected === question.answer ? 'Correct! Capture successful.' : 'Wrong! The piece retreats.'}
              </p>
              <p className="cc-explain-body">{question.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
