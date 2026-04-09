import type { Player, RoomDef, Clue } from '../types'
import type { TurnPhase } from '../types'
import { SUSPECTS, DEVICES, MYSTERY_ROOM_NAMES } from '../data/mystery'

const FONT  = '"Press Start 2P", monospace'
const PANEL = '#1e2535'
const GOLD  = '#e8a820'
const GOLD_DARK = '#b87818'
const BORDER = '#2a3550'

const DIE_DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
}

interface Props {
  players:            Player[]
  playerOrder:        number[]
  currentTurnIdx:     number
  turnPhase:          TurnPhase
  diceRoll:           number | null
  currentRoomId:      string | null
  rooms:              RoomDef[]
  collectedClues:     Clue[]
  eliminatedSuspects: string[]
  eliminatedDevices:  string[]
  eliminatedLocations: string[]
  message:            string
  onRollDie:          () => void
  onSecretPassage:    () => void
  onSkipRoom:         () => void
  onEndTurn:          () => void
  onStartQuestion:    () => void
}

export default function SidePanel({
  players,
  playerOrder,
  currentTurnIdx,
  turnPhase,
  diceRoll,
  currentRoomId,
  rooms,
  collectedClues,
  eliminatedSuspects,
  eliminatedDevices,
  eliminatedLocations,
  message,
  onRollDie,
  onSecretPassage,
  onSkipRoom,
  onEndTurn,
  onStartQuestion,
}: Props) {
  const currentPlayer = playerOrder.length > 0
    ? players[playerOrder[currentTurnIdx]]
    : null

  const currentRoom = rooms.find(r => r.id === currentRoomId)
  const hasSecretPassage = !!currentRoom?.secretPassage

  const canRoll = turnPhase === 'roll' && !players[playerOrder[currentTurnIdx]]?.eliminated

  return (
    <div style={{
      background: PANEL,
      border: `3px solid ${BORDER}`,
      borderRadius: 5,
      padding: '16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      height: '100%',
      overflowY: 'auto',
      fontFamily: FONT,
      minWidth: 220,
    }}>
      {/* Current player */}
      {currentPlayer && (
        <div style={{
          background: '#141c2e',
          border: `2px solid ${currentPlayer.color}`,
          borderRadius: 4,
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: 6, color: '#5888b0', marginBottom: 6 }}>CURRENT PLAYER</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 12, height: 12,
              borderRadius: 2,
              background: currentPlayer.color,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 9, color: '#e0eaf8', letterSpacing: '0.05em' }}>
              {currentPlayer.name}
            </span>
          </div>
          {currentRoom && (
            <div style={{ fontSize: 6, color: currentRoom.color, marginTop: 6 }}>
              📍 {currentRoom.name}
            </div>
          )}
        </div>
      )}

      {/* Die */}
      <div style={{
        background: '#141c2e',
        border: `2px solid ${BORDER}`,
        borderRadius: 4,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}>
        <PixelDie value={diceRoll} />

        <button
          onClick={onRollDie}
          disabled={!canRoll}
          style={{
            fontFamily: FONT,
            fontSize: 8,
            background: canRoll
              ? 'linear-gradient(to bottom, #f0c040, #d49010)'
              : '#2a3550',
            border: `3px solid ${canRoll ? GOLD_DARK : '#3a4560'}`,
            borderRadius: 4,
            color: canRoll ? '#1a1000' : '#4a5a70',
            padding: '8px 14px',
            cursor: canRoll ? 'pointer' : 'not-allowed',
            width: '100%',
          }}
        >
          🎲 ROLL THE DIE
        </button>
      </div>

      {/* Action buttons */}
      {turnPhase === 'in-room' && currentRoom && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onStartQuestion}
            style={{
              fontFamily: FONT,
              fontSize: 7,
              background: 'linear-gradient(to bottom, #f0c040, #d49010)',
              border: `3px solid ${GOLD_DARK}`,
              borderRadius: 4,
              color: '#1a1000',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            ❓ ANSWER CLUE
          </button>

          {hasSecretPassage && (
            <button
              onClick={onSecretPassage}
              style={{
                fontFamily: FONT,
                fontSize: 7,
                background: '#1a2840',
                border: `2px solid #6040c8`,
                borderRadius: 4,
                color: '#a080f0',
                padding: '8px 10px',
                cursor: 'pointer',
              }}
            >
              🚪 SECRET PASSAGE → {rooms.find(r => r.id === currentRoom.secretPassage)?.name ?? '?'}
            </button>
          )}

          <button
            onClick={onSkipRoom}
            style={{
              fontFamily: FONT,
              fontSize: 7,
              background: '#1a1f30',
              border: `2px solid #3a4560`,
              borderRadius: 4,
              color: '#6070a0',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            SKIP ROOM
          </button>
        </div>
      )}

      {turnPhase === 'turn-end' && (
        <button
          onClick={onEndTurn}
          style={{
            fontFamily: FONT,
            fontSize: 8,
            background: 'linear-gradient(to bottom, #f0c040, #d49010)',
            border: `3px solid ${GOLD_DARK}`,
            borderRadius: 4,
            color: '#1a1000',
            padding: '8px 10px',
            cursor: 'pointer',
          }}
        >
          END TURN →
        </button>
      )}

      {/* Message */}
      {message && (
        <div style={{
          background: '#0e1520',
          border: `2px solid #2a3550`,
          borderRadius: 3,
          padding: '8px 10px',
          fontSize: 6,
          color: '#88a8c8',
          lineHeight: 1.8,
        }}>
          {message}
        </div>
      )}

      {/* Clues notebook */}
      <div style={{
        background: '#141c2e',
        border: `2px solid ${BORDER}`,
        borderRadius: 4,
        padding: '10px 12px',
        flex: 1,
      }}>
        <div style={{ fontSize: 7, color: GOLD, marginBottom: 10, letterSpacing: '0.05em' }}>
          📒 CLUES NOTEBOOK
        </div>

        <ClueSection
          title="SUSPECTS"
          items={[...SUSPECTS]}
          eliminated={eliminatedSuspects}
          color="#ff8070"
        />
        <ClueSection
          title="DEVICES"
          items={[...DEVICES]}
          eliminated={eliminatedDevices}
          color="#70d0ff"
        />
        <ClueSection
          title="ROOMS"
          items={Object.values(MYSTERY_ROOM_NAMES)}
          eliminated={eliminatedLocations.map(id => MYSTERY_ROOM_NAMES[id] ?? id)}
          color="#a0d870"
        />

        {/* Collected clue flavors */}
        {collectedClues.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 6, color: '#6888b0', marginBottom: 6 }}>EVIDENCE:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 120, overflowY: 'auto' }}>
              {collectedClues.map(clue => (
                <div key={clue.id} style={{
                  fontSize: 5,
                  color: '#7090b0',
                  lineHeight: 1.6,
                  background: '#0e1520',
                  borderRadius: 2,
                  padding: '4px 6px',
                  borderLeft: `2px solid ${
                    clue.type === 'suspect' ? '#ff8070' :
                    clue.type === 'device' ? '#70d0ff' : '#a0d870'
                  }`,
                }}>
                  {clue.flavorText}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player list */}
      <div style={{
        background: '#141c2e',
        border: `2px solid ${BORDER}`,
        borderRadius: 4,
        padding: '10px 12px',
      }}>
        <div style={{ fontSize: 6, color: '#6888b0', marginBottom: 8 }}>PLAYERS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {playerOrder.map((pi, oi) => {
            const p = players[pi]
            if (!p) return null
            const isCurrent = oi === currentTurnIdx && !p.eliminated
            const pos = p.position === 'start' ? 'Start' :
              rooms.find(r => r.id === p.position)?.name ?? p.position
            return (
              <div key={p.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                opacity: p.eliminated ? 0.4 : 1,
              }}>
                <div style={{
                  width: 8, height: 8,
                  borderRadius: 2,
                  background: p.color,
                  border: isCurrent ? `1px solid #fff` : 'none',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 6, color: p.eliminated ? '#445060' : '#b0c8e0', flex: 1 }}>
                  {p.name}
                  {p.eliminated ? ' [OUT]' : ''}
                </span>
                <span style={{ fontSize: 5, color: '#4a6080' }}>{pos}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Pixel Die ─────────────────────────────────────────────────────
function PixelDie({ value }: { value: number | null }) {
  const dots = value ? DIE_DOTS[value] ?? [] : []

  return (
    <div style={{
      width: 56,
      height: 56,
      background: '#f5f0e8',
      border: `3px solid #888`,
      borderRadius: 6,
      position: 'relative',
      boxShadow: '2px 2px 0 #444',
    }}>
      {value === null ? (
        <span style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          fontSize: 18,
          color: '#888',
        }}>?</span>
      ) : (
        dots.map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#1a1a1a',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))
      )}
    </div>
  )
}

// ── Clue Section ──────────────────────────────────────────────────
function ClueSection({
  title,
  items,
  eliminated,
  color,
}: {
  title:      string
  items:      string[]
  eliminated: string[]
  color:      string
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 5, color, marginBottom: 5, letterSpacing: '0.1em' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.map(item => {
          const out = eliminated.includes(item)
          return (
            <div key={item} style={{
              fontSize: 5,
              color: out ? '#3a4a5a' : '#9ab8d0',
              textDecoration: out ? 'line-through' : 'none',
              lineHeight: 1.6,
              paddingLeft: 8,
            }}>
              {out ? '✗ ' : '• '}{item}
            </div>
          )
        })}
      </div>
    </div>
  )
}
