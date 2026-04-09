import { useState } from 'react'
import type { Player } from '../types'

const FONT  = '"Press Start 2P", monospace'
const BG    = '#2c3347'
const PANEL = '#1e2535'
const GOLD  = '#e8a820'
const GOLD_DARK = '#b87818'
const BORDER = '#2a3550'

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

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
  players:   Player[]
  onRoll:    (id: string, roll: number) => void
  onBegin:   () => void
  allRolled: boolean
}

export default function InitialRollScreen({ players, onRoll, onBegin, allRolled }: Props) {
  const [rolling, setRolling] = useState<Record<string, boolean>>({})
  const [displayFace, setDisplayFace] = useState<Record<string, number>>({})

  const roll = (player: Player) => {
    if (player.initialRoll !== null || rolling[player.id]) return

    setRolling(prev => ({ ...prev, [player.id]: true }))

    let ticks = 0
    const maxTicks = 12
    const interval = setInterval(() => {
      setDisplayFace(prev => ({
        ...prev,
        [player.id]: Math.floor(Math.random() * 6) + 1,
      }))
      ticks++
      if (ticks >= maxTicks) {
        clearInterval(interval)
        const finalRoll = Math.floor(Math.random() * 6) + 1
        setDisplayFace(prev => ({ ...prev, [player.id]: finalRoll }))
        setRolling(prev => ({ ...prev, [player.id]: false }))
        onRoll(player.id, finalRoll)
      }
    }, 80)
  }

  // Sort players by roll for display (only when all rolled)
  const sortedPlayers = allRolled
    ? [...players].sort((a, b) => (b.initialRoll ?? 0) - (a.initialRoll ?? 0))
    : players

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
        maxWidth: 560,
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
          ROLL FOR ORDER
        </h2>
        <p style={{
          fontFamily: FONT,
          fontSize: 7,
          color: '#6888b0',
          textAlign: 'center',
          margin: '0 0 28px 0',
        }}>
          Highest roll goes first
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {(allRolled ? sortedPlayers : players).map((player, idx) => {
            const face = displayFace[player.id] ?? (player.initialRoll ?? null)
            const isRolling = rolling[player.id]
            const hasRolled = player.initialRoll !== null

            return (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: '#141c2e',
                  border: `2px solid ${hasRolled ? player.color : BORDER}`,
                  borderRadius: 4,
                  padding: '12px 16px',
                }}
              >
                {/* Order badge (after all rolled) */}
                {allRolled && (
                  <div style={{
                    fontFamily: FONT,
                    fontSize: 8,
                    color: idx === 0 ? GOLD : '#6888b0',
                    minWidth: 24,
                  }}>
                    #{idx + 1}
                  </div>
                )}

                {/* Color dot */}
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: 2,
                  background: player.color,
                  flexShrink: 0,
                }} />

                {/* Name */}
                <span style={{
                  fontFamily: FONT,
                  fontSize: 8,
                  color: '#d0dff0',
                  flex: 1,
                }}>
                  {player.name}
                </span>

                {/* Die display */}
                <div style={{
                  fontSize: 28,
                  lineHeight: 1,
                  minWidth: 36,
                  textAlign: 'center',
                  filter: isRolling ? 'blur(1px)' : 'none',
                  transition: 'filter 0.1s',
                }}>
                  {face ? DIE_FACES[face - 1] : '🎲'}
                </div>

                {/* Roll value */}
                <div style={{
                  fontFamily: FONT,
                  fontSize: 12,
                  color: hasRolled ? GOLD : '#445060',
                  minWidth: 24,
                  textAlign: 'right',
                }}>
                  {hasRolled ? player.initialRoll : '?'}
                </div>

                {/* Roll button */}
                {!hasRolled && !isRolling && (
                  <button
                    onClick={() => roll(player)}
                    style={{ ...btnStyle, fontSize: 7, padding: '7px 14px' }}
                  >
                    ROLL
                  </button>
                )}
                {isRolling && (
                  <div style={{
                    fontFamily: FONT,
                    fontSize: 7,
                    color: GOLD,
                    minWidth: 64,
                    textAlign: 'center',
                  }}>
                    rolling...
                  </div>
                )}
                {hasRolled && !isRolling && (
                  <div style={{
                    fontFamily: FONT,
                    fontSize: 7,
                    color: '#30c870',
                    minWidth: 64,
                    textAlign: 'center',
                  }}>
                    ✓ rolled
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {allRolled && (
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: FONT,
              fontSize: 8,
              color: GOLD,
              marginBottom: 16,
            }}>
              {sortedPlayers[0].name} goes first!
            </p>
            <button onClick={onBegin} style={btnStyle}>
              BEGIN GAME
            </button>
          </div>
        )}

        {!allRolled && (
          <p style={{
            fontFamily: FONT,
            fontSize: 7,
            color: '#5070a0',
            textAlign: 'center',
            margin: 0,
          }}>
            All players must roll before the game begins
          </p>
        )}
      </div>
    </div>
  )
}
