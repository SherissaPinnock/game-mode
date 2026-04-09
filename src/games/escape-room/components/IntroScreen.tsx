import { useState } from 'react'

const FONT  = '"Press Start 2P", monospace'
const BG    = '#2c3347'
const PANEL = '#1e2535'
const GOLD  = '#e8a820'
const GOLD_DARK = '#b87818'
const BORDER = '#2a3550'

const btnStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 10,
  background: 'linear-gradient(to bottom, #f0c040, #d49010)',
  border: `3px solid ${GOLD_DARK}`,
  borderRadius: 4,
  color: '#1a1000',
  padding: '10px 20px',
  cursor: 'pointer',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
}

interface Props {
  onStart: () => void
  onExit:  () => void
}

export default function IntroScreen({ onStart, onExit }: Props) {
  const [showInstructions, setShowInstructions] = useState(false)

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
      {/* Main panel */}
      <div style={{
        background: PANEL,
        border: `4px solid ${GOLD}`,
        borderRadius: 6,
        padding: '40px 48px',
        maxWidth: 640,
        width: '100%',
        boxShadow: `0 0 0 8px ${BG}, 0 0 0 12px ${BORDER}`,
        position: 'relative',
      }}>
        {/* Corner pixels */}
        {[
          { top: -2, left: -2 },
          { top: -2, right: -2 },
          { bottom: -2, left: -2 },
          { bottom: -2, right: -2 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 8, height: 8,
            background: GOLD_DARK,
            ...pos,
          }} />
        ))}

        <div style={{
          textAlign: 'center',
          fontSize: 9,
          letterSpacing: '0.3em',
          color: GOLD,
          marginBottom: 8,
          textTransform: 'uppercase',
        }}>
          ★ mansion mystery ★
        </div>

        <h1 style={{
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 18,
          color: '#ffffff',
          margin: '0 0 32px 0',
          letterSpacing: '0.05em',
          textShadow: `2px 2px 0 ${GOLD_DARK}`,
        }}>
          INTRODUCTION
        </h1>

        {/* Story box */}
        <div style={{
          background: '#141c2e',
          border: `2px solid ${BORDER}`,
          borderRadius: 4,
          padding: 20,
          marginBottom: 28,
        }}>
          <p style={{
            fontFamily: FONT,
            fontSize: 8,
            lineHeight: 2.2,
            color: '#b0c4d8',
            margin: '0 0 16px 0',
          }}>
            You&apos;re at a party in a huge mansion, but suddenly all the
            doors and windows are locked. It seems that one of the guests
            has hacked the mansion&apos;s security system to play a prank
            on the others.
          </p>

          <p style={{
            fontFamily: FONT,
            fontSize: 9,
            color: GOLD,
            textAlign: 'center',
            margin: '0 0 16px 0',
            padding: '10px 14px',
            background: '#1a2540',
            border: `2px solid ${GOLD_DARK}`,
            borderRadius: 3,
            lineHeight: 1.8,
          }}>
            Solve the mystery to escape!
          </p>

          <p style={{
            fontFamily: FONT,
            fontSize: 8,
            lineHeight: 2.2,
            color: '#b0c4d8',
            margin: 0,
          }}>
            Who did it? What device did they use? From which room? Explore
            the rooms of the mansion to collect clues that will help you
            find the solution.
          </p>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            style={btnStyle}
            onClick={() => setShowInstructions(true)}
          >
            INSTRUCTIONS
          </button>
          <button
            style={{ ...btnStyle }}
            onClick={onStart}
          >
            START
          </button>
        </div>

        {/* Back button */}
        <button
          onClick={onExit}
          style={{
            fontFamily: FONT,
            fontSize: 7,
            background: 'none',
            border: `2px solid #3a4560`,
            borderRadius: 3,
            color: '#6070a0',
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'block',
            margin: '20px auto 0',
          }}
        >
          ← EXIT
        </button>
      </div>

      {/* Instructions modal */}
      {showInstructions && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20,
        }}>
          <div style={{
            background: PANEL,
            border: `4px solid ${GOLD}`,
            borderRadius: 6,
            padding: '32px 40px',
            maxWidth: 600,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h2 style={{
              fontFamily: FONT,
              fontSize: 14,
              color: GOLD,
              margin: '0 0 24px 0',
              textAlign: 'center',
            }}>
              HOW TO PLAY
            </h2>

            {[
              { icon: '🎲', title: 'SETUP', text: 'Each player rolls a die — highest roll goes first, then clockwise order.' },
              { icon: '🚶', title: 'MOVEMENT', text: 'On your turn, roll 1d6. Move to any room reachable within that many steps.' },
              { icon: '❓', title: 'CLUES', text: 'In each room, answer an AWS trivia question to collect a clue. Clues are public — everyone sees them!' },
              { icon: '📖', title: 'CLUE TYPES', text: 'Suspect clues (Study, Library, Gallery), Device clues (Hall, Billiard Room, Ballroom), Location clues (Living Room, Dining Room, Kitchen).' },
              { icon: '🔍', title: 'SOLVE', text: 'Click the golden magnifying glass at the center when ready. Guess the suspect + device + room. Wrong = eliminated!' },
              { icon: '🏆', title: 'WIN', text: 'First player to correctly identify the suspect, device, and room wins and escapes!' },
              { icon: '🚪', title: 'SECRET PASSAGES', text: 'Some rooms have secret passages for instant teleport. Study → Kitchen, Library → Dining Room.' },
            ].map(item => (
              <div key={item.title} style={{ marginBottom: 18 }}>
                <div style={{
                  fontFamily: FONT,
                  fontSize: 8,
                  color: GOLD,
                  marginBottom: 6,
                }}>
                  {item.icon} {item.title}
                </div>
                <p style={{
                  fontFamily: FONT,
                  fontSize: 7,
                  color: '#9aafcc',
                  lineHeight: 2,
                  margin: 0,
                  paddingLeft: 16,
                }}>
                  {item.text}
                </p>
              </div>
            ))}

            <button
              style={{ ...btnStyle, display: 'block', margin: '24px auto 0', fontSize: 9 }}
              onClick={() => setShowInstructions(false)}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
