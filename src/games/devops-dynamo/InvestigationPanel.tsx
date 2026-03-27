import type { Investigation, InvestigationLog } from './types'

interface InvestigationPanelProps {
  investigations: Investigation[]
  completedIds: Set<string>
  log: InvestigationLog[]
  onInvestigate: (investigation: Investigation) => void
  onReady: () => void
}

export function InvestigationPanel({
  investigations,
  completedIds,
  log,
  onInvestigate,
  onReady,
}: InvestigationPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Investigation Options */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
          Choose Investigation
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Each investigation costs SLA time and reveals one clue. Choose wisely.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {investigations.map((inv) => {
            const done = completedIds.has(inv.id)
            return (
              <button
                key={inv.id}
                onClick={() => !done && onInvestigate(inv)}
                disabled={done}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all ${
                  done
                    ? 'bg-slate-50 border border-slate-200 opacity-60 cursor-not-allowed'
                    : 'bg-blue-50 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-100 cursor-pointer'
                }`}
              >
                <span className="text-xl flex-shrink-0">{inv.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${done ? 'text-slate-400' : 'text-slate-700'}`}>
                    {inv.label}
                  </div>
                  <div className={`text-xs ${done ? 'text-slate-400' : 'text-blue-600'}`}>
                    {done ? 'Investigated' : `~${inv.cost}s SLA cost`}
                  </div>
                </div>
                {done && <span className="text-emerald-500 text-lg">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Clues Revealed */}
      {log.length > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 sm:p-5 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-3">
            Clues Found ({log.length})
          </h3>
          <div className="flex flex-col gap-2">
            {log.map((entry, i) => (
              <div
                key={entry.investigationId}
                className="rounded-lg bg-white border border-amber-200 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-600">Clue #{i + 1}</span>
                  <span className="text-[10px] text-slate-400">-{entry.cost}s</span>
                </div>
                <p className="text-sm text-slate-700 leading-snug">{entry.clue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ready to Act */}
      {log.length >= 2 && (
        <button
          onClick={onReady}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-sm"
        >
          I have a diagnosis — take action
        </button>
      )}
    </div>
  )
}
