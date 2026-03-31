import { useEffect, useRef, useState, useCallback, type DragEvent } from 'react'
import { usePerformance, computeStats, type PerformanceEntry } from '@/lib/performance'
import { GameRecommendations } from '@/components/GameRecommendations'
import { playCorrect, playWrong, playClick, playNextLevel, playPop} from '@/lib/sounds'

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
  'dns':             { id: 'dns',             label: 'DNS',             emoji: '🌐',  description: 'Translates domain names (like google.com) into IP addresses so browsers know where to go.',                        color: '#95a5a6' },
  'cdn':             { id: 'cdn',             label: 'CDN',             emoji: '🌍',  description: 'Caches static files (images, CSS, JS) on servers around the world so users get content from the nearest location.',  color: '#27ae60' },
  'load-balancer':   { id: 'load-balancer',   label: 'Load Balancer',   emoji: '⚖️',  description: 'Distributes incoming traffic evenly across multiple servers so no single server gets overwhelmed.',                color: '#8e44ad' },
  'api-gateway':     { id: 'api-gateway',     label: 'API Gateway',     emoji: '🚪',  description: 'The single entry point for all API requests. Handles routing, rate limiting, and authentication.',                 color: '#16a085' },
  'web-server':      { id: 'web-server',      label: 'Web Server',      emoji: '🖥️',  description: 'Processes HTTP requests from users, runs your application code, and returns responses.',                            color: '#2980b9' },
  'api-server':      { id: 'api-server',      label: 'API Server',      emoji: '💻',  description: 'Handles API requests and executes business logic. The brain of your backend.',                                       color: '#3498db' },
  'cache':           { id: 'cache',           label: 'Cache',           emoji: '⚡',  description: 'Stores frequently accessed data in memory (like Redis) for ultra-fast retrieval instead of hitting the database.',    color: '#f1c40f' },
  'database':        { id: 'database',        label: 'Database',        emoji: '🗄️',  description: 'Persistently stores structured data (users, posts, orders). The source of truth for your application.',            color: '#e67e22' },
  'message-queue':   { id: 'message-queue',   label: 'Msg Queue',       emoji: '📬',  description: 'Buffers messages between services for async processing. Decouples producers from consumers (like SQS or RabbitMQ).', color: '#e74c3c' },
  'worker':          { id: 'worker',          label: 'Worker',          emoji: '⚙️',  description: 'A background process that pulls jobs from a queue and processes them (video encoding, email sending, etc.).',       color: '#7f8c8d' },
  'auth-service':    { id: 'auth-service',    label: 'Auth Service',    emoji: '🔐',  description: 'Dedicated microservice for user login, signup, tokens, and permissions.',                                            color: '#c0392b' },
  'product-service': { id: 'product-service', label: 'Product Svc',     emoji: '🏪',  description: 'Microservice managing product catalog, inventory, and pricing.',                                                     color: '#d35400' },
  'object-storage':  { id: 'object-storage',  label: 'Obj Storage',     emoji: '📦',  description: 'Stores large files like images, videos, and backups (like AWS S3).',                                                 color: '#2c3e50' },
  'firewall':        { id: 'firewall',        label: 'Firewall',        emoji: '🛡️',  description: 'Filters network traffic and blocks malicious requests before they reach your servers.',                               color: '#c0392b' },
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
  bg:        '#faf8f0',
  paper:     '#f5f0e8',
  gridLine:  '#e0d9cc',
  border:    '#bbb4a7',
  darkText:  '#2d2d2d',
  mutedText: '#888',
  accent:    '#4a90d9',
  success:   '#27ae60',
  error:     '#e74c3c',
  warn:      '#f39c12',
  slotBg:    '#f0ede5',
  slotDash:  '#aaa49a',
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
    bgColor = '#e8f0fe'
    borderStyle = '3px solid'
  } else if (checked && isCorrect === true) {
    borderColor = S.success
    bgColor = '#e8f8e8'
    borderStyle = '3px solid'
    animClass = 'bas-correct'
  } else if (checked && isCorrect === false) {
    borderColor = S.error
    bgColor = '#fde8e8'
    borderStyle = '3px solid'
    animClass = 'bas-wrong'
  } else if (placed) {
    borderColor = placed.color
    bgColor = '#fff'
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
        boxShadow: dragOver ? `0 0 12px ${S.accent}44` : placed ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
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
          color: S.mutedText,
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
        background: selected ? '#e0f0ff' : isPlaced ? '#eee' : '#fff',
        border: `2px solid ${selected ? S.accent : isPlaced ? '#ddd' : comp.color}`,
        borderRadius: 10,
        cursor: isPlaced ? 'default' : 'pointer',
        opacity: isPlaced ? 0.4 : 1,
        transition: 'all 0.2s ease',
        boxShadow: selected ? `0 0 0 3px ${S.accent}44` : isPlaced ? 'none' : '0 2px 6px rgba(0,0,0,0.08)',
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
        color: isPlaced ? '#aaa' : S.darkText,
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: S.bg,
        border: `3px solid ${S.border}`,
        borderRadius: 16,
        padding: '28px 32px',
        maxWidth: 500,
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20, paddingBottom: 14,
          borderBottom: `2px solid ${S.gridLine}`,
        }}>
          <h3 style={{ margin: 0, fontFamily: S.font, fontSize: 28, color: S.darkText }}>
            Component Guide
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: `2px solid ${S.border}`, borderRadius: 8,
            padding: '6px 14px', cursor: 'pointer',
            fontFamily: S.bodyFont, fontSize: 14, color: S.mutedText,
          }}>
            Close
          </button>
        </div>

        {/* Component descriptions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {available.map(comp => (
            <div key={comp.id} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '10px 14px',
              background: '#fff',
              border: `1px solid ${S.gridLine}`,
              borderRadius: 10,
              borderLeft: `4px solid ${comp.color}`,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{comp.emoji}</span>
              <div>
                <div style={{ fontFamily: S.bodyFont, fontSize: 14, fontWeight: 700, color: S.darkText }}>
                  {comp.label}
                </div>
                <div style={{ fontFamily: S.bodyFont, fontSize: 13, color: S.mutedText, lineHeight: 1.5, marginTop: 4 }}>
                  {comp.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reveal hint section */}
        <div style={{
          marginTop: 20, paddingTop: 16,
          borderTop: `2px solid ${S.gridLine}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: S.font, fontSize: 20, color: S.darkText }}>
              Reveal a box
            </div>
            <div style={{ fontFamily: S.bodyFont, fontSize: 12, color: S.mutedText, marginTop: 2 }}>
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
            style={{
              background: canReveal ? S.warn : '#eee',
              color: canReveal ? '#fff' : '#bbb',
              border: 'none',
              borderRadius: 10,
              padding: '10px 18px',
              fontFamily: S.bodyFont,
              fontSize: 14,
              fontWeight: 700,
              cursor: canReveal ? 'pointer' : 'not-allowed',
              boxShadow: canReveal ? '0 2px 8px rgba(243,156,18,0.3)' : 'none',
            }}
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
    <div className="sketch-bg" style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: S.bg,
      fontFamily: S.bodyFont,
    }}>
      <div style={{
        background: '#fff',
        border: `3px solid ${S.border}`,
        borderRadius: 20,
        padding: '44px 48px',
        maxWidth: 520,
        width: '90%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        {/* Level badge */}
        <div style={{
          display: 'inline-block',
          background: S.accent,
          color: '#fff',
          borderRadius: 20,
          padding: '5px 18px',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.05em',
          marginBottom: 16,
        }}>
          LEVEL {level.id} / {totalLevels}
        </div>

        <h1 style={{
          fontFamily: S.font,
          fontSize: 42,
          margin: '0 0 4px',
          color: S.darkText,
        }}>
          {level.title}
        </h1>

        {/* Difficulty */}
        <span style={{
          display: 'inline-block',
          background: `${diffColor}18`,
          color: diffColor,
          border: `2px solid ${diffColor}`,
          borderRadius: 8,
          padding: '3px 12px',
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 20,
        }}>
          {level.difficulty.toUpperCase()}
        </span>

        <p style={{
          fontSize: 16,
          lineHeight: 1.7,
          color: '#555',
          margin: '0 0 8px',
        }}>
          {level.scenario}
        </p>

        {/* Stats */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          margin: '20px 0',
          padding: '14px 0',
          borderTop: `1px solid ${S.gridLine}`,
          borderBottom: `1px solid ${S.gridLine}`,
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: S.darkText }}>{level.slots.length}</div>
            <div style={{ fontSize: 12, color: S.mutedText }}>components</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: S.darkText }}>{level.available.length - level.slots.length}</div>
            <div style={{ fontSize: 12, color: S.mutedText }}>distractors</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: S.darkText }}>3</div>
            <div style={{ fontSize: 12, color: S.mutedText }}>attempts</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onExit} style={{
            padding: '12px 24px',
            background: 'transparent',
            border: `2px solid ${S.border}`,
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            color: S.mutedText,
            cursor: 'pointer',
          }}>
            Back
          </button>
          <button onClick={onStart} style={{
            padding: '12px 32px',
            background: S.accent,
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
            boxShadow: `0 4px 14px ${S.accent}44`,
          }}>
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)',
    }}>
      <div style={{
        background: '#fff',
        border: `3px solid ${passed ? S.success : S.error}`,
        borderRadius: 20,
        padding: '40px 48px',
        maxWidth: 420,
        textAlign: 'center',
        boxShadow: `0 12px 40px ${passed ? S.success : S.error}22`,
      }}>
        {/* Stars */}
        <div style={{ fontSize: 44, marginBottom: 12 }}>
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

        <h2 style={{
          fontFamily: S.font,
          fontSize: 36,
          margin: '0 0 8px',
          color: passed ? S.success : S.error,
        }}>
          {passed ? 'Architecture Complete!' : 'System Down!'}
        </h2>

        <p style={{
          fontSize: 15,
          color: '#666',
          lineHeight: 1.6,
          margin: '0 0 24px',
        }}>
          {passed
            ? stars === 3
              ? 'Perfect architecture on the first try! You really know your stuff.'
              : stars === 2
                ? 'Solid work! Just needed a second look to nail it.'
                : 'You got there in the end. Practice makes perfect!'
            : 'Ran out of attempts. Review the component descriptions and try again!'}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onRetry} style={{
            padding: '12px 24px',
            background: 'transparent',
            border: `2px solid ${S.border}`,
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            color: S.mutedText,
            cursor: 'pointer',
          }}>
            Retry
          </button>
          {passed && (
            <button onClick={onNext} style={{
              padding: '12px 28px',
              background: S.accent,
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${S.accent}44`,
            }}>
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
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      background: S.bg,
      fontFamily: S.bodyFont,
      padding: '48px 24px',
    }}>
      <div style={{
        background: '#fff',
        border: `3px solid ${S.accent}`,
        borderRadius: 20,
        padding: '44px 48px',
        width: '100%',
        maxWidth: 900,
        boxShadow: `0 12px 40px ${S.accent}22`,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🏗️</div>
          <h1 style={{
            fontFamily: S.font,
            fontSize: 40,
            margin: '0 0 8px',
            color: S.darkText,
          }}>
            Startup Built!
          </h1>
          <p style={{ fontSize: 15, color: '#666', margin: '0 0 12px' }}>
            You've completed all {results.length} architecture challenges.
          </p>
          <div style={{ fontSize: 28, fontWeight: 700, color: S.accent }}>
            {totalStars} / {maxStars} ⭐
          </div>
        </div>

        {/* Two-column layout on desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          marginBottom: 32,
        }}>
          {/* Per-level breakdown */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            padding: '20px',
            background: S.paper,
            borderRadius: 12,
            border: `1px solid ${S.gridLine}`,
          }}>
            {results.map((r, i) => (
              <div key={r.levelId} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 8px',
                borderBottom: i < results.length - 1 ? `1px solid ${S.gridLine}` : 'none',
              }}>
                <span style={{ fontSize: 14, color: S.darkText, fontWeight: 600 }}>
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

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onExit} style={{
            padding: '12px 24px',
            background: 'transparent',
            border: `2px solid ${S.border}`,
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            color: S.mutedText,
            cursor: 'pointer',
          }}>
            Home
          </button>
          <button onClick={onRestart} style={{
            padding: '12px 28px',
            background: S.accent,
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
            boxShadow: `0 4px 14px ${S.accent}44`,
          }}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Game Component ─────────────────────────────────────────────────────

export default function BuildAStartup({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [levelIdx, setLevelIdx] = useState(0)
  const [placements, setPlacements] = useState<Record<string, string>>({})  // slotId -> componentId
  const [attempts, setAttempts] = useState(3)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [revealUsed, setRevealUsed] = useState(false)
  const [checked, setChecked] = useState(false)
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({}) // slotId -> correct?
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [levelStars, setLevelStars] = useState(0)
  const [results, setResults] = useState<{ levelId: number; stars: number }[]>([])
  const [, setDraggingId] = useState<string | null>(null)
  // Touch-friendly tap-to-place: tap a tray item to select, tap a slot to place
  const [selectedComp, setSelectedComp] = useState<string | null>(null)

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
      <LevelIntro
        level={level}
        totalLevels={LEVELS.length}
        onStart={() => { resetLevel(); setPhase('playing'); playNextLevel() }}
        onExit={onExit}
      />
    )
  }

  if (phase === 'game-over') {
    // Report performance once
    if (!hasReported.current) {
      hasReported.current = true
      report(perfEntries.current)
    }
    return (
      <GameComplete
        results={results}
        sessionStats={computeStats(perfEntries.current)}
        onRestart={handleRestart}
        onExit={onExit}
      />
    )
  }

  // ── Playing phase ─────────────────────────────────────────────────────────

  const diffColor = level.difficulty === 'Easy' ? S.success
    : level.difficulty === 'Medium' ? S.warn
    : S.error

  return (
    <div style={{
      minHeight: '100vh',
      background: S.bg,
      fontFamily: S.bodyFont,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: `2px solid ${S.gridLine}`,
        background: '#fff',
      }}>
        <button onClick={onExit} style={{
          background: 'none', border: `2px solid ${S.border}`, borderRadius: 8,
          padding: '6px 14px', cursor: 'pointer',
          fontFamily: S.bodyFont, fontSize: 14, color: S.mutedText,
        }}>
          ← Back
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: S.font,
            fontSize: 24,
            color: S.darkText,
            lineHeight: 1.2,
          }}>
            {level.title}
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: diffColor,
            letterSpacing: '0.06em',
          }}>
            LEVEL {level.id} — {level.difficulty.toUpperCase()}
          </span>
        </div>

        {/* Attempts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: S.mutedText, fontWeight: 600 }}>Tries:</span>
          {[1, 2, 3].map(i => (
            <span key={i} style={{
              fontSize: 20,
              opacity: i <= attempts ? 1 : 0.2,
              filter: i <= attempts ? 'none' : 'grayscale(1)',
            }}>
              ❤️
            </span>
          ))}
        </div>
      </div>

      {/* Mobile: tray on top as horizontal scroll, then diagram below */}
      {isMobile && (
        <div style={{ width: '100%', padding: '0 8px' }}>
          {/* Selected component indicator */}
          {selectedComp && (
            <div style={{
              textAlign: 'center', padding: '6px', marginBottom: 6,
              background: '#e0f0ff', borderRadius: 8,
              fontSize: 13, fontWeight: 600, color: S.accent,
            }}>
              Tap a slot to place {COMPONENTS[selectedComp]?.emoji} {COMPONENTS[selectedComp]?.label}
            </div>
          )}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            padding: '8px 0', marginBottom: 8,
            WebkitOverflowScrolling: 'touch',
          }}>
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => setShowHints(true)}
              style={{
                flex: 1, padding: '10px', background: '#fff',
                border: `2px solid ${S.warn}`, borderRadius: 10,
                fontSize: 14, fontWeight: 600, color: S.warn, cursor: 'pointer',
              }}
            >
              💡 Hints
            </button>
            <button
              onClick={handleCheck}
              disabled={!allFilled || checked}
              style={{
                flex: 2, padding: '10px',
                background: allFilled && !checked ? S.success : '#ddd',
                border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                color: allFilled && !checked ? '#fff' : '#aaa',
                cursor: allFilled && !checked ? 'pointer' : 'not-allowed',
              }}
            >
              ✓ Check
            </button>
            <button
              onClick={() => { setPlacements({}); setChecked(false); setCorrectMap({}) }}
              disabled={checked}
              style={{
                flex: 1, padding: '10px', background: 'transparent',
                border: `1px solid ${S.border}`, borderRadius: 8,
                fontSize: 13, color: S.mutedText,
                cursor: checked ? 'not-allowed' : 'pointer',
              }}
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
      }}>
        {/* Diagram */}
        <div style={{
          flex: 1,
          position: 'relative',
          background: '#fff',
          border: `2px solid ${S.gridLine}`,
          borderRadius: 16,
          backgroundImage: `
            linear-gradient(${S.gridLine}40 1px, transparent 1px),
            linear-gradient(90deg, ${S.gridLine}40 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          overflow: 'visible',
          minHeight: isMobile ? 'clamp(260px, 45vh, 380px)' : 'clamp(300px, 50vh, 440px)',
        }} ref={containerRef}>
          {/* Users icon (fixed, not a drop target) */}
          <div style={{
            position: 'absolute',
            left: `calc(50% - 55px)`,
            top: `calc(${USERS_Y}% - 2px)`,
            width: 110,
            height: 40,
            background: S.accent,
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: `0 3px 10px ${S.accent}33`,
            zIndex: 3,
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
          <div style={{
            width: 'clamp(160px, 22vw, 200px)',
            marginLeft: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{
              fontFamily: S.font,
              fontSize: 'clamp(16px, 4vw, 22px)',
              color: S.darkText,
              marginBottom: 4,
              textAlign: 'center',
            }}>
              Components
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingRight: 4,
            }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setShowHints(true)}
                style={{
                  padding: '10px',
                  background: '#fff',
                  border: `2px solid ${S.warn}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: S.warn,
                  cursor: 'pointer',
                }}
              >
                💡 Hints
              </button>

              <button
                onClick={handleCheck}
                disabled={!allFilled || checked}
                style={{
                  padding: '12px',
                  background: allFilled && !checked ? S.success : '#ddd',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  color: allFilled && !checked ? '#fff' : '#aaa',
                  cursor: allFilled && !checked ? 'pointer' : 'not-allowed',
                  boxShadow: allFilled && !checked ? `0 3px 10px ${S.success}33` : 'none',
                }}
              >
                ✓ Check Answer
              </button>

              <button
                onClick={() => { setPlacements({}); setChecked(false); setCorrectMap({}) }}
                disabled={checked}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: `1px solid ${S.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  color: S.mutedText,
                  cursor: checked ? 'not-allowed' : 'pointer',
                }}
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
