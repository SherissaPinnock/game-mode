import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConnectionsCard } from './ConnectionsCard'
import { SolvedRow }       from './SolvedRow'
import { StrikesDisplay }  from './StrikesDisplay'
import { COLOR_STYLES }    from './types'
import type { ConnectionGroup, GamePhase } from './types'
import { rounds } from './data/rounds'
import { usePerformance, computeStats, type PerformanceEntry } from '@/lib/performance'
import { GameRecommendations } from '@/components/GameRecommendations'

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10 gap-6 min-h-screen bg-background">

      {/* Header */}
      <div className="w-full max-w-[580px] px-2 sm:px-0 flex items-center justify-between">
        <button onClick={onExit} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </button>
        <h2 className="text-lg font-bold">Tech Connections</h2>
        <div className="w-12" /> {/* spacer */}
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-[400px]">
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
            className="w-full rounded-md flex flex-col items-center justify-center py-3 px-4 gap-1 opacity-60"
            style={{ backgroundColor: COLOR_STYLES[group.color].bg, color: COLOR_STYLES[group.color].text, minHeight: 72 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest">{group.category}</p>
            <p className="text-sm font-extrabold uppercase tracking-wider">{group.items.join(' · ')}</p>
          </div>
        ))}
      </div>

      {/* "One Away" hint */}
      {oneAway && phase === 'playing' && (
        <p className="text-sm font-semibold text-amber-600 animate-pulse">
          So close — one away!
        </p>
      )}

      {/* Strikes */}
      {phase === 'playing' && (
        <StrikesDisplay mistakes={mistakes} maxMistakes={MAX_MISTAKES} />
      )}

      {/* Win / Loss message */}
      {phase === 'won' && (
        <p className="text-2xl font-bold text-green-600">🎉 You got them all!</p>
      )}
      {phase === 'lost' && (
        <p className="text-xl font-bold text-red-500">Better luck next time!</p>
      )}

      {/* Recommendations */}
      {(phase === 'won' || phase === 'lost') && (
        <GameRecommendations sessionStats={sessionStats} />
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {phase === 'playing' ? (
          <>
            <Button
              variant="outline"
              onClick={handleDeselectAll}
              disabled={selected.length === 0 || anim !== 'idle'}
            >
              Deselect All
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selected.length !== SELECT_LIMIT || anim !== 'idle'}
            >
              Submit
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onExit}>← Menu</Button>
            <Button onClick={handleRestart}>Play Again</Button>
          </>
        )}
      </div>
    </div>
  )
}
