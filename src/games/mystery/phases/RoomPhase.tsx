import KitchenRoom  from '../rooms/KitchenRoom'
import LibraryRoom   from '../rooms/LibraryRoom'
import BedroomRoom   from '../rooms/BedroomRoom'
import StudyRoom     from '../rooms/StudyRoom'
import type { Char } from '../engine/characters'

interface Props {
  roomId: string
  chars: Char[]
  onInterview: (suspectId: string) => void
  onClueCollected: (clueId: string) => void
  onSolve?: () => void
  onBack: () => void
}

export default function RoomPhase({ roomId, chars: _chars, onInterview: _onInterview, onClueCollected, onSolve, onBack }: Props) {
  if (roomId === 'kitchen') {
    return <KitchenRoom onClueCollected={onClueCollected} onBack={onBack} />
  }

  if (roomId === 'library') {
    return <LibraryRoom onClueCollected={onClueCollected} onBack={onBack} />
  }

  if (roomId === 'bedroom') {
    return <BedroomRoom onClueCollected={onClueCollected} onBack={onBack} />
  }

  if (roomId === 'study' && onSolve) {
    return <StudyRoom onSolve={onSolve} onBack={onBack} />
  }

  // Stub for rooms not yet built
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(4,2,0,0.92)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#e8d5b0', fontFamily: 'Georgia, serif',
    }}>
      <p style={{ fontSize: '3rem', marginBottom: 8 }}>🔍</p>
      <h2 style={{ fontSize: '1.6rem', color: '#c8960a', marginBottom: 24, textTransform: 'capitalize' }}>
        {roomId.replace('-', ' ')}
      </h2>
      <p style={{ color: '#7a6040', fontStyle: 'italic', marginBottom: 32 }}>
        Investigation coming soon…
      </p>
      <button
        onClick={onBack}
        style={{
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#94a3b8', borderRadius: 8, padding: '8px 20px',
          fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}
      >
        ← Back to Manor
      </button>
    </div>
  )
}
