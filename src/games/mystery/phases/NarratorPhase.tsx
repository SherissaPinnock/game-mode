import { useState } from 'react'
import groundskeeperSrc from '@/assets/mystery/groundskeeper narrator.webp'
import { NARRATOR_DIALOGUE } from '../data/dialogue'
import { useTypewriter } from '../hooks/useTypewriter'
import { playClick, playNextLevel, playPop } from '@/lib/sounds'
import './NarratorPhase.css'

interface Props {
  onComplete: () => void
  onExit: () => void
}

export default function NarratorPhase({ onComplete, onExit }: Props) {
  const [dialogIdx, setDialogIdx] = useState(0)
  const { typed, done, skip } = useTypewriter(NARRATOR_DIALOGUE[dialogIdx])
  const isLast = dialogIdx === NARRATOR_DIALOGUE.length - 1

  function handleClick() {
    if (!done) { skip(); return }
    playPop()
    if (!isLast) {
      setDialogIdx(i => i + 1)
    } else {
      playNextLevel()
      onComplete()
    }
  }

  return (
    <div className="nar-overlay" onClick={handleClick}>
      <button
        className="nar-exit-btn"
        onClick={e => { e.stopPropagation(); playClick(); onExit() }}
      >
        ← Exit
      </button>

      <div className="nar-panel">
        <div className="nar-portrait-wrap">
          <img src={groundskeeperSrc} className="nar-portrait-img" alt="Silas" />
          <div className="nar-portrait-lantern" />
          <p className="nar-portrait-name">Silas · Groundskeeper</p>
        </div>

        <div className="nar-dialogue-box">
          <div className="nar-dialogue-quote">"</div>
          <p className="nar-dialogue-text">
            {typed}
            {!done && <span className="nar-cursor">▍</span>}
          </p>
          <div className="nar-dialogue-footer">
            <div className="nar-prog-track">
              {NARRATOR_DIALOGUE.map((_, i) => (
                <div
                  key={i}
                  className={`nar-prog-dot ${i < dialogIdx ? 'done' : i === dialogIdx ? 'active' : ''}`}
                />
              ))}
            </div>
            <span className="nar-click-hint">
              {!done ? 'click to skip' : isLast ? 'Enter the manor →' : 'Click to continue →'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
