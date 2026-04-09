import type { RoomDef, Player } from '../types'

const FONT   = '"Press Start 2P", monospace'
const BORDER = '#2a3550'

interface Props {
  rooms:            RoomDef[]
  players:          Player[]
  reachableRooms:   string[]
  currentRoomId:    string | null
  turnPhase:        string
  roomsCleared:     string[]
  onRoomClick:      (roomId: string) => void
  onSolveClick:     () => void
}

// Build a map from "col,row" to room
function buildGrid(rooms: RoomDef[]): Map<string, RoomDef> {
  const m = new Map<string, RoomDef>()
  rooms.forEach(r => m.set(`${r.col},${r.row}`, r))
  return m
}

const SOLVE_COL = 2
const SOLVE_ROW = 2

export default function GameBoard({
  rooms,
  players,
  reachableRooms,
  currentRoomId,
  turnPhase,
  roomsCleared,
  onRoomClick,
  onSolveClick,
}: Props) {
  const grid = buildGrid(rooms)

  const cells: React.ReactNode[] = []

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const key = `${col},${row}`

      // Solve center
      if (col === SOLVE_COL && row === SOLVE_ROW) {
        cells.push(
          <SolveCell key={key} onClick={onSolveClick} />
        )
        continue
      }

      const room = grid.get(key)
      if (room) {
        const isReachable = reachableRooms.includes(room.id)
        const isCurrentRoom = room.id === currentRoomId
        const isCleared = roomsCleared.includes(room.id)
        const playersHere = players.filter(p => p.position === room.id)

        cells.push(
          <RoomCell
            key={key}
            room={room}
            isReachable={isReachable}
            isCurrentRoom={isCurrentRoom}
            isCleared={isCleared}
            players={playersHere}
            canClick={isReachable && turnPhase === 'choose-room'}
            onClick={() => isReachable && turnPhase === 'choose-room' && onRoomClick(room.id)}
          />
        )
      } else {
        // Check if start cell (top-left area — we'll use (1,1) grid start corner)
        // 'start' players go at (1,0) which is a corridor
        const startPlayers = (col === 1 && row === 1)
          ? players.filter(p => p.position === 'start')
          : []

        cells.push(
          <CorridorCell key={key} players={startPlayers} />
        )
      }
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gridTemplateRows: 'repeat(5, 1fr)',
      gap: 3,
      background: '#111820',
      border: `3px solid ${BORDER}`,
      borderRadius: 4,
      padding: 3,
      width: '100%',
      aspectRatio: '1',
    }}>
      {cells}
    </div>
  )
}

// ── Room Cell ─────────────────────────────────────────────────────
interface RoomCellProps {
  room:          RoomDef
  isReachable:   boolean
  isCurrentRoom: boolean
  isCleared:     boolean
  players:       Player[]
  canClick:      boolean
  onClick:       () => void
}

function RoomCell({ room, isReachable, isCurrentRoom, isCleared, players, canClick, onClick }: RoomCellProps) {
  const borderColor = isCurrentRoom
    ? '#ffffff'
    : isReachable
      ? '#f0c040'
      : room.darkColor

  return (
    <div
      onClick={onClick}
      style={{
        background: room.color,
        border: `2px solid ${borderColor}`,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: canClick ? 'pointer' : 'default',
        position: 'relative',
        padding: 4,
        boxShadow: isReachable ? `0 0 8px ${room.color}88` : undefined,
        transition: 'box-shadow 0.2s',
        minHeight: 0,
      }}
    >
      {/* Cleared badge */}
      {isCleared && (
        <div style={{
          position: 'absolute',
          top: 3,
          right: 3,
          fontSize: 8,
          background: '#30c870',
          borderRadius: 2,
          padding: '1px 3px',
          fontFamily: FONT,
          color: '#fff',
          lineHeight: 1,
        }}>
          ✓
        </div>
      )}

      {/* Reachable indicator */}
      {isReachable && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(240,192,64,0.15)',
          borderRadius: 2,
          pointerEvents: 'none',
        }} />
      )}

      {/* Room name */}
      <span style={{
        fontFamily: FONT,
        fontSize: 5,
        color: isCurrentRoom ? '#fff' : 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 1.3,
        textShadow: '1px 1px 0 rgba(0,0,0,0.6)',
        maxWidth: '90%',
        wordBreak: 'break-word',
      }}>
        {room.name}
      </span>

      {/* Player tokens */}
      {players.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 3,
        }}>
          {players.map(p => (
            <div
              key={p.id}
              title={p.name}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: p.color,
                border: '1px solid rgba(255,255,255,0.6)',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Corridor Cell ─────────────────────────────────────────────────
function CorridorCell({ players }: { players: Player[] }) {
  return (
    <div style={{
      background: '#1a2030',
      border: `1px solid #242f42`,
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.03) 3px,rgba(255,255,255,0.03) 4px),repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(255,255,255,0.03) 3px,rgba(255,255,255,0.03) 4px)',
    }}>
      {players.length > 0 && (
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {players.map(p => (
            <div
              key={p.id}
              title={p.name}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: p.color,
                border: '1px solid rgba(255,255,255,0.6)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Solve Center Cell ─────────────────────────────────────────────
function SolveCell({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #c87800, #e8a820, #c87800)',
        border: `2px solid #f0c840`,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        gap: 2,
        boxShadow: '0 0 12px rgba(232,168,32,0.6)',
      }}
    >
      <span style={{ fontSize: 18 }}>🔍</span>
      <span style={{
        fontFamily: FONT,
        fontSize: 5,
        color: '#1a1000',
        textShadow: '0 1px 0 rgba(255,200,0,0.5)',
        letterSpacing: '0.05em',
      }}>
        SOLVE
      </span>
    </div>
  )
}
