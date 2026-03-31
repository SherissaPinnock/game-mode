import { useState } from 'react'
import { games } from '@/data/games'
import { GameCard } from '@/components/GameCard'
import { Badge } from '@/components/ui/badge'
import { ResumeModal } from '@/components/ResumeModal'
import { ArcheryQuiz }       from '@/games/archery-quiz/ArcheryQuiz'
import { TechConnections }   from '@/games/connections/TechConnections'
import { MemoryMatch }       from '@/games/memory-match/MemoryMatch'
import ScaleOrDie            from '@/games/scale-or-die/ScaleOrDie'
import BuildAStartup         from '@/games/build-a-startup/BuildAStartup'
import DevOpsDynamo          from '@/games/devops-dynamo/DevOpsDynamo'
import PythonAndLadders      from '@/games/python-and-ladders/PythonAndLadders'
import { loadGame, clearGame } from '@/lib/resume'
import type { SavedGame } from '@/lib/resume'
import './App.css'

const RESUMABLE_GAMES = new Set(['devops-dynamo', 'build-a-startup', 'python-and-ladders'])

const GAME_TITLES: Record<string, string> = {
  'devops-dynamo':      'DevOps Dynamo',
  'build-a-startup':    'Build a Startup',
  'python-and-ladders': 'Python & Ladders',
}

function App() {
  const [activeGame,  setActiveGame]  = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resumeState, setResumeState] = useState<any>(null)
  const [pendingGame, setPendingGame] = useState<{ id: string; saved: SavedGame } | null>(null)

  function handlePlayGame(id: string) {
    if (RESUMABLE_GAMES.has(id)) {
      const saved = loadGame(id)
      if (saved) { setPendingGame({ id, saved }); return }
    }
    setActiveGame(id)
  }

  function handleResume() {
    if (!pendingGame) return
    setResumeState(pendingGame.saved.state)
    setActiveGame(pendingGame.id)
    setPendingGame(null)
  }

  function handleStartFresh() {
    if (!pendingGame) return
    clearGame(pendingGame.id)
    setResumeState(null)
    setActiveGame(pendingGame.id)
    setPendingGame(null)
  }

  function exitGame() {
    setActiveGame(null)
    setResumeState(null)
  }

  if (activeGame === 'archery-quiz')       return <ArcheryQuiz     onExit={exitGame} />
  if (activeGame === 'connections')        return <TechConnections onExit={exitGame} />
  if (activeGame === 'memory-match')       return <MemoryMatch     onExit={exitGame} />
  if (activeGame === 'scale-or-die')       return <ScaleOrDie      onExit={exitGame} />
  if (activeGame === 'build-a-startup')    return <BuildAStartup   onExit={exitGame} resumeState={resumeState} />
  if (activeGame === 'devops-dynamo')      return <DevOpsDynamo    onExit={exitGame} resumeState={resumeState} />
  if (activeGame === 'python-and-ladders') return <PythonAndLadders onExit={exitGame} resumeState={resumeState} />

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

      <main className="flex flex-1 flex-col items-center px-8 py-10 sm:px-12 lg:px-16 sm:py-16">
        <Badge variant="outline" className="mb-6 rounded-full px-4 py-1 text-sm">
          Level up your dev skills
        </Badge>

        <h1 className="text-center">Game Mode</h1>

        <p className="mb-8 sm:mb-16 max-w-md text-center text-base text-muted-foreground">
          Pick a challenge and start learning through play. Each game is designed to sharpen a different engineering skill.
        </p>

        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
          ))}
        </div>
      </main>
    </>
  )
}

export default App
