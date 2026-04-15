import { useEffect, useRef, useState } from 'react'
import type { Category, PerformanceEntry } from '@/lib/performance'
import { usePerformance, computeStats } from '@/lib/performance'
import { playCorrect, playGameOver, playIntro, playPop, playWarning, playWrong } from '@/lib/sounds'
import { GameRecommendations } from '@/components/GameRecommendations'
import { LearningRoadmap, type RoadmapLevel } from '@/components/LearningRoadmap'
import { getCompletedLevels, markLevelComplete } from '@/lib/roadmap-progress'

// ─── Journey roadmap levels ────────────────────────────────────────────────────
const ROADMAP_ID = 'scale-or-die'

const SCALE_LEVELS: RoadmapLevel[] = [
  {
    id: 'level-1',
    title: 'Traffic 101',
    subtitle: 'Survive a single traffic wave',
    icon: '🌊',
    conceptTitle: 'Why Servers Crash Under Load',
    conceptBody: 'Every server has a max capacity — when traffic exceeds it, response times spike, requests fail, and users leave. This level simulates a small traffic event. Your job: keep your servers alive before they get overwhelmed.',
    conceptHighlight: 'Amazon loses ~$220,000 per minute during outages. Your health bar in this game represents real-world uptime.',
  },
  {
    id: 'level-2',
    title: 'Scale It Up',
    subtitle: 'Add EC2 instances to handle load',
    icon: '🖥️',
    conceptTitle: 'Horizontal Scaling with EC2',
    conceptBody: 'Elastic Compute Cloud (EC2) lets you launch virtual servers on demand. Each instance handles a slice of your traffic. Adding more instances is called horizontal scaling — many smaller servers instead of one huge one.',
    conceptHighlight: 'Horizontal scaling beats vertical scaling: more instances are cheaper, more resilient, and easier to replace if one dies.',
  },
  {
    id: 'level-3',
    title: 'Go Global',
    subtitle: 'Use CDN and load balancers across two waves',
    icon: '🌐',
    conceptTitle: 'CDN & Load Balancers',
    conceptBody: 'A CDN caches your files on edge servers worldwide so users get them from nearby nodes, not your origin. A load balancer then distributes requests evenly across all your instances — no single server gets overwhelmed.',
    conceptHighlight: 'CDNs carry ~70% of all internet traffic. Netflix, YouTube, and Cloudflare depend on them to scale globally without crashing.',
  },
  {
    id: 'level-4',
    title: 'Hands-Free Scaling',
    subtitle: 'Tackle two waves with auto-scaling',
    icon: '📈',
    conceptTitle: 'Auto-Scaling',
    conceptBody: 'Auto-scaling watches your metrics — CPU, request rate — and automatically adds or removes servers based on rules you define. Scale up during spikes, scale back down to save money when traffic drops.',
    conceptHighlight: 'Without auto-scaling you either over-provision (waste money) or under-provision (crash). Auto-scaling eliminates both problems.',
  },
  {
    id: 'level-5',
    title: 'Full Stack',
    subtitle: 'Survive all three waves using everything you\'ve learned',
    icon: '📬',
    conceptTitle: 'Message Queues — Buffer the Storm',
    conceptBody: 'Queues decouple your frontend from backend processing. Requests sit in the queue (like SQS) instead of hitting your server directly. Your server drains the queue at its own pace — during a spike, nothing crashes.',
    conceptHighlight: 'Message queues power order processing at every major e-commerce site. They turn a thundering herd into a steady stream.',
  },
]

// Level configs: { waveCount, peakCap } — filters which scenarios are eligible
interface ScaleLevelConfig { waveCount: number; peakCap: number }
const LEVEL_CONFIGS: ScaleLevelConfig[] = [
  { waveCount: 1, peakCap: 80  },   // level-1: easy 1-wave
  { waveCount: 1, peakCap: 130 },   // level-2: medium 1-wave
  { waveCount: 2, peakCap: 130 },   // level-3: medium 2-wave
  { waveCount: 2, peakCap: 999 },   // level-4: hard 2-wave
  { waveCount: 3, peakCap: 999 },   // level-5: full game
]

// ─── Question bank ────────────────────────────────────────────────────────────
interface Question { q: string; options: string[]; answer: number; category: Category }

const QUESTIONS: Question[] = [
  { q: 'EC2 stands for?', options: ['Elastic Compute Cloud','Extended Cloud Computing','Edge Cache Container','Elastic Container Cluster'], answer: 0, category: 'cloud-aws' },
  { q: 'CDN primary purpose?', options: ['DB replication','Serve from edge nodes near users','Auto-scale instances','Monitor health'], answer: 1, category: 'scaling' },
  { q: 'A Load Balancer does?', options: ['Stores sessions','Spreads traffic across instances','Compresses assets','Monitors CPU'], answer: 1, category: 'scaling' },
  { q: 'Auto Scaling default metric?', options: ['Memory','Network latency','CPU utilisation','Disk I/O'], answer: 2, category: 'scaling' },
  { q: 'Message Queue (SQS) solves?', options: ['CDN invalidation','Decouples producers & consumers','DNS distribution','Data encryption'], answer: 1, category: 'architecture' },
  { q: 'Static file storage on AWS?', options: ['RDS','EC2','S3','Lambda'], answer: 2, category: 'cloud-aws' },
  { q: 'Docker containers share?', options: ['Host kernel','GPU','NIC MAC','Disk sectors'], answer: 0, category: 'devops' },
  { q: 'Kubernetes schedules pods onto?', options: ['Clusters','Namespaces','Nodes','Services'], answer: 2, category: 'devops' },
  { q: '"Horizontal scaling" means?', options: ['More RAM','More CPU cores','More instances','More disk'], answer: 2, category: 'scaling' },
  { q: '"Service Unavailable" HTTP code?', options: ['404','500','429','503'], answer: 3, category: 'networking' },
]

// ─── Constants ────────────────────────────────────────────────────────────────
const UI_INTERVAL_MS = 600
const GRAPH_H        = 100
const HISTORY_LEN    = 100
const BREATHER_MS    = 5_000

const ALL_SCENARIOS = [
  { subtitle: 'LAUNCH DAY',     peak: 55,  duration: 18_000 },
  { subtitle: 'VIRAL SPIKE',    peak: 110, duration: 20_000 },
  { subtitle: 'DDOS ATTACK',    peak: 195, duration: 22_000 },
  { subtitle: 'PRODUCT HUNT',   peak: 75,  duration: 16_000 },
  { subtitle: 'FLASH SALE',     peak: 130, duration: 15_000 },
  { subtitle: 'BOT SWARM',      peak: 180, duration: 21_000 },
  { subtitle: 'MORNING RUSH',   peak: 45,  duration: 14_000 },
  { subtitle: 'STREAMING DROP', peak: 100, duration: 18_000 },
  { subtitle: 'CRYPTO CRASH',   peak: 210, duration: 25_000 },
]

function pickScenarios(cfg?: ScaleLevelConfig) {
  const count = cfg?.waveCount ?? 3
  const maxPeak = cfg?.peakCap ?? 999
  const pool = [...ALL_SCENARIOS].filter(s => s.peak <= maxPeak)
  // If not enough scenarios for this peak cap, fall back to all
  const eligible = pool.length >= count ? pool : [...ALL_SCENARIOS]
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]]
  }
  return eligible.slice(0, count)
    .sort((a, b) => a.peak - b.peak)
    .map((w, i) => ({ ...w, label: `WAVE ${i + 1}` }))
}

const WAVES = pickScenarios()

const ACTIONS = [
  { id: 'ec2', label: 'EC2',          cost: 80,  cap: 25 },
  { id: 'cdn', label: 'CDN',          cost: 120, cap: 15 },
  { id: 'lb',  label: 'LOAD BAL',     cost: 100, cap: 20 },
  { id: 'as',  label: 'AUTO-SCALE',   cost: 150, cap: 40 },
  { id: 'mq',  label: 'MSG QUEUE',    cost: 90,  cap: 20 },
]

// ─── Action feedback by scenario ─────────────────────────────────────────────
type FeedbackEntry = { bad?: string; good?: string }
const ACTION_FEEDBACK: Record<string, Partial<Record<string, FeedbackEntry>>> = {
  'BOT SWARM': {
    ec2: { bad: "More servers just give the bots more targets — scaling won't stop them!" },
    lb:  { bad: "Load balancing spreads bot traffic evenly. That's not a fix!" },
    as:  { bad: "Auto-scaling to serve bots just drains your budget faster!" },
    cdn: { good: "CDN edge rules can rate-limit bots before they reach your servers!" },
    mq:  { good: "Queuing limits the flood — only process what you can handle!" },
  },
  'DDOS ATTACK': {
    ec2: { bad: "More instances won't stop a DDoS — they'll flood any size you spin up!" },
    as:  { bad: "Scaling into a DDoS just burns money without stopping the attack!" },
    lb:  { bad: "Load balancers spread attack traffic — they don't block it!" },
    cdn: { good: "CDN absorbs and filters DDoS traffic at the edge. Smart move!" },
    mq:  { good: "Queuing caps your request rate — limits what the DDoS can hammer!" },
  },
  'VIRAL SPIKE': {
    ec2: { good: "More instances for real users flooding in — exactly right!" },
    cdn: { good: "CDN serves assets from edge nodes, freeing up your origin!" },
    lb:  { good: "Load balancer spreads the viral surge evenly. Servers stay happy!" },
    as:  { good: "Auto-scaling matches the viral wave automatically — perfect!" },
  },
  'FLASH SALE': {
    ec2: { good: "More instances handle the purchase rush — good call!" },
    cdn: { good: "CDN caches product pages — way less load on your origin!" },
    as:  { good: "Auto-scaling kicks in as the sale surge hits — well timed!" },
    mq:  { good: "Queue absorbs the order burst and processes them steadily. Nice!" },
  },
  'STREAMING DROP': {
    cdn: { good: "CDN edge nodes deliver streams near users — that's exactly right!" },
    ec2: { bad: "More server instances won't fix stream delivery — the issue is distance!" },
    lb:  { bad: "Load balancing won't help — the problem is network distance, not load!" },
  },
  'PRODUCT HUNT': {
    cdn: { good: "CDN handles the Product Hunt hug-of-death from users worldwide!" },
    lb:  { good: "Load balancer spreads the Product Hunt crowd across your servers!" },
    ec2: { good: "Extra instances ready for the Product Hunt surge — smart prep!" },
  },
  'LAUNCH DAY': {
    ec2: { good: "Extra instances for the launch crowd — well prepared!" },
    lb:  { good: "Load balancer handles the launch surge without breaking a sweat!" },
    as:  { good: "Auto-scaling grows with your launch traffic — hands-free!" },
    cdn: { good: "CDN takes static asset load off your servers on launch day!" },
  },
  'MORNING RUSH': {
    ec2: { good: "Smooth! More instances absorb the morning traffic build-up." },
    as:  { good: "Auto-scaling eases in as the morning surge builds — efficient!" },
    cdn: { good: "CDN handles cached requests so your servers aren't slammed!" },
    mq:  { bad: "Message queues add latency — morning users expect fast responses!" },
  },
  'CRYPTO CRASH': {
    mq:  { good: "Queue handles the compute storm — no trade requests dropped!" },
    as:  { good: "Auto-scaling matches the intense compute demand of the crash!" },
    cdn: { bad: "CDN caches static content — won't help with compute-heavy trading spikes!" },
    lb:  { bad: "Load balancing helps spread load, but can't generate compute from thin air!" },
  },
}

// ─── Retro 8-bit palette ──────────────────────────────────────────────────────
const P = {
  black:   '#0a0a0a',
  dark:    '#1a1a2e',
  navy:    '#16213e',
  green:   '#00ff41',
  lime:    '#39ff14',
  red:     '#ff2244',
  yellow:  '#ffd700',
  cyan:    '#00e5ff',
  purple:  '#cc00ff',
  orange:  '#ff8800',
  white:   '#e8e8e8',
  gray:    '#888888',
  dgray:   '#444444',
  border:  '#00ff41',
}

function pickQuestion() { return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)] }
function getGrade(h: number, b: number) {
  const s = h + Math.max(0, b / 10)
  if (s > 130) return { g: 'S', color: P.yellow,  label: 'LEGENDARY!' }
  if (s > 100) return { g: 'A', color: P.lime,    label: 'EXCELLENT!' }
  if (s > 70)  return { g: 'B', color: P.cyan,    label: 'GOOD JOB!' }
  if (s > 40)  return { g: 'C', color: P.orange,  label: 'SURVIVED.' }
  return             { g: 'D', color: P.red,     label: 'GAME OVER.' }
}

// ─── Pixel Art SVG Components ─────────────────────────────────────────────────

/** Single pixel art server tower — S=cell size in px */
function PixelServer({ state = 'ok', s = 6 }: { state?: 'ok' | 'hot' | 'dead'; s?: number }) {
  // 10×14 pixel grid, row by row (0=transparent, 1=dark, 2=mid, 3=light, 4=led-green, 5=led-red, 6=led-amber)
  const grid = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,3,3,3,3,3,3,3,3,1],
    [1,3,2,2,2,2,2,2,3,1],
    [1,3,2,4,2,2,2,2,3,1],
    [1,3,2,2,2,2,2,2,3,1],
    [1,3,3,3,3,3,3,3,3,1],
    [1,2,2,2,2,2,2,2,2,1],
    [1,2,2,4,2,4,2,2,2,1],
    [1,2,2,2,2,2,2,2,2,1],
    [1,3,3,3,3,3,3,3,3,1],
    [1,3,2,2,2,2,2,2,3,1],
    [1,3,2,4,2,2,4,2,3,1],
    [1,3,2,2,2,2,2,2,3,1],
    [1,1,1,1,1,1,1,1,1,1],
  ]

  const palette: Record<number, string> = {
    1: state === 'dead' ? '#222' : '#1a4a2e',
    2: state === 'dead' ? '#333' : '#0d2818',
    3: state === 'dead' ? '#2a2a2a' : '#1f5c35',
    4: state === 'dead' ? P.dgray : state === 'hot' ? P.red : P.green,
  }

  return (
    <svg width={10 * s} height={14 * s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {grid.map((row, y) =>
        row.map((cell, x) =>
          cell !== 0 ? (
            <rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill={palette[cell]} />
          ) : null
        )
      )}
    </svg>
  )
}

/** Pixel art fire — 3 frames cycling */
function PixelFire({ s = 5 }: { s?: number }) {
  // 6×9 fire sprite
  const frames = [
    [
      [0,0,0,0,0,0],
      [0,0,1,0,0,0],
      [0,1,2,1,0,0],
      [0,1,3,2,1,0],
      [1,2,3,3,1,0],
      [1,3,3,3,2,1],
      [2,3,3,3,3,2],
      [2,3,3,3,3,2],
      [0,2,2,2,2,0],
    ],
    [
      [0,0,0,1,0,0],
      [0,0,1,2,0,0],
      [0,1,2,3,1,0],
      [0,1,3,3,2,0],
      [1,2,3,3,2,1],
      [1,3,3,3,3,1],
      [2,3,3,3,3,2],
      [2,3,3,3,3,2],
      [0,2,2,2,2,0],
    ],
    [
      [0,0,1,0,0,0],
      [0,1,2,0,0,0],
      [1,2,3,1,0,0],
      [1,2,3,3,1,0],
      [1,3,3,3,2,1],
      [2,3,3,3,3,1],
      [2,3,3,3,3,2],
      [2,3,3,3,3,2],
      [0,2,2,2,2,0],
    ],
  ]
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % 3), 120)
    return () => clearInterval(t)
  }, [])

  const palette: Record<number, string> = { 1: '#ff8800', 2: '#ff4400', 3: '#ffdd00' }
  const grid = frames[frame]

  return (
    <svg width={6 * s} height={9 * s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {grid.map((row, y) =>
        row.map((cell, x) =>
          cell !== 0 ? <rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill={palette[cell]} /> : null
        )
      )}
    </svg>
  )
}

/** Pixel art skull */
function PixelSkull({ s = 5 }: { s?: number }) {
  const g = [
    [0,1,1,1,1,0],
    [1,2,2,2,2,1],
    [1,2,3,2,3,1],
    [1,2,2,2,2,1],
    [0,1,2,2,1,0],
    [0,1,2,1,2,1],
    [0,1,1,1,1,0],
  ]
  const pal: Record<number,string> = { 1: '#cc0000', 2: '#ff4466', 3: '#000' }
  return (
    <svg width={6*s} height={7*s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {g.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x*s} y={y*s} width={s} height={s} fill={pal[c]} /> : null))}
    </svg>
  )
}

/** Pixel art coin */
function PixelCoin({ s = 4 }: { s?: number }) {
  const g = [
    [0,1,1,1,0],
    [1,2,2,2,1],
    [1,2,3,2,1],
    [1,2,2,2,1],
    [0,1,1,1,0],
  ]
  const pal: Record<number,string> = { 1: '#b8860b', 2: P.yellow, 3: '#fff9c4' }
  return (
    <svg width={5*s} height={5*s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {g.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x*s} y={y*s} width={s} height={s} fill={pal[c]} /> : null))}
    </svg>
  )
}

/** Pixel heart for health */
function PixelHeart({ s = 4, filled = true }: { s?: number; filled?: boolean }) {
  const g = [
    [0,1,1,0,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
  ]
  const color = filled ? P.red : P.dgray
  return (
    <svg width={7*s} height={6*s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {g.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x*s} y={y*s} width={s} height={s} fill={color} /> : null))}
    </svg>
  )
}

/** Pixel explosion burst */
function PixelExplosion({ s = 5 }: { s?: number }) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % 4), 80)
    return () => clearInterval(t)
  }, [])
  const frames = [
    [[0,0,1,0,0],[0,1,2,1,0],[1,2,3,2,1],[0,1,2,1,0],[0,0,1,0,0]],
    [[0,1,0,1,0],[1,2,1,2,1],[0,1,3,1,0],[1,2,1,2,1],[0,1,0,1,0]],
    [[1,0,1,0,1],[0,1,2,1,0],[1,2,3,2,1],[0,1,2,1,0],[1,0,1,0,1]],
    [[0,1,0,1,0],[1,0,1,0,1],[0,1,0,1,0],[1,0,1,0,1],[0,1,0,1,0]],
  ]
  const pal: Record<number,string> = { 1: P.orange, 2: P.yellow, 3: '#fff' }
  const g = frames[frame]
  return (
    <svg width={5*s} height={5*s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {g.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x*s} y={y*s} width={s} height={s} fill={pal[c]} /> : null))}
    </svg>
  )
}

/** Pixel globe (CDN) */
function PixelGlobe({ s = 4 }: { s?: number }) {
  const g = [
    [0,0,1,1,1,0,0],
    [0,1,2,1,2,1,0],
    [1,1,2,1,2,1,1],
    [1,2,2,2,2,2,1],
    [1,1,2,1,2,1,1],
    [0,1,2,1,2,1,0],
    [0,0,1,1,1,0,0],
  ]
  const pal: Record<number,string> = { 1: '#0066cc', 2: '#00aaff' }
  return (
    <svg width={7*s} height={7*s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {g.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x*s} y={y*s} width={s} height={s} fill={pal[c]} /> : null))}
    </svg>
  )
}

/** Pixel scales (Load Balancer) */
function PixelScales({ s = 4 }: { s?: number }) {
  const g = [
    [0,0,0,1,0,0,0],
    [0,0,1,1,1,0,0],
    [0,1,0,1,0,1,0],
    [1,1,0,1,0,1,1],
    [0,1,0,1,0,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
  ]
  const pal: Record<number,string> = { 1: P.yellow }
  return (
    <svg width={7*s} height={7*s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {g.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x*s} y={y*s} width={s} height={s} fill={pal[c]} /> : null))}
    </svg>
  )
}

/** Pixel graph / chart (Auto-Scaling) */
function PixelChart({ s = 4 }: { s?: number }) {
  const g = [
    [1,0,0,0,0,0,1],
    [1,0,0,0,1,0,1],
    [1,0,0,1,1,0,1],
    [1,0,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1],
  ]
  const pal: Record<number,string> = { 1: P.lime }
  return (
    <svg width={7*s} height={7*s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {g.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x*s} y={y*s} width={s} height={s} fill={pal[c]} /> : null))}
    </svg>
  )
}

/** Pixel envelope (Message Queue) */
function PixelEnvelope({ s = 4 }: { s?: number }) {
  const g = [
    [1,1,1,1,1,1,1],
    [1,2,0,0,0,2,1],
    [1,0,2,0,2,0,1],
    [1,0,0,2,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ]
  const pal: Record<number,string> = { 1: P.orange, 2: '#fff' }
  return (
    <svg width={7*s} height={7*s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {g.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x*s} y={y*s} width={s} height={s} fill={pal[c]} /> : null))}
    </svg>
  )
}

// ─── Tutorial data ────────────────────────────────────────────────────────────
type TutorialTarget = 'health' | 'budget' | 'waves' | 'banner' | 'servers' | 'graph' | 'actions'

interface TutorialStepDef {
  id: string
  title: string
  lines: string[]
  target: TutorialTarget | null   // null = full-screen splash
  tooltipSide?: 'below' | 'above' | 'right' | 'left'
}

const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    id: 'splash',
    title: 'INCOMING TRAFFIC!',
    lines: [
      'YOUR STARTUP JUST WENT VIRAL.',
      'SERVERS ARE ABOUT TO GET HAMMERED.',
      '',
      'YOUR MISSION: KEEP THEM ALIVE',
      'THROUGH 3 WAVES OF TRAFFIC.',
      '',
      'DEPLOY CLOUD UPGRADES, ANSWER',
      'TECH QUESTIONS, AND DON\'T LET',
      'YOUR HEALTH HIT ZERO.',
      '',
      'GOOD LUCK, ENGINEER. YOU\'LL',
      'PROBABLY NEED IT.',
    ],
    target: null,
  },
  {
    id: 'health',
    title: '❤ HEALTH BAR',
    lines: [
      'THESE HEARTS = YOUR SERVERS\' LIVES.',
      '',
      'WHEN TRAFFIC FLOODS YOUR CAPACITY,',
      'HEALTH DRAINS. FAST.',
      '',
      'HIT ZERO AND IT\'S GAME OVER.',
      'KEEP THOSE HEARTS GREEN!',
    ],
    target: 'health',
    tooltipSide: 'below',
  },
  {
    id: 'budget',
    title: '$ YOUR BUDGET',
    lines: [
      'YOU START WITH $500 TO SPEND.',
      '',
      'UPGRADES COST COINS.',
      'RUNNING SERVERS ALSO COSTS COINS.',
      '',
      'ANSWER QUESTIONS RIGHT TO',
      'DEPLOY UPGRADES FOR FREE.',
      'SPEND WISELY!',
    ],
    target: 'budget',
    tooltipSide: 'below',
  },
  {
    id: 'waves',
    title: '⚡ THE 3 WAVES',
    lines: [
      'THREE RANDOM WAVES STAND BETWEEN',
      'YOU AND VICTORY.',
      '',
      'EACH GAME IS DIFFERENT — THE',
      'SCENARIOS CHANGE EVERY ROUND.',
      '',
      'THEY ALWAYS ESCALATE. WAVE 3',
      'WILL TRY TO DESTROY YOU.',
      '',
      'A 5-SECOND BREATHER BETWEEN EACH.',
      'USE IT TO UPGRADE!',
    ],
    target: 'waves',
    tooltipSide: 'below',
  },
  {
    id: 'servers',
    title: '🖥 SERVER RACK',
    lines: [
      'THIS IS YOUR DATA CENTER.',
      '',
      'EACH SLOT IS A RUNNING SERVER.',
      'GREEN LED = HAPPY.',
      'RED + FIRE = OVERLOADED!',
      '',
      'ADD MORE EC2 INSTANCES TO',
      'UNLOCK MORE SERVER SLOTS.',
    ],
    target: 'servers',
    tooltipSide: 'right',
  },
  {
    id: 'graph',
    title: '📊 TRAFFIC MONITOR',
    lines: [
      'THIS GRAPH SHOWS YOUR SITUATION.',
      '',
      '━━ GREEN LINE = YOUR CAPACITY.',
      '━━ RED LINE   = INCOMING TRAFFIC.',
      '',
      'RED ZONE = YOU\'RE IN TROUBLE.',
      '',
      'KEEP THE GREEN LINE ABOVE',
      'THE RED. THAT\'S THE WHOLE GAME.',
    ],
    target: 'graph',
    tooltipSide: 'below',
  },
  {
    id: 'actions',
    title: '🚀 DEPLOY ACTIONS',
    lines: [
      'THESE ARE YOUR WEAPONS.',
      '',
      'CLICK ANY BUTTON TO DEPLOY',
      'A CLOUD UPGRADE.',
      '',
      'A TECH QUESTION POPS UP.',
      'ANSWER RIGHT = FREE UPGRADE!',
      'ANSWER WRONG = YOU PAY 2X.',
      '',
      'LEARN FAST. DEPLOY FASTER.',
    ],
    target: 'actions',
    tooltipSide: 'above',
  },
]

// ─── Tutorial overlay component ───────────────────────────────────────────────
interface TutorialOverlayProps {
  stepIndex: number
  targetRefs: Record<TutorialTarget, React.RefObject<HTMLDivElement | null>>
  onNext: () => void
  onSkip: () => void
}

function TutorialOverlay({ stepIndex, targetRefs, onNext, onSkip }: TutorialOverlayProps) {
  const step = TUTORIAL_STEPS[stepIndex]
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null)
  const FONT = '"Press Start 2P", monospace'
  const PAD  = 10  // spotlight padding px

  // Measure the target element whenever step changes
  useEffect(() => {
    if (!step.target) { setSpotRect(null); return }
    const ref = targetRefs[step.target]
    if (ref?.current) {
      setSpotRect(ref.current.getBoundingClientRect())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex])

  const isSplash = step.target === null
  const totalSteps = TUTORIAL_STEPS.length
  const isLast = stepIndex === totalSteps - 1

  // ── Shared tooltip box ──────────────────────────────────────────────────
  function TooltipBox({ above = false }: { above?: boolean }) {
    return (
      <div style={{
        background: P.black,
        border: `4px solid ${P.cyan}`,
        boxShadow: `6px 6px 0 ${P.cyan}33, inset 0 0 0 1px #001a1a`,
        padding: '18px 20px',
        maxWidth: 320,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: FONT,
      }}>
        {/* Step counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: P.gray, letterSpacing: '0.1em' }}>
            STEP {stepIndex} / {totalSteps - 1}
          </span>
          <button onClick={onSkip} style={{
            background: 'none', border: 'none', color: P.gray,
            fontFamily: FONT, fontSize: '9px', cursor: 'pointer', letterSpacing: '0.1em',
          }}>
            SKIP ✕
          </button>
        </div>

        {/* Title */}
        <div style={{ fontSize: '11px', color: P.cyan, letterSpacing: '0.08em', lineHeight: 1.6 }}>
          {step.title}
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {step.lines.map((line, i) =>
            line === '' ? (
              <div key={i} style={{ height: 6 }} />
            ) : (
              <div key={i} style={{
                fontSize: line.startsWith('[ ') || line.startsWith('━') ? '9px' : '13px',
                color: line.startsWith('[ ') || line.startsWith('━') ? P.yellow : P.white,
                letterSpacing: '0.02em',
                lineHeight: 1.7,
                fontFamily: line.startsWith('[ ') || line.startsWith('━') ? FONT : 'system-ui, sans-serif',
              }}>
                {line}
              </div>
            )
          )}
        </div>

        {/* Arrow indicator (pointing toward the spotlight) */}
        {spotRect && (
          <div style={{
            alignSelf: above ? 'flex-end' : 'flex-start',
            fontSize: '11px', color: P.cyan,
            animation: 'sod-wave-flash 0.7s ease-in-out infinite',
          }}>
            {above ? '▼ DOWN THERE' : '▲ UP THERE'}
          </div>
        )}

        {/* Next button */}
        <button onClick={onNext} style={{
          marginTop: 4,
          padding: '10px 20px',
          border: `3px solid ${P.cyan}`,
          background: '#001a1a',
          color: P.cyan,
          fontFamily: FONT,
          fontSize: '10px',
          cursor: 'pointer',
          boxShadow: `3px 3px 0 ${P.cyan}44`,
          letterSpacing: '0.1em',
          alignSelf: 'flex-end',
        }}>
          {isLast ? 'PLAY! ▶▶' : 'NEXT ▶'}
        </button>
      </div>
    )
  }

  // ── Splash (full-screen centered) ──────────────────────────────────────
  if (isSplash) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,10,0,0.97)',
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,65,0.03) 3px,rgba(0,255,65,0.03) 4px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, fontFamily: FONT,
      }}>
        {/* Pixel art title scene */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 8 }}>
          <PixelServer s={8} state="ok" />
          <PixelServer s={8} state="hot" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <PixelFire s={7} />
            <PixelServer s={8} state="hot" />
          </div>
          <PixelSkull s={8} />
          <PixelExplosion s={7} />
        </div>

        <div style={{
          background: P.black,
          border: `4px solid ${P.green}`,
          boxShadow: `8px 8px 0 ${P.green}33`,
          padding: '28px 36px',
          maxWidth: 440,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Title bar */}
          <div style={{
            background: P.green, color: P.black,
            padding: '4px 10px', margin: '-28px -36px 0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '10px', letterSpacing: '0.1em' }}>SCALE_OR_DIE.EXE — HOW TO PLAY</span>
            <button onClick={onSkip} style={{
              background: P.red, border: 'none', color: P.white,
              fontFamily: FONT, fontSize: '9px', cursor: 'pointer', padding: '2px 8px',
            }}>✕</button>
          </div>

          <div style={{ height: 8 }} />

          {step.lines.map((line, i) =>
            line === '' ? (
              <div key={i} style={{ height: 2 }} />
            ) : (
              <div key={i} style={{
                fontSize: '14px',
                color: line.includes('MISSION') || line.includes('LUCKY') ? P.cyan
                     : line.includes('ZERO') ? P.red
                     : P.white,
                letterSpacing: '0.02em',
                lineHeight: 1.8,
                fontFamily: 'system-ui, sans-serif',
              }}>
                {line}
              </div>
            )
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={onSkip} style={{
              padding: '10px 16px', border: `3px solid ${P.dgray}`,
              background: 'transparent', color: P.gray,
              fontFamily: FONT, fontSize: '9px', cursor: 'pointer',
            }}>
              SKIP ALL
            </button>
            <button onClick={onNext} style={{
              padding: '10px 24px', border: `3px solid ${P.green}`,
              background: '#001a00', color: P.green,
              fontFamily: FONT, fontSize: '10px', cursor: 'pointer',
              boxShadow: `3px 3px 0 ${P.green}66`,
            }}>
              SHOW ME ▶
            </button>
          </div>
        </div>

        <div style={{ fontSize: '9px', color: P.gray, letterSpacing: '0.1em' }}>
          <Blink>▶</Blink> PRESS [SHOW ME] TO START THE GUIDED TOUR
        </div>
      </div>
    )
  }

  // ── Spotlight tooltip steps ──────────────────────────────────────────────
  if (!spotRect) return null

  const pad = PAD
  const spotStyle: React.CSSProperties = {
    position: 'fixed',
    top:    spotRect.top    - pad,
    left:   spotRect.left   - pad,
    width:  spotRect.width  + pad * 2,
    height: spotRect.height + pad * 2,
    boxShadow: `0 0 0 9999px rgba(0,8,0,0.88)`,
    border: `3px solid ${P.cyan}`,
    zIndex: 301,
    pointerEvents: 'none',
    // Corner pixel marks
    outline: `1px solid ${P.cyan}44`,
    outlineOffset: 3,
  }

  const side = step.tooltipSide ?? 'below'
  const GAP = 18

  let tooltipStyle: React.CSSProperties = {}
  let above = false
  if (side === 'below') {
    const topPos = spotRect.bottom + pad + GAP
    tooltipStyle = {
      position: 'fixed',
      top: topPos,
      left: Math.max(8, Math.min(window.innerWidth - 336, spotRect.left + spotRect.width / 2 - 160)),
      maxHeight: Math.max(160, window.innerHeight - topPos - 12),
      overflowY: 'auto',
      zIndex: 302,
    }
    above = false
  } else if (side === 'above') {
    const bottomPos = window.innerHeight - (spotRect.top - pad - GAP)
    tooltipStyle = {
      position: 'fixed',
      bottom: bottomPos,
      left: Math.max(8, Math.min(window.innerWidth - 336, spotRect.left + spotRect.width / 2 - 160)),
      maxHeight: Math.max(160, spotRect.top - pad - GAP - 12),
      overflowY: 'auto',
      zIndex: 302,
    }
    above = true
  } else if (side === 'right') {
    tooltipStyle = {
      position: 'fixed',
      top:  Math.max(8, spotRect.top + spotRect.height / 2 - 100),
      left: spotRect.right + pad + GAP,
      maxHeight: window.innerHeight - 20,
      overflowY: 'auto',
      zIndex: 302,
    }
  } else if (side === 'left') {
    tooltipStyle = {
      position: 'fixed',
      top:  Math.max(8, spotRect.top + spotRect.height / 2 - 100),
      right: window.innerWidth - (spotRect.left - pad - GAP),
      maxHeight: window.innerHeight - 20,
      overflowY: 'auto',
      zIndex: 302,
    }
  }

  return (
    <>
      {/* Dark overlay (pointer-events let clicks pass through spotlight) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 300, pointerEvents: 'none' }} />
      {/* Spotlight cutout */}
      <div style={spotStyle} />
      {/* Tooltip */}
      <div style={{ ...tooltipStyle, pointerEvents: 'auto' }}>
        <TooltipBox above={above} />
      </div>
    </>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface UIState {
  health: number; budget: number; traffic: number; capacity: number
  wave: number; phase: 'playing' | 'breather' | 'done'; message: string; overloaded: boolean
}
interface ResultState { health: number; budget: number }
interface ScaleOrDieProps { onExit: () => void }

// ─── Retro pixel border helper ────────────────────────────────────────────────
function PixelBox({ children, color = P.green, title, style: s }: {
  children: React.ReactNode; color?: string; title?: string; style?: React.CSSProperties
}) {
  return (
    <div style={{
      border: `4px solid ${color}`,
      boxShadow: `4px 4px 0 ${color}44, inset 0 0 0 2px ${P.black}`,
      background: P.dark,
      position: 'relative',
      ...s,
    }}>
      {title && (
        <div style={{
          position: 'absolute',
          top: -14,
          left: 8,
          background: P.dark,
          padding: '0 6px',
          fontSize: '7px',
          fontFamily: '"Press Start 2P", monospace',
          color,
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Blinking cursor ──────────────────────────────────────────────────────────
function Blink({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(true)
  useEffect(() => { const t = setInterval(() => setOn(x => !x), 530); return () => clearInterval(t) }, [])
  return <span style={{ opacity: on ? 1 : 0 }}>{children}</span>
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ScaleOrDie({ onExit }: ScaleOrDieProps) {
  // ── Roadmap state ──────────────────────────────────────────────────────────
  const [view, setView] = useState<'roadmap' | 'game'>('roadmap')
  const [completedLevelIds, setCompletedLevelIds] = useState<Set<string>>(
    () => getCompletedLevels(ROADMAP_ID)
  )
  const activeLevelIdxRef = useRef(0)
  // ── Game refs (60fps loop) ────────────────────────────────────────────────
  const healthRef      = useRef(100)
  const budgetRef      = useRef(500)
  const trafficRef     = useRef(0)
  const capacityRef    = useRef(50)
  const wasOverloadedRef = useRef(false)
  const waveRef        = useRef(0)
  const phaseRef       = useRef<'playing' | 'breather' | 'done'>('breather')
  const waveTimerRef   = useRef(0)
  const trafficHistRef = useRef<number[]>(Array(HISTORY_LEN).fill(0))
  const capHistRef     = useRef<number[]>(Array(HISTORY_LEN).fill(50))
  const rafRef         = useRef<number | null>(null)
  const uiIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTickRef    = useRef(0)
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const wavesRef       = useRef(WAVES)   // overridden when level starts

  const [activeWaves, setActiveWaves] = useState(WAVES)
  const [ui, setUi] = useState<UIState>({
    health: 100, budget: 500, traffic: 0, capacity: 50,
    wave: 0, phase: 'breather', message: 'WAVE 1 IN 5s...', overloaded: false,
  })
  const [showQuestion, setShowQuestion] = useState(false)
  const [question, setQuestion]         = useState<Question | null>(null)
  const [pendingAction, setPendingAction] = useState<typeof ACTIONS[0] | null>(null)
  const [answered, setAnswered]         = useState<number | null>(null)
  const [result, setResult]             = useState<ResultState | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{ message: string; good: boolean } | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Performance tracking ─────────────────────────────────────────────────
  const { report } = usePerformance()
  const perfEntries = useRef<PerformanceEntry[]>([])
  const hasReported = useRef(false)

  // ── Tutorial ──────────────────────────────────────────────────────────────
  const [tutStep, setTutStep] = useState<number | null>(0) // 0=splash, null=done

  // Refs for spotlight targeting
  const tutHealthRef  = useRef<HTMLDivElement>(null)
  const tutBudgetRef  = useRef<HTMLDivElement>(null)
  const tutWavesRef   = useRef<HTMLDivElement>(null)
  const tutBannerRef  = useRef<HTMLDivElement>(null)
  const tutServersRef = useRef<HTMLDivElement>(null)
  const tutGraphRef   = useRef<HTMLDivElement>(null)
  const tutActionsRef = useRef<HTMLDivElement>(null)

  const tutTargetRefs: Record<TutorialTarget, React.RefObject<HTMLDivElement | null>> = {
    health:  tutHealthRef,
    budget:  tutBudgetRef,
    waves:   tutWavesRef,
    banner:  tutBannerRef,
    servers: tutServersRef,
    graph:   tutGraphRef,
    actions: tutActionsRef,
  }

  function advanceTutorial() {
    setTutStep(prev => {
      if (prev === null) return null
      const next = prev + 1
      playPop();
      return next >= TUTORIAL_STEPS.length ? null : next
    })
  }

  // ── Simulation ────────────────────────────────────────────────────────────
  function tick(now: number) {
    const dt = Math.min(now - lastTickRef.current, 200)
    lastTickRef.current = now
    if (phaseRef.current === 'done') return
    waveTimerRef.current += dt

    if (phaseRef.current === 'breather') {
      trafficRef.current = Math.max(0, trafficRef.current - 3 * (dt / 1000))
      if (waveTimerRef.current >= BREATHER_MS) {
        waveTimerRef.current = 0
        waveRef.current += 1
        if (waveRef.current > wavesRef.current.length) {
          phaseRef.current = 'done'
          setResult({ health: Math.round(healthRef.current), budget: Math.round(budgetRef.current) })
          return
        }
        phaseRef.current = 'playing'
      }
    } else {
      const wave = wavesRef.current[waveRef.current - 1]
      trafficRef.current = wave.peak * Math.sin((waveTimerRef.current / wave.duration) * Math.PI)
      if (waveTimerRef.current >= wave.duration) { waveTimerRef.current = 0; phaseRef.current = 'breather' }
    }

    const overflow = Math.max(0, trafficRef.current - capacityRef.current)
    if (overflow > 0) {
      healthRef.current = Math.max(0, healthRef.current - (overflow / capacityRef.current) * (dt / 1000) * 15)
    } else {
      healthRef.current = Math.min(100, healthRef.current + 0.5 * (dt / 1000))
    }
    if (healthRef.current <= 0) {
      phaseRef.current = 'done'
      playGameOver()
      setResult({ health: 0, budget: Math.round(budgetRef.current) })
      return
    }
    budgetRef.current = Math.max(0, budgetRef.current - (capacityRef.current / 50) * (dt / 1000) * 0.4)

    trafficHistRef.current.push(trafficRef.current)
    if (trafficHistRef.current.length > HISTORY_LEN) trafficHistRef.current.shift()
    capHistRef.current.push(capacityRef.current)
    if (capHistRef.current.length > HISTORY_LEN) capHistRef.current.shift()
    drawGraph()
  }

  function drawGraph() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Black bg with pixel grid
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    // Pixel grid dots
    ctx.fillStyle = '#0a2a0a'
    for (let gx = 0; gx < W; gx += 8)
      for (let gy = 0; gy < H; gy += 8)
        ctx.fillRect(gx, gy, 1, 1)

    const maxVal = 220
    const toY = (v: number) => Math.round(H - (v / maxVal) * H)
    const ox = 28
    const step = (W - ox) / (HISTORY_LEN - 1)
    const traf = trafficHistRef.current
    const cap  = capHistRef.current

    // Y axis labels (pixel font style)
    ctx.fillStyle = '#005500'
    ctx.font = '8px monospace'
    for (let i = 0; i <= 4; i++) {
      const y = Math.round((i / 4) * H)
      ctx.fillRect(ox, y, W - ox, 1)
      ctx.fillStyle = '#006600'
      ctx.fillText(String(Math.round(maxVal * (1 - i / 4))), 0, y + 4)
      ctx.fillStyle = '#005500'
    }

    // Capacity fill (dark green)
    ctx.beginPath()
    cap.forEach((v, i) => i === 0 ? ctx.moveTo(ox + i * step, toY(v)) : ctx.lineTo(ox + i * step, toY(v)))
    ctx.lineTo(ox + (cap.length - 1) * step, H)
    ctx.lineTo(ox, H)
    ctx.closePath()
    ctx.fillStyle = 'rgba(0,80,0,0.4)'
    ctx.fill()

    // Danger fill (red tint where traffic > capacity)
    for (let i = 0; i < traf.length - 1; i++) {
      if (traf[i] > cap[i]) {
        ctx.fillStyle = 'rgba(180,0,0,0.35)'
        ctx.fillRect(ox + i * step, 0, step + 1, H)
      }
    }

    // Capacity line — pixel-stepped
    ctx.strokeStyle = P.green
    ctx.lineWidth = 2
    ctx.setLineDash([4, 2])
    ctx.beginPath()
    cap.forEach((v, i) => {
      const x = Math.round(ox + i * step)
      const y = toY(v)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.setLineDash([])

    // Traffic line — pixel-stepped (hard horizontal/vertical segments)
    ctx.strokeStyle = P.red
    ctx.lineWidth = 2
    ctx.beginPath()
    traf.forEach((v, i) => {
      const x = Math.round(ox + i * step)
      const y = toY(v)
      if (i === 0) { ctx.moveTo(x, y) } else {
        ctx.lineTo(x, toY(traf[i - 1]))
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Legend (pixel style)
    ctx.fillStyle = P.green; ctx.fillRect(W - 88, 4, 12, 3)
    ctx.fillStyle = '#00cc33'; ctx.font = '8px monospace'; ctx.fillText('CAP', W - 72, 9)
    ctx.fillStyle = P.red; ctx.fillRect(W - 88, 14, 12, 3)
    ctx.fillStyle = '#ff4466'; ctx.fillText('TRF', W - 72, 19)
  }

  // ── Loop ──────────────────────────────────────────────────────────────────
  function loop(now: number) { tick(now); rafRef.current = requestAnimationFrame(loop) }

  function startGame() {
    playIntro()
    const newWaves = pickScenarios()
    wavesRef.current = newWaves
    setActiveWaves(newWaves)
    healthRef.current = 100; budgetRef.current = 500; trafficRef.current = 0; wasOverloadedRef.current = false
    capacityRef.current = 50; waveRef.current = 0; phaseRef.current = 'breather'
    waveTimerRef.current = 0
    trafficHistRef.current = Array(HISTORY_LEN).fill(0)
    capHistRef.current     = Array(HISTORY_LEN).fill(50)
    lastTickRef.current    = performance.now()
    setResult(null); setShowQuestion(false); setAnswered(null)
    perfEntries.current = []; hasReported.current = false
    setUi({ health: 100, budget: 500, traffic: 0, capacity: 50, wave: 0, phase: 'breather', message: 'WAVE 1 IN 5s...', overloaded: false })
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (uiIntervalRef.current) clearInterval(uiIntervalRef.current)
    rafRef.current = requestAnimationFrame(loop)
    uiIntervalRef.current = setInterval(() => {
      const w = waveRef.current, p = phaseRef.current
      const overloaded = trafficRef.current > capacityRef.current
      if (overloaded && !wasOverloadedRef.current) playWarning()
      wasOverloadedRef.current = overloaded
      let message = ''
      if (p === 'breather') {
        const rem = Math.max(0, Math.ceil((BREATHER_MS - waveTimerRef.current) / 1000))
        const next = w + 1
        message = next <= wavesRef.current.length ? `${wavesRef.current[next - 1].subtitle} IN ${rem}s` : 'ALL CLEAR!'
      } else {
        message = wavesRef.current[w - 1]?.subtitle ?? ''
      }
      setUi({ health: Math.round(healthRef.current), budget: Math.round(budgetRef.current),
        traffic: Math.round(trafficRef.current), capacity: Math.round(capacityRef.current),
        wave: w, phase: p, message, overloaded })
    }, UI_INTERVAL_MS)
  }

  // Start the game only once the tutorial is dismissed
  const hasStartedRef = useRef(false)
  useEffect(() => {
    if (tutStep === null && !hasStartedRef.current) {
      hasStartedRef.current = true
      lastTickRef.current = performance.now()
      startGame()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutStep])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (uiIntervalRef.current) clearInterval(uiIntervalRef.current)
    }
  }, [])

  function handleAction(action: typeof ACTIONS[0]) {
    if (showQuestion || result) return

    // Show contextual feedback if we're in an active wave
    if (phaseRef.current === 'playing') {
      const subtitle = wavesRef.current[waveRef.current - 1]?.subtitle ?? ''
      const entry = ACTION_FEEDBACK[subtitle]?.[action.id]
      if (entry?.bad) {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
        setActionFeedback({ message: entry.bad, good: false })
        feedbackTimerRef.current = setTimeout(() => setActionFeedback(null), 4000)
      } else if (entry?.good) {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
        setActionFeedback({ message: entry.good, good: true })
        feedbackTimerRef.current = setTimeout(() => setActionFeedback(null), 4000)
      }
    }

    setQuestion(pickQuestion()); setPendingAction(action); setAnswered(null); setShowQuestion(true)
  }

  function handleAnswer(idx: number) {
    if (!pendingAction || !question || answered !== null) return
    setAnswered(idx)
    const correct = idx === question.answer
    if (correct) playCorrect(); else playWrong()
    perfEntries.current.push({
      category: question.category,
      correct,
      gameId: 'scale-or-die',
      timestamp: Date.now(),
    })
    setTimeout(() => {
      if (correct) {
        capacityRef.current += pendingAction.cap
      } else {
        budgetRef.current = Math.max(0, budgetRef.current - pendingAction.cost)
      }
      setShowQuestion(false); setAnswered(null); setPendingAction(null); setQuestion(null)
    }, 1400)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const isDDoS      = ui.wave === 3 && ui.phase === 'playing'
  const serverCount = Math.min(6, Math.max(2, Math.ceil(ui.capacity / 15)))
  const serverLoad  = ui.capacity > 0 ? ui.traffic / ui.capacity : 0
  const hearts      = Math.ceil(ui.health / 20) // 0–5 hearts
  const gradeInfo   = result ? getGrade(result.health, result.budget) : null

  const FONT = '"Press Start 2P", monospace'

  const actionIcons: Record<string, React.ReactNode> = {
    ec2: <PixelServer s={3} />,
    cdn: <PixelGlobe  s={3} />,
    lb:  <PixelScales s={3} />,
    as:  <PixelChart  s={3} />,
    mq:  <PixelEnvelope s={3} />,
  }

  // ── Roadmap screen ───────────────────────────────────────────────────────
  if (view === 'roadmap') {
    return (
      <LearningRoadmap
        gameName="Scale or Die"
        gameEmoji="🖥️"
        themeColor="#00c853"
        completedIds={completedLevelIds}
        levels={SCALE_LEVELS}
        onPlay={(levelIdx) => {
          activeLevelIdxRef.current = levelIdx
          const cfg = LEVEL_CONFIGS[levelIdx]
          const newWaves = pickScenarios(cfg)
          wavesRef.current = newWaves
          setActiveWaves(newWaves)
          // Reset game state
          healthRef.current = 100
          budgetRef.current = 500
          trafficRef.current = 0
          capacityRef.current = 50
          waveRef.current = 0
          phaseRef.current = 'breather'
          waveTimerRef.current = 0
          trafficHistRef.current = Array(HISTORY_LEN).fill(0)
          capHistRef.current = Array(HISTORY_LEN).fill(50)
          setUi({ health: 100, budget: 500, traffic: 0, capacity: 50, wave: 0, phase: 'breather', message: 'WAVE 1 IN 5s...', overloaded: false })
          setResult(null)
          setShowQuestion(false)
          setQuestion(null)
          setPendingAction(null)
          setAnswered(null)
          perfEntries.current = []
          hasReported.current = false
          setTutStep(levelIdx === 0 ? 0 : null) // show tutorial only on first level
          hasStartedRef.current = false
          setView('game')
        }}
        onExit={onExit}
      />
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: P.black,
      color: P.green,
      fontFamily: FONT,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 8px 32px',
      gap: '10px',
      // Dithered scanline bg
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,65,0.015) 3px, rgba(0,255,65,0.015) 4px)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Title bar (retro window chrome) ─────────────────────────────────── */}
      <div style={{
        width: '100%',
        maxWidth: 'min(700px, 100%)',
        background: '#003300',
        border: `4px solid ${P.green}`,
        boxShadow: `4px 4px 0 #00330088`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Pixel window buttons */}
          <div style={{ width: 12, height: 12, background: P.red,   border: `2px solid #cc0000` }} />
          <div style={{ width: 12, height: 12, background: P.yellow,border: `2px solid #aa8800` }} />
          <div style={{ width: 12, height: 12, background: P.green, border: `2px solid #008800` }} />
        </div>
        <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: P.green }}>
          SCALE_OR_DIE.EXE
        </span>
        <button
          onClick={() => setView('roadmap')}
          style={{ background: 'none', border: `2px solid ${P.green}`, color: P.green,
            fontFamily: FONT, fontSize: '7px', cursor: 'pointer', padding: '2px 6px',
            boxShadow: `2px 2px 0 ${P.green}66` }}
        >
          MAP
        </button>
      </div>

      {/* ── Status row: hearts + budget + wave ─────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 'min(700px, 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Hearts */}
        <div ref={tutHealthRef} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '7px', color: P.gray, marginRight: 4 }}>HP</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <PixelHeart key={i} s={4} filled={i < hearts} />
          ))}
          <span style={{ fontSize: '10px', color: P.red, marginLeft: 6 }}>{ui.health}%</span>
        </div>

        {/* Budget coins */}
        <div ref={tutBudgetRef} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PixelCoin s={4} />
          <span style={{ fontSize: '10px', color: P.yellow,
            textShadow: `0 0 8px ${P.yellow}88`, letterSpacing: '0.05em' }}>
            ${ui.budget}
          </span>
        </div>

        {/* Wave counter */}
        <div ref={tutWavesRef} style={{ display: 'flex', gap: '6px' }}>
          {activeWaves.map((_, i) => (
            <div key={i} style={{
              width: 30, height: 30,
              border: `3px solid ${ui.wave > i + 1 || (ui.wave === i + 1 && ui.phase === 'breather') ? P.green : ui.wave === i + 1 ? P.yellow : P.dgray}`,
              background: ui.wave > i + 1 ? '#002200' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px',
              color: ui.wave > i + 1 ? P.green : ui.wave === i + 1 ? P.yellow : P.dgray,
            }}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* ── Wave alert banner ─────────────────────────────────────────────── */}
      <div ref={tutBannerRef} style={{
        width: '100%', maxWidth: 'min(700px, 100%)',
        border: `3px solid ${isDDoS ? P.red : ui.phase === 'playing' ? P.yellow : P.dgray}`,
        background: isDDoS ? '#1a0000' : ui.phase === 'playing' ? '#1a1400' : '#0a0a0a',
        padding: '6px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: isDDoS ? `0 0 16px ${P.red}44, 4px 4px 0 ${P.red}22` : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDDoS ? <PixelSkull s={4} /> : ui.phase === 'playing' ? <PixelFire s={3} /> : null}
          <span style={{ fontSize: '10px', color: isDDoS ? P.red : ui.phase === 'playing' ? P.yellow : P.gray,
            letterSpacing: '0.08em',
            ...(isDDoS ? { animation: 'sod-wave-flash 0.6s infinite' } : {}),
          }}>
            {isDDoS && '!! '}
            {ui.message}
            {isDDoS && ' !!'}
          </span>
        </div>
        {ui.phase === 'playing' && (
          <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
            <span style={{ color: P.red }}>TRF:<strong style={{ color: P.white }}> {ui.traffic}</strong></span>
            <span style={{ color: P.green }}>CAP:<strong style={{ color: P.white }}> {ui.capacity}</strong></span>
            {ui.overloaded && (
              <span style={{ color: P.red, animation: 'sod-wave-flash 0.4s infinite' }}>OVERLOADED!</span>
            )}
          </div>
        )}
      </div>

      {/* ── Main game area: server rack + graph ─────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 'min(700px, 100%)', display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap' }}>

        {/* Server rack */}
        <div ref={tutServersRef}>
        <PixelBox
          color={P.green}
          title="SERVER RACK"
          style={{ width: 'clamp(130px, 25vw, 170px)', flexShrink: 0, padding: '12px 8px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}
        >
          {Array.from({ length: serverCount }).map((_, i) => {
            const load   = serverLoad - i * (1 / serverCount)
            const isHot  = load > 0.85
            const isMed  = load > 0.55
            const isDead = ui.health < 15 && i >= serverCount - 1
            const state  = isDead ? 'dead' : isHot ? 'hot' : 'ok'

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '4px 6px',
                border: `2px solid ${isHot ? P.red : isMed ? P.yellow : '#003300'}`,
                background: isHot ? '#1a0000' : '#000',
              }}>
                <PixelServer s={5} state={state} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <span style={{ fontSize: '8px', color: isDead ? P.dgray : isHot ? P.red : P.green }}>
                    SRV-{String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ height: 4, background: '#001100', border: `1px solid ${P.dgray}`, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, load * 100))}%`,
                      background: isHot ? P.red : isMed ? P.yellow : P.green,
                    }} />
                  </div>
                </div>
                {isHot && !isDead && <PixelFire s={3} />}
                {isDead && <span style={{ fontSize: '10px' }}>💀</span>}
              </div>
            )
          })}

          {isDDoS && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, gap: 6 }}>
              <PixelExplosion s={4} />
              <PixelSkull s={3} />
              <PixelExplosion s={4} />
            </div>
          )}
        </PixelBox>
        </div>{/* /tutServersRef */}

        {/* Traffic graph */}
        <div ref={tutGraphRef} style={{ flex: 1, display: 'flex' }}>
        <PixelBox color={P.green} title="TRAFFIC MONITOR" style={{ flex: 1, padding: '16px 8px 8px' }}>
          <canvas
            ref={canvasRef}
            width={460}
            height={GRAPH_H}
            style={{ imageRendering: 'pixelated', display: 'block', width: '100%' }}
          />
          <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '10px' }}>
            <span>
              <span style={{ display: 'inline-block', width: 12, height: 3, background: P.green, marginRight: 4, verticalAlign: 'middle' }} />
              <span style={{ color: P.green }}>CAPACITY</span>
            </span>
            <span>
              <span style={{ display: 'inline-block', width: 12, height: 3, background: P.red, marginRight: 4, verticalAlign: 'middle' }} />
              <span style={{ color: P.red }}>TRAFFIC</span>
            </span>
          </div>
        </PixelBox>
        </div>{/* /tutGraphRef */}
      </div>

      {/* ── Scaling actions ──────────────────────────────────────────────────── */}
      <div ref={tutActionsRef} style={{ width: '100%', maxWidth: 'min(700px, 100%)' }}>
      <PixelBox color={P.cyan} title="DEPLOY ACTIONS" style={{ width: '100%', padding: '10px 8px 8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
          {ACTIONS.map(action => {
            const canAfford = ui.budget >= action.cost
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={!!result || showQuestion || !canAfford}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 10px',
                  flex: '1 1 auto', minWidth: '120px',
                  background: canAfford ? '#001a00' : '#0a0a0a',
                  border: `3px solid ${canAfford ? P.cyan : P.dgray}`,
                  color: canAfford ? P.cyan : P.dgray,
                  fontFamily: FONT, fontSize: '9px',
                  cursor: canAfford && !result && !showQuestion ? 'pointer' : 'not-allowed',
                  boxShadow: canAfford ? `3px 3px 0 ${P.cyan}44` : 'none',
                  opacity: !canAfford ? 0.5 : 1,
                  letterSpacing: '0.05em',
                }}
              >
                {actionIcons[action.id]}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                  <span>{action.label}</span>
                  <span style={{ color: P.yellow, fontSize: '8px' }}>${action.cost} · +{action.cap} CAP</span>
                </div>
              </button>
            )
          })}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '9px', color: P.gray, letterSpacing: '0.05em' }}>
          <Blink>▶</Blink> CORRECT = FREE UPGRADE. WRONG = LOSE $COST, NO DEPLOY.
        </p>
      </PixelBox>
      </div>{/* /tutActionsRef */}

      {/* ── Question modal ────────────────────────────────────────────────────── */}
      {showQuestion && question && pendingAction && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
          fontFamily: FONT,
        }}>
          <div style={{
            background: P.black,
            border: `4px solid ${P.cyan}`,
            boxShadow: `6px 6px 0 ${P.cyan}33`,
            padding: '28px 24px',
            maxWidth: 480, width: '92%',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px',
              borderBottom: `2px solid ${P.dgray}`, paddingBottom: '12px' }}>
              {actionIcons[pendingAction.id]}
              <div>
                <div style={{ fontSize: '11px', color: P.cyan, letterSpacing: '0.1em' }}>
                  DEPLOY {pendingAction.label}
                </div>
                <div style={{ fontSize: '9px', color: P.gray, marginTop: '4px' }}>
                  CORRECT=FREE UPGRADE  WRONG=-${pendingAction.cost} NO DEPLOY
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '15px', color: P.white, lineHeight: 1.6, fontFamily: 'system-ui, sans-serif', letterSpacing: '0.01em' }}>
              {question.q}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {question.options.map((opt, i) => {
                const chosen  = answered === i
                const correct = i === question.answer
                let bg = 'transparent', border = P.dgray, color = P.white
                if (answered !== null) {
                  if (correct) { bg = '#002200'; border = P.green; color = P.green;  }
                  else if (chosen) { bg = '#1a0000'; border = P.red; color = P.red; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={answered !== null}
                    style={{
                      display: 'flex', gap: '10px', alignItems: 'center',
                      padding: '8px 12px',
                      background: bg, border: `2px solid ${border}`,
                      color, fontFamily: FONT, fontSize: '9px',
                      cursor: answered !== null ? 'default' : 'pointer',
                      textAlign: 'left', letterSpacing: '0.03em',
                      boxShadow: answered === null ? `2px 2px 0 ${P.dgray}` : 'none',
                    }}>
                    <span style={{ color: P.gray, minWidth: 18 }}>{String.fromCharCode(65 + i)}.</span>
                    <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>{opt}</span>
                  </button>
                )
              })}
            </div>

            {answered !== null && (
              <div style={{
                padding: '8px 12px',
                border: `2px solid ${answered === question.answer ? P.green : P.red}`,
                background: answered === question.answer ? '#001a00' : '#1a0000',
                fontSize: '10px',
                color: answered === question.answer ? P.green : P.red,
                letterSpacing: '0.04em',
              }}>
                {answered === question.answer
                  ? `> CORRECT! +${pendingAction.cap} CAPACITY DEPLOYED FREE`
                  : `> WRONG! -$${pendingAction.cost} WASTED — NO UPGRADE DEPLOYED`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Result screen ─────────────────────────────────────────────────────── */}
      {result && !hasReported.current && (() => { hasReported.current = true; report(perfEntries.current); return null })()}
      {result && gradeInfo && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.96)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          zIndex: 200, fontFamily: FONT, overflowY: 'auto',
          padding: '32px 16px',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,65,0.02) 3px, rgba(0,255,65,0.02) 4px)',
        }}>
          <div style={{
            background: P.black,
            border: `4px solid ${gradeInfo.color}`,
            boxShadow: `8px 8px 0 ${gradeInfo.color}44`,
            padding: '40px 48px',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center',
            minWidth: 320, maxWidth: 560, width: '100%',
            margin: 'auto',
          }}>
            <div style={{ fontSize: '8px', color: P.gray, letterSpacing: '0.2em' }}>
              {result.health <= 0 ? '>> SERVERS CRASHED <<' : '>> MISSION COMPLETE <<'}
            </div>

            <div style={{ fontSize: '8px', letterSpacing: '0.3em', color: gradeInfo.color }}>
              GAME COMPLETE
            </div>

            {/* Big grade letter — pixel retro style */}
            <div className="sod-grade-anim" style={{
              fontSize: 88, fontWeight: 900, lineHeight: 1,
              color: gradeInfo.color,
              textShadow: `4px 4px 0 ${gradeInfo.color}88, 0 0 30px ${gradeInfo.color}66`,
              imageRendering: 'pixelated',
            }}>
              {gradeInfo.g}
            </div>

            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: gradeInfo.color }}>
              {gradeInfo.label}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '20px', fontSize: '7px', marginTop: 4, padding: '10px 16px', border: `2px solid ${P.dgray}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                <span style={{ color: P.gray }}>HEALTH</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <PixelHeart key={i} s={4} filled={i < Math.ceil(result.health / 20)} />
                  ))}
                </div>
                <span style={{ color: result.health > 60 ? P.green : P.red }}>{result.health}%</span>
              </div>
              <div style={{ width: 2, background: P.dgray }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                <span style={{ color: P.gray }}>COINS LEFT</span>
                <PixelCoin s={6} />
                <span style={{ color: P.yellow }}>${result.budget}</span>
              </div>
            </div>

            {/* Recommendations */}
            {perfEntries.current.length > 0 && (
              <div style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'left', width: '100%' }}>
                <GameRecommendations sessionStats={computeStats(perfEntries.current)} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => {
                const levelId = SCALE_LEVELS[activeLevelIdxRef.current]?.id
                if (levelId) {
                  markLevelComplete(ROADMAP_ID, levelId)
                  setCompletedLevelIds(getCompletedLevels(ROADMAP_ID))
                }
                setView('roadmap')
              }} style={{
                padding: '8px 16px', border: `3px solid ${P.green}`,
                background: '#001a00', color: P.green,
                fontFamily: FONT, fontSize: '7px', cursor: 'pointer',
                boxShadow: `3px 3px 0 ${P.green}66`,
              }}>
                ✓ BACK TO MAP
              </button>
              <button onClick={startGame} style={{
                padding: '8px 20px', border: `3px solid ${P.dgray}`,
                background: 'transparent', color: P.gray,
                fontFamily: FONT, fontSize: '7px', cursor: 'pointer',
                boxShadow: `3px 3px 0 ${P.dgray}44`,
              }}>
                RETRY ↺
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action feedback toast ────────────────────────────────────────────── */}
      {actionFeedback && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 150,
          background: P.black,
          border: `3px solid ${actionFeedback.good ? P.green : P.red}`,
          boxShadow: `4px 4px 0 ${actionFeedback.good ? P.green : P.red}44`,
          padding: '10px 16px',
          maxWidth: 380,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontFamily: FONT,
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
            {actionFeedback.good ? '✓' : '✗'}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{
              fontSize: '8px',
              color: actionFeedback.good ? P.green : P.red,
              letterSpacing: '0.1em',
            }}>
              {actionFeedback.good ? 'NICE MOVE!' : 'UH OH!'}
            </span>
            <span style={{
              fontSize: '12px',
              color: P.white,
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1.5,
            }}>
              {actionFeedback.message}
            </span>
          </div>
        </div>
      )}

      {/* ── Tutorial overlay ──────────────────────────────────────────────────── */}
      {tutStep !== null && (
        <TutorialOverlay
          stepIndex={tutStep}
          targetRefs={tutTargetRefs}
          onNext={advanceTutorial}
          onSkip={() => setTutStep(null)}
        />
      )}
    </div>
  )
}
