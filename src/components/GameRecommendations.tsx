import { usePerformance, type CategoryStats } from '@/lib/performance'
import { getRecommendations, getStrengths, CATEGORY_LABELS, type Recommendation } from '@/lib/recommendations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface GameRecommendationsProps {
  sessionStats?: CategoryStats[]
  showAllTime?: boolean
}

/** Color for a given accuracy value. */
function accuracyColor(accuracy: number): string {
  if (accuracy >= 80) return '#22c55e'  // green
  if (accuracy >= 60) return '#306DF6'  // brand blue
  if (accuracy >= 40) return '#f59e0b'  // amber
  return '#ef4444'                      // red
}

export function GameRecommendations({ sessionStats, showAllTime = true }: GameRecommendationsProps) {
  const { allStats } = usePerformance()

  const sessionRecs = sessionStats ? getRecommendations(sessionStats) : []
  const allTimeStats = allStats()
  const allTimeRecs = showAllTime ? getRecommendations(allTimeStats) : []

  // Merge: session recs first, then unseen all-time recs
  const sessionCats = new Set(sessionRecs.map(r => r.category))
  const extraRecs = allTimeRecs.filter(r => !sessionCats.has(r.category))

  const hasAnyRecs = sessionRecs.length > 0 || extraRecs.length > 0
  const strengths = getStrengths(sessionStats ?? allTimeStats)

  // Chart data from session or all-time
  const chartStats = sessionStats?.length ? sessionStats : allTimeStats
  const chartData = chartStats.map(s => ({
    name: CATEGORY_LABELS[s.category],
    accuracy: s.accuracy,
    total: s.total,
  }))

  if (!hasAnyRecs && strengths.length === 0 && chartData.length === 0) return null

  return (
    <div className="flex flex-col gap-4 w-full max-w-[600px]">
      {/* ── Accuracy chart ──────────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={chartData.length * 44 + 20}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                barCategoryGap="20%"
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
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
                  width={110}
                  tick={{ fontSize: 13, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as { name: string; accuracy: number; total: number }
                    return (
                      <div className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-foreground/10 shadow-md">
                        <p className="font-semibold text-foreground">{d.name}</p>
                        <p className="text-muted-foreground">{d.accuracy}% across {d.total} question{d.total !== 1 ? 's' : ''}</p>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="accuracy"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={24}
                  fill="#306DF6"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  shape={((props: any) => {
                    const { x, y, width, height, payload } = props
                    return (
                      <rect
                        x={x} y={y} width={width} height={height}
                        rx={6} ry={6}
                        fill={accuracyColor(payload.accuracy)}
                      />
                    )
                  }) as any}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Strengths ───────────────────────────────────────────────────── */}
      {strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {strengths.map(s => (
                <Badge
                  key={s.category}
                  variant="secondary"
                  className="h-auto px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  {CATEGORY_LABELS[s.category]} — {s.accuracy}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recommended courses ─────────────────────────────────────────── */}
      {hasAnyRecs && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended Learning Paths
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {sessionRecs.map(rec => (
              <RecCard key={rec.category} rec={rec} isSession />
            ))}

            {extraRecs.length > 0 && sessionRecs.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                From previous sessions
              </p>
            )}
            {extraRecs.map(rec => (
              <RecCard key={rec.category} rec={rec} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── All clear ───────────────────────────────────────────────────── */}
      {!hasAnyRecs && strengths.length === 0 && chartData.length > 0 && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm font-semibold text-emerald-600">
              No weak spots detected — keep it up!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Course recommendation card ──────────────────────────────────────────────

function RecCard({ rec, isSession }: { rec: Recommendation; isSession?: boolean }) {
  return (
    <div className="rounded-xl ring-1 ring-foreground/10 bg-card p-3.5">
      {/* Category header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-semibold text-foreground">
          {rec.label}
        </span>
        <Badge
          variant="outline"
          className={`h-auto px-2 py-0.5 text-xs font-semibold rounded-lg ${
            rec.accuracy < 40
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}
        >
          {rec.accuracy}%{isSession ? ' this game' : ''}
        </Badge>
      </div>

      {/* Accuracy bar */}
      <div className="h-1.5 rounded-full bg-secondary mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${rec.accuracy}%`,
            backgroundColor: accuracyColor(rec.accuracy),
          }}
        />
      </div>

      {/* Course links */}
      <div className="flex flex-col gap-1.5">
        {rec.courses.map((course, i) => (
          <a
            key={i}
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 bg-secondary/50 ring-1 ring-foreground/5 hover:bg-secondary transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {course.title}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{course.description}</div>
            </div>
            <svg
              className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}
