import { useEffect, useState, type ComponentProps } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'

import { LandingPage } from '@/components/LandingPage'
import { GamesPage } from '@/components/GamesPage'
import { ResumeModal } from '@/components/ResumeModal'
import { loadGame, clearGame } from '@/lib/resume'
import type { SavedGame } from '@/lib/resume'
import { ArcheryQuiz } from '@/games/archery-quiz/ArcheryQuiz'
import { TechConnections } from '@/games/connections/TechConnections'
import { MemoryMatch } from '@/games/memory-match/MemoryMatch'
import ScaleOrDie from '@/games/scale-or-die/ScaleOrDie'
import BuildAStartup from '@/games/build-a-startup/BuildAStartup'
import DevOpsDynamo from '@/games/devops-dynamo/DevOpsDynamo'
import PythonAndLadders from '@/games/python-and-ladders/PythonAndLadders'
import { PromptSculptor } from '@/games/prompt-sculptor/PromptSculptor'
import ClueGame from '@/games/clue-game/ClueGame'
import EscapeRoom from '@/games/escape-room/EscapeRoom'
import SudokuGame from '@/games/sudoku/SudokuGame'
import CheckersGame from '@/games/checkers/CheckersGame'
import Hackgammon from '@/games/hackgammon/Hackgammon'
import MahjongGame from '@/games/mahjong/MahjongGame'
import ChessClouds from '@/games/chess-clouds/ChessClouds'
import DbQuest from '@/games/db-quest/DbQuest'
import MysteryGame from '@/games/mystery/MysteryGame'
import './App.css'

const RESUMABLE_GAMES = new Set(['devops-dynamo', 'build-a-startup', 'python-and-ladders'])

const GAME_TITLES: Record<string, string> = {
  'devops-dynamo': 'DevOps Dynamo',
  'build-a-startup': 'Build a Startup',
  'python-and-ladders': 'Python & Ladders',
}

type PendingGame = {
  id: string
  from: string
  saved: SavedGame
}

type GameRouteLocationState = {
  from?: string
  resumeState?: unknown
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function GameRoute() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = (location.state ?? {}) as GameRouteLocationState
  const exitTo = routeState.from ?? '/games'
  const componentKey = `${gameId ?? 'unknown'}:${location.key}`

  const handleExit = () => {
    navigate(exitTo)
  }

  if (!gameId) {
    return <Navigate to="/games" replace />
  }

  if (gameId === 'archery-quiz') {
    return <ArcheryQuiz key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'connections') {
    return <TechConnections key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'memory-match') {
    return <MemoryMatch key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'scale-or-die') {
    return <ScaleOrDie key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'build-a-startup') {
    const resumeState = routeState.resumeState as ComponentProps<typeof BuildAStartup>['resumeState']
    return <BuildAStartup key={componentKey} onExit={handleExit} resumeState={resumeState} />
  }
  if (gameId === 'devops-dynamo') {
    const resumeState = routeState.resumeState as ComponentProps<typeof DevOpsDynamo>['resumeState']
    return <DevOpsDynamo key={componentKey} onExit={handleExit} resumeState={resumeState} />
  }
  if (gameId === 'python-and-ladders') {
    const resumeState = routeState.resumeState as ComponentProps<typeof PythonAndLadders>['resumeState']
    return <PythonAndLadders key={componentKey} onExit={handleExit} resumeState={resumeState} />
  }
  if (gameId === 'prompt-sculptor') {
    return <PromptSculptor key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'clue-game') {
    return <ClueGame key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'escape-room') {
    return <EscapeRoom key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'sudoku') {
    return <SudokuGame key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'checkers') {
    return <CheckersGame key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'hackgammon') {
    return <Hackgammon key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'mahjong') {
    return <MahjongGame key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'chess-clouds') {
    return <ChessClouds key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'db-quest') {
    return <DbQuest key={componentKey} onExit={handleExit} />
  }
  if (gameId === 'mystery') {
    return <MysteryGame key={componentKey} onExit={handleExit} />
  }

  return <Navigate to="/games" replace />
}

function AppRoutes() {
  const navigate = useNavigate()
  const [pendingGame, setPendingGame] = useState<PendingGame | null>(null)

  function handlePlayGame(id: string, from: string) {
    if (RESUMABLE_GAMES.has(id)) {
      const saved = loadGame(id)
      if (saved) {
        setPendingGame({ id, from, saved })
        return
      }
    }

    navigate(`/games/${id}`, { state: { from } satisfies GameRouteLocationState })
  }

  function handleResume() {
    if (!pendingGame) return

    navigate(`/games/${pendingGame.id}`, {
      state: {
        from: pendingGame.from,
        resumeState: pendingGame.saved.state,
      } satisfies GameRouteLocationState,
    })
    setPendingGame(null)
  }

  function handleStartFresh() {
    if (!pendingGame) return

    clearGame(pendingGame.id)
    navigate(`/games/${pendingGame.id}`, {
      state: { from: pendingGame.from } satisfies GameRouteLocationState,
    })
    setPendingGame(null)
  }

  return (
    <>
      {pendingGame && (
        <ResumeModal
          gameTitle={GAME_TITLES[pendingGame.id] ?? pendingGame.id}
          savedGame={pendingGame.saved}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
        />
      )}

      <ScrollToTop />

      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              onBrowseGames={() => navigate('/games')}
              onPlay={(id) => handlePlayGame(id, '/')}
            />
          }
        />
        <Route
          path="/games"
          element={
            <GamesPage
              onPlay={(id) => handlePlayGame(id, '/games')}
              onBack={() => navigate('/')}
            />
          }
        />
        <Route path="/games/:gameId" element={<GameRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return <AppRoutes />
}
