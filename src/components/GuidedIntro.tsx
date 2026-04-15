import { useState } from 'react'

export interface GuidedSlide {
  icon: string
  title: string
  body: string
  highlight?: string   // callout fact — rendered in an accent box
}

interface GuidedIntroProps {
  gameName: string
  tagline?: string
  slides: GuidedSlide[]
  accentColor?: string   // CSS colour string, default indigo
  onDone: () => void
}

export function GuidedIntro({
  gameName,
  tagline = 'Quick concepts before you play',
  slides,
  accentColor = '#6366f1',
  onDone,
}: GuidedIntroProps) {
  const [idx, setIdx] = useState(0)
  const slide = slides[idx]
  const isLast = idx === slides.length - 1

  function next() {
    if (isLast) { onDone(); return }
    setIdx(i => i + 1)
  }

  function prev() {
    setIdx(i => Math.max(0, i - 1))
  }

  // Subtle hex → rgba for background tint
  function tint(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(10,12,24,0.92)',
      backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Card */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        maxWidth: 520,
        width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header strip */}
        <div style={{
          background: accentColor,
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
              {gameName}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{tagline}</div>
          </div>
          <button
            onClick={onDone}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            Skip intro
          </button>
        </div>

        {/* Progress dots */}
        <div style={{
          display: 'flex', gap: 6, justifyContent: 'center',
          padding: '14px 0 4px',
        }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 20 : 8, height: 8,
                borderRadius: 4, border: 'none', cursor: 'pointer',
                background: i === idx ? accentColor : '#e2e8f0',
                transition: 'all 0.25s',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Slide content */}
        <div style={{ padding: '24px 28px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: tint(accentColor, 0.1),
              border: `2px solid ${tint(accentColor, 0.25)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              {slide.icon}
            </div>
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                Concept {idx + 1} of {slides.length}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                {slide.title}
              </div>
            </div>
          </div>

          {/* Body */}
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.75, margin: 0 }}>
            {slide.body}
          </p>

          {/* Highlight callout */}
          {slide.highlight && (
            <div style={{
              background: tint(accentColor, 0.08),
              border: `1.5px solid ${tint(accentColor, 0.3)}`,
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
              <span style={{ fontSize: 13, color: '#334155', fontWeight: 500, lineHeight: 1.6 }}>
                {slide.highlight}
              </span>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{
          padding: '20px 28px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12,
        }}>
          <button
            onClick={prev}
            disabled={idx === 0}
            style={{
              padding: '10px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 13,
              cursor: idx === 0 ? 'default' : 'pointer',
              opacity: idx === 0 ? 0.35 : 1, transition: 'opacity 0.2s',
            }}
          >
            ← Back
          </button>

          {/* Step label */}
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, textAlign: 'center' }}>
            {idx + 1} / {slides.length}
          </span>

          <button
            onClick={next}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: accentColor, color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', boxShadow: `0 4px 14px ${tint(accentColor, 0.4)}`,
              transition: 'opacity 0.15s',
            }}
          >
            {isLast ? 'Start Playing →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
