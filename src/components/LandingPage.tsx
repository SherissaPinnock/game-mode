import { useState, useEffect } from 'react'
import { fetchGlobalLeaderboard, type GameConfigEntry } from '@/lib/supabaseApi'
import { HeroBanner } from '@/components/HeroBanner'
import { GameCard } from '@/components/GameCard'
import { games } from '@/data/games'
import { Button } from '@/components/ui/button'
import pythonLaddersPreviewThumb from '@/assets/python ladders game.webp'
import pythonPlayGif from '@/assets/python play.gif'
import { FaPython } from "react-icons/fa";
import { FaGitAlt } from "react-icons/fa";
import { FaDocker } from "react-icons/fa";
import { FaAws } from "react-icons/fa";
import { FaCogs } from "react-icons/fa";
import { FaProjectDiagram } from "react-icons/fa";
import { FaRobot } from "react-icons/fa";
import { FaChartBar } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ── Featured games fallback (used when config not yet loaded) ────────────────
const DEFAULT_FEATURED_IDS = ['python-and-ladders', 'checkers', 'memory-match', 'devops-dynamo']
const pythonLaddersGame = games.find(game => game.id === 'python-and-ladders')

const PREVIEW_SLIDES = [
  {
    id: pythonLaddersGame?.id ?? 'python-and-ladders',
    eyebrow: 'Live preview',
    title: pythonLaddersGame?.title ?? 'Python & Ladders',
    description:
      pythonLaddersGame?.description ??
      'Climb the corporate ladder by answering Python questions. Avoid pitfalls and reach the top!',
    thumbnail: pythonLaddersPreviewThumb,
    thumbnailAlt: 'Python & Ladders game thumbnail',
    previewMedia: pythonPlayGif,
    previewAlt: 'Python & Ladders gameplay preview',
  },
]

// ── Tech topics ─────────────────────────────────────────────────────────────
const TOPICS = [
  { icon: <FaPython />, name: 'Python',        desc: 'Variables, loops, OOP, data structures',        games: 1, color: '#fef3c7', accent: '#d97706' },
  { icon: <FaGitAlt />, name: 'Git & GitHub',  desc: 'Branching, merging, pull requests, workflows',  games: 2, color: '#dcfce7', accent: '#16a34a' },
  { icon: <FaDocker />, name: 'Docker',        desc: 'Containers, images, Dockerfiles, networking',    games: 2, color: '#dbeafe', accent: '#2563eb' },
  { icon: <FaAws />, name: 'AWS',           desc: 'EC2, S3, Lambda, load balancing, IAM',          games: 2, color: '#fce7f3', accent: '#db2777' },
  { icon: <FaCogs />, name: 'DevOps',        desc: 'CI/CD pipelines, monitoring, incident response', games: 2, color: '#f3e8ff', accent: '#9333ea' },
  { icon: <FaProjectDiagram />, name: 'System Design', desc: 'Scalability, caching, queues, databases',       games: 3, color: '#e0f2fe', accent: '#0284c7' },
  { icon: <FaRobot />, name: 'AI & Prompting',desc: 'Prompt engineering, LLMs, fine-tuning basics',  games: 1, color: '#fdf4ff', accent: '#a21caf' },
  { icon: <FaChartBar />, name: 'Algorithms',    desc: 'Sorting, graphs, dynamic programming, Big-O',   games: 2, color: '#fff7ed', accent: '#ea580c' },
]

// ── Mock leaderboard ─────────────────────────────────────────────────────────
type LeaderEntry = { rank: number; name: string; avatar: string; score: number; badge: string; games: number }

const INITIAL_BOARD: LeaderEntry[] = [
  { rank: 1,  name: 'Sherissa P.',   avatar: 'SP', score: 14820, badge: '🏆', games: 12 },
  { rank: 2,  name: 'Marcus T.',     avatar: 'MT', score: 13450, badge: '🥈', games: 11 },
  { rank: 3,  name: 'Aisha K.',      avatar: 'AK', score: 12990, badge: '🥉', games: 10 },
  { rank: 4,  name: 'Dev_Riley',     avatar: 'DR', score: 11200, badge: '',   games: 9  },
  { rank: 5,  name: 'CodeNinja99',   avatar: 'CN', score: 10875, badge: '',   games: 8  },
  { rank: 6,  name: 'Priya M.',      avatar: 'PM', score: 9640,  badge: '',   games: 8  },
  { rank: 7,  name: 'js_wizard',     avatar: 'JW', score: 8990,  badge: '',   games: 7  },
  { rank: 8,  name: 'CloudRunner',   avatar: 'CR', score: 8210,  badge: '',   games: 6  },
]

const AVATAR_COLORS = [
  '#4f6ef5', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#f97316',
]

function buildColorMap(entries: LeaderEntry[]): Record<string, string> {
  return Object.fromEntries(
    entries.map((e, i) => [e.name, AVATAR_COLORS[i % AVATAR_COLORS.length]])
  )
}

interface LandingPageProps {
  onBrowseGames: () => void
  onPlay: (id: string) => void
  gameConfig?: Map<string, GameConfigEntry>
}

export function LandingPage({ onBrowseGames, onPlay, gameConfig }: LandingPageProps) {
  const browse = () => { window.scrollTo(0, 0); onBrowseGames() }

  const featuredGames = (() => {
    if (gameConfig && gameConfig.size > 0) {
      const fromConfig = games.filter(g => gameConfig.get(g.id)?.featured)
      if (fromConfig.length > 0) return fromConfig
    }
    return DEFAULT_FEATURED_IDS.map(id => games.find(g => g.id === id)!).filter(Boolean)
  })()

  // ── Leaderboard live animation ──────────────────────────────────────────────
  const [activePreview, setActivePreview] = useState(0)
  const [board, setBoard] = useState<LeaderEntry[]>(() => INITIAL_BOARD.map(e => ({ ...e })))
  const [risingName, setRisingName] = useState<string | null>(null)
  const [avatarColorMap, setAvatarColorMap] = useState<Record<string, string>>(
    () => buildColorMap(INITIAL_BOARD),
  )

  // Fetch live leaderboard from Supabase; fall back to mock data if offline/empty
  useEffect(() => {
    fetchGlobalLeaderboard(8).then(remote => {
      if (remote.length === 0) return
      const mapped: LeaderEntry[] = remote.map((r, i) => ({
        rank:  r.rank,
        name:  r.displayName,
        avatar: r.avatarInitials,
        score: r.totalXp,
        badge: i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '',
        games: r.sessionsPlayed,
      }))
      setBoard(mapped)
      setAvatarColorMap(buildColorMap(mapped))
    })
  }, [])
  const previewCount = PREVIEW_SLIDES.length

  const goToPreview = (index: number) => {
    if (!previewCount) return
    setActivePreview((index + previewCount) % previewCount)
  }

  const showPreviousPreview = () => {
    if (!previewCount) return
    setActivePreview(prev => (prev - 1 + previewCount) % previewCount)
  }

  const showNextPreview = () => {
    if (!previewCount) return
    setActivePreview(prev => (prev + 1) % previewCount)
  }

  useEffect(() => {
    const id = setInterval(() => {
      setBoard(prev => {
        if (prev.length < 2) return prev
        // pick a random slot from index 1–(len-1) to climb one place
        const idx = 1 + Math.floor(Math.random() * (prev.length - 1))
        if (!prev[idx] || !prev[idx - 1]) return prev
        const next = prev.map(e => ({ ...e }))
        // boost the climber's score
        next[idx] = { ...next[idx], score: next[idx].score + Math.floor(Math.random() * 350 + 80) }
        // swap with the entry above
        ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
        // recompute rank + badge
        next.forEach((e, i) => {
          e.rank  = i + 1
          e.badge = i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''
        })
        setRisingName(next[idx - 1].name)
        return next
      })
    }, 3800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!risingName) return
    const t = setTimeout(() => setRisingName(null), 1600)
    return () => clearTimeout(t)
  }, [risingName])
  return (
    <div className="app-shell">

      {/* ── Nav ── */}
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
            <span className="nav-link" onClick={browse}>Games</span>
            <button className="nav-cta" onClick={browse}>Browse Games</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <HeroBanner onBrowseGames={browse} />

      {/* ── Featured games ── */}
      <section className="lp-section lp-featured-section">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <div>
              <p className="lp-eyebrow">Featured</p>
              <h2 className="lp-heading">Popular games this week</h2>
            </div>
            <button className="lp-see-all" onClick={browse}>
              See all games →
            </button>
          </div>

          <div className="lp-featured-grid">
            {featuredGames.map(game => (
              <GameCard key={game.id} game={game} onPlay={onPlay} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Preview carousel ── */}
      <section className="lp-section lp-preview-section">
        <div className="lp-section-inner">
          <div className="lp-preview-nav-wrap" aria-label="Game preview controls">
            <button
              type="button"
              className="lp-preview-nav"
              onClick={showPreviousPreview}
              aria-label="Show previous game preview"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="lp-preview-nav"
              onClick={showNextPreview}
              aria-label="Show next game preview"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div
            className="lp-preview-carousel"
            aria-roledescription="carousel"
            aria-label="Game preview carousel"
          >
            <div
              className="lp-preview-track"
              style={{ transform: `translateX(-${activePreview * 100}%)` }}
            >
              {PREVIEW_SLIDES.map((slide, index) => (
                <article
                  key={slide.id}
                  className="lp-preview-slide"
                  aria-hidden={index !== activePreview}
                >
                  <div className="lp-preview-card">
                    <div className="lp-preview-aside">
                      <div className="lp-preview-copy-block">
                        <p className="lp-preview-eyebrow">{slide.eyebrow}</p>
                        <h3 className="lp-preview-title">{slide.title}</h3>
                        <p className="lp-preview-description">{slide.description}</p>
                      </div>

                      <img
                        src={slide.thumbnail}
                        alt={slide.thumbnailAlt}
                        className="lp-preview-thumbnail"
                      />
                    </div>

                    <div className="lp-preview-stage">
                      <div className="lp-preview-demo-label">Gameplay preview</div>
                      <img
                        src={slide.previewMedia}
                        alt={slide.previewAlt}
                        className="lp-preview-demo-media"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="lp-preview-dots" aria-label="Select game preview">
            {PREVIEW_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`lp-preview-dot ${index === activePreview ? 'is-active' : ''}`}
                onClick={() => goToPreview(index)}
                aria-label={`Show ${slide.title} preview`}
                aria-pressed={index === activePreview}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── What you'll learn ── */}
      <section className="lp-section lp-topics-section">
        <div className="lp-section-inner">
          <div className="lp-section-header lp-section-header-center">
            <p className="lp-eyebrow">Curriculum</p>
            <h2 className="lp-heading">What you'll learn</h2>
            <p className="lp-section-sub">
              Every game is mapped to a real tech skill. Play your way through the
              entire modern dev toolkit.
            </p>
          </div>

          <div className="lp-carousel-outer">
            <div className="lp-carousel-track">
              {[...TOPICS, ...TOPICS].map((topic, i) => (
                <div
                  key={i}
                  className="lp-topic-card lp-topic-card-carousel"
                  style={{ '--topic-accent': topic.accent, '--topic-bg': topic.color } as React.CSSProperties}
                >
                  <div className="lp-topic-icon-wrap" style={{ background: topic.color }}>
                    <span className="lp-topic-icon">{topic.icon}</span>
                  </div>
                  <div className="lp-topic-body">
                    <p className="lp-topic-name">{topic.name}</p>
                    <p className="lp-topic-desc">{topic.desc}</p>
                    <span className="lp-topic-games-count" style={{ color: topic.accent }}>
                      {topic.games} game{topic.games > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Leaderboard ── */}
      <section className="lp-section lp-leaderboard-section">
        <div className="lp-section-inner lp-lb-inner">

          {/* Left: copy */}
          <div className="lp-lb-copy">
            <p className="lp-eyebrow lp-eyebrow-light">Community</p>
            <h2 className="lp-heading lp-heading-light">
              Go up the<br />leaderboard
            </h2>
            <p className="lp-section-sub lp-sub-light">
              Every correct answer earns points. Climb the ranks, unlock badges,
              and prove your tech knowledge against the community.
            </p>
            <Button className="lp-lb-cta" onClick={browse}>
              Start playing →
            </Button>
          </div>

          {/* Right: leaderboard table */}
          <div className="lp-lb-table-wrap">
            <div className="lp-lb-table">
              {/* Header */}
              <div className="lp-lb-header-row">
                <span className="lp-lb-col-rank">Rank</span>
                <span className="lp-lb-col-player">Player</span>
                <span className="lp-lb-col-games">Games</span>
                <span className="lp-lb-col-score">Score</span>
              </div>

              {/* Rows */}
              {board.map(entry => (
                <div
                  key={entry.name}
                  className={`lp-lb-row ${entry.rank <= 3 ? 'lp-lb-row-top' : ''} ${entry.name === risingName ? 'lp-lb-row-rising' : ''}`}
                >
                  <span className="lp-lb-col-rank">
                    {entry.badge
                      ? <span className="lp-lb-badge">{entry.badge}</span>
                      : <span className="lp-lb-rank-num">{entry.rank}</span>
                    }
                  </span>
                  <span className="lp-lb-col-player">
                    <span
                      className="lp-lb-avatar"
                      style={{ background: avatarColorMap[entry.name] }}
                    >
                      {entry.avatar}
                    </span>
                    <span className="lp-lb-name">{entry.name}</span>
                    {entry.name === risingName && (
                      <span className="lp-lb-rising-badge">▲</span>
                    )}
                  </span>
                  <span className="lp-lb-col-games lp-lb-games-val">{entry.games}</span>
                  <span className="lp-lb-col-score lp-lb-score-val">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="nav-logo">
            <div className="nav-logo-icon">A</div>
            <div>
              <div className="nav-logo-sub">Academy</div>
              <div className="nav-logo-title">Game Mode</div>
            </div>
          </div>
          <p className="lp-footer-copy">© 2026 Academy. Learn by playing.</p>
        </div>
      </footer>

    </div>
  )
}
