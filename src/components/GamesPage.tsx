import { useState } from 'react'
import { games } from '@/data/games'
import { GameCard } from '@/components/GameCard'

interface GamesPageProps {
  onPlay: (id: string) => void
  onBack: () => void
}

function FilterGroup({
  title, items, selected, onToggle,
}: {
  title: string
  items: string[]
  selected: string[]
  onToggle: (item: string) => void
}) {
  return (
    <div className="filter-group">
      <p className="filter-group-title">{title}</p>
      <div className="filter-group-list">
        {items.map(item => {
          const active = selected.includes(item)
          return (
            <label key={item} className="filter-item" onClick={() => onToggle(item)}>
              <div className={`filter-checkbox ${active ? 'filter-checkbox-active' : ''}`}>
                {active && <span className="filter-check">✓</span>}
              </div>
              <span className="filter-label">{item}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export function GamesPage({ onPlay, onBack }: GamesPageProps) {
  const [search,         setSearch]         = useState('')
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedTags,   setSelectedTags]   = useState<string[]>([])

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
    <div className="app-shell">

      {/* Nav */}
      <nav className="top-nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <div className="nav-logo-icon">A</div>
            <div>
              <div className="nav-logo-sub">Academy</div>
              <div className="nav-logo-title">Game Mode</div>
            </div>
          </div>
          <div className="nav-right">
            <button className="nav-link nav-back-btn" onClick={() => { window.scrollTo(0, 0); onBack() }}>← Home</button>
          </div>
        </div>
      </nav>

      {/* Games section */}
      <div className="games-section">
        <div className="games-section-inner">
        <div className="games-section-header">
          <div>
            <p className="games-section-eyebrow">Explore</p>
            <h2 className="games-section-title">All Games</h2>
          </div>
          <div className="games-search-wrap">
            <span className="games-search-icon">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search games…"
              className="games-search-input"
            />
          </div>
        </div>

        <div className="games-body">
          {/* Sidebar */}
          <aside className="games-sidebar">
            <FilterGroup title="Difficulty" items={allLevels} selected={selectedLevels} onToggle={toggleLevel} />
            <FilterGroup title="Category"   items={allTags}   selected={selectedTags}   onToggle={toggleTag} />
          </aside>

          {/* Mobile chips */}
          <div className="games-chips">
            {[...allLevels, ...allTags].map(item => {
              const isLevel  = allLevels.includes(item)
              const isActive = isLevel ? selectedLevels.includes(item) : selectedTags.includes(item)
              return (
                <button
                  key={item}
                  onClick={() => isLevel ? toggleLevel(item) : toggleTag(item)}
                  className={`chip ${isActive ? 'chip-active' : ''}`}
                >
                  {item}
                </button>
              )
            })}
          </div>

          {/* Card grid */}
          <div className="games-cards">
            {filtered.length === 0 ? (
              <div className="games-empty">No games match your filters.</div>
            ) : (
              <div className="games-grid">
                {filtered.map(game => (
                  <GameCard key={game.id} game={game} onPlay={onPlay} />
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

    </div>
  )
}
