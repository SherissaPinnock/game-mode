import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import coinImage from '@/assets/game-boy/coin.png'
import gameBoyImage from '@/assets/game-boy/gameboy.png'
import treasureChestImage from '@/assets/game-boy/treasure chest.png'
import {
  playClick,
  playComplete,
  playPop,
  playCoin,
} from '@/lib/sounds'

import {
  DEFAULT_LOADOUT,
  getHeroById,
  getSettingById,
  type GameBoyLoadout,
} from '../data/loadout'

interface VolumeCollapseLevelProps {
  levelNumber: number
  loadout?: GameBoyLoadout
  onBack: () => void
  onComplete: () => void
}

type VolumePhase =
  | 'briefing'
  | 'mount'
  | 'round1'
  | 'round-break'
  | 'shared-mount'
  | 'round2'
  | 'results'

type Coin = {
  id: number
  containerIndex: number
  x: number
  y: number
  speed: number
  drift: number
  dragging: boolean
}

type DragState = {
  coinId: number
  pointerX: number
  pointerY: number
}

type VolumeRoundConfig = {
  containerCount: number
  durationMs: number
  label: string
  spawnEveryMs: number
  speedMin: number
  speedMax: number
}

type RoundViewState = {
  coins: Coin[]
  destroyed: number
  saved: number
  timeLeft: number
  elapsedMs: number
}

type RoundRuntime = RoundViewState & {
  active: boolean
  currentConfig: VolumeRoundConfig | null
  lastAt: number
  nextCoinAt: number
  nextCoinId: number
  startedAt: number
}

const ROUND_CONFIGS: Record<'round1' | 'round2', VolumeRoundConfig> = {
  round1: {
    containerCount: 1,
    durationMs: 15_000,
    label: 'Round 1',
    spawnEveryMs: 280,
    speedMin: 0.018,
    speedMax: 0.025,
  },
  round2: {
    containerCount: 2,
    durationMs: 15_000,
    label: 'Round 2',
    spawnEveryMs: 190,
    speedMin: 0.023,
    speedMax: 0.032,
  },
}

const EMPTY_ROUND_VIEW: RoundViewState = {
  coins: [],
  destroyed: 0,
  saved: 0,
  timeLeft: 15,
  elapsedMs: 0,
}

function SpriteStrip({
  alt,
  className,
  frame,
  frames,
  sprite,
}: {
  alt?: string
  className: string
  frame: number
  frames: number
  sprite: string
}) {
  return (
    <div className={className}>
      <img
        src={sprite}
        alt={alt ?? ''}
        aria-hidden={alt ? undefined : true}
        style={{
          width: `${frames * 100}%`,
          transform: `translateX(-${(100 / frames) * frame}%)`,
        }}
      />
    </div>
  )
}

function createRoundRuntime(config: VolumeRoundConfig, now: number): RoundRuntime {
  return {
    ...EMPTY_ROUND_VIEW,
    active: true,
    currentConfig: config,
    lastAt: now,
    nextCoinAt: now + 160,
    nextCoinId: 0,
    startedAt: now,
    timeLeft: Math.ceil(config.durationMs / 1000),
  }
}

function randomCoin(containerCount: number, id: number, config: VolumeRoundConfig): Coin {
  return {
    id,
    containerIndex: Math.floor(Math.random() * containerCount),
    x: 9 + Math.random() * 74,
    y: -12,
    speed: config.speedMin + Math.random() * (config.speedMax - config.speedMin),
    drift: (Math.random() - 0.5) * 0.002,
    dragging: false,
  }
}

export function VolumeCollapseLevel({
  levelNumber,
  loadout,
  onBack,
  onComplete,
}: VolumeCollapseLevelProps) {
  const resolvedLoadout = loadout ?? DEFAULT_LOADOUT
  const selectedHero = getHeroById(resolvedLoadout.heroId)
  const selectedSetting = getSettingById(resolvedLoadout.settingId)

  const [phase, setPhase] = useState<VolumePhase>('briefing')
  const [mountReady, setMountReady] = useState(false)
  const [mountDraggingSource, setMountDraggingSource] = useState<number | null>(null)
  const [roundView, setRoundView] = useState<RoundViewState>(EMPTY_ROUND_VIEW)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [roundSavedTotal, setRoundSavedTotal] = useState(0)
  const [roundDestroyedTotal, setRoundDestroyedTotal] = useState(0)
  const [roundSummary, setRoundSummary] = useState<{ saved: number; destroyed: number } | null>(null)
  const [mountHint, setMountHint] = useState('Link the Game Boy container to the Docker Volume chest to mount persistent storage.')
  const [sharedMountLinks, setSharedMountLinks] = useState<number[]>([])
  const [sharedMountDraggingSource, setSharedMountDraggingSource] = useState<number | null>(null)
  const [sharedMountHint, setSharedMountHint] = useState(
    'Link both Game Boy containers to the same Docker Volume chest so one shared volume can survive both resets.',
  )
  const [idleTick, setIdleTick] = useState(0)

  const runtimeRef = useRef<RoundRuntime | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const chestRef = useRef<HTMLDivElement | null>(null)

  const heroFrame = idleTick % selectedHero.frames
  const currentRoundConfig = useMemo(() => {
    if (phase === 'round1') return ROUND_CONFIGS.round1
    if (phase === 'round2') return ROUND_CONFIGS.round2
    return null
  }, [phase])
  const activeDragCoin = dragState
    ? roundView.coins.find((coin) => coin.id === dragState.coinId) ?? null
    : null
  const mountDragging = mountDraggingSource !== null
  const sharedMountReady = sharedMountLinks.length === 2
  const stageVars = {
    '--gb-accent': selectedHero.accent,
  } as CSSProperties

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIdleTick((tick) => tick + 1)
    }, 150)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!dragState) return

    function handlePointerMove(event: PointerEvent) {
      setDragState((current) =>
        current
          ? {
              ...current,
              pointerX: event.clientX,
              pointerY: event.clientY,
            }
          : null,
      )
    }

    function handlePointerUp(event: PointerEvent) {
      finishDrag(event.clientX, event.clientY)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragState, roundView.coins])

  useEffect(() => {
    if (!currentRoundConfig) return

    const runtime = createRoundRuntime(currentRoundConfig, window.performance.now())
    runtimeRef.current = runtime
    setRoundView({
      ...EMPTY_ROUND_VIEW,
      timeLeft: Math.ceil(currentRoundConfig.durationMs / 1000),
    })
    setDragState(null)

    function tick(now: number) {
      const runtimeState = runtimeRef.current
      if (!runtimeState || !runtimeState.active || !runtimeState.currentConfig) return

      const dt = Math.min(32, Math.max(16, now - runtimeState.lastAt))
      runtimeState.lastAt = now

      const elapsed = now - runtimeState.startedAt
      const remaining = Math.max(0, runtimeState.currentConfig.durationMs - elapsed)
      runtimeState.elapsedMs = elapsed
      runtimeState.timeLeft = remaining > 0 ? Math.ceil(remaining / 1000) : 0

      while (now >= runtimeState.nextCoinAt) {
        runtimeState.coins.push(
          randomCoin(
            runtimeState.currentConfig.containerCount,
            runtimeState.nextCoinId,
            runtimeState.currentConfig,
          ),
        )
        runtimeState.nextCoinId += 1
        runtimeState.nextCoinAt += runtimeState.currentConfig.spawnEveryMs
      }

      const survivingCoins: Coin[] = []

      for (const coin of runtimeState.coins) {
        if (coin.dragging) {
          survivingCoins.push(coin)
          continue
        }

        coin.x = Math.max(5, Math.min(84, coin.x + coin.drift * dt))
        coin.y += coin.speed * dt

        if (coin.y > 94) {
          runtimeState.destroyed += 1
          continue
        }

        survivingCoins.push(coin)
      }

      runtimeState.coins = survivingCoins

      setRoundView({
        coins: runtimeState.coins.map((coin) => ({ ...coin })),
        destroyed: runtimeState.destroyed,
        saved: runtimeState.saved,
        timeLeft: runtimeState.timeLeft,
        elapsedMs: runtimeState.elapsedMs,
      })

      if (remaining <= 0) {
        const unsaved = runtimeState.coins.length
        const finalSaved = runtimeState.saved
        const finalDestroyed = runtimeState.destroyed + unsaved

        runtimeState.active = false
        runtimeState.coins = []
        setRoundView({
          coins: [],
          destroyed: finalDestroyed,
          saved: finalSaved,
          timeLeft: 0,
          elapsedMs: runtimeState.elapsedMs,
        })
        setDragState(null)
        finishRound(finalSaved, finalDestroyed)
        return
      }

      animationFrameRef.current = window.requestAnimationFrame(tick)
    }

    animationFrameRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = null
      runtimeRef.current = null
    }
  }, [currentRoundConfig])

  function handleBack() {
    playClick()
    onBack()
  }

  function handleMountPlug(
    event?:
      | DragEvent<HTMLButtonElement>
      | ReactMouseEvent<HTMLButtonElement>
      | ReactPointerEvent<HTMLButtonElement>,
  ) {
    event?.preventDefault()
    if (mountReady) return

    setMountDraggingSource(0)
    setMountHint('Now drop or tap the treasure chest to finish the mount.')
    playClick()
  }

  function completeMount() {
    if (mountReady || mountDraggingSource === null) return

    setMountDraggingSource(null)
    setMountReady(true)
    setMountHint('Mounted. The chain is live, so anything moved into the chest survives the container reset.')
    playPop()
  }

  function handleChestMount() {
    if (!mountDragging) return
    completeMount()
  }

  function handleMountDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (event.dataTransfer.getData('text/plain') !== 'volume-link:0') return
    completeMount()
  }

  function openMountStep() {
    playClick()
    setPhase('mount')
  }

  function openSharedMountStep() {
    playClick()
    setSharedMountLinks([])
    setSharedMountDraggingSource(null)
    setSharedMountHint(
      'Link both Game Boy containers to the same Docker Volume chest so one shared volume can survive both resets.',
    )
    setPhase('shared-mount')
  }

  function handleSharedMountPlug(
    source: number,
    event?:
      | DragEvent<HTMLButtonElement>
      | ReactMouseEvent<HTMLButtonElement>
      | ReactPointerEvent<HTMLButtonElement>,
  ) {
    event?.preventDefault()
    if (sharedMountLinks.includes(source)) return

    setSharedMountDraggingSource(source)
    setSharedMountHint(`Now drop or tap the volume chest to link Container ${source + 1}.`)
    playClick()
  }

  function completeSharedMount(source: number) {
    if (sharedMountLinks.includes(source)) {
      setSharedMountDraggingSource(null)
      return
    }

    const nextLinks = [...sharedMountLinks, source].sort((left, right) => left - right)
    const remainingSource = [0, 1].find((index) => !nextLinks.includes(index))

    setSharedMountLinks(nextLinks)
    setSharedMountDraggingSource(null)
    setSharedMountHint(
      remainingSource === undefined
        ? 'Both containers are mounted to the same volume. Start round 2 when you are ready.'
        : `Container ${source + 1} linked. Now connect Container ${remainingSource + 1} to the same volume chest.`,
    )
    playPop()
  }

  function handleSharedChestMount() {
    if (sharedMountDraggingSource === null) return
    completeSharedMount(sharedMountDraggingSource)
  }

  function handleSharedMountDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()

    const payload = event.dataTransfer.getData('text/plain')
    if (!payload.startsWith('volume-link:')) return

    const source = Number(payload.split(':')[1])
    if (Number.isNaN(source)) return

    completeSharedMount(source)
  }

  function startRound(round: 'round1' | 'round2') {
    playCoin()
    setPhase(round)
    setRoundSummary(null)
  }

  function finishRound(saved: number, destroyed: number) {
    playComplete()
    setRoundSavedTotal((total) => total + saved)
    setRoundDestroyedTotal((total) => total + destroyed)
    setRoundSummary({ saved, destroyed })

    if (phase === 'round1') {
      setPhase('round-break')
      return
    }

    setPhase('results')
  }

  function startCoinDrag(coinId: number, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!currentRoundConfig) return

    event.preventDefault()
    setDragState({
      coinId,
      pointerX: event.clientX,
      pointerY: event.clientY,
    })
    runtimeRef.current = runtimeRef.current
      ? {
          ...runtimeRef.current,
          coins: runtimeRef.current.coins.map((coin) =>
            coin.id === coinId ? { ...coin, dragging: true } : coin,
          ),
        }
      : runtimeRef.current

    setRoundView((current) => ({
      ...current,
      coins: current.coins.map((coin) => (coin.id === coinId ? { ...coin, dragging: true } : coin)),
    }))
  }

  function finishDrag(pointerX: number, pointerY: number) {
    if (!dragState || !runtimeRef.current) return

    const chestBounds = chestRef.current?.getBoundingClientRect()
    const isChestHit =
      chestBounds &&
      pointerX >= chestBounds.left &&
      pointerX <= chestBounds.right &&
      pointerY >= chestBounds.top &&
      pointerY <= chestBounds.bottom

    if (isChestHit) {
      runtimeRef.current.coins = runtimeRef.current.coins.filter((coin) => coin.id !== dragState.coinId)
      runtimeRef.current.saved += 1
      playPop()
      setRoundView({
        coins: runtimeRef.current.coins.map((coin) => ({ ...coin })),
        destroyed: runtimeRef.current.destroyed,
        saved: runtimeRef.current.saved,
        timeLeft: runtimeRef.current.timeLeft,
        elapsedMs: runtimeRef.current.elapsedMs,
      })
      setDragState(null)
      return
    }

    runtimeRef.current.coins = runtimeRef.current.coins.map((coin) =>
      coin.id === dragState.coinId ? { ...coin, dragging: false } : coin,
    )
    setRoundView({
      coins: runtimeRef.current.coins.map((coin) => ({ ...coin })),
      destroyed: runtimeRef.current.destroyed,
      saved: runtimeRef.current.saved,
      timeLeft: runtimeRef.current.timeLeft,
      elapsedMs: runtimeRef.current.elapsedMs,
    })
    setDragState(null)
  }

  const gameplayStage = currentRoundConfig ? (
    <section className="gb-panel gb-vol-stage-panel">
      <div className="gb-vol-stage-copy">
        <div>
          <span className="gb-panel-chip">
            {currentRoundConfig.label}
            {currentRoundConfig.containerCount > 1 ? ' • Shared volume' : ''}
          </span>
          <h2 className="gb-panel-title">
            {phase === 'round1'
              ? 'Save the coins before the container collapses'
              : 'Two containers, one shared volume'}
          </h2>
          <p className="gb-panel-copy">
            {phase === 'round1'
              ? 'Coins left inside the container vanish when it gets destroyed. Drag as many as you can into the Docker Volume chest in 15 seconds.'
              : 'Now it gets harder: two containers are pouring coins into the same shared volume. Save them before both containers reset.'}
          </p>
        </div>

        <div className="gb-vol-stat-row">
          <div className="gb-vol-stat-pill">
            <span className="gb-lesson-label">Timer</span>
            <strong>{roundView.timeLeft}s</strong>
          </div>
          <div className="gb-vol-stat-pill">
            <span className="gb-lesson-label">Saved</span>
            <strong>{roundView.saved}</strong>
          </div>
          <div className="gb-vol-stat-pill">
            <span className="gb-lesson-label">Destroyed</span>
            <strong>{roundView.destroyed}</strong>
          </div>
        </div>
      </div>

      <div
        className={`gb-vol-arena ${currentRoundConfig.containerCount > 1 ? 'is-shared' : ''}`}
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(7, 22, 31, 0.18), rgba(7, 22, 31, 0.62)), url(${selectedSetting.image})`,
        }}
      >
        <div className="gb-vol-arena-hint">
          Grab coins from the container{currentRoundConfig.containerCount > 1 ? 's' : ''} and drop them into the volume chest.
        </div>

        <div
          className={`gb-vol-container-grid is-${currentRoundConfig.containerCount}-up ${currentRoundConfig.containerCount > 1 ? 'is-shared' : ''}`}
        >
          {Array.from({ length: currentRoundConfig.containerCount }).map((_, containerIndex) => (
            <div key={containerIndex} className="gb-vol-container-card">
              {currentRoundConfig.containerCount === 1 && <div className="gb-vol-link" aria-hidden="true" />}
              <div className="gb-console-wrap gb-vol-console-wrap">
                <img src={gameBoyImage} alt={`Container ${containerIndex + 1}`} className="gb-console-image" />
                <div className="gb-screen-overlay is-live gb-vol-screen">
                  <div className="gb-vol-screen-label">Container {containerIndex + 1}</div>

                  {containerIndex === 0 && (
                    <SpriteStrip
                      className="gb-vol-hero-sprite"
                      frame={heroFrame}
                      frames={selectedHero.frames}
                      sprite={selectedHero.sprite}
                    />
                  )}

                  {roundView.coins
                    .filter((coin) => coin.containerIndex === containerIndex && !coin.dragging)
                    .map((coin) => (
                      <button
                        key={coin.id}
                        className="gb-vol-coin"
                        onPointerDown={(event) => startCoinDrag(coin.id, event)}
                        style={{
                          left: `${coin.x}%`,
                          top: `${coin.y}%`,
                          backgroundImage: `url(${coinImage})`,
                        }}
                        aria-label="Grab coin"
                      />
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`gb-vol-chest-dock ${currentRoundConfig.containerCount > 1 ? 'is-shared' : ''}`}>
          <div className="gb-vol-dock-label">Docker Volume</div>
          <div ref={chestRef} className="gb-vol-chest-target">
            <img src={treasureChestImage} alt="Docker volume treasure chest" className="gb-vol-chest-image" />
            <div className="gb-vol-chest-count">Saved {roundView.saved}</div>
          </div>
        </div>

        {activeDragCoin && dragState && (
          <div
            className="gb-vol-floating-coin"
            style={{
              left: dragState.pointerX,
              top: dragState.pointerY,
              backgroundImage: `url(${coinImage})`,
            }}
          />
        )}
      </div>
    </section>
  ) : null

  return (
    <div className="gb-level" style={stageVars}>
      <header className="gb-level-header">
        <button className="gb-back-btn" onClick={handleBack}>
          ← Back to roadmap
        </button>

        <div className="gb-level-title">
          <span className="gb-level-badge">Level {String(levelNumber).padStart(2, '0')}</span>
          <div>
            <p className="gb-level-kicker">Docker Game Boy</p>
            <h1 className="gb-level-name">Container Collapse</h1>
          </div>
        </div>
      </header>

      <main className="gb-level-body">
        {phase === 'briefing' && (
          <div className="gb-vol-layout is-single">
            <section className="gb-panel gb-vol-info-panel">
              <div className="gb-panel-chip">Volume briefing</div>
              <h2 className="gb-panel-title">Coins left in the container disappear</h2>
              <p className="gb-panel-copy">
                A container is temporary. When it gets destroyed, anything still inside goes with it. A
                Docker volume is like a treasure chest outside the Game Boy. Move coins into the volume,
                and they survive.
              </p>

              <div className="gb-vol-fact-grid">
                <div className="gb-vol-fact-card">
                  <span className="gb-lesson-label">Container</span>
                  <strong>Temporary space</strong>
                  <p>Fast to start, easy to replace, unsafe for important coins.</p>
                </div>
                <div className="gb-vol-fact-card">
                  <span className="gb-lesson-label">Volume</span>
                  <strong>Persistent storage</strong>
                  <p>Lives outside the container, so saved coins remain after a reset.</p>
                </div>
                <div className="gb-vol-fact-card">
                  <span className="gb-lesson-label">Mount</span>
                  <strong>The connection</strong>
                  <p>Mounting links the container to the volume so data can move between them.</p>
                </div>
              </div>

              <div className="gb-command-card">
                <div>
                  <span className="gb-lesson-label">Main lesson</span>
                  <p>Coins left in the container disappear. Coins moved to the volume survive.</p>
                </div>

                <pre className="gb-code-block">
                  <code>docker run -v coin-save:/game/data my-shooter:v1</code>
                </pre>
              </div>

              <div className="gb-dialogue-footer">
                <span className="gb-lesson-label">Next up: mount the volume so coins can escape the container</span>
                <button className="gb-primary-btn" onClick={openMountStep}>
                  Next
                </button>
              </div>
            </section>
          </div>
        )}

        {phase === 'mount' && (
          <div className="gb-vol-layout is-single">
            <section className="gb-panel gb-vol-mount-panel">
              <div className="gb-panel-chip">Mount the volume</div>
              <h2 className="gb-panel-title">Link the Game Boy to the volume chest</h2>
              <p className="gb-panel-copy">{mountHint}</p>

              <div className="gb-vol-stat-row">
                <div className="gb-vol-stat-pill">
                  <span className="gb-lesson-label">Mounted</span>
                  <strong>{mountReady ? '1/1' : '0/1'}</strong>
                </div>
                <div className="gb-vol-stat-pill">
                  <span className="gb-lesson-label">Goal</span>
                  <strong>Make saved coins survive</strong>
                </div>
              </div>

              <div
                className={`gb-vol-mount-stage ${mountReady ? 'is-linked' : ''} ${mountDragging ? 'is-dragging' : ''}`}
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(7, 22, 31, 0.18), rgba(7, 22, 31, 0.58)), url(${selectedSetting.image})`,
                }}
              >
                <div className="gb-vol-mount-container">
                  <div className="gb-console-wrap gb-vol-console-wrap is-mini">
                    <img src={gameBoyImage} alt="Container Game Boy" className="gb-console-image" />
                    <div className="gb-screen-overlay is-live gb-vol-screen is-mini">
                      <SpriteStrip
                        className="gb-vol-hero-sprite is-mini"
                        frame={heroFrame}
                        frames={selectedHero.frames}
                        sprite={selectedHero.sprite}
                      />
                    </div>
                  </div>

                  <button
                    className={`gb-vol-plug-btn ${mountDragging ? 'is-armed' : ''}`}
                    draggable={!mountReady}
                    onClick={handleMountPlug}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', 'volume-link:0')
                      handleMountPlug(event)
                    }}
                    disabled={mountReady}
                  >
                    Mount plug
                  </button>
                </div>

                <div className={`gb-vol-mount-chain ${mountReady ? 'is-active' : ''}`} aria-hidden="true" />

                <div
                  className={`gb-vol-mount-chest ${mountDragging ? 'is-ready' : ''} ${mountReady ? 'is-linked' : ''}`}
                  onClick={handleChestMount}
                  onDragOver={(event) => {
                    event.preventDefault()
                  }}
                  onDrop={handleMountDrop}
                >
                  <img src={treasureChestImage} alt="Docker volume chest" className="gb-vol-chest-image" />
                  <span>Docker Volume</span>
                </div>
              </div>

              <div className="gb-dialogue-footer">
                <button className="gb-primary-btn" disabled={!mountReady} onClick={() => startRound('round1')}>
                  Start round 1
                </button>
              </div>
            </section>
          </div>
        )}

        {(phase === 'round1' || phase === 'round2') && gameplayStage}

        {phase === 'round-break' && (
          <div className="gb-vol-layout is-summary">
            <section className="gb-panel gb-vol-summary-panel">
              <div className="gb-panel-chip">Round 1 clear</div>
              <h2 className="gb-panel-title">The container collapsed</h2>
              <p className="gb-panel-copy">
                Anything still in the container was destroyed. The coins you moved into the volume chest
                survived the reset.
              </p>

              <div className="gb-vol-result-grid">
                <div className="gb-vol-result-card">
                  <span className="gb-lesson-label">Saved</span>
                  <strong>{roundSummary?.saved ?? 0}</strong>
                </div>
                <div className="gb-vol-result-card">
                  <span className="gb-lesson-label">Destroyed</span>
                  <strong>{roundSummary?.destroyed ?? 0}</strong>
                </div>
              </div>

              <div className="gb-lesson-card">
                <span className="gb-lesson-label">Round 2 twist</span>
                <p>Now two containers will dump coins at once, but they will share the same volume chest.</p>
              </div>
            </section>

            <aside className="gb-panel gb-vol-summary-panel">
              <div className="gb-panel-chip">Shared volume</div>
              <h2 className="gb-panel-title">Two containers, one safe chest</h2>
              <p className="gb-panel-copy">
                This is why volumes matter: several containers can point at the same persistent storage.
              </p>

              <button className="gb-primary-btn" onClick={openSharedMountStep}>
                Next: mount shared volume
              </button>
            </aside>
          </div>
        )}

        {phase === 'shared-mount' && (
          <div className="gb-vol-layout is-single">
            <section className="gb-panel gb-vol-mount-panel">
              <div className="gb-panel-chip">Shared volume mount</div>
              <h2 className="gb-panel-title">Connect one volume to both containers</h2>
              <p className="gb-panel-copy">{sharedMountHint}</p>

              <div className="gb-vol-stat-row">
                <div className="gb-vol-stat-pill">
                  <span className="gb-lesson-label">Mounted</span>
                  <strong>{sharedMountLinks.length}/2</strong>
                </div>
                <div className="gb-vol-stat-pill">
                  <span className="gb-lesson-label">Shared volume</span>
                  <strong>1 chest, 2 containers</strong>
                </div>
              </div>

              <div
                className={`gb-vol-mount-stage is-shared ${sharedMountReady ? 'is-linked' : ''} ${sharedMountDraggingSource !== null ? 'is-dragging' : ''}`}
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(7, 22, 31, 0.18), rgba(7, 22, 31, 0.58)), url(${selectedSetting.image})`,
                }}
              >
                <div className="gb-vol-shared-mount-grid">
                  {Array.from({ length: 2 }).map((_, containerIndex) => {
                    const isLinked = sharedMountLinks.includes(containerIndex)

                    return (
                      <div
                        key={containerIndex}
                        className={`gb-vol-shared-container is-${containerIndex === 0 ? 'left' : 'right'} ${isLinked ? 'is-linked' : ''}`}
                      >
                        <div className="gb-console-wrap gb-vol-console-wrap is-mini">
                          <img src={gameBoyImage} alt={`Container ${containerIndex + 1}`} className="gb-console-image" />
                          <div className="gb-screen-overlay is-live gb-vol-screen is-mini">
                            <div className="gb-vol-screen-label">Container {containerIndex + 1}</div>
                            <SpriteStrip
                              className="gb-vol-hero-sprite is-mini"
                              frame={heroFrame}
                              frames={selectedHero.frames}
                              sprite={selectedHero.sprite}
                            />
                          </div>
                        </div>

                        <button
                          className={`gb-vol-plug-btn ${sharedMountDraggingSource === containerIndex ? 'is-armed' : ''}`}
                          draggable={!isLinked}
                          onClick={(event) => handleSharedMountPlug(containerIndex, event)}
                          onDragStart={(event) => {
                            event.dataTransfer.setData('text/plain', `volume-link:${containerIndex}`)
                            handleSharedMountPlug(containerIndex, event)
                          }}
                          disabled={isLinked}
                        >
                          {isLinked ? 'Mounted' : `Mount container ${containerIndex + 1}`}
                        </button>
                      </div>
                    )
                  })}

                  <div className={`gb-vol-shared-chain is-left ${sharedMountLinks.includes(0) ? 'is-active' : ''}`} aria-hidden="true" />
                  <div className={`gb-vol-shared-chain is-right ${sharedMountLinks.includes(1) ? 'is-active' : ''}`} aria-hidden="true" />

                  <div
                    className={`gb-vol-mount-chest is-shared ${sharedMountDraggingSource !== null ? 'is-ready' : ''} ${sharedMountReady ? 'is-linked' : ''}`}
                    onClick={handleSharedChestMount}
                    onDragOver={(event) => {
                      event.preventDefault()
                    }}
                    onDrop={handleSharedMountDrop}
                  >
                    <img src={treasureChestImage} alt="Shared Docker volume chest" className="gb-vol-chest-image" />
                    <span>Shared Docker Volume</span>
                  </div>
                </div>
              </div>

              <div className="gb-dialogue-footer">
                <button className="gb-primary-btn" disabled={!sharedMountReady} onClick={() => startRound('round2')}>
                  Start round 2
                </button>
              </div>
            </section>
          </div>
        )}

        {phase === 'results' && (
          <div className="gb-vol-layout is-summary">
            <section className="gb-panel gb-vol-summary-panel">
              <div className="gb-panel-chip">Level clear</div>
              <h2 className="gb-panel-title">The volume kept the loot alive</h2>
              <p className="gb-panel-copy">
                The shared volume outlived both containers. That is the core Docker lesson: if the data
                matters, store it outside the disposable container.
              </p>

              <div className="gb-vol-result-grid">
                <div className="gb-vol-result-card">
                  <span className="gb-lesson-label">Total saved</span>
                  <strong>{roundSavedTotal}</strong>
                </div>
                <div className="gb-vol-result-card">
                  <span className="gb-lesson-label">Total destroyed</span>
                  <strong>{roundDestroyedTotal}</strong>
                </div>
              </div>

              <div className="gb-command-card">
                <div>
                  <span className="gb-lesson-label">What volumes do</span>
                  <p>Volumes survive container replacement and can be shared across multiple containers.</p>
                </div>

                <pre className="gb-code-block">
                  <code>{`docker volume create coin-save\ndocker run -v coin-save:/game/data my-shooter:v1`}</code>
                </pre>
              </div>
            </section>

            <aside className="gb-panel gb-vol-summary-panel">
              <div className="gb-panel-chip">Main lesson</div>
              <h2 className="gb-panel-title">Coins in the chest survive</h2>
              <p className="gb-panel-copy">
                Coins left in the container disappear. Coins moved to the volume survive. Two containers can
                still share the same volume safely.
              </p>

              <button className="gb-primary-btn" onClick={() => {
                playClick()
                onComplete()
              }}>
                Clear stage
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
