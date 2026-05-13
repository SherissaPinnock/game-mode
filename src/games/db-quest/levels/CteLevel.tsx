import { useEffect, useRef, useState } from 'react'
import { playClick, playComplete, playCorrect, playNextLevel, playPop, playWrong } from '@/lib/sounds'
import { useMobilePhaseFocus } from '../hooks/useMobilePhaseFocus'

type Phase =
  | 'pain'
  | 'concept'
  | 'syntax'
  | 'blank'
  | 'chain'
  | 'untangle'
  | 'bonus'
  | 'complete'

interface Props {
  onComplete: () => void
  onBack: () => void
}

interface ChunkDef {
  id: string
  clue: string
  sql: string
  dependsOn: string[]
  exampleName: string
  keywordGroups: string[][]
}

interface ConnectionPath {
  id: string
  d: string
  broken: boolean
}

interface NameCheck {
  ok: boolean
  message: string
}

const MONSTER_QUERY = `SELECT suspects.name, suspect_rollup.report_count
FROM suspects
JOIN (
  SELECT suspect_id, COUNT(*) AS report_count
  FROM (
    SELECT witness_reports.suspect_id
    FROM witness_reports
    WHERE witness_reports.case_id IN (
      SELECT cases.id
      FROM cases
      WHERE cases.status = 'open'
    )
  ) open_case_mentions
  GROUP BY suspect_id
) suspect_rollup
  ON suspect_rollup.suspect_id = suspects.id
WHERE suspect_rollup.report_count >= 2
ORDER BY suspect_rollup.report_count DESC;`

const SIMPLE_CTE = `WITH adults AS (
  SELECT *
  FROM users
  WHERE age >= 18
)
SELECT name
FROM adults;`

const CHAIN_CHUNKS: ChunkDef[] = [
  {
    id: 'adults',
    clue: 'Step 1: find adults',
    sql: `SELECT id, name, email
FROM users
WHERE age >= 18`,
    dependsOn: [],
    exampleName: 'adults',
    keywordGroups: [['adult']],
  },
  {
    id: 'adult_emails',
    clue: 'Step 2: keep only email columns',
    sql: `SELECT name, email
FROM adults`,
    dependsOn: ['adults'],
    exampleName: 'adult_emails',
    keywordGroups: [['adult'], ['email', 'emails']],
  },
]

const CASE_CHUNKS: ChunkDef[] = [
  {
    id: 'open_cases',
    clue: 'Evidence A: the open cases we still care about',
    sql: `SELECT id
FROM cases
WHERE status = 'open'`,
    dependsOn: [],
    exampleName: 'open_cases',
    keywordGroups: [['open'], ['case', 'cases']],
  },
  {
    id: 'open_case_mentions',
    clue: 'Evidence B: witness reports tied to those open cases',
    sql: `SELECT witness_reports.suspect_id
FROM witness_reports
JOIN open_cases
  ON open_cases.id = witness_reports.case_id`,
    dependsOn: ['open_cases'],
    exampleName: 'open_case_mentions',
    keywordGroups: [['open'], ['case', 'cases'], ['mention', 'mentions', 'report', 'reports']],
  },
  {
    id: 'suspect_report_totals',
    clue: 'Evidence C: count how many reports mention each suspect',
    sql: `SELECT suspect_id, COUNT(*) AS report_count
FROM open_case_mentions
GROUP BY suspect_id`,
    dependsOn: ['open_case_mentions'],
    exampleName: 'suspect_report_totals',
    keywordGroups: [['suspect', 'suspects'], ['count', 'counts', 'total', 'totals', 'report']],
  },
]

const CASE_RESULTS = [
  { suspect: 'Mara Voss', reportCount: 4 },
  { suspect: 'Eli Mercer', reportCount: 3 },
  { suspect: 'June Holloway', reportCount: 2 },
]

const PHASE_LABELS: Record<Phase, string> = {
  pain: '1 · Feel It',
  concept: '2 · The Idea',
  syntax: '3 · Tiny Syntax',
  blank: '4 · Fill It',
  chain: '5 · Chain It',
  untangle: '6 · Solve It',
  bonus: '7 · Bonus',
  complete: '✓ Done',
}

const PHASE_ORDER: Phase[] = ['pain', 'concept', 'syntax', 'blank', 'chain', 'untangle', 'bonus', 'complete']

const FINAL_QUERY_SUFFIX = `SELECT suspects.name, suspect_report_totals.report_count
FROM suspect_report_totals
JOIN suspects
  ON suspects.id = suspect_report_totals.suspect_id
WHERE suspect_report_totals.report_count >= 2
ORDER BY suspect_report_totals.report_count DESC;`

const VAGUE_NAME_ROOTS = ['query', 'query1', 'query2', 'cte', 'cte1', 'cte2', 'temp', 'tmp', 'data', 'step', 'thing', 'stuff']

export default function CteLevel({ onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('pain')
  const levelBodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(max-width: 780px), (max-height: 620px) and (orientation: landscape)').matches) return

    const bodyEl = levelBodyRef.current
    if (!bodyEl) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.requestAnimationFrame(() => {
      bodyEl.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })
    })
  }, [phase])

  return (
    <div className="dbq-level">
      <div className="dbq-level-header">
        <button className="dbq-back-btn" onClick={() => { playClick(); onBack() }}>← Map</button>
        <div className="dbq-level-title">
          <span className="dbq-level-tag">Level 3</span>
          <span className="dbq-level-name">🕵️ The Query Chain</span>
        </div>
        <PhaseIndicator phase={phase} />
      </div>

      <div ref={levelBodyRef} className="dbq-level-body">
        {phase === 'pain' && <PainPhase onNext={() => setPhase('concept')} />}
        {phase === 'concept' && <ConceptPhase onNext={() => setPhase('syntax')} />}
        {phase === 'syntax' && <SyntaxPhase onNext={() => setPhase('blank')} />}
        {phase === 'blank' && <FillBlankPhase onNext={() => setPhase('chain')} />}
        {phase === 'chain' && <ChainPhase onNext={() => setPhase('untangle')} />}
        {phase === 'untangle' && <UntanglePhase onNext={() => setPhase('bonus')} />}
        {phase === 'bonus' && <BonusPhase onNext={() => setPhase('complete')} />}
        {phase === 'complete' && <CompletePhase onFinish={onComplete} />}
      </div>
    </div>
  )
}

function PhaseIndicator({ phase }: { phase: Phase }) {
  const idx = PHASE_ORDER.indexOf(phase)

  return (
    <div className="dbq-phase-indicator">
      {PHASE_ORDER.map((item, itemIdx) => (
        <div
          key={item}
          className={`dbq-phase-dot ${itemIdx < idx ? 'done' : itemIdx === idx ? 'active' : ''}`}
          title={PHASE_LABELS[item]}
        />
      ))}
    </div>
  )
}

function PainPhase({ onNext }: { onNext: () => void }) {
  const phaseFocusRef = useMobilePhaseFocus('cte-pain')
  const [pickedAnswer, setPickedAnswer] = useState<string | null>(null)

  const answers = [
    {
      id: 'correct',
      label: 'Find suspects mentioned in at least 2 open-case reports',
      response: 'That is the right answer, but notice how much tracing it took to prove it.',
    },
    {
      id: 'wrong-a',
      label: 'Find open cases that have no suspect reports yet',
      response: 'Easy mistake. The nesting hides the real story, which is exactly the pain point.',
    },
    {
      id: 'wrong-b',
      label: 'Count detectives assigned to each suspect',
      response: 'Totally reasonable guess. The query is doing too much work in too little space.',
    },
  ]

  const selected = answers.find(answer => answer.id === pickedAnswer)

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">A Cold Case Lands on Your Desk</h2>
        <p className="dbq-phase-sub">
          A previous analyst left this nested query behind. No explanation. No notes. Just this.
        </p>
      </div>

      <div className="dbq-cte-two-up">
        <div className="dbq-sql-snippet dbq-cte-monster">
          <div className="dbq-sql-label">Unlabeled case file</div>
          <pre className="dbq-sql-code">{MONSTER_QUERY}</pre>
        </div>

        <div className="dbq-cte-question-card">
          <h3 className="dbq-cte-card-title">What does this query do?</h3>
          <p className="dbq-cte-card-copy">
            Pick the description you think is right. No hints yet.
          </p>
          <div className="dbq-cte-answer-list">
            {answers.map(answer => (
              <button
                key={answer.id}
                className={`dbq-cte-answer-btn ${pickedAnswer === answer.id ? 'selected' : ''}`}
                onClick={() => {
                  playClick()
                  setPickedAnswer(answer.id)
                }}
              >
                {answer.label}
              </button>
            ))}
          </div>

          {selected && (
            <div className="dbq-outcome-box bad">
              <h4 className="dbq-outcome-title">That feeling is the lesson</h4>
              <p>{selected.response}</p>
              <p>
                The SQL works, but the logic is buried. Before we talk syntax, we need a cleaner way
                to think in steps.
              </p>
            </div>
          )}
        </div>
      </div>

      <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>
        Show me the cleaner approach →
      </button>
    </div>
  )
}

function ConceptPhase({ onNext }: { onNext: () => void }) {
  const phaseFocusRef = useMobilePhaseFocus('cte-concept')

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">CTEs Let You Work in Named Steps</h2>
        <p className="dbq-phase-sub">
          A <strong>CTE</strong> is like pinning one clue on the wall, giving it a name, and using it later.
          Instead of solving the whole case in one breath, you write down each step as you discover it.
        </p>
      </div>

      <div className="dbq-cte-analogy-grid">
        <div className="dbq-cte-analogy-card">
          <div className="dbq-cte-analogy-icon">🍳</div>
          <h3>Chef version</h3>
          <p>
            Prep onions in one bowl. Sauce in another. Then cook. You do not chop, simmer, and plate
            in one chaotic pan.
          </p>
        </div>
        <div className="dbq-cte-analogy-card">
          <div className="dbq-cte-analogy-icon">🕵️</div>
          <h3>Detective version</h3>
          <p>
            Open cases first. Then reports tied to those cases. Then suspects mentioned most often.
            Each note has a label, so the chain makes sense.
          </p>
        </div>
        <div className="dbq-cte-analogy-card">
          <div className="dbq-cte-analogy-icon">🧱</div>
          <h3>SQL version</h3>
          <p>
            A CTE is a named temporary result. You can build one step on top of another instead of
            nesting everything inside everything else.
          </p>
        </div>
      </div>

      <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>
        Show the smallest possible CTE →
      </button>
    </div>
  )
}

function SyntaxPhase({ onNext }: { onNext: () => void }) {
  const phaseFocusRef = useMobilePhaseFocus('cte-syntax')

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">Tiny Example, Just the Shape</h2>
        <p className="dbq-phase-sub">
          Keep the data boring so the structure stands out. This CTE only says: “save the adults step
          under a name, then query it.”
        </p>
      </div>

      <div className="dbq-sql-snippet dbq-cte-syntax-block">
        <div className="dbq-sql-label">Smallest useful pattern</div>
        <pre className="dbq-sql-code">{SIMPLE_CTE}</pre>
      </div>

      <div className="dbq-cte-anatomy-grid">
        <div className="dbq-cte-anatomy-card">
          <strong>WITH</strong>
          <span>starts the named-step section</span>
        </div>
        <div className="dbq-cte-anatomy-card">
          <strong>adults</strong>
          <span>the label for the saved step</span>
        </div>
        <div className="dbq-cte-anatomy-card">
          <strong>AS ( ... )</strong>
          <span>the query that defines that step</span>
        </div>
        <div className="dbq-cte-anatomy-card">
          <strong>SELECT ... FROM adults</strong>
          <span>the final query using the named step</span>
        </div>
      </div>

      <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>
        Let me fill one in →
      </button>
    </div>
  )
}

function FillBlankPhase({ onNext }: { onNext: () => void }) {
  const phaseFocusRef = useMobilePhaseFocus('cte-blank')
  const [name, setName] = useState('')
  const [checked, setChecked] = useState(false)

  const normalized = name.trim().toLowerCase()
  const isCorrect = normalized === 'adults'

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">First Muscle-Memory Rep</h2>
        <p className="dbq-phase-sub">
          Fill the missing CTE name. Keep it descriptive. Imagine another analyst will read it later.
        </p>
      </div>

      <div className="dbq-cte-fill-card">
        <div className="dbq-cte-fill-row">
          <span className="dbq-cte-token">WITH</span>
          <input
            className={`dbq-cte-name-input ${checked ? (isCorrect ? 'valid' : 'invalid') : ''}`}
            value={name}
            onChange={event => {
              setName(event.target.value)
              if (checked) setChecked(false)
            }}
            placeholder="name_this_step"
            aria-label="CTE name"
          />
          <span className="dbq-cte-token">AS ( SELECT * FROM users WHERE age &gt;= 18 )</span>
        </div>
        <pre className="dbq-sql-code dbq-cte-inline-code">{`SELECT name
FROM adults;`}</pre>

        <div className="dbq-index-actions">
          <button
            className="dbq-primary-btn"
            onClick={() => {
              setChecked(true)
              if (isCorrect) playCorrect()
              else playWrong()
            }}
          >
            Check name
          </button>
        </div>
      </div>

      {checked && !isCorrect && (
        <div className="dbq-outcome-box bad">
          <h4 className="dbq-outcome-title">Close, but make the step say what it is</h4>
          <p>
            The CTE filters users to adults, so the name should describe that result directly.
          </p>
        </div>
      )}

      {checked && isCorrect && (
        <div className="dbq-outcome-box good">
          <h4 className="dbq-outcome-title">Exactly</h4>
          <p>
            <strong>`adults`</strong> tells future-you what lives in that step without reading the whole query.
          </p>
        </div>
      )}

      <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }} disabled={!isCorrect}>
        Now chain two steps together →
      </button>
    </div>
  )
}

function ChainPhase({ onNext }: { onNext: () => void }) {
  const phaseFocusRef = useMobilePhaseFocus('cte-chain')
  const [slots, setSlots] = useState<Array<string | null>>([null, null])
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null)

  const solved = slots[0] === 'adults' && slots[1] === 'adult_emails'
  const allPlaced = slots.every(Boolean)

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">Two-Step Chaining</h2>
        <p className="dbq-phase-sub">
          Now the mental model changes: one CTE can build on the last. Drag or tap the evidence cards
          onto the board in the order SQL can actually read them.
        </p>
      </div>

      <EvidenceBoard
        boardKey={`chain-${slots.join('-')}-${selectedChunkId ?? 'none'}`}
        title="Practice board"
        subtitle="`adult_emails` depends on `adults`, so it cannot come first."
        chunks={CHAIN_CHUNKS}
        slots={slots}
        onChangeSlots={setSlots}
        selectedChunkId={selectedChunkId}
        onSelectChunk={setSelectedChunkId}
        editableNames={false}
        nameValues={{
          adults: 'adults',
          adult_emails: 'adult_emails',
        }}
        slotLabels={['Step 1', 'Step 2']}
      />

      {allPlaced && !solved && (
        <div className="dbq-outcome-box bad">
          <h4 className="dbq-outcome-title">Broken dependency</h4>
          <p>
            Red string means the second step is pointing backward. A CTE can only reference steps that
            were defined earlier.
          </p>
        </div>
      )}

      {solved && (
        <div className="dbq-outcome-box good">
          <h4 className="dbq-outcome-title">That’s the layering idea</h4>
          <p>
            First define <strong>`adults`</strong>, then define <strong>`adult_emails`</strong> from it.
            Each layer is simpler because the previous step already has a name.
          </p>
        </div>
      )}

      <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }} disabled={!solved}>
        Untangle the real case →
      </button>
    </div>
  )
}

function UntanglePhase({ onNext }: { onNext: () => void }) {
  const phaseFocusRef = useMobilePhaseFocus('cte-untangle')
  const [slots, setSlots] = useState<Array<string | null>>([null, null, null])
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null)
  const [nameValues, setNameValues] = useState<Record<string, string>>({
    open_cases: '',
    open_case_mentions: '',
    suspect_report_totals: '',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [executed, setExecuted] = useState(false)

  const allPlaced = slots.every(Boolean)
  const brokenDependencies = getBrokenDependencies(CASE_CHUNKS, slots)
  const nameChecks = Object.fromEntries(
    CASE_CHUNKS.map(chunk => [chunk.id, validateCteName(chunk, nameValues[chunk.id] ?? '')]),
  ) as Record<string, NameCheck>
  const boardSolved = isBoardSolved(CASE_CHUNKS, slots, nameValues)
  const assembledQuery = buildSolvedQuery(slots, nameValues)

  function placeGuard(chunkId: string) {
    const check = nameChecks[chunkId]
    if (check.ok) return true
    setFeedback(check.message)
    playWrong()
    return false
  }

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">The Untangle Challenge</h2>
        <p className="dbq-phase-sub">
          Same case file. New tools. Give each step a meaningful name, pin it in a legal order, and
          the final query will assemble itself at the bottom.
        </p>
      </div>

      <div className="dbq-cte-two-up">
        <div className="dbq-sql-snippet dbq-cte-monster">
          <div className="dbq-sql-label">Original spaghetti query</div>
          <pre className="dbq-sql-code">{MONSTER_QUERY}</pre>
        </div>

        <div className="dbq-cte-side-notes">
          <div className="dbq-cte-status-card">
            <span className="dbq-index-stage-tag">Case rules</span>
            <ul className="dbq-cte-rule-list">
              <li>Name each CTE before pinning it.</li>
              <li>Vague names like `query1` get rejected.</li>
              <li>Red string means a dependency points backward.</li>
            </ul>
          </div>

          <div className={`dbq-cte-status-card ${boardSolved ? 'solved' : ''}`}>
            <span className="dbq-index-stage-tag">{boardSolved ? 'Board ready' : 'Board check'}</span>
            <p>
              {boardSolved
                ? 'Every note is named clearly and every dependency flows forward.'
                : 'Pin the three evidence chunks, then make sure each dependent step comes after the step it needs.'}
            </p>
          </div>
        </div>
      </div>

      <EvidenceBoard
        boardKey={`untangle-${slots.join('-')}-${selectedChunkId ?? 'none'}-${Object.values(nameValues).join('-')}`}
        title="Detective board"
        subtitle="Drag or tap evidence onto the case wall. Click a pinned card to return it to the locker."
        chunks={CASE_CHUNKS}
        slots={slots}
        onChangeSlots={next => {
          setSlots(next)
          setFeedback(null)
          if (!executed) return
          setExecuted(false)
        }}
        selectedChunkId={selectedChunkId}
        onSelectChunk={setSelectedChunkId}
        editableNames
        nameValues={nameValues}
        onChangeName={(chunkId, value) => {
          setNameValues(prev => ({ ...prev, [chunkId]: value }))
          setFeedback(null)
        }}
        slotLabels={['Pin 1', 'Pin 2', 'Pin 3']}
        onBeforePlace={placeGuard}
        nameChecks={nameChecks}
      />

      {feedback && (
        <div className="dbq-outcome-box bad">
          <h4 className="dbq-outcome-title">Name rejected</h4>
          <p>{feedback}</p>
        </div>
      )}

      {!feedback && allPlaced && brokenDependencies.length > 0 && (
        <div className="dbq-outcome-box bad">
          <h4 className="dbq-outcome-title">The strings are telling on the board</h4>
          <p>
            {brokenDependencies[0].message}
          </p>
        </div>
      )}

      {!feedback && allPlaced && brokenDependencies.length === 0 && !boardSolved && (
        <div className="dbq-outcome-box bad">
          <h4 className="dbq-outcome-title">The order works, but some names are still too vague</h4>
          <p>
            Make the names say what each step contains. Think results, not filler words.
          </p>
        </div>
      )}

      {boardSolved && (
        <div className="dbq-outcome-box good">
          <h4 className="dbq-outcome-title">Board solved</h4>
          <p>
            Same logic, totally different readability. The query can now tell its story in named steps.
          </p>
        </div>
      )}

      <div className="dbq-cte-final-panel">
        <div className="dbq-sql-label">Clean query assembly</div>
        <pre className="dbq-sql-code">{assembledQuery}</pre>
        <div className="dbq-index-actions">
          <button
            className="dbq-primary-btn"
            onClick={() => {
              setExecuted(true)
              playComplete()
            }}
            disabled={!boardSolved}
          >
            Execute clean query
          </button>
          <button
            className="dbq-ghost-btn"
            onClick={() => {
              playClick()
              setSlots([null, null, null])
              setSelectedChunkId(null)
              setExecuted(false)
              setFeedback(null)
            }}
          >
            Clear board
          </button>
        </div>
      </div>

      {executed && boardSolved && (
        <div className="dbq-cte-solved-grid">
          <div className="dbq-compare-panel good done">
            <div className="dbq-compare-header good">Query result</div>
            <div className="dbq-compare-sub">Suspects named in at least two open-case reports</div>
            <div className="dbq-table-container">
              <table className="dbq-table compact">
                <thead>
                  <tr>
                    <th>suspect</th>
                    <th>report_count</th>
                  </tr>
                </thead>
                <tbody>
                  {CASE_RESULTS.map(row => (
                    <tr key={row.suspect}>
                      <td>{row.suspect}</td>
                      <td>{row.reportCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dbq-compare-panel good done">
            <div className="dbq-compare-header good">Aha moment</div>
            <p className="dbq-compare-sub">
              The result did not change. The readability did.
            </p>
            <div className="dbq-cte-aha-points">
              <div className="dbq-index-tip good">
                <strong>Meaningful names</strong> turn intermediate logic into readable notes.
              </div>
              <div className="dbq-index-tip good">
                <strong>Correct order</strong> keeps every CTE pointing only to what already exists.
              </div>
              <div className="dbq-index-tip good">
                <strong>Same output</strong> proves CTEs are usually a readability win, not a different answer.
              </div>
            </div>
          </div>
        </div>
      )}

      <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }} disabled={!executed}>
        Peek at the recursive bonus →
      </button>
    </div>
  )
}

function BonusPhase({ onNext }: { onNext: () => void }) {
  const phaseFocusRef = useMobilePhaseFocus('cte-bonus')

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">Recursive CTEs Are a Separate Skill Tree</h2>
        <p className="dbq-phase-sub">
          Regular CTEs name steps. <strong>Recursive</strong> CTEs are the special mode where a step can
          reference itself to walk a tree or hierarchy.
        </p>
      </div>

      <div className="dbq-cte-two-up">
        <div className="dbq-cte-bonus-card">
          <span className="dbq-index-stage-tag">Bonus unlock</span>
          <h3 className="dbq-cte-card-title">Best first use cases</h3>
          <ul className="dbq-cte-rule-list">
            <li>Org charts</li>
            <li>Family trees</li>
            <li>Category hierarchies</li>
            <li>Folder paths</li>
          </ul>
        </div>

        <div className="dbq-sql-snippet">
          <div className="dbq-sql-label">Tiny teaser</div>
          <pre className="dbq-sql-code">{`WITH RECURSIVE org_chart AS (
  SELECT id, manager_id, name
  FROM employees
  WHERE id = 1

  UNION ALL

  SELECT employees.id, employees.manager_id, employees.name
  FROM employees
  JOIN org_chart
    ON employees.manager_id = org_chart.id
)
SELECT *
FROM org_chart;`}</pre>
        </div>
      </div>

      <div className="dbq-outcome-box good">
        <h4 className="dbq-outcome-title">Not part of today’s core lesson</h4>
        <p>
          First get comfortable breaking queries into named layers. Recursive CTEs make more sense once
          that foundation feels natural.
        </p>
      </div>

      <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>
        Wrap up the case →
      </button>
    </div>
  )
}

function CompletePhase({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="dbq-phase-screen dbq-complete-screen">
      <div className="dbq-complete-hero">
        <div className="dbq-complete-icon">🧵</div>
        <h2 className="dbq-complete-title">Case Solved</h2>
        <p className="dbq-complete-sub">
          You turned one unreadable nested query into a chain of named steps another analyst can follow.
        </p>
      </div>

      <div className="dbq-lessons-grid">
        <div className="dbq-lesson-card">
          <div className="dbq-lesson-icon">🏷️</div>
          <div className="dbq-lesson-title">Naming matters</div>
          <p className="dbq-lesson-body">
            A good CTE name explains the result of the step, not just that a step exists.
          </p>
        </div>
        <div className="dbq-lesson-card">
          <div className="dbq-lesson-icon">↪️</div>
          <div className="dbq-lesson-title">Order matters</div>
          <p className="dbq-lesson-body">
            Each CTE can only point backward to steps already defined above it.
          </p>
        </div>
        <div className="dbq-lesson-card">
          <div className="dbq-lesson-icon">🧼</div>
          <div className="dbq-lesson-title">Readability is the payoff</div>
          <p className="dbq-lesson-body">
            CTEs often preserve the result while making the intent much easier to trace.
          </p>
        </div>
      </div>

      <button className="dbq-primary-btn large" onClick={() => { playClick(); onFinish() }}>
        Return to roadmap
      </button>
    </div>
  )
}

interface EvidenceBoardProps {
  boardKey: string
  title: string
  subtitle: string
  chunks: ChunkDef[]
  slots: Array<string | null>
  onChangeSlots: (slots: Array<string | null>) => void
  selectedChunkId: string | null
  onSelectChunk: (chunkId: string | null) => void
  editableNames: boolean
  nameValues: Record<string, string>
  onChangeName?: (chunkId: string, value: string) => void
  slotLabels: string[]
  onBeforePlace?: (chunkId: string) => boolean
  nameChecks?: Record<string, NameCheck>
}

function EvidenceBoard({
  boardKey,
  title,
  subtitle,
  chunks,
  slots,
  onChangeSlots,
  selectedChunkId,
  onSelectChunk,
  editableNames,
  nameValues,
  onChangeName,
  slotLabels,
  onBeforePlace,
  nameChecks,
}: EvidenceBoardProps) {
  const phaseFocusRef = useMobilePhaseFocus(boardKey)
  const boardRef = useRef<HTMLDivElement | null>(null)
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [draggingChunkId, setDraggingChunkId] = useState<string | null>(null)
  const [paths, setPaths] = useState<ConnectionPath[]>([])

  const availableChunks = chunks.filter(chunk => !slots.includes(chunk.id))

  useEffect(() => {
    function updatePaths() {
      const boardEl = boardRef.current
      if (!boardEl) return

      const boardRect = boardEl.getBoundingClientRect()
      const nextPaths: ConnectionPath[] = []

      slots.forEach((chunkId, targetIndex) => {
        if (!chunkId) return
        const chunk = chunks.find(item => item.id === chunkId)
        if (!chunk) return

        chunk.dependsOn.forEach(depId => {
          const sourceIndex = slots.indexOf(depId)
          if (sourceIndex === -1) return

          const sourceEl = slotRefs.current[sourceIndex]
          const targetEl = slotRefs.current[targetIndex]
          if (!sourceEl || !targetEl) return

          const sourceRect = sourceEl.getBoundingClientRect()
          const targetRect = targetEl.getBoundingClientRect()
          const startX = sourceRect.right - boardRect.left - 22
          const startY = sourceRect.top - boardRect.top + sourceRect.height / 2
          const endX = targetRect.left - boardRect.left + 22
          const endY = targetRect.top - boardRect.top + targetRect.height / 2
          const bend = Math.max(60, Math.abs(endX - startX) * 0.5)

          nextPaths.push({
            id: `${depId}-${chunk.id}`,
            d: `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`,
            broken: sourceIndex > targetIndex,
          })
        })
      })

      setPaths(nextPaths)
    }

    updatePaths()
    window.addEventListener('resize', updatePaths)

    return () => window.removeEventListener('resize', updatePaths)
  }, [chunks, slots])

  function placeChunk(chunkId: string, targetIndex: number) {
    if (onBeforePlace && !onBeforePlace(chunkId)) return

    const nextSlots = [...slots]
    const previousIndex = nextSlots.findIndex(item => item === chunkId)

    if (previousIndex >= 0) {
      nextSlots[previousIndex] = null
    }

    nextSlots[targetIndex] = chunkId
    onChangeSlots(nextSlots)
    onSelectChunk(null)
    playPop()
  }

  function returnChunk(chunkId: string) {
    onChangeSlots(slots.map(item => (item === chunkId ? null : item)))
    onSelectChunk(chunkId)
    playClick()
  }

  return (
    <div ref={phaseFocusRef} className="dbq-cte-board-shell">
      <div className="dbq-cte-board-header">
        <div>
          <h3 className="dbq-cte-card-title">{title}</h3>
          <p className="dbq-cte-card-copy">{subtitle}</p>
        </div>
      </div>

      <div className="dbq-cte-evidence-pool">
        <div className="dbq-sc-pool-label">Evidence locker</div>
        <div className="dbq-cte-evidence-grid">
          {availableChunks.map(chunk => {
            const selected = selectedChunkId === chunk.id
            const nameValue = nameValues[chunk.id] ?? ''
            const nameCheck = nameChecks?.[chunk.id]

            return (
              <div
                key={chunk.id}
                className={`dbq-cte-evidence-card ${selected ? 'selected' : ''}`}
                draggable
                onDragStart={() => setDraggingChunkId(chunk.id)}
                onDragEnd={() => setDraggingChunkId(null)}
                onClick={() => {
                  playClick()
                  onSelectChunk(selected ? null : chunk.id)
                }}
              >
                <div className="dbq-cte-evidence-top">
                  <span className="dbq-index-stage-tag">Evidence</span>
                  <span className="dbq-cte-clue-label">{chunk.clue}</span>
                </div>

                {editableNames ? (
                  <div className="dbq-cte-name-wrap" onClick={event => event.stopPropagation()}>
                    <label className="dbq-sc-pool-label" htmlFor={`${chunk.id}-name`}>
                      CTE name
                    </label>
                    <input
                      id={`${chunk.id}-name`}
                      className={`dbq-cte-name-input ${nameValue ? (nameCheck?.ok ? 'valid' : 'invalid') : ''}`}
                      value={nameValue}
                      onChange={event => onChangeName?.(chunk.id, event.target.value)}
                      placeholder={chunk.exampleName}
                    />
                    <span className={`dbq-cte-name-hint ${nameValue ? (nameCheck?.ok ? 'good' : 'bad') : ''}`}>
                      {nameValue
                        ? nameCheck?.message
                        : `Try something like ${chunk.exampleName}`}
                    </span>
                  </div>
                ) : (
                  <div className="dbq-cte-fixed-name">{nameValues[chunk.id]}</div>
                )}

                <pre className="dbq-sql-code dbq-cte-evidence-sql">{chunk.sql}</pre>
              </div>
            )
          })}
        </div>
      </div>

      <div ref={boardRef} className={`dbq-cte-case-board ${draggingChunkId ? 'dragging' : ''}`}>
        <svg className="dbq-cte-board-strings" aria-hidden="true">
          {paths.map(path => (
            <path key={path.id} d={path.d} className={path.broken ? 'broken' : 'safe'} />
          ))}
        </svg>

        {slots.map((chunkId, index) => {
          const chunk = chunkId ? chunks.find(item => item.id === chunkId) : null
          const chunkName = chunk ? nameValues[chunk.id] : ''

          return (
            <div
              key={slotLabels[index]}
              ref={element => { slotRefs.current[index] = element }}
              className={`dbq-cte-slot ${chunk ? 'filled' : ''} ${selectedChunkId ? 'selectable' : ''}`}
              onDragOver={event => event.preventDefault()}
              onDrop={event => {
                event.preventDefault()
                if (!draggingChunkId) return
                placeChunk(draggingChunkId, index)
                setDraggingChunkId(null)
              }}
              onClick={() => {
                if (chunk) {
                  returnChunk(chunk.id)
                  return
                }

                if (!selectedChunkId) return
                placeChunk(selectedChunkId, index)
              }}
            >
              <div className="dbq-cte-slot-pin">{slotLabels[index]}</div>

              {!chunk && (
                <div className="dbq-cte-empty-slot">
                  <span>Pin a named clue here</span>
                </div>
              )}

              {chunk && (
                <div className="dbq-cte-pinned-card">
                  <div className="dbq-cte-pinned-top">
                    <span className="dbq-cte-pinned-name">{editableNames ? chunkName : nameValues[chunk.id]}</span>
                    <span className="dbq-cte-pinned-clue">{chunk.clue}</span>
                  </div>
                  <pre className="dbq-sql-code dbq-cte-evidence-sql">{chunk.sql}</pre>
                  {chunk.dependsOn.length > 0 && (
                    <div className="dbq-cte-dependency-row">
                      needs:
                      {chunk.dependsOn.map(depId => (
                        <span
                          key={depId}
                          className={`dbq-cte-dependency-pill ${slots.indexOf(depId) > index ? 'broken' : slots.includes(depId) ? 'good' : 'missing'}`}
                        >
                          {nameValues[depId] || depId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function validateCteName(chunk: ChunkDef, rawValue: string): NameCheck {
  const value = rawValue.trim().toLowerCase()

  if (!value) {
    return { ok: false, message: 'Give this step a real name before you pin it.' }
  }

  if (!/^[a-z][a-z0-9_]*$/.test(value)) {
    return { ok: false, message: 'Use a SQL-style identifier: lowercase letters, numbers, and underscores, starting with a letter.' }
  }

  if (VAGUE_NAME_ROOTS.includes(value) || /^query\d+$/.test(value) || /^cte\d+$/.test(value) || /^step\d+$/.test(value)) {
    return { ok: false, message: 'That name is too vague. Name the result of the step, not the fact that a step exists.' }
  }

  const matchesEveryGroup = chunk.keywordGroups.every(group => group.some(word => value.includes(word)))
  if (!matchesEveryGroup) {
    return {
      ok: false,
      message: `Make the name describe this result set more clearly. Something like ${chunk.exampleName} works.`,
    }
  }

  return {
    ok: true,
    message: 'Clear and descriptive. That reads like a clue on the board.',
  }
}

function getBrokenDependencies(chunks: ChunkDef[], slots: Array<string | null>) {
  const broken: Array<{ id: string; message: string }> = []

  slots.forEach((chunkId, index) => {
    if (!chunkId) return
    const chunk = chunks.find(item => item.id === chunkId)
    if (!chunk) return

    chunk.dependsOn.forEach(depId => {
      const depIndex = slots.indexOf(depId)
      if (depIndex > index) {
        broken.push({
          id: `${depId}-${chunk.id}`,
          message: `${chunk.exampleName} is pinned before the step it depends on. Move ${depId} above it.`,
        })
      }
    })
  })

  return broken
}

function isBoardSolved(chunks: ChunkDef[], slots: Array<string | null>, nameValues: Record<string, string>) {
  if (slots.some(slot => !slot)) return false
  if (getBrokenDependencies(chunks, slots).length > 0) return false

  return chunks.every(chunk => validateCteName(chunk, nameValues[chunk.id] ?? '').ok)
}

function buildSolvedQuery(slots: Array<string | null>, nameValues: Record<string, string>) {
  const allNamed = slots.every(slot => slot && nameValues[slot]?.trim())

  if (!allNamed) {
    return `WITH
  -- Pin each clue and name it to assemble the clean query

${FINAL_QUERY_SUFFIX}`
  }

  const renderedCtes = slots
    .filter((slot): slot is string => Boolean(slot))
    .map((slotId, index) => {
      const chunk = CASE_CHUNKS.find(item => item.id === slotId)
      if (!chunk) return ''
      const name = nameValues[slotId].trim().toLowerCase()
      return `${index === 0 ? 'WITH' : '     '}${index === 0 ? ' ' : ' '}${name} AS (
  ${chunk.sql.replace(/\n/g, '\n  ')}
)`
    })
    .join(',\n')

  const totalName = slots[2] ? nameValues[slots[2]].trim().toLowerCase() : 'suspect_report_totals'

  return `${renderedCtes}
SELECT suspects.name, ${totalName}.report_count
FROM ${totalName}
JOIN suspects
  ON suspects.id = ${totalName}.suspect_id
WHERE ${totalName}.report_count >= 2
ORDER BY ${totalName}.report_count DESC;`
}
