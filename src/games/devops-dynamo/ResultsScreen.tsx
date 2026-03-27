import { computeStats, type PerformanceEntry } from '@/lib/performance'
import { GameRecommendations } from '@/components/GameRecommendations'
import sadImg from '@/assets/character/sad character.png'
//import explainingImg from '@/assets/explaining character.png'
import happyImg from '@/assets/character/thumbs up character.png'

interface ResultsScreenProps {
  incidentTitle: string
  wasCorrect: boolean
  outcome: string
  postmortem: string
  slaRemaining: number
  slaTotal: number
  cluesFound: number
  totalIncidents: number
  completedIncidents: number
  correctCount: number
  sessionEntries: PerformanceEntry[]
  onNext: () => void
  onExit: () => void
  isLastIncident: boolean
}

export function ResultsScreen({
  incidentTitle,
  wasCorrect,
  outcome,
  postmortem,
  slaRemaining,
  slaTotal,
  cluesFound,
  totalIncidents,
  completedIncidents,
  correctCount,
  sessionEntries,
  onNext,
  onExit,
  isLastIncident,
}: ResultsScreenProps) {
  const slaUsed = slaTotal - slaRemaining
  const sessionStats = computeStats(sessionEntries)

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-6 sm:px-6 sm:py-10 min-h-screen bg-slate-50">
      <div className="w-full max-w-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-white transition-colors"
          >
            ← Exit
          </button>
          <span className="text-sm text-slate-500 font-medium">
            Incident {completedIncidents}/{totalIncidents}
          </span>
        </div>

        {/* Outcome Card with character */}
        <div className={`rounded-xl border-2 p-5 ${
          wasCorrect
            ? 'bg-emerald-50 border-emerald-300'
            : 'bg-red-50 border-red-300'
        }`}>
          {/* Character + title centered */}
          <div className="flex flex-col items-center mb-4">
            <img
              src={wasCorrect ? happyImg : sadImg}
              alt={wasCorrect ? 'Happy character' : 'Sad character'}
              className="w-28 h-28 sm:w-36 sm:h-36 object-contain"
            />
            <h2 className={`text-xl sm:text-2xl font-bold mt-2 ${wasCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
              {wasCorrect ? 'Incident Resolved!' : 'Wrong Diagnosis'}
            </h2>
            <span className="text-xs text-slate-500 mt-1">{incidentTitle}</span>
          </div>

          <p className={`text-sm leading-relaxed text-center ${wasCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
            {wasCorrect
              ? outcome
              : `Oops! ${outcome} Don't worry — every mistake is a learning opportunity.`
            }
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="SLA Used" value={`${slaUsed}s`} sub={`of ${slaTotal}s`} />
          <StatCard label="Clues Found" value={String(cluesFound)} sub="investigations" />
          <StatCard
            label="Score"
            value={`${correctCount}/${completedIncidents}`}
            sub="correct fixes"
          />
        </div>

        {/* Postmortem */}
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-2">
            Postmortem
          </h3>
          <p className="text-sm text-blue-700 leading-relaxed">{postmortem}</p>
        </div>

        {/* Recommendations */}
        {isLastIncident && (
          <div className="flex justify-center">
            <GameRecommendations sessionStats={sessionStats} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-colors"
          >
            Back to Menu
          </button>
          {isLastIncident ? (
            <button
              onClick={onNext}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
            >
              Play Again
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
            >
              Next Incident →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-slate-800 mt-0.5">{value}</div>
      <div className="text-[11px] text-slate-400">{sub}</div>
    </div>
  )
}
