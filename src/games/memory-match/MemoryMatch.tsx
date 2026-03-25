import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MemoryCard } from './MemoryCard'
import { concepts }   from './data/concepts'
import type { Card }  from './types'
import { usePerformance, computeStats, type PerformanceEntry } from '@/lib/performance'
import { GameRecommendations } from '@/components/GameRecommendations'

const MISMATCH_DELAY = 900   // ms — mismatched pair visible before flipping back
const MATCH_DELAY    = 350   // ms — matched pair visible before locking in
const PEEK_DURATION  = 3000  // ms — how long the opening sneak peek lasts

function buildDeck(): Card[] {
  const deck: Card[] = concepts.flatMap(concept => [
    { id: `${concept.id}-term`,  conceptId: concept.id, display: concept.term,  role: 'term',  state: 'hidden' },
    { id: `${concept.id}-match`, conceptId: concept.id, display: concept.match, role: 'match', state: 'hidden' },
  ])
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

interface MemoryMatchProps {
  onExit: () => void
}

/**
 * Memory Match — 12 JS concept pairs.
 *
 * Opening peek: all cards are briefly revealed so the player can take a
 * mental snapshot, then they all flip back down before play begins.
 */
export function MemoryMatch({ onExit }: MemoryMatchProps) {
  const [cards,      setCards]      = useState<Card[]>(buildDeck)
  const [flipped,    setFlipped]    = useState<number[]>([])
  const [flipCount,  setFlipCount]  = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [isPeeking,  setIsPeeking]  = useState(true)

  // Performance tracking
  const { report } = usePerformance()
  const perfEntries = useRef<PerformanceEntry[]>([])
  const hasReported = useRef(false)

  // Ref keeps the timer id so we can cancel it on restart
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Start the peek countdown — clears when isPeeking becomes false
  function startPeek() {
    setIsPeeking(true)
    peekTimerRef.current = setTimeout(() => setIsPeeking(false), PEEK_DURATION)
  }

  useEffect(() => {
    startPeek()
    return () => { if (peekTimerRef.current) clearTimeout(peekTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const matchedPairs = cards.filter(c => c.state === 'matched').length / 2
  const isWon        = matchedPairs === concepts.length

  // ── Card click ─────────────────────────────────────────────────────────────
  function handleCardClick(index: number) {
    if (isPeeking || isChecking)         return
    if (cards[index].state !== 'hidden') return
    if (flipped.length >= 2)             return

    setFlipCount(prev => prev + 1)

    const updatedCards = cards.map((c, i) =>
      i === index ? { ...c, state: 'flipped' as const } : c,
    )
    setCards(updatedCards)

    const newFlipped = [...flipped, index]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setIsChecking(true)
      const [first, second] = newFlipped
      const isMatch = updatedCards[first].conceptId === updatedCards[second].conceptId

      // Track each pair attempt
      perfEntries.current.push({
        category: 'javascript',
        correct: isMatch,
        gameId: 'memory-match',
        timestamp: Date.now(),
      })

      setTimeout(() => {
        setCards(prev =>
          prev.map((c, i) =>
            i === first || i === second
              ? { ...c, state: isMatch ? 'matched' : 'hidden' }
              : c,
          ),
        )
        setFlipped([])
        setIsChecking(false)
      }, isMatch ? MATCH_DELAY : MISMATCH_DELAY)
    }
  }

  // ── Restart ────────────────────────────────────────────────────────────────
  function handleRestart() {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current)
    setCards(buildDeck())
    setFlipped([])
    setFlipCount(0)
    setIsChecking(false)
    perfEntries.current = []
    hasReported.current = false
    startPeek()
  }

  // ── Report performance on win ──────────────────────────────────────────────
  if (isWon && !hasReported.current) {
    hasReported.current = true
    report(perfEntries.current)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col items-center px-3 py-6 sm:px-6 sm:py-10 gap-4 sm:gap-6 min-h-screen bg-background">

      {/* Header */}
      <div className="w-full max-w-[740px] flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-lg font-bold">Memory Match</h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Flips: <strong className="text-foreground">{flipCount}</strong>
          </span>
          <span className="text-muted-foreground">
            Pairs: <strong className="text-foreground">{matchedPairs} / {concepts.length}</strong>
          </span>
        </div>
      </div>

      {/* Peek banner — shows while cards are revealed */}
      {isPeeking ? (
        <div className="w-full max-w-[740px] flex flex-col gap-2">
          <p className="text-center text-sm font-semibold text-foreground">
            👀 Take a mental snapshot — cards flip back in a moment!
          </p>
          {/* Depleting progress bar driven by CSS animation */}
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary peek-progress-bar"
              style={{ animationDuration: `${PEEK_DURATION}ms` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Match all 12 pairs of JavaScript concepts. Fewest flips wins.
        </p>
      )}

      {/* Win banner */}
      {isWon && (
        <div className="text-center flex flex-col gap-1">
          <p className="text-2xl font-bold text-green-600">🎉 All pairs matched!</p>
          <p className="text-muted-foreground text-sm">
            Completed in <strong>{flipCount}</strong> flip{flipCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Recommendations */}
      {isWon && (
        <GameRecommendations sessionStats={computeStats(perfEntries.current)} />
      )}

      {/* Card grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 w-full max-w-[740px]">
        {cards.map((card, index) => (
          <MemoryCard
            key={card.id}
            card={card}
            forceReveal={isPeeking}
            isDisabled={isPeeking || isChecking || isWon}
            onClick={() => handleCardClick(index)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-1">
        {isWon ? (
          <>
            <Button variant="outline" onClick={onExit}>← Menu</Button>
            <Button onClick={handleRestart}>Play Again</Button>
          </>
        ) : (
          <Button variant="outline" onClick={handleRestart}>Restart</Button>
        )}
      </div>
    </div>
  )
}
