import { useState } from 'react'
import { LandingPage } from '@/components/LandingPage'
import { GamesPage }   from '@/components/GamesPage'
import { ResumeModal } from '@/components/ResumeModal'
import { ArcheryQuiz }       from '@/games/archery-quiz/ArcheryQuiz'
import { TechConnections }   from '@/games/connections/TechConnections'
import { MemoryMatch }       from '@/games/memory-match/MemoryMatch'
import ScaleOrDie            from '@/games/scale-or-die/ScaleOrDie'
import BuildAStartup         from '@/games/build-a-startup/BuildAStartup'
import DevOpsDynamo          from '@/games/devops-dynamo/DevOpsDynamo'
import PythonAndLadders      from '@/games/python-and-ladders/PythonAndLadders'
import { PromptSculptor }    from '@/games/prompt-sculptor/PromptSculptor'
import ClueGame              from '@/games/clue-game/ClueGame'
import EscapeRoom            from '@/games/escape-room/EscapeRoom'
import SudokuGame            from '@/games/sudoku/SudokuGame'
import CheckersGame          from '@/games/checkers/CheckersGame'
import Hackgammon            from '@/games/hackgammon/Hackgammon'
import MahjongGame           from './games/mahjong/MahjongGame'
import ChessClouds           from '@/games/chess-clouds/ChessClouds'
import { loadGame, clearGame } from '@/lib/resume'
import type { SavedGame } from '@/lib/resume'
import './App.css'

const RESUMABLE_GAMES = new Set(['devops-dynamo', 'build-a-startup', 'python-and-ladders'])

const GAME_TITLES: Record<string, string> = {
  'devops-dynamo':      'DevOps Dynamo',
  'build-a-startup':    'Build a Startup',
  'python-and-ladders': 'Python & Ladders',
}

type View = 'landing' | 'games'

function App() {
  const [view,        setView]        = useState<View>('landing')
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

  // ── Active game renders ───────────────────────────────────────────────────
  if (activeGame === 'archery-quiz')       return <ArcheryQuiz      onExit={exitGame} />
  if (activeGame === 'connections')        return <TechConnections  onExit={exitGame} />
  if (activeGame === 'memory-match')       return <MemoryMatch      onExit={exitGame} />
  if (activeGame === 'scale-or-die')       return <ScaleOrDie       onExit={exitGame} />
  if (activeGame === 'build-a-startup')    return <BuildAStartup    onExit={exitGame} resumeState={resumeState} />
  if (activeGame === 'devops-dynamo')      return <DevOpsDynamo     onExit={exitGame} resumeState={resumeState} />
  if (activeGame === 'python-and-ladders') return <PythonAndLadders onExit={exitGame} resumeState={resumeState} />
  if (activeGame === 'prompt-sculptor')    return <PromptSculptor   onExit={exitGame} />
  if (activeGame === 'clue-game')          return <ClueGame         onExit={exitGame} />
  if (activeGame === 'escape-room')        return <EscapeRoom       onExit={exitGame} />
  if (activeGame === 'sudoku')             return <SudokuGame       onExit={exitGame} />
  if (activeGame === 'checkers')           return <CheckersGame     onExit={exitGame} />
  if (activeGame === 'hackgammon')         return <Hackgammon       onExit={exitGame} />
  if (activeGame === 'mahjong')            return <MahjongGame      onExit={exitGame} />
  if (activeGame === 'chess-clouds')       return <ChessClouds      onExit={exitGame} />

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

      {view === 'landing' ? (
        <LandingPage
          onBrowseGames={() => setView('games')}
          onPlay={handlePlayGame}
        />
      ) : (
        <GamesPage
          onPlay={handlePlayGame}
          onBack={() => setView('landing')}
        />
      )}
    </>
  )
}

export default App
