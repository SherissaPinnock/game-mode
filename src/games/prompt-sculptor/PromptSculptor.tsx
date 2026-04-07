import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CHALLENGES } from './challenges'
import type { Challenge, TechniqueOption, GamePhase, TechniqueType } from './types'
import { playCorrect, playWrong } from '@/lib/sounds'

// ─── Tutorial Content ────────────────────────────────────────────────────────

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Prompt Sculptor! 🎨',
    content:
      'Learn the art of prompt engineering by sculpting AI responses. Your job: transform a broken prompt into one that produces the exact target output.',
  },
  {
    title: 'The Challenge',
    content:
      'Each level shows you: (1) a BASE PROMPT that produces wrong output, (2) a TARGET OUTPUT you need to achieve. Add techniques to sculpt the prompt until the output matches.',
  },
  {
    title: 'Techniques',
    content:
      'You have 5 techniques at your disposal:\n\n🎭 ROLE — Assign a persona (e.g., "You are a haiku poet")\n📚 EXAMPLES — Show example outputs\n🔒 CONSTRAINTS — Add hard rules and requirements\n📐 FORMAT — Specify output structure\n🔄 COT — Chain-of-thought reasoning',
  },
  {
    title: 'Scoring & Stars',
    content:
      'Each technique costs complexity points. The goal is to use the FEWEST points possible.\n\n⭐⭐⭐ = Optimal solution (minimum cost)\n⭐⭐ = Good solution (1-2 extra points)\n⭐ = Solved but inefficient\n\nBonus: +50 pts for 3 stars, +25 pts for 2 stars!',
  },
  {
    title: "Let's Play!",
    content:
      'Click "Start Playing" to begin. You can always come back to review this tutorial. Good luck, Prompt Sculptor! 🚀',
  },
]

// ─── Icons for technique types ───────────────────────────────────────────────

const TECHNIQUE_ICONS: Record<TechniqueType, string> = {
  role: '🎭',
  examples: '📚',
  constraints: '🔒',
  format: '📐',
  cot: '🔄',
}

const TECHNIQUE_COLORS: Record<TechniqueType, string> = {
  role: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
  examples: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  constraints: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
  format: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
  cot: 'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200',
}

// ─── Star Rating Component ───────────────────────────────────────────────────

function StarRating({ stars, size = 'md' }: { stars: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-3xl' : 'text-xl'
  return (
    <div className={`flex gap-0.5 ${sizeClass}`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`transition-all duration-300 ${
            i <= stars
              ? 'text-yellow-400 drop-shadow-sm'
              : 'text-gray-300'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

// ─── Typing Animation Component ──────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

interface PromptSculptorProps {
  onExit: () => void
}

export function PromptSculptor({ onExit }: PromptSculptorProps) {
  const [phase, setPhase] = useState<GamePhase>('tutorial')
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0)
  const [appliedTechniques, setAppliedTechniques] = useState<Set<string>>(new Set())
  const [availableTechniques, setAvailableTechniques] = useState<TechniqueOption[]>([])
  const [currentOutput, setCurrentOutput] = useState('')
  const [displayedOutput, setDisplayedOutput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [score, setScore] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [stars, setStars] = useState(0)
  const [challengeStartTime, setChallengeStartTime] = useState(Date.now())
  const [matchPercentage, setMatchPercentage] = useState(0)

  const outputRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentChallenge: Challenge = CHALLENGES[currentChallengeIndex]

  // ── Calculate match percentage ─────────────────────────────────────────────
  const calculateMatchPercentage = useCallback((output: string, target: string) => {
    if (output === target) return 100
    if (!output || !target) return 0

    const outputWords = output.toLowerCase().split(/\s+/)
    const targetWords = target.toLowerCase().split(/\s+/)

    let matches = 0
    targetWords.forEach(word => {
      if (outputWords.includes(word)) matches++
    })

    return Math.round((matches / targetWords.length) * 100)
  }, [])

  // ── Initialize challenge ───────────────────────────────────────────────────
  const initializeChallenge = useCallback((index: number) => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)

    const challenge = CHALLENGES[index]
    setAvailableTechniques([...challenge.availableTechniques])
    setAppliedTechniques(new Set())
    const initialOutput = challenge.getOutput(new Set())
    setCurrentOutput(initialOutput)
    setDisplayedOutput(initialOutput) // Show output immediately
    setShowHint(false)
    setShowSuccess(false)
    setStars(0)
    setTotalCost(0)
    setChallengeStartTime(Date.now())
    setMatchPercentage(calculateMatchPercentage(initialOutput, challenge.targetOutput))
    setIsGenerating(false)
  }, [calculateMatchPercentage])

  // Initialize on mount and handle challenge index changes
  useEffect(() => {
    initializeChallenge(currentChallengeIndex)
  }, [initializeChallenge, currentChallengeIndex])

  // Cleanup typing animation on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  // ── Apply a technique ──────────────────────────────────────────────────────
  function handleApplyTechnique(technique: TechniqueOption) {
    if (appliedTechniques.has(technique.id)) return
    if (isGenerating) return

    const newApplied = new Set(appliedTechniques)
    newApplied.add(technique.id)
    setAppliedTechniques(newApplied)

    // Remove from available
    setAvailableTechniques(prev => prev.filter(t => t.id !== technique.id))

    // Calculate total cost
    let cost = 0
    newApplied.forEach(id => {
      const tech = currentChallenge.availableTechniques.find(t => t.id === id)
      if (tech) cost += tech.cost
    })
    setTotalCost(cost)

    // Generate new output with animation
    setIsGenerating(true)
    setDisplayedOutput('')

    setTimeout(() => {
      const newOutput = currentChallenge.getOutput(newApplied)
      setCurrentOutput(newOutput)
      setIsGenerating(false)
      setMatchPercentage(calculateMatchPercentage(newOutput, currentChallenge.targetOutput))

      // Typewriter effect
      let charIndex = 0
      const typeNext = () => {
        if (charIndex < newOutput.length) {
          setDisplayedOutput(newOutput.substring(0, charIndex + 1))
          charIndex++
          typingTimerRef.current = setTimeout(typeNext, 10)
        } else {
          // Check if match
          if (newOutput === currentChallenge.targetOutput) {
            // Calculate stars
            const timeBonus = Date.now() - challengeStartTime
            const minCost = currentChallenge.minimumCost
            let earnedStars = 1

            if (cost <= minCost) {
              earnedStars = 3
            } else if (cost <= minCost + 1) {
              earnedStars = 2
            }

            // Time penalty: if took more than 60 seconds, reduce stars
            if (timeBonus > 60000 && earnedStars > 1) {
              earnedStars = Math.max(1, earnedStars - 1)
            }

            setStars(earnedStars)
            handleSuccess(cost, earnedStars)
          }
        }
      }
      typeNext()
    }, 600)
  }

  // ── Remove a technique ─────────────────────────────────────────────────────
  function handleRemoveTechnique(techniqueId: string) {
    if (isGenerating) return

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)

    const newApplied = new Set(appliedTechniques)
    newApplied.delete(techniqueId)
    setAppliedTechniques(newApplied)

    // Add back to available
    const removedTech = currentChallenge.availableTechniques.find(t => t.id === techniqueId)
    if (removedTech) {
      setAvailableTechniques(prev => [...prev, removedTech])
    }

    // Recalculate cost
    let cost = 0
    newApplied.forEach(id => {
      const tech = currentChallenge.availableTechniques.find(t => t.id === id)
      if (tech) cost += tech.cost
    })
    setTotalCost(cost)

    // Regenerate output
    setIsGenerating(true)
    setDisplayedOutput('')
    setMatchPercentage(0)

    setTimeout(() => {
      const newOutput = currentChallenge.getOutput(newApplied)
      setCurrentOutput(newOutput)
      setIsGenerating(false)
      setMatchPercentage(calculateMatchPercentage(newOutput, currentChallenge.targetOutput))

      // Typewriter effect
      let charIndex = 0
      const typeNext = () => {
        if (charIndex < newOutput.length) {
          setDisplayedOutput(newOutput.substring(0, charIndex + 1))
          charIndex++
          typingTimerRef.current = setTimeout(typeNext, 10)
        } else {
          if (newOutput === currentChallenge.targetOutput) {
            const minCost = currentChallenge.minimumCost
            let earnedStars = 1
            if (cost <= minCost) earnedStars = 3
            else if (cost <= minCost + 1) earnedStars = 2
            setStars(earnedStars)
            handleSuccess(cost, earnedStars)
          }
        }
      }
      typeNext()
    }, 600)
  }

  // ── Handle success ─────────────────────────────────────────────────────────
  function handleSuccess(cost: number, earnedStars: number) {
    playCorrect()
    setShowSuccess(true)

    // Calculate score with star bonus
    const baseScore = Math.max(10, 100 - cost * 15)
    const starBonus = earnedStars === 3 ? 50 : earnedStars === 2 ? 25 : 0
    const timeBonus = Math.max(0, Math.floor((60000 - (Date.now() - challengeStartTime)) / 100))
    const challengeScore = baseScore + starBonus + timeBonus
    setScore(prev => prev + challengeScore)

    setTimeout(() => {
      if (currentChallengeIndex < CHALLENGES.length - 1) {
        setCurrentChallengeIndex(prev => prev + 1)
        setPhase('playing')
      } else {
        setPhase('complete')
      }
    }, 3000)
  }

  // ── Skip challenge ─────────────────────────────────────────────────────────
  function handleSkip() {
    playWrong()
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    if (currentChallengeIndex < CHALLENGES.length - 1) {
      setCurrentChallengeIndex(prev => prev + 1)
      setPhase('playing')
    } else {
      setPhase('complete')
    }
  }

  // ── Restart game ───────────────────────────────────────────────────────────
  function handleRestart() {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    setCurrentChallengeIndex(0)
    setScore(0)
    setPhase('intro')
    setAppliedTechniques(new Set())
    setTotalCost(0)
  }

  // ── Start tutorial ─────────────────────────────────────────────────────────
  function handleNextTutorial() {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(prev => prev + 1)
    } else {
      setPhase('intro')
      setTutorialStep(0)
    }
  }

  // ── Build the assembled prompt text ────────────────────────────────────────
  function getAssembledPrompt(): string {
    let prompt = currentChallenge.basePrompt
    appliedTechniques.forEach(id => {
      const tech = currentChallenge.availableTechniques.find(t => t.id === id)
      if (tech) {
        prompt += '\n\n' + tech.promptText
      }
    })
    return prompt
  }

  // ── Calculate optimal cost for current applied techniques ──────────────────
  function getEfficiencyLabel(): { label: string; color: string } {
    const minCost = currentChallenge.minimumCost
    if (totalCost <= minCost) return { label: 'Optimal!', color: 'text-green-600' }
    if (totalCost <= minCost + 1) return { label: 'Good', color: 'text-amber-600' }
    return { label: 'Inefficient', color: 'text-red-600' }
  }

  // ── Render Tutorial ────────────────────────────────────────────────────────
  if (phase === 'tutorial') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 bg-background min-h-screen">
        <Card className="max-w-lg w-full p-6 sm:p-8 shadow-lg">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {TUTORIAL_STEPS[tutorialStep].title}
              </h2>
              <Badge variant="outline">
                {tutorialStep + 1} / {TUTORIAL_STEPS.length}
              </Badge>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-8">
            {TUTORIAL_STEPS[tutorialStep].content}
          </p>

          <div className="flex justify-between">
            {tutorialStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setTutorialStep(prev => prev - 1)}
              >
                ← Back
              </Button>
            )}
            <Button
              onClick={handleNextTutorial}
              className="ml-auto"
            >
              {tutorialStep < TUTORIAL_STEPS.length - 1 ? 'Next' : "Let's Play! →"}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ── Render Game Complete ───────────────────────────────────────────────────
  if (phase === 'complete') {
    const maxScore = CHALLENGES.length * 150 // max possible score
    const percentage = Math.round((score / maxScore) * 100)

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 bg-background min-h-screen">
        <Card className="max-w-lg w-full p-8 shadow-lg text-center">
          <div className="text-5xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-muted-foreground mb-6">
            You've completed all {CHALLENGES.length} prompt sculpting challenges!
          </p>

          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 mb-6 border">
            <div className="text-sm text-muted-foreground mb-2">Total Score</div>
            <div className="text-5xl font-bold text-primary mb-2">{score}</div>
            <div className="text-xs text-muted-foreground">
              ({percentage}% of max score)
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-xs text-muted-foreground">Challenges</div>
              <div className="font-bold">{CHALLENGES.length}</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xs text-muted-foreground">Avg Stars</div>
              <div className="font-bold">{(score / CHALLENGES.length / 50).toFixed(1)}</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-xs text-muted-foreground">Rank</div>
              <div className="font-bold">
                {percentage >= 80 ? 'Expert' : percentage >= 60 ? 'Pro' : percentage >= 40 ? 'Learner' : 'Novice'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onExit}>
              ← Menu
            </Button>
            <Button onClick={handleRestart}>Play Again</Button>
          </div>
        </Card>
      </div>
    )
  }

  const efficiency = getEfficiencyLabel()

  // ── Render Game ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🎨</span>
            <span className="font-semibold hidden sm:inline">Prompt Sculptor</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground hidden sm:inline">Score:</span>
            <span className="font-bold text-primary">{score}</span>
          </div>
          <Badge
            variant="outline"
            className={
              currentChallenge.difficulty === 'Beginner'
                ? 'bg-green-100 text-green-800 border-green-200'
                : currentChallenge.difficulty === 'Intermediate'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-red-100 text-red-800 border-red-200'
            }
          >
            {currentChallenge.difficulty}
          </Badge>
        </div>
      </header>

      {/* Intro overlay */}
      {phase === 'intro' && (
        <div className="absolute inset-0 bg-background/95 z-20 flex items-center justify-center px-4">
          <Card className="max-w-lg w-full p-6 shadow-lg">
            <div className="text-center mb-6">
              <span className="text-5xl mb-4 block">{currentChallenge.emoji}</span>
              <h2 className="text-xl font-bold mb-2">{currentChallenge.title}</h2>
              <p className="text-muted-foreground text-sm mb-4">{currentChallenge.description}</p>
              <Badge variant="secondary" className="mb-4">
                {currentChallenge.conceptLabel}
              </Badge>
            </div>
            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="text-sm font-semibold mb-2">{currentChallenge.targetLabel}</div>
              <div className="text-sm text-muted-foreground font-mono bg-background p-3 rounded border whitespace-pre-wrap max-h-32 overflow-y-auto">
                {currentChallenge.targetOutput}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setPhase('tutorial')}
              >
                📖 Tutorial
              </Button>
              <Button
                onClick={() => setPhase('playing')}
                className="ml-auto"
              >
                Start Challenge →
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Left panel: Challenge info & Techniques */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Challenge header */}
          <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{currentChallenge.emoji}</span>
                  <h3 className="font-bold text-lg">{currentChallenge.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentChallenge.conceptLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentChallengeIndex + 1}/{CHALLENGES.length}
                </Badge>
              </div>
            </div>

            {/* Target output preview */}
            <div className="mt-3 p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🎯</span>
                <span className="text-xs font-semibold text-primary">
                  {currentChallenge.targetLabel}
                </span>
              </div>
              <div className="text-sm font-mono bg-background p-3 rounded border whitespace-pre-wrap max-h-40 overflow-y-auto">
                {currentChallenge.targetOutput}
              </div>
            </div>
          </Card>

          {/* Applied techniques */}
          {appliedTechniques.size > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">Applied Techniques</h4>
                  <span className={`text-xs font-medium ${efficiency.color}`}>
                    ({efficiency.label})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Cost: <span className="font-bold">{totalCost} pts</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (min: {currentChallenge.minimumCost})
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(appliedTechniques).map(id => {
                  const tech = currentChallenge.availableTechniques.find(t => t.id === id)
                  if (!tech) return null
                  return (
                    <Badge
                      key={tech.id}
                      className={`${TECHNIQUE_COLORS[tech.type]} cursor-pointer hover:opacity-80 px-3 py-1.5 flex items-center gap-1.5 transition-all`}
                      onClick={() => handleRemoveTechnique(tech.id)}
                    >
                      {TECHNIQUE_ICONS[tech.type]} {tech.label}
                      <span className="ml-1 text-xs opacity-70 hover:opacity-100">✕</span>
                    </Badge>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Available techniques */}
          <Card className="p-4 flex-1">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <span>🔧</span> Available Techniques
            </h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableTechniques.map(technique => (
                <button
                  key={technique.id}
                  onClick={() => handleApplyTechnique(technique)}
                  disabled={isGenerating}
                  className={`w-full p-3 rounded-lg border text-left transition-all hover:shadow-md active:scale-[0.98] ${
                    TECHNIQUE_COLORS[technique.type]
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{TECHNIQUE_ICONS[technique.type]}</span>
                      <span className="font-medium">{technique.label}</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-background">
                      {technique.cost} pt{technique.cost > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <p className="text-xs mt-1 opacity-80 ml-7">{technique.description}</p>
                </button>
              ))}
            </div>

            {availableTechniques.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">
                  All techniques used.
                </p>
                <p className="text-xs text-muted-foreground">
                  Click on applied techniques above to remove and try different combinations.
                </p>
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowHint(!showHint)}
              className="flex-1"
              disabled={isGenerating}
            >
              💡 {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={isGenerating}
            >
              Skip →
            </Button>
          </div>

          {showHint && (
            <Card className="p-3 bg-amber-50 border-amber-200 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-amber-800">
                💡 <strong>Hint:</strong> {currentChallenge.hint}
              </p>
            </Card>
          )}
        </div>

        {/* Right panel: MockGPT Chat Interface */}
        <div className="flex-1 flex flex-col max-w-xl">
          <Card className="flex-1 flex flex-col overflow-hidden shadow-lg">
            {/* Chat header */}
            <div className="p-3 border-b bg-gradient-to-r from-primary/10 to-transparent flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-sm font-bold shadow">
                M
              </div>
              <div>
                <div className="font-semibold text-sm">mockGPT</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
              {/* System prompt display */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">
                    📝 Assembled Prompt:
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {getAssembledPrompt().length} chars
                  </Badge>
                </div>
                <div className="bg-background p-3 rounded-lg text-sm font-mono whitespace-pre-wrap border shadow-sm">
                  {getAssembledPrompt()}
                </div>
              </div>

              {/* User message (the prompt) */}
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-tr-sm max-w-[85%] text-sm shadow-md">
                  ▶ Run this prompt
                </div>
              </div>

              {/* AI response */}
              <div className="flex justify-start">
                <div
                  ref={outputRef}
                  className={`bg-background p-4 rounded-lg rounded-tl-sm max-w-[85%] text-sm font-mono whitespace-pre-wrap border shadow-sm min-w-[200px] ${
                    isGenerating ? 'ring-2 ring-primary/30' : ''
                  } ${showSuccess ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                >
                  {isGenerating ? (
                    <TypingIndicator />
                  ) : (
                    <>
                      {displayedOutput}
                      {displayedOutput && displayedOutput.length < currentOutput.length && (
                        <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Match percentage bar */}
              {currentOutput && !isGenerating && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Match Quality</span>
                    <span className={`font-bold ${
                      matchPercentage >= 80 ? 'text-green-600' :
                      matchPercentage >= 50 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {matchPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        matchPercentage >= 80 ? 'bg-green-500' :
                        matchPercentage >= 50 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${matchPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Comparison indicator */}
              {currentOutput && !isGenerating && displayedOutput === currentOutput && (
                <div className={`p-3 rounded-lg text-sm text-center font-medium animate-in fade-in ${
                  currentOutput === currentChallenge.targetOutput
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {currentOutput === currentChallenge.targetOutput ? (
                    <span className="flex items-center justify-center gap-2">
                      ✅ Perfect match! The output matches the target exactly.
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      ❌ Not quite. The output doesn't match the target yet.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Success overlay */}
            {showSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
                <Card className="p-8 text-center animate-in fade-in zoom-in shadow-2xl max-w-sm">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold mb-2">Perfect Match!</h3>
                  <div className="flex justify-center mb-4">
                    <StarRating stars={stars} size="lg" />
                  </div>
                  <div className="bg-muted rounded-lg p-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Score</span>
                      <span className="font-bold">{Math.max(10, 100 - totalCost * 15)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Star Bonus</span>
                      <span className="font-bold text-green-600">+{stars === 3 ? 50 : stars === 2 ? 25 : 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time Bonus</span>
                      <span className="font-bold text-blue-600">+{Math.max(0, Math.floor((60000 - (Date.now() - challengeStartTime)) / 100))}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        {Math.max(10, 100 - totalCost * 15) + (stars === 3 ? 50 : stars === 2 ? 25 : 0) + Math.max(0, Math.floor((60000 - (Date.now() - challengeStartTime)) / 100))}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {currentChallengeIndex < CHALLENGES.length - 1
                      ? 'Moving to next challenge...'
                      : "You've completed all challenges!"}
                  </p>
                </Card>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}