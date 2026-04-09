import { useState } from 'react'

const FONT  = '"Press Start 2P", monospace'
const BG    = '#2c3347'
const PANEL = '#1e2535'
const GOLD  = '#e8a820'
const GOLD_DARK = '#b87818'
const BORDER = '#2a3550'
const PLAYER_COLORS = ['#4080ff', '#ff6040', '#40d060', '#d0a020']

const btnStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 9,
  background: 'linear-gradient(to bottom, #f0c040, #d49010)',
  border: `3px solid ${GOLD_DARK}`,
  borderRadius: 4,
  color: '#1a1000',
  padding: '10px 20px',
  cursor: 'pointer',
  letterSpacing: '0.05em',
}

interface Props {
  onConfirm: (names: string[]) => void
  onBack:    () => void
}

export default function PlayerSetup({ onConfirm, onBack }: Props) {
  const [names, setNames] = useState<string[]>(['', ''])

  const setName = (i: number, val: string) => {
    setNames(prev => prev.map((n, idx) => (idx === i ? val : n)))
  }

  const addPlayer = () => {
    if (names.length < 4) setNames(prev => [...prev, ''])
  }

  const removePlayer = (i: number) => {
    if (names.length <= 2) return
    setNames(prev => prev.filter((_, idx) => idx !== i))
  }

  const canStart = names.filter(n => n.trim().length > 0).length >= 2

  const handleStart = () => {
    const trimmed = names.map(n => n.trim()).filter(n => n.length > 0)
    if (trimmed.length >= 2) onConfirm(trimmed)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT,
      padding: 20,
    }}>
      <div style={{
        background: PANEL,
        border: `4px solid ${GOLD}`,
        borderRadius: 6,
        padding: '36px 44px',
        maxWidth: 500,
        width: '100%',
        boxShadow: `0 0 0 8px ${BG}, 0 0 0 12px ${BORDER}`,
      }}>
        <h2 style={{
          fontFamily: FONT,
          fontSize: 13,
          color: GOLD,
          textAlign: 'center',
          margin: '0 0 8px 0',
          textShadow: `2px 2px 0 ${GOLD_DARK}`,
        }}>
          PLAYER SETUP
        </h2>
        <p style={{
          fontFamily: FONT,
          fontSize: 7,
          color: '#6888b0',
          textAlign: 'center',
          margin: '0 0 28px 0',
        }}>
          2–4 players
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {names.map((name, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Color indicator */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 3,
                background: PLAYER_COLORS[i],
                border: `2px solid ${BORDER}`,
                flexShrink: 0,
              }} />

              <div style={{
                fontFamily: FONT,
                fontSize: 7,
                color: PLAYER_COLORS[i],
                minWidth: 70,
              }}>
                P{i + 1}
              </div>

              <input
                value={name}
                onChange={e => setName(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                maxLength={16}
                style={{
                  flex: 1,
                  background: '#141c2e',
                  border: `2px solid ${BORDER}`,
                  borderRadius: 3,
                  color: '#e0e8f8',
                  fontFamily: FONT,
                  fontSize: 8,
                  padding: '8px 10px',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = PLAYER_COLORS[i]
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = BORDER
                }}
              />

              {names.length > 2 && (
                <button
                  onClick={() => removePlayer(i)}
                  style={{
                    fontFamily: FONT,
                    fontSize: 9,
                    background: '#2a1c1c',
                    border: `2px solid #6a2020`,
                    borderRadius: 3,
                    color: '#d04040',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Player button */}
        {names.length < 4 && (
          <button
            onClick={addPlayer}
            style={{
              fontFamily: FONT,
              fontSize: 8,
              background: '#1a2840',
              border: `2px dashed #3a5070`,
              borderRadius: 4,
              color: '#5888b0',
              padding: '10px',
              cursor: 'pointer',
              width: '100%',
              marginBottom: 20,
            }}
          >
            + ADD PLAYER
          </button>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onBack}
            style={{
              fontFamily: FONT,
              fontSize: 8,
              background: 'none',
              border: `2px solid #3a4560`,
              borderRadius: 3,
              color: '#6070a0',
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            ← BACK
          </button>
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              ...btnStyle,
              opacity: canStart ? 1 : 0.4,
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  )
}
