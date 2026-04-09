import { useState } from 'react'
import { MYSTERY_ROOM_NAMES } from '../data/mystery'

const FONT  = '"Press Start 2P", monospace'
const PANEL = '#1e2535'
const GOLD  = '#e8a820'
const GOLD_DARK = '#b87818'
const BORDER = '#2a3550'

interface Props {
  suspects:            readonly string[]
  devices:             readonly string[]
  mysteryRoomIds:      readonly string[]
  eliminatedSuspects:  string[]
  eliminatedDevices:   string[]
  eliminatedLocations: string[]
  onConfirm:           (suspect: string, device: string, roomId: string) => void
  onCancel:            () => void
}

export default function SolveModal({
  suspects,
  devices,
  mysteryRoomIds,
  eliminatedSuspects,
  eliminatedDevices,
  eliminatedLocations,
  onConfirm,
  onCancel,
}: Props) {
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null)
  const [selectedDevice,  setSelectedDevice]  = useState<string | null>(null)
  const [selectedRoom,    setSelectedRoom]    = useState<string | null>(null)

  const canConfirm = selectedSuspect !== null && selectedDevice !== null && selectedRoom !== null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
      padding: 20,
      fontFamily: FONT,
    }}>
      <div style={{
        background: PANEL,
        border: `4px solid ${GOLD}`,
        borderRadius: 6,
        padding: '28px 32px',
        maxWidth: 640,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: `0 0 32px rgba(232,168,32,0.4), 0 0 0 8px #141c2e`,
      }}>
        {/* Header */}
        <h2 style={{
          fontFamily: FONT,
          fontSize: 12,
          color: GOLD,
          textAlign: 'center',
          margin: '0 0 6px 0',
          textShadow: `2px 2px 0 ${GOLD_DARK}`,
        }}>
          🔍 SOLVE THE MYSTERY
        </h2>

        {/* Warning */}
        <div style={{
          background: '#301414',
          border: `2px solid #a03030`,
          borderRadius: 3,
          padding: '8px 12px',
          fontFamily: FONT,
          fontSize: 7,
          color: '#f06060',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          ⚠ WRONG ANSWER = ELIMINATED!
        </div>

        {/* Suspects */}
        <SolveSection
          title="THE SUSPECT"
          icon="🕵️"
          items={[...suspects]}
          eliminated={eliminatedSuspects}
          selected={selectedSuspect}
          onSelect={setSelectedSuspect}
          color="#ff8070"
        />

        {/* Devices */}
        <SolveSection
          title="THE DEVICE"
          icon="💻"
          items={[...devices]}
          eliminated={eliminatedDevices}
          selected={selectedDevice}
          onSelect={setSelectedDevice}
          color="#70d0ff"
        />

        {/* Rooms */}
        <SolveSection
          title="THE ROOM"
          icon="🏠"
          items={mysteryRoomIds.map(id => ({ id, name: MYSTERY_ROOM_NAMES[id] ?? id }))}
          eliminated={eliminatedLocations}
          selected={selectedRoom}
          onSelect={setSelectedRoom}
          color="#a0d870"
          isRooms
        />

        {/* Confirmation */}
        {canConfirm && (
          <div style={{
            background: '#141c2e',
            border: `2px solid ${BORDER}`,
            borderRadius: 4,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 7,
            color: '#88a8c8',
            lineHeight: 2,
          }}>
            <strong style={{ color: GOLD }}>Your accusation:</strong><br />
            🕵️ {selectedSuspect}<br />
            💻 {selectedDevice}<br />
            🏠 {MYSTERY_ROOM_NAMES[selectedRoom!] ?? selectedRoom}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
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
            CANCEL
          </button>
          <button
            onClick={() => canConfirm && onConfirm(selectedSuspect!, selectedDevice!, selectedRoom!)}
            disabled={!canConfirm}
            style={{
              fontFamily: FONT,
              fontSize: 9,
              background: canConfirm
                ? 'linear-gradient(to bottom, #f0c040, #d49010)'
                : '#2a3550',
              border: `3px solid ${canConfirm ? GOLD_DARK : '#3a4560'}`,
              borderRadius: 4,
              color: canConfirm ? '#1a1000' : '#4a5a70',
              padding: '10px 20px',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
            }}
          >
            CONFIRM ACCUSATION
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Solve Section ────────────────────────────────────────────────
interface SolveSectionProps {
  title:      string
  icon:       string
  items:      string[] | Array<{ id: string; name: string }>
  eliminated: string[]
  selected:   string | null
  onSelect:   (val: string) => void
  color:      string
  isRooms?:   boolean
}

function SolveSection({
  title,
  icon,
  items,
  eliminated,
  selected,
  onSelect,
  color,
  isRooms = false,
}: SolveSectionProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: FONT,
        fontSize: 8,
        color,
        marginBottom: 10,
      }}>
        {icon} {title}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
      }}>
        {items.map(item => {
          const id   = isRooms ? (item as { id: string; name: string }).id   : item as string
          const name = isRooms ? (item as { id: string; name: string }).name : item as string
          // For rooms, check if this room's display name is in eliminatedLocations
          const isElim = isRooms
            ? eliminated.includes(id)
            : eliminated.includes(name)
          const isSelected = selected === id

          return (
            <button
              key={id}
              onClick={() => !isElim && onSelect(id)}
              disabled={isElim}
              style={{
                fontFamily: FONT,
                fontSize: 7,
                padding: '8px 10px',
                borderRadius: 4,
                border: isSelected
                  ? `3px solid ${color}`
                  : isElim
                    ? `2px solid #2a3040`
                    : `2px solid #3a4a60`,
                background: isSelected
                  ? `${color}22`
                  : isElim
                    ? '#141c2e'
                    : '#1a2540',
                color: isElim ? '#2a3a4a' : isSelected ? color : '#7090b0',
                cursor: isElim ? 'not-allowed' : 'pointer',
                textDecoration: isElim ? 'line-through' : 'none',
                textAlign: 'left',
                lineHeight: 1.5,
              }}
            >
              {isSelected && !isElim && <span style={{ color }}>▶ </span>}
              {isElim && '✗ '}
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
