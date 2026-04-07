import { useRef, useState } from 'react'
import { playCorrect, playWrong, playPop } from '@/lib/sounds'

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Technology {
  name: string
  category: string
  clues: [string, string, string, string, string]
}

const TECHNOLOGIES: Technology[] = [
  {
    name: 'Docker',
    category: 'DevOps',
    clues: [
      'Released in 2013 by a company originally called dotCloud.',
      'Uses OS-level virtualisation so processes share the host kernel.',
      'Its logo features a whale balancing a stack of shipping containers.',
      'Packages an app and all its dependencies into a portable, isolated unit.',
      'The most popular containerisation platform in the world.',
    ],
  },
  {
    name: 'Kubernetes',
    category: 'DevOps',
    clues: [
      'Originally developed at Google and open-sourced in 2014.',
      'Its name is Greek for "helmsman" — often abbreviated to K8s.',
      'Groups related containers into logical units called Pods.',
      'Automates rollouts, rollbacks, scaling, and self-healing of services.',
      'The industry-standard container orchestration system.',
    ],
  },
  {
    name: 'React',
    category: 'Frontend',
    clues: [
      'Created by an engineer at one of the world\'s largest social networks.',
      'First unveiled at a developer conference in May 2013.',
      'Introduced a virtual DOM to minimise expensive real-DOM updates.',
      'Built around declarative, composable UI components.',
      'The most widely used JavaScript library for building user interfaces.',
    ],
  },
  {
    name: 'Git',
    category: 'Version Control',
    clues: [
      'Created in 2005 by the same person who wrote the Linux kernel.',
      'Designed to be fast, distributed, and handle very large projects.',
      'Every clone contains the repository\'s complete history.',
      'Tracks changes using a directed acyclic graph of content snapshots.',
      'The world\'s most widely used source control system.',
    ],
  },
  {
    name: 'TypeScript',
    category: 'Language',
    clues: [
      'Developed and maintained by Microsoft; first publicly released in 2012.',
      'Compiles down to plain JavaScript compatible with any runtime.',
      'Adds an optional, gradually-adoptable static type system.',
      'Catches whole categories of bugs at compile time before code ships.',
      'A strictly-typed superset of JavaScript.',
    ],
  },
  {
    name: 'Redis',
    category: 'Database',
    clues: [
      'Created in 2009 by an Italian developer while building a real-time analytics tool.',
      'Stores all data in RAM, delivering sub-millisecond read and write speeds.',
      'Supports rich data structures: strings, hashes, lists, sets, and sorted sets.',
      'Used widely for caching, session storage, pub/sub messaging, and rate limiting.',
      'The most popular in-memory key-value data store.',
    ],
  },
  {
    name: 'GraphQL',
    category: 'API',
    clues: [
      'Developed internally at Facebook starting around 2012 to power their mobile app.',
      'Open-sourced in 2015, alongside a reference JavaScript implementation.',
      'Lets clients request exactly the fields they need — nothing more, nothing less.',
      'Replaces multiple REST endpoints with one strongly-typed, self-documenting endpoint.',
      'A query language and runtime for APIs, created by Meta.',
    ],
  },
  {
    name: 'PostgreSQL',
    category: 'Database',
    clues: [
      'Its lineage traces back to a UC Berkeley research project from the 1980s.',
      'The name references its predecessor: the "Ingres" database system.',
      'Renowned for strict ACID compliance, extensibility, and SQL standards conformance.',
      'Supports relational tables and native JSON/JSONB document storage side by side.',
      'The world\'s most advanced open-source relational database.',
    ],
  },
  {
    name: 'Nginx',
    category: 'Infrastructure',
    clues: [
      'Created by a Russian developer in 2004 and released as open source.',
      'Originally built to tackle the "C10k problem" — 10,000+ concurrent connections.',
      'Employs an asynchronous, non-blocking, event-driven architecture.',
      'Deployed widely as a reverse proxy, load balancer, and HTTP cache.',
      'One of the most popular high-performance web servers in production today.',
    ],
  },
  {
    name: 'AWS Lambda',
    category: 'Cloud',
    clues: [
      'Launched by Amazon in late 2014 as part of its cloud services platform.',
      'You provide the code; the platform handles all provisioning and scaling automatically.',
      'Billed by the millisecond — you pay only when your code is actually executing.',
      'Triggered by events: HTTP requests, queue messages, file uploads, scheduled jobs, and more.',
      'Amazon\'s serverless compute service that runs functions on demand.',
    ],
  },
  {
    name: 'Terraform',
    category: 'DevOps',
    clues: [
      'Created by HashiCorp and first released in 2014.',
      'Infrastructure is defined in a declarative configuration language called HCL.',
      'Uses a "plan then apply" workflow to preview changes before making them.',
      'Manages cloud resources across AWS, Azure, GCP, and hundreds of other providers.',
      'The most popular infrastructure-as-code tool for provisioning cloud resources.',
    ],
  },
  {
    name: 'WebSockets',
    category: 'Networking',
    clues: [
      'Standardised in RFC 6455 in 2011 as part of the HTML5 ecosystem.',
      'Begins life as an HTTP request before "upgrading" to a persistent connection.',
      'Unlike HTTP, the connection stays open so either side can send data any time.',
      'Enables real-time features: live chat, collaborative editing, and live dashboards.',
      'A protocol that provides full-duplex communication over a single TCP connection.',
    ],
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUNDS_PER_GAME = 5
const POINTS_PER_CLUE = [5, 4, 3, 2, 1] // points for correct answer on clue 1–5

// Vibrant panel palette — shown whether revealed or not
const PANEL_COLORS  = ['#F0A898', '#45B49E', '#F2C355', '#A5CDCA', '#E57B6F']
const PANEL_LOCKED  = ['#F7CFC9', '#A3D9D1', '#F8E4A8', '#CEEBEA', '#F2B8B3'] // light tint for locked
const PANEL_BORDER  = ['#C87060', '#2D8A7E', '#C99A20', '#6AADAA', '#C05545']
const PANEL_TEXT    = ['#3a1510', '#0c2e28', '#2a1d00', '#082828', '#2a0c08']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CluePanel({
  index, clue, revealed, active,
}: {
  index: number
  clue: string
  revealed: boolean
  active: boolean
}) {
  const bg     = revealed ? PANEL_COLORS[index] : PANEL_LOCKED[index]
  const border = PANEL_BORDER[index]
  const text   = PANEL_TEXT[index]

  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 130,
      background: bg,
      borderBottom: `6px solid ${border}`,
      padding: '20px 16px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'background 0.35s',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 380,
    }}>
      {/* Header */}
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: text,
        opacity: revealed ? 1 : 0.55,
      }}>
        Clue {index + 1}
      </div>
      <div style={{ height: 2, background: border, opacity: revealed ? 0.5 : 0.25 }} />

      {/* Body */}
      {revealed ? (
        <p style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: text,
          lineHeight: 1.65,
        }}>
          {clue}
        </p>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          color: border,
          opacity: 0.35,
          fontWeight: 900,
          userSelect: 'none',
        }}>
          ?
        </div>
      )}

      {/* "NEW" pill on the latest revealed clue */}
      {active && revealed && (
        <div style={{
          position: 'absolute',
          top: 14,
          right: 12,
          background: border,
          color: '#fff',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.08em',
          padding: '3px 8px',
          borderRadius: 20,
        }}>
          NEW
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ClueGameProps { onExit: () => void }

export default function ClueGame({ onExit }: ClueGameProps) {
  const [gameKey,   setGameKey]   = useState(0) // bump to restart
  const [deck]                    = useState(() => shuffle(TECHNOLOGIES).slice(0, ROUNDS_PER_GAME))
  const [round,     setRound]     = useState(0)
  const [revealed,  setRevealed]  = useState(1)     // how many clues visible (1–5)
  const [guess,     setGuess]     = useState('')
  const [feedback,  setFeedback]  = useState<{ ok: boolean; msg: string } | null>(null)
  const [roundOver, setRoundOver] = useState(false)  // correct or gave-up
  const [scores,    setScores]    = useState<number[]>([])
  const [gameOver,  setGameOver]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tech = deck[round]
  const totalScore = scores.reduce((a, b) => a + b, 0)
  const maxPossible = ROUNDS_PER_GAME * 5

  function showFeedback(ok: boolean, msg: string, persist = false) {
    if (fbTimerRef.current) clearTimeout(fbTimerRef.current)
    setFeedback({ ok, msg })
    if (!persist) {
      fbTimerRef.current = setTimeout(() => setFeedback(null), 2200)
    }
  }

  function handleRevealNext() {
    if (revealed >= 5 || roundOver) return
    playPop()
    setRevealed(r => r + 1)
    setFeedback(null)
  }

  function handleGuess() {
    if (!guess.trim() || roundOver) return
    const normalised = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    const correct = normalised(guess) === normalised(tech.name)

    if (correct) {
      playCorrect()
      const pts = POINTS_PER_CLUE[revealed - 1]
      setScores(s => [...s, pts])
      showFeedback(true, `Correct! +${pts} point${pts !== 1 ? 's' : ''}`, true)
      setRoundOver(true)
    } else {
      playWrong()
      showFeedback(false, 'Not quite — try again or reveal the next clue.')
    }
    setGuess('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleGiveUp() {
    playWrong()
    setScores(s => [...s, 0])
    showFeedback(false, `It was ${tech.name}. Better luck next round!`, true)
    setRoundOver(true)
  }

  function handleNextRound() {
    if (round + 1 >= ROUNDS_PER_GAME) {
      setGameOver(true)
    } else {
      setRound(r => r + 1)
      setRevealed(1)
      setGuess('')
      setFeedback(null)
      setRoundOver(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleRestart() {
    setGameKey(k => k + 1)
  }

  // ── Game over screen ────────────────────────────────────────────────────────
  if (gameOver) {
    const pct = Math.round((totalScore / maxPossible) * 100)
    const grade =
      pct >= 90 ? { label: '🏆 Legendary!', bg: '#FFF3CD', border: '#F0C040', text: '#7A5C00' } :
      pct >= 70 ? { label: '⭐ Expert!',    bg: '#D4EDDA', border: '#45B49E', text: '#1A5C3A' } :
      pct >= 50 ? { label: '👍 Solid!',     bg: '#D1ECF1', border: '#6AADAA', text: '#0C4A4A' } :
      pct >= 30 ? { label: '📚 Learner',    bg: '#FDE8D0', border: '#E8954A', text: '#7A3A00' } :
                  { label: '🌱 Rookie',     bg: '#FDDDE0', border: '#E57B6F', text: '#7A1A14' }

    return (
      <div style={{
        minHeight: '100vh',
        background: '#2a2a2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: 24,
      }}>
        <div style={{
          background: grade.bg,
          border: `4px solid ${grade.border}`,
          borderRadius: 16,
          padding: '36px 40px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 13, color: grade.text, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7 }}>
            Game Complete
          </div>

          <div style={{ fontSize: 72, fontWeight: 900, color: grade.text, lineHeight: 1 }}>
            {totalScore}
            <span style={{ fontSize: 22, opacity: 0.4 }}>/{maxPossible}</span>
          </div>

          <div style={{
            fontSize: 20, fontWeight: 800, color: grade.text,
          }}>
            {grade.label}
          </div>

          {/* Round-by-round breakdown */}
          <div style={{
            width: '100%',
            borderRadius: 10,
            overflow: 'hidden',
            border: `2px solid ${grade.border}`,
          }}>
            {deck.map((t, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                borderBottom: i < deck.length - 1 ? `1px solid ${grade.border}55` : 'none',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
              }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: grade.text }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: grade.text, marginLeft: 8, opacity: 0.5 }}>{t.category}</span>
                </div>
                <span style={{
                  fontSize: 15, fontWeight: 800,
                  color: (scores[i] ?? 0) > 0 ? '#1A6A3A' : '#C0392B',
                }}>
                  {(scores[i] ?? 0) > 0 ? `+${scores[i]}` : '0'} pts
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button onClick={onExit} style={{
              padding: '12px 22px',
              border: `2px solid ${grade.border}`,
              borderRadius: 50,
              background: 'rgba(255,255,255,0.5)',
              color: grade.text,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              ← Menu
            </button>
            <button onClick={handleRestart} style={{
              padding: '12px 28px',
              border: 'none',
              borderRadius: 50,
              background: grade.border,
              color: '#fff',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}>
              Play Again ↺
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main game screen ────────────────────────────────────────────────────────
  return (
    <div
      key={gameKey}
      style={{
        minHeight: '100vh',
        background: '#2a2a2a',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top bar ── */}
      <div style={{
        background: '#222',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button onClick={onExit} style={{
          background: 'none', border: '2px solid #444', borderRadius: 20,
          color: '#aaa', fontSize: 12, fontWeight: 700, padding: '6px 14px',
          cursor: 'pointer',
        }}>
          ← EXIT
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>
            Tech Clue
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 5 }}>
            {deck.map((_, i) => (
              <div key={i} style={{
                width: 28, height: 6, borderRadius: 3,
                background: i < round
                  ? '#45B49E'
                  : i === round
                    ? '#fff'
                    : '#444',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#F2C355' }}>{totalScore}</div>
          <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.08em' }}>PTS</div>
        </div>
      </div>

      {/* ── Category + round label ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px 6px',
        flexShrink: 0,
      }}>
        <span style={{
          background: '#F2C355', color: '#2a1d00',
          borderRadius: 20, padding: '3px 14px',
          fontSize: 12, fontWeight: 800,
        }}>
          {tech.category}
        </span>
        <span style={{ color: '#777', fontSize: 12 }}>
          Round {round + 1} of {ROUNDS_PER_GAME}
        </span>
      </div>

      {/* ── Clue panels ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 0,
        overflow: 'hidden',
        margin: '10px 16px 0',
        borderRadius: '10px 10px 0 0',
      }}>
        {tech.clues.map((clue, i) => (
          <CluePanel
            key={i}
            index={i}
            clue={clue}
            revealed={i < revealed}
            active={i === revealed - 1}
          />
        ))}
      </div>

      {/* ── Bottom controls ── */}
      <div style={{
        background: '#222',
        padding: '16px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        {/* Feedback */}
        {feedback && (
          <div style={{
            background: feedback.ok ? '#D4EDDA' : '#FDDDE0',
            border: `2px solid ${feedback.ok ? '#45B49E' : '#E57B6F'}`,
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 700,
            color: feedback.ok ? '#1A5C3A' : '#7A1A14',
            display: 'flex', alignItems: 'center', gap: 8,
            maxWidth: 560, width: '100%',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18 }}>{feedback.ok ? '🎉' : '😬'}</span>
            {feedback.msg}
          </div>
        )}

        {!roundOver ? (
          <>
            {/* Guess input row */}
            <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 560 }}>
              <input
                ref={inputRef}
                autoFocus
                value={guess}
                onChange={e => setGuess(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuess()}
                placeholder="What technology is this?"
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  background: '#fff',
                  border: '3px solid #ddd',
                  borderRadius: 50,
                  color: '#222',
                  fontSize: 15,
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleGuess}
                disabled={!guess.trim()}
                style={{
                  padding: '14px 28px',
                  background: guess.trim() ? '#F2C355' : '#3a3a3a',
                  border: 'none',
                  borderRadius: 50,
                  color: guess.trim() ? '#2a1d00' : '#666',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: guess.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                  letterSpacing: '0.06em',
                  boxShadow: guess.trim() ? '0 4px 12px rgba(242,195,85,0.4)' : 'none',
                }}
              >
                SOLVE?
              </button>
            </div>

            {/* Reveal / give up row */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={handleRevealNext}
                disabled={revealed >= 5}
                style={{
                  padding: '9px 20px',
                  background: revealed < 5 ? '#333' : '#2a2a2a',
                  border: `2px solid ${revealed < 5 ? '#555' : '#333'}`,
                  borderRadius: 50,
                  color: revealed < 5 ? '#ddd' : '#555',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: revealed < 5 ? 'pointer' : 'not-allowed',
                }}
              >
                {revealed < 5
                  ? `+ Reveal Clue ${revealed + 1}  (${POINTS_PER_CLUE[revealed]} pts)`
                  : 'All clues revealed'}
              </button>

              <button
                onClick={handleGiveUp}
                style={{
                  padding: '9px 18px',
                  background: 'transparent',
                  border: '2px solid #554040',
                  borderRadius: 50,
                  color: '#997777',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Give Up
              </button>
            </div>

            {/* Points guide */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {POINTS_PER_CLUE.map((pts, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 700,
                  color: i === revealed - 1 ? '#F2C355' : i < revealed ? '#888' : '#555',
                  background: i === revealed - 1 ? '#3a3200' : 'transparent',
                  borderRadius: 4,
                  padding: '2px 6px',
                }}>
                  C{i + 1}={pts}pt
                </span>
              ))}
            </div>
          </>
        ) : (
          /* Round-over */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {!feedback?.ok && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#777', letterSpacing: '0.12em', marginBottom: 4 }}>
                  THE ANSWER WAS
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>{tech.name}</div>
              </div>
            )}
            <button
              onClick={handleNextRound}
              style={{
                padding: '14px 40px',
                background: '#F2C355',
                border: 'none',
                borderRadius: 50,
                color: '#2a1d00',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(242,195,85,0.5)',
                letterSpacing: '0.05em',
              }}
            >
              {round + 1 < ROUNDS_PER_GAME ? 'Next Round →' : 'See Results →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
