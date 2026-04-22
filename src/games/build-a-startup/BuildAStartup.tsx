import { useEffect, useRef, useState, useCallback, type CSSProperties, type DragEvent } from 'react'
import { usePerformance, computeStats, type PerformanceEntry } from '@/lib/performance'
import { GameRecommendations } from '@/components/GameRecommendations'
import { playCorrect, playWrong, playClick, playNextLevel, playPop} from '@/lib/sounds'
import { saveGame, clearGame } from '@/lib/resume'
import { ExitConfirmModal } from '@/components/ExitConfirmModal'
import { useGameTheme } from '@/lib/useGameTheme'
import './BuildAStartup.css'

export interface BuildAStartupSave {
  levelIdx: number
  results: { levelId: number; stars: number }[]
}

const GAME_ID = 'build-a-startup'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ArchComponent {
  id: string
  label: string
  emoji: string
  description: string
  color: string
}

interface SlotDef {
  id: string
  correctId: string
  x: number        // center x as % of diagram (0-100)
  y: number        // center y as % of diagram (0-100)
  roleHint: string  // shown on empty slot
}

interface Connection {
  from: string   // slot id or 'users'
  to: string
  label?: string
}

interface Level {
  id: number
  title: string
  scenario: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  slots: SlotDef[]
  connections: Connection[]
  available: string[]   // component IDs (correct + distractors)
}

type Phase = 'intro' | 'playing' | 'result' | 'game-over'

// ─── Component Catalog ───────────────────────────────────────────────────────

const COMPONENTS: Record<string, ArchComponent> = {
  'dns':             { id: 'dns',             label: 'DNS',             emoji: '🌐',  description: 'Translates domain names (like google.com) into IP addresses so browsers know where to go.',                        color: '#87959a' },
  'cdn':             { id: 'cdn',             label: 'CDN',             emoji: '🌍',  description: 'Caches static files (images, CSS, JS) on servers around the world so users get content from the nearest location.',  color: '#5b8c74' },
  'load-balancer':   { id: 'load-balancer',   label: 'Load Balancer',   emoji: '⚖️',  description: 'Distributes incoming traffic evenly across multiple servers so no single server gets overwhelmed.',                color: '#7c6492' },
  'api-gateway':     { id: 'api-gateway',     label: 'API Gateway',     emoji: '🚪',  description: 'The single entry point for all API requests. Handles routing, rate limiting, and authentication.',                 color: '#5a8b84' },
  'web-server':      { id: 'web-server',      label: 'Web Server',      emoji: '🖥️',  description: 'Processes HTTP requests from users, runs your application code, and returns responses.',                            color: '#5a7392' },
  'api-server':      { id: 'api-server',      label: 'API Server',      emoji: '💻',  description: 'Handles API requests and executes business logic. The brain of your backend.',                                       color: '#65839d' },
  'cache':           { id: 'cache',           label: 'Cache',           emoji: '⚡',  description: 'Stores frequently accessed data in memory (like Redis) for ultra-fast retrieval instead of hitting the database.',    color: '#b49a57' },
  'database':        { id: 'database',        label: 'Database',        emoji: '🗄️',  description: 'Persistently stores structured data (users, posts, orders). The source of truth for your application.',            color: '#aa7d53' },
  'message-queue':   { id: 'message-queue',   label: 'Msg Queue',       emoji: '📬',  description: 'Buffers messages between services for async processing. Decouples producers from consumers (like SQS or RabbitMQ).', color: '#9b6e6b' },
  'worker':          { id: 'worker',          label: 'Worker',          emoji: '⚙️',  description: 'A background process that pulls jobs from a queue and processes them (video encoding, email sending, etc.).',       color: '#7f8786' },
  'auth-service':    { id: 'auth-service',    label: 'Auth Service',    emoji: '🔐',  description: 'Dedicated microservice for user login, signup, tokens, and permissions.',                                            color: '#8e6664' },
  'product-service': { id: 'product-service', label: 'Product Svc',     emoji: '🏪',  description: 'Microservice managing product catalog, inventory, and pricing.',                                                     color: '#8b6c4c' },
  'object-storage':  { id: 'object-storage',  label: 'Obj Storage',     emoji: '📦',  description: 'Stores large files like images, videos, and backups (like AWS S3).',                                                 color: '#5b6872' },
  'firewall':        { id: 'firewall',        label: 'Firewall',        emoji: '🛡️',  description: 'Filters network traffic and blocks malicious requests before they reach your servers.',                               color: '#8d5f61' },
}

// ─── Level Data ──────────────────────────────────────────────────────────────

const LEVELS: Level[] = [
  {
    id: 1,
    title: 'Personal Blog',
    scenario: 'You\'re launching a simple personal blog. Users type in your domain, your server fetches posts from a database, and pages are served. Build the most basic web architecture!',
    difficulty: 'Easy',
    slots: [
      { id: 's1', correctId: 'dns',        x: 50, y: 25, roleHint: 'Resolves your domain name' },
      { id: 's2', correctId: 'web-server',  x: 50, y: 52, roleHint: 'Serves your web pages' },
      { id: 's3', correctId: 'database',    x: 50, y: 80, roleHint: 'Stores your blog posts' },
    ],
    connections: [
      { from: 'users', to: 's1' },
      { from: 's1', to: 's2', label: 'IP' },
      { from: 's2', to: 's3', label: 'SQL' },
    ],
    available: ['dns', 'web-server', 'database', 'load-balancer', 'cdn'],
  },
  {
    id: 2,
    title: 'E-Commerce Store',
    scenario: 'Your online store is getting traffic! Product images load slowly. You need edge caching for static content and in-memory caching for hot product data. Speed things up!',
    difficulty: 'Easy',
    slots: [
      { id: 's1', correctId: 'cdn',         x: 50, y: 20, roleHint: 'Delivers images & assets fast' },
      { id: 's2', correctId: 'web-server',   x: 50, y: 44, roleHint: 'Runs your store app' },
      { id: 's3', correctId: 'cache',        x: 25, y: 72, roleHint: 'Speeds up product lookups' },
      { id: 's4', correctId: 'database',     x: 75, y: 72, roleHint: 'Stores orders & products' },
    ],
    connections: [
      { from: 'users', to: 's1' },
      { from: 's1', to: 's2' },
      { from: 's2', to: 's3', label: 'read' },
      { from: 's2', to: 's4', label: 'write' },
      { from: 's3', to: 's4', label: 'miss' },
    ],
    available: ['cdn', 'web-server', 'cache', 'database', 'message-queue', 'load-balancer', 'worker'],
  },
  {
    id: 3,
    title: 'Scalable API',
    scenario: 'Your social app is blowing up! One server can\'t handle the load. You need to distribute traffic, add an API layer with authentication, and cache hot queries. Build for scale!',
    difficulty: 'Medium',
    slots: [
      { id: 's1', correctId: 'load-balancer', x: 50, y: 18, roleHint: 'Splits traffic across servers' },
      { id: 's2', correctId: 'api-gateway',   x: 50, y: 38, roleHint: 'Routes & rate-limits requests' },
      { id: 's3', correctId: 'web-server',    x: 22, y: 60, roleHint: 'Runs your app logic' },
      { id: 's4', correctId: 'cache',         x: 78, y: 60, roleHint: 'In-memory speed boost' },
      { id: 's5', correctId: 'database',      x: 50, y: 84, roleHint: 'Source of truth' },
    ],
    connections: [
      { from: 'users', to: 's1' },
      { from: 's1', to: 's2' },
      { from: 's2', to: 's3' },
      { from: 's2', to: 's4' },
      { from: 's3', to: 's5' },
      { from: 's4', to: 's5', label: 'miss' },
    ],
    available: ['load-balancer', 'api-gateway', 'web-server', 'cache', 'database', 'cdn', 'message-queue', 'firewall', 'worker'],
  },
  {
    id: 4,
    title: 'Video Platform',
    scenario: 'Users upload videos that need processing (transcoding, thumbnails). You can\'t do that synchronously — it would block the server! Design an async pipeline with queues and workers.',
    difficulty: 'Medium',
    slots: [
      { id: 's1', correctId: 'api-gateway',    x: 50, y: 15, roleHint: 'Entry point for requests' },
      { id: 's2', correctId: 'web-server',      x: 25, y: 36, roleHint: 'Handles API logic' },
      { id: 's3', correctId: 'message-queue',   x: 75, y: 36, roleHint: 'Buffers video jobs' },
      { id: 's4', correctId: 'worker',          x: 75, y: 58, roleHint: 'Processes videos' },
      { id: 's5', correctId: 'object-storage',  x: 75, y: 82, roleHint: 'Stores video files' },
      { id: 's6', correctId: 'database',        x: 25, y: 72, roleHint: 'Stores metadata' },
    ],
    connections: [
      { from: 'users', to: 's1' },
      { from: 's1', to: 's2' },
      { from: 's1', to: 's3', label: 'upload' },
      { from: 's3', to: 's4' },
      { from: 's4', to: 's5', label: 'save' },
      { from: 's2', to: 's6' },
      { from: 's4', to: 's6', label: 'status' },
    ],
    available: ['api-gateway', 'web-server', 'message-queue', 'worker', 'object-storage', 'database', 'cdn', 'load-balancer', 'cache', 'dns'],
  },
  {
    id: 5,
    title: 'Microservices E-Commerce',
    scenario: 'You\'re scaling to millions of users with a full microservices architecture. CDN for static assets, load balancer for traffic, separate auth and product services, async order processing, and caching. This is the big leagues!',
    difficulty: 'Hard',
    slots: [
      { id: 's1', correctId: 'cdn',              x: 50, y: 12, roleHint: 'Edge content delivery' },
      { id: 's2', correctId: 'load-balancer',    x: 50, y: 26, roleHint: 'Distributes traffic' },
      { id: 's3', correctId: 'api-gateway',      x: 50, y: 40, roleHint: 'Routes all API calls' },
      { id: 's4', correctId: 'auth-service',     x: 15, y: 56, roleHint: 'Handles login & tokens' },
      { id: 's5', correctId: 'product-service',  x: 50, y: 56, roleHint: 'Product catalog' },
      { id: 's6', correctId: 'message-queue',    x: 85, y: 56, roleHint: 'Async order events' },
      { id: 's7', correctId: 'cache',            x: 30, y: 78, roleHint: 'Fast session & data' },
      { id: 's8', correctId: 'database',         x: 70, y: 78, roleHint: 'Persistent storage' },
    ],
    connections: [
      { from: 'users', to: 's1' },
      { from: 's1', to: 's2' },
      { from: 's2', to: 's3' },
      { from: 's3', to: 's4' },
      { from: 's3', to: 's5' },
      { from: 's3', to: 's6' },
      { from: 's4', to: 's7' },
      { from: 's5', to: 's8' },
      { from: 's6', to: 's8' },
      { from: 's7', to: 's8', label: 'miss' },
    ],
    available: ['cdn', 'load-balancer', 'api-gateway', 'auth-service', 'product-service', 'message-queue', 'cache', 'database', 'dns', 'web-server', 'worker', 'object-storage', 'firewall'],
  },
]

// ─── Style constants ─────────────────────────────────────────────────────────

const S = {
  bg:        '#1f2d2b',
  paper:     '#6f6386',
  gridLine:  '#a89fba',
  border:    '#322844',
  darkText:  '#fbf4e8',
  mutedText: '#e4d8cd',
  accent:    '#8c7f9f',
  success:   '#6b9d7f',
  error:     '#b07872',
  warn:      '#be9c63',
  slotBg:    '#5e5473',
  slotDash:  '#6f6787',
  font:      'IBM Plex Sans, -apple-system, sans-serif',
  bodyFont:  'system-ui, -apple-system, sans-serif',
}

const SLOT_W = 140   // px
const SLOT_H = 56    // px
const USERS_Y = 1  // % — users icon sits above the diagram

// ─── Arrow Component ─────────────────────────────────────────────────────────

function DiagramArrows({
  connections,
  slots,
  containerW,
  containerH,
}: {
  connections: Connection[]
  slots: SlotDef[]
  containerW: number
  containerH: number
}) {
  if (containerW === 0) return null

  const getCenter = (id: string): { x: number; y: number } => {
    if (id === 'users') {
      return { x: containerW * 0.5, y: containerH * (USERS_Y + 4) / 100 }
    }
    const slot = slots.find(s => s.id === id)
    if (!slot) return { x: 0, y: 0 }
    return {
      x: containerW * (slot.x / 100),
      y: containerH * (slot.y / 100),
    }
  }

  return (
    <svg
      width={containerW}
      height={containerH}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      <defs>
        <marker id="bas-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill={S.slotDash} />
        </marker>
      </defs>
      {connections.map((conn, i) => {
        const from = getCenter(conn.from)
        const to = getCenter(conn.to)
        // Offset: start from bottom edge of source, end at top edge of destination
        const y1 = from.y + SLOT_H / 2
        const y2 = to.y - SLOT_H / 2
        const mx = (from.x + to.x) / 2
        const my = (y1 + y2) / 2

        return (
          <g key={i}>
            <line
              x1={from.x} y1={y1}
              x2={to.x} y2={y2}
              stroke={S.slotDash}
              strokeWidth={2}
              strokeDasharray="6,4"
              markerEnd="url(#bas-arrow)"
            />
            {conn.label && (
              <text
                x={mx + 8} y={my}
                fill={S.mutedText}
                fontSize={12}
                fontFamily={S.bodyFont}
                fontStyle="italic"
              >
                {conn.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Slot Component ──────────────────────────────────────────────────────────

function DropSlot({
  slot,
  placed,
  dragOver,
  checked,
  isCorrect,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  onTapPlace,
}: {
  slot: SlotDef
  placed: ArchComponent | null
  dragOver: boolean
  checked: boolean
  isCorrect: boolean | null
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent) => void
  onRemove: () => void
  onTapPlace: () => void
}) {
  const isEmpty = !placed

  let borderColor = S.slotDash
  let bgColor = S.slotBg
  let borderStyle: string = '3px dashed'
  let animClass = ''

  if (dragOver && isEmpty) {
    borderColor = S.accent
    bgColor = '#d9d3df'
    borderStyle = '3px solid'
  } else if (checked && isCorrect === true) {
    borderColor = S.success
    bgColor = '#dce8de'
    borderStyle = '3px solid'
    animClass = 'bas-correct'
  } else if (checked && isCorrect === false) {
    borderColor = S.error
    bgColor = '#ead9d7'
    borderStyle = '3px solid'
    animClass = 'bas-wrong'
  } else if (placed) {
    borderColor = placed.color
    bgColor = '#f4ece0'
    borderStyle = '3px solid'
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(e) }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => {
        if (placed && !checked) onRemove()
        else if (!placed && !checked) onTapPlace()
      }}
      className={animClass}
      style={{
        position: 'absolute',
        left: `calc(${slot.x}% - ${SLOT_W / 2}px)`,
        top: `calc(${slot.y}% - ${SLOT_H / 2}px)`,
        width: SLOT_W,
        height: SLOT_H,
        border: borderStyle,
        borderColor,
        borderRadius: 10,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: placed && !checked ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: dragOver ? `0 0 0 4px ${S.accent}33` : placed ? '0 5px 0 rgba(50,40,68,0.18)' : '0 4px 0 rgba(50,40,68,0.12)',
        zIndex: 2,
      }}
    >
      {placed ? (
        <>
          <span style={{ fontSize: 22 }}>{placed.emoji}</span>
          <span style={{
            fontFamily: S.bodyFont,
            fontSize: 13,
            fontWeight: 600,
            color: S.darkText,
          }}>
            {placed.label}
          </span>
          {checked && isCorrect === true && (
            <span style={{ fontSize: 16, color: S.success, marginLeft: 2 }}>✓</span>
          )}
          {checked && isCorrect === false && (
            <span style={{ fontSize: 16, color: S.error, marginLeft: 2 }}>✗</span>
          )}
        </>
      ) : (
        <span style={{
          fontFamily: S.font,
          fontSize: 16,
          color: '#f0e8db',
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '0 8px',
          lineHeight: 1.3,
        }}>
          {slot.roleHint}
        </span>
      )}
    </div>
  )
}

// ─── Tray Item ───────────────────────────────────────────────────────────────

function TrayItem({
  comp,
  isPlaced,
  selected,
  onDragStart,
  onDragEnd,
  onTap,
}: {
  comp: ArchComponent
  isPlaced: boolean
  selected: boolean
  onDragStart: (e: DragEvent) => void
  onDragEnd: () => void
  onTap: () => void
}) {
  return (
    <div
      draggable={!isPlaced}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => !isPlaced && onTap()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: selected ? '#d8d1df' : isPlaced ? '#cfc8d6' : '#f4ece0',
        border: `3px solid ${selected ? S.accent : isPlaced ? '#b4acbd' : comp.color}`,
        borderRadius: 14,
        cursor: isPlaced ? 'default' : 'pointer',
        opacity: isPlaced ? 0.4 : 1,
        transition: 'all 0.2s ease',
        boxShadow: selected ? `0 0 0 4px ${S.accent}33` : isPlaced ? '0 3px 0 rgba(50,40,68,0.1)' : '0 5px 0 rgba(50,40,68,0.2)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 20 }}>{comp.emoji}</span>
      <span style={{
        fontFamily: S.bodyFont,
        fontSize: 13,
        fontWeight: 600,
        color: isPlaced ? '#877f8d' : '#3b2f4d',
      }}>
        {comp.label}
      </span>
    </div>
  )
}

// ─── Hint Modal ──────────────────────────────────────────────────────────────

function HintModal({
  available,
  attemptsUsed,
  revealUsed,
  onReveal,
  onClose,
}: {
  available: ArchComponent[]
  attemptsUsed: number
  revealUsed: boolean
  onReveal: () => void
  onClose: () => void
}) {
  const canReveal = attemptsUsed >= 2 && !revealUsed

  return (
    <div className="bas-overlay">
      <div className="bas-modal-card">
        {/* Header */}
        <div className="bas-modal-header">
          <h3 className="bas-modal-title">
            Component Guide
          </h3>
          <button onClick={onClose} className="bas-btn bas-btn-ghost">
            Close
          </button>
        </div>

        {/* Component descriptions */}
        <div className="bas-guide-list">
          {available.map(comp => (
            <div key={comp.id} className="bas-guide-item" style={{ borderLeftColor: comp.color }}>
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{comp.emoji}</span>
              <div>
                <div className="bas-guide-name">
                  {comp.label}
                </div>
                <div className="bas-guide-body">
                  {comp.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reveal hint section */}
        <div className="bas-reveal-row">
          <div>
            <div className="bas-reveal-title">
              Reveal a box
            </div>
            <div className="bas-reveal-sub">
              {canReveal
                ? 'Reveals one correct placement. Use it wisely!'
                : revealUsed
                  ? 'Already used your reveal for this level.'
                  : `Available after 2 attempts (${attemptsUsed}/2)`}
            </div>
          </div>
          <button
            onClick={onReveal}
            disabled={!canReveal}
            className={`bas-btn ${canReveal ? 'bas-btn-warn' : 'bas-btn-disabled'}`}
          >
            Reveal
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Level Intro Screen ──────────────────────────────────────────────────────

function LevelIntro({
  level,
  totalLevels,
  onStart,
  onExit,
}: {
  level: Level
  totalLevels: number
  onStart: () => void
  onExit: () => void
}) {
  const diffColor = level.difficulty === 'Easy' ? S.success
    : level.difficulty === 'Medium' ? S.warn
    : S.error

  return (
    <div className="bas-screen-shell">
      <div className="bas-hero-card">
        {/* Level badge */}
        <div className="bas-badge">
          LEVEL {level.id} / {totalLevels}
        </div>

        <h1 className="bas-hero-title">
          {level.title}
        </h1>

        {/* Difficulty */}
        <span className="bas-difficulty" style={{ color: diffColor, borderColor: diffColor }}>
          {level.difficulty.toUpperCase()}
        </span>

        <p className="bas-hero-body">
          {level.scenario}
        </p>

        {/* Stats */}
        <div className="bas-stat-strip">
          <div className="bas-stat-cell">
            <div className="bas-stat-num">{level.slots.length}</div>
            <div className="bas-stat-label">components</div>
          </div>
          <div className="bas-stat-cell">
            <div className="bas-stat-num">{level.available.length - level.slots.length}</div>
            <div className="bas-stat-label">distractors</div>
          </div>
          <div className="bas-stat-cell">
            <div className="bas-stat-num">3</div>
            <div className="bas-stat-label">attempts</div>
          </div>
        </div>

        <div className="bas-hero-actions">
          <button onClick={onExit} className="bas-btn bas-btn-ghost">
            Back
          </button>
          <button onClick={onStart} className="bas-btn bas-btn-primary">
            Start Building
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Level Result Screen ─────────────────────────────────────────────────────

function LevelResult({
  stars,
  onNext,
  onRetry,
  isLastLevel,
}: {
  level: Level
  stars: number    // 0 = failed, 1-3 = stars earned
  onNext: () => void
  onRetry: () => void
  isLastLevel: boolean
}) {
  const passed = stars > 0
  return (
    <div className="bas-overlay">
      <div className="bas-result-card" style={{ '--bas-state': passed ? S.success : S.error } as CSSProperties}>
        {/* Stars */}
        <div className="bas-stars-row">
          {[1, 2, 3].map(i => (
            <span key={i} style={{
              opacity: i <= stars ? 1 : 0.2,
              filter: i <= stars ? 'none' : 'grayscale(1)',
              margin: '0 4px',
            }}>
              ⭐
            </span>
          ))}
        </div>

        <h2 className="bas-result-title" style={{ color: passed ? S.success : S.error }}>
          {passed ? 'Architecture Complete!' : 'System Down!'}
        </h2>

        <p className="bas-result-body">
          {passed
              ? stars === 3
                ? 'Perfect architecture on the first try! You really know your stuff.'
              : stars === 2
                ? 'Solid work! Just needed a second look to nail it.'
                : 'You got there in the end. Practice makes perfect!'
            : 'Ran out of attempts. Review the component descriptions and try again!'}
        </p>

        <div className="bas-result-actions">
          <button onClick={onRetry} className="bas-btn bas-btn-ghost">
            Retry
          </button>
          {passed && (
            <button onClick={onNext} className="bas-btn bas-btn-primary">
              {isLastLevel ? 'See Results' : 'Next Level'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Game Complete Screen ────────────────────────────────────────────────────

function GameComplete({
  results,
  sessionStats,
  onRestart,
  onExit,
}: {
  results: { levelId: number; stars: number }[]
  sessionStats?: import('@/lib/performance').CategoryStats[]
  onRestart: () => void
  onExit: () => void
}) {
  const totalStars = results.reduce((sum, r) => sum + r.stars, 0)
  const maxStars = results.length * 3

  return (
    <div className="bas-screen-shell bas-complete-shell">
      <div className="bas-complete-card">
        {/* Header */}
        <div className="bas-complete-head">
          <div className="bas-complete-emoji">🏗️</div>
          <h1 className="bas-hero-title">
            Startup Built!
          </h1>
          <p className="bas-result-body">
            You've completed all {results.length} architecture challenges.
          </p>
          <div className="bas-complete-score">
            {totalStars} / {maxStars} ⭐
          </div>
        </div>

        {/* Two-column layout on desktop */}
        <div className="bas-complete-grid">
          {/* Per-level breakdown */}
          <div className="bas-summary-card">
            {results.map((r, i) => (
              <div key={r.levelId} className="bas-summary-row" style={{ borderBottom: i < results.length - 1 ? `1px solid ${S.gridLine}` : 'none' }}>
                <span className="bas-summary-label">
                  Lv.{r.levelId} — {LEVELS[i].title}
                </span>
                <span>
                  {[1, 2, 3].map(s => (
                    <span key={s} style={{ opacity: s <= r.stars ? 1 : 0.2, fontSize: 16 }}>⭐</span>
                  ))}
                </span>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div>
            <GameRecommendations sessionStats={sessionStats} />
          </div>
        </div>

        <div className="bas-hero-actions">
          <button onClick={onExit} className="bas-btn bas-btn-ghost">
            Home
          </button>
          <button onClick={onRestart} className="bas-btn bas-btn-primary">
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Game Component ─────────────────────────────────────────────────────

export default function BuildAStartup({ onExit, resumeState }: { onExit: () => void; resumeState?: BuildAStartupSave | null }) {
  const { isDark, toggle: toggleTheme } = useGameTheme()

  const [phase, setPhase] = useState<Phase>(resumeState ? 'playing' : 'intro')
  const [levelIdx, setLevelIdx] = useState(resumeState?.levelIdx ?? 0)
  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [attempts, setAttempts] = useState(3)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [revealUsed, setRevealUsed] = useState(false)
  const [checked, setChecked] = useState(false)
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({})
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [levelStars, setLevelStars] = useState(0)
  const [results, setResults] = useState<{ levelId: number; stars: number }[]>(resumeState?.results ?? [])
  const [, setDraggingId] = useState<string | null>(null)
  const [selectedComp, setSelectedComp] = useState<string | null>(null)
  const [showExitModal, setShowExitModal] = useState(false)

  // Performance tracking
  const { report } = usePerformance()
  const perfEntries = useRef<PerformanceEntry[]>([])
  const hasReported = useRef(false)

  // Responsive: detect narrow screens to switch layout
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Diagram container ref for arrow measurements
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  const level = LEVELS[levelIdx]
  const availableComps = level.available.map(id => COMPONENTS[id])
  const placedIds = new Set(Object.values(placements))
  const allFilled = level.slots.every(s => placements[s.id])

  // Measure diagram container
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setDims({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [phase])

  const resetLevel = useCallback(() => {
    setPlacements({})
    setAttempts(3)
    setAttemptsUsed(0)
    setRevealUsed(false)
    setChecked(false)
    setCorrectMap({})
    setShowResult(false)
    setLevelStars(0)
    setSelectedComp(null)
  }, [])

  function handleSaveAndExit() {
    saveGame(GAME_ID, { levelIdx, results } satisfies BuildAStartupSave,
      `Level ${levelIdx + 1} of ${LEVELS.length}`)
    onExit()
  }

  function handleQuit() {
    clearGame(GAME_ID)
    onExit()
  }

  const exitModal = showExitModal && (
    <ExitConfirmModal
      progressLabel={`Level ${levelIdx + 1} of ${LEVELS.length}`}
      onSaveAndExit={phase === 'playing' ? handleSaveAndExit : undefined}
      onQuit={handleQuit}
      onCancel={() => setShowExitModal(false)}
    />
  )

  function handleDrop(slotId: string, compId: string) {
    if (checked) return
    // If this component was placed elsewhere, remove it first
    setPlacements(prev => {
      const next = { ...prev }
      // Remove component from any other slot
      for (const [sid, cid] of Object.entries(next)) {
        if (cid === compId) delete next[sid]
      }
      // If slot already had something, that component goes back to tray
      next[slotId] = compId
      return next
    })
    setDragOverSlot(null)
  }

  function handleRemove(slotId: string) {
    if (checked) return
    setPlacements(prev => {
      const next = { ...prev }
      delete next[slotId]
      return next
    })
  }

  function handleCheck() {
    const map: Record<string, boolean> = {}
    let allCorrect = true
    level.slots.forEach(s => {
      const correct = placements[s.id] === s.correctId
      map[s.id] = correct
      if (!correct) allCorrect = false
    })
    setCorrectMap(map)
    setChecked(true)
    const used = attemptsUsed + 1
    setAttemptsUsed(used)

    // Track each slot as a performance entry
    level.slots.forEach(s => {
      perfEntries.current.push({
        category: 'architecture',
        correct: map[s.id],
        gameId: 'build-a-startup',
        timestamp: Date.now(),
      })
    })

    if (allCorrect) {
      playCorrect()
      const stars = used === 1 ? 3 : used === 2 ? 2 : 1
      setLevelStars(stars)
      // Delay showing result to let animations play
      setTimeout(() => setShowResult(true), 800)
    } else {
      playWrong()
      const remaining = attempts - 1
      setAttempts(remaining)
      if (remaining <= 0) {
        setLevelStars(0)
        setTimeout(() => setShowResult(true), 800)
      } else {
        // Clear wrong placements after animation
        setTimeout(() => {
          setPlacements(prev => {
            const next = { ...prev }
            level.slots.forEach(s => {
              if (!map[s.id]) delete next[s.id]
            })
            return next
          })
          setChecked(false)
          setCorrectMap({})
        }, 1200)
      }
    }
  }

  function handleReveal() {
    // Find an empty (unfilled) slot and fill it correctly
    const emptySlots = level.slots.filter(s => !placements[s.id])
    if (emptySlots.length === 0) return
    const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)]
    setPlacements(prev => ({ ...prev, [slot.id]: slot.correctId }))
    setRevealUsed(true)
    setShowHints(false)
  }

  function handleNextLevel() {
    const newResults = [...results, { levelId: level.id, stars: levelStars }]
    setResults(newResults)
    if (levelIdx >= LEVELS.length - 1) {
      setPhase('game-over')
    } else {
      setLevelIdx(levelIdx + 1)
      resetLevel()
      setPhase('intro')
    }
  }

  function handleRetry() {
    resetLevel()
    setShowResult(false)
    setPhase('playing')
  }

  function handleRestart() {
    setLevelIdx(0)
    setResults([])
    perfEntries.current = []
    hasReported.current = false
    resetLevel()
    setPhase('intro')
  }

  // ── Render phases ─────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <>
        {exitModal}
        <LevelIntro
          level={level}
          totalLevels={LEVELS.length}
          onStart={() => { resetLevel(); setPhase('playing'); playNextLevel() }}
          onExit={() => setShowExitModal(true)}
        />
      </>
    )
  }

  if (phase === 'game-over') {
    if (!hasReported.current) {
      hasReported.current = true
      report(perfEntries.current)
    }
    return (
      <GameComplete
        results={results}
        sessionStats={computeStats(perfEntries.current)}
        onRestart={handleRestart}
        onExit={handleQuit}
      />
    )
  }

  // ── Playing phase ─────────────────────────────────────────────────────────

  const diffColor = level.difficulty === 'Easy' ? S.success
    : level.difficulty === 'Medium' ? S.warn
    : S.error

  const outerBg = isDark ? S.bg : '#ece6db'

  const ThemeToggle = (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="bas-theme-toggle"
      style={{ background: isDark ? '#64597a' : '#b69c6a' }}
    >
      <span className="bas-theme-toggle-knob" style={{ left: isDark ? 20 : 4 }} />
    </button>
  )

  return (
    <div className="bas-game-shell" style={{ background: outerBg }}>
      {exitModal}
      {/* Header */}
      <div className="bas-topbar">
        <button onClick={() => setShowExitModal(true)} className="bas-btn bas-btn-ghost">
          ← Exit
        </button>

        <div className="bas-topbar-title">
          <div className="bas-topbar-kicker">Architecture Workshop</div>
          <div className="bas-topbar-name">
            {level.title}
          </div>
          <span className="bas-topbar-meta" style={{ color: diffColor }}>
            LEVEL {level.id} — {level.difficulty.toUpperCase()}
          </span>
        </div>

        {/* Attempts + theme toggle */}
        <div className="bas-topbar-side">
          <span className="bas-tries-label">Tries:</span>
          {[1, 2, 3].map(i => (
            <span key={i} className="bas-heart" style={{ opacity: i <= attempts ? 1 : 0.2, filter: i <= attempts ? 'none' : 'grayscale(1)' }}>
              ❤️
            </span>
          ))}
          {ThemeToggle}
        </div>
      </div>

      {/* Mobile: tray on top as horizontal scroll, then diagram below */}
      {isMobile && (
        <div className="bas-mobile-wrap">
          {/* Selected component indicator */}
          {selectedComp && (
            <div className="bas-mobile-selected">
              Tap a slot to place {COMPONENTS[selectedComp]?.emoji} {COMPONENTS[selectedComp]?.label}
            </div>
          )}
          <div className="bas-mobile-tray">
            {availableComps.map(comp => (
              <TrayItem
                key={comp.id}
                comp={comp}
                isPlaced={placedIds.has(comp.id)}
                selected={selectedComp === comp.id}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', comp.id)
                  e.dataTransfer.effectAllowed = 'move'
                  setDraggingId(comp.id)
                }}
                onDragEnd={() => setDraggingId(null)}
                onTap={() => setSelectedComp(prev => prev === comp.id ? null : comp.id)}
              />
            ))}
          </div>
          {/* Mobile action buttons row */}
          <div className="bas-mobile-actions">
            <button
              onClick={() => setShowHints(true)}
              className="bas-btn bas-btn-warn bas-grow-1"
            >
              💡 Hints
            </button>
            <button
              onClick={handleCheck}
              disabled={!allFilled || checked}
              className={`bas-btn ${allFilled && !checked ? 'bas-btn-success' : 'bas-btn-disabled'} bas-grow-2`}
            >
              ✓ Check
            </button>
            <button
              onClick={() => { setPlacements({}); setChecked(false); setCorrectMap({}) }}
              disabled={checked}
              className="bas-btn bas-btn-ghost bas-grow-1"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Main area: diagram (+ desktop tray) */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 0,
        padding: isMobile ? '0 8px 8px' : '8px 10px',
        minHeight: 0,
      }} className="bas-main-area">
        {/* Diagram */}
        <div className="bas-diagram-shell" style={{
          flex: 1,
          minHeight: isMobile ? 'clamp(260px, 45vh, 380px)' : 'clamp(300px, 50vh, 440px)',
        }} ref={containerRef}>
          {/* Users icon (fixed, not a drop target) */}
          <div className="bas-users-pill" style={{
            left: 'calc(50% - 55px)',
            top: `calc(${USERS_Y}% - 2px)`,
          }}>
            <span style={{ fontSize: 18 }}>👤</span>
            Users
          </div>

          {/* SVG Arrows */}
          <DiagramArrows
            connections={level.connections}
            slots={level.slots}
            containerW={dims.w}
            containerH={dims.h}
          />

          {/* Drop Slots */}
          {level.slots.map(slot => (
            <DropSlot
              key={slot.id}
              slot={slot}
              placed={placements[slot.id] ? COMPONENTS[placements[slot.id]] : null}
              dragOver={dragOverSlot === slot.id || (!!selectedComp && !placements[slot.id] && !checked)}
              checked={checked}
              isCorrect={checked ? (correctMap[slot.id] ?? null) : null}
              onDragOver={() => setDragOverSlot(slot.id)}
              onDragLeave={() => { setDragOverSlot(null); playClick() }}
              onDrop={(e) => {
                const compId = e.dataTransfer.getData('text/plain')
                if (compId) handleDrop(slot.id, compId)
              }}
              onRemove={() => {
                playClick()
                handleRemove(slot.id)
              }}
              onTapPlace={() => {
                if (selectedComp) {
                  playClick()
                  handleDrop(slot.id, selectedComp)
                  setSelectedComp(null)
                }
              }}
            />
          ))}
        </div>

        {/* Component Tray — desktop only (mobile tray is above diagram) */}
        {!isMobile && (
          <div className="bas-tray-shell">
            <div className="bas-tray-title">
              Components
            </div>

            <div className="bas-tray-list">
              {availableComps.map(comp => (
                <TrayItem
                  key={comp.id}
                  comp={comp}
                  isPlaced={placedIds.has(comp.id)}
                  selected={selectedComp === comp.id}
                  onDragStart={(e) => {
                    playPop()
                    e.dataTransfer.setData('text/plain', comp.id)
                    e.dataTransfer.effectAllowed = 'move'
                    setDraggingId(comp.id)
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  onTap={() => setSelectedComp(prev => prev === comp.id ? null : comp.id)}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="bas-tray-actions">
              <button
                onClick={() => setShowHints(true)}
                className="bas-btn bas-btn-warn"
              >
                💡 Hints
              </button>

              <button
                onClick={handleCheck}
                disabled={!allFilled || checked}
                className={`bas-btn ${allFilled && !checked ? 'bas-btn-success' : 'bas-btn-disabled'}`}
              >
                ✓ Check Answer
              </button>

              <button
                onClick={() => { setPlacements({}); setChecked(false); setCorrectMap({}) }}
                disabled={checked}
                className="bas-btn bas-btn-ghost"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hint modal */}
      {showHints && (
        <HintModal
          available={availableComps}
          attemptsUsed={attemptsUsed}
          revealUsed={revealUsed}
          onReveal={handleReveal}
          onClose={() => setShowHints(false)}
        />
      )}

      {/* Level result overlay */}
      {showResult && (
        <LevelResult
          level={level}
          stars={levelStars}
          onNext={handleNextLevel}
          onRetry={handleRetry}
          isLastLevel={levelIdx >= LEVELS.length - 1}
        />
      )}
    </div>
  )
}
