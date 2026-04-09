import { useEffect, useRef, useState } from 'react'
import { MemoryCard } from './MemoryCard'
import { concepts }   from './data/concepts'
import type { Card }  from './types'
import { usePerformance, computeStats, type PerformanceEntry } from '@/lib/performance'
import { playCorrect, playWrong } from '@/lib/sounds'
import { GameRecommendations } from '@/components/GameRecommendations'
import { useGameTheme } from '@/lib/useGameTheme'

const MISMATCH_DELAY = 900
const MATCH_DELAY    = 350
const PEEK_DURATION  = 3000

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

interface MemoryMatchProps { onExit: () => void }

export function MemoryMatch({ onExit }: MemoryMatchProps) {
  const { isDark, toggle } = useGameTheme()
  const [cards,      setCards]      = useState<Card[]>(buildDeck)
  const [flipped,    setFlipped]    = useState<number[]>([])
  const [flipCount,  setFlipCount]  = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [isPeeking,  setIsPeeking]  = useState(true)

  const { report } = usePerformance()
  const perfEntries = useRef<PerformanceEntry[]>([])
  const hasReported = useRef(false)
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

      if (isMatch) playCorrect(); else playWrong()
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

  if (isWon && !hasReported.current) {
    hasReported.current = true
    report(perfEntries.current)
  }

  // ── Theme ────────────────────────────────────────────────────────────────
  const BG = isDark
    ? 'bg-[radial-gradient(ellipse_at_50%_0%,_#2a0a4e_0%,_#07071a_50%,_#1a0522_100%)]'
    : 'bg-gradient-to-br from-fuchsia-100 via-violet-50 to-sky-100'
  const HEADER    = isDark ? 'bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl' : 'bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl'
  const EXIT_BTN  = isDark ? 'border border-white/15 text-slate-400 hover:text-white hover:border-white/30 rounded-full px-3 py-1.5 text-sm font-medium transition-all' : 'border border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 rounded-full px-3 py-1.5 text-sm font-medium transition-all'
  const TITLE     = isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-violet-300' : 'text-slate-800'
  const BADGE     = isDark ? 'bg-white/5 text-slate-400 rounded-full px-2 py-1' : 'bg-slate-100 text-slate-500 rounded-full px-2 py-1'
  const MUTED     = isDark ? 'text-slate-500' : 'text-slate-400'
  const PEEK_BAR  = isDark ? 'bg-fuchsia-400' : 'bg-violet-500'
  const PEEK_TRACK = isDark ? 'bg-white/10' : 'bg-slate-200'
  const WIN_BOX   = isDark ? 'bg-emerald-950/60 border border-emerald-400/40 text-emerald-300' : 'bg-emerald-50 border border-emerald-300 text-emerald-700'
  const PRIMARY_BTN = isDark
    ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-fuchsia-500/25 active:scale-95 transition-all'
    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/20 active:scale-95 transition-all'
  const SEC_BTN = isDark
    ? 'border border-white/15 text-slate-400 hover:text-white hover:border-white/30 transition-all'
    : 'border border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-all'

  const ThemeToggle = (
    <button onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'}
      className={`relative w-10 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${isDark ? 'bg-fuchsia-600' : 'bg-amber-400'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${isDark ? 'left-5' : 'left-1'}`} />
    </button>
  )

  return (
    <div className={`flex flex-1 flex-col items-center px-3 py-6 sm:px-6 sm:py-10 gap-4 sm:gap-5 min-h-screen ${BG}`}>

      {/* Header */}
      <div className={`w-full max-w-[740px] flex items-center justify-between px-4 py-2.5 ${HEADER}`}>
        <button onClick={onExit} className={EXIT_BTN}>← Exit</button>
        <h2 className={`text-base font-black ${TITLE}`}>🧠 Memory Match</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className={BADGE}><strong className={isDark ? 'text-white' : 'text-slate-700'}>{flipCount}</strong> flips</span>
          <span className={BADGE}><strong className={isDark ? 'text-fuchsia-300' : 'text-violet-600'}>{matchedPairs}</strong><span className={MUTED}>/{concepts.length}</span></span>
          {ThemeToggle}
        </div>
      </div>

      {/* Peek banner */}
      {isPeeking ? (
        <div className="w-full max-w-[740px] flex flex-col gap-2">
          <p className={`text-center text-sm font-semibold ${isDark ? 'text-fuchsia-300' : 'text-violet-700'}`}>
            👀 Take a mental snapshot — cards flip back in a moment!
          </p>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${PEEK_TRACK}`}>
            <div className={`h-full rounded-full peek-progress-bar ${PEEK_BAR}`}
              style={{ animationDuration: `${PEEK_DURATION}ms` }} />
          </div>
        </div>
      ) : (
        <p className={`text-sm ${MUTED}`}>
          Match all {concepts.length} pairs of JavaScript concepts. Fewest flips wins.
        </p>
      )}

      {/* Win banner */}
      {isWon && (
        <div className={`text-center flex flex-col gap-1 rounded-2xl px-6 py-4 ${WIN_BOX}`}>
          <p className="text-2xl font-black">🎉 All pairs matched!</p>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Completed in <strong className={isDark ? 'text-white' : 'text-slate-800'}>{flipCount}</strong> flip{flipCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {isWon && <GameRecommendations sessionStats={computeStats(perfEntries.current)} />}

      {/* Card grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 w-full max-w-[740px]">
        {cards.map((card, index) => (
          <MemoryCard
            key={card.id}
            card={card}
            forceReveal={isPeeking}
            isDisabled={isPeeking || isChecking || isWon}
            isDark={isDark}
            onClick={() => handleCardClick(index)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-1">
        {isWon ? (
          <>
            <button onClick={onExit} className={`px-5 py-2.5 rounded-xl text-sm ${SEC_BTN}`}>← Menu</button>
            <button onClick={handleRestart} className={`px-5 py-2.5 rounded-xl text-sm ${PRIMARY_BTN}`}>Play Again</button>
          </>
        ) : (
          <button onClick={handleRestart} className={`px-5 py-2.5 rounded-xl text-sm ${SEC_BTN}`}>Restart</button>
        )}
      </div>
    </div>
  )
}
