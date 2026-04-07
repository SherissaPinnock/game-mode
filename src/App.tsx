import { useState } from 'react'
import { games } from '@/data/games'
import { GameCard } from '@/components/GameCard'
import { ResumeModal } from '@/components/ResumeModal'
import { ArcheryQuiz }       from '@/games/archery-quiz/ArcheryQuiz'
import { TechConnections }   from '@/games/connections/TechConnections'
import { MemoryMatch }       from '@/games/memory-match/MemoryMatch'
import ScaleOrDie            from '@/games/scale-or-die/ScaleOrDie'
import BuildAStartup         from '@/games/build-a-startup/BuildAStartup'
import DevOpsDynamo          from '@/games/devops-dynamo/DevOpsDynamo'
import PythonAndLadders      from '@/games/python-and-ladders/PythonAndLadders'
import { PromptSculptor }    from '@/games/prompt-sculptor/PromptSculptor'
import ClueGame             from '@/games/clue-game/ClueGame'
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
  const [activeGame,     setActiveGame]     = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resumeState,    setResumeState]    = useState<any>(null)
  const [pendingGame,    setPendingGame]    = useState<{ id: string; saved: SavedGame } | null>(null)
  const [search,         setSearch]         = useState('')
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedTags,   setSelectedTags]   = useState<string[]>([])

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
  if (activeGame === 'prompt-sculptor')    return <PromptSculptor  onExit={exitGame} />
  if (activeGame === 'clue-game')          return <ClueGame         onExit={exitGame} />

  const allLevels = ['Beginner', 'Intermediate', 'Advanced']
  const allTags   = [...new Set(games.map(g => g.tag))]

  function toggleLevel(l: string) {
    setSelectedLevels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
  }
  function toggleTag(t: string) {
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const filtered = games.filter(g => {
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase()) ||
                        g.description.toLowerCase().includes(search.toLowerCase())
    const matchLevel  = selectedLevels.length === 0 || selectedLevels.includes(g.level)
    const matchTag    = selectedTags.length === 0   || selectedTags.includes(g.tag)
    return matchSearch && matchLevel && matchTag
  })


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

      <div style={{ minHeight: '100vh', background: '#F0F2F5', fontFamily: 'system-ui, sans-serif' }}>
        {/* ── Top nav ── */}
        <div className="home-nav" style={{
          background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: '#1a1a2e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 15,
            }}>G</div>
            <div>
              <div style={{ fontSize: 10, color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Academy</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>Game Mode</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#666', display: 'flex', gap: 24 }}>
            <span style={{ fontWeight: 700, color: '#1a1a2e' }}>Home</span>
            <span>Games</span>
          </div>
        </div>

        {/* ── Page header ── */}
        <div className="home-header">
          <div style={{ fontSize: 12, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Explore</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Games</h1>
        </div>

        {/* ── Search ── */}
        <div className="home-search">
          <div style={{
            background: '#fff',
            borderRadius: 10,
            border: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            padding: '10px 16px',
            gap: 10,
          }}>
            <span style={{ color: '#aaa', fontSize: 16 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="What do you want to play?"
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 14, color: '#333', background: 'transparent',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* ── Body: sidebar + cards ── */}
        <div className="home-body">

          {/* Sidebar (desktop) */}
          <div className="home-sidebar">
            {/* Levels */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Levels</span>
                <span style={{ fontSize: 14, color: '#aaa' }}>∧</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allLevels.map(level => (
                  <label key={level} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => toggleLevel(level)}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                      border: `2px solid ${selectedLevels.includes(level) ? '#1a1a2e' : '#ccc'}`,
                      background: selectedLevels.includes(level) ? '#1a1a2e' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {selectedLevels.includes(level) && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: '#333' }}>{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Collections */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Collections</span>
                <span style={{ fontSize: 14, color: '#aaa' }}>∧</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allTags.map(tag => (
                  <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => toggleTag(tag)}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                      border: `2px solid ${selectedTags.includes(tag) ? '#1a1a2e' : '#ccc'}`,
                      background: selectedTags.includes(tag) ? '#1a1a2e' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {selectedTags.includes(tag) && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: '#333' }}>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Chip filters (mobile only) */}
          <div className="home-chips">
            {[...allLevels, ...allTags].map(item => {
              const isLevel   = allLevels.includes(item)
              const isActive  = isLevel ? selectedLevels.includes(item) : selectedTags.includes(item)
              return (
                <button
                  key={item}
                  onClick={() => isLevel ? toggleLevel(item) : toggleTag(item)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: `2px solid ${isActive ? '#1a1a2e' : '#ddd'}`,
                    background: isActive ? '#1a1a2e' : '#fff',
                    color: isActive ? '#fff' : '#555',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {item}
                </button>
              )
            })}
          </div>

          {/* Card grid */}
          <div className="home-cards">
            {filtered.length === 0 ? (
              <div style={{ color: '#999', fontSize: 14, paddingTop: 40, textAlign: 'center' }}>
                No games match your filters.
              </div>
            ) : (
              <div className="home-card-grid">
                {filtered.map(game => (
                  <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
