import { usePerformance, type CategoryStats } from '@/lib/performance'
import { getRecommendations, CATEGORY_LABELS, type Recommendation } from '@/lib/recommendations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { CourseLink } from '@/lib/course-data'

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

export function GameRecommendations({ sessionStats }: GameRecommendationsProps) {
  const { allStats } = usePerformance()

  // ── Single worst-performing category from previous sessions ────────────────
  const previousStats = allStats()
  const worstRec: Recommendation | null = (() => {
    const recs = getRecommendations(previousStats)
    return recs.length > 0 ? recs[0] : null   // already sorted weakest-first
  })()

  const chartStats = sessionStats?.length ? sessionStats : previousStats
  const chartData  = chartStats.map(s => ({
    name:     CATEGORY_LABELS[s.category],
    accuracy: s.accuracy,
    total:    s.total,
  }))

  if (chartData.length === 0 && !worstRec) return null

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

      {/* ── Single course recommendation (worst category, previous sessions) ── */}
      {worstRec && worstRec.courses[0] && (
        <div style={{ ...SECTION, padding: '16px 18px', gap: 10 }}>
          <div style={SECTION_LABEL}>Recommended for You</div>
          <RecCard rec={worstRec} />
        </div>
      )}

      {/* ── All clear ── */}
      {!worstRec && chartData.length > 0 && (
        <div style={{ ...SECTION, alignItems: 'center', padding: '28px' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>No weak spots detected — keep it up!</span>
        </div>
      )}
    </div>
  )
}

// ─── RecCard ─────────────────────────────────────────────────────────────────

function RecCard({ rec }: { rec: Recommendation }) {
  const course = rec.courses[0]
  const isWeak = rec.accuracy < 40

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        borderRadius: 10, border: '1px solid #e8eaf0', padding: '12px 14px',
        background: '#fafafa', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 10,
        transition: 'box-shadow 0.15s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: isWeak ? '#ef4444' : '#f59e0b',
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {course.title}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{course.description}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: isWeak ? '#fef2f2' : '#fffbeb',
            color: isWeak ? '#dc2626' : '#d97706',
            border: `1.5px solid ${isWeak ? '#fecaca' : '#fde68a'}`,
          }}>
            {rec.accuracy}% in {rec.label}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#306DF6',
            padding: '3px 9px', border: '1.5px solid #bfdbfe',
            borderRadius: 7, background: '#eff6ff',
          }}>
            Open ↗
          </span>
        </div>
      </div>
    </a>
  )
}

// ─── StaticCourseRecommendation ───────────────────────────────────────────────
// Hardcoded recommendation — no performance system needed.
// Pass one or more CourseLink objects directly from COURSE_MAP.

export function StaticCourseRecommendation({ courses }: { courses: CourseLink[] }) {
  if (!courses.length) return null

  return (
    <div style={{ ...SECTION, padding: '16px 18px', gap: 10 }}>
      <div style={SECTION_LABEL}>Recommended Course</div>
      {courses.map(course => (
        <a
          key={course.url}
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div style={{
            borderRadius: 10, border: '1px solid #e8eaf0', padding: '12px 14px',
            background: '#fafafa', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 10,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {course.title}
              </div>
              {course.description && (
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{course.description}</div>
              )}
            </div>
            <span style={{
              flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#306DF6',
              padding: '3px 9px', border: '1.5px solid #bfdbfe',
              borderRadius: 7, background: '#eff6ff',
            }}>
              Open ↗
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
