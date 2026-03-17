import { games } from './data/games'
import { GameCard } from './components/GameCard'
import './App.css'

function App() {
  function handlePlay(id: string) {
    console.log(`Starting game: ${id}`)
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="mb-10 rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-1.5 text-sm font-medium text-[var(--accent)]">
        Level up your dev skills
      </div>

      <h1 className="text-center">Game Mode</h1>

      <p className="mb-16 max-w-md text-center text-base text-[var(--text)]">
        Pick a challenge and start learning through play. Each game is designed to sharpen a different engineering skill.
      </p>

      <div className="grid w-full max-w-4xl grid-cols-3 gap-4" style={{ textAlign: 'left' }}>
        {games.map((game) => (
          <GameCard key={game.id} game={game} onPlay={handlePlay} />
        ))}
      </div>
    </main>
  )
}

export default App
