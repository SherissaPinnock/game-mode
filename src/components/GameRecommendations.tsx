import { usePerformance, type CategoryStats } from '@/lib/performance'
import { getRecommendations, CATEGORY_LABELS, type Recommendation } from '@/lib/recommendations'

interface GameRecommendationsProps {
  /** Stats from just the completed session (pass to show session-specific recs). */
  sessionStats?: CategoryStats[]
  /** Optionally show all-time weak spots alongside session ones. */
  showAllTime?: boolean
}

/**
 * Modular recommendation panel shown after each game.
 * Highlights weak categories and suggests courses to improve.
 */
export function GameRecommendations({ sessionStats, showAllTime = true }: GameRecommendationsProps) {
  const { allStats } = usePerformance()

  const sessionRecs = sessionStats ? getRecommendations(sessionStats) : []
  const allTimeStats = allStats()
  const allTimeRecs = showAllTime ? getRecommendations(allTimeStats) : []

  // Merge: session recs first, then all-time recs not already shown
  const sessionCats = new Set(sessionRecs.map(r => r.category))
  const extraRecs = allTimeRecs.filter(r => !sessionCats.has(r.category))

  const hasAnyRecs = sessionRecs.length > 0 || extraRecs.length > 0

  // Strengths — categories with ≥ 70% accuracy
  const strengths = (sessionStats ?? allTimeStats).filter(s => s.accuracy >= 70 && s.total >= 2)

  if (!hasAnyRecs && strengths.length === 0) return null

  return (
    <div style={{
      width: '100%',
      maxWidth: 600,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Strengths */}
      {strengths.length > 0 && (
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #86efac',
          borderRadius: 12,
          padding: '14px 18px',
        }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#166534' }}>
            Your Strengths
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {strengths.map(s => (
              <span key={s.category} style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
              }}>
                {CATEGORY_LABELS[s.category]} — {s.accuracy}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weak spots / Recommendations */}
      {hasAnyRecs && (
        <div style={{
          background: '#fff7ed',
          border: '2px solid #fdba74',
          borderRadius: 12,
          padding: '14px 18px',
        }}>
          <h5 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#9a3412' }}>
            Areas to Improve
          </h5>
          
        <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#9a3412' }}>
            Explore Our Courses
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Session-specific recs */}
            {sessionRecs.map(rec => (
              <RecCard key={rec.category} rec={rec} isSession />
            ))}

            {/* All-time recs */}
            {extraRecs.length > 0 && sessionRecs.length > 0 && (
              <div style={{
                fontSize: 12,
                color: '#9a3412',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 4,
              }}>
                From previous sessions
              </div>
            )}
            {extraRecs.map(rec => (
              <RecCard key={rec.category} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {!hasAnyRecs && (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          color: '#166534',
          fontSize: 15,
          fontWeight: 600,
        }}>
          No weak spots detected — keep it up!
        </div>
      )}
    </div>
  )
}

// ─── Individual recommendation card ─────────────────────────────────────────

function RecCard({ rec, isSession }: { rec: Recommendation; isSession?: boolean }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #fed7aa',
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
          {rec.label}
        </span>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: rec.accuracy < 40 ? '#dc2626' : '#ea580c',
          background: rec.accuracy < 40 ? '#fef2f2' : '#fff7ed',
          padding: '2px 8px',
          borderRadius: 12,
        }}>
          {rec.accuracy}% accuracy
          {isSession && ' this game'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rec.courses.map((course, i) => (
          <a
            key={i}
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              textDecoration: 'none',
              color: '#334155',
              fontSize: 13,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
          >
            <span style={{ fontSize: 16 }}>📚</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{course.title}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{course.description}</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 14, color: '#94a3b8' }}>→</span>
          </a>
        ))}
      </div>
    </div>
  )
}
