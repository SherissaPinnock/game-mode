import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { games as allGames } from '@/data/games'
import {
  fetchGameConfig,
  updateGameConfig,
  bulkUpdateSortOrder,
  type GameConfigEntry,
} from '@/lib/supabaseApi'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined
const SESSION_KEY    = 'admin_authed'

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        checked ? 'bg-indigo-500' : 'bg-slate-600',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <span className={[
        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow',
        'transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0',
      ].join(' ')} />
    </button>
  )
}

// ── Password gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ADMIN_PASSWORD || input === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onAuth()
    } else {
      setError(true)
      setInput('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-white text-xl font-bold">Admin Access</h1>
          <p className="text-slate-400 text-sm mt-1">Enter the admin password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            placeholder="Password"
            className={[
              'w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500',
              error ? 'border-red-500' : 'border-slate-700',
            ].join(' ')}
          />
          {error && <p className="text-red-400 text-xs">Incorrect password. Try again.</p>}
          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl py-3 transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a sorted game-id list from config. Falls back to allGames order when all sort_orders are 0. */
function buildSortedIds(config: Map<string, GameConfigEntry>): string[] {
  const allZero = [...config.values()].every(c => c.sortOrder === 0)
  if (allZero || config.size === 0) {
    return allGames.map(g => g.id)
  }
  return [...allGames]
    .sort((a, b) => {
      const aOrder = config.get(a.id)?.sortOrder ?? 999
      const bOrder = config.get(b.id)?.sortOrder ?? 999
      return aOrder - bOrder
    })
    .map(g => g.id)
}

// ── Main admin page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(
    () => !ADMIN_PASSWORD || sessionStorage.getItem(SESSION_KEY) === '1',
  )
  const [config,     setConfig]     = useState<Map<string, GameConfigEntry>>(new Map())
  const [orderedIds, setOrderedIds] = useState<string[]>(() => allGames.map(g => g.id))
  const [saving,     setSaving]     = useState<Record<string, boolean>>({})
  const [saved,      setSaved]      = useState<Record<string, string>>({})   // gameId → 'ok' | 'err' | ''
  const [loading,    setLoading]    = useState(true)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    if (!authed) return
    fetchGameConfig().then(cfg => {
      setConfig(cfg)
      setOrderedIds(buildSortedIds(cfg))
      setLoading(false)
    })
  }, [authed])

  // ── Toggle published / featured ──────────────────────────────────────────

  async function handleToggle(gameId: string, field: 'published' | 'featured', value: boolean) {
    const prev = config.get(gameId) ?? { gameId, published: true, featured: false, sortOrder: 0 }

    setConfig(cfg => {
      const next = new Map(cfg)
      next.set(gameId, { ...prev, [field]: value })
      return next
    })
    setSaved(s => ({ ...s, [gameId]: '' }))
    setSaving(s => ({ ...s, [`${gameId}:${field}`]: true }))

    const err = await updateGameConfig(gameId, { [field]: value })

    setSaving(s => ({ ...s, [`${gameId}:${field}`]: false }))
    if (err) {
      setConfig(cfg => { const next = new Map(cfg); next.set(gameId, prev); return next })
      setSaved(s => ({ ...s, [gameId]: 'err:' + err }))
    } else {
      setSaved(s => ({ ...s, [gameId]: 'ok' }))
      setTimeout(() => setSaved(s => ({ ...s, [gameId]: '' })), 1500)
    }
  }

  // ── Reorder ──────────────────────────────────────────────────────────────

  function move(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= orderedIds.length) return
    const next = [...orderedIds]
    const [item] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, item)
    setOrderedIds(next)
  }

  async function saveOrder() {
    setReordering(true)
    const updates = orderedIds.map((gameId, i) => ({ gameId, sortOrder: i }))
    const err = await bulkUpdateSortOrder(updates)
    if (!err) {
      // Update local config to reflect new sort orders
      setConfig(cfg => {
        const next = new Map(cfg)
        updates.forEach(({ gameId, sortOrder }) => {
          const entry = next.get(gameId) ?? { gameId, published: true, featured: false, sortOrder: 0 }
          next.set(gameId, { ...entry, sortOrder })
        })
        return next
      })
    }
    setReordering(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  const publishedCount = [...config.values()].filter(c => c.published).length
  const featuredCount  = [...config.values()].filter(c => c.featured).length

  const orderedGames = orderedIds
    .map(id => allGames.find(g => g.id === id)!)
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Back to app
          </button>
          <span className="text-slate-700">|</span>
          <h1 className="text-white font-bold text-lg">Game Admin</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>{publishedCount} published</span>
          <span>·</span>
          <span>{featuredCount} featured</span>
          <button
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false) }}
            className="text-slate-500 hover:text-slate-300 transition-colors ml-2"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 text-sm">
            Changes take effect immediately — no redeploy needed.
          </p>
          <button
            onClick={saveOrder}
            disabled={reordering}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {reordering ? 'Saving order…' : 'Save order'}
          </button>
        </div>

        {loading ? (
          <div className="text-slate-500 text-sm">Loading config…</div>
        ) : (
          <div className="rounded-2xl border border-slate-800 overflow-hidden">

            {/* Column headers */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-3 bg-slate-900 border-b border-slate-800 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <span className="w-10 text-center">Order</span>
              <span>Game</span>
              <span className="w-20 text-center">Published</span>
              <span className="w-20 text-center">Featured</span>
              <span className="w-12" />
            </div>

            {orderedGames.map((game, i) => {
              const cfg    = config.get(game.id)
              const pub    = cfg?.published ?? true
              const feat   = cfg?.featured  ?? false
              const isBusy = saving[`${game.id}:published`] || saving[`${game.id}:featured`]
              const status = saved[game.id] ?? ''

              return (
                <div
                  key={game.id}
                  className={[
                    'grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-4',
                    i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/10',
                    !pub ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  {/* Up / down buttons */}
                  <div className="w-10 flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => move(i, i - 1)}
                      disabled={i === 0}
                      className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(i, i + 1)}
                      disabled={i === orderedGames.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Game info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      <game.icon size={16} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{game.title}</p>
                      <p className="text-slate-500 text-xs">{game.tag} · {game.level}</p>
                    </div>
                  </div>

                  {/* Published toggle */}
                  <div className="w-20 flex justify-center">
                    <Toggle
                      checked={pub}
                      onChange={v => handleToggle(game.id, 'published', v)}
                      disabled={!!isBusy}
                    />
                  </div>

                  {/* Featured toggle */}
                  <div className="w-20 flex justify-center">
                    <Toggle
                      checked={feat}
                      onChange={v => handleToggle(game.id, 'featured', v)}
                      disabled={!!isBusy || !pub}
                    />
                  </div>

                  {/* Status indicator */}
                  <div className="w-12 flex justify-end">
                    {status.startsWith('err:') ? (
                      <span className="text-red-400 text-xs" title={status.slice(4)}>Failed</span>
                    ) : status === 'ok' ? (
                      <span className="text-emerald-400 text-xs">Saved</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
