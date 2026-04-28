import { useState } from 'react'
import cookPortrait from '@/assets/mystery/portraits/cook portrait.png'
import kitchenBg    from '@/assets/mystery/rooms/kitchen.png'
import tableBg      from '@/assets/mystery/table.png'
import { CLUES }    from '../data/clues'
import { playClick, playCorrect, playPop } from '@/lib/sounds'
import './KitchenRoom.css'

interface Props {
  onClueCollected: (clueId: string) => void
  onBack: () => void
}

// ─── Puzzle data ──────────────────────────────────────────────────

interface Fragment {
  id: string
  text: string
  correctChunk: string
  label: string
}

const FRAGMENTS: Fragment[] = [
  { id: 'f1',  label: 'Cooking Log',   correctChunk: 'timeline',
    text: '[6:00 PM] — Set to work on His Lordship\'s evening meal. Lamb chops, rosemary. His usual preference.' },
  { id: 'f2',  label: 'Cooking Log',   correctChunk: 'timeline',
    text: '[6:45 PM] — Veal stock reduced to a simmer. Bread dough prepared and left to prove beside the range.' },
  { id: 'f3',  label: 'Cooking Log',   correctChunk: 'timeline',
    text: '[7:31 PM] — Loaf placed in oven at 375°. Expected to be ready by half-eight.' },
  { id: 'f4',  label: 'Cooking Log',   correctChunk: 'timeline',
    text: '[10:15 PM] — Returned to kitchen. Found bread entirely ruined. Burnt black throughout.' },
  { id: 'f5',  label: 'Cooking Log',   correctChunk: 'timeline',
    text: '[10:30 PM] — Cold plate assembled from pantry stores. Word sent to Mr. Finch of the delay.' },
  { id: 'f6',  label: 'Invoice',       correctChunk: 'supplies',
    text: 'Invoice #447 — Vermin Control: Rodent Compound (1 unit) — 14 shillings. Signed: B. Bramble. Date: Nov 3.' },
  { id: 'f7',  label: 'Invoice',       correctChunk: 'supplies',
    text: 'Invoice #448 — Kitchen Provisions: flour 5 lb, coarse salt, unsalted butter, heavy cream.' },
  { id: 'f8',  label: 'Pantry Log',    correctChunk: 'supplies',
    text: 'Pantry count: potatoes ×12, turnips ×8, pearl onions ×6. Dried herbs running low — reorder needed.' },
  { id: 'f9',  label: 'Equipment',     correctChunk: 'supplies',
    text: 'Copper pots: 6 in service, 2 sent for repair. Silver serving tray returned, polished.' },
  { id: 'f10', label: 'Personal Note', correctChunk: 'personal',
    text: 'Must speak with A. tonight. The usual place. Do not be late. — B.' },
  { id: 'f11', label: 'Personal Note', correctChunk: 'personal',
    text: 'He grows more suspicious by the day. I cannot afford another mistake. Not now.' },
  { id: 'f12', label: 'Personal Note', correctChunk: 'personal',
    text: 'The Lord takes his nightcap at precisely eleven. Without fail. Such a creature of habit.' },
]

const CHUNKS = [
  { id: 'timeline', label: 'Cooking Log',     icon: '🕐',
    hint: 'Time-stamped entries about meal preparation' },
  { id: 'supplies', label: 'Supply Records',  icon: '📦',
    hint: 'Invoices, pantry counts, equipment notes' },
  { id: 'personal', label: 'Personal Papers', icon: '✒️',
    hint: 'Private notes and correspondence' },
]

// ─── Scatter layout ───────────────────────────────────────────────
// Positions as % within the table scene, clear of the candle (right)
// and mortar (left). faceDown papers must be flipped before reading.

const FRAGMENT_LAYOUT: { id: string; x: number; y: number; rot: number; faceDown: boolean }[] = [
  { id: 'f1',  x: 24, y: 12, rot:  -8, faceDown: false },
  { id: 'f2',  x: 40, y:  8, rot:   5, faceDown: true  },
  { id: 'f3',  x: 57, y: 14, rot: -11, faceDown: false },
  { id: 'f4',  x: 66, y:  9, rot:   7, faceDown: true  },
  { id: 'f5',  x: 28, y: 34, rot:  14, faceDown: true  },
  { id: 'f6',  x: 46, y: 29, rot:  -5, faceDown: false },
  { id: 'f7',  x: 62, y: 36, rot:   9, faceDown: true  },
  { id: 'f8',  x: 22, y: 47, rot: -13, faceDown: false },
  { id: 'f9',  x: 44, y: 51, rot:   6, faceDown: true  },
  { id: 'f10', x: 60, y: 44, rot:  -3, faceDown: false },
  { id: 'f11', x: 34, y: 63, rot:  11, faceDown: true  },
  { id: 'f12', x: 53, y: 61, rot:  -7, faceDown: false },
]

// ─── Dialogue data ────────────────────────────────────────────────

const INTRO_LINES = [
  "You're in my kitchen. You'd best have a reason.",
  "I've nothing to hide. I was here all evening, preparing His Lordship's supper. Ask anyone.",
  "Those papers on the table are just receipts and logs. Nothing of consequence. I keep meticulous records — it's part of my position.",
  "But if you insist on prying, then pry. I've work to do.",
]

const CONFRONT_LINES = [
  "What are you suggesting? I stepped away from the kitchen for a moment. For air. The smoke from the range — it gets into your lungs.",
  "The vermin compound? We had a rat problem. I deal with such things myself rather than trouble His Lordship with it.",
  "...That note is private. It means nothing. A. is... a friend. An old acquaintance. Nothing more.",
  "I won't say anything further without Mr. Finch present. I've told you what I know.",
]

// ─── Component ────────────────────────────────────────────────────

type Step = 'intro' | 'examine' | 'chunking' | 'reveal' | 'confront' | 'done'

export default function KitchenRoom({ onClueCollected, onBack }: Props) {
  const [step,          setStep]          = useState<Step>('intro')
  const [dialogIdx,     setDialogIdx]     = useState(0)
  const [assignment,    setAssignment]    = useState<Record<string, string>>({})
  const [selected,      setSelected]      = useState<string | null>(null)
  const [errors,        setErrors]        = useState<string[]>([])
  const [attempts,      setAttempts]      = useState(0)
  const [confrontIdx,   setConfrontIdx]   = useState(0)
  // Scatter-specific state
  const [faceDownState, setFaceDownState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FRAGMENT_LAYOUT.map(f => [f.id, f.faceDown]))
  )
  const [flipping, setFlipping] = useState<string | null>(null)

  const clue = CLUES['kitchen-records']

  // ── Dialogue helpers ────────────────────────────────────────────
  function advanceIntro() {
    playPop()
    if (dialogIdx < INTRO_LINES.length - 1) {
      setDialogIdx(i => i + 1)
    } else {
      setStep('examine')
    }
  }

  function advanceConfront() {
    playPop()
    if (confrontIdx < CONFRONT_LINES.length - 1) {
      setConfrontIdx(i => i + 1)
    } else {
      playCorrect()
      onClueCollected(clue.id)
      setStep('done')
    }
  }

  // ── Flip mechanic ───────────────────────────────────────────────
  function flipPaper(id: string) {
    if (flipping) return
    playPop()
    setFlipping(id)
    // Content swaps at the midpoint of the animation (160ms into 340ms)
    setTimeout(() => setFaceDownState(prev => ({ ...prev, [id]: false })), 160)
    setTimeout(() => setFlipping(null), 340)
  }

  // ── Chunking puzzle ─────────────────────────────────────────────
  function selectFragment(id: string) {
    playClick()
    setSelected(prev => prev === id ? null : id)
    setErrors([])
  }

  function assignToChunk(chunkId: string) {
    if (!selected) return
    playClick()
    setAssignment(prev => ({ ...prev, [selected]: chunkId }))
    setSelected(null)
  }

  function unassignFragment(fragId: string) {
    playClick()
    setAssignment(prev => {
      const next = { ...prev }
      delete next[fragId]
      return next
    })
  }

  function validateChunks() {
    const wrong      = FRAGMENTS.filter(f => assignment[f.id] !== f.correctChunk).map(f => f.id)
    const unassigned = FRAGMENTS.filter(f => !assignment[f.id]).map(f => f.id)
    const allWrong   = [...wrong, ...unassigned]

    if (allWrong.length === 0) {
      playCorrect()
      setStep('reveal')
    } else {
      setErrors(allWrong)
      setAttempts(a => a + 1)
    }
  }

  const unassignedFrags = FRAGMENTS.filter(f => !assignment[f.id])
  const assignedTo      = (chunkId: string) => FRAGMENTS.filter(f => assignment[f.id] === chunkId)

  // Dynamic topbar hint for chunking step
  const chunkingHint = (() => {
    const unflipped = FRAGMENTS.filter(f => !assignment[f.id] && faceDownState[f.id]).length
    if (unflipped > 0) return `${unflipped} paper${unflipped !== 1 ? 's' : ''} still face-down — flip to read`
    if (selected) return 'Click a category below to file the selected paper'
    const remaining = unassignedFrags.length
    if (remaining > 0) return `${remaining} paper${remaining !== 1 ? 's' : ''} unsorted — select one`
    return 'All papers filed — review and analyse'
  })()

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="kitch-root">

      {/* Topbar */}
      <div className="kitch-topbar">
        <button className="kitch-back" onClick={() => { playClick(); onBack() }}>← Manor</button>
        <span className="kitch-room-label">🍳 The Kitchen</span>
        {step === 'chunking' && (
          <span className="kitch-step-hint">{chunkingHint}</span>
        )}
      </div>

      <div className="kitch-body">

        {/* ── INTRO ─────────────────────────────────────────────── */}
        {step === 'intro' && (
          <div className="kitch-dialogue-scene" onClick={advanceIntro}>
            <img src={kitchenBg} className="kitch-scene-bg" alt="Kitchen" />
            <div className="kitch-dialogue-panel">
              <div className="kitch-portrait-wrap">
                <img src={cookPortrait} className="kitch-portrait" alt="Mrs. Bramble" />
                <p className="kitch-portrait-name">Mrs. Bramble · Cook</p>
              </div>
              <div className="kitch-speech-box">
                <p className="kitch-speech-text">{INTRO_LINES[dialogIdx]}</p>
                <span className="kitch-speech-hint">
                  {dialogIdx < INTRO_LINES.length - 1 ? 'Click to continue →' : 'Examine the records →'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── EXAMINE ───────────────────────────────────────────── */}
        {step === 'examine' && (
          <div className="kitch-examine">
            <img src={kitchenBg} className="kitch-scene-bg dim" alt="Kitchen" />
            <div className="kitch-examine-card">
              <h2 className="kitch-examine-title">Kitchen Records</h2>
              <p className="kitch-examine-body">
                Scattered across the preparation table: torn invoices, handwritten log entries,
                loose notes — some face-down as if hastily turned over.
                Mrs. Bramble claims she keeps meticulous records.
                Scattered like this, they tell you nothing.
              </p>
              <p className="kitch-examine-body secondary">
                You'll need to sort them into meaningful groups before the truth can be read.
              </p>
              <button className="kitch-primary-btn" onClick={() => { playClick(); setStep('chunking') }}>
                Begin Sorting
              </button>
            </div>
          </div>
        )}

        {/* ── CHUNKING: table scatter ────────────────────────────── */}
        {step === 'chunking' && (
          <div className="kitch-table-scene">
            <img src={tableBg} className="kitch-table-bg" alt="" aria-hidden />

            {/* Scattered papers */}
            {unassignedFrags.map(frag => {
              const layout     = FRAGMENT_LAYOUT.find(l => l.id === frag.id)!
              const isFaceDown = faceDownState[frag.id]
              const isFlipping = flipping === frag.id
              const isSelected = selected === frag.id
              const hasError   = errors.includes(frag.id)

              return (
                <div
                  key={frag.id}
                  className={[
                    'kitch-paper',
                    isFaceDown  ? 'face-down' : 'face-up',
                    isFlipping  ? 'flipping'  : '',
                    isSelected  ? 'selected'  : '',
                    hasError    ? 'error'      : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    left:    `${layout.x}%`,
                    top:     `${layout.y}%`,
                    '--rot': `${layout.rot}deg`,
                  } as React.CSSProperties}
                  onClick={() => isFaceDown ? flipPaper(frag.id) : selectFragment(frag.id)}
                >
                  {isFaceDown ? (
                    <div className="kitch-paper-back">
                      <span className="kitch-paper-seal">✦</span>
                    </div>
                  ) : (
                    <div className="kitch-paper-front">
                      <span className="kitch-frag-label">{frag.label}</span>
                      <p className="kitch-frag-text">{frag.text}</p>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Category strip */}
            <div className="kitch-cat-strip">
              {CHUNKS.map(chunk => (
                <div
                  key={chunk.id}
                  className={`kitch-cat-zone ${selected ? 'droppable' : ''}`}
                  onClick={() => selected && assignToChunk(chunk.id)}
                >
                  <div className="kitch-cat-header">
                    <span className="kitch-cat-icon">{chunk.icon}</span>
                    <span className="kitch-cat-name">{chunk.label}</span>
                    <span className="kitch-cat-count">{assignedTo(chunk.id).length}</span>
                  </div>
                  <div className="kitch-cat-papers">
                    {assignedTo(chunk.id).map((frag, i) => (
                      <div
                        key={frag.id}
                        className={`kitch-stacked-paper ${errors.includes(frag.id) ? 'error' : ''}`}
                        style={{ '--si': i } as React.CSSProperties}
                        onClick={e => { e.stopPropagation(); unassignFragment(frag.id) }}
                        title="Click to return to table"
                      >
                        {frag.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="kitch-cat-actions">
                {errors.length > 0 && (
                  <p className="kitch-table-error">
                    {attempts === 1
                      ? 'Some papers misplaced. Consider what each fragment records.'
                      : 'Check highlighted papers. Group by topic, not time.'}
                  </p>
                )}
                <button
                  className="kitch-primary-btn"
                  onClick={validateChunks}
                  disabled={Object.keys(assignment).length < FRAGMENTS.length}
                >
                  Analyse Records
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── REVEAL ────────────────────────────────────────────── */}
        {step === 'reveal' && (
          <div className="kitch-reveal">
            <div className="kitch-reveal-card">
              <h2 className="kitch-reveal-title">The Records Speak</h2>
              <p className="kitch-reveal-intro">
                Sorted by context, the cooking log reveals what the scattered pile concealed.
              </p>

              <div className="kitch-timeline">
                <div className="kitch-tl-entry">
                  <span className="kitch-tl-time">6:00 PM</span>
                  <span className="kitch-tl-text">Began meal preparation</span>
                </div>
                <div className="kitch-tl-entry">
                  <span className="kitch-tl-time">6:45 PM</span>
                  <span className="kitch-tl-text">Stock to simmer. Bread prepared.</span>
                </div>
                <div className="kitch-tl-entry">
                  <span className="kitch-tl-time">7:31 PM</span>
                  <span className="kitch-tl-text">Bread placed in oven.</span>
                </div>
                <div className="kitch-tl-gap">
                  <span className="kitch-tl-gap-label">⚠ 2 HOURS 44 MINUTES — NO ENTRIES</span>
                  <span className="kitch-tl-gap-sub">Mrs. Bramble's whereabouts: unknown</span>
                </div>
                <div className="kitch-tl-entry">
                  <span className="kitch-tl-time">10:15 PM</span>
                  <span className="kitch-tl-text">Returned. Bread destroyed. Cold plate assembled.</span>
                </div>
              </div>

              <div className="kitch-reveal-findings">
                <div className="kitch-finding">
                  <span className="kitch-finding-icon">📦</span>
                  <p>
                    <strong>Invoice #447</strong> — "Rodent Control Compound" purchased on Nov 3rd —
                    the morning of Lord Blackwood's death.
                  </p>
                </div>
                <div className="kitch-finding">
                  <span className="kitch-finding-icon">✒️</span>
                  <p>
                    <strong>Personal note:</strong> "Must speak with A. tonight. The usual place."
                    — Who is A.?
                  </p>
                </div>
              </div>

              <div className="kitch-rag-note">
                <span className="kitch-rag-icon">💡</span>
                <p>
                  <em>Those records, scattered, told you nothing. Sorted by meaning — not just
                  by date — the gap became visible. This is <strong>document chunking</strong>:
                  grouping information by semantic context so the relevant truth can be retrieved.</em>
                </p>
              </div>

              <button className="kitch-primary-btn" onClick={() => { playClick(); setStep('confront') }}>
                Confront Mrs. Bramble
              </button>
            </div>
          </div>
        )}

        {/* ── CONFRONT ──────────────────────────────────────────── */}
        {step === 'confront' && (
          <div className="kitch-dialogue-scene" onClick={advanceConfront}>
            <img src={kitchenBg} className="kitch-scene-bg" alt="Kitchen" />
            <div className="kitch-dialogue-panel">
              <div className="kitch-portrait-wrap">
                <img src={cookPortrait} className="kitch-portrait rattled" alt="Mrs. Bramble" />
                <p className="kitch-portrait-name">Mrs. Bramble · Cook</p>
              </div>
              <div className="kitch-speech-box confronting">
                <div className="kitch-evidence-tag">
                  {confrontIdx === 0 && '📜 Presenting: 2h 44m gap in cooking log'}
                  {confrontIdx === 1 && '📦 Presenting: Invoice #447 — Rodent Compound'}
                  {confrontIdx === 2 && '✒️ Presenting: "Must speak with A. tonight"'}
                  {confrontIdx === 3 && '🔍 Observation'}
                </div>
                <p className="kitch-speech-text">{CONFRONT_LINES[confrontIdx]}</p>
                <span className="kitch-speech-hint">
                  {confrontIdx < CONFRONT_LINES.length - 1
                    ? 'Press further →'
                    : 'File the evidence →'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── DONE ──────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="kitch-examine">
            <img src={kitchenBg} className="kitch-scene-bg dim" alt="Kitchen" />
            <div className="kitch-examine-card">
              <span className="kitch-clue-icon">📜</span>
              <h2 className="kitch-examine-title">Clue Collected</h2>
              <p className="kitch-clue-title-text">{clue.title}</p>
              <p className="kitch-examine-body">{clue.summary}</p>
              <p className="kitch-examine-body secondary">
                The Library is now accessible. Your investigation continues.
              </p>
              <button className="kitch-primary-btn" onClick={() => { playClick(); onBack() }}>
                Return to Manor
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
