import { usePerformance, type CategoryStats } from '@/lib/performance'
import { getRecommendations, getStrengths, CATEGORY_LABELS, type Recommendation } from '@/lib/recommendations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface GameRecommendationsProps {
  sessionStats?: CategoryStats[]
  showAllTime?: boolean
}

function accuracyColor(accuracy: number): string {
  if (accuracy >= 80) return '#22c55e'
  if (accuracy >= 60) return '#306DF6'
  if (accuracy >= 40) return '#f59e0b'
  return '#ef4444'
}

const SECTION: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #e8eaf0',
  padding: '24px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#94a3b8',
  marginBottom: 4,
}

export function GameRecommendations({ sessionStats, showAllTime = true }: GameRecommendationsProps) {
  const { allStats } = usePerformance()

  const sessionRecs   = sessionStats ? getRecommendations(sessionStats) : []
  const allTimeStats  = allStats()
  const allTimeRecs   = showAllTime ? getRecommendations(allTimeStats) : []

  const sessionCats = new Set(sessionRecs.map(r => r.category))
  const extraRecs   = allTimeRecs.filter(r => !sessionCats.has(r.category))

  const hasAnyRecs = sessionRecs.length > 0 || extraRecs.length > 0
  const strengths  = getStrengths(sessionStats ?? allTimeStats)

  const chartStats = sessionStats?.length ? sessionStats : allTimeStats
  const chartData  = chartStats.map(s => ({
    name:     CATEGORY_LABELS[s.category],
    accuracy: s.accuracy,
    total:    s.total,
  }))

  if (!hasAnyRecs && strengths.length === 0 && chartData.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Performance Breakdown ── */}
      {chartData.length > 0 && (
        <div style={SECTION}>
          <div style={SECTION_LABEL}>Performance Breakdown</div>
          <ResponsiveContainer width="100%" height={chartData.length * 48 + 24}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 13, fill: '#334155' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as { name: string; accuracy: number; total: number }
                  return (
                    <div style={{
                      background: '#fff', borderRadius: 8, padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13,
                      border: '1px solid #e8eaf0',
                    }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{d.name}</div>
                      <div style={{ color: '#64748b' }}>{d.accuracy}% · {d.total} question{d.total !== 1 ? 's' : ''}</div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="accuracy"
                radius={[0, 6, 6, 0]}
                maxBarSize={22}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                shape={((props: any) => {
                  const { x, y, width, height, payload } = props
                  return <rect x={x} y={y} width={width} height={height} rx={5} ry={5} fill={accuracyColor(payload.accuracy)} />
                }) as any}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Strengths ── */}
      {strengths.length > 0 && (
        <div style={SECTION}>
          <div style={SECTION_LABEL}>Your Strengths</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {strengths.map(s => (
              <span key={s.category} style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                fontSize: 13,
                fontWeight: 700,
                color: '#15803d',
              }}>
                {CATEGORY_LABELS[s.category]} — {s.accuracy}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommended Learning Paths ── */}
      {hasAnyRecs && (
        <div style={SECTION}>
          <div style={SECTION_LABEL}>Recommended Learning Paths</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessionRecs.map(rec => <RecCard key={rec.category} rec={rec} isSession />)}
            {extraRecs.length > 0 && sessionRecs.length > 0 && (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
                From previous sessions
              </div>
            )}
            {extraRecs.map(rec => <RecCard key={rec.category} rec={rec} />)}
          </div>
        </div>
      )}

      {/* ── All clear ── */}
      {!hasAnyRecs && strengths.length === 0 && chartData.length > 0 && (
        <div style={{ ...SECTION, alignItems: 'center', padding: '28px' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>No weak spots detected — keep it up!</span>
        </div>
      )}
    </div>
  )
}

// ─── RecCard ─────────────────────────────────────────────────────────────────

function RecCard({ rec, isSession }: { rec: Recommendation; isSession?: boolean }) {
  const isWeak = rec.accuracy < 40

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #e8eaf0',
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px 12px',
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
          {rec.label}
        </span>
        <span style={{
          padding: '3px 12px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          background: isWeak ? '#fef2f2' : '#fffbeb',
          color: isWeak ? '#dc2626' : '#d97706',
          border: `1.5px solid ${isWeak ? '#fecaca' : '#fde68a'}`,
        }}>
          {rec.accuracy}%{isSession ? ' this game' : ''}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#f1f5f9', margin: '0 18px' }} />

      {/* Course links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {rec.courses.map((course, i) => (
          <a
            key={i}
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 18px',
              borderTop: i > 0 ? '1px solid #f1f5f9' : undefined,
              textDecoration: 'none',
              background: '#fff',
              transition: 'background 0.15s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{course.title}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{course.description}</span>
            </div>
            <span style={{ fontSize: 16, color: '#94a3b8', flexShrink: 0, marginLeft: 12 }}>→</span>
          </a>
        ))}
      </div>
    </div>
  )
}
