import { useState } from 'react'

interface TutorialStep {
  id: string
  title: string
  body: string
  zone: string | null
  stepLabel: string
}

const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to Git Command Commander',
    body: "Before you dive in, let's take a 60-second tour of the workbench. You can skip anytime — or press Next to walk through each section.",
    zone: null,
    stepLabel: 'Intro',
  },
  {
    id: 'scenario',
    title: '📖 The Scenario',
    body: 'Every level drops you into a real team situation. Read this carefully — it tells you exactly what problem needs solving and why.',
    zone: 'scenario',
    stepLabel: 'Scenario',
  },
  {
    id: 'working',
    title: '📁 Working Directory',
    body: "Files you've edited but haven't told Git about yet. They live on your machine — Git doesn't know they changed.",
    zone: 'working',
    stepLabel: 'Working Dir',
  },
  {
    id: 'staging',
    title: '📋 Staging Area',
    body: 'Use Add to move files here. Staging is your "draft" for the next commit — you decide exactly what goes in.',
    zone: 'staging',
    stepLabel: 'Staging',
  },
  {
    id: 'local',
    title: '💻 Local Repository',
    body: 'Your saved commit history on this machine. Each commit is a permanent snapshot — a restore point you can always return to.',
    zone: 'local',
    stepLabel: 'Local Repo',
  },
  {
    id: 'remote',
    title: '☁️ Remote Repository',
    body: "The shared team repo in the cloud. Push to share your commits. Pull to receive your teammates'.",
    zone: 'remote',
    stepLabel: 'Remote Repo',
  },
  {
    id: 'actions',
    title: '⚡ Action Panel',
    body: 'Your toolkit for this level. Actions are deliberately shuffled — thinking about the right sequence is the whole game.',
    zone: 'actions',
    stepLabel: 'Actions',
  },
  {
    id: 'objectives',
    title: '🎯 Objectives',
    body: 'Complete all objectives to finish the level. Watch these tick off as you work through the right sequence.',
    zone: 'objectives',
    stepLabel: 'Objectives',
  },
  {
    id: 'done',
    title: '🚀 Ready to Play!',
    body: "That's the full tour. Now let's fix that bug — your team is counting on you. Good luck!",
    zone: null,
    stepLabel: 'Go!',
  },
]

interface TutorialOverlayProps {
  onDone: () => void
  activeZone: string | null
  onZoneChange: (zone: string | null) => void
}

export function TutorialOverlay({ onDone, onZoneChange }: TutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  function goNext() {
    if (isLast) {
      onZoneChange(null)
      onDone()
      return
    }
    const next = STEPS[stepIndex + 1]
    onZoneChange(next.zone)
    setStepIndex(stepIndex + 1)
  }

  function goBack() {
    if (isFirst) return
    const prev = STEPS[stepIndex - 1]
    onZoneChange(prev.zone)
    setStepIndex(stepIndex - 1)
  }

  function skip() {
    onZoneChange(null)
    onDone()
  }

  return (
    <>
      <div className="gcc-tut-backdrop" aria-hidden="true" />

      <div className="gcc-tut-card" role="dialog" aria-modal="true" aria-label={step.title}>
        <div className="gcc-tut-card-inner">
          <div className="gcc-tut-header">
            <div className="gcc-tut-dots">
              {STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={`gcc-tut-dot ${i === stepIndex ? 'gcc-tut-dot-active' : ''} ${i < stepIndex ? 'gcc-tut-dot-done' : ''}`}
                  title={s.stepLabel}
                />
              ))}
            </div>
            <button className="gcc-tut-skip" onClick={skip}>
              Skip tour
            </button>
          </div>

          <h3 className="gcc-tut-title">{step.title}</h3>
          <p className="gcc-tut-body">{step.body}</p>

          {step.zone && (
            <div className="gcc-tut-zone-hint">
              <span className="gcc-tut-zone-arrow">↑</span>
              Highlighted above
            </div>
          )}

          <div className="gcc-tut-footer">
            <button
              className="gcc-btn gcc-btn-ghost gcc-btn-sm"
              onClick={goBack}
              disabled={isFirst}
            >
              ← Back
            </button>

            <span className="gcc-tut-step-count">
              {stepIndex + 1} / {STEPS.length}
            </span>

            <button className="gcc-btn gcc-btn-primary gcc-btn-sm" onClick={goNext}>
              {isLast ? '▶ Start Playing' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function getTutorialZoneForStep(stepIndex: number): string | null {
  return STEPS[stepIndex]?.zone ?? null
}
