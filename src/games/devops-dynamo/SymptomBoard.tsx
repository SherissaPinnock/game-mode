import { useEffect, useRef } from 'react'
import type { Symptom, MetricStatus } from './types'

interface SymptomBoardProps {
  service: string
  severity: 'P1' | 'P2'
  symptoms: Symptom[]
  slaRemaining: number
  slaTotal: number
}

const STATUS: Record<MetricStatus, { border: string; text: string; glow: string; badge: string; dot: string }> = {
  critical: {
    border: 'border-red-500',
    text: 'text-red-400',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.35)]',
    badge: 'bg-red-900/60 text-red-300',
    dot: 'bg-red-500',
  },
  warning: {
    border: 'border-amber-500',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    badge: 'bg-amber-900/60 text-amber-300',
    dot: 'bg-amber-500',
  },
  normal: {
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    glow: '',
    badge: 'bg-emerald-900/60 text-emerald-300',
    dot: 'bg-emerald-500',
  },
}

/** Animated ECG-style flatline / pulse canvas */
function EcgLine({ critical }: { critical: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const color = critical ? '#ef4444' : '#10b981'
    let raf: number

    // Build one cycle of ECG waveform points (relative 0–1)
    function ecgY(x: number): number {
      const phase = (x % 1 + 1) % 1
      if (phase < 0.35) return 0.5                        // flat
      if (phase < 0.40) return 0.5 - (phase - 0.35) / 0.05 * 0.15  // small dip
      if (phase < 0.45) return 0.35 + (phase - 0.40) / 0.05 * 0.15 // back up
      if (phase < 0.47) return 0.5 - (phase - 0.45) / 0.02 * 0.55  // sharp spike up
      if (phase < 0.50) return -0.05 + (phase - 0.47) / 0.03 * 1.1 // sharp down
      if (phase < 0.53) return 1.05 - (phase - 0.50) / 0.03 * 0.6  // bounce back
      if (phase < 0.58) return 0.45 - (phase - 0.53) / 0.05 * 0.1  // small bump
      return 0.35 + (phase - 0.58) / 0.42 * 0.15                    // settle to flat
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)

      // Background
      ctx!.fillStyle = '#0a1628'
      ctx!.fillRect(0, 0, W, H)

      // Grid lines
      ctx!.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx!.lineWidth = 1
      for (let gx = 0; gx < W; gx += 20) {
        ctx!.beginPath(); ctx!.moveTo(gx, 0); ctx!.lineTo(gx, H); ctx!.stroke()
      }
      for (let gy = 0; gy < H; gy += 10) {
        ctx!.beginPath(); ctx!.moveTo(0, gy); ctx!.lineTo(W, gy); ctx!.stroke()
      }

      // ECG trace
      ctx!.beginPath()
      ctx!.strokeStyle = color
      ctx!.lineWidth = 1.5
      ctx!.shadowColor = color
      ctx!.shadowBlur = 4

      const speed = critical ? 0.004 : 0.002
      offsetRef.current = (offsetRef.current + speed) % 1

      for (let px = 0; px <= W; px++) {
        const t = (px / W) + offsetRef.current
        const y = ecgY(t) * H
        if (px === 0) ctx!.moveTo(px, y)
        else ctx!.lineTo(px, y)
      }
      ctx!.stroke()
      ctx!.shadowBlur = 0

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [critical])

  return (
    <canvas
      ref={canvasRef}
      width={460}
      height={48}
      className="w-full rounded"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  )
}

export function SymptomBoard({ service, severity, symptoms, slaRemaining, slaTotal }: SymptomBoardProps) {
  const slaPercent = Math.max(0, (slaRemaining / slaTotal) * 100)
  const minutes = Math.floor(slaRemaining / 60)
  const seconds = slaRemaining % 60
  const isCritical = severity === 'P1'
  const hasCritical = symptoms.some(s => s.status === 'critical')

  const slaColor = slaPercent > 50 ? 'text-emerald-400' : slaPercent > 25 ? 'text-amber-400' : 'text-red-400'
  const slaBar   = slaPercent > 50 ? 'bg-emerald-500' : slaPercent > 25 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="rounded-xl bg-[#0a1628] border border-slate-700 overflow-hidden shadow-xl font-mono">

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700">
        <div className="flex items-center gap-2">
          {/* Blinking status LED */}
          <span className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[11px] font-bold text-slate-300 tracking-widest uppercase">
            PATIENT MONITOR
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 tracking-wider">{service}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
            isCritical ? 'bg-red-900/80 text-red-300 border border-red-600' : 'bg-amber-900/80 text-amber-300 border border-amber-600'
          }`}>
            {severity}
          </span>
        </div>
      </div>

      {/* ── ECG trace ───────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-slate-500 tracking-widest uppercase">Heartbeat / Activity</span>
          <span className={`text-[9px] tracking-widest uppercase ${hasCritical ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {hasCritical ? '● CRITICAL' : '● STABLE'}
          </span>
        </div>
        <EcgLine critical={hasCritical} />
      </div>

      {/* ── SLA countdown ───────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-slate-700/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] text-slate-500 tracking-widest uppercase">SLA Budget</span>
          <span className={`text-sm font-bold tabular-nums ${slaColor}`}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${slaBar}`}
            style={{ width: `${slaPercent}%` }}
          />
        </div>
      </div>

      {/* ── Vitals grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 pt-2">
        {symptoms.map((s) => {
          const st = STATUS[s.status]
          return (
            <div
              key={s.metric}
              className={`rounded-lg border ${st.border} bg-slate-900 p-3 ${st.glow}`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${s.status === 'critical' ? 'animate-pulse' : ''}`} />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {s.metric}
                </span>
              </div>
              <div className={`text-lg font-bold leading-none ${st.text}`}>
                {s.value}
              </div>
              <div className={`mt-1.5 text-[9px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 inline-block ${st.badge}`}>
                {s.status}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
