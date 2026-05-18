import { useState } from 'react'
import { useTypewriter } from '@/games/mystery/hooks/useTypewriter'
import { playClick, playPop } from '@/lib/sounds'

const DJ_BYTEBEAT_SCRIPT: string[] = [
  'YO YO YO! Welcome to Club Nexus, rookie!',
  'Tonight, YOU are the Load Balancer.',
  "See those three server doors? That's the backend keeping this whole club alive.",
  'Every party-goer walking in is a request hitting the system.',
  "They've all got a math problem over their heads. Your job is to send them to the correct server before the line backs up.",
  "But here's the catch...",
  'If one server gets too many requests at once, it overloads.',
  'And trust me — when a server crashes, the whole club feels it.',
  "So don't just send people anywhere.",
  'Spread the traffic evenly.',
  'Keep all three servers healthy.',
  "That's what load balancing is all about:\ndistributing incoming traffic so no single server gets overwhelmed.",
  'Good load balancers keep apps fast, stable, and online.',
  'Bad load balancers?',
  'Heh... those get the club shut down.',
  'Balance the load. Protect the servers. Keep the party alive.',
  "LET'S SPIN THIS TRAFFIC!",
]

interface DJBytebeatIntroProps {
  narratorSrc: string
  backgroundSrc: string
  onBack: () => void
  onStart: () => void
  musicMuted: boolean
  onToggleMusic: () => void
  script?: string[]
  levelTitle?: string
  phaseLabel?: string
  onSkipAll?: () => void
}

export function DJBytebeatIntro({
  narratorSrc,
  backgroundSrc,
  onBack,
  onStart,
  musicMuted,
  onToggleMusic,
  script,
  levelTitle,
  phaseLabel,
  onSkipAll,
}: DJBytebeatIntroProps) {
  const activeScript = script ?? DJ_BYTEBEAT_SCRIPT
  const [lineIndex, setLineIndex] = useState(0)
  const currentLine = activeScript[lineIndex] ?? ''
  const { typed, done, skip } = useTypewriter(currentLine, 22)
  const isLastLine = lineIndex === activeScript.length - 1

  function handleAdvance() {
    if (!done) {
      playClick()
      skip()
      return
    }

    if (isLastLine) {
      playPop()
      onStart()
      return
    }

    playPop()
    setLineIndex(current => current + 1)
  }

  return (
    <div className="lb-intro-shell">
      <div
        className="lb-intro-backdrop"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(5, 8, 24, 0.34), rgba(5, 8, 24, 0.78)), url(${backgroundSrc})` }}
      />

      <div className="lb-intro-topbar">
        <button className="lb-back-btn" onClick={onBack} type="button">
          {'<-'} Back to roadmap
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onSkipAll && (
            <button className="lb-panel-btn" onClick={onSkipAll} type="button">
              Skip intro
            </button>
          )}
          <button className="lb-panel-btn" onClick={onToggleMusic} type="button">
            Music {musicMuted ? 'Off' : 'On'}
          </button>
        </div>
      </div>

      <div className="lb-intro-stage">
        <div className="lb-intro-portrait-panel">
          <div className="lb-intro-portrait-glow" />
          <img src={narratorSrc} alt="DJ Bytebeat" className="lb-intro-portrait" />
          <div className="lb-intro-nameplate">
            <span className="lb-intro-name-kicker">Narrator</span>
            <strong>DJ BYTEBEAT</strong>
            <span>Club Nexus traffic controller</span>
          </div>
        </div>

        <div className="lb-intro-dialogue-panel">
          <span className="lb-objective-badge">{phaseLabel ?? 'Pre-Shift Briefing'}</span>
          <h2 className="lb-intro-title">{levelTitle ?? 'Level 1: The Load Balancer'}</h2>
          <p className="lb-intro-line">
            {typed}
            {!done && <span className="lb-intro-cursor">{'|'}</span>}
          </p>

          <div className="lb-intro-footer">
            <div className="lb-intro-progress" aria-label="Intro progress">
              {activeScript.map((_, index) => (
                <span
                  key={index}
                  className={[
                    'lb-intro-progress-dot',
                    index < lineIndex ? 'is-done' : '',
                    index === lineIndex ? 'is-active' : '',
                  ].filter(Boolean).join(' ')}
                />
              ))}
            </div>

            <div className="lb-intro-actions">
              {!done && (
                <button className="lb-panel-btn" onClick={handleAdvance} type="button">
                  Skip line
                </button>
              )}
              {done && (
                <button className="lb-panel-btn" onClick={handleAdvance} type="button">
                  {isLastLine ? 'Start shift' : 'Next line'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
