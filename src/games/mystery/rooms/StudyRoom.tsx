import { useState } from 'react'
import studyBg from '@/assets/mystery/rooms/study.png'
import { playClick, playCorrect, playPop, playWrong } from '@/lib/sounds'
import './StudyRoom.css'

interface Props {
  onSolve: () => void
  onBack:  () => void
}

// ─── Evidence data ────────────────────────────────────────────────
// All six pieces drawn from across the investigation. Three are
// directly relevant to the murder sequence; three are misleading —
// relevant to the case, but not to the question of what happened
// and how, in the critical hour.

interface Evidence {
  id: string
  icon: string
  title: string
  source: string
  excerpt: string
  relevant: boolean
  /** Shown after submission: why this piece ranks high or low */
  rankNote: string
}

const EVIDENCE: Evidence[] = [
  {
    id: 'e-vial',
    icon: '🧪',
    title: "Lady Wren's Vial",
    source: 'Physical Evidence · East Fireplace Grate',
    excerpt:
      'An empty glass vial, initials C.W. engraved on the cap. ' +
      'Residue identified by Dr. Hollis as aconitine — a fast-acting poison, ' +
      'detectable only within hours of administration.',
    relevant: true,
    rankNote: 'Ranked high — establishes the method. The murder weapon was in her possession.',
  },
  {
    id: 'e-absence',
    icon: '🕰',
    title: "The 24-Minute Gap",
    source: "Lady's Maid Note · Nov 3, 9:28 PM",
    excerpt:
      "Lady Wren excused herself from the drawing room at 9:28 PM, citing her shawl. " +
      "Returned at 9:52 PM, complexion flushed. The chambermaid confirms " +
      "the shawl was undisturbed in her room the entire evening.",
    relevant: true,
    rankNote: 'Ranked high — establishes opportunity. Twenty-four unaccounted minutes, enough to reach the study and return.',
  },
  {
    id: 'e-nightcap',
    icon: '🍷',
    title: 'The Nightcap Habit',
    source: "Personal Note · Mrs. Bramble's Papers",
    excerpt:
      '"The Lord takes his nightcap at precisely eleven. Without fail. ' +
      'Such a creature of habit." — Unsigned note recovered from the kitchen preparation table.',
    relevant: true,
    rankNote: 'Ranked high — establishes delivery mechanism. A predictable, unattended vessel at a known time.',
  },
  {
    id: 'e-ashford-visit',
    icon: '🚪',
    title: "Ashford's Refused Visit",
    source: 'Visitor Log · Oct 29',
    excerpt:
      'Col. R. Ashford arrived unannounced, 4:40 PM. His Lordship refused to receive him. ' +
      'Ashford remained twenty minutes in the entrance hall before ' +
      'departing in evident agitation. No appointment recorded.',
    relevant: false,
    rankNote: 'Ranked down — establishes prior grievance, not the murder night. Four days before the act. Motive, not mechanism.',
  },
  {
    id: 'e-bramble-gap',
    icon: '📜',
    title: "Bramble's Missing Hours",
    source: 'Cooking Log · Nov 3',
    excerpt:
      'A gap of 2 hours and 44 minutes in Mrs. Bramble\'s log — 7:31 PM to 10:15 PM. ' +
      'No entries. The bread she had placed in the oven was found entirely ruined.',
    relevant: false,
    rankNote: "Ranked down — the gap runs 7:31 to 10:15. The murder occurred at eleven, after Bramble had returned. Her absence doesn't intersect the sequence.",
  },
  {
    id: 'e-cipher',
    icon: '🔐',
    title: "The Cipher Letter",
    source: 'Hidden Correspondence · Library',
    excerpt:
      '"...will not be made to disappear quietly. What was promised will be honoured ' +
      '— or the matter will be settled by other means." ' +
      "Sealed with Ashford's serpent. Addressed to R.B.",
    relevant: false,
    rankNote: "Ranked down — a threat written years prior. Ashford's motive was real, but the act was someone else's. Context, not sequence.",
  },
]

const CORRECT_IDS = new Set(['e-vial', 'e-absence', 'e-nightcap'])

// ─── Sequence reconstruction ──────────────────────────────────────

const SEQUENCE_STEPS = [
  { time: '9:28 PM',
    text: 'Lady Wren excused herself from the drawing room. Twenty-four minutes.' },
  { time: '~9:35 PM',
    text: "The study — unoccupied. Lord Blackwood's nightcap prepared and waiting, as it was every night at eleven. A creature of habit." },
  { time: '~9:42 PM',
    text: 'An empty vial. Aconitine — colourless, tasteless, fast-acting. Slipped into the glass. Hidden behind the grate on the way out.' },
  { time: '9:52 PM',
    text: 'Lady Wren returned to the drawing room. Slightly flushed.' },
  { time: '11:00 PM',
    text: 'Lord Blackwood retired for the evening and drank his nightcap. Without fail.' },
  { time: 'Hours later',
    text: 'Aconitine. The physician called it a sudden illness of the heart. Dr. Hollis noted the residue. The truth was already waiting in the fireplace grate.' },
]

// ─── Component ────────────────────────────────────────────────────

type Step        = 'intro' | 'rank' | 'sequence' | 'accusation' | 'done'
type RankState   = 'selecting' | 'feedback'

export default function StudyRoom({ onSolve, onBack }: Props) {
  const [step,      setStep]      = useState<Step>('intro')
  const [selected,  setSelected]  = useState<string[]>([])   // ordered by click
  const [rankState, setRankState] = useState<RankState>('selecting')
  const [wrongIds,  setWrongIds]  = useState<string[]>([])

  // ── Selection ───────────────────────────────────────────────────
  function toggleEvidence(id: string) {
    if (rankState === 'feedback') {
      // Clear feedback and allow re-selection
      setRankState('selecting')
      setWrongIds([])
    }

    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 3)  return prev               // already at max
      return [...prev, id]
    })
    playClick()
  }

  // ── Validate ────────────────────────────────────────────────────
  function reconstruct() {
    if (selected.length < 3) return
    const wrong = selected.filter(id => !CORRECT_IDS.has(id))
    if (wrong.length === 0) {
      playCorrect()
      setStep('sequence')
    } else {
      playWrong()
      setWrongIds(wrong)
      setRankState('feedback')
    }
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="std-root">

      {/* Topbar */}
      <div className="std-topbar">
        <button className="std-back" onClick={() => { playClick(); onBack() }}>← Manor</button>
        <span className="std-room-label">🕯️ The Study</span>
        {step === 'rank' && (
          <span className="std-step-hint">
            {selected.length < 3
              ? `Select ${3 - selected.length} more piece${3 - selected.length !== 1 ? 's' : ''}`
              : 'Three selected — reconstruct the sequence'}
          </span>
        )}
      </div>

      <div className="std-body">

        {/* ── INTRO ──────────────────────────────────────────────── */}
        {step === 'intro' && (
          <div className="std-intro" onClick={() => { playPop(); setStep('rank') }}>
            <img src={studyBg} className="std-scene-bg" alt="The Study" />
            <div className="std-intro-atmosphere" />
            <div className="std-intro-panel">
              <p className="std-intro-text">
                The Study. Lord Blackwood's private rooms. The decanter still on the desk.
                The glass, rinsed — but not carefully enough.
              </p>
              <p className="std-intro-text">
                You have gathered evidence from every corner of this manor. Four suspects.
                Six pieces of retrieved evidence. All relevant to the case.
                But retrieval is only half the work.
              </p>
              <p className="std-intro-text accent">
                Which three pieces most directly reconstruct the method, the timing,
                and the opportunity? Select them. Rank them. Name the truth.
              </p>
              <span className="std-intro-hint">Click to begin →</span>
            </div>
          </div>
        )}

        {/* ── RANK: evidence grid ────────────────────────────────── */}
        {step === 'rank' && (
          <div className="std-rank">

            <p className="std-rank-instruction">
              {rankState === 'feedback'
                ? 'Some pieces rank below the sequence. Deselect and reconsider.'
                : 'Select the three pieces that directly reconstruct what happened and how.'}
            </p>

            <div className="std-evidence-grid">
              {EVIDENCE.map((ev, i) => {
                const rank      = selected.indexOf(ev.id) + 1  // 0 = not selected
                const isWrong   = wrongIds.includes(ev.id)
                const isCorrect = rankState === 'feedback' && selected.includes(ev.id) && !isWrong

                return (
                  <button
                    key={ev.id}
                    className={[
                      'std-card',
                      rank      ? 'selected'  : '',
                      isWrong   ? 'wrong'     : '',
                      isCorrect ? 'confirmed' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => toggleEvidence(ev.id)}
                    style={{ '--card-i': i } as React.CSSProperties}
                  >
                    {/* Rank badge */}
                    {rank > 0 && (
                      <span className={`std-rank-badge ${isWrong ? 'wrong' : ''}`}>
                        {isWrong ? '↓' : rank}
                      </span>
                    )}

                    <div className="std-card-icon">{ev.icon}</div>
                    <div className="std-card-body">
                      <p className="std-card-title">{ev.title}</p>
                      <p className="std-card-source">{ev.source}</p>
                      <p className="std-card-excerpt">{ev.excerpt}</p>

                      {/* Show rank note after feedback */}
                      {rankState === 'feedback' && selected.includes(ev.id) && (
                        <p className={`std-card-note ${ev.relevant ? 'high' : 'low'}`}>
                          {ev.rankNote}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="std-rank-footer">
              <button
                className="std-primary-btn"
                disabled={selected.length < 3}
                onClick={reconstruct}
              >
                Reconstruct the Sequence
              </button>
            </div>
          </div>
        )}

        {/* ── SEQUENCE: murder reconstruction ────────────────────── */}
        {step === 'sequence' && (
          <div className="std-sequence">
            <div className="std-seq-card">
              <h2 className="std-seq-title">The Murder — Reconstructed</h2>
              <p className="std-seq-sub">
                Three pieces. Method. Opportunity. Delivery. The sequence assembles itself.
              </p>

              <div className="std-timeline">
                {SEQUENCE_STEPS.map((s, i) => (
                  <div
                    key={i}
                    className="std-seq-step"
                    style={{ '--step-i': i } as React.CSSProperties}
                  >
                    <span className="std-seq-time">{s.time}</span>
                    <div className="std-seq-line" />
                    <p className="std-seq-text">{s.text}</p>
                  </div>
                ))}
              </div>

              <div className="std-rag-note">
                <span>💡</span>
                <p>
                  <em>
                    Six pieces were retrieved — all relevant to the case. But <strong>reranking</strong>
                    {' '}applied a specific criterion: which evidence directly establishes the murder
                    sequence? Ashford's motive, Bramble's gap, the cipher threat — all real, all
                    lower-ranked against that question. The top three told the story the others could not.
                  </em>
                </p>
              </div>

              <button className="std-primary-btn" onClick={() => { playClick(); setStep('accusation') }}>
                Name the Killer →
              </button>
            </div>
          </div>
        )}

        {/* ── ACCUSATION ─────────────────────────────────────────── */}
        {step === 'accusation' && (
          <div className="std-accusation">
            <div className="std-acc-card">
              <div className="std-acc-seal">⚖</div>
              <h2 className="std-acc-title">Formal Accusation</h2>

              <div className="std-acc-statement">
                <p>
                  You accuse <strong>Lady Catherine Wren</strong> of the deliberate murder of{' '}
                  <strong>Lord Reginald Blackwood</strong>, on the night of November 3rd,
                  at Blackwood Manor.
                </p>
              </div>

              <div className="std-acc-grounds">
                <div className="std-acc-ground">
                  <span className="std-acc-ground-icon">🧪</span>
                  <p><strong>Method:</strong> Aconitine, administered via the evening nightcap. The vial bore her initials.</p>
                </div>
                <div className="std-acc-ground">
                  <span className="std-acc-ground-icon">🕰</span>
                  <p><strong>Opportunity:</strong> A 24-minute absence from the drawing room. The shawl she claimed to retrieve never moved.</p>
                </div>
                <div className="std-acc-ground">
                  <span className="std-acc-ground-icon">🍷</span>
                  <p><strong>Mechanism:</strong> Lord Blackwood's nightcap at precisely eleven — a habit known to every resident of the manor.</p>
                </div>
              </div>

              <button
                className="std-primary-btn accent"
                onClick={() => { playCorrect(); setStep('done') }}
              >
                Confirm Accusation
              </button>
            </div>
          </div>
        )}

        {/* ── DONE: case closed ──────────────────────────────────── */}
        {step === 'done' && (
          <div className="std-done">
            <div className="std-done-card">
              <div className="std-done-seal">🏛</div>
              <h2 className="std-done-title">Case Closed</h2>
              <p className="std-done-text">
                Lady Wren was taken into custody the following morning. She did not resist.
                She asked only that her solicitor be sent for — and said nothing further.
              </p>
              <p className="std-done-text secondary">
                Colonel Ashford's debt remained unpaid. Mrs. Bramble's role with "A." was
                investigated but never prosecuted. The manor was shuttered within the month.
              </p>
              <div className="std-done-divider" />
              <p className="std-done-lesson">
                You have learned: <strong>Retrieval</strong> surfaces relevant material.{' '}
                <strong>Reranking</strong> decides which material answers the question.
                The right evidence at the top of the stack is what makes retrieval useful.
              </p>
              <button className="std-primary-btn" onClick={() => { playClick(); onSolve() }}>
                Leave the Manor
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
