import { useState } from 'react'
import wrenPortrait from '@/assets/mystery/portraits/Lady Wreb.png'
import bedroomBg    from '@/assets/mystery/rooms/bedroom.png'
import { CLUES }     from '../data/clues'
import { playClick, playCorrect, playPop, playWrong } from '@/lib/sounds'
import './BedroomRoom.css'

interface Props {
  onClueCollected: (clueId: string) => void
  onBack: () => void
}

// ─── Puzzle data ──────────────────────────────────────────────────

// Round 1 — the pre-written bad query and its noise results
const R1_QUERY = 'What do the staff know about Lady Wren?'

const R1_RESULTS = [
  { id: 'r1a', source: 'Guest Register · Oct 30',
    text: 'Lady C. Wren arrived by private carriage, 4:15 PM. Two trunks, one valise. Assigned east guest chamber.' },
  { id: 'r1b', source: 'Household Preferences · undated',
    text: 'Lady Wren: light suppers preferred. No oysters. Tea at seven sharp.' },
  { id: 'r1c', source: 'Social Register · 1891',
    text: 'Lady Wren attended the Blackwood summer assembly, June. Departed three days later.' },
  { id: 'r1d', source: 'Staff Observation · Nov 2',
    text: 'Lady Wren complimented Mrs. Bramble on the veal stock. Noted as pleasant with the kitchen staff.' },
]

const R1_DIAGNOSE = [
  { id: 'd-correct',
    text: 'The query asked what staff "know" about her — it retrieved general impressions, not documented events from that specific evening.',
    correct: true },
  { id: 'd-wrong1',
    text: 'The results are correct but out of order — the most relevant record exists but was ranked too low to surface.',
    correct: false },
  { id: 'd-wrong2',
    text: 'The query retrieved everything available. The archive simply contains no records from the night of November 3rd.',
    correct: false },
]

// Round 2 — player rewrites the query
const R2_REWRITES = [
  { id: 'r2-correct',
    text: 'What was Lady Wren doing on the evening of November 3rd?',
    correct: true,
    feedback: 'Specific event, specific date — now you\'re asking about the right window.' },
  { id: 'r2-wrong1',
    text: 'Who interacted with Lady Wren on the night of November 3rd?',
    correct: false,
    feedback: 'This asks who spoke to her, not where she went. The maid\'s note records her absence — it wouldn\'t surface for a query about interactions.' },
  { id: 'r2-wrong2',
    text: 'What do staff records say about Lady Wren\'s behaviour during her visit?',
    correct: false,
    feedback: 'Still asking for general impressions across the whole visit — the same problem as before. You need a specific date, not the entire stay.' },
]

const R2_RESULTS = [
  { id: 'r2a', source: 'Drawing Room Log · Nov 3, 8:00 PM',
    text: 'Present: Lord and Lady Ashford, Mrs. Hartley, Lady Wren. Card game in progress. Atmosphere described as subdued.',
    significant: false },
  { id: 'r2b', source: 'Lady\'s Maid Note · Nov 3',
    text: 'Lady Wren excused herself from the drawing room at 9:28 PM to retrieve her shawl from her chamber. She returned at 9:52 PM. Her complexion was slightly flushed upon her return.',
    significant: true },
  { id: 'r2c', source: 'Evening Staff Schedule · Nov 3',
    text: 'East wing corridor: no staff assigned between 9:00 PM and 11:00 PM. Butler retired to pantry at quarter past nine.',
    significant: false },
]

const R2_FOCUS = [
  { id: 'f-correct',
    text: 'The lady\'s maid note — an unexplained twenty-four-minute absence with a stated reason that can be checked.',
    correct: true },
  { id: 'f-wrong1',
    text: 'The drawing room log — it places her in the manor and gives a starting point for her movements that evening.',
    correct: false,
    feedback: 'The log confirms her presence at 8 PM but says nothing about the gap later. It\'s the alibi, not the crack in it.' },
  { id: 'f-wrong2',
    text: 'The staff schedule — if the east corridor was unstaffed, she could have moved freely without observation.',
    correct: false,
    feedback: 'Absence of witnesses is notable, but it doesn\'t verify or contradict anything she\'s claimed. There\'s nothing here to follow up.' },
]

// Round 3 — sharpen to the specific anomaly
const R3_REWRITES = [
  { id: 'r3-correct',
    text: 'Was Lady Wren\'s shawl in her bedroom on the evening of November 3rd?',
    correct: true,
    feedback: 'This fact-checks her stated reason directly. Either the shawl was there or it wasn\'t.' },
  { id: 'r3-wrong1',
    text: 'Which staff were present in the east wing between 9:00 PM and 11:00 PM on November 3rd?',
    correct: false,
    feedback: 'The staff schedule already confirmed the east wing was empty in that window. Another query returns the same answer — no witnesses, no new information.' },
  { id: 'r3-wrong2',
    text: 'Was Lady Wren seen leaving or returning to the east guest wing on the night of November 3rd?',
    correct: false,
    feedback: 'Without anyone in that corridor, no sighting was recorded — this query returns nothing useful. The verifiable claim is the shawl. Test the reason she gave.' },
]

const R3_RESULT = {
  source: 'Chambermaid Note · Nov 3',
  text: 'Chamber prepared for Lady Wren at 7:45 PM. Cream wool shawl observed hanging on the wardrobe door. Room checked again at 10:30 PM upon Lady Wren\'s retirement — shawl noted in precisely the same position, undisturbed. Lady Wren did not return to her chamber between these times.',
}

// ─── Dialogue data ────────────────────────────────────────────────

const INTRO_LINES = [
  "I trust you have a reason for being in my chambers. This is most irregular.",
  "I was in the drawing room the entire evening. Lady Ashford and Mrs. Hartley will confirm it. I left briefly to retrieve my shawl — twenty minutes at most. I was cold.",
  "You are welcome to search this room if it will satisfy your curiosity. You will find nothing of consequence.",
]

const CONFRONT_LINES = [
  "Twenty-four minutes. You have timed it to the minute. How very thorough of you.",
  "The shawl... I may have asked a servant to fetch it rather than going myself. Memory is imperfect in moments of grief.",
  "Where exactly did you find that? It is a personal medicine — prescribed by Dr. Erskine for my nerves. The residue is nothing.",
  "I have nothing further to say to you. Nothing at all.",
]

// ─── Component ────────────────────────────────────────────────────

type Step    = 'intro' | 'query' | 'discovery' | 'confront' | 'done'
type QPhase  = 'r1-query' | 'r1-results' | 'r1-diagnose'
             | 'r2-write' | 'r2-results' | 'r2-focus'
             | 'r3-write' | 'r3-results'

export default function BedroomRoom({ onClueCollected, onBack }: Props) {
  const [step,        setStep]        = useState<Step>('intro')
  const [introIdx,    setIntroIdx]    = useState(0)
  const [qPhase,      setQPhase]      = useState<QPhase>('r1-query')
  const [wrongId,     setWrongId]     = useState<string | null>(null)
  const [confrontIdx, setConfrontIdx] = useState(0)

  const clue = CLUES['wren-poison']

  // ── Dialogue helpers ────────────────────────────────────────────
  function advanceIntro() {
    playPop()
    if (introIdx < INTRO_LINES.length - 1) {
      setIntroIdx(i => i + 1)
    } else {
      setStep('query')
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

  // ── Puzzle helpers ──────────────────────────────────────────────
  function pick(id: string, correct: boolean, next: QPhase) {
    if (correct) {
      playCorrect()
      setWrongId(null)
      setQPhase(next)
    } else {
      playWrong()
      setWrongId(id)
    }
  }

  // ─────────────────────────────────────────────────────────────────
  const roundLabels: Record<QPhase, string> = {
    'r1-query':   'Round 1 of 3 — Initial Query',
    'r1-results': 'Round 1 of 3 — Results',
    'r1-diagnose':'Round 1 of 3 — Diagnose the Failure',
    'r2-write':   'Round 2 of 3 — Rewrite the Query',
    'r2-results': 'Round 2 of 3 — Results',
    'r2-focus':   'Round 2 of 3 — Identify the Lead',
    'r3-write':   'Round 3 of 3 — Sharpen the Query',
    'r3-results': 'Round 3 of 3 — Decisive Evidence',
  }

  return (
    <div className="bed-root">

      {/* Topbar */}
      <div className="bed-topbar">
        <button className="bed-back" onClick={() => { playClick(); onBack() }}>← Manor</button>
        <span className="bed-room-label">🕯️ Lady Wren's Chambers</span>
        {step === 'query' && (
          <span className="bed-step-hint">{roundLabels[qPhase]}</span>
        )}
      </div>

      <div className="bed-body">

        {/* ── INTRO: Lady Wren states her alibi ─────────────────── */}
        {step === 'intro' && (
          <div className="bed-dialogue-scene" onClick={advanceIntro}>
            <img src={bedroomBg} className="bed-scene-bg" alt="Lady Wren's Chambers" />
            <div className="bed-scene-atmosphere" />
            <div className="bed-dialogue-panel">
              <div className="bed-portrait-wrap">
                <img src={wrenPortrait} className="bed-portrait" alt="Lady Wren" />
                <p className="bed-portrait-name">Lady Wren · Guest</p>
              </div>
              <div className="bed-speech-box">
                <p className="bed-speech-text">{INTRO_LINES[introIdx]}</p>
                <span className="bed-speech-hint">
                  {introIdx < INTRO_LINES.length - 1 ? 'Continue →' : 'Begin investigation →'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── QUERY: the archive puzzle ─────────────────────────── */}
        {step === 'query' && (
          <div className="bed-archive">

            {/* Progress rail */}
            <div className="bed-progress-rail">
              {(['r1', 'r2', 'r3'] as const).map((r, i) => {
                const done = (r === 'r1' && !['r1-query','r1-results','r1-diagnose'].includes(qPhase))
                          || (r === 'r2' && ['r3-write','r3-results'].includes(qPhase))
                          || (r === 'r3' && qPhase === 'r3-results' && false) // complete shown inline
                const active = qPhase.startsWith(r)
                return (
                  <div key={r} className={`bed-progress-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                    <span className="bed-progress-num">{done ? '✓' : i + 1}</span>
                    <span className="bed-progress-label">
                      {r === 'r1' ? 'Diagnose' : r === 'r2' ? 'Rewrite' : 'Sharpen'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Main panel */}
            <div className="bed-archive-main">

              {/* ── R1: show the bad query ── */}
              {qPhase === 'r1-query' && (
                <div className="bed-query-panel">
                  <p className="bed-panel-label">Initial Query</p>
                  <div className="bed-query-box bad">
                    <span className="bed-query-tag">⚠ Broad</span>
                    <p className="bed-query-text">"{R1_QUERY}"</p>
                  </div>
                  <p className="bed-panel-note">
                    This is where the investigation begins. Run the query against the household records
                    and see what it surfaces.
                  </p>
                  <button className="bed-primary-btn" onClick={() => { playClick(); setQPhase('r1-results') }}>
                    Run Query
                  </button>
                </div>
              )}

              {/* ── R1: noise results ── */}
              {qPhase === 'r1-results' && (
                <div className="bed-results-panel">
                  <p className="bed-panel-label">Results — "{R1_QUERY}"</p>
                  <div className="bed-result-list">
                    {R1_RESULTS.map(r => (
                      <div key={r.id} className="bed-result noise">
                        <span className="bed-result-source">{r.source}</span>
                        <p className="bed-result-text">{r.text}</p>
                      </div>
                    ))}
                  </div>
                  <p className="bed-panel-note muted">
                    The archive returned four records — none of them useful to the investigation.
                    Before trying again, identify the problem.
                  </p>
                  <button className="bed-primary-btn" onClick={() => { playClick(); setQPhase('r1-diagnose') }}>
                    Diagnose the Query →
                  </button>
                </div>
              )}

              {/* ── R1: why did it fail? ── */}
              {qPhase === 'r1-diagnose' && (
                <div className="bed-diagnose-panel">
                  <p className="bed-panel-label">Why did the query fail?</p>
                  <p className="bed-panel-note">Select the most accurate diagnosis.</p>
                  <div className="bed-option-list">
                    {R1_DIAGNOSE.map(opt => (
                      <button
                        key={opt.id}
                        className={`bed-option ${wrongId === opt.id ? 'wrong' : ''}`}
                        onClick={() => pick(opt.id, opt.correct, 'r2-write')}
                      >
                        {opt.text}
                        {wrongId === opt.id && (
                          <span className="bed-option-feedback">Look more carefully at what the query asked.</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── R2: rewrite the query ── */}
              {qPhase === 'r2-write' && (
                <div className="bed-diagnose-panel">
                  <p className="bed-panel-label">Rewrite the Query</p>
                  <p className="bed-panel-note">
                    The original asked about general impressions. Choose a query that retrieves
                    documented events from the specific evening.
                  </p>
                  <div className="bed-option-list">
                    {R2_REWRITES.map(opt => (
                      <button
                        key={opt.id}
                        className={`bed-option query ${wrongId === opt.id ? 'wrong' : ''}`}
                        onClick={() => pick(opt.id, opt.correct, 'r2-results')}
                      >
                        <span className="bed-option-query-icon">🔎</span>
                        {opt.text}
                        {wrongId === opt.id && (
                          <span className="bed-option-feedback">{opt.feedback}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── R2: better results ── */}
              {qPhase === 'r2-results' && (
                <div className="bed-results-panel">
                  <p className="bed-panel-label">Results — "What was Lady Wren doing on the evening of November 3rd?"</p>
                  <div className="bed-result-list">
                    {R2_RESULTS.map(r => (
                      <div key={r.id} className={`bed-result ${r.significant ? 'significant' : 'noise'}`}>
                        <span className="bed-result-source">
                          {r.significant && <span className="bed-result-flag">◆ </span>}
                          {r.source}
                        </span>
                        <p className="bed-result-text">{r.text}</p>
                      </div>
                    ))}
                  </div>
                  <p className="bed-panel-note muted">
                    Better. Three records retrieved. One contains something that demands attention.
                  </p>
                  <button className="bed-primary-btn" onClick={() => { playClick(); setQPhase('r2-focus') }}>
                    Identify the Lead →
                  </button>
                </div>
              )}

              {/* ── R2: identify the lead ── */}
              {qPhase === 'r2-focus' && (
                <div className="bed-diagnose-panel">
                  <p className="bed-panel-label">Which record warrants a follow-up query?</p>
                  <div className="bed-option-list">
                    {R2_FOCUS.map(opt => (
                      <button
                        key={opt.id}
                        className={`bed-option ${wrongId === opt.id ? 'wrong' : ''}`}
                        onClick={() => pick(opt.id, opt.correct, 'r3-write')}
                      >
                        {opt.text}
                        {wrongId === opt.id && (
                          <span className="bed-option-feedback">{opt.feedback}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── R3: sharpen to the shawl ── */}
              {qPhase === 'r3-write' && (
                <div className="bed-diagnose-panel">
                  <p className="bed-panel-label">Sharpen the Query</p>
                  <p className="bed-panel-note">
                    Her stated reason was the shawl. A precise query fact-checks a specific,
                    verifiable claim — not a broad suspicion.
                  </p>
                  <div className="bed-option-list">
                    {R3_REWRITES.map(opt => (
                      <button
                        key={opt.id}
                        className={`bed-option query ${wrongId === opt.id ? 'wrong' : ''}`}
                        onClick={() => pick(opt.id, opt.correct, 'r3-results')}
                      >
                        <span className="bed-option-query-icon">🔎</span>
                        {opt.text}
                        {wrongId === opt.id && (
                          <span className="bed-option-feedback">{opt.feedback}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── R3: the decisive result ── */}
              {qPhase === 'r3-results' && (
                <div className="bed-results-panel">
                  <p className="bed-panel-label">Results — "Was Lady Wren's shawl in her bedroom on the evening of November 3rd?"</p>
                  <div className="bed-result decisive">
                    <span className="bed-result-source">
                      <span className="bed-result-flag">◆ </span>
                      {R3_RESULT.source}
                    </span>
                    <p className="bed-result-text">{R3_RESULT.text}</p>
                  </div>
                  <div className="bed-verdict">
                    <span className="bed-verdict-icon">⚠</span>
                    <p>
                      The shawl never moved. Lady Wren did not return to her chamber.
                      For twenty-four minutes, she was somewhere else in this manor.
                    </p>
                  </div>
                  <div className="bed-rag-note">
                    <span>💡</span>
                    <p>
                      <em>Three queries, each more precise than the last. The first retrieved noise.
                      The second retrieved a lead. The third retrieved a fact that <strong>contradicts
                      a specific claim</strong>. This is <strong>query rewriting</strong>: refining
                      what you ask until the retrieval system can surface what you actually need.</em>
                    </p>
                  </div>
                  <button className="bed-primary-btn" onClick={() => { playClick(); setStep('discovery') }}>
                    Search the Room →
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── DISCOVERY: the vial ───────────────────────────────── */}
        {step === 'discovery' && (
          <div className="bed-discovery">
            <div className="bed-scene-atmosphere" />
            <div className="bed-discovery-card">
              <p className="bed-discovery-lead">
                The archive has placed her somewhere she should not have been.
                Now search the room itself.
              </p>
              <div className="bed-search-areas">
                <button className="bed-area" onClick={() => playPop()}>
                  <span>🪞</span> Vanity
                  <span className="bed-area-result">A hairbrush, two letters from London. Nothing relevant.</span>
                </button>
                <button className="bed-area" onClick={() => playPop()}>
                  <span>📦</span> Travel Trunk
                  <span className="bed-area-result">Clothing, a journal written in French, pressed flowers.</span>
                </button>
                <button
                  className="bed-area fireplace"
                  onClick={() => { playCorrect(); setStep('confront') }}
                >
                  <span>🔥</span> Fireplace Grate
                  <span className="bed-area-result">Something is wedged between the irons —</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CONFRONT: the vial exposed ────────────────────────── */}
        {step === 'confront' && (
          <div className="bed-dialogue-scene confronting" onClick={advanceConfront}>
            <img src={bedroomBg} className="bed-scene-bg dim" alt="Lady Wren's Chambers" />
            <div className="bed-scene-atmosphere" />
            <div className="bed-dialogue-panel">
              <div className="bed-portrait-wrap">
                <img src={wrenPortrait} className="bed-portrait rattled" alt="Lady Wren" />
                <p className="bed-portrait-name">Lady Wren · Guest</p>
              </div>
              <div className="bed-speech-box confronting">
                <div className="bed-evidence-tag">
                  {confrontIdx === 0 && '📋 Presenting: 24-minute gap, 9:28–9:52 PM'}
                  {confrontIdx === 1 && '🧣 Presenting: Shawl — never moved from wardrobe door'}
                  {confrontIdx === 2 && '🧪 Presenting: Empty vial, aconitine residue'}
                  {confrontIdx === 3 && '🔍 Observation'}
                </div>
                <p className="bed-speech-text">{CONFRONT_LINES[confrontIdx]}</p>
                <span className="bed-speech-hint">
                  {confrontIdx < CONFRONT_LINES.length - 1 ? 'Press further →' : 'File the evidence →'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── DONE ─────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="bed-done">
            <div className="bed-scene-atmosphere" />
            <div className="bed-done-card">
              <span className="bed-clue-icon">🧪</span>
              <h2 className="bed-done-title">Clue Collected</h2>
              <p className="bed-done-clue-name">{clue.title}</p>
              <p className="bed-done-summary">{clue.summary}</p>
              <p className="bed-done-unlock">
                Lady Wren has no explanation for the vial. The drawing room is now accessible —
                where other answers may be waiting.
              </p>
              <button className="bed-primary-btn" onClick={() => { playClick(); onBack() }}>
                Return to Manor
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
