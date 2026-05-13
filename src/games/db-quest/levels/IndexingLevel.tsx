import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { playClick, playComplete, playCorrect, playNextLevel, playPop, playWrong } from '@/lib/sounds'
import { useMobilePhaseFocus } from '../hooks/useMobilePhaseFocus'

type Phase =
  | 'intro'
  | 'visual'
  | 'types'
  | 'planner-1'
  | 'planner-2'
  | 'planner-3'
  | 'complete'

type CityColumn = 'street' | 'birth_year' | 'district' | 'request_type' | 'status' | 'email' | 'resident'

type Grade = 'perfect' | 'partial' | 'full'
type StopReason = 'range-stopped' | 'missing-filter' | 'no-useful-prefix' | null

interface QueryFilter {
  column: CityColumn
  operator: '=' | '>'
  value: string | number
}

interface CityResident {
  id: string
  resident: string
  street: string
  birth_year: number
  district: string
  request_type: string
  status: 'open' | 'closed'
  email: string
}

interface RouteStep {
  label: string
  tone: 'origin' | 'index' | 'range' | 'warning' | 'danger' | 'success'
}

interface PlannerScenario {
  id: string
  stageLabel: string
  title: string
  summary: string
  querySql: string
  filters: QueryFilter[]
  availableColumns: CityColumn[]
  slotCount: number
  hint: string
  successRule: string
  nextLabel: string
}

interface Evaluation {
  grade: Grade
  chosenColumns: CityColumn[]
  scannedIds: string[]
  matchedIds: string[]
  routeSteps: RouteStep[]
  stopReason: StopReason
  title: string
  body: string
  hint: string
  scanPct: number
}

interface Props {
  onComplete: () => void
  onBack: () => void
}

const PHASE_LABELS: Record<Phase, string> = {
  intro: '1 · Why',
  visual: '2 · See It',
  types: '3 · Types',
  'planner-1': '4 · Single',
  'planner-2': '5 · Composite',
  'planner-3': '6 · Order',
  complete: '✓ Done',
}

const PHASE_ORDER: Phase[] = ['intro', 'visual', 'types', 'planner-1', 'planner-2', 'planner-3', 'complete']

const COLUMN_META: Record<CityColumn, { label: string; accent: string; short: string }> = {
  street: { label: 'street', accent: '#f59e0b', short: 'Street' },
  birth_year: { label: 'birth_year', accent: '#38bdf8', short: 'Birth year' },
  district: { label: 'district', accent: '#a78bfa', short: 'District' },
  request_type: { label: 'request_type', accent: '#34d399', short: 'Request type' },
  status: { label: 'status', accent: '#fb7185', short: 'Status' },
  email: { label: 'email', accent: '#fbbf24', short: 'Email' },
  resident: { label: 'resident', accent: '#f97316', short: 'Resident' },
}

const CITY_RESIDENTS: CityResident[] = [
  { id: 'A1', resident: 'Ava Patel',  street: 'Oak Street',   birth_year: 1988, district: 'North', request_type: 'repair',     status: 'open',   email: 'ava@city.test' },
  { id: 'A2', resident: 'Noah Reed',  street: 'Cedar Lane',   birth_year: 1994, district: 'South', request_type: 'permit',     status: 'closed', email: 'noah@city.test' },
  { id: 'A3', resident: 'Mia Stone',  street: 'Pine Road',    birth_year: 1999, district: 'East',  request_type: 'repair',     status: 'open',   email: 'mia@city.test' },
  { id: 'A4', resident: 'Liam Wong',  street: 'Oak Street',   birth_year: 1992, district: 'North', request_type: 'noise',      status: 'closed', email: 'liam@city.test' },
  { id: 'B1', resident: 'Zoe Kim',    street: 'Maple Avenue', birth_year: 1985, district: 'West',  request_type: 'permit',     status: 'closed', email: 'zoe@city.test' },
  { id: 'B2', resident: 'Eli Cruz',   street: 'Oak Street',   birth_year: 2001, district: 'North', request_type: 'repair',     status: 'open',   email: 'eli@city.test' },
  { id: 'B3', resident: 'Ruby Hall',  street: 'Cedar Lane',   birth_year: 1991, district: 'South', request_type: 'sanitation', status: 'open',   email: 'ruby@city.test' },
  { id: 'B4', resident: 'Omar Shah',  street: 'Pine Road',    birth_year: 1987, district: 'East',  request_type: 'permit',     status: 'closed', email: 'omar@city.test' },
  { id: 'C1', resident: 'Isla Moss',  street: 'Oak Street',   birth_year: 1996, district: 'North', request_type: 'repair',     status: 'open',   email: 'isla@city.test' },
  { id: 'C2', resident: 'Ben Ford',   street: 'Maple Avenue', birth_year: 2003, district: 'West',  request_type: 'repair',     status: 'open',   email: 'ben@city.test' },
  { id: 'C3', resident: 'June Park',  street: 'Cedar Lane',   birth_year: 1982, district: 'South', request_type: 'noise',      status: 'closed', email: 'june@city.test' },
  { id: 'C4', resident: 'Kai Lowe',   street: 'Pine Road',    birth_year: 1995, district: 'East',  request_type: 'sanitation', status: 'open',   email: 'kai@city.test' },
  { id: 'D1', resident: 'Nora Bell',  street: 'Oak Street',   birth_year: 1979, district: 'North', request_type: 'permit',     status: 'closed', email: 'nora@city.test' },
  { id: 'D2', resident: 'Theo Lane',  street: 'Maple Avenue', birth_year: 1998, district: 'West',  request_type: 'permit',     status: 'open',   email: 'theo@city.test' },
  { id: 'D3', resident: 'Sara Cole',  street: 'Cedar Lane',   birth_year: 2000, district: 'South', request_type: 'repair',     status: 'open',   email: 'sara@city.test' },
  { id: 'D4', resident: 'Finn Gray',  street: 'Pine Road',    birth_year: 1993, district: 'East',  request_type: 'noise',      status: 'open',   email: 'finn@city.test' },
]

const VISUAL_QUERY_FILTERS: QueryFilter[] = [
  { column: 'street', operator: '=', value: 'Oak Street' },
  { column: 'birth_year', operator: '>', value: 1990 },
]

const VISUAL_MATCH_IDS = applyFilters(CITY_RESIDENTS, VISUAL_QUERY_FILTERS).map(row => row.id)
const VISUAL_SCAN_IDS = CITY_RESIDENTS.map(row => row.id)

const PLANNER_SCENARIOS: PlannerScenario[] = [
  {
    id: 'street-directory',
    stageLabel: 'Challenge 1 · Single-column',
    title: 'Street Directory',
    summary: 'A clerk asks for every resident on Oak Street. One smart column is enough.',
    querySql: `SELECT resident\nFROM citizens\nWHERE street = 'Oak Street';`,
    filters: [
      { column: 'street', operator: '=', value: 'Oak Street' },
    ],
    availableColumns: ['street', 'resident', 'district', 'birth_year', 'request_type', 'email'],
    slotCount: 1,
    hint: 'The query only filters on one column. Start your index with that exact column.',
    successRule: 'Single-column indexes shine when one field does most of the filtering.',
    nextLabel: 'Next challenge →',
  },
  {
    id: 'street-and-year',
    stageLabel: 'Challenge 2 · Composite',
    title: 'Age Filter',
    summary: 'Now the clerk needs Oak Street residents born after 1990. This is where composite indexes earn their keep.',
    querySql: `SELECT resident\nFROM citizens\nWHERE street = 'Oak Street'\n  AND birth_year > 1990;`,
    filters: [
      { column: 'street', operator: '=', value: 'Oak Street' },
      { column: 'birth_year', operator: '>', value: 1990 },
    ],
    availableColumns: ['street', 'resident', 'birth_year', 'district', 'request_type', 'status', 'email'],
    slotCount: 2,
    hint: 'Put the equality filter first, then the range filter. Let the index narrow by street before it starts scanning years.',
    successRule: 'For `=` plus `>` patterns, equality columns usually come first and the range column comes after them.',
    nextLabel: 'Final challenge →',
  },
  {
    id: 'open-oak-lane',
    stageLabel: 'Challenge 3 · Order Matters',
    title: 'Open Cases Fast Lane',
    summary: 'The mayor only wants open Oak Street cases for residents born after 1990. Two equalities can lead; the range should stay last.',
    querySql: `SELECT resident\nFROM citizens\nWHERE status = 'open'\n  AND street = 'Oak Street'\n  AND birth_year > 1990;`,
    filters: [
      { column: 'status', operator: '=', value: 'open' },
      { column: 'street', operator: '=', value: 'Oak Street' },
      { column: 'birth_year', operator: '>', value: 1990 },
    ],
    availableColumns: ['status', 'street', 'birth_year', 'resident', 'district', 'request_type', 'email'],
    slotCount: 3,
    hint: 'The first two filters are exact matches, so either can lead. Just do not put `birth_year > 1990` first.',
    successRule: 'Equality columns can share the front of a composite index; keep the range column at the end.',
    nextLabel: 'Complete level →',
  },
]

function matchesFilter(row: CityResident, filter: QueryFilter) {
  if (filter.operator === '=') return row[filter.column] === filter.value
  return Number(row[filter.column]) > Number(filter.value)
}

function applyFilters(rows: CityResident[], filters: QueryFilter[]) {
  return rows.filter(row => filters.every(filter => matchesFilter(row, filter)))
}

function buildIndexSql(columns: CityColumn[]) {
  if (columns.length === 0) {
    return '-- No index blueprint yet'
  }

  return `CREATE INDEX idx_citizens_${columns.join('_')}\nON citizens (${columns.join(', ')});`
}

function shuffleColumns(columns: CityColumn[]) {
  const next = [...columns]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

function formatFilterLabel(filter: QueryFilter) {
  return `${COLUMN_META[filter.column].label} ${filter.operator} ${typeof filter.value === 'number' ? filter.value : `'${filter.value}'`}`
}

function buildRouteSteps(usedFilters: QueryFilter[], grade: Grade, stopReason: StopReason) {
  const steps: RouteStep[] = [{ label: 'Records Hub', tone: 'origin' }]

  if (usedFilters.length === 0) {
    steps.push({ label: 'No useful index key', tone: 'warning' })
    steps.push({ label: 'Scan every block', tone: 'danger' })
    return steps
  }

  usedFilters.forEach(filter => {
    steps.push({
      label: formatFilterLabel(filter),
      tone: filter.operator === '=' ? 'index' : 'range',
    })
  })

  if (stopReason === 'range-stopped') {
    steps.push({ label: 'Range stops the path here', tone: 'warning' })
  }

  steps.push({
    label: grade === 'perfect' ? 'Exact homes only' : 'Manual checking',
    tone: grade === 'perfect' ? 'success' : grade === 'partial' ? 'warning' : 'danger',
  })

  return steps
}

function evaluateScenario(scenario: PlannerScenario, chosenColumns: CityColumn[]): Evaluation {
  const matchedRows = applyFilters(CITY_RESIDENTS, scenario.filters)
  const usedFilters: QueryFilter[] = []
  let stopReason: StopReason = null

  for (const column of chosenColumns) {
    const filter = scenario.filters.find(item => item.column === column)
    if (!filter) {
      stopReason = usedFilters.length === 0 ? 'no-useful-prefix' : 'missing-filter'
      break
    }

    usedFilters.push(filter)

    if (filter.operator !== '=') {
      if (usedFilters.length < chosenColumns.length) {
        stopReason = 'range-stopped'
      }
      break
    }
  }

  if (usedFilters.length === 0) {
    stopReason = 'no-useful-prefix'
  }

  const scannedRows = usedFilters.length > 0 ? applyFilters(CITY_RESIDENTS, usedFilters) : CITY_RESIDENTS
  const scanPct = Math.round((scannedRows.length / CITY_RESIDENTS.length) * 100)
  const exactRowsOnly =
    scannedRows.length === matchedRows.length &&
    matchedRows.every(match => scannedRows.some(row => row.id === match.id))

  let grade: Grade = 'full'
  if (exactRowsOnly) grade = 'perfect'
  else if (scannedRows.length < CITY_RESIDENTS.length) grade = 'partial'

  const extraRows = Math.max(scannedRows.length - matchedRows.length, 0)
  let title = 'Full Scan'
  let body = `The engine had to visit all ${CITY_RESIDENTS.length} city records because the index did not start with a useful query column.`

  if (grade === 'perfect') {
    title = 'Perfect Index'
    body = `Clean path. The engine only touches ${scannedRows.length} block${scannedRows.length === 1 ? '' : 's'} because the index lines up with the query exactly.`
  } else if (grade === 'partial' && stopReason === 'range-stopped') {
    title = 'Helpful, But Ordered Wrong'
    body = `The index helped a bit, but the range column came too early. Once the engine starts scanning ${formatFilterLabel(usedFilters[usedFilters.length - 1])}, later columns cannot narrow the path, so ${extraRows} extra block${extraRows === 1 ? '' : 's'} were still checked.`
  } else if (grade === 'partial') {
    const prefix = usedFilters.map(filter => COLUMN_META[filter.column].short).join(' → ')
    title = 'Partial Improvement'
    body = `Good start. The index narrows by ${prefix}, but the database still checks ${extraRows} extra block${extraRows === 1 ? '' : 's'} to finish the rest of the filter.`
  }

  return {
    grade,
    chosenColumns,
    scannedIds: scannedRows.map(row => row.id),
    matchedIds: matchedRows.map(row => row.id),
    routeSteps: buildRouteSteps(usedFilters, grade, stopReason),
    stopReason,
    title,
    body,
    hint: scenario.hint,
    scanPct,
  }
}

export default function IndexingLevel({ onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
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

  function advance(next: Phase) {
    playNextLevel()
    setPhase(next)
  }

  return (
    <div className="dbq-level">
      <div className="dbq-level-header">
        <button className="dbq-back-btn" onClick={() => { playClick(); onBack() }}>← Map</button>
        <div className="dbq-level-title">
          <span className="dbq-level-tag">Level 2</span>
          <span className="dbq-level-name">🏙️ City Planner</span>
        </div>
        <PhaseIndicator phase={phase} />
      </div>

      <div ref={levelBodyRef} className="dbq-level-body">
        {phase === 'intro' && <IndexIntroPhase onNext={() => advance('visual')} />}
        {phase === 'visual' && <ScanVsSeekPhase onNext={() => advance('types')} />}
        {phase === 'types' && <IndexTypesPhase onNext={() => advance('planner-1')} />}
        {phase === 'planner-1' && <PlannerPhase key={PLANNER_SCENARIOS[0].id} scenario={PLANNER_SCENARIOS[0]} onNext={() => advance('planner-2')} />}
        {phase === 'planner-2' && <PlannerPhase key={PLANNER_SCENARIOS[1].id} scenario={PLANNER_SCENARIOS[1]} onNext={() => advance('planner-3')} />}
        {phase === 'planner-3' && <PlannerPhase key={PLANNER_SCENARIOS[2].id} scenario={PLANNER_SCENARIOS[2]} onNext={() => advance('complete')} />}
        {phase === 'complete' && <IndexingCompletePhase onFinish={onComplete} />}
      </div>
    </div>
  )
}

function PhaseIndicator({ phase }: { phase: Phase }) {
  const idx = PHASE_ORDER.indexOf(phase)

  return (
    <div className="dbq-phase-indicator">
      {PHASE_ORDER.map((item, index) => (
        <div
          key={item}
          className={`dbq-phase-dot ${index < idx ? 'done' : index === idx ? 'active' : ''}`}
          title={PHASE_LABELS[item]}
        />
      ))}
    </div>
  )
}

function IndexIntroPhase({ onNext }: { onNext: () => void }) {
  const phaseFocusRef = useMobilePhaseFocus('index-intro')

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">Indexing, Explained Simply</h2>
        <p className="dbq-phase-sub">
          A table is like a city full of paper records. Without an index, the clerk has to walk house by house until they find the right people.
          With an index, the clerk opens a sorted directory first, jumps to the right street, and only checks the homes that matter.
        </p>
      </div>

      <div className="dbq-index-analogy-grid">
        <div className="dbq-index-analogy-card">
          <div className="dbq-index-analogy-icon">📚</div>
          <h3>Book analogy</h3>
          <p>You do not read an entire book to find one topic. You use the index at the back.</p>
        </div>
        <div className="dbq-index-analogy-card">
          <div className="dbq-index-analogy-icon">🏙️</div>
          <h3>City analogy</h3>
          <p>You do not knock on every door in town to find Oak Street. You open the street directory first.</p>
        </div>
        <div className="dbq-index-analogy-card">
          <div className="dbq-index-analogy-icon">⚖️</div>
          <h3>Trade-off</h3>
          <p>Indexes make reads much faster, but each extra index adds work when rows are inserted, updated, or deleted.</p>
        </div>
      </div>

      <div className="dbq-outcome-box good">
        <h3 className="dbq-outcome-title">Why indexes exist</h3>
        <p>
          They cut down the number of rows the database must inspect. The fewer rows it touches, the faster your query feels.
          The best index matches <strong>how you filter</strong>, not just what columns look important.
        </p>
      </div>

      <button className="dbq-primary-btn" onClick={() => { playClick(); onNext() }}>
        Show me the difference →
      </button>
    </div>
  )
}

function ScanVsSeekPhase({ onNext }: { onNext: () => void }) {
  const [mode, setMode] = useState<'scan' | 'index'>('scan')
  const [activeIds, setActiveIds] = useState<string[]>([])
  const phaseFocusRef = useMobilePhaseFocus(`index-visual-${mode}`)
  const timersRef = useRef<number[]>([])

  const routeSteps =
    mode === 'scan'
      ? [
          { label: 'Records Hub', tone: 'origin' as const },
          { label: 'No index', tone: 'warning' as const },
          { label: 'Every block lights up', tone: 'danger' as const },
        ]
      : [
          { label: 'Records Hub', tone: 'origin' as const },
          { label: `street = 'Oak Street'`, tone: 'index' as const },
          { label: 'birth_year > 1990', tone: 'range' as const },
          { label: 'Only 3 homes touched', tone: 'success' as const },
        ]

  useEffect(() => {
    timersRef.current.forEach(timer => window.clearTimeout(timer))
    setActiveIds([])

    const sequence = mode === 'scan' ? VISUAL_SCAN_IDS : VISUAL_MATCH_IDS
    sequence.forEach((id, index) => {
      timersRef.current.push(
        window.setTimeout(() => {
          setActiveIds(prev => (prev.includes(id) ? prev : [...prev, id]))
        }, 120 + index * 95),
      )
    })

    return () => {
      timersRef.current.forEach(timer => window.clearTimeout(timer))
    }
  }, [mode])

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">Same Query, Two Very Different Paths</h2>
        <p className="dbq-phase-sub">
          Query: <strong>find Oak Street residents born after 1990</strong>. Flip the view and watch how much of the city the database has to touch.
        </p>
      </div>

      <div className="dbq-mode-toggle">
        <button
          className={`dbq-mode-btn ${mode === 'scan' ? 'active' : ''}`}
          onClick={() => { playPop(); setMode('scan') }}
        >
          No index
        </button>
        <button
          className={`dbq-mode-btn ${mode === 'index' ? 'active' : ''}`}
          onClick={() => { playPop(); setMode('index') }}
        >
          Composite index
        </button>
      </div>

      <div className="dbq-city-visual-layout">
        <div className="dbq-city-board-card">
          <div className="dbq-city-board-header">
            <span>City records</span>
            <span>{mode === 'scan' ? '16 blocks checked' : '3 blocks checked'}</span>
          </div>
          <PlannerRoute steps={routeSteps} activeStep={routeSteps.length - 1} />
          <CityGrid activeIds={activeIds} matchedIds={VISUAL_MATCH_IDS} hasRun />
        </div>

        <div className="dbq-index-side-panel">
          <div className="dbq-stat-row">
            <div className={`dbq-stat-card ${mode === 'scan' ? 'bad' : ''}`}>
              <div className="dbq-stat-num">{mode === 'scan' ? 16 : 3}</div>
              <div className="dbq-stat-label">rows inspected</div>
            </div>
            <div className="dbq-stat-card">
              <div className="dbq-stat-num">{VISUAL_MATCH_IDS.length}</div>
              <div className="dbq-stat-label">actual matches</div>
            </div>
          </div>

          <div className={`dbq-outcome-box ${mode === 'scan' ? 'bad' : 'good'}`}>
            <h3 className="dbq-outcome-title">{mode === 'scan' ? 'Full table scan' : 'Index seek'}</h3>
            <p>
              {mode === 'scan'
                ? 'Without an index, the database reads row after row until it has checked the entire table.'
                : 'With `INDEX(street, birth_year)`, the engine jumps to Oak Street first, then scans only the matching years.'}
            </p>
          </div>
        </div>
      </div>

      <button className="dbq-primary-btn" onClick={() => { playClick(); onNext() }}>
        Show the common index types →
      </button>
    </div>
  )
}

function IndexTypesPhase({ onNext }: { onNext: () => void }) {
  const phaseFocusRef = useMobilePhaseFocus('index-types')

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">The Main Types of Indexes You’ll Meet</h2>
        <p className="dbq-phase-sub">
          You do not need every exotic index type on day one. Start with these practical ones and you can already solve most app queries.
        </p>
      </div>

      <div className="dbq-index-types-grid">
        <div className="dbq-index-type-card">
          <div className="dbq-index-type-head">
            <span className="dbq-index-type-icon">🛣️</span>
            <span className="dbq-index-type-title">Single-column</span>
          </div>
          <div className="dbq-index-type-visual">
            <span className="dbq-index-mini-pill warm">street</span>
          </div>
          <p>Perfect when one field does most of the filtering, like finding everyone on one street.</p>
        </div>

        <div className="dbq-index-type-card">
          <div className="dbq-index-type-head">
            <span className="dbq-index-type-icon">🧭</span>
            <span className="dbq-index-type-title">Composite</span>
          </div>
          <div className="dbq-index-type-visual">
            <span className="dbq-index-mini-pill warm">street</span>
            <span className="dbq-index-visual-arrow">→</span>
            <span className="dbq-index-mini-pill cool">birth_year</span>
          </div>
          <p>Stores multiple columns in order. Great for step-by-step narrowing. The order of those columns matters.</p>
        </div>

        <div className="dbq-index-type-card">
          <div className="dbq-index-type-head">
            <span className="dbq-index-type-icon">🔒</span>
            <span className="dbq-index-type-title">Unique</span>
          </div>
          <div className="dbq-index-type-visual">
            <span className="dbq-index-mini-pill gold">email</span>
            <span className="dbq-index-mini-note">no duplicates allowed</span>
          </div>
          <p>Speeds lookups and also protects data quality by refusing duplicate values such as repeated emails.</p>
        </div>

        <div className="dbq-index-type-card">
          <div className="dbq-index-type-head">
            <span className="dbq-index-type-icon">✂️</span>
            <span className="dbq-index-type-title">Partial</span>
          </div>
          <div className="dbq-index-type-visual">
            <span className="dbq-index-mini-pill pink">status = 'open'</span>
          </div>
          <p>Indexes only the hot slice of data you query all the time, like open tickets, so writes stay cheaper.</p>
        </div>
      </div>

      <div className="dbq-outcome-box good">
        <h3 className="dbq-outcome-title">Simple rule of thumb</h3>
        <p>
          Index the columns your queries <strong>filter on</strong>, and for composite indexes, line the columns up with how the query narrows the data.
        </p>
      </div>

      <button className="dbq-primary-btn" onClick={() => { playClick(); onNext() }}>
        Enter City Planner →
      </button>
    </div>
  )
}

function PlannerPhase({ scenario, onNext }: { scenario: PlannerScenario; onNext: () => void }) {
  const phaseFocusRef = useMobilePhaseFocus(`${scenario.id}`)
  const [slots, setSlots] = useState<(CityColumn | null)[]>(Array.from({ length: scenario.slotCount }, () => null))
  const [choiceColumns] = useState<CityColumn[]>(() => shuffleColumns(scenario.availableColumns))
  const [result, setResult] = useState<Evaluation | null>(null)
  const [activeStep, setActiveStep] = useState(-1)
  const [activeIds, setActiveIds] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [runCount, setRunCount] = useState(0)
  const timersRef = useRef<number[]>([])

  const chosenColumns = slots.filter((column): column is CityColumn => column !== null)
  const showSuccessModal = Boolean(result && result.grade === 'perfect' && !isRunning)

  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => window.clearTimeout(timer))
    }
  }, [])

  function resetSimulation() {
    timersRef.current.forEach(timer => window.clearTimeout(timer))
    timersRef.current = []
    setResult(null)
    setActiveStep(-1)
    setActiveIds([])
    setIsRunning(false)
  }

  function placeColumn(column: CityColumn, slotIndex: number) {
    playPop()
    resetSimulation()
    setSlots(prev => {
      const next = [...prev]
      const existingIdx = next.indexOf(column)
      if (existingIdx !== -1) next[existingIdx] = null
      next[slotIndex] = column
      return next
    })
  }

  function handleChipClick(column: CityColumn) {
    if (chosenColumns.includes(column)) {
      playClick()
      resetSimulation()
      setSlots(prev => prev.map(item => (item === column ? null : item)))
      return
    }

    const firstOpenSlot = slots.findIndex(item => item === null)
    if (firstOpenSlot === -1) return
    placeColumn(column, firstOpenSlot)
  }

  function clearBlueprint() {
    playClick()
    resetSimulation()
    setSlots(Array.from({ length: scenario.slotCount }, () => null))
  }

  function runQuery() {
    playClick()
    resetSimulation()
    setRunCount(prev => prev + 1)

    const evaluation = evaluateScenario(scenario, chosenColumns)
    setResult(evaluation)
    setIsRunning(true)

    evaluation.routeSteps.forEach((_, index) => {
      timersRef.current.push(
        window.setTimeout(() => {
          setActiveStep(index)
        }, index * 420),
      )
    })

    const startDelay = evaluation.routeSteps.length * 420 + 120
    evaluation.scannedIds.forEach((id, index) => {
      timersRef.current.push(
        window.setTimeout(() => {
          setActiveIds(prev => (prev.includes(id) ? prev : [...prev, id]))
        }, startDelay + index * 95),
      )
    })

    timersRef.current.push(
      window.setTimeout(() => {
        setIsRunning(false)
        if (evaluation.grade === 'perfect') playCorrect()
        else playWrong()
      }, startDelay + evaluation.scannedIds.length * 95 + 160),
    )
  }

  return (
    <div ref={phaseFocusRef} className="dbq-phase-screen">
      <div className="dbq-explain-box wide">
        <span className="dbq-index-stage-tag">{scenario.stageLabel}</span>
        <h2 className="dbq-phase-heading">{scenario.title}</h2>
        <p className="dbq-phase-sub">{scenario.summary}</p>
      </div>

      <div className="dbq-city-planner-layout">
        <div className="dbq-planner-stack">
          <div className="dbq-planner-card">
            <div className="dbq-planner-card-head">
              <span>Incoming query</span>
              <span>{scenario.slotCount} slot{scenario.slotCount === 1 ? '' : 's'} in your blueprint</span>
            </div>
            <div className="dbq-sql-snippet dbq-index-sql">
              <div className="dbq-sql-label">SQL</div>
              <pre className="dbq-sql-code">{scenario.querySql}</pre>
            </div>
          </div>

          <div className="dbq-planner-card">
            <div className="dbq-planner-card-head">
              <span>Build the index</span>
              <span>Drag on desktop or tap on mobile</span>
            </div>
            <p className="dbq-index-helper-copy">
              Not every column below deserves an index. If the query is not filtering on it, it is probably a decoy.
            </p>

            <div className="dbq-index-chip-row">
              {choiceColumns.map(column => {
                const isPlaced = chosenColumns.includes(column)
                return (
                  <button
                    key={column}
                    draggable
                    onDragStart={event => {
                      event.dataTransfer.setData('text/plain', column)
                    }}
                    onClick={() => handleChipClick(column)}
                    className={`dbq-index-chip ${isPlaced ? 'placed' : ''}`}
                    style={{ '--dbq-chip-accent': COLUMN_META[column].accent } as CSSProperties}
                  >
                    {COLUMN_META[column].label}
                  </button>
                )
              })}
            </div>

            <div className="dbq-index-blueprint">
              {slots.map((column, index) => (
                <div
                  key={`${scenario.id}-${index}`}
                  className={`dbq-index-slot ${column ? 'filled' : ''}`}
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => {
                    const dropped = event.dataTransfer.getData('text/plain') as CityColumn
                    if (!dropped) return
                    placeColumn(dropped, index)
                  }}
                >
                  <div className="dbq-index-slot-number">{index + 1}</div>
                  {column ? (
                    <button
                      className="dbq-index-slot-pill"
                      onClick={() => {
                        playClick()
                        resetSimulation()
                        setSlots(prev => prev.map((item, itemIndex) => (itemIndex === index ? null : item)))
                      }}
                      style={{ '--dbq-chip-accent': COLUMN_META[column].accent } as CSSProperties}
                    >
                      {COLUMN_META[column].label}
                    </button>
                  ) : (
                    <span className="dbq-index-slot-placeholder">drop column here</span>
                  )}
                </div>
              ))}
            </div>

            <div className="dbq-sql-snippet dbq-index-sql">
              <div className="dbq-sql-label">Index blueprint</div>
              <pre className="dbq-sql-code">{buildIndexSql(chosenColumns)}</pre>
            </div>

            <div className="dbq-index-actions">
              <button className="dbq-primary-btn" onClick={runQuery} disabled={isRunning}>
                {chosenColumns.length === 0 ? 'Run without index' : 'Run query'}
              </button>
              <button className="dbq-ghost-btn" onClick={clearBlueprint} disabled={isRunning}>
                Clear blueprint
              </button>
            </div>
          </div>
        </div>

        <div className="dbq-planner-stack">
          <div className="dbq-city-board-card">
            <div className="dbq-city-board-header">
              <span>City scan</span>
              <span>{result ? `${result.scannedIds.length} block${result.scannedIds.length === 1 ? '' : 's'} touched` : 'Waiting for your blueprint'}</span>
            </div>
            <PlannerRoute steps={result?.routeSteps ?? [{ label: 'Build an index to reveal the route', tone: 'warning' }]} activeStep={activeStep} />
            <CityGrid activeIds={activeIds} matchedIds={result?.matchedIds ?? []} hasRun={Boolean(result)} />
          </div>

          {result && result.grade !== 'perfect' ? (
            <div className={`dbq-outcome-box ${result.grade === 'partial' ? 'good' : 'bad'}`}>
              <h3 className="dbq-outcome-title">{result.title}</h3>
              <p>{result.body}</p>

              <div className="dbq-stat-row">
                <div className={`dbq-stat-card ${result.grade === 'full' ? 'bad' : ''}`}>
                  <div className="dbq-stat-num">{result.scannedIds.length}</div>
                  <div className="dbq-stat-label">rows scanned</div>
                </div>
                <div className="dbq-stat-card">
                  <div className="dbq-stat-num">{result.matchedIds.length}</div>
                  <div className="dbq-stat-label">rows returned</div>
                </div>
                <div className="dbq-stat-card">
                  <div className="dbq-stat-num">{100 - result.scanPct}%</div>
                  <div className="dbq-stat-label">work avoided</div>
                </div>
              </div>

              <div className="dbq-matches-list">
                <span className="dbq-matches-label">Exact matches:</span>
                {result.matchedIds.map(id => {
                  const resident = CITY_RESIDENTS.find(item => item.id === id)
                  return (
                    <span key={id} className="dbq-match-chip">
                      {resident?.resident}
                    </span>
                  )
                })}
              </div>

              <div className="dbq-index-tip">
                <strong>Hint:</strong> {result.hint}
              </div>
            </div>
          ) : !result ? (
            <div className="dbq-outcome-box">
              <h3 className="dbq-outcome-title">What to watch for</h3>
              <p>
                If your index is wrong, the whole city will light up. If your index matches the query, the route stays narrow and clean.
              </p>
              {runCount > 0 && (
                <div className="dbq-index-tip">
                  <strong>Hint:</strong> {scenario.hint}
                </div>
              )}
            </div>
          ) : null
          }
        </div>
      </div>

      {showSuccessModal && result && (
        <div className="dbq-index-success-overlay">
          <div className="dbq-index-success-modal">
            <div className="dbq-index-success-badge">{scenario.stageLabel}</div>
            <div className="dbq-index-success-icon">✨</div>
            <h3 className="dbq-index-success-title">Blueprint Approved</h3>
            <p className="dbq-index-success-copy">{result.body}</p>

            <div className="dbq-index-success-stats">
              <div className="dbq-index-success-stat">
                <strong>{result.scannedIds.length}</strong>
                <span>rows scanned</span>
              </div>
              <div className="dbq-index-success-stat">
                <strong>{result.matchedIds.length}</strong>
                <span>matches found</span>
              </div>
              <div className="dbq-index-success-stat">
                <strong>{100 - result.scanPct}%</strong>
                <span>work avoided</span>
              </div>
            </div>

            <div className="dbq-index-tip good">
              <strong>Rule to remember:</strong> {scenario.successRule}
            </div>

            <button className="dbq-primary-btn large" onClick={() => { playClick(); onNext() }}>
              {scenario.nextLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PlannerRoute({ steps, activeStep }: { steps: RouteStep[]; activeStep: number }) {
  return (
    <div className="dbq-route-trail">
      {steps.map((step, index) => {
        const isActive = activeStep >= 0 ? index <= activeStep : steps.length === 1
        return (
          <div
            key={`${step.label}-${index}`}
            className={`dbq-route-step tone-${step.tone} ${isActive ? 'active' : ''}`}
          >
            {step.label}
          </div>
        )
      })}
    </div>
  )
}

function CityGrid({
  activeIds,
  matchedIds,
  hasRun,
}: {
  activeIds: string[]
  matchedIds: string[]
  hasRun: boolean
}) {
  return (
    <div className="dbq-city-grid">
      {CITY_RESIDENTS.map(row => {
        const isActive = activeIds.includes(row.id)
        const isMatch = matchedIds.includes(row.id)
        return (
          <div
            key={row.id}
            className={`dbq-city-cell ${isActive ? 'active' : ''} ${isMatch ? 'match' : ''} ${hasRun && !isActive ? 'muted' : ''}`}
          >
            <div className="dbq-city-cell-top">
              <span>{row.id}</span>
              <span>{row.status}</span>
            </div>
            <div className="dbq-city-cell-name">{row.resident}</div>
            <div className="dbq-city-cell-meta">{row.street}</div>
            <div className="dbq-city-cell-meta">born {row.birth_year}</div>
          </div>
        )
      })}
    </div>
  )
}

function IndexingCompletePhase({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    playComplete()
  }, [])

  const lessons = [
    {
      icon: '⚡',
      title: 'Why index',
      body: 'Indexes reduce how many rows the database must inspect. Fewer rows touched means faster queries.',
    },
    {
      icon: '🛣️',
      title: 'Single-column',
      body: 'A single-column index is perfect when one field does most of the filtering.',
    },
    {
      icon: '🧭',
      title: 'Composite order',
      body: 'Composite indexes narrow left to right. Equality columns lead, and range columns usually come later.',
    },
    {
      icon: '🔒',
      title: 'Useful variants',
      body: 'Unique indexes enforce no duplicates. Partial indexes target the hot slice of data you query most.',
    },
  ]

  return (
    <div className="dbq-phase-screen dbq-complete-screen">
      <div className="dbq-complete-hero">
        <div className="dbq-complete-icon">🏙️</div>
        <h2 className="dbq-complete-title">Indexing Mastered</h2>
        <p className="dbq-complete-sub">You can now feel the difference between a full scan and a well-placed index.</p>
      </div>

      <div className="dbq-lessons-grid">
        {lessons.map(lesson => (
          <div key={lesson.title} className="dbq-lesson-card">
            <div className="dbq-lesson-icon">{lesson.icon}</div>
            <div className="dbq-lesson-title">{lesson.title}</div>
            <p className="dbq-lesson-body">{lesson.body}</p>
          </div>
        ))}
      </div>

      <div className="dbq-sql-snippet">
        <div className="dbq-sql-label">One solid real-world example</div>
        <pre className="dbq-sql-code">{`CREATE INDEX idx_citizens_street_birth_year
ON citizens (street, birth_year);

SELECT resident
FROM citizens
WHERE street = 'Oak Street'
  AND birth_year > 1990;`}</pre>
      </div>

      <button className="dbq-primary-btn large" onClick={() => { playClick(); onFinish() }}>
        ✓ Back to Map
      </button>
    </div>
  )
}
