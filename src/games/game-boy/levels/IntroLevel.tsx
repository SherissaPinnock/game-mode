import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from 'react'

import cartridge1 from '@/assets/game-boy/cartridge 1.png'
import cartridge2 from '@/assets/game-boy/cartridge 2.png'
import cartridge3 from '@/assets/game-boy/cartridge 3.png'
import gameBoyImage from '@/assets/game-boy/gameboy.png'
import { INTRO_CONTAINER_LESSON } from '../data/roadmap'
import { useMobileStageFocus } from '../hooks/useMobileStageFocus'

interface IntroLevelProps {
  onBack: () => void
  onComplete: () => void
}

const CARTRIDGES = [
  {
    id: 'dino-green',
    name: 'Dino Dash',
    accent: '#77e87c',
    image: cartridge1,
  },
  {
    id: 'dino-red',
    name: 'Rex Runner',
    accent: '#ff8a76',
    image: cartridge2,
  },
  {
    id: 'dino-gold',
    name: 'Pixel Roar',
    accent: '#ffd36a',
    image: cartridge3,
  },
] as const

type StoryBeat = 0 | 1 | 2 | 3 | 4 | 5 | 6
type IntroSection = 'story' | 'containers' | 'scale'
type ContainerScaleBeat = 0 | 1 | 2

type RunnerObstacle = {
  id: number
  x: number
  width: number
  height: number
  passed: boolean
}

type RunnerViewState = {
  dinoLift: number
  score: number
  hits: number
  flash: boolean
  showPrompt: boolean
  obstacles: RunnerObstacle[]
}

type RunnerRuntime = RunnerViewState & {
  velocity: number
  nextId: number
  startedAt: number
  lastAt: number
  flashUntil: number
}

const GAME_DURATION_MS = 10_000
const DINO_X = 18
const DINO_WIDTH = 10
const JUMP_VELOCITY = 0.16
const GRAVITY = 0.00068
const OBSTACLE_SPEED = 0.062
const INITIAL_RUNNER_VIEW: RunnerViewState = {
  dinoLift: 0,
  score: 0,
  hits: 0,
  flash: false,
  showPrompt: true,
  obstacles: [],
}

const CONTAINER_SCALE_SCENES = [
  {
    chip: 'Old way',
    title: 'Five real consoles',
    body: 'Back then, if you wanted to run a game five times, you had to buy five physical Game Boys. It was heavy, expensive, and a total mess.',
    takeaway: 'One machine per player gets expensive fast.',
    actionLabel: 'Show Docker',
  },
  {
    chip: 'Docker way',
    title: 'One cartridge, many runs',
    body: `With Docker, you keep the Master Cartridge, the image, and just spawn "virtual" Game Boys as you need them.`,
    takeaway: 'One image can start many containers in seconds.',
    actionLabel: 'Why it matters',
  },
  {
    chip: 'Scale up',
    title: 'Avoid the phone booth problem',
    body: 'Think of a game like Pokemon GO. If a million people try to play on just one instance, the server melts. It is a million people trying to fit in one phone booth. Docker lets you build a thousand phone booths in a second.',
    takeaway: 'Containers help you spread traffic instead of crushing one app instance.',
    actionLabel: 'Clear stage',
  },
] as const

const CLUTTERED_CONSOLE_LAYOUT = [
  { top: '8%', left: '6%', width: '34%', transform: 'rotate(-9deg)' },
  { top: '12%', right: '8%', width: '33%', transform: 'rotate(8deg)' },
  { top: '40%', left: '2%', width: '32%', transform: 'rotate(-5deg)' },
  { top: '45%', left: '34%', width: '34%', transform: 'rotate(4deg)' },
  { top: '42%', right: '3%', width: '31%', transform: 'rotate(10deg)' },
] as const

function createObstacle(id: number, offset: number): RunnerObstacle {
  return {
    id,
    x: offset + Math.random() * 10,
    width: 5.8 + Math.random() * 2.4,
    height: 17 + Math.random() * 4,
    passed: false,
  }
}

function createRunnerRuntime(now: number): RunnerRuntime {
  const openingObstacles = [createObstacle(0, 102), createObstacle(1, 144)]

  return {
    ...INITIAL_RUNNER_VIEW,
    obstacles: openingObstacles,
    nextId: 2,
    velocity: 0,
    startedAt: now,
    lastAt: now,
    flashUntil: 0,
  }
}

function getBeatCopy(beat: StoryBeat, cartridgeName: string | null, timeLeft: number) {
  if (beat === 0) {
    return {
      title: 'Docker as a Game Boy',
      body: 'Do you remember the Game Boy or Nintendo DS? When you bought a game, it came as a cartridge.',
      actionLabel: 'Show me the cartridge',
    }
  }

  if (beat === 1) {
    return {
      title: 'Pick a cartridge',
      body: 'Try one now. Drag a cartridge onto the console, or tap one on mobile.',
      actionLabel: null,
    }
  }

  if (beat === 2) {
    return {
      title: `Booting ${cartridgeName ?? 'your game'}`,
      body: `Nice. The cartridge is inserted. Tap the screen or press space to jump and play for ${timeLeft} more second${timeLeft === 1 ? '' : 's'}.`,
      actionLabel: null,
    }
  }

  if (beat === 3) {
    return {
      title: 'Docker image = game cartridge',
      body: 'A Docker image is like a Game Boy game cartridge: software packaged in a standard format, ready to run anywhere Docker understands it.',
      actionLabel: 'Keep going',
    }
  }

  if (beat === 4) {
    return {
      title: 'Portable by design',
      body: 'You could share the same cartridge with a friend and it still worked in her device. That portability is the magic Docker wants for software.',
      actionLabel: 'Next slide',
    }
  }

  if (beat === 5) {
    return {
      title: 'Why Docker feels powerful',
      body: 'Docker aims to make running software as easy as pressing the ON button on a handheld. If someone has Docker, they can run software packaged for Docker.',
      actionLabel: 'Final slide',
    }
  }

  return {
    title: 'Docker saves the day',
    body: 'Writing PC games is harder because of operating systems, drivers, hardware, and setup differences. Docker reduces that chaos by packaging the app in a predictable way.',
    actionLabel: 'Container lesson',
  }
}

export function IntroLevel({ onBack, onComplete }: IntroLevelProps) {
  const [beat, setBeat] = useState<StoryBeat>(0)
  const [section, setSection] = useState<IntroSection>('story')
  const [containerScaleBeat, setContainerScaleBeat] = useState<ContainerScaleBeat>(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const [dropActive, setDropActive] = useState(false)
  const [selectedCartridgeId, setSelectedCartridgeId] = useState<string | null>(null)
  const [lastRunScore, setLastRunScore] = useState(0)
  const [selectedContainerOption, setSelectedContainerOption] = useState<string | null>(null)
  const [runnerView, setRunnerView] = useState<RunnerViewState>(INITIAL_RUNNER_VIEW)
  const runnerRef = useRef<RunnerRuntime | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const selectedCartridge = CARTRIDGES.find((cartridge) => cartridge.id === selectedCartridgeId) ?? null
  const containerLesson = INTRO_CONTAINER_LESSON
  const isContainerCorrect = selectedContainerOption === containerLesson.correctOption
  const beatCopy = getBeatCopy(beat, selectedCartridge?.name ?? null, timeLeft)
  const containerScaleScene = CONTAINER_SCALE_SCENES[containerScaleBeat]
  const themeVars = {
    '--gb-accent': selectedCartridge?.accent ?? '#87d8ff',
  } as CSSProperties
  const stageFocusRef = useMobileStageFocus(`${section}-${beat}-${containerScaleBeat}`)
  const levelHeader = (
    <header className="gb-level-header">
      <button className="gb-back-btn" onClick={onBack}>
        ← Back to roadmap
      </button>

      <div className="gb-level-title">
        <span className="gb-level-badge">Level 01</span>
        <div>
          <p className="gb-level-kicker">Docker Game Boy</p>
          <h1 className="gb-level-name">Cartridge of Code</h1>
        </div>
      </div>
    </header>
  )

  useEffect(() => {
    if (beat !== 2 || !selectedCartridge) return

    const runtime = createRunnerRuntime(window.performance.now())
    runnerRef.current = runtime
    setRunnerView({
      dinoLift: runtime.dinoLift,
      score: runtime.score,
      hits: runtime.hits,
      flash: runtime.flash,
      showPrompt: runtime.showPrompt,
      obstacles: runtime.obstacles,
    })
    setTimeLeft(10)

    function step(now: number) {
      const runner = runnerRef.current
      if (!runner) return

      const dt = Math.min(32, Math.max(16, now - runner.lastAt))
      runner.lastAt = now

      const elapsed = now - runner.startedAt
      const remaining = Math.max(0, GAME_DURATION_MS - elapsed)
      const nextTimeLeft = remaining > 0 ? Math.ceil(remaining / 1000) : 0
      setTimeLeft((current) => (current === nextTimeLeft ? current : nextTimeLeft))

      runner.dinoLift = Math.max(0, runner.dinoLift + runner.velocity * dt)
      runner.velocity -= GRAVITY * dt
      if (runner.dinoLift === 0 && runner.velocity < 0) runner.velocity = 0

      const lastObstacle = runner.obstacles[runner.obstacles.length - 1]
      if (!lastObstacle || lastObstacle.x < 60) {
        runner.obstacles.push(createObstacle(runner.nextId, 108))
        runner.nextId += 1
      }

      runner.obstacles = runner.obstacles
        .map((obstacle) => {
          const nextX = obstacle.x - OBSTACLE_SPEED * dt
          const passed = obstacle.passed || nextX + obstacle.width < DINO_X
          if (!obstacle.passed && passed) runner.score += 1

          return {
            ...obstacle,
            x: nextX,
            passed,
          }
        })
        .filter((obstacle) => obstacle.x + obstacle.width > -12)

      const crashed = runner.obstacles.some((obstacle) => {
        const overlap = obstacle.x < DINO_X + DINO_WIDTH - 1 && obstacle.x + obstacle.width > DINO_X + 1
        const tooLow = runner.dinoLift < obstacle.height - 7
        return overlap && tooLow
      })

      if (crashed && now > runner.flashUntil) {
        runner.hits += 1
        runner.flashUntil = now + 220
        runner.velocity = 0
        runner.dinoLift = 0
        runner.obstacles = runner.obstacles.map((obstacle, index) =>
          index === 0 ? { ...obstacle, x: -20 } : obstacle,
        )
      }

      runner.flash = runner.flashUntil > now

      setRunnerView({
        dinoLift: runner.dinoLift,
        score: runner.score,
        hits: runner.hits,
        flash: runner.flash,
        showPrompt: runner.showPrompt,
        obstacles: runner.obstacles,
      })

      if (remaining <= 0) {
        setLastRunScore(runner.score)
        runnerRef.current = null
        setBeat(3)
        return
      }

      animationFrameRef.current = window.requestAnimationFrame(step)
    }

    animationFrameRef.current = window.requestAnimationFrame(step)

    return () => {
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      runnerRef.current = null
    }
  }, [beat, selectedCartridge])

  useEffect(() => {
    if (beat !== 2) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault()
        handleJump()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [beat])

  function handleNext() {
    if (beat === 6) {
      setSection('containers')
      return
    }

    if (beat === 0 || beat === 3 || beat === 4 || beat === 5) {
      setBeat((current) => (current + 1) as StoryBeat)
    }
  }

  function handleInsertCartridge(cartridgeId: string) {
    if (beat !== 1) return
    setSelectedCartridgeId(cartridgeId)
    setLastRunScore(0)
    setDropActive(false)
    setBeat(2)
  }

  function handleJump() {
    if (beat !== 2) return

    const runner = runnerRef.current
    if (!runner || runner.dinoLift > 1.2) return

    runner.velocity = JUMP_VELOCITY
    if (runner.showPrompt) {
      runner.showPrompt = false
      setRunnerView((current) => ({ ...current, showPrompt: false }))
    }
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, cartridgeId: string) {
    event.dataTransfer.setData('text/plain', cartridgeId)
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDropActive(false)
    const cartridgeId = event.dataTransfer.getData('text/plain')
    if (cartridgeId) handleInsertCartridge(cartridgeId)
  }

  function handleContainerScaleNext() {
    if (containerScaleBeat === CONTAINER_SCALE_SCENES.length - 1) {
      onComplete()
      return
    }

    setContainerScaleBeat((current) => (current + 1) as ContainerScaleBeat)
  }

  if (section === 'containers') {
    return (
      <div className="gb-level" style={themeVars}>
        {levelHeader}

        <main className="gb-level-body">
          <div className="gb-intro-container-layout">
            <section ref={stageFocusRef} className="gb-panel gb-intro-container-panel">
              <div className="gb-intro-container-hero">
                <div>
                  <div className="gb-panel-chip">Containers</div>
                  <h2 className="gb-panel-title">Press start</h2>
                </div>
                <p className="gb-panel-copy">{containerLesson.conceptSummary}</p>
              </div>

              <div className="gb-intro-compare-strip">
                <article className="gb-intro-compare-card">
                  <span className="gb-lesson-label">Image</span>
                  <h3>Game cartridge</h3>
                  <p>Packaged software you can share and move around.</p>
                </article>

                <div className="gb-intro-compare-arrow" aria-hidden="true">→</div>

                <article className="gb-intro-compare-card is-live">
                  <span className="gb-lesson-label">Container</span>
                  <h3>Live session</h3>
                  <p>The running copy after the console powers the game on.</p>
                </article>
              </div>

              <div className="gb-intro-detail-grid">
                <div className="gb-lesson-card gb-intro-analogy-card">
                  <span className="gb-lesson-label">Game Boy analogy</span>
                  <h3>{containerLesson.analogyTitle}</h3>
                  <p>{containerLesson.analogyBody}</p>
                </div>

                <div className="gb-command-card gb-intro-command-card">
                  <span className="gb-lesson-label">{containerLesson.commandLabel}</span>
                  <p>{containerLesson.commandExplanation}</p>
                  <pre className="gb-code-block">
                    <code>{containerLesson.commandExample}</code>
                  </pre>
                </div>
              </div>

              <div className="gb-lesson-card gb-intro-facts-card">
                <span className="gb-lesson-label">Remember</span>
                <ul className="gb-intro-facts-list">
                  {containerLesson.quickFacts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </div>
            </section>

            <aside className="gb-panel gb-intro-checkpoint-panel">
              <div className="gb-panel-chip">Checkpoint</div>
              <h2 className="gb-intro-checkpoint-title">What makes it live?</h2>
              <p className="gb-panel-copy">{containerLesson.challengeQuestion}</p>

              <div className="gb-option-list gb-option-list-compact">
                {containerLesson.challengeOptions.map((option) => {
                  const isSelected = selectedContainerOption === option
                  const optionClass = isSelected
                    ? isContainerCorrect
                      ? 'is-correct'
                      : 'is-wrong'
                    : ''

                  return (
                    <button
                      key={option}
                      className={`gb-option-card ${optionClass}`}
                      onClick={() => setSelectedContainerOption(option)}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {selectedContainerOption && (
                <div className={`gb-feedback-card ${isContainerCorrect ? 'is-success' : 'is-warning'}`}>
                  <p>{isContainerCorrect ? containerLesson.successMessage : containerLesson.challengeHint}</p>
                </div>
              )}

              <button
                className="gb-primary-btn"
                disabled={!isContainerCorrect}
                onClick={() => {
                  setContainerScaleBeat(0)
                  setSection('scale')
                }}
              >
                See scale
              </button>
            </aside>
          </div>
        </main>
      </div>
    )
  }

  if (section === 'scale') {
    return (
      <div className="gb-level" style={themeVars}>
        {levelHeader}

        <main className="gb-level-body">
          <div className="gb-story-layout gb-scale-layout">
            <section ref={stageFocusRef} className="gb-panel gb-scale-stage-panel">
              <div className="gb-scale-stage-copy">
                <div className="gb-panel-chip">Containers</div>
                <h2 className="gb-panel-title">{containerScaleScene.title}</h2>
                <p className="gb-panel-copy">{containerScaleScene.takeaway}</p>
              </div>

              {containerScaleBeat === 0 && (
                <div className="gb-scale-scene gb-scale-scene-clutter">
                  <div className="gb-scale-desk" />

                  {CLUTTERED_CONSOLE_LAYOUT.map((consoleStyle, index) => (
                    <img
                      key={index}
                      src={gameBoyImage}
                      alt=""
                      aria-hidden="true"
                      className="gb-scale-console-clone"
                      style={consoleStyle as CSSProperties}
                    />
                  ))}

                  <div className="gb-scale-scene-caption">Five bulky consoles clutter the whole desk.</div>
                </div>
              )}

              {containerScaleBeat === 1 && (
                <div className="gb-scale-scene gb-scale-scene-spawn">
                  <div className="gb-scale-master-cartridge-wrap">
                    <div className="gb-scale-master-pulse" />
                    <img
                      src={selectedCartridge?.image ?? cartridge1}
                      alt="Master game cartridge"
                      className="gb-scale-master-cartridge"
                    />
                    <span className="gb-scale-master-label">Master cartridge</span>
                  </div>

                  <div className="gb-scale-spawn-arrow" aria-hidden="true">→</div>

                  <div className="gb-scale-virtual-grid" aria-label="Virtual Game Boys appearing">
                    {Array.from({ length: 6 }, (_, index) => (
                      <div key={index} className="gb-scale-virtual-screen">
                        <span>Run {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {containerScaleBeat === 2 && (
                <div className="gb-scale-scene gb-scale-scene-booths">
                  <div className="gb-scale-booth-card is-overloaded">
                    <span className="gb-scale-booth-label">1 booth</span>
                    <div className="gb-scale-crowd">
                      {Array.from({ length: 16 }, (_, index) => (
                        <span key={index} />
                      ))}
                    </div>
                    <strong>Server melts</strong>
                  </div>

                  <div className="gb-scale-booth-divider" aria-hidden="true">vs</div>

                  <div className="gb-scale-booth-grid">
                    {Array.from({ length: 6 }, (_, index) => (
                      <div key={index} className="gb-scale-booth-card">
                        <span className="gb-scale-booth-label">Booth {index + 1}</span>
                        <div className="gb-scale-mini-crowd">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <aside className="gb-dialogue-card gb-dialogue-card-narrator gb-scale-dialogue-card">
              <div className="gb-panel-chip">{containerScaleScene.chip}</div>
              <h2 className="gb-panel-title">{containerScaleScene.title}</h2>
              <p className="gb-panel-copy">{containerScaleScene.body}</p>

              <div className="gb-lesson-card gb-scale-takeaway-card">
                <span className="gb-lesson-label">Takeaway</span>
                <p>{containerScaleScene.takeaway}</p>
              </div>

              <div className="gb-dialogue-footer">
                <div className="gb-step-tracker" aria-label="Scaling story progress">
                  {CONTAINER_SCALE_SCENES.map((_, index) => (
                    <span
                      key={index}
                      className={`gb-step-dot ${index === containerScaleBeat ? 'is-active' : ''}`}
                    />
                  ))}
                </div>

                <button className="gb-primary-btn" onClick={handleContainerScaleNext}>
                  {containerScaleScene.actionLabel}
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="gb-level" style={themeVars}>
      {levelHeader}

      <main className="gb-level-body">
        <div className="gb-story-layout">
          <section ref={stageFocusRef} className="gb-stage-panel">
            <div
              className={`gb-console-stage ${dropActive ? 'is-drop-active' : ''}`}
              onDragOver={(event) => {
                if (beat !== 1) return
                event.preventDefault()
                setDropActive(true)
              }}
              onDragLeave={() => setDropActive(false)}
              onDrop={handleDrop}
            >
              <div className="gb-console-wrap">
                {selectedCartridge && (
                  <img
                    src={selectedCartridge.image}
                    alt={`${selectedCartridge.name} cartridge inserted into the console`}
                    className="gb-inserted-cartridge"
                  />
                )}

                <div className={`gb-console-slot ${beat === 1 ? 'is-visible' : ''}`}>
                  Drop cartridge here
                </div>

                <img src={gameBoyImage} alt="Retro handheld console" className="gb-console-image" />

                <div
                  className={`gb-screen-overlay ${beat === 2 ? 'is-live' : selectedCartridge ? 'is-summary' : 'is-idle'}`}
                >
                  {beat === 2 ? (
                    <div
                      className={`gb-runner-stage ${runnerView.flash ? 'is-hit' : ''}`}
                      aria-label="Playable dinosaur game on the handheld screen"
                      onPointerDown={handleJump}
                    >
                      <div className="gb-runner-hud">
                        <span>SCORE {String(runnerView.score).padStart(2, '0')}</span>
                        <span>{timeLeft}s</span>
                      </div>

                      {runnerView.showPrompt && (
                        <div className="gb-runner-prompt">tap or press space</div>
                      )}

                      <div className="gb-runner-sun" />
                      <div className="gb-runner-cloud gb-runner-cloud-a" />
                      <div className="gb-runner-cloud gb-runner-cloud-b" />

                      <div
                        className="gb-runner-dino"
                        style={{ bottom: `${18 + runnerView.dinoLift}%` }}
                      />

                      {runnerView.obstacles.map((obstacle) => (
                        <div
                          key={obstacle.id}
                          className="gb-runner-cactus"
                          style={{
                            left: `${obstacle.x}%`,
                            width: `${obstacle.width}%`,
                            height: `${obstacle.height}%`,
                          }}
                        />
                      ))}

                      <div className="gb-runner-ground" />
                    </div>
                  ) : selectedCartridge ? (
                    <div className="gb-screen-summary">
                      <span className="gb-screen-mini-label">RUN COMPLETE</span>
                      <strong>{selectedCartridge.name}</strong>
                      <p>Score {String(lastRunScore).padStart(2, '0')}</p>
                    </div>
                  ) : (
                    <div className="gb-screen-idle">
                      <span className="gb-screen-mini-label">POWER ON</span>
                      <strong>INSERT GAME</strong>
                      <p>{beat === 1 ? 'drag cartridge to play' : 'press the button to continue'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {beat >= 1 && (
              <div className="gb-cartridge-rack">
                <div className="gb-rack-copy">
                  <span className="gb-panel-chip">Cartridge rack</span>
                  <p>Try one. Any cartridge that fits the system can boot the same way.</p>
                </div>

                <div className="gb-rack-grid">
                  {CARTRIDGES.map((cartridge) => {
                    const isSelected = cartridge.id === selectedCartridgeId

                    return (
                      <button
                        key={cartridge.id}
                        className={`gb-cartridge-card ${isSelected ? 'is-selected' : ''}`}
                        draggable={beat === 1}
                        disabled={beat !== 1}
                        onClick={() => handleInsertCartridge(cartridge.id)}
                        onDragStart={(event) => handleDragStart(event, cartridge.id)}
                      >
                        <img
                          src={cartridge.image}
                          alt={cartridge.name}
                          className="gb-cartridge-image"
                        />
                        <span>{cartridge.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {beat >= 4 && selectedCartridge && (
              <div className="gb-compatibility-card">
                <div className="gb-mini-console">
                  <img src={gameBoyImage} alt="" />
                  <span>Your handheld</span>
                </div>
                <div className="gb-compatibility-arrow">⇄</div>
                <div className="gb-mini-console">
                  <img src={gameBoyImage} alt="" />
                  <span>Friend&apos;s handheld</span>
                </div>
                <p className="gb-compatibility-caption">
                  Same cartridge, same experience. That is the portability Docker wants for software images.
                </p>
              </div>
            )}

            {beat === 6 && (
              <div className="gb-compare-grid">
                <article className="gb-compare-card is-chaos">
                  <span className="gb-panel-chip">PC game reality</span>
                  <h3>Many combinations to support</h3>
                  <div className="gb-tag-row">
                    <span>OS</span>
                    <span>Drivers</span>
                    <span>Graphics card</span>
                    <span>System setup</span>
                  </div>
                </article>

                <article className="gb-compare-card is-calm">
                  <span className="gb-panel-chip">Docker approach</span>
                  <h3>Package the app once</h3>
                  <div className="gb-tag-row">
                    <span>Image</span>
                    <span>Standard runtime</span>
                    <span>Consistent startup</span>
                    <span>Happy coding</span>
                  </div>
                </article>
              </div>
            )}
          </section>

          <aside className="gb-dialogue-card gb-dialogue-card-narrator">
            <h2 className="gb-panel-title">{beatCopy.title}</h2>
            <p className="gb-panel-copy">{beatCopy.body}</p>

            {beat === 2 && (
              <div className="gb-timer-card">
                <div className="gb-timer-bar">
                  <div
                    className="gb-timer-fill"
                    style={{ width: `${(timeLeft / 10) * 100}%` }}
                  />
                </div>
                <span>{timeLeft}s left on the demo run</span>
              </div>
            )}

            {beat >= 3 && (
              <div className="gb-lesson-card">
                <span className="gb-lesson-label">Takeaway</span>
                <h3>Portable image</h3>
                <p>Package once. Run on any Docker machine.</p>
              </div>
            )}

            <div className="gb-dialogue-footer">
              <div className="gb-step-tracker">
                {[0, 1, 2, 3, 4, 5, 6].map((step) => (
                  <span
                    key={step}
                    className={`gb-step-dot ${step <= beat ? 'is-active' : ''}`}
                  />
                ))}
              </div>

              {beatCopy.actionLabel && (
                <button className="gb-primary-btn" onClick={handleNext}>
                  {beatCopy.actionLabel}
                </button>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
