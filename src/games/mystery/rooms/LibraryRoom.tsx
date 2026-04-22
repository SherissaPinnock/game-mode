import { useState } from 'react'
import libraryBg from '@/assets/mystery/rooms/library.png'
import { CLUES }  from '../data/clues'
import { playClick, playCorrect, playPop } from '@/lib/sounds'
import './LibraryRoom.css'

interface Props {
  onClueCollected: (clueId: string) => void
  onBack: () => void
}

// ─── Archive data ──────────────────────────────────────────────────

interface ArchiveResult {
  id: string
  source: string
  excerpt: string
  relevant: boolean
  /** Shown after the player picks this result — explains why it is or isn't the right match. */
  note: string
}

interface Query {
  id: string
  label: string
  question: string
  results: ArchiveResult[]
}

const QUERIES: Query[] = [
  {
    id: 'q-debt',
    label: 'Financial claims',
    question: 'Who held an unresolved financial claim against Lord Blackwood?',
    results: [
      {
        id: 'r-debt-a',
        source: 'Estate Ledger · 1887',
        excerpt:
          'Outstanding personal loan: Col. R. Ashford, sum of £600, advanced October 1885. ' +
          'Lord Blackwood declined repayment request, November 1886. Matter noted by Mr. Finch ' +
          'as "indefinitely deferred by His Lordship\'s instruction."',
        relevant: true,
        note:
          'Direct match — a named party, a precise sum, and a formal refusal to repay. ' +
          'The query asked for an unresolved claim; this record confirms it was never settled.',
      },
      {
        id: 'r-debt-b',
        source: 'Estate Ledger · 1889',
        excerpt:
          'Wages dispute: Lord Blackwood withheld two quarters\' pay from former groundskeeper ' +
          'T. Briggs, following his dismissal. Matter referred to estate solicitor, Mr. Finch. ' +
          'Resolved in His Lordship\'s favour. No outstanding balance.',
        relevant: false,
        note:
          'A named financial dispute — but money owed outward from the estate to a former employee, ' +
          'not a claim held against His Lordship. Direction matters. The query asked who had a claim against him.',
      },
      {
        id: 'r-debt-c',
        source: 'Private Correspondence · 1890',
        excerpt:
          'Letter from Mr. Finch to His Lordship: "Your cousin, Mr. H. Blackwood, has written ' +
          'twice requesting settlement of the outstanding advance. I would advise a formal response ' +
          'before the matter becomes a legal concern." Amount unspecified.',
        relevant: false,
        note:
          'Another financial dispute involving the Blackwood name — but this is a claim Lord Blackwood ' +
          'holds against his cousin, not one held against him. The relationships are reversed.',
      },
    ],
  },
  {
    id: 'q-seal',
    label: 'Serpent seal',
    question: 'What correspondence bears the serpent seal, and from whom was it sent?',
    results: [
      {
        id: 'r-seal-a',
        source: 'Inventory Register · 1892',
        excerpt:
          'Study escritoire, lower drawer: one letter-opener, silver, with serpent-motif handle. ' +
          'Engraved initials: R.B. Provenance unknown.',
        relevant: false,
        note:
          '"Serpent" matched, but this is a household object — not a wax seal, not correspondence, ' +
          'not a sender. The query asked for a person. This record names none.',
      },
      {
        id: 'r-seal-b',
        source: 'Guest Register Annotation · Nov 1883',
        excerpt:
          'Delivered to His Lordship\'s study: one sealed letter from Col. R. Ashford. ' +
          'Wax seal described as serpent rampant on a field of black. Received in private, ' +
          'no copies retained. A second letter bearing the same seal arrived December of that year.',
        relevant: true,
        note:
          'The serpent seal is specifically attributed to Colonel Ashford across two recorded ' +
          'instances. This establishes authorship — the cipher letter was not written by a stranger.',
      },
      {
        id: 'r-seal-c',
        source: 'Household Correspondence Index · 1890',
        excerpt:
          'Letters filed under initial "A": eleven items from three separate correspondents. ' +
          'Senders include Mr. A. Fairfax, Mrs. W. Ashmore, and a series of unsigned notes ' +
          'initialled "C.A." Sealed variously with plain wax. No distinguishing motif recorded.',
        relevant: false,
        note:
          'Correspondence from someone with initials matching Ashford — but no serpent seal, ' +
          'and unsigned. The query asked for a specific motif and a named sender. This record offers neither.',
      },
    ],
  },
  {
    id: 'q-access',
    label: 'Refused entry',
    question: 'Has any named visitor been refused entry to the manor in the past fortnight?',
    results: [
      {
        id: 'r-access-a',
        source: 'Staff Notice · Oct 14',
        excerpt:
          'By His Lordship\'s instruction: no tradespeople, collectors, or uninvited callers ' +
          'to be admitted at the main entrance. All deliveries via tradesman\'s entrance ' +
          'from this date forward.',
        relevant: false,
        note:
          'A general policy notice, no individual named. The query asked for a specific person ' +
          'refused — this record gives no such name.',
      },
      {
        id: 'r-access-b',
        source: 'Visitor Log · Nov 1',
        excerpt:
          'Mrs. T. Hartley arrived at 2 PM for the afternoon visit previously arranged. ' +
          'Admitted without delay. Tea served in the drawing room with Lady Wren and ' +
          'Mrs. R. Ashford. Departed before supper. No irregularity noted.',
        relevant: false,
        note:
          'A recent visitor log entry — correct source, correct timeframe. ' +
          'But she was admitted, not refused. The query asked for a named visitor who was turned away.',
      },
      {
        id: 'r-access-c',
        source: 'Visitor Log · Oct 29',
        excerpt:
          'Col. R. Ashford arrived unannounced at the main entrance, 4:40 PM. His Lordship ' +
          'refused to receive him. Col. Ashford remained in the entrance hall near twenty minutes ' +
          'before departing — in evident agitation, per Mr. Finch\'s notation. No appointment recorded.',
        relevant: true,
        note:
          'Specific name, specific date, specific outcome. Four days before the murder, Ashford ' +
          'arrived without warning, was turned away, and left visibly agitated. Recent. Relevant.',
      },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────

type Step = 'intro' | 'letter' | 'archive' | 'reveal' | 'done'

export default function LibraryRoom({ onClueCollected, onBack }: Props) {
  const [step,          setStep]          = useState<Step>('intro')
  const [activeQueryId, setActiveQueryId] = useState<string>(QUERIES[0].id)
  const [resolved,      setResolved]      = useState<Record<string, string>>({}) // queryId → resultId
  const [wrongPick,     setWrongPick]     = useState<string | null>(null) // resultId that was just wrong

  const clue        = CLUES['library-cipher']
  const allResolved = QUERIES.every(q => resolved[q.id])
  const activeQuery = QUERIES.find(q => q.id === activeQueryId)!
  const doneCount   = Object.keys(resolved).length

  function pickResult(queryId: string, result: ArchiveResult) {
    playPop()

    if (result.relevant) {
      playCorrect()
      setResolved(prev => ({ ...prev, [queryId]: result.id }))
      setWrongPick(null)
    } else {
      setWrongPick(result.id)
    }
  }

  function selectQuery(id: string) {
    playClick()
    setActiveQueryId(id)
    setWrongPick(null)
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="lib-root">

      {/* Topbar */}
      <div className="lib-topbar">
        <button className="lib-back" onClick={() => { playClick(); onBack() }}>← Manor</button>
        <span className="lib-room-label">📚 The Library</span>
        {step === 'archive' && (
          <span className="lib-step-hint">
            {doneCount < QUERIES.length
              ? `${doneCount} of ${QUERIES.length} queries resolved`
              : 'All queries resolved — analyse your findings'}
          </span>
        )}
      </div>

      <div className="lib-body">

        {/* ── INTRO ──────────────────────────────────────────────── */}
        {step === 'intro' && (
          <div className="lib-scene" onClick={() => { playPop(); setStep('letter') }}>
            <img src={libraryBg} className="lib-scene-bg" alt="Library" />
            <div className="lib-scene-vignette" />
            <div className="lib-narration-panel">
              <p className="lib-narration-text">
                The Library has not been disturbed. Floor-to-ceiling shelves — decades of ledgers,
                correspondence, estate records. The whole history of Blackwood Manor bound in leather
                and dust.
              </p>
              <p className="lib-narration-text">
                On the reading table: a volume left open, spine cracked. The hollowed cover
                conceals something — a letter, sealed shut, tucked against the boards.
              </p>
              <span className="lib-narration-hint">Click to examine →</span>
            </div>
          </div>
        )}

        {/* ── LETTER ─────────────────────────────────────────────── */}
        {step === 'letter' && (
          <div className="lib-scene">
            <img src={libraryBg} className="lib-scene-bg dim" alt="Library" />
            <div className="lib-letter-card">
              <div className="lib-letter-header">
                <span className="lib-letter-icon">🔐</span>
                <div>
                  <h2 className="lib-letter-title">A Cipher Letter</h2>
                  <p className="lib-letter-sub">Found in the hollowed cover of <em>Blackstone's Commentaries, Vol. III</em></p>
                </div>
              </div>

              <div className="lib-letter-body">
                <p className="lib-letter-text">
                  The seal has been broken before — carefully, and reapplied. The decoded text reads:
                </p>
                <blockquote className="lib-letter-quote">
                  <p>
                    "You know what is owed. The usual terms were agreed upon in good faith and have
                    been refused without explanation now for two years. I will not be made to
                    disappear quietly. What was promised will be honoured — or the matter
                    will be settled by other means."
                  </p>
                  <p className="lib-letter-sig">— Sealed with the serpent. Addressed to R.B.</p>
                </blockquote>
                <div className="lib-letter-flags">
                  <span className="lib-flag">⚠ "Two years" — when did the dispute begin?</span>
                  <span className="lib-flag">⚠ Who uses the serpent seal?</span>
                  <span className="lib-flag">⚠ "Other means" — a threat?</span>
                </div>
              </div>

              <button
                className="lib-primary-btn"
                onClick={() => { playClick(); setStep('archive') }}
              >
                Search the Manor Archive
              </button>
            </div>
          </div>
        )}

        {/* ── ARCHIVE ────────────────────────────────────────────── */}
        {step === 'archive' && (
          <div className="lib-archive">

            {/* Query sidebar */}
            <div className="lib-query-sidebar">
              <p className="lib-sidebar-label">Search Queries</p>
              {QUERIES.map(q => {
                const done = !!resolved[q.id]
                const active = q.id === activeQueryId
                return (
                  <button
                    key={q.id}
                    className={`lib-query-btn ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                    onClick={() => selectQuery(q.id)}
                  >
                    <span className="lib-query-status">{done ? '✓' : '○'}</span>
                    <span className="lib-query-label">{q.label}</span>
                  </button>
                )
              })}

              {allResolved && (
                <button
                  className="lib-primary-btn full"
                  onClick={() => { playClick(); setStep('reveal') }}
                >
                  Analyse Findings
                </button>
              )}
            </div>

            {/* Results pane */}
            <div className="lib-results-pane">
              <div className="lib-query-header">
                <span className="lib-query-icon">🔎</span>
                <p className="lib-query-text">{activeQuery.question}</p>
              </div>

              {resolved[activeQuery.id] ? (
                /* Already resolved — show the correct result with its note */
                <div className="lib-resolved-banner">
                  <span className="lib-resolved-check">✓</span>
                  <p>Most relevant record identified.</p>
                </div>
              ) : (
                <p className="lib-results-instr">
                  Select the record that best answers this query.
                </p>
              )}

              <div className="lib-result-list">
                {activeQuery.results.map(result => {
                  const isResolved   = resolved[activeQuery.id] === result.id
                  const wasPickedWrong = wrongPick === result.id
                  const showNote = isResolved || wasPickedWrong

                  return (
                    <button
                      key={result.id}
                      className={`lib-result ${isResolved ? 'correct' : ''} ${wasPickedWrong ? 'wrong' : ''}`}
                      onClick={() => {
                        if (resolved[activeQuery.id]) return
                        pickResult(activeQuery.id, result)
                      }}
                      disabled={!!resolved[activeQuery.id] && !isResolved}
                    >
                      <div className="lib-result-source">{result.source}</div>
                      <p className="lib-result-excerpt">{result.excerpt}</p>
                      {showNote && (
                        <div className={`lib-result-note ${result.relevant ? 'relevant' : 'irrelevant'}`}>
                          <span>{result.relevant ? '↳ Retrieved:' : '↳ Noise:'}</span>
                          {result.note}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── REVEAL ─────────────────────────────────────────────── */}
        {step === 'reveal' && (
          <div className="lib-reveal">
            <div className="lib-reveal-card">
              <h2 className="lib-reveal-title">The Archive Speaks</h2>
              <p className="lib-reveal-intro">
                Three searches. Three records retrieved. Cross-referenced against the cipher letter,
                the pattern becomes unmistakable.
              </p>

              <div className="lib-evidence-chain">

                <div className="lib-evidence-item">
                  <div className="lib-evidence-num">1</div>
                  <div className="lib-evidence-body">
                    <p className="lib-evidence-source">Estate Ledger · 1887</p>
                    <p className="lib-evidence-text">
                      Colonel Ashford advanced £600 to Lord Blackwood in 1885. Repayment was
                      refused in 1886 — and again, by all accounts, ever since. "Indefinitely
                      deferred." Two years unresolved at the time of the letter.
                    </p>
                  </div>
                </div>

                <div className="lib-chain-arrow">↓</div>

                <div className="lib-evidence-item">
                  <div className="lib-evidence-num">2</div>
                  <div className="lib-evidence-body">
                    <p className="lib-evidence-source">Guest Register · Nov 1883</p>
                    <p className="lib-evidence-text">
                      The serpent seal belongs to Colonel Ashford — confirmed across two
                      recorded correspondences. The cipher letter was not anonymous.
                      It was his ultimatum.
                    </p>
                  </div>
                </div>

                <div className="lib-chain-arrow">↓</div>

                <div className="lib-evidence-item">
                  <div className="lib-evidence-num">3</div>
                  <div className="lib-evidence-body">
                    <p className="lib-evidence-source">Visitor Log · Oct 29</p>
                    <p className="lib-evidence-text">
                      Four days before the murder, Ashford arrived unannounced and was turned
                      away. He left in evident agitation. Lord Blackwood refused to receive him —
                      just as he had refused to repay him.
                    </p>
                  </div>
                </div>

              </div>

              <div className="lib-conclusion">
                <span className="lib-conclusion-icon">🔐</span>
                <p>
                  Colonel Ashford had a financial grievance stretching back two years, used the
                  serpent seal on private ultimatums to Lord Blackwood, and was refused entry
                  to the manor days before the death. The cipher letter was not a puzzle —
                  it was a final warning.
                </p>
              </div>

              <div className="lib-rag-note">
                <span className="lib-rag-icon">💡</span>
                <p>
                  <em>The archive contained thousands of records. The right ones surfaced only
                  because the queries were precise — not matching words, but <strong>meaning</strong>.
                  "Serpent" returned a snake and a letter-opener before it returned its author.
                  This is <strong>retrieval</strong>: finding the documents whose context answers
                  the question, not merely the ones that share its vocabulary.</em>
                </p>
              </div>

              <button
                className="lib-primary-btn"
                onClick={() => {
                  playCorrect()
                  onClueCollected(clue.id)
                  setStep('done')
                }}
              >
                File the Evidence
              </button>
            </div>
          </div>
        )}

        {/* ── DONE ───────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="lib-scene">
            <img src={libraryBg} className="lib-scene-bg dim" alt="Library" />
            <div className="lib-done-card">
              <span className="lib-clue-icon">🔐</span>
              <h2 className="lib-done-title">Clue Collected</h2>
              <p className="lib-done-clue-name">{clue.title}</p>
              <p className="lib-done-summary">{clue.summary}</p>
              <p className="lib-done-unlock">
                Colonel Ashford's quarters are now accessible. Find him before he finds
                a reason to leave.
              </p>
              <button className="lib-primary-btn" onClick={() => { playClick(); onBack() }}>
                Return to Manor
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
