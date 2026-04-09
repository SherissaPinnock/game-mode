import { useState, useEffect } from 'react'
import type { RoomDef, AWSQuestion } from '../types'

const FONT  = '"Press Start 2P", monospace'
const GOLD_DARK = '#b87818'
const PANEL = '#1e2535'
const BORDER = '#2a3550'

interface Props {
  room:      RoomDef
  question:  AWSQuestion
  onAnswer:  (idx: number) => void
}

export default function QuestionModal({ room, question, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setSelected(null)
  }, [question.id])

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    // Brief delay before calling onAnswer
    setTimeout(() => {
      onAnswer(idx)
    }, 1400)
  }

  const isCorrect = (idx: number) =>
    selected === idx && idx === question.correctIndex
  const isWrong = (idx: number) =>
    selected === idx && idx !== question.correctIndex
  const isRevealedCorrect = (idx: number) =>
    selected !== null && idx === question.correctIndex && selected !== idx

  const getOptionStyle = (idx: number): React.CSSProperties => {
    if (selected === null) {
      return {
        background: 'linear-gradient(to bottom, #f0c040, #d49010)',
        border: `3px solid ${GOLD_DARK}`,
        color: '#1a1000',
        cursor: 'pointer',
      }
    }
    if (isCorrect(idx)) {
      return {
        background: 'linear-gradient(to bottom, #40e060, #20a040)',
        border: `3px solid #18c030`,
        color: '#ffffff',
        cursor: 'default',
      }
    }
    if (isWrong(idx)) {
      return {
        background: 'linear-gradient(to bottom, #e04040, #a02020)',
        border: `3px solid #c01818`,
        color: '#ffffff',
        cursor: 'default',
      }
    }
    if (isRevealedCorrect(idx)) {
      return {
        background: 'linear-gradient(to bottom, #40e060, #20a040)',
        border: `3px solid #18c030`,
        color: '#ffffff',
        cursor: 'default',
        opacity: 0.7,
      }
    }
    return {
      background: '#2a3550',
      border: `3px solid #3a4560`,
      color: '#5a6a80',
      cursor: 'default',
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: 20,
      fontFamily: FONT,
    }}>
      <div style={{
        background: PANEL,
        border: `4px solid ${room.color}`,
        borderRadius: 6,
        padding: '32px 36px',
        maxWidth: 560,
        width: '100%',
        boxShadow: `0 0 24px ${room.color}44, 0 0 0 8px #1a2030`,
      }}>
        {/* Room header */}
        <div style={{
          background: room.color,
          margin: '-32px -36px 24px -36px',
          padding: '14px 20px',
          borderRadius: '2px 2px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{
            fontFamily: FONT,
            fontSize: 10,
            color: '#fff',
            textShadow: `1px 1px 0 ${room.darkColor}`,
            letterSpacing: '0.05em',
          }}>
            {room.name.toUpperCase()}
          </span>
          <span style={{
            fontFamily: FONT,
            fontSize: 7,
            color: 'rgba(255,255,255,0.7)',
          }}>
            — AWS CHALLENGE
          </span>
        </div>

        {/* Question text */}
        <div style={{
          background: '#141c2e',
          border: `2px solid ${BORDER}`,
          borderRadius: 4,
          padding: '16px 18px',
          marginBottom: 20,
        }}>
          <p style={{
            fontFamily: FONT,
            fontSize: 8,
            color: '#d0e0f0',
            lineHeight: 2,
            margin: 0,
          }}>
            {question.text}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              style={{
                fontFamily: FONT,
                fontSize: 7,
                borderRadius: 4,
                padding: '10px 14px',
                textAlign: 'left',
                lineHeight: 1.6,
                ...getOptionStyle(idx),
              }}
            >
              <span style={{
                display: 'inline-block',
                width: 16,
                marginRight: 8,
                fontWeight: 'bold',
              }}>
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {selected !== null && (
          <div style={{
            marginTop: 16,
            padding: '10px 14px',
            background: selected === question.correctIndex ? '#143020' : '#301414',
            border: `2px solid ${selected === question.correctIndex ? '#30c870' : '#e04040'}`,
            borderRadius: 4,
            fontFamily: FONT,
            fontSize: 8,
            color: selected === question.correctIndex ? '#40e080' : '#f04040',
            textAlign: 'center',
          }}>
            {selected === question.correctIndex
              ? '✓ CORRECT! Clue collected!'
              : '✗ WRONG! No clue this turn.'}
          </div>
        )}
      </div>
    </div>
  )
}
