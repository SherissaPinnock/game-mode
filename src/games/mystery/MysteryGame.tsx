import { useState, useEffect } from 'react'
import { SUSPECTS }              from './data/suspects'
import { FRAME_COUNT }           from './data/constants'
import { CLUES }                 from './data/clues'
import { INITIAL_GAME_STATE, applyClue } from './data/gameState'
import type { GameState }        from './data/gameState'

const DEV = import.meta.env.DEV

const DEV_ALL_UNLOCKED: GameState = {
  unlockedRooms:  ['kitchen', 'library', 'bedroom', 'living', 'study'],
  collectedClues: Object.values(CLUES),
  suspectStage:   {},
}
import { makeChar }              from './engine/characters'
import { useGameLoop }           from './hooks/useGameLoop'
import MansionBoard              from './components/MansionBoard'
import CluesPanel                from './components/CluesPanel'
import NarratorPhase             from './phases/NarratorPhase'
import ExplorePhase              from './phases/ExplorePhase'
import RoomPhase                 from './phases/RoomPhase'
import InterviewPhase            from './phases/InterviewPhase'
import EpiloguePhase             from './phases/EpiloguePhase'
import type { Char }             from './engine/characters'
import type { SpriteDim }        from './components/MansionBoard'
import './MysteryGame.css'

interface Props { onExit: () => void }

type Phase = 'narrator' | 'explore' | 'room' | 'interview' | 'epilogue'

export default function MysteryGame({ onExit }: Props) {
  const [phase,         setPhase]         = useState<Phase>('narrator')
  const [activeRoom,    setActiveRoom]    = useState<string | null>(null)
  const [activeSuspect, setActiveSuspect] = useState<string | null>(null)
  const [gameState,     setGameState]     = useState<GameState>(INITIAL_GAME_STATE)
  const [newClueId,     setNewClueId]     = useState<string | null>(null)

  const [chars, setChars] = useState<Char[]>(() => SUSPECTS.map(makeChar))
  const [dims,  setDims]  = useState<Record<string, SpriteDim>>({})

  // Measure sprite sheet frame widths once
  useEffect(() => {
    SUSPECTS.forEach(({ src }) => {
      const img = new Image()
      img.onload = () => setDims(prev => ({
        ...prev,
        [src]: { fw: img.naturalWidth / FRAME_COUNT, h: img.naturalHeight },
      }))
      img.src = src
    })
  }, [])

  // Character movement — always running so suspects walk during intro too
  useGameLoop(setChars)

  function enterRoom(roomId: string) {
    if (!gameState.unlockedRooms.includes(roomId)) return
    setActiveRoom(roomId)
    setPhase('room')
  }

  function startInterview(suspectId: string) {
    setActiveSuspect(suspectId)
    setPhase('interview')
  }

  function handleClueCollected(clueId: string) {
    const clue = CLUES[clueId]
    if (!clue) return
    setGameState(prev => applyClue(prev, clue))
    setNewClueId(clueId)
    // Clear new-clue highlight after animation window
    setTimeout(() => setNewClueId(null), 3000)
  }

  return (
    <div className="mys-root">
      {/* Topbar — explore phase only */}
      {phase === 'explore' && (
        <ExplorePhase
          onRoomClick={enterRoom}
          onExit={onExit}
        />
      )}

      {/* Mansion board + walking suspects — always visible */}
      <MansionBoard
        chars={chars}
        dims={dims}
        interactive={phase === 'explore'}
        onRoomClick={enterRoom}
        unlockedRooms={gameState.unlockedRooms}
      />

      {/* Collapsible evidence panel — visible during exploration */}
      {(phase === 'explore') && (
        <CluesPanel
          clues={gameState.collectedClues}
          newClueId={newClueId}
        />
      )}

      {/* Phase overlays */}
      {phase === 'narrator' && (
        <NarratorPhase
          onComplete={() => setPhase('explore')}
          onExit={onExit}
        />
      )}

      {phase === 'room' && activeRoom && (
        <RoomPhase
          roomId={activeRoom}
          chars={chars}
          onInterview={startInterview}
          onClueCollected={handleClueCollected}
          onSolve={() => setPhase('epilogue')}
          onBack={() => setPhase('explore')}
        />
      )}

      {phase === 'epilogue' && (
        <EpiloguePhase onExit={onExit} />
      )}

      {phase === 'interview' && activeSuspect && (
        <InterviewPhase
          suspectId={activeSuspect}
          onBack={() => setPhase('room')}
        />
      )}

      <div className="mys-rotate-prompt" aria-live="polite">
        <div className="mys-rotate-card">
          <p className="mys-rotate-kicker">Mobile Tip</p>
          <p className="mys-rotate-text">
            Rotate your phone horizontally for the best Blackwood Manor view.
          </p>
        </div>
      </div>

      {DEV && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 999,
          display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end',
        }}>
          <span style={{ fontSize: '0.6rem', color: '#ff6b6b', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            DEV
          </span>
          {(['narrator','explore','epilogue'] as const).map(p => (
            <button key={p} onClick={() => setPhase(p)} style={devBtnStyle}>
              → {p}
            </button>
          ))}
          {(['kitchen','library','bedroom','study'] as const).map(room => (
            <button key={room} onClick={() => {
              setGameState(DEV_ALL_UNLOCKED)
              setActiveRoom(room)
              setPhase('room')
            }} style={devBtnStyle}>
              → {room}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const devBtnStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.75)',
  border: '1px solid rgba(255,107,107,0.4)',
  color: '#ff6b6b',
  borderRadius: 4,
  padding: '3px 8px',
  fontSize: '0.7rem',
  fontFamily: 'monospace',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
