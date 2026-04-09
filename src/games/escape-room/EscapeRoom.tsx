import { useState } from 'react'
import { useEscapeRoom } from './hooks/useEscapeRoom'
import { ROOMS } from './data/rooms'
import IntroScreen      from './components/IntroScreen'
import PlayerSetup      from './components/PlayerSetup'
import InitialRollScreen from './components/InitialRollScreen'
import GameBoard        from './components/GameBoard'
import SidePanel        from './components/SidePanel'
import QuestionModal    from './components/QuestionModal'
import SolveModal       from './components/SolveModal'

const FONT      = '"Press Start 2P", monospace'
const BG        = '#2c3347'
const PANEL     = '#1e2535'
const GOLD      = '#e8a820'
const GOLD_DARK = '#b87818'

interface Props {
  onExit: () => void
}

export default function EscapeRoom({ onExit }: Props) {
  const [showSolveModal, setShowSolveModal] = useState(false)

  const game = useEscapeRoom()

  const allRolled = game.players.length > 0 && game.players.every(p => p.initialRoll !== null)
  const currentRoom = ROOMS.find(r => r.id === game.currentRoomId) ?? null

  // ── Intro ────────────────────────────────────────────────────────────
  if (game.phase === 'intro') {
    return (
      <IntroScreen
        onStart={game.goToSetup}
        onExit={onExit}
      />
    )
  }

  // ── Player Setup ─────────────────────────────────────────────────────
  if (game.phase === 'setup') {
    return (
      <PlayerSetup
        onConfirm={game.setupPlayers}
        onBack={game.goToIntro}
      />
    )
  }

  // ── Initial Roll ─────────────────────────────────────────────────────
  if (game.phase === 'initial-roll') {
    return (
      <InitialRollScreen
        players={game.players}
        onRoll={game.recordInitialRoll}
        onBegin={game.startGame}
        allRolled={allRolled}
      />
    )
  }

  // ── Game Over ────────────────────────────────────────────────────────
  if (game.phase === 'game-over') {
    return (
      <div style={{
        minHeight: '100vh',
        background: BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
        padding: 24,
      }}>
        <div style={{
          background: PANEL,
          border: `4px solid ${GOLD}`,
          borderRadius: 6,
          padding: '40px 48px',
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          boxShadow: `0 0 0 8px ${BG}, 0 0 0 12px #2a3550`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {game.winner ? '🏆' : '💀'}
          </div>
          <h2 style={{
            fontFamily: FONT,
            fontSize: 14,
            color: game.winner ? GOLD : '#e05050',
            margin: '0 0 16px 0',
            textShadow: `2px 2px 0 ${game.winner ? GOLD_DARK : '#803030'}`,
          }}>
            {game.winner ? 'MYSTERY SOLVED!' : 'NOBODY ESCAPED'}
          </h2>
          <p style={{
            fontFamily: FONT,
            fontSize: 8,
            color: '#88a8c8',
            lineHeight: 2,
            margin: '0 0 28px 0',
          }}>
            {game.message}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={onExit}
              style={{
                fontFamily: FONT,
                fontSize: 8,
                background: 'none',
                border: `2px solid #3a4560`,
                borderRadius: 4,
                color: '#6070a0',
                padding: '10px 18px',
                cursor: 'pointer',
              }}
            >
              ← MENU
            </button>
            <button
              onClick={game.resetGame}
              style={{
                fontFamily: FONT,
                fontSize: 8,
                background: `linear-gradient(to bottom, #f0c040, #d49010)`,
                border: `3px solid ${GOLD_DARK}`,
                borderRadius: 4,
                color: '#1a1000',
                padding: '10px 18px',
                cursor: 'pointer',
              }}
            >
              PLAY AGAIN ↺
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing ──────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: FONT,
    }}>
      {/* Top bar */}
      <div style={{
        background: '#1a2030',
        borderBottom: `3px solid #2a3550`,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button
          onClick={onExit}
          style={{
            fontFamily: FONT,
            fontSize: 7,
            background: 'none',
            border: `2px solid #3a4560`,
            borderRadius: 3,
            color: '#6070a0',
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          ← EXIT
        </button>
        <div style={{
          fontFamily: FONT,
          fontSize: 10,
          color: GOLD,
          letterSpacing: '0.05em',
          textShadow: `1px 1px 0 ${GOLD_DARK}`,
        }}>
          AWS ESCAPE ROOM
        </div>
        <div style={{ width: 70 }} />
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 12,
        padding: 12,
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Board */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <GameBoard
            rooms={ROOMS}
            players={game.players}
            reachableRooms={game.reachableRooms}
            currentRoomId={game.currentRoomId}
            turnPhase={game.turnPhase}
            roomsCleared={game.roomsCleared}
            onRoomClick={game.enterRoom}
            onSolveClick={() => setShowSolveModal(true)}
          />
        </div>

        {/* Side panel */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <SidePanel
            players={game.players}
            playerOrder={game.playerOrder}
            currentTurnIdx={game.currentTurnIdx}
            turnPhase={game.turnPhase}
            diceRoll={game.diceRoll}
            currentRoomId={game.currentRoomId}
            rooms={ROOMS}
            collectedClues={game.collectedClues}
            eliminatedSuspects={game.eliminatedSuspects}
            eliminatedDevices={game.eliminatedDevices}
            eliminatedLocations={game.eliminatedLocations}
            message={game.message}
            onRollDie={game.rollDie}
            onSecretPassage={game.useSecretPassage}
            onSkipRoom={game.skipRoom}
            onEndTurn={game.endTurn}
            onStartQuestion={game.startQuestion}
          />
        </div>
      </div>

      {/* Question modal */}
      {game.activeQuestion && currentRoom && (
        <QuestionModal
          room={currentRoom}
          question={game.activeQuestion}
          onAnswer={game.answerQuestion}
        />
      )}

      {/* Solve modal */}
      {showSolveModal && (
        <SolveModal
          suspects={game.SUSPECTS}
          devices={game.DEVICES}
          mysteryRoomIds={game.MYSTERY_ROOM_IDS}
          eliminatedSuspects={game.eliminatedSuspects}
          eliminatedDevices={game.eliminatedDevices}
          eliminatedLocations={game.eliminatedLocations}
          onConfirm={(suspect, device, roomId) => {
            setShowSolveModal(false)
            game.attemptSolve(suspect, device, roomId)
          }}
          onCancel={() => setShowSolveModal(false)}
        />
      )}
    </div>
  )
}
