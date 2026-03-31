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
    <div className="flex flex-col gap-3 h-full">

      {/* Clues Found — always visible at top, expands as clues are found */}
      <div className={`rounded-xl border-2 p-4 shadow-sm transition-all ${
        log.length > 0
          ? 'border-amber-300 bg-amber-50'
          : 'border-slate-200 bg-slate-50 opacity-60'
      }`}>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-amber-700">
          <span className={`w-2 h-2 rounded-full ${log.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
          Findings ({log.length})
        </h3>
        {log.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No findings yet — run an investigation to reveal clues.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {log.map((entry, i) => (
              <div
                key={entry.investigationId}
                className="rounded-lg bg-white border border-amber-200 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Finding #{i + 1}</span>
                  <span className="text-[10px] text-slate-400">−{entry.cost}s SLA</span>
                </div>
                <p className="text-xs text-slate-700 leading-snug">{entry.clue}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Investigation buttons */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
          Run Investigation
        </h3>
        <p className="text-[11px] text-slate-400 mb-3">
          Each test costs SLA time and reveals one finding. Gather 2+ before acting.
        </p>
        <div className="flex flex-col gap-2">
          {investigations.map((inv) => {
            const done = completedIds.has(inv.id)
            return (
              <button
                key={inv.id}
                onClick={() => !done && onInvestigate(inv)}
                disabled={done}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                  done
                    ? 'bg-slate-50 border border-slate-200 opacity-60 cursor-not-allowed'
                    : 'bg-blue-50 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-100 cursor-pointer'
                }`}
              >
                <span className="text-lg flex-shrink-0">{inv.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${done ? 'text-slate-400' : 'text-slate-700'}`}>
                    {inv.label}
                  </div>
                  <div className={`text-xs ${done ? 'text-slate-400' : 'text-blue-600'}`}>
                    {done ? 'Complete' : `~${inv.cost}s SLA cost`}
                  </div>
                </div>
                {done && <span className="text-emerald-500 font-bold text-sm">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Diagnose CTA */}
      {log.length >= 2 && (
        <button
          onClick={onReady}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-sm"
        >
          I have a diagnosis — take action →
        </button>
      )}
    </div>
  )
}
