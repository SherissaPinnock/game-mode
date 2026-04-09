import { useCallback, useRef, useState } from 'react'
import { ConnectionsCard } from './ConnectionsCard'
import { SolvedRow }       from './SolvedRow'
import { StrikesDisplay }  from './StrikesDisplay'
import { COLOR_STYLES }    from './types'
import type { ConnectionGroup, GamePhase } from './types'
import { rounds } from './data/rounds'
import { usePerformance, computeStats, type PerformanceEntry } from '@/lib/performance'
import { playCorrect, playWrong, playPop } from '@/lib/sounds'
import { GameRecommendations } from '@/components/GameRecommendations'
import { useGameTheme } from '@/lib/useGameTheme'

const MAX_MISTAKES  = 4
const SELECT_LIMIT  = 4
const ANIM_DURATION = 600 // ms — matches CSS animation duration

/** Shuffles an array in place (Fisher-Yates) and returns it. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick a random round from the pool. */
function pickRound() {
  return rounds[Math.floor(Math.random() * rounds.length)]
}

interface TechConnectionsProps {
  onExit: () => void
}

/**
 * NYT Connections-style game with 4 groups of 4 tech terms.
 *
 * Phase flow: playing → won | lost
 *
 * Animation sequencing:
 *  - Correct guess → cards flash category colour (ANIM_DURATION ms) → SolvedRow slides in
 *  - Wrong guess   → cards shake (ANIM_DURATION ms) → deselect
 */
export function TechConnections({ onExit }: TechConnectionsProps) {
  const { isDark, toggle } = useGameTheme()

  // ── State ──────────────────────────────────────────────────────────────────
  const [round]           = useState(() => pickRound())
  const [remaining, setRemaining] = useState<string[]>(() =>
    shuffle(round.groups.flatMap(g => g.items)),
  )
  const [solved,    setSolved]    = useState<ConnectionGroup[]>([])
  const [selected,  setSelected]  = useState<string[]>([])
  const [mistakes,  setMistakes]  = useState(0)
  const [phase,     setPhase]     = useState<GamePhase>('playing')
  const [anim,      setAnim]      = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [correctBg, setCorrectBg] = useState<string>('')
  const [oneAway,   setOneAway]   = useState(false)

  // Prevent overlapping animations
  const animatingRef = useRef(false)

  // Performance tracking
  const { report } = usePerformance()
  const perfEntries = useRef<PerformanceEntry[]>([])
  const hasReported = useRef(false)

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Returns the group that exactly matches the selected 4 items, or undefined. */
  function findMatchedGroup(sel: string[]): ConnectionGroup | undefined {
    return round.groups.find(
      g => !solved.find(s => s.id === g.id) &&
           g.items.length === sel.length &&
           sel.every(item => g.items.includes(item)),
    )
  }

  /** True when exactly 3 of the selected items belong to any unsolved group. */
  function checkOneAway(sel: string[]): boolean {
    return round.groups.some(g => {
      if (solved.find(s => s.id === g.id)) return false
      return sel.filter(item => g.items.includes(item)).length === 3
    })
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleCardClick = useCallback((item: string) => {
    if (animatingRef.current || phase !== 'playing') return
    setOneAway(false)
    playPop()
    setSelected(prev => {
      if (prev.includes(item))       return prev.filter(s => s !== item)
      if (prev.length >= SELECT_LIMIT) return prev  // already at 4
      return [...prev, item]
    })
  }, [phase])

  const handleDeselectAll = useCallback(() => {
    if (animatingRef.current) return
    setSelected([])
    setOneAway(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (animatingRef.current || selected.length !== SELECT_LIMIT || phase !== 'playing') return

    animatingRef.current = true
    const matched = findMatchedGroup(selected)

    if (matched) {
      // ── Correct guess ──────────────────────────────────────────────────────
      perfEntries.current.push({
        category: matched.topic,
        correct: true,
        gameId: 'connections',
        timestamp: Date.now(),
      })
      setCorrectBg(COLOR_STYLES[matched.color].bg)
      setAnim('correct')
      playCorrect()

      setTimeout(() => {
        const newSolved = [...solved, matched]
        setSolved(newSolved)
        setRemaining(prev => prev.filter(item => !matched.items.includes(item)))
        setSelected([])
        setAnim('idle')
        setCorrectBg('')
        animatingRef.current = false

        if (newSolved.length === round.groups.length) setPhase('won')
      }, ANIM_DURATION)

    } else {
      // ── Wrong guess ────────────────────────────────────────────────────────
      setOneAway(checkOneAway(selected))
      setAnim('wrong')
      playWrong()
      const newMistakes = mistakes + 1
      setMistakes(newMistakes)

      setTimeout(() => {
        setAnim('idle')
        setSelected([])
        animatingRef.current = false
        if (newMistakes >= MAX_MISTAKES) setPhase('lost')
      }, ANIM_DURATION)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, phase, solved, mistakes, round])

  const handleRestart = useCallback(() => {
    perfEntries.current = []
    hasReported.current = false
    window.location.reload() // simplest reset — full state reinit
  }, [])

  // ── Report performance on game end ────────────────────────────────────────
  if ((phase === 'won' || phase === 'lost') && !hasReported.current) {
    hasReported.current = true
    // Record unsolved groups as incorrect
    const unsolvedForReport = round.groups.filter(g => !solved.find(s => s.id === g.id))
    for (const g of unsolvedForReport) {
      perfEntries.current.push({
        category: g.topic,
        correct: false,
        gameId: 'connections',
        timestamp: Date.now(),
      })
    }
    report(perfEntries.current)
  }

  const sessionStats = (phase === 'won' || phase === 'lost')
    ? computeStats(perfEntries.current) : undefined

  // ── Reveal remaining groups on loss ────────────────────────────────────────
  const unsolvedGroups = round.groups.filter(g => !solved.find(s => s.id === g.id))

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const BG = isDark
    ? 'bg-[radial-gradient(ellipse_at_top_left,_#0a1628_0%,_#060d1a_50%,_#12072a_100%)]'
    : 'bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-100'
  const HEADER = isDark
    ? 'bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl'
    : 'bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm'
  const EXIT_BTN = isDark
    ? 'border border-white/15 text-slate-400 hover:text-white hover:border-white/30 rounded-full px-3 py-1.5 text-sm font-medium transition-all'
    : 'border border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 rounded-full px-3 py-1.5 text-sm font-medium transition-all'
  const TITLE = isDark
    ? 'text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-violet-300 text-base font-black'
    : 'text-slate-800 text-base font-black'
  const SUBTITLE = isDark ? 'text-slate-500' : 'text-slate-400'
  const ONE_AWAY = isDark
    ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20'
    : 'text-amber-700 bg-amber-50 border border-amber-300'
  const WIN_BOX = isDark
    ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
    : 'text-emerald-700 bg-emerald-50 border border-emerald-300'
  const LOSS_BOX = isDark
    ? 'text-rose-300 bg-rose-500/10 border border-rose-500/20'
    : 'text-rose-700 bg-rose-50 border border-rose-300'
  const SEC_BTN = isDark
    ? 'border border-white/15 text-slate-400 hover:text-white hover:border-white/30 transition-all'
    : 'border border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-all'
  const SUBMIT_BTN = isDark
    ? 'bg-gradient-to-b from-indigo-500 to-indigo-700 border-b-[5px] border-indigo-900 text-white font-black px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-indigo-600 active:border-b-[2px] active:translate-y-[3px] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:border-b-[5px]'
    : 'bg-gradient-to-b from-violet-500 to-violet-700 border-b-[5px] border-violet-900 text-white font-black px-6 py-2.5 rounded-xl shadow-lg shadow-violet-500/30 hover:from-violet-400 hover:to-violet-600 active:border-b-[2px] active:translate-y-[3px] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:border-b-[5px]'
  const PLAY_AGAIN_BTN = isDark
    ? 'bg-gradient-to-b from-indigo-500 to-indigo-700 border-b-[5px] border-indigo-900 text-white font-black px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-indigo-600 active:border-b-[2px] active:translate-y-[3px] transition-all'
    : 'bg-gradient-to-b from-violet-500 to-violet-700 border-b-[5px] border-violet-900 text-white font-black px-6 py-2.5 rounded-xl shadow-lg shadow-violet-500/30 hover:from-violet-400 hover:to-violet-600 active:border-b-[2px] active:translate-y-[3px] transition-all'

  const ThemeToggle = (
    <button onClick={toggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-10 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${isDark ? 'bg-indigo-600' : 'bg-amber-400'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${isDark ? 'left-5' : 'left-1'}`} />
    </button>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-1 flex-col items-center px-4 py-6 gap-5 min-h-screen ${BG}`}>

      {/* Header */}
      <div className={`w-full max-w-[580px] flex items-center justify-between px-4 py-2.5 ${HEADER}`}>
        <button onClick={onExit} className={EXIT_BTN}>← Exit</button>
        <h2 className={TITLE}>🔗 Tech Connections</h2>
        {ThemeToggle}
      </div>

      <p className={`text-sm text-center max-w-[400px] ${SUBTITLE}`}>
        Find groups of four tech terms that share a common category.
      </p>

      {/* Board */}
      <div className="w-full max-w-[580px] flex flex-col gap-2">

        {/* Solved rows — each animates in on mount */}
        {solved.map(group => (
          <SolvedRow key={group.id} group={group} />
        ))}

        {/* Remaining card grid — hidden after loss (show answer rows instead) */}
        {phase !== 'lost' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {remaining.map(item => (
              <ConnectionsCard
                key={item}
                item={item}
                isSelected={selected.includes(item)}
                anim={selected.includes(item) ? anim : 'idle'}
                correctBg={correctBg || undefined}
                onClick={() => handleCardClick(item)}
              />
            ))}
          </div>
        )}

        {/* On loss: reveal all unsolved groups as greyed-out rows */}
        {phase === 'lost' && unsolvedGroups.map(group => (
          <div
            key={group.id}
            className="w-full rounded-xl flex flex-col items-center justify-center py-3 px-4 gap-1 opacity-70"
            style={{ backgroundColor: COLOR_STYLES[group.color].bg, color: COLOR_STYLES[group.color].text, minHeight: 72 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest">{group.category}</p>
            <p className="text-sm font-extrabold uppercase tracking-wider">{group.items.join(' · ')}</p>
          </div>
        ))}
      </div>

      {/* "One Away" hint */}
      {oneAway && phase === 'playing' && (
        <p className={`text-sm font-semibold animate-pulse px-4 py-2 rounded-full ${ONE_AWAY}`}>
          So close — one away!
        </p>
      )}

      {/* Strikes */}
      {phase === 'playing' && (
        <StrikesDisplay mistakes={mistakes} maxMistakes={MAX_MISTAKES} />
      )}

      {/* Win / Loss message */}
      {phase === 'won' && (
        <p className={`text-2xl font-bold px-6 py-3 rounded-2xl ${WIN_BOX}`}>🎉 You got them all!</p>
      )}
      {phase === 'lost' && (
        <p className={`text-xl font-bold px-6 py-3 rounded-2xl ${LOSS_BOX}`}>Better luck next time!</p>
      )}

      {/* Recommendations */}
      {(phase === 'won' || phase === 'lost') && (
        <GameRecommendations sessionStats={sessionStats} />
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {phase === 'playing' ? (
          <>
            <button
              onClick={handleDeselectAll}
              disabled={selected.length === 0 || anim !== 'idle'}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed ${SEC_BTN}`}
            >
              Deselect All
            </button>
            <button
              onClick={handleSubmit}
              disabled={selected.length !== SELECT_LIMIT || anim !== 'idle'}
              className={`text-sm ${SUBMIT_BTN}`}
            >
              Submit
            </button>
          </>
        ) : (
          <>
            <button onClick={onExit} className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${SEC_BTN}`}>
              ← Menu
            </button>
            <button onClick={handleRestart} className={`text-sm ${PLAY_AGAIN_BTN}`}>
              Play Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
