import landingIcon from '@/assets/image copy.png'
import { Button } from '@/components/ui/button'

const STATS = [
  { value: '12+', label: 'Games' },
  { value: '5',   label: 'Topics' },
  { value: '3',   label: 'Skill Levels' },
]

interface HeroBannerProps {
  onBrowseGames?: () => void
}

export function HeroBanner({ onBrowseGames }: HeroBannerProps) {
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

          <div className="hero-cta-row">
            <Button size="lg" className="hero-btn-primary" onClick={onBrowseGames}>
              Browse Games
            </Button>
            <a className="hero-link-cta">
              For learners &nbsp;→
            </a>
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
