import { useCallback, useRef, useState } from 'react'
import type { GameMode, GamePhase, Tile, Question, GameResult } from '../types'
import { buildDeck, shuffle } from '../data/tiles'
import { pickQuestions } from '../data/questions'
import { isWinningHand, chooseBotDiscard, botAnswersCorrectly, sortTiles } from '../utils'
import { playCorrect, playWrong, playComplete, playGameOver, playClick, playNextLevel } from '@/lib/sounds'
import { usePerformance, computeStats, type PerformanceEntry, type CategoryStats } from '@/lib/performance'

const QUESTIONS_POOL = 50

export function useGameLogic() {
  const [phase,          setPhase]          = useState<GamePhase>('intro')
  const [gameMode,       setGameMode]       = useState<GameMode>('vs-bot')
  const [playerHand,     setPlayerHand]     = useState<Tile[]>([])
  const [botHand,        setBotHand]        = useState<Tile[]>([])
  const [drawPile,       setDrawPile]       = useState<Tile[]>([])
  const [discardPile,    setDiscardPile]    = useState<Tile[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [questionCount,  setQuestionCount]  = useState(0)
  const [correctCount,   setCorrectCount]   = useState(0)
  const [turnsPlayed,    setTurnsPlayed]    = useState(0)
  const [message,        setMessage]        = useState('')
  const [result,         setResult]         = useState<GameResult | null>(null)
  const [lastDrawnUid,   setLastDrawnUid]   = useState<string | null>(null)
  const [sessionStats,   setSessionStats]   = useState<CategoryStats[]>([])

  const perfEntries   = useRef<PerformanceEntry[]>([])
  const questionQueue = useRef<Question[]>([])
  const { report }    = usePerformance()

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const getNextQuestion = useCallback((): Question => {
    if (questionQueue.current.length === 0) {
      questionQueue.current = pickQuestions(QUESTIONS_POOL)
    }
    return questionQueue.current.shift()!
  }, [])

  const finishGame = useCallback((
    winner: 'player' | 'bot' | 'draw',
    qCount: number,
    cCount: number,
    turns: number,
  ) => {
    setResult({ winner, questionCount: qCount, correctCount: cCount, turnsPlayed: turns })
    setPhase('finished')
    setSessionStats(computeStats(perfEntries.current))
    if (winner === 'player') playComplete()
    else if (winner === 'bot') playGameOver()
    else playNextLevel()
    report(perfEntries.current)
  }, [report])

  // ─── Bot turn (receives all mutable state as args to avoid stale closures) ──

  const runBotTurn = useCallback((
    pile: Tile[],
    bHand: Tile[],
    qCount: number,
    cCount: number,
    turns: number,
  ) => {
    setPhase('bot-turn')
    setMessage('🤖 GrafBot is analysing...')

    setTimeout(() => {
      if (!botAnswersCorrectly()) {
        setMessage('🤖 GrafBot got it wrong! Your turn.')
        const next = getNextQuestion()
        setTimeout(() => {
          setCurrentQuestion(next)
          setLastDrawnUid(null)
          setMessage('')
          setPhase('question')
        }, 1500)
        return
      }

      if (pile.length === 0) {
        finishGame('draw', qCount, cCount, turns)
        return
      }

      const [drawn, ...restPile] = pile
      const newHand = [...bHand, drawn]

      if (isWinningHand(newHand)) {
        setBotHand(newHand)
        setDrawPile(restPile)
        setMessage('🤖 GrafBot wins! Tsumo! 🀄')
        setTimeout(() => finishGame('bot', qCount, cCount, turns), 1500)
        return
      }

      const discardIdx = chooseBotDiscard(newHand)
      const discarded  = newHand[discardIdx]
      const afterDiscard = newHand.filter((_, i) => i !== discardIdx).sort(sortTiles)

      setDrawPile(restPile)
      setBotHand(afterDiscard)
      setDiscardPile(dp => [...dp, discarded])
      setMessage(`🤖 GrafBot drew and discarded ${discarded.unicode}`)

      const next = getNextQuestion()
      setTimeout(() => {
        setCurrentQuestion(next)
        setLastDrawnUid(null)
        setMessage('')
        setPhase('question')
      }, 1500)
    }, 1500)
  }, [finishGame, getNextQuestion])

  // ─── Start ────────────────────────────────────────────────────────────────────

  const startGame = useCallback((mode: GameMode) => {
    playClick()
    const deck  = shuffle(buildDeck())
    const pHand = deck.slice(0,  13).sort(sortTiles)
    const bHand = deck.slice(13, 26).sort(sortTiles)
    const pile  = deck.slice(26)

    setGameMode(mode)
    setPlayerHand(pHand)
    setBotHand(bHand)
    setDrawPile(pile)
    setDiscardPile([])
    setQuestionCount(0)
    setCorrectCount(0)
    setTurnsPlayed(0)
    setMessage('')
    setResult(null)
    setLastDrawnUid(null)
    setSessionStats([])
    perfEntries.current   = []
    questionQueue.current = pickQuestions(QUESTIONS_POOL)

    const first = questionQueue.current.shift()!
    setCurrentQuestion(first)
    setPhase('question')
  }, [])

  // ─── Player answers ──────────────────────────────────────────────────────────

  const handleAnswer = useCallback((selectedIndex: number, currentDrawPile: Tile[], currentPlayerHand: Tile[], currentBotHand: Tile[]) => {
    if (!currentQuestion || phase !== 'question') return

    const correct     = selectedIndex === currentQuestion.correctIndex
    const newQCount   = questionCount + 1
    const newCCount   = correct ? correctCount + 1 : correctCount

    setQuestionCount(newQCount)
    if (correct) setCorrectCount(newCCount)

    perfEntries.current.push({
      category: 'devops',
      correct,
      gameId: 'mahjong',
      timestamp: Date.now(),
    })

    if (correct) {
      playCorrect()

      if (currentDrawPile.length === 0) {
        finishGame('draw', newQCount, newCCount, turnsPlayed)
        return
      }

      const [drawn, ...restPile] = currentDrawPile
      const newHand = [...currentPlayerHand, drawn].sort(sortTiles)

      setDrawPile(restPile)
      setPlayerHand(newHand)
      setLastDrawnUid(drawn.uid)

      if (isWinningHand(newHand)) {
        setMessage('🀄 Tsumo! You completed your hand!')
        playNextLevel()
        setTimeout(() => finishGame('player', newQCount, newCCount, turnsPlayed + 1), 1500)
      } else {
        setMessage('Correct! Now discard a tile.')
        setPhase('must-discard')
      }
    } else {
      playWrong()
      setMessage('Wrong! Your turn is skipped.')
      setPhase('wrong-answer')

      if (gameMode === 'solo') {
        setTimeout(() => {
          const next = getNextQuestion()
          setCurrentQuestion(next)
          setLastDrawnUid(null)
          setMessage('')
          setTurnsPlayed(t => t + 1)
          setPhase('question')
        }, 1800)
      } else {
        setTimeout(() => {
          runBotTurn(currentDrawPile, currentBotHand, newQCount, newCCount, turnsPlayed + 1)
        }, 1800)
      }
    }
  }, [phase, currentQuestion, questionCount, correctCount, turnsPlayed, gameMode, finishGame, getNextQuestion, runBotTurn])

  // ─── Player discards ──────────────────────────────────────────────────────────

  const handleDiscard = useCallback((tileUid: string, currentDrawPile: Tile[], currentBotHand: Tile[]) => {
    if (phase !== 'must-discard') return

    playClick()
    const discarded = playerHand.find(t => t.uid === tileUid)
    if (!discarded) return

    const newHand   = playerHand.filter(t => t.uid !== tileUid).sort(sortTiles)
    const newTurns  = turnsPlayed + 1

    setPlayerHand(newHand)
    setDiscardPile(dp => [...dp, discarded])
    setLastDrawnUid(null)
    setTurnsPlayed(newTurns)

    if (gameMode === 'solo') {
      const next = getNextQuestion()
      setCurrentQuestion(next)
      setMessage('')
      setPhase('question')
    } else {
      runBotTurn(currentDrawPile, currentBotHand, questionCount, correctCount, newTurns)
    }
  }, [phase, playerHand, turnsPlayed, gameMode, questionCount, correctCount, getNextQuestion, runBotTurn])

  // ─── Reset ────────────────────────────────────────────────────────────────────

  const resetGame = useCallback(() => {
    playClick()
    setPhase('intro')
    setPlayerHand([])
    setBotHand([])
    setDrawPile([])
    setDiscardPile([])
    setCurrentQuestion(null)
    setQuestionCount(0)
    setCorrectCount(0)
    setTurnsPlayed(0)
    setMessage('')
    setResult(null)
    setLastDrawnUid(null)
    setSessionStats([])
    perfEntries.current   = []
    questionQueue.current = []
  }, [])

  return {
    phase, gameMode, playerHand, botHand, drawPile, discardPile,
    currentQuestion, questionCount, correctCount, turnsPlayed,
    message, result, lastDrawnUid, sessionStats,
    startGame, handleAnswer, handleDiscard, resetGame,
  }
}
