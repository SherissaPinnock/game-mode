import { useState } from 'react'
import { games } from '@/data/games'
import { GameCard } from '@/components/GameCard'
import { Badge } from '@/components/ui/badge'
import { ArcheryQuiz }      from '@/games/archery-quiz/ArcheryQuiz'
import { TechConnections }   from '@/games/connections/TechConnections'
import { MemoryMatch }       from '@/games/memory-match/MemoryMatch'
import ScaleOrDie            from '@/games/scale-or-die/ScaleOrDie'
import BuildAStartup         from '@/games/build-a-startup/BuildAStartup'
import DevOpsDynamo          from '@/games/devops-dynamo/DevOpsDynamo'
import PythonAndLadders      from '@/games/python-and-ladders/PythonAndLadders'
import './App.css'

function App() {
  const [activeGame, setActiveGame] = useState<string | null>(null)

  if (activeGame === 'archery-quiz')    return <ArcheryQuiz     onExit={() => setActiveGame(null)} />
  if (activeGame === 'connections')     return <TechConnections onExit={() => setActiveGame(null)} />
  if (activeGame === 'memory-match')    return <MemoryMatch     onExit={() => setActiveGame(null)} />
  if (activeGame === 'scale-or-die')    return <ScaleOrDie      onExit={() => setActiveGame(null)} />
  if (activeGame === 'build-a-startup') return <BuildAStartup   onExit={() => setActiveGame(null)} />
  if (activeGame === 'devops-dynamo')   return <DevOpsDynamo    onExit={() => setActiveGame(null)} />
  if (activeGame === 'python-and-ladders') return <PythonAndLadders onExit={() => setActiveGame(null)} />

  return (
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
          <GameCard key={game.id} game={game} onPlay={setActiveGame} />
        ))}
      </div>
    </main>
  )
}

export default App
