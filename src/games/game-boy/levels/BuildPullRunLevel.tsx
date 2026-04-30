import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from 'react'

import cartridge3 from '@/assets/game-boy/cartridge 3.png'
import gameBoyImage from '@/assets/game-boy/gameboy.png'
import {
  HEROES,
  SETTINGS,
  VILLAINS,
  type GameBoyLoadout,
  type HeroId,
  type SettingId,
  type VillainId,
} from '../data/loadout'

interface BuildPullRunLevelProps {
  levelNumber: number
  onBack: () => void
  onComplete: (loadout?: GameBoyLoadout) => void
}

type BuildPullRunStep =
  | 'hero'
  | 'villain'
  | 'setting'
  | 'build'
  | 'pull'
  | 'run'
  | 'play'
  | 'v2'

type Shot = {
  id: number
  x: number
}

type Enemy = {
  id: number
  x: number
  hp: number
}

type BattleViewState = {
  enemies: Enemy[]
  flash: boolean
  hp: number
  score: number
  shots: Shot[]
  showPrompt: boolean
  timeLeft: number
  elapsedMs: number
}

type BattleRuntime = BattleViewState & {
  cooldownUntil: number
  flashUntil: number
  lastAt: number
  nextEnemyAt: number
  nextEnemyId: number
  nextShotId: number
  startedAt: number
}

const STEP_ORDER: BuildPullRunStep[] = [
  'hero',
  'villain',
  'setting',
  'build',
  'pull',
  'run',
  'play',
  'v2',
]

const BATTLE_DURATION_MS = 30_000
const ENEMY_WIDTH = 11
const SHOT_SPEED = 0.076
const ENEMY_BASE_SPEED = 0.0115
const ENEMY_SPEED_RAMP = 0.00000028
const SHOT_COOLDOWN_MS = 210
const INITIAL_BATTLE_VIEW: BattleViewState = {
  enemies: [],
  flash: false,
  hp: 100,
  score: 0,
  shots: [],
  showPrompt: true,
  timeLeft: 30,
  elapsedMs: 0,
}

function createBattleRuntime(now: number): BattleRuntime {
  return {
    ...INITIAL_BATTLE_VIEW,
    cooldownUntil: now,
    flashUntil: 0,
    lastAt: now,
    nextEnemyAt: now + 700,
    nextEnemyId: 0,
    nextShotId: 0,
    startedAt: now,
  }
}

function getStepIndex(step: BuildPullRunStep) {
  return STEP_ORDER.indexOf(step)
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

export function BuildPullRunLevel({ levelNumber, onBack, onComplete }: BuildPullRunLevelProps) {
  const [step, setStep] = useState<BuildPullRunStep>('hero')
  const [selectedHeroId, setSelectedHeroId] = useState<HeroId | null>(null)
  const [selectedVillainId, setSelectedVillainId] = useState<VillainId | null>(null)
  const [selectedSettingId, setSelectedSettingId] = useState<SettingId | null>(null)
  const [dropActive, setDropActive] = useState(false)
  const [battleView, setBattleView] = useState<BattleViewState>(INITIAL_BATTLE_VIEW)
  const [lastBattleScore, setLastBattleScore] = useState(0)
  const [lastBattleHp, setLastBattleHp] = useState(100)
  const battleRef = useRef<BattleRuntime | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const selectedHero = HEROES.find((hero) => hero.id === selectedHeroId) ?? null
  const selectedVillain = VILLAINS.find((villain) => villain.id === selectedVillainId) ?? null
  const selectedSetting = SETTINGS.find((setting) => setting.id === selectedSettingId) ?? null
  const themeVars = {
    '--gb-accent': selectedHero?.accent ?? '#87d8ff',
  } as CSSProperties
  const heroFrame = selectedHero ? Math.floor(battleView.elapsedMs / 140) % selectedHero.frames : 0
  const stepIndex = getStepIndex(step)

  useEffect(() => {
    if (step !== 'play' || !selectedHero || !selectedVillain) return

    const runtime = createBattleRuntime(window.performance.now())
    battleRef.current = runtime
    setBattleView(INITIAL_BATTLE_VIEW)

    function finishBattle(nextHp: number, nextScore: number) {
      setLastBattleHp(nextHp)
      setLastBattleScore(nextScore)
      battleRef.current = null
      setStep('v2')
    }

    function stepBattle(now: number) {
      const battle = battleRef.current
      if (!battle) return

      const dt = Math.min(32, Math.max(16, now - battle.lastAt))
      battle.lastAt = now

      const elapsed = now - battle.startedAt
      const remaining = Math.max(0, BATTLE_DURATION_MS - elapsed)
      const nextTimeLeft = remaining > 0 ? Math.ceil(remaining / 1000) : 0
      const enemySpeed = ENEMY_BASE_SPEED + elapsed * ENEMY_SPEED_RAMP

      battle.shots = battle.shots
        .map((shot) => ({
          ...shot,
          x: shot.x + SHOT_SPEED * dt,
        }))
        .filter((shot) => shot.x < 112)

      battle.enemies = battle.enemies
        .map((enemy) => ({
          ...enemy,
          x: enemy.x - enemySpeed * dt,
        }))
        .filter((enemy) => enemy.x > -16)

      if (now >= battle.nextEnemyAt) {
        const spawnDelay = Math.max(360, 1320 - elapsed * 0.028)
        battle.enemies.push({
          id: battle.nextEnemyId,
          x: 108,
          hp: elapsed > 20_000 ? 2 : 1,
        })
        battle.nextEnemyId += 1
        battle.nextEnemyAt = now + spawnDelay * (0.84 + Math.random() * 0.28)
      }

      const spentShots = new Set<number>()
      for (const enemy of battle.enemies) {
        for (const shot of battle.shots) {
          if (spentShots.has(shot.id)) continue
          const overlaps = shot.x >= enemy.x - 1.5 && shot.x <= enemy.x + ENEMY_WIDTH
          if (!overlaps) continue

          spentShots.add(shot.id)
          enemy.hp -= 1
          if (enemy.hp <= 0) {
            battle.score += 10
            enemy.x = -20
          }
          break
        }
      }

      if (spentShots.size > 0) {
        battle.shots = battle.shots.filter((shot) => !spentShots.has(shot.id))
      }

      const leakingEnemies = battle.enemies.filter((enemy) => enemy.x <= 17)
      if (leakingEnemies.length > 0) {
        const totalDamage = leakingEnemies.reduce(
          (sum, enemy) => sum + (enemy.hp > 1 ? 18 : 13),
          0,
        )
        battle.hp = Math.max(0, battle.hp - totalDamage)
        battle.flashUntil = now + 170
        battle.enemies = battle.enemies.filter((enemy) => enemy.x > 17)
      }

      battle.flash = battle.flashUntil > now
      battle.elapsedMs = elapsed
      battle.timeLeft = nextTimeLeft

      setBattleView({
        enemies: battle.enemies,
        flash: battle.flash,
        hp: battle.hp,
        score: battle.score,
        shots: battle.shots,
        showPrompt: battle.showPrompt,
        timeLeft: battle.timeLeft,
        elapsedMs: battle.elapsedMs,
      })

      if (remaining <= 0 || battle.hp <= 0) {
        finishBattle(battle.hp, battle.score)
        return
      }

      animationFrameRef.current = window.requestAnimationFrame(stepBattle)
    }

    animationFrameRef.current = window.requestAnimationFrame(stepBattle)

    return () => {
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      battleRef.current = null
    }
  }, [selectedHero, selectedVillain, step])

  useEffect(() => {
    if (step !== 'play') return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'Space' || event.code === 'KeyJ' || event.code === 'Enter') {
        event.preventDefault()
        handleShoot()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step])

  function handleShoot() {
    if (step !== 'play') return

    const battle = battleRef.current
    const now = window.performance.now()
    if (!battle || now < battle.cooldownUntil) return

    battle.cooldownUntil = now + SHOT_COOLDOWN_MS
    battle.shots.push({
      id: battle.nextShotId,
      x: 21,
    })
    battle.nextShotId += 1

    if (battle.showPrompt) {
      battle.showPrompt = false
      setBattleView((current) => ({ ...current, showPrompt: false }))
    }
  }

  function handleRunInsert() {
    if (step !== 'run') return
    setDropActive(false)
    setStep('play')
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (event.dataTransfer.getData('text/plain') === 'my-shooter') handleRunInsert()
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
    event.dataTransfer.setData('text/plain', 'my-shooter')
    event.dataTransfer.effectAllowed = 'move'
  }

  const stepCopy = (() => {
    if (step === 'hero') {
      return {
        chip: 'First Person Container',
        title: 'Pick your hero',
        body: 'Welcome, Dev. Lets make our own cartridge. Recall: A Docker image is like a cartridge. To save the system, you need a hero. Assemble your shooter loadout.',
        actionLabel: 'Choose villain',
        onAction: () => setStep('villain'),
        disabled: !selectedHero,
      }
    }

    if (step === 'villain') {
      return {
        chip: 'Target lock',
        title: 'Choose a villain',
        body: 'Now choose a villain to defeat.',
        actionLabel: 'Choose setting',
        onAction: () => setStep('setting'),
        disabled: !selectedVillain,
      }
    }

    if (step === 'setting') {
      return {
        chip: 'Map select',
        title: 'Choose a setting',
        body: 'Now select a setting.',
        actionLabel: 'Freeze the image',
        onAction: () => setStep('build'),
        disabled: !selectedSetting,
      }
    }

    if (step === 'build') {
      return {
        chip: 'docker build',
        title: 'Freeze it into an image',
        body: 'Great choices. Now freeze those assets into a solid image. Hit BUILD!',
        actionLabel: 'docker build',
        commandLabel: 'Build command',
        command: 'docker build -t my-shooter:v1 .',
        note: 'You assembled the parts yourself, so Docker builds a brand-new cartridge image.',
        onAction: () => setStep('pull'),
      }
    }

    if (step === 'pull') {
      return {
        chip: 'docker pull',
        title: 'Grab one from the store',
        body: 'To go to the store and get the cartridge, we run docker pull.',
        actionLabel: 'docker pull',
        commandLabel: 'Pull command',
        command: 'docker pull shooter-cartridge:latest',
        note: 'Pull means you fetch a prebuilt image instead of assembling one yourself.',
        onAction: () => setStep('run'),
      }
    }

    if (step === 'run') {
      return {
        chip: 'docker run',
        title: 'Bring the cartridge to life',
        body: `You have the cartridge, but it's just plastic. To bring it to life, we need to docker run it. Pop in ${selectedHero?.name ?? 'your hero'}'s MyShooter build.`,
        actionLabel: 'Pop it in',
        commandLabel: 'Run command',
        command: 'docker run my-shooter:v1',
        note: 'An image is stored software. A running container is the live play session.',
        onAction: handleRunInsert,
      }
    }

    if (step === 'play') {
      return {
        chip: 'Live container',
        title: 'MyShooter v1 is running',
        body: 'The Game Boy screen expands and the container comes alive. Tap, click, or press space to blast the villains for 30 seconds.',
        commandLabel: 'Running command',
        command: 'docker run my-shooter:v1',
        note: 'This is the actual running copy of the image, just like a container is the live version of an image.',
      }
    }

    return {
      chip: 'Build V2',
      title: 'The swarm is winning',
      body: "Uh oh! The villains are too strong! You're getting overwhelmed. We need a bigger weapon. Abort the session, BUILD a V2 with stronger powers, and get back in there!",
      actionLabel: 'Clear stage',
      commandLabel: 'Upgrade command',
      command: 'docker build -t my-shooter:v2 .',
      note: 'V1 got you into the fight. V2 is the stronger rebuild you ship next.',
      onAction: () => {
        if (selectedHero && selectedSetting) {
          onComplete({
            heroId: selectedHero.id,
            settingId: selectedSetting.id,
          })
          return
        }

        onComplete()
      },
    }
  })()

  const levelHeader = (
    <header className="gb-level-header">
      <button className="gb-back-btn" onClick={onBack}>
        ← Back to roadmap
      </button>

      <div className="gb-level-title">
        <span className="gb-level-badge">Level {String(levelNumber).padStart(2, '0')}</span>
        <div>
          <p className="gb-level-kicker">Docker Game Boy</p>
          <h1 className="gb-level-name">Build-Pull-Run</h1>
        </div>
      </div>
    </header>
  )

  return (
    <div className="gb-level" style={themeVars}>
      {levelHeader}

      <main className="gb-level-body">
        <div className="gb-bpr-layout">
          <section className="gb-panel gb-bpr-stage-panel">
            {(step === 'hero' || step === 'villain' || step === 'setting') && (
              <div className="gb-bpr-selection-stage">
                <div className="gb-bpr-preview-card">
                  {step === 'setting' && selectedSetting ? (
                    <div
                      className="gb-bpr-preview-visual is-setting"
                      style={{ backgroundImage: `url(${selectedSetting.image})` }}
                    />
                  ) : step === 'villain' && selectedVillain ? (
                    <div
                      className="gb-bpr-preview-visual"
                      style={{ backgroundImage: `url(${selectedVillain.portrait})` }}
                    />
                  ) : (
                    <div
                      className="gb-bpr-preview-visual"
                      style={{
                        backgroundImage: `url(${selectedHero?.portrait ?? HEROES[0].portrait})`,
                      }}
                    />
                  )}

                  <div className="gb-bpr-preview-copy">
                    <span className="gb-lesson-label">
                      {step === 'hero' ? 'Hero slot' : step === 'villain' ? 'Villain slot' : 'Setting slot'}
                    </span>
                    <h2 className="gb-panel-title">
                      {step === 'hero'
                        ? selectedHero?.name ?? 'Choose your hero'
                        : step === 'villain'
                          ? selectedVillain?.name ?? 'Choose your villain'
                          : selectedSetting?.name ?? 'Choose your battleground'}
                    </h2>
                    <p className="gb-panel-copy">
                      {step === 'hero'
                        ? selectedHero?.loadout ?? 'Your hero decides the style of your shooter.'
                        : step === 'villain'
                          ? selectedVillain?.threat ?? 'Pick the villain type you want on screen.'
                          : selectedSetting?.tagline ?? 'Pick the battleground your container will launch into.'}
                    </p>
                  </div>
                </div>

                <div className={`gb-bpr-choice-grid ${step === 'villain' ? 'is-two-up' : ''}`}>
                  {(step === 'hero' ? HEROES : step === 'villain' ? VILLAINS : SETTINGS).map((item) => {
                    const isSelected =
                      (step === 'hero' && selectedHeroId === item.id) ||
                      (step === 'villain' && selectedVillainId === item.id) ||
                      (step === 'setting' && selectedSettingId === item.id)

                    return (
                      <button
                        key={item.id}
                        className={`gb-bpr-choice-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          if (step === 'hero') setSelectedHeroId(item.id as HeroId)
                          if (step === 'villain') setSelectedVillainId(item.id as VillainId)
                          if (step === 'setting') setSelectedSettingId(item.id as SettingId)
                        }}
                        style={
                          step === 'setting'
                            ? { backgroundImage: `linear-gradient(180deg, rgba(8, 45, 64, 0.04), rgba(8, 45, 64, 0.6)), url(${(item as (typeof SETTINGS)[number]).image})` }
                            : { backgroundImage: `linear-gradient(180deg, rgba(8, 45, 64, 0.04), rgba(8, 45, 64, 0.72)), url(${(item as (typeof HEROES)[number] | (typeof VILLAINS)[number]).portrait})` }
                        }
                      >
                        <div className="gb-bpr-choice-card-copy">
                          <span className="gb-lesson-label">{step === 'setting' ? 'Setting' : 'Loadout'}</span>
                          <strong>{item.name}</strong>
                          <span>
                            {step === 'hero'
                              ? (item as (typeof HEROES)[number]).loadout
                              : step === 'villain'
                                ? (item as (typeof VILLAINS)[number]).threat
                                : (item as (typeof SETTINGS)[number]).tagline}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 'build' && selectedHero && selectedVillain && selectedSetting && (
              <div className="gb-bpr-build-stage">
                <div className="gb-bpr-loadout-strip">
                  <div className="gb-bpr-loadout-pill">
                    <span className="gb-lesson-label">Hero</span>
                    <strong>{selectedHero.name}</strong>
                  </div>
                  <div className="gb-bpr-loadout-pill">
                    <span className="gb-lesson-label">Villain</span>
                    <strong>{selectedVillain.name}</strong>
                  </div>
                  <div className="gb-bpr-loadout-pill">
                    <span className="gb-lesson-label">Setting</span>
                    <strong>{selectedSetting.name}</strong>
                  </div>
                </div>

                <div className="gb-bpr-assembly-board">
                  <div
                    className="gb-bpr-assembly-backdrop"
                    style={{ backgroundImage: `url(${selectedSetting.image})` }}
                  />
                  <div className="gb-bpr-factory-beam" />

                  <div className="gb-bpr-cartridge-card is-built">
                    <img
                      src={selectedHero.cartridgeImage}
                      alt="MyShooter cartridge being manufactured"
                      className="gb-bpr-cartridge-shell"
                    />
                    <div className="gb-bpr-cartridge-label">
                      <strong>MyShooter v1</strong>
                      <span>{selectedHero.name} vs {selectedVillain.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'pull' && (
              <div className="gb-bpr-store-stage">
                <div className="gb-bpr-store-shelf">
                  <div className="gb-bpr-store-tag">Game Store</div>
                  <div className="gb-bpr-store-slot">Pokemon</div>
                  <div className="gb-bpr-store-slot">Racing</div>
                  <div className="gb-bpr-store-slot">Puzzle</div>
                </div>

                <div className="gb-bpr-store-arrow" aria-hidden="true">↓</div>

                <div className="gb-bpr-cartridge-card is-store">
                  <img
                    src={cartridge3}
                    alt="Pokemon cartridge being fetched from the store"
                    className="gb-bpr-cartridge-shell"
                  />
                  <div className="gb-bpr-cartridge-label is-store">
                    <strong>Pokemon</strong>
                    <span>Prebuilt store image</span>
                  </div>
                </div>
              </div>
            )}

            {step === 'run' && selectedHero && selectedSetting && (
              <div className="gb-bpr-run-stage">
                <button
                  className="gb-bpr-run-cartridge"
                  draggable
                  onDragStart={handleDragStart}
                  onClick={handleRunInsert}
                >
                  <div
                    className="gb-bpr-run-cartridge-art"
                    style={{ backgroundImage: `url(${selectedSetting.image})` }}
                  />
                  <strong>MyShooter v1</strong>
                  <span>Drag or tap to run</span>
                </button>

                <div
                  className={`gb-console-stage gb-bpr-console-stage ${dropActive ? 'is-drop-active' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDropActive(true)
                  }}
                  onDragLeave={() => setDropActive(false)}
                  onDrop={handleDrop}
                >
                  <div className="gb-console-wrap gb-bpr-console-wrap">
                    <div className="gb-bpr-run-slot">Pop cartridge here</div>
                    <img src={gameBoyImage} alt="Retro handheld console ready to boot" className="gb-console-image" />
                    <div className="gb-screen-overlay is-summary gb-bpr-run-screen">
                      <strong>MYSHOOTER V1</strong>
                      <p>Ready to run</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'play' && selectedHero && selectedVillain && selectedSetting && (
              <div
                className={`gb-bpr-monitor-stage ${battleView.flash ? 'is-hit' : ''}`}
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(7, 22, 31, 0.18), rgba(7, 22, 31, 0.58)), url(${selectedSetting.image})`,
                }}
                onPointerDown={handleShoot}
              >
                <div className="gb-bpr-monitor-topbar">
                  <span>MYSHOOTER V1</span>
                  <span>docker run</span>
                </div>

                <div className="gb-bpr-monitor-hud">
                  <span>Score {String(battleView.score).padStart(3, '0')}</span>
                  <span>HP {battleView.hp}</span>
                  <span>{battleView.timeLeft}s</span>
                </div>

                {battleView.showPrompt && (
                  <div className="gb-bpr-monitor-prompt">tap or press space to blast</div>
                )}

                {battleView.enemies.length > 5 && (
                  <div className="gb-bpr-danger-banner">Overrun incoming</div>
                )}

                <div className="gb-bpr-monitor-ground" />

                <SpriteStrip
                  className="gb-bpr-hero-sprite"
                  frame={heroFrame}
                  frames={selectedHero.frames}
                  sprite={selectedHero.sprite}
                />

                {battleView.shots.map((shot) => (
                  <div
                    key={shot.id}
                    className="gb-bpr-shot"
                    style={{ left: `${shot.x}%` }}
                  />
                ))}

                {battleView.enemies.map((enemy) => {
                  const villainFrame = Math.floor((battleView.elapsedMs + enemy.id * 120) / 170) % selectedVillain.frames

                  return (
                    <div
                      key={enemy.id}
                      className="gb-bpr-enemy-wrap"
                      style={{ left: `${enemy.x}%` }}
                    >
                      <SpriteStrip
                        className="gb-bpr-enemy-sprite"
                        frame={villainFrame}
                        frames={selectedVillain.frames}
                        sprite={selectedVillain.sprite}
                      />
                      {enemy.hp > 1 && <span className="gb-bpr-enemy-badge">x2</span>}
                    </div>
                  )
                })}
              </div>
            )}

            {step === 'v2' && selectedHero && selectedVillain && (
              <div className="gb-bpr-v2-stage">
                <div className="gb-bpr-v2-cartridge">
                  <img
                    src={selectedHero.cartridgeImage}
                    alt="MyShooter V2 cartridge blueprint"
                    className="gb-bpr-cartridge-shell"
                  />
                  <div className="gb-bpr-cartridge-label">
                    <strong>MyShooter v2</strong>
                    <span>{selectedHero.name} upgrade path</span>
                  </div>
                </div>

                <div className="gb-bpr-v2-stats">
                  <div className="gb-bpr-v2-stat">
                    <span className="gb-lesson-label">Villains blasted</span>
                    <strong>{lastBattleScore / 10}</strong>
                  </div>
                  <div className="gb-bpr-v2-stat">
                    <span className="gb-lesson-label">HP left</span>
                    <strong>{lastBattleHp}</strong>
                  </div>
                  <div className="gb-bpr-v2-stat">
                    <span className="gb-lesson-label">Next build</span>
                    <strong>More power</strong>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="gb-dialogue-card gb-dialogue-card-narrator gb-bpr-dialogue-card">
            <div className="gb-panel-chip">{stepCopy.chip}</div>
            <h2 className="gb-panel-title">{stepCopy.title}</h2>
            <p className="gb-panel-copy">{stepCopy.body}</p>

            <div className="gb-bpr-summary-card">
              <span className="gb-lesson-label">Current loadout</span>
              <div className="gb-bpr-summary-row">
                <strong>Hero</strong>
                <span>{selectedHero?.name ?? 'Pending'}</span>
              </div>
              <div className="gb-bpr-summary-row">
                <strong>Villain</strong>
                <span>{selectedVillain?.name ?? 'Pending'}</span>
              </div>
              <div className="gb-bpr-summary-row">
                <strong>Setting</strong>
                <span>{selectedSetting?.name ?? 'Pending'}</span>
              </div>
            </div>

            {stepCopy.command && (
              <div className="gb-command-card gb-bpr-command-card">
                <span className="gb-lesson-label">{stepCopy.commandLabel}</span>
                <pre className="gb-code-block">
                  <code>{stepCopy.command}</code>
                </pre>
              </div>
            )}

            {stepCopy.note && (
              <div className="gb-lesson-card gb-bpr-note-card">
                <span className="gb-lesson-label">Why it matters</span>
                <p>{stepCopy.note}</p>
              </div>
            )}

            {step === 'play' && (
              <div className="gb-bpr-control-row">
                <button className="gb-bpr-control-btn" onClick={handleShoot}>Tap to blast</button>
              </div>
            )}

            <div className="gb-dialogue-footer">
              <div className="gb-step-tracker" aria-label="Build pull run progress">
                {STEP_ORDER.map((currentStep, index) => (
                  <span
                    key={currentStep}
                    className={`gb-step-dot ${index <= stepIndex ? 'is-active' : ''}`}
                  />
                ))}
              </div>

              {stepCopy.actionLabel && stepCopy.onAction && (
                <button
                  className="gb-primary-btn"
                  disabled={stepCopy.disabled}
                  onClick={stepCopy.onAction}
                >
                  {stepCopy.actionLabel}
                </button>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
