import { useEffect, useState, type DragEvent } from 'react'

import cartridge1 from '@/assets/game-boy/cartridge 1.png'
import {
  playClick,
  playComplete,
  playCorrect,
  playPop,
  playVintageGame,
  playWrong,
} from '@/lib/sounds'
import { useMobileStageFocus } from '../hooks/useMobileStageFocus'

interface DockerfileAssemblyLevelProps {
  levelNumber: number
  onBack: () => void
  onComplete: () => void
}

type DockerInstructionId = 'FROM' | 'COPY' | 'RUN' | 'CMD'
type BriefingStep = 0 | 1 | 2
type LevelPhase = 'briefing' | 'assembly' | 'building' | 'complete'
type FeedbackTone = 'neutral' | 'success' | 'warning'

type InstructionBlock = {
  id: DockerInstructionId
  line: string
  summary: string
  beginnerLabel: string
}

type FeedbackState = {
  tone: FeedbackTone
  message: string
}

type WorkOrder = {
  target: DockerInstructionId
  chip: string
  title: string
  prompt: string
  clue: string
  success: string
}

const DOCKERFILE_BLOCKS: InstructionBlock[] = [
  {
    id: 'FROM',
    line: 'FROM ubuntu:22.04',
    summary: 'Picks the starting image your build begins from.',
    beginnerLabel: 'The base shell',
  },
  {
    id: 'COPY',
    line: 'COPY . /arcade',
    summary: 'Moves your project files from your machine into the image.',
    beginnerLabel: 'Bring in your code',
  },
  {
    id: 'RUN',
    line: 'RUN npm install',
    summary: 'Executes a command while the image is being built.',
    beginnerLabel: 'Build-time task',
  },
  {
    id: 'CMD',
    line: 'CMD ["npm", "start"]',
    summary: 'Sets the default command to run when the container starts.',
    beginnerLabel: 'What happens on ON',
  },
] as const

const TARGET_SEQUENCE: DockerInstructionId[] = ['FROM', 'COPY', 'CMD']
const REWARD_AMOUNT = 100

const BRIEFING_STEPS = [
  {
    chip: 'Lesson 1',
    title: 'What a Dockerfile actually is',
    body: 'A Dockerfile is a recipe for building an image. It is not the running app. It is the list of instructions Docker follows to package the app the same way every time.',
    takeaway: 'Think recipe now, running game later.',
  },
  {
    chip: 'Lesson 2',
    title: 'Meet the four blocks',
    body: 'Each instruction has a job. Beginners usually need to remember four things first: where you start, what files go in, what happens while building, and what starts when the container turns on.',
    takeaway: 'FROM starts, COPY adds files, RUN does build work, CMD sets startup.',
  },
  {
    chip: 'Lesson 3',
    title: 'How this mini-game works',
    body: 'The factory robots will ask for three recipe steps in order. Your job is to pick the correct block for each work order, load the recipe, then hit BUILD to burn the cartridge.',
    takeaway: 'You only need FROM, COPY, and CMD to clear this beginner recipe.',
  },
] as const

const WORK_ORDERS: WorkOrder[] = [
  {
    target: 'FROM',
    chip: 'Work order 1 of 3',
    title: 'Start with a base',
    prompt: 'Rule #1: Every Dockerfile starts with a foundation. Which instruction chooses the image or OS shell we build on top of?',
    clue: 'Look for the block that means “start from this image first.”',
    success: 'Shell locked in. The cartridge finally has a proper starting point.',
  },
  {
    target: 'COPY',
    chip: 'Work order 2 of 3',
    title: 'Move the code into the shell',
    prompt: 'Now the robots need your files. Which instruction gets the code off your desk and into the image?',
    clue: 'Think about moving project files from your machine into the container image.',
    success: 'Files loaded. The robots can see the game code now.',
  },
  {
    target: 'CMD',
    chip: 'Work order 3 of 3',
    title: 'Set what happens on ON',
    prompt: 'Final step. When the player presses ON, what tells the container what command to start with by default?',
    clue: 'This one controls the default startup command, not build-time setup.',
    success: 'Startup locked. The cartridge knows how to wake up.',
  },
] as const

function getBlock(id: DockerInstructionId) {
  return DOCKERFILE_BLOCKS.find((block) => block.id === id)!
}

export function DockerfileAssemblyLevel({
  levelNumber,
  onBack,
  onComplete,
}: DockerfileAssemblyLevelProps) {
  const [phase, setPhase] = useState<LevelPhase>('briefing')
  const [briefingStep, setBriefingStep] = useState<BriefingStep>(0)
  const [placedBlocks, setPlacedBlocks] = useState<DockerInstructionId[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [dropActive, setDropActive] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>({
    tone: 'neutral',
    message: 'The robots are waiting for the first instruction.',
  })

  const currentOrder = WORK_ORDERS[placedBlocks.length] ?? null
  const briefing = BRIEFING_STEPS[briefingStep]
  const isRecipeReady = placedBlocks.length === TARGET_SEQUENCE.length
  const chargePercent = Math.round((placedBlocks.length / TARGET_SEQUENCE.length) * 100)
  const stageFocusRef = useMobileStageFocus(`${phase}-${briefingStep}`)
  useEffect(() => {
    if (phase !== 'building' || countdown === null) return

    const timeoutId = window.setTimeout(() => {
      if (countdown === 1) {
        setCountdown(null)
        setPhase('complete')
        setFeedback({
          tone: 'success',
          message: 'Perfect build. The cartridge launched down the belt and the batch sold for +$100.',
        })
        playComplete()
        return
      }

      playPop()
      setCountdown(countdown - 1)
    }, 850)

    return () => window.clearTimeout(timeoutId)
  }, [countdown, phase])

  function handleBack() {
    playClick()
    onBack()
  }

  function handleAdvanceBriefing() {
    playClick()

    if (briefingStep === BRIEFING_STEPS.length - 1) {
      setPhase('assembly')
      setFeedback({
        tone: 'neutral',
        message: 'Training floor ready. Your first robot needs the base image instruction.',
      })
      playVintageGame()
      return
    }

    setBriefingStep((current) => (current + 1) as BriefingStep)
  }

  function handlePlaceBlock(blockId: DockerInstructionId) {
    if (phase !== 'assembly' || !currentOrder) return

    if (placedBlocks.includes(blockId)) {
      setFeedback({
        tone: 'warning',
        message: `${blockId} is already loaded into the blueprint. Pick a different block.`,
      })
      playWrong()
      return
    }

    if (blockId !== currentOrder.target) {
      setMistakes((current) => current + 1)
      setFeedback({
        tone: 'warning',
        message:
          blockId === 'RUN'
            ? 'Close, but RUN is for build-time commands. This work order needs the base-files-startup recipe.'
            : `${blockId} is not the right move yet. ${currentOrder.clue}`,
      })
      playWrong()
      return
    }

    const nextPlacedBlocks = [...placedBlocks, blockId]
    setPlacedBlocks(nextPlacedBlocks)
    setDropActive(false)
    setFeedback({
      tone: 'success',
      message: currentOrder.success,
    })
    playCorrect()
    playPop()
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, blockId: DockerInstructionId) {
    event.dataTransfer.setData('text/plain', blockId)
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const blockId = event.dataTransfer.getData('text/plain') as DockerInstructionId
    setDropActive(false)
    if (!blockId) return
    handlePlaceBlock(blockId)
  }

  function handleBuild() {
    if (!isRecipeReady || phase !== 'assembly') return

    playClick()
    playVintageGame()
    setPhase('building')
    setCountdown(3)
    setFeedback({
      tone: 'neutral',
      message: 'Build started. Docker is following the recipe from top to bottom.',
    })
  }

  function handleReset() {
    playClick()
    setPhase('assembly')
    setPlacedBlocks([])
    setMistakes(0)
    setDropActive(false)
    setCountdown(null)
    setFeedback({
      tone: 'neutral',
      message: 'Blueprint cleared. The robots are ready to learn the recipe again.',
    })
  }

  function handleClearStage() {
    playClick()
    onComplete()
  }

  return (
    <div className="gb-level">
      <header className="gb-level-header">
        <button className="gb-back-btn" onClick={handleBack}>
          ← Back to roadmap
        </button>

        <div className="gb-level-title">
          <span className="gb-level-badge">Level {String(levelNumber).padStart(2, '0')}</span>
          <div>
            <p className="gb-level-kicker">Docker Game Boy</p>
            <h1 className="gb-level-name">Blueprint Brawl</h1>
          </div>
        </div>
      </header>

      <main className="gb-level-body">
        {phase === 'briefing' ? (
          <div className="gb-df-layout">
            <section ref={stageFocusRef} className="gb-panel gb-df-lesson-panel">
              <div className="gb-df-lesson-hero">
                <span className="gb-panel-chip">{briefing.chip}</span>
                <h2 className="gb-panel-title">{briefing.title}</h2>
                <p className="gb-panel-copy">{briefing.body}</p>
              </div>

              {briefingStep === 0 && (
                <div className="gb-df-lesson-grid">
                  <div className="gb-df-analogy-strip">
                    <div className="gb-df-analogy-card">
                      <span className="gb-lesson-label">Dockerfile</span>
                      <strong>The recipe sheet</strong>
                      <p>Tells Docker how to build the cartridge.</p>
                    </div>
                    <div className="gb-df-analogy-card">
                      <span className="gb-lesson-label">Image</span>
                      <strong>The finished cartridge</strong>
                      <p>The packaged result after Docker follows the recipe.</p>
                    </div>
                    <div className="gb-df-analogy-card">
                      <span className="gb-lesson-label">Container</span>
                      <strong>The powered-on game</strong>
                      <p>The live running version after the image starts.</p>
                    </div>
                  </div>

                  <div className="gb-command-card gb-df-code-card">
                    <div>
                      <span className="gb-lesson-label">Tiny example</span>
                      <p>This is a beginner-sized Dockerfile. Docker reads it from top to bottom.</p>
                    </div>

                    <pre className="gb-code-block">
                      <code>{`FROM ubuntu:22.04\nCOPY . /arcade\nCMD ["npm", "start"]`}</code>
                    </pre>
                  </div>
                </div>
              )}

              {briefingStep === 1 && (
                <div className="gb-df-instruction-grid">
                  {DOCKERFILE_BLOCKS.map((block) => (
                    <article key={block.id} className="gb-df-instruction-card">
                      <span className="gb-df-instruction-token">{block.id}</span>
                      <strong>{block.beginnerLabel}</strong>
                      <p>{block.summary}</p>
                      <code>{block.line}</code>
                    </article>
                  ))}
                </div>
              )}

              {briefingStep === 2 && (
                <div className="gb-df-mission-strip">
                  {WORK_ORDERS.map((order, index) => (
                    <article key={order.target} className="gb-df-mission-card">
                      <span className="gb-lesson-label">Step {index + 1}</span>
                      <strong>{order.target}</strong>
                      <p>{order.prompt}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="gb-dialogue-card gb-dialogue-card-narrator gb-df-sidebar">
              <div className="gb-panel-chip">Narrator</div>
              <h2 className="gb-panel-title">Slow and simple first</h2>
              <p className="gb-panel-copy">{briefing.takeaway}</p>

              <div className="gb-lesson-card">
                <span className="gb-lesson-label">Beginner rule</span>
                <p>
                  Do not memorize everything at once. For this level, remember what each instruction is
                  for before you worry about advanced setups.
                </p>
              </div>

              <div className="gb-df-cheat-card">
                <span className="gb-lesson-label">Need-to-know</span>
                <div className="gb-df-cheat-list">
                  <div>
                    <strong>FROM</strong>
                    <span>starting image</span>
                  </div>
                  <div>
                    <strong>COPY</strong>
                    <span>moves files in</span>
                  </div>
                  <div>
                    <strong>RUN</strong>
                    <span>does build work</span>
                  </div>
                  <div>
                    <strong>CMD</strong>
                    <span>sets startup</span>
                  </div>
                </div>
              </div>

              <div className="gb-dialogue-footer">
                <div className="gb-step-tracker" aria-label="Briefing progress">
                  {BRIEFING_STEPS.map((step, index) => (
                    <span key={step.title} className={`gb-step-dot ${index <= briefingStep ? 'is-active' : ''}`} />
                  ))}
                </div>

                <button className="gb-primary-btn" onClick={handleAdvanceBriefing}>
                  {briefingStep === BRIEFING_STEPS.length - 1 ? 'Start factory training' : 'Next lesson'}
                </button>
              </div>
            </aside>
          </div>
        ) : (
          <div className="gb-df-stage-shell">
            <section ref={stageFocusRef} className="gb-panel gb-df-stage-panel">
              <div className="gb-df-stage-hero">
                <div>
                  <span className="gb-panel-chip">
                    {phase === 'complete'
                      ? 'Batch complete'
                      : phase === 'building'
                        ? 'Build in progress'
                        : currentOrder?.chip ?? 'Assembly line'}
                  </span>
                  <h2 className="gb-panel-title">
                    {phase === 'complete'
                      ? 'The cartridge recipe worked'
                      : phase === 'building'
                        ? `Docker is building the image${countdown ? ` in ${countdown}...` : '...'}` 
                        : currentOrder?.title}
                  </h2>
                  <p className="gb-panel-copy">
                    {phase === 'complete'
                      ? 'The robots followed the Dockerfile, burned the cartridge, and sent it down the belt. That is the point of a Dockerfile: repeatable image builds.'
                      : phase === 'building'
                        ? 'Watch the build chamber. Docker is executing the recipe from the first line to the last.'
                        : currentOrder?.prompt}
                  </p>
                </div>

                <div className="gb-df-stat-row">
                  <div className="gb-df-stat-pill">
                    <span className="gb-lesson-label">Recipe</span>
                    <strong>{placedBlocks.length}/3</strong>
                  </div>
                  <div className="gb-df-stat-pill">
                    <span className="gb-lesson-label">Charge</span>
                    <strong>{chargePercent}%</strong>
                  </div>
                  <div className="gb-df-stat-pill">
                    <span className="gb-lesson-label">Misfires</span>
                    <strong>{mistakes}</strong>
                  </div>
                </div>
              </div>

              <div className="gb-df-action-banner">
                <div className="gb-df-action-step">
                  <span>1</span>
                  <strong>Drag a block from the tray</strong>
                </div>
                <div className="gb-df-action-arrow" aria-hidden="true">→</div>
                <div className="gb-df-action-step">
                  <span>2</span>
                  <strong>Drop it into the glowing slot</strong>
                </div>
                <div className="gb-df-action-arrow" aria-hidden="true">→</div>
                <div className="gb-df-action-step">
                  <span>3</span>
                  <strong>Build when all 3 slots are filled</strong>
                </div>
              </div>

              <div className="gb-df-focus-grid">
                <div className="gb-df-tray gb-df-tray-primary">
                  <div className="gb-df-panel-head">
                    <span className="gb-lesson-label">Step 1</span>
                    <strong>Drag these instruction blocks</strong>
                  </div>

                  <div className="gb-df-tray-callout">
                    Pick the block that matches the current work order, then drag it into the highlighted slot on the right.
                  </div>

                  <div className="gb-df-block-row">
                    {DOCKERFILE_BLOCKS.map((block) => {
                      const isUsed = placedBlocks.includes(block.id)
                      const isDisabled = phase === 'building' || phase === 'complete' || isUsed

                      return (
                        <button
                          key={block.id}
                          className={`gb-df-block ${isUsed ? 'is-used' : ''}`}
                          draggable={!isDisabled}
                          disabled={isDisabled}
                          onClick={() => handlePlaceBlock(block.id)}
                          onDragStart={(event) => handleDragStart(event, block.id)}
                        >
                          <span className="gb-df-block-token">{block.id}</span>
                          <strong>{block.beginnerLabel}</strong>
                          <span>{block.summary}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="gb-df-workbench">
                  <div
                    className={`gb-df-blueprint-panel ${dropActive ? 'is-drop-active' : ''}`}
                    onDragOver={(event) => {
                      event.preventDefault()
                      if (phase === 'assembly') setDropActive(true)
                    }}
                    onDragLeave={() => setDropActive(false)}
                    onDrop={handleDrop}
                  >
                    <div className="gb-df-panel-head">
                      <span className="gb-lesson-label">Step 2</span>
                      <strong>Drop into the blueprint board</strong>
                    </div>

                    <div className="gb-df-drop-callout">
                      {phase === 'complete'
                        ? 'All recipe slots are complete.'
                        : dropActive
                          ? 'Release to drop into the glowing slot.'
                          : 'The next correct slot glows. Drop the matching block there.'}
                    </div>

                    <div className="gb-df-slot-list">
                      {TARGET_SEQUENCE.map((required, index) => {
                        const placed = placedBlocks[index]
                        const block = placed ? getBlock(placed) : null
                        const isTarget = index === placedBlocks.length && phase === 'assembly'

                        return (
                          <div
                            key={required}
                            className={`gb-df-slot ${block ? 'is-filled' : ''} ${isTarget ? 'is-target' : ''}`}
                          >
                            <span className="gb-df-slot-index">{index + 1}</span>
                            {block ? (
                              <div className="gb-df-slot-copy">
                                <strong>{block.id}</strong>
                                <span>{block.line}</span>
                              </div>
                            ) : (
                              <div className="gb-df-slot-copy is-placeholder">
                                <span>Drop the next block here</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className={`gb-df-feedback-card is-${feedback.tone}`}>
                      <span className="gb-lesson-label">
                        {feedback.tone === 'success'
                          ? 'Robot update'
                          : feedback.tone === 'warning'
                            ? 'Factory warning'
                            : 'Narrator note'}
                      </span>
                      <p>{feedback.message}</p>
                    </div>
                  </div>

                  <div className="gb-df-build-panel">
                    <div className="gb-df-panel-head">
                      <span className="gb-lesson-label">Step 3</span>
                      <strong>Build once the recipe is full</strong>
                    </div>

                    <div className="gb-df-cartridge-bay">
                      <div className="gb-df-bay-glow" />
                      <div className={`gb-df-cartridge ${phase === 'building' ? 'is-building' : ''} ${phase === 'complete' ? 'is-complete' : ''}`}>
                        <img src={cartridge1} alt="Training cartridge in the build chamber" className="gb-df-cartridge-shell" />
                        <div className="gb-df-cartridge-copy">
                          <strong>MyShooter</strong>
                          <span>{phase === 'complete' ? 'Image complete' : isRecipeReady ? 'Recipe loaded' : 'Waiting for recipe'}</span>
                        </div>
                      </div>

                      {phase === 'building' && countdown && (
                        <div className="gb-df-countdown">{countdown}</div>
                      )}

                      {phase === 'complete' && (
                        <div className="gb-df-reward-banner">Revenue +${REWARD_AMOUNT}</div>
                      )}
                    </div>

                    <div className="gb-df-charge-card">
                      <div className="gb-df-charge-copy">
                        <span className="gb-lesson-label">Cartridge charge</span>
                        <strong>{chargePercent}%</strong>
                      </div>
                      <div className="gb-df-charge-bar">
                        <div className="gb-df-charge-fill" style={{ width: `${chargePercent}%` }} />
                      </div>
                    </div>

                    <div className="gb-df-build-actions">
                      {phase === 'complete' ? (
                        <button className="gb-primary-btn" onClick={handleClearStage}>
                          Clear stage
                        </button>
                      ) : (
                        <button className="gb-primary-btn" disabled={!isRecipeReady || phase !== 'assembly'} onClick={handleBuild}>
                          BUILD
                        </button>
                      )}

                      <button className="gb-df-reset-btn" disabled={phase === 'building'} onClick={handleReset}>
                        Reset recipe
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
