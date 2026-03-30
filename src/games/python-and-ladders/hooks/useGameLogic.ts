import { useCallback, useRef, useState } from 'react'
import type { GameMode, GamePhase, Player, Question, DiceRoll, SnakeOrLadder } from '../types'
import { getSnakeOrLadder } from '../data/board'
import { pickQuestions } from '../data/questions'
import { rollDice, botAnswersCorrectly, clampPosition, hasWon } from '../utils'
import { playCorrect, playWrong, playComplete, playNextLevel, playGameOver, playClick } from '@/lib/sounds'
import { usePerformance, computeStats, type PerformanceEntry, type CategoryStats } from '@/lib/performance'

const TOTAL_QUESTIONS = 40

function makePlayers(mode: GameMode, friendName: string): Player[] {
  return [
    { id: 'p1', name: 'You', position: 0, color: '#3B82F6', emoji: '🧑‍💻' },
    mode === 'vs-friend'
      ? { id: 'p2', name: friendName || 'Player 2', position: 0, color: '#F97316', emoji: '🧑‍🎤' }
      : { id: 'p2', name: 'PyBot', position: 0, color: '#F97316', emoji: '🤖' },
  ]
}

export function useGameLogic() {
  const [phase, setPhase] = useState<GamePhase>('intro')
  const [gameMode, setGameMode] = useState<GameMode>('vs-bot')
  const [players, setPlayers] = useState<Player[]>(makePlayers('vs-bot', ''))
  const [activePlayer, setActivePlayer] = useState<'p1' | 'p2'>('p1')
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [, setQuestionQueue] = useState<Question[]>([])
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null)
  const [activeSlide, setActiveSlide] = useState<SnakeOrLadder | null>(null)
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null)
  const [message, setMessage] = useState('')
  const [questionCount, setQuestionCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionStats, setSessionStats] = useState<CategoryStats[]>([])

  const perfEntries = useRef<PerformanceEntry[]>([])
  const { report } = usePerformance()

  const p1 = players.find(p => p.id === 'p1')!
  const p2 = players.find(p => p.id === 'p2')!
  const active = players.find(p => p.id === activePlayer)!
  const inactive = players.find(p => p.id !== activePlayer)!

  // ─── Helpers ──────────────────────────────────────────────────────────

  const movePlayer = useCallback((id: 'p1' | 'p2', newPos: number) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, position: newPos } : p))
  }, [])

  const nextQuestion = useCallback(() => {
    setQuestionQueue(prev => {
      let queue = prev
      if (queue.length === 0) queue = pickQuestions(TOTAL_QUESTIONS)
      const [next, ...rest] = queue
      setCurrentQuestion(next)
      return rest
    })
  }, [])

  // ─── Start game ──────────────────────────────────────────────────────

  const startGame = useCallback((mode: GameMode, friendName: string) => {
    const newPlayers = makePlayers(mode, friendName)
    setGameMode(mode)
    setPlayers(newPlayers)
    setActivePlayer('p1')
    setWinner(null)
    setLastRoll(null)
    setActiveSlide(null)
    setMessage('')
    setQuestionCount(0)
    setCorrectCount(0)
    setSessionStats([])
    perfEntries.current = []

    const q = pickQuestions(TOTAL_QUESTIONS)
    const [first, ...rest] = q
    setCurrentQuestion(first)
    setQuestionQueue(rest)
    setPhase('question')
  }, [])

  // ─── Shared: handle active player answering ──────────────────────────

  const handleAnswer = useCallback((selectedIndex: number) => {
    if (!currentQuestion || phase !== 'question') return

    const correct = selectedIndex === currentQuestion.correctIndex
    setQuestionCount(c => c + 1)
    if (correct) setCorrectCount(c => c + 1)

    perfEntries.current.push({
      category: 'python',
      correct,
      gameId: 'python-and-ladders',
      timestamp: Date.now(),
    })

    if (correct) {
      playCorrect()
      setMessage('Correct! Roll the dice!')
      setPhase('ready-to-roll')
    } else {
      playWrong()
      setMessage(`Wrong! No move this turn.`)
      setPhase('answered-wrong')
      setTimeout(() => handleEndOfTurn(activePlayer), 2000)
    }
  }, [currentQuestion, phase, activePlayer])

  // ─── Shared: handle roll ─────────────────────────────────────────────

  const handleRoll = useCallback(() => {
    if (phase !== 'ready-to-roll') return
    playClick()

    const dice = rollDice()
    setLastRoll({ value: dice, timestamp: Date.now() })
    setPhase('rolling')

    const who = activePlayer
    const currentPos = players.find(p => p.id === who)!.position
    const newPos = clampPosition(currentPos, dice)
    setMessage(`Rolled a ${dice}!`)

    setTimeout(() => {
      movePlayer(who, newPos)
      setMessage(`Moved to cell ${newPos}`)

      const slide = getSnakeOrLadder(newPos)
      if (slide) {
        setTimeout(() => {
          setActiveSlide(slide)
          setPhase('sliding')
          if (slide.type === 'ladder') {
            setMessage(`🪜 Ladder! Climb from ${slide.from} to ${slide.to}!`)
            playNextLevel()
          } else {
            setMessage(`🐍 Snake! Slide from ${slide.from} to ${slide.to}!`)
            playWrong()
          }
          setTimeout(() => {
            movePlayer(who, slide.to)
            setActiveSlide(null)
            if (hasWon(slide.to)) {
              finishGame(who)
            } else {
              setTimeout(() => handleEndOfTurn(who), 1500)
            }
          }, 1500)
        }, 800)
      } else if (hasWon(newPos)) {
        finishGame(who)
      } else {
        setTimeout(() => handleEndOfTurn(who), 1500)
      }
    }, 1000)
  }, [phase, players, activePlayer, movePlayer])

  // ─── End of turn: hand off to next player ────────────────────────────

  const handleEndOfTurn = useCallback((justPlayed: 'p1' | 'p2') => {
    const next: 'p1' | 'p2' = justPlayed === 'p1' ? 'p2' : 'p1'

    setActivePlayer(next)
    setLastRoll(null)
    setActiveSlide(null)
    setMessage('')

    if (gameMode === 'vs-friend') {
      // Show pass-device screen so next player can take the device privately
      setPhase('pass-device')
    } else {
      // vs-bot: run automated bot turn
      startBotTurn()
    }
  }, [gameMode])

  // ─── Called when player taps "I'm ready" on pass-device screen ───────

  const handlePassReady = useCallback(() => {
    nextQuestion()
    setPhase('question')
  }, [nextQuestion])

  // ─── Bot turn (vs-bot only) ──────────────────────────────────────────

  const startBotTurn = useCallback(() => {
    setPhase('bot-turn')
    setLastRoll(null)
    setActiveSlide(null)
    setMessage('🤖 PyBot is answering...')

    const botCorrect = botAnswersCorrectly()

    setTimeout(() => {
      if (botCorrect) {
        const dice = rollDice()
        setLastRoll({ value: dice, timestamp: Date.now() })

        setPlayers(prev => {
          const bot = prev.find(p => p.id === 'p2')!
          const newPos = clampPosition(bot.position, dice)
          setMessage(`🤖 PyBot answered correctly and rolled a ${dice}!`)
          setPhase('bot-result')

          const slide = getSnakeOrLadder(newPos)
          if (slide) {
            setTimeout(() => {
              setActiveSlide(slide)
              setMessage(slide.type === 'ladder'
                ? `🤖 PyBot hit a ladder! ${slide.from} → ${slide.to}`
                : `🤖 PyBot hit a snake! ${slide.from} → ${slide.to}`)
              setTimeout(() => {
                movePlayer('p2', slide.to)
                setActiveSlide(null)
                if (hasWon(slide.to)) {
                  finishGame('p2')
                } else {
                  setTimeout(() => goToP1Question(), 2500)
                }
              }, 1800)
            }, 1500)
            return prev.map(p => p.id === 'p2' ? { ...p, position: newPos } : p)
          }

          if (hasWon(newPos)) {
            setTimeout(() => finishGame('p2'), 1500)
          } else {
            setTimeout(() => goToP1Question(), 2500)
          }
          return prev.map(p => p.id === 'p2' ? { ...p, position: newPos } : p)
        })
      } else {
        setMessage('🤖 PyBot got it wrong! No move.')
        setLastRoll(null)
        setPhase('bot-result')
        setTimeout(() => goToP1Question(), 2500)
      }
    }, 1500)
  }, [movePlayer])

  const goToP1Question = useCallback(() => {
    setActivePlayer('p1')
    nextQuestion()
    setActiveSlide(null)
    setLastRoll(null)
    setMessage('')
    setPhase('question')
  }, [nextQuestion])

  // ─── Finish game ─────────────────────────────────────────────────────

  const finishGame = useCallback((w: 'p1' | 'p2') => {
    setWinner(w)
    setPhase('finished')
    setSessionStats(computeStats(perfEntries.current))
    if (w === 'p1') {
      playComplete()
    } else {
      playGameOver()
    }
    report(perfEntries.current)
  }, [report])

  // ─── Reset ──────────────────────────────────────────────────────────

  const resetGame = useCallback(() => {
    playClick()
    setPhase('intro')
    setPlayers(makePlayers('vs-bot', ''))
    setGameMode('vs-bot')
    setActivePlayer('p1')
    setCurrentQuestion(null)
    setQuestionQueue([])
    setLastRoll(null)
    setActiveSlide(null)
    setWinner(null)
    setMessage('')
    setQuestionCount(0)
    setCorrectCount(0)
    setSessionStats([])
    perfEntries.current = []
  }, [])

  return {
    phase,
    gameMode,
    players,
    p1,
    p2,
    active,
    inactive,
    activePlayer,
    currentQuestion,
    lastRoll,
    activeSlide,
    winner,
    message,
    questionCount,
    correctCount,
    sessionStats,
    startGame,
    handleAnswer,
    handleRoll,
    handlePassReady,
    resetGame,
  }
}
