import landingIcon from '@/assets/landing page icon copy.webp'
import { Button } from '@/components/ui/button'
import { games } from '@/data/games'

const STATS = [
  { value: '12+', label: 'Games' },
  { value: '5',   label: 'Topics' },
  { value: '3',   label: 'Skill Levels' },
]

const HERO_PILLS = ['Play-based lessons', 'Real tech workflows', 'Beginner to advanced']
const MOBILE_SPOTLIGHT_IDS = ['mystery', 'game-boy', 'db-quest']
const MOBILE_SPOTLIGHT_GAMES = MOBILE_SPOTLIGHT_IDS
  .map(id => games.find(game => game.id === id))
  .filter((game): game is (typeof games)[number] => Boolean(game))

interface HeroBannerProps {
  onBrowseGames?: () => void
  onPlay?: (id: string) => void
}

export function HeroBanner({ onBrowseGames, onPlay }: HeroBannerProps) {
  return (
    <div className="hero-banner">
      <div className="hero-inner">

        {/* ── Content side (left) ── */}
        <div className="hero-content">
          <h1 className="hero-heading">
            Learn tech by<br />
            <span className="hero-heading-accent">playing games</span>
            {' '}you actually enjoy.
          </h1>

          <p className="hero-sub">
            Master programming, DevOps, system design, and more through
            12+ interactive games built for the modern tech learner.
          </p>

          <div className="hero-pill-row" aria-label="Learning experience highlights">
            {HERO_PILLS.map((pill) => (
              <span key={pill} className="hero-pill">{pill}</span>
            ))}
          </div>

          <div className="hero-cta-row">
            <Button size="lg" className="hero-btn-primary" onClick={onBrowseGames}>
              Browse Games
            </Button>
            <button type="button" className="hero-link-cta" onClick={onBrowseGames}>
              See featured picks &nbsp;→
            </button>
          </div>

          <div className="hero-mobile-spotlight" aria-label="Featured mobile picks">
            <div className="hero-mobile-spotlight-header">
              <div>
                <p className="hero-mobile-spotlight-eyebrow">Popular now</p>
                <p className="hero-mobile-spotlight-sub">Swipe through quick picks</p>
              </div>
              <span className="hero-mobile-spotlight-badge">3 picks</span>
            </div>

            <div className="hero-mobile-spotlight-strip">
              {MOBILE_SPOTLIGHT_GAMES.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  className="hero-mobile-game-card"
                  onClick={() => onPlay ? onPlay(game.id) : onBrowseGames?.()}
                >
                  <div className="hero-mobile-game-thumb">
                    {game.thumbnail ? (
                      <img src={game.thumbnail} alt={game.title} />
                    ) : (
                      <div className="hero-mobile-game-fallback">
                        <game.icon size={20} strokeWidth={1.8} />
                      </div>
                    )}
                  </div>

                  <div className="hero-mobile-game-copy">
                    <span className="hero-mobile-game-tag">{game.tag}</span>
                    <span className="hero-mobile-game-title">{game.title}</span>
                    <span className="hero-mobile-game-meta">{game.level}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="hero-stats">
            {STATS.map(({ value, label }, i) => (
              <div key={label} className="hero-stat">
                {i > 0 && <div className="hero-stat-divider" />}
                <span className="hero-stat-value">{value}</span>
                <span className="hero-stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Video side (right) ── */}
        <div className="hero-image-wrap">
          <div className="hero-ring" />
          <div className="hero-ring hero-ring-inner" />
          <img
            src={landingIcon}
            alt="Game Mode"
            className="hero-img"
          />
        </div>

      </div>
    </div>
  )
}
