import type { Symptom, MetricStatus } from './types'

interface SymptomBoardProps {
  service: string
  severity: 'P1' | 'P2'
  symptoms: Symptom[]
  slaRemaining: number
  slaTotal: number
}

const STATUS_STYLES: Record<MetricStatus, { bg: string; text: string; dot: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  warning:  { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  normal:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
}

export function SymptomBoard({ service, severity, symptoms, slaRemaining, slaTotal }: SymptomBoardProps) {
  const slaPercent = Math.max(0, (slaRemaining / slaTotal) * 100)
  const slaColor = slaPercent > 50 ? 'bg-emerald-500' : slaPercent > 25 ? 'bg-amber-500' : 'bg-red-500'
  const minutes = Math.floor(slaRemaining / 60)
  const seconds = slaRemaining % 60

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🖥️</span>
          <span className="font-mono text-sm font-semibold text-slate-700">{service}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          severity === 'P1' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {severity}
        </span>
      </div>

      {/* SLA Timer */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">SLA Budget</span>
          <span className={`font-mono text-sm font-bold ${
            slaPercent > 50 ? 'text-emerald-700' : slaPercent > 25 ? 'text-amber-700' : 'text-red-700'
          }`}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${slaColor}`}
            style={{ width: `${slaPercent}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {symptoms.map((s) => {
          const style = STATUS_STYLES[s.status]
          return (
            <div
              key={s.metric}
              className={`rounded-lg px-3 py-2.5 ${style.bg} border border-slate-100`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2 h-2 rounded-full ${style.dot} ${
                  s.status === 'critical' ? 'animate-pulse' : ''
                }`} />
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  {s.metric}
                </span>
              </div>
              <div className={`text-sm font-bold ${style.text}`}>
                {s.value}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
