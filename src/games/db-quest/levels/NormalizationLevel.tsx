import { useState, useRef, useEffect, useCallback } from 'react'
import { playClick, playPop, playCorrect, playWrong, playNextLevel, playComplete } from '@/lib/sounds'

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase =
  | 'anomaly-intro'
  | 'update-challenge'
  | 'split-intro'
  | 'normalize'
  | 'split-challenge-1'
  | 'split-challenge-2'
  | 'split-challenge-3'
  | 'price-hike'
  | 'ghost-item'
  | 'complete'

interface OrderRow {
  id: number
  customer: string
  address: string
  item: string
  price: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ORDERS: OrderRow[] = [
  { id: 1, customer: 'Alice Baker', address: '123 Old Street', item: 'Energy Drink', price: '$2.00' },
  { id: 2, customer: 'Alice Baker', address: '123 Old Street', item: 'Red Hat',      price: '$15.00' },
  { id: 3, customer: 'Bob Chen',    address: '456 Elm Ave',    item: 'Energy Drink', price: '$2.00' },
  { id: 4, customer: 'Alice Baker', address: '123 Old Street', item: 'Notebook',     price: '$5.00' },
  { id: 5, customer: 'Carol Day',   address: '789 Pine Rd',    item: 'Red Hat',      price: '$15.00' },
  { id: 6, customer: 'Bob Chen',    address: '456 Elm Ave',    item: 'Red Hat',      price: '$15.00' },
  { id: 7, customer: 'Alice Baker', address: '123 Old Street', item: 'Energy Drink', price: '$2.00' },
  { id: 8, customer: 'Carol Day',   address: '789 Pine Rd',    item: 'Notebook',     price: '$5.00' },
]

const NEW_ADDRESS = '789 New Road'

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onComplete: () => void
  onBack: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NormalizationLevel({ onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('anomaly-intro')
  const advance = (next: Phase) => setPhase(next)

  return (
    <div className="dbq-level">
      {/* Header */}
      <div className="dbq-level-header">
        <button className="dbq-back-btn" onClick={() => { playClick(); onBack() }}>← Map</button>
        <div className="dbq-level-title">
          <span className="dbq-level-tag">Level 1</span>
          <span className="dbq-level-name">📋 Redundancy Riot</span>
        </div>
        <PhaseIndicator phase={phase} />
      </div>

      {/* Phase screens */}
      <div className="dbq-level-body">
        {phase === 'anomaly-intro'    && <AnomalyIntro     onNext={() => advance('update-challenge')} />}
        {phase === 'update-challenge' && <UpdateChallenge  onNext={() => advance('split-intro')} />}
        {phase === 'split-intro'      && <SplitIntro       onNext={() => advance('normalize')} />}
        {phase === 'normalize'          && <NormalizePhase   onNext={() => advance('split-challenge-1')} />}
        {phase === 'split-challenge-1'  && <SplitChallenge  scenario={SPLIT_SCENARIOS[0]} nextLabel="Next challenge →" onNext={() => advance('split-challenge-2')} />}
        {phase === 'split-challenge-2'  && <SplitChallenge  scenario={SPLIT_SCENARIOS[1]} nextLabel="Next challenge →" onNext={() => advance('split-challenge-3')} />}
        {phase === 'split-challenge-3'  && <SplitChallenge  scenario={SPLIT_SCENARIOS[2]} nextLabel="See it in action →" onNext={() => advance('price-hike')} />}
        {phase === 'price-hike'         && <PriceHikePhase  onNext={() => advance('ghost-item')} />}
        {phase === 'ghost-item'       && <GhostItemPhase   onNext={() => advance('complete')} />}
        {phase === 'complete'         && <CompletePhase    onFinish={onComplete} />}
      </div>
    </div>
  )
}

// ─── Phase Indicator ──────────────────────────────────────────────────────────
const PHASE_LABELS: Record<Phase, string> = {
  'anomaly-intro':     '1 · The Problem',
  'update-challenge':  '2 · Fix It',
  'split-intro':       '3 · The Solution',
  'normalize':         '4 · Watch the Split',
  'split-challenge-1': '5 · Split It! (Easy)',
  'split-challenge-2': '6 · Split It! (Medium)',
  'split-challenge-3': '7 · Split It! (Hard)',
  'price-hike':        '8 · Price Hike',
  'ghost-item':        '9 · Ghost Item',
  'complete':          '✓ Done',
}
const PHASE_ORDER: Phase[] = [
  'anomaly-intro','update-challenge','split-intro','normalize',
  'split-challenge-1','split-challenge-2','split-challenge-3',
  'price-hike','ghost-item','complete',
]

function PhaseIndicator({ phase }: { phase: Phase }) {
  const idx = PHASE_ORDER.indexOf(phase)
  return (
    <div className="dbq-phase-indicator">
      {PHASE_ORDER.map((p, i) => (
        <div
          key={p}
          className={`dbq-phase-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}`}
          title={PHASE_LABELS[p]}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 1 — Anomaly Intro: The messy table with canvas redundancy web
// ═══════════════════════════════════════════════════════════════════
function AnomalyIntro({ onNext }: { onNext: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tableRef  = useRef<HTMLDivElement>(null)
  const cellRefs  = useRef<Map<string, HTMLTableCellElement>>(new Map())
  const rafRef    = useRef<number>(0)
  const [showCanvas, setShowCanvas] = useState(false)

  // Draw animated redundancy lines on canvas
  const drawLines = useCallback(() => {
    const canvas = canvasRef.current
    const table  = tableRef.current
    if (!canvas || !table) return

    const rect = table.getBoundingClientRect()
    canvas.width  = rect.width
    canvas.height = rect.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const t = performance.now() / 1000

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Group cells by value
    const groups: Record<string, DOMRect[]> = {}
    cellRefs.current.forEach((el, key) => {
      const value = key.split('::')[0]
      const elRect = el.getBoundingClientRect()
      const localRect = new DOMRect(
        elRect.left - rect.left,
        elRect.top  - rect.top,
        elRect.width,
        elRect.height,
      )
      if (!groups[value]) groups[value] = []
      groups[value].push(localRect)
    })

    const COLORS: Record<string, string> = {
      'Alice Baker':    '#f59e0b',
      '123 Old Street': '#ef4444',
      'Energy Drink':   '#8b5cf6',
      'Red Hat':        '#ec4899',
      '$2.00':          '#06b6d4',
      '$15.00':         '#10b981',
    }

    Object.entries(groups).forEach(([value, rects]) => {
      if (rects.length < 2) return
      const color = COLORS[value] ?? '#6366f1'

      // Draw lines between all occurrences
      for (let i = 0; i < rects.length - 1; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i]
          const b = rects[j]
          const ax = a.left + a.width / 2
          const ay = a.top  + a.height / 2
          const bx = b.left + b.width / 2
          const by = b.top  + b.height / 2

          // Animated dash offset
          const dashOffset = (t * 40) % 20

          ctx.save()
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(bx, by)
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5
          ctx.globalAlpha = 0.55 + Math.sin(t * 2 + i) * 0.15
          ctx.setLineDash([6, 4])
          ctx.lineDashOffset = -dashOffset
          ctx.stroke()
          ctx.restore()

          // Pulsing endpoints
          ctx.save()
          const pulse = 0.6 + Math.sin(t * 3) * 0.4
          ctx.beginPath()
          ctx.arc(ax, ay, 4 * pulse, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.globalAlpha = 0.8
          ctx.fill()
          ctx.restore()
        }
      }
    })

    rafRef.current = requestAnimationFrame(drawLines)
  }, [])

  useEffect(() => {
    if (!showCanvas) return
    rafRef.current = requestAnimationFrame(drawLines)
    return () => cancelAnimationFrame(rafRef.current)
  }, [showCanvas, drawLines])

  return (
    <div className="dbq-phase-screen">
      <div className="dbq-explain-box">
        <h2 className="dbq-phase-heading">The Warehouse Ledger</h2>
        <p className="dbq-phase-sub">
          This is your database: one giant table. Every order writes the full customer name,
          address, item, and price — every single time. See the problem?
        </p>
        <button
          className={`dbq-toggle-btn ${showCanvas ? 'active' : ''}`}
          onClick={() => { playClick(); setShowCanvas(v => !v) }}
        >
          {showCanvas ? '🙈 Hide redundancy' : '👁 Show redundancy web'}
        </button>
      </div>

      {/* The messy table with canvas overlay */}
      <div className="dbq-table-container" ref={tableRef} style={{ position: 'relative' }}>
        {showCanvas && (
          <canvas
            ref={canvasRef}
            className="dbq-canvas-overlay"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
          />
        )}
        <table className="dbq-table">
          <thead>
            <tr>
              <th>OrderID</th><th>Customer</th><th>Address</th><th>Item</th><th>Price</th>
            </tr>
          </thead>
          <tbody>
            {ORDERS.map(row => (
              <tr key={row.id} className="dbq-row-appear">
                <td className="dbq-id-cell">#{row.id}</td>
                <td ref={el => { if (el) cellRefs.current.set(`${row.customer}::${row.id}::customer`, el) }}
                    className="dbq-highlight-cell">
                  {row.customer}
                </td>
                <td ref={el => { if (el) cellRefs.current.set(`${row.address}::${row.id}::address`, el) }}
                    className="dbq-highlight-cell">
                  {row.address}
                </td>
                <td ref={el => { if (el) cellRefs.current.set(`${row.item}::${row.id}::item`, el) }}
                    className="dbq-highlight-cell">
                  {row.item}
                </td>
                <td ref={el => { if (el) cellRefs.current.set(`${row.price}::${row.id}::price`, el) }}
                    className="dbq-highlight-cell">
                  {row.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dbq-stat-row">
        <div className="dbq-stat-card bad">
          <span className="dbq-stat-num">8</span>
          <span className="dbq-stat-label">rows store "Alice Baker"<br/>5 times</span>
        </div>
        <div className="dbq-stat-card bad">
          <span className="dbq-stat-num">3×</span>
          <span className="dbq-stat-label">Energy Drink price<br/>duplicated</span>
        </div>
        <div className="dbq-stat-card bad">
          <span className="dbq-stat-num">?</span>
          <span className="dbq-stat-label">What happens when<br/>Alice moves house?</span>
        </div>
      </div>

      <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>
        Alice just moved → See what happens
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 2 — Update Challenge: Fix Alice's address before time runs out
// ═══════════════════════════════════════════════════════════════════
function UpdateChallenge({ onNext }: { onNext: () => void }) {
  const aliceRows = ORDERS.filter(r => r.customer === 'Alice Baker')
  const [updated, setUpdated] = useState<Set<number>>(new Set())
  const [integrity, setIntegrity] = useState(100)
  const [started, setStarted] = useState(false)
  const [missed, setMissed] = useState(false)
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startChallenge() {
    playClick()
    setStarted(true)
    timerRef.current = setInterval(() => {
      setIntegrity(prev => {
        const next = Math.max(0, prev - 2)
        if (next === 0) {
          clearInterval(timerRef.current!)
          setMissed(true)
          playWrong()
        }
        return next
      })
    }, 200)
  }

  function updateRow(id: number) {
    if (!started || done) return
    playPop()
    setUpdated(prev => {
      const next = new Set(prev)
      next.add(id)
      if (next.size === aliceRows.length) {
        clearInterval(timerRef.current!)
        setDone(true)
        playCorrect()
      }
      return next
    })
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const integrityColor = integrity > 60 ? '#4ade80' : integrity > 30 ? '#fbbf24' : '#f87171'

  return (
    <div className="dbq-phase-screen">
      <div className="dbq-explain-box">
        <h2 className="dbq-phase-heading">📣 Alice Baker just moved house!</h2>
        <p className="dbq-phase-sub">
          Her new address is <strong className="dbq-accent">789 New Road</strong>.
          You must find and update <em>every row</em> that mentions her old address.
          Data Integrity drops while rows stay inconsistent.
        </p>
        {!started && !done && (
          <button className="dbq-primary-btn" onClick={startChallenge}>
            Start updating →
          </button>
        )}
      </div>

      {/* Integrity Bar */}
      {(started || done) && (
        <div className="dbq-integrity-bar-wrap">
          <span className="dbq-integrity-label">Data Integrity</span>
          <div className="dbq-integrity-track">
            <div
              className="dbq-integrity-fill"
              style={{ width: `${integrity}%`, background: integrityColor, transition: 'width 0.2s, background 0.4s' }}
            />
          </div>
          <span className="dbq-integrity-pct" style={{ color: integrityColor }}>{integrity}%</span>
        </div>
      )}

      {/* All rows — only Alice's are clickable */}
      <div className="dbq-table-container">
        <table className="dbq-table">
          <thead>
            <tr><th>OrderID</th><th>Customer</th><th>Address</th><th>Item</th><th>Price</th></tr>
          </thead>
          <tbody>
            {ORDERS.map(row => {
              const isAlice = row.customer === 'Alice Baker'
              const isUpdated = updated.has(row.id)
              return (
                <tr
                  key={row.id}
                  className={[
                    isAlice && started && !isUpdated ? 'dbq-row-needs-update' : '',
                    isAlice && isUpdated ? 'dbq-row-updated' : '',
                    isAlice && started && !isUpdated ? 'dbq-row-clickable' : '',
                  ].join(' ')}
                  onClick={() => isAlice && updateRow(row.id)}
                >
                  <td className="dbq-id-cell">#{row.id}</td>
                  <td>{row.customer}</td>
                  <td className={isAlice && !isUpdated && started ? 'dbq-cell-stale' : ''}>
                    {isAlice && isUpdated ? NEW_ADDRESS : row.address}
                    {isAlice && !isUpdated && started && (
                      <span className="dbq-cell-stale-badge">⚠ stale</span>
                    )}
                  </td>
                  <td>{row.item}</td>
                  <td>{row.price}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Progress */}
      {started && !done && !missed && (
        <p className="dbq-progress-hint">
          Click each of Alice's rows to update her address —&nbsp;
          <strong>{updated.size}/{aliceRows.length}</strong> updated
        </p>
      )}

      {/* Missed state */}
      {missed && (
        <div className="dbq-outcome-box bad">
          <p className="dbq-outcome-title">💥 Data Integrity hit zero!</p>
          <p>Customers are seeing the wrong address. This is an <strong>Update Anomaly</strong> — the same fact stored in multiple rows is a ticking time bomb.</p>
          <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>See the fix →</button>
        </div>
      )}

      {/* Done state */}
      {done && (
        <div className="dbq-outcome-box good">
          <p className="dbq-outcome-title">✓ All rows updated</p>
          <p>You found all {aliceRows.length} rows. But what if there were <strong>50,000 orders</strong>?
          This is why storing the same address in every row is dangerous.</p>
          <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>Learn the fix →</button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 3 — Split Intro: Explain the solution before the animation
// ═══════════════════════════════════════════════════════════════════
function SplitIntro({ onNext }: { onNext: () => void }) {
  return (
    <div className="dbq-phase-screen dbq-phase-center">
      <div className="dbq-explain-box wide">
        <h2 className="dbq-phase-heading">✂️ The Solution: Split the Table</h2>
        <p className="dbq-phase-sub">
          Instead of one giant scroll, we create three <em>specialized books</em>.
          Each fact lives in exactly one place. When Alice moves, you update <strong>one row</strong> — done.
        </p>
        <div className="dbq-split-preview">
          <div className="dbq-split-card">
            <div className="dbq-split-card-header" style={{ background: '#4f9cf9' }}>👤 Customers</div>
            <div className="dbq-split-card-body">
              <code>CustomerID | Name | Address</code>
            </div>
          </div>
          <div className="dbq-fk-arrow">→<br/><span>Foreign Key</span></div>
          <div className="dbq-split-card">
            <div className="dbq-split-card-header" style={{ background: '#a78bfa' }}>📦 Items</div>
            <div className="dbq-split-card-body">
              <code>ItemID | Name | Price</code>
            </div>
          </div>
          <div className="dbq-fk-arrow">→<br/><span>Foreign Key</span></div>
          <div className="dbq-split-card">
            <div className="dbq-split-card-header" style={{ background: '#34d399' }}>🧾 Orders</div>
            <div className="dbq-split-card-body">
              <code>OrderID | CustomerID | ItemID | Date</code>
            </div>
          </div>
        </div>
        <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>
          Animate the split →
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 4 — Normalize: Animated split with SVG foreign key lines
// ═══════════════════════════════════════════════════════════════════
function NormalizePhase({ onNext }: { onNext: () => void }) {
  const [animState, setAnimState] = useState<'unsplit' | 'splitting' | 'split'>('unsplit')
  const [showFKLines, setShowFKLines] = useState(false)
  const [highlightFK, setHighlightFK] = useState<string | null>(null)

  const customersRef = useRef<HTMLDivElement>(null)
  const itemsRef     = useRef<HTMLDivElement>(null)
  const ordersRef    = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [fkPaths, setFkPaths] = useState<{ d: string; color: string; label: string }[]>([])

  function doSplit() {
    setAnimState('splitting')
    setTimeout(() => {
      setAnimState('split')
      playPop()
      setTimeout(() => {
        setShowFKLines(true)
        playCorrect()
        computeFKPaths()
      }, 600)
    }, 700)
  }

  const computeFKPaths = useCallback(() => {
    const container = containerRef.current
    const customers = customersRef.current
    const items     = itemsRef.current
    const orders    = ordersRef.current
    if (!container || !customers || !items || !orders) return

    const cRect = container.getBoundingClientRect()

    function midRight(el: HTMLDivElement) {
      const r = el.getBoundingClientRect()
      return { x: r.right - cRect.left, y: r.top + r.height / 2 - cRect.top }
    }
    function midLeft(el: HTMLDivElement) {
      const r = el.getBoundingClientRect()
      return { x: r.left - cRect.left, y: r.top + r.height / 2 - cRect.top }
    }

    const cRight = midRight(customers)
    const oLeft  = midLeft(orders)
    const iRight = midRight(items)

    const paths = [
      {
        d: `M ${cRight.x} ${cRight.y} C ${cRight.x + 60} ${cRight.y}, ${oLeft.x - 60} ${oLeft.y - 30}, ${oLeft.x} ${oLeft.y - 30}`,
        color: '#4f9cf9',
        label: 'CustomerID',
      },
      {
        d: `M ${iRight.x} ${iRight.y} C ${iRight.x + 60} ${iRight.y}, ${oLeft.x - 60} ${oLeft.y + 30}, ${oLeft.x} ${oLeft.y + 30}`,
        color: '#a78bfa',
        label: 'ItemID',
      },
    ]
    setFkPaths(paths)
  }, [])

  useEffect(() => {
    if (!showFKLines) return
    const id = requestAnimationFrame(computeFKPaths)
    return () => cancelAnimationFrame(id)
  }, [showFKLines, computeFKPaths])

  return (
    <div className="dbq-phase-screen">
      <div className="dbq-explain-box">
        <h2 className="dbq-phase-heading">Watch the Split Happen</h2>
        <p className="dbq-phase-sub">
          The scissor cuts your giant table into three focused tables.
          {showFKLines && ' The purple/blue lines are Foreign Keys — they keep tables connected.'}
        </p>
      </div>

      {/* Before */}
      {animState === 'unsplit' && (
        <div className="dbq-normalize-unsplit">
          <div className="dbq-big-table-card">
            <div className="dbq-big-table-header">📋 orders_messy</div>
            <table className="dbq-table compact">
              <thead>
                <tr><th>OrderID</th><th>Customer</th><th>Address</th><th>Item</th><th>Price</th></tr>
              </thead>
              <tbody>
                {ORDERS.slice(0, 5).map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td><td>{r.customer}</td><td>{r.address}</td>
                    <td>{r.item}</td><td>{r.price}</td>
                  </tr>
                ))}
                <tr><td colSpan={5} className="dbq-ellipsis">· · · 3 more rows · · ·</td></tr>
              </tbody>
            </table>
          </div>
          <button className="dbq-scissors-btn" onClick={() => { playClick(); doSplit() }}>
            ✂️ Cut into Normal Form
          </button>
        </div>
      )}

      {/* Splitting animation */}
      {animState === 'splitting' && (
        <div className="dbq-splitting-anim">
          <div className="dbq-split-flash" />
          <p className="dbq-splitting-text">✂️ Splitting…</p>
        </div>
      )}

      {/* After — 3 tables + SVG FK lines */}
      {animState === 'split' && (
        <div ref={containerRef} className="dbq-normalized-view" style={{ position: 'relative' }}>
          {/* SVG overlay for FK lines */}
          {showFKLines && (
            <svg className="dbq-fk-svg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 5 }}>
              {fkPaths.map((p, i) => (
                <g key={i}>
                  <path
                    d={p.d}
                    fill="none"
                    stroke={highlightFK === p.label ? '#fff' : p.color}
                    strokeWidth={highlightFK === p.label ? 3 : 2}
                    strokeDasharray="6 3"
                    className="dbq-fk-path"
                    style={{ filter: `drop-shadow(0 0 4px ${p.color})` }}
                  />
                  <circle cx={parseFloat(p.d.split(' ')[1])} cy={parseFloat(p.d.split(' ')[2])} r={5} fill={p.color} />
                </g>
              ))}
            </svg>
          )}

          <div className="dbq-tables-row">
            {/* Customers table */}
            <div ref={customersRef} className="dbq-normalized-table-wrap dbq-animate-in" style={{ animationDelay: '0ms' }}>
              <div className="dbq-nt-header" style={{ background: '#1d4ed8' }}>👤 customers</div>
              <table className="dbq-table compact">
                <thead><tr><th>CustID</th><th>Name</th><th>Address</th></tr></thead>
                <tbody>
                  <tr><td className="dbq-pk">C1</td><td>Alice Baker</td><td>789 New Road</td></tr>
                  <tr><td className="dbq-pk">C2</td><td>Bob Chen</td><td>456 Elm Ave</td></tr>
                  <tr><td className="dbq-pk">C3</td><td>Carol Day</td><td>789 Pine Rd</td></tr>
                </tbody>
              </table>
              <button
                className="dbq-fk-label-btn"
                style={{ color: '#4f9cf9' }}
                onMouseEnter={() => setHighlightFK('CustomerID')}
                onMouseLeave={() => setHighlightFK(null)}
              >
                🔑 PK: CustID
              </button>
            </div>

            {/* Items table */}
            <div ref={itemsRef} className="dbq-normalized-table-wrap dbq-animate-in" style={{ animationDelay: '150ms' }}>
              <div className="dbq-nt-header" style={{ background: '#6d28d9' }}>📦 items</div>
              <table className="dbq-table compact">
                <thead><tr><th>ItemID</th><th>Name</th><th>Price</th></tr></thead>
                <tbody>
                  <tr><td className="dbq-pk">I1</td><td>Energy Drink</td><td>$2.00</td></tr>
                  <tr><td className="dbq-pk">I2</td><td>Red Hat</td><td>$15.00</td></tr>
                  <tr><td className="dbq-pk">I3</td><td>Notebook</td><td>$5.00</td></tr>
                </tbody>
              </table>
              <button
                className="dbq-fk-label-btn"
                style={{ color: '#a78bfa' }}
                onMouseEnter={() => setHighlightFK('ItemID')}
                onMouseLeave={() => setHighlightFK(null)}
              >
                🔑 PK: ItemID
              </button>
            </div>

            {/* Orders table */}
            <div ref={ordersRef} className="dbq-normalized-table-wrap dbq-animate-in" style={{ animationDelay: '300ms' }}>
              <div className="dbq-nt-header" style={{ background: '#065f46' }}>🧾 orders</div>
              <table className="dbq-table compact">
                <thead><tr><th>OrdID</th><th>CustID</th><th>ItemID</th></tr></thead>
                <tbody>
                  {ORDERS.map(r => (
                    <tr key={r.id}>
                      <td className="dbq-pk">#{r.id}</td>
                      <td className="dbq-fk" style={{ color: '#4f9cf9' }}>
                        {r.customer === 'Alice Baker' ? 'C1' : r.customer === 'Bob Chen' ? 'C2' : 'C3'}
                      </td>
                      <td className="dbq-fk" style={{ color: '#a78bfa' }}>
                        {r.item === 'Energy Drink' ? 'I1' : r.item === 'Red Hat' ? 'I2' : 'I3'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="dbq-fk-badges">
                <span className="dbq-fk-badge" style={{ color: '#4f9cf9' }}>FK → customers</span>
                <span className="dbq-fk-badge" style={{ color: '#a78bfa' }}>FK → items</span>
              </div>
            </div>
          </div>

          {showFKLines && (
            <div className="dbq-insight-box">
              <p>💡 Alice moves? Update <strong>1 row</strong> in <code>customers</code>. All 5 orders automatically reflect the new address via the foreign key.</p>
            </div>
          )}

          {showFKLines && (
            <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>
              Now you try it →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 5 — Price Hike: Before vs After comparison
// ═══════════════════════════════════════════════════════════════════
function PriceHikePhase({ onNext }: { onNext: () => void }) {
  const [animating, setAnimating] = useState(false)
  const [leftDone, setLeftDone]   = useState(false)
  const [rightDone, setRightDone] = useState(false)
  const [leftCount, setLeftCount] = useState(0)
  const [showInsight, setShowInsight] = useState(false)
  const energyRows = ORDERS.filter(r => r.item === 'Energy Drink').length

  function runAnimation() {
    if (animating) return
    setAnimating(true)
    setLeftCount(0)
    setLeftDone(false)
    setRightDone(false)
    setShowInsight(false)

    // Left side: count up rows updated one by one
    let count = 0
    const interval = setInterval(() => {
      count++
      setLeftCount(count)
      if (count >= energyRows) {
        clearInterval(interval)
        setLeftDone(true)
        setTimeout(() => { setRightDone(true); playCorrect(); setTimeout(() => setShowInsight(true), 600) }, 400)
      }
    }, 350)
  }

  return (
    <div className="dbq-phase-screen">
      <div className="dbq-explain-box">
        <h2 className="dbq-phase-heading">⚡ Energy Drinks are now $3.00!</h2>
        <p className="dbq-phase-sub">Watch what it takes to update the price before and after normalization.</p>
        <button className="dbq-primary-btn" onClick={() => { playClick(); runAnimation() }} disabled={animating && !showInsight}>
          {animating && !showInsight ? 'Updating…' : '▶ Run the update'}
        </button>
      </div>

      <div className="dbq-compare-row">
        {/* BEFORE */}
        <div className={`dbq-compare-panel bad ${animating ? 'running' : ''}`}>
          <div className="dbq-compare-header bad">❌ Before Normalization</div>
          <table className="dbq-table compact">
            <thead><tr><th>OrderID</th><th>Item</th><th>Price</th></tr></thead>
            <tbody>
              {ORDERS.map((r, i) => (
                <tr
                  key={r.id}
                  className={r.item === 'Energy Drink' && i < leftCount ? 'dbq-row-flash-update' : ''}
                >
                  <td>#{r.id}</td>
                  <td>{r.item}</td>
                  <td className={r.item === 'Energy Drink' && i < leftCount ? 'dbq-price-updated' : ''}>
                    {r.item === 'Energy Drink' && i < leftCount ? '$3.00' : r.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leftDone && (
            <div className="dbq-compare-verdict bad">
              {energyRows} rows updated one by one
            </div>
          )}
        </div>

        {/* VS divider */}
        <div className="dbq-vs-divider">VS</div>

        {/* AFTER */}
        <div className={`dbq-compare-panel good ${rightDone ? 'done' : ''}`}>
          <div className="dbq-compare-header good">✅ After Normalization</div>
          <div className="dbq-compare-header-sub">items table</div>
          <table className="dbq-table compact">
            <thead><tr><th>ItemID</th><th>Name</th><th>Price</th></tr></thead>
            <tbody>
              <tr className={rightDone ? 'dbq-row-flash-update' : ''}>
                <td className="dbq-pk">I1</td>
                <td>Energy Drink</td>
                <td className={rightDone ? 'dbq-price-updated' : ''}>{rightDone ? '$3.00' : '$2.00'}</td>
              </tr>
              <tr><td className="dbq-pk">I2</td><td>Red Hat</td><td>$15.00</td></tr>
              <tr><td className="dbq-pk">I3</td><td>Notebook</td><td>$5.00</td></tr>
            </tbody>
          </table>
          <div className="dbq-fk-cascade-hint">
            {rightDone && (
              <p className="dbq-cascade-msg">↕ All orders automatically reflect $3.00 via ItemID</p>
            )}
          </div>
          {rightDone && (
            <div className="dbq-compare-verdict good">
              1 row updated. All {energyRows} orders instantly correct.
            </div>
          )}
        </div>
      </div>

      {showInsight && (
        <div className="dbq-insight-box">
          <p>💡 Imagine 50,000 orders. Before normalization: 50,000 UPDATE statements. After: <strong>1</strong>.</p>
        </div>
      )}
      {showInsight && (
        <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>
          One more problem: Ghost Items →
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 6 — Ghost Item: Deletion Anomaly
// ═══════════════════════════════════════════════════════════════════
function GhostItemPhase({ onNext }: { onNext: () => void }) {
  const [leftDeleted, setLeftDeleted] = useState(false)
  const [rightDeleted, setRightDeleted] = useState(false)
  const [showInsight, setShowInsight] = useState(false)

  const redHatOrders = ORDERS.filter(r => r.item === 'Red Hat')
  const lastRedHat   = redHatOrders[redHatOrders.length - 1]

  function deleteAll() {
    setLeftDeleted(true)
    setRightDeleted(true)
    setTimeout(() => setShowInsight(true), 900)
  }

  return (
    <div className="dbq-phase-screen">
      <div className="dbq-explain-box">
        <h2 className="dbq-phase-heading">👻 You've stopped selling Red Hats</h2>
        <p className="dbq-phase-sub">
          Order #{lastRedHat.id} is the last Red Hat order. What happens when you delete it?
        </p>
        {!leftDeleted && !rightDeleted && (
          <button className="dbq-danger-btn" onClick={() => { playClick(); deleteAll() }}>
            🗑 Delete last Red Hat order
          </button>
        )}
      </div>

      <div className="dbq-compare-row">
        {/* BEFORE — unnormalized */}
        <div className="dbq-compare-panel bad">
          <div className="dbq-compare-header bad">❌ Before Normalization</div>
          <p className="dbq-compare-sub">Item data lives inside each order row</p>
          <table className="dbq-table compact">
            <thead><tr><th>OrderID</th><th>Item</th><th>Price</th></tr></thead>
            <tbody>
              {ORDERS.map(r => (
                <tr
                  key={r.id}
                  className={[
                    r.item === 'Red Hat' ? 'dbq-row-redhat' : '',
                    leftDeleted && r.id === lastRedHat.id ? 'dbq-row-deleted' : '',
                  ].join(' ')}
                >
                  <td>#{r.id}</td>
                  <td>{r.item}</td>
                  <td>{r.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leftDeleted && (
            <div className="dbq-ghost-msg">
              <span className="dbq-ghost-icon">👻</span>
              <span>"Red Hat" — <strong>$15.00</strong> — is gone forever.<br/>You've lost the item's existence from the database.</span>
            </div>
          )}
        </div>

        <div className="dbq-vs-divider">VS</div>

        {/* AFTER — normalized */}
        <div className="dbq-compare-panel good">
          <div className="dbq-compare-header good">✅ After Normalization</div>
          <p className="dbq-compare-sub">Items table is separate from orders</p>

          <div className="dbq-nt-label">📦 items table</div>
          <table className="dbq-table compact">
            <thead><tr><th>ItemID</th><th>Name</th><th>Price</th></tr></thead>
            <tbody>
              <tr><td className="dbq-pk">I1</td><td>Energy Drink</td><td>$2.00</td></tr>
              <tr className={rightDeleted ? '' : 'dbq-row-redhat'}>
                <td className="dbq-pk">I2</td><td>Red Hat 🎩</td><td>$15.00</td>
              </tr>
              <tr><td className="dbq-pk">I3</td><td>Notebook</td><td>$5.00</td></tr>
            </tbody>
          </table>

          <div className="dbq-nt-label" style={{ marginTop: 12 }}>🧾 orders table</div>
          <table className="dbq-table compact">
            <thead><tr><th>OrdID</th><th>ItemID</th></tr></thead>
            <tbody>
              {ORDERS.map(r => (
                <tr
                  key={r.id}
                  className={rightDeleted && r.id === lastRedHat.id ? 'dbq-row-deleted' : ''}
                >
                  <td>#{r.id}</td>
                  <td className={r.item === 'Red Hat' ? 'dbq-fk' : ''} style={{ color: r.item === 'Red Hat' ? '#a78bfa' : undefined }}>
                    {r.item === 'Energy Drink' ? 'I1' : r.item === 'Red Hat' ? 'I2' : 'I3'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rightDeleted && (
            <div className="dbq-ghost-msg good">
              <span>✓ Order deleted. But "Red Hat" still exists in the <code>items</code> table — ready for new orders anytime.</span>
            </div>
          )}
        </div>
      </div>

      {showInsight && (
        <div className="dbq-insight-box">
          <p>💡 This is a <strong>Deletion Anomaly</strong>: in an unnormalized schema, deleting a row can accidentally erase data about things that should still exist.</p>
        </div>
      )}
      {showInsight && (
        <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>
          Complete Level →
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 7 — Complete
// ═══════════════════════════════════════════════════════════════════
function CompletePhase({ onFinish }: { onFinish: () => void }) {
  useEffect(() => { playComplete() }, [])

  const LESSONS = [
    {
      icon: '⚡', title: 'Update Anomaly',
      body: 'When the same fact is stored in many rows, updating it everywhere is error-prone and slow. One missed row = inconsistent data.',
    },
    {
      icon: '🔗', title: 'Foreign Keys',
      body: 'Normalization splits tables and connects them via foreign keys. Update one row; all related rows reflect it immediately.',
    },
    {
      icon: '👻', title: 'Deletion Anomaly',
      body: 'Deleting an order in an unnormalized table can accidentally erase item data. Separate tables protect each entity independently.',
    },
  ]

  return (
    <div className="dbq-phase-screen dbq-complete-screen">
      <div className="dbq-complete-hero">
        <div className="dbq-complete-icon">🏆</div>
        <h2 className="dbq-complete-title">Level 1 Complete!</h2>
        <p className="dbq-complete-sub">You've mastered Normalization (3NF)</p>
      </div>

      <div className="dbq-lessons-grid">
        {LESSONS.map(l => (
          <div key={l.title} className="dbq-lesson-card dbq-animate-in">
            <div className="dbq-lesson-icon">{l.icon}</div>
            <div className="dbq-lesson-title">{l.title}</div>
            <p className="dbq-lesson-body">{l.body}</p>
          </div>
        ))}
      </div>

      <div className="dbq-sql-snippet">
        <div className="dbq-sql-label">What this looks like in SQL</div>
        <pre className="dbq-sql-code">{`-- One update, all orders reflect the new price
UPDATE items SET price = 3.00 WHERE item_id = 'I1';

-- Alice moves: one row, all her orders updated
UPDATE customers SET address = '789 New Road' WHERE customer_id = 'C1';`}</pre>
      </div>

      <button className="dbq-primary-btn large" onClick={() => { playClick(); onFinish() }}>
        ✓ Back to Map — unlock Indexing
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SPLIT CHALLENGE — data types
// ═══════════════════════════════════════════════════════════════════
interface SplitCol {
  id: string
  label: string
}

interface SplitTable {
  id: string
  name: string
  icon: string
  color: string
  pkLabel: string
  correctCols: string[]
}

interface SplitScenario {
  difficulty: 'Easy' | 'Medium' | 'Hard'
  diffColor: string
  title: string
  flatName: string
  context: string
  hint: string
  flatHeaders: string[]
  sampleRows: string[][]
  cols: SplitCol[]
  tables: SplitTable[]
}

const SPLIT_SCENARIOS: SplitScenario[] = [
  // ── Scenario 1: 2 tables, Easy ────────────────────────────────
  {
    difficulty: 'Easy',
    diffColor: '#4ade80',
    title: 'Product Catalog',
    flatName: 'product_catalog',
    context: 'A shop stores everything in one flat table. Split it into Products and Categories — drag each column to the table where it belongs.',
    hint: 'Category data (name, description) is about the category itself, not the product. Products reference a category via a foreign key.',
    flatHeaders: ['id', 'product_name', 'price', 'stock', 'category_name', 'category_desc'],
    sampleRows: [
      ['1', 'Widget Pro',  '$9.99',  '50',  'Electronics', 'Gadgets & tech'],
      ['2', 'Peak Cap',    '$4.99',  '120', 'Apparel',     'Clothing items'],
      ['3', 'Widget Lite', '$4.99',  '75',  'Electronics', 'Gadgets & tech'],
    ],
    cols: [
      { id: 'product_name',  label: 'product_name' },
      { id: 'price',         label: 'price' },
      { id: 'stock',         label: 'stock' },
      { id: 'category_name', label: 'category_name' },
      { id: 'category_desc', label: 'category_desc' },
    ],
    tables: [
      {
        id: 'products', name: 'products', icon: '📦', color: '#1d4ed8',
        pkLabel: 'product_id  PK',
        correctCols: ['product_name', 'price', 'stock'],
      },
      {
        id: 'categories', name: 'categories', icon: '🏷️', color: '#7c3aed',
        pkLabel: 'category_id  PK',
        correctCols: ['category_name', 'category_desc'],
      },
    ],
  },

  // ── Scenario 2: 3 tables, Medium ─────────────────────────────
  {
    difficulty: 'Medium',
    diffColor: '#fbbf24',
    title: 'Company Records',
    flatName: 'company_records',
    context: 'An HR system mashes employees, departments, and projects into one table. Split it into 3 — each column belongs to exactly one entity.',
    hint: 'Budget and floor describe the department, not the employee. Projects have their own lifecycle independent of who is assigned to them.',
    flatHeaders: ['id', 'emp_name', 'salary', 'dept_name', 'dept_floor', 'project_title', 'deadline'],
    sampleRows: [
      ['1', 'Alice',  '$80k', 'Engineering', '3rd', 'API v2',   '2026-06'],
      ['2', 'Bob',    '$70k', 'Design',      '2nd', 'Rebrand',  '2026-04'],
      ['3', 'Carol',  '$85k', 'Engineering', '3rd', 'DB Opt',   '2026-05'],
    ],
    cols: [
      { id: 'emp_name',      label: 'emp_name' },
      { id: 'salary',        label: 'salary' },
      { id: 'dept_name',     label: 'dept_name' },
      { id: 'dept_floor',    label: 'dept_floor' },
      { id: 'project_title', label: 'project_title' },
      { id: 'deadline',      label: 'deadline' },
    ],
    tables: [
      {
        id: 'employees', name: 'employees', icon: '👤', color: '#1d4ed8',
        pkLabel: 'employee_id  PK',
        correctCols: ['emp_name', 'salary'],
      },
      {
        id: 'departments', name: 'departments', icon: '🏢', color: '#7c3aed',
        pkLabel: 'dept_id  PK',
        correctCols: ['dept_name', 'dept_floor'],
      },
      {
        id: 'projects', name: 'projects', icon: '📋', color: '#065f46',
        pkLabel: 'project_id  PK',
        correctCols: ['project_title', 'deadline'],
      },
    ],
  },

  // ── Scenario 3: 4 tables, Hard ────────────────────────────────
  {
    difficulty: 'Hard',
    diffColor: '#f87171',
    title: 'University Enrollment',
    flatName: 'university_records',
    context: 'A university dumps students, professors, courses, and enrollment data into one giant table. Split it into 4 normalized tables.',
    hint: 'Students, Professors, and Courses each have an independent identity. The Enrollments table captures the relationship between a student and a course — plus the grade which belongs to that relationship, not to the student or course alone.',
    flatHeaders: ['id', 'student_name', 'student_email', 'prof_name', 'prof_email', 'course_title', 'credits', 'grade'],
    sampleRows: [
      ['1', 'Dana Lee', 'dana@u.edu', 'Dr. Park',   'park@u.edu', 'Databases 101', '3', 'A'],
      ['2', 'Eve Moss', 'eve@u.edu',  'Dr. Park',   'park@u.edu', 'Databases 101', '3', 'B'],
      ['3', 'Dana Lee', 'dana@u.edu', 'Prof. Diaz', 'diaz@u.edu', 'Algorithms',    '4', 'A-'],
    ],
    cols: [
      { id: 'student_name',  label: 'student_name' },
      { id: 'student_email', label: 'student_email' },
      { id: 'prof_name',     label: 'prof_name' },
      { id: 'prof_email',    label: 'prof_email' },
      { id: 'course_title',  label: 'course_title' },
      { id: 'credits',       label: 'credits' },
      { id: 'grade',         label: 'grade' },
    ],
    tables: [
      {
        id: 'students', name: 'students', icon: '🎓', color: '#1d4ed8',
        pkLabel: 'student_id  PK',
        correctCols: ['student_name', 'student_email'],
      },
      {
        id: 'professors', name: 'professors', icon: '👩‍🏫', color: '#b45309',
        pkLabel: 'professor_id  PK',
        correctCols: ['prof_name', 'prof_email'],
      },
      {
        id: 'courses', name: 'courses', icon: '📚', color: '#065f46',
        pkLabel: 'course_id  PK',
        correctCols: ['course_title', 'credits'],
      },
      {
        id: 'enrollments', name: 'enrollments', icon: '📝', color: '#7c3aed',
        pkLabel: 'enrollment_id  PK',
        correctCols: ['grade'],
      },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════
// SPLIT CHALLENGE — interactive component
// ═══════════════════════════════════════════════════════════════════
function SplitChallenge({
  scenario,
  nextLabel,
  onNext,
}: {
  scenario: SplitScenario
  nextLabel: string
  onNext: () => void
}) {
  const [shuffledCols] = useState(() => {
    const a = [...scenario.cols]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  })
  const [shuffledTables] = useState(() => {
    const a = [...scenario.tables]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  })
  const [assignment, setAssignment] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [allCorrect, setAllCorrect] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const unassigned = shuffledCols.filter(c => !assignment[c.id])
  const allAssigned = unassigned.length === 0

  function handleColClick(colId: string) {
    if (allCorrect) return
    if (selected === colId) { playClick(); setSelected(null); return }
    playClick()
    setSelected(colId)
    setChecked(false)
  }

  function handleTableClick(tableId: string) {
    if (!selected || allCorrect) return
    playPop()
    setAssignment(prev => ({ ...prev, [selected]: tableId }))
    setSelected(null)
    setChecked(false)
  }

  function handleUnassign(e: React.MouseEvent, colId: string) {
    e.stopPropagation()
    if (allCorrect) return
    playClick()
    setAssignment(prev => { const n = { ...prev }; delete n[colId]; return n })
    setChecked(false)
    setSelected(null)
  }

  function checkSplit() {
    setAttempts(a => a + 1)
    setChecked(true)
    const correct = shuffledCols.every(col => {
      const tbl = scenario.tables.find(t => t.correctCols.includes(col.id))
      return assignment[col.id] === tbl?.id
    })
    setAllCorrect(correct)
    if (correct) {
      playCorrect()
    } else {
      playWrong()
      setShowHint(true)
    }
  }

  function getColStatus(colId: string): 'correct' | 'wrong' | 'unset' {
    if (!checked) return 'unset'
    const tbl = scenario.tables.find(t => t.correctCols.includes(colId))
    return assignment[colId] === tbl?.id ? 'correct' : 'wrong'
  }

  const hasSelection = selected !== null

  return (
    <div className="dbq-phase-screen">
      {/* Header */}
      <div className="dbq-explain-box">
        <div className="dbq-sc-title-row">
          <h2 className="dbq-phase-heading">{scenario.title}</h2>
          <span
            className="dbq-sc-difficulty"
            style={{ color: scenario.diffColor, borderColor: scenario.diffColor }}
          >
            {scenario.difficulty}
          </span>
        </div>
        <p className="dbq-phase-sub">{scenario.context}</p>
        {selected ? (
          <p className="dbq-sc-instruction">
            ✋ <strong>{selected}</strong> selected — click a table below to place it
          </p>
        ) : (
          <p className="dbq-sc-instruction">
            Click a column to pick it up, then click a table to assign it.
            Click an assigned column to move it back.
          </p>
        )}
      </div>

      {/* Flat table overview */}
      <div className="dbq-sc-flat-wrap">
        <div className="dbq-sc-flat-label">
          ⚠️ Flat table: <code>{scenario.flatName}</code>
        </div>
        <div className="dbq-table-container">
          <table className="dbq-table compact">
            <thead>
              <tr>{scenario.flatHeaders.map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {scenario.sampleRows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unassigned column pool */}
      <div className="dbq-sc-pool-wrap">
        <div className="dbq-sc-pool-label">Unassigned columns</div>
        <div className={`dbq-sc-pool ${unassigned.length === 0 ? 'empty' : ''}`}>
          {unassigned.length === 0 ? (
            <span className="dbq-sc-pool-done">✓ All columns assigned</span>
          ) : (
            unassigned.map(col => (
              <button
                key={col.id}
                className={`dbq-sc-chip${selected === col.id ? ' selected' : ''}`}
                onClick={() => handleColClick(col.id)}
              >
                {col.label}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Target tables */}
      <div className="dbq-sc-tables">
        {shuffledTables.map(table => {
          const assignedCols = shuffledCols.filter(c => assignment[c.id] === table.id)
          return (
            <div
              key={table.id}
              className={[
                'dbq-sc-table-card',
                hasSelection ? 'droppable' : '',
                allCorrect ? 'all-correct' : '',
              ].join(' ')}
              onClick={() => handleTableClick(table.id)}
            >
              <div className="dbq-sc-table-head" style={{ background: table.color }}>
                {table.icon} {table.name}
              </div>
              <div className="dbq-sc-pk-row">
                <span className="dbq-sc-pk-chip">{table.pkLabel}</span>
              </div>
              <div className="dbq-sc-assigned">
                {assignedCols.length === 0 && (
                  <span className="dbq-sc-empty-hint">
                    {hasSelection ? '← drop here' : 'empty'}
                  </span>
                )}
                {assignedCols.map(col => {
                  const status = getColStatus(col.id)
                  return (
                    <button
                      key={col.id}
                      className={`dbq-sc-chip assigned${status !== 'unset' ? ' ' + status : ''}`}
                      onClick={(e) => handleUnassign(e, col.id)}
                      title="Click to unassign"
                    >
                      {col.label}
                      {status === 'correct' && <span className="dbq-sc-badge correct">✓</span>}
                      {status === 'wrong'   && <span className="dbq-sc-badge wrong">✗</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Hint */}
      {showHint && !allCorrect && (
        <div className="dbq-insight-box">
          <p>💡 {scenario.hint}</p>
        </div>
      )}

      {/* Wrong feedback */}
      {checked && !allCorrect && (
        <div className="dbq-outcome-box bad">
          <p className="dbq-outcome-title">Not quite — some columns are in the wrong table</p>
          <p>Columns marked <strong>✗</strong> need to move. Click them to unassign, then reassign.</p>
        </div>
      )}

      {/* Check button */}
      {!allCorrect && allAssigned && (
        <button className="dbq-primary-btn" onClick={checkSplit}>
          Check my split ✓
        </button>
      )}

      {/* Success */}
      {allCorrect && (
        <div className="dbq-outcome-box good">
          <p className="dbq-outcome-title">
            ✓ Perfect split{attempts > 1 ? ` (got it in ${attempts} attempts)` : ''}!
          </p>
          <p>Every column is in the right table. The schema is now normalized.</p>
          <button className="dbq-primary-btn" onClick={() => { playNextLevel(); onNext() }}>{nextLabel}</button>
        </div>
      )}
    </div>
  )
}
