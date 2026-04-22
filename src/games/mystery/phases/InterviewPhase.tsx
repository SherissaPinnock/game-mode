import { SUSPECTS } from '../data/suspects'

interface Props {
  suspectId: string
  onBack: () => void
}

/**
 * InterviewPhase — dialogue-tree conversation with a suspect.
 *
 * TODO:
 *  - Display suspect portrait + name
 *  - Show question options (multi-choice)
 *  - Reveal clues / unlock new questions based on evidence collected
 *  - Track which questions have been asked (game state)
 *  - Suspects can lie or deflect depending on guilt status
 */
export default function InterviewPhase({ suspectId, onBack }: Props) {
  const suspect = SUSPECTS.find(s => s.id === suspectId)
  if (!suspect) return null

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(4,2,0,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#e8d5b0', fontFamily: 'Georgia, serif',
    }}>
      <h2 style={{ fontSize: '1.6rem', color: '#c8960a', marginBottom: 8 }}>{suspect.name}</h2>
      <p style={{ color: '#7a6040', fontStyle: 'italic', marginBottom: 32 }}>
        Interview system coming soon…
      </p>
      <button
        onClick={onBack}
        style={{
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#94a3b8', borderRadius: 8, padding: '8px 20px',
          fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}
      >
        ← Back to Room
      </button>
    </div>
  )
}
