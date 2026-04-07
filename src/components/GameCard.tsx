import type { Game } from '@/data/games'

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: '#EBF5FB', text: '#1A6A9A' },
  Intermediate: { bg: '#EAF5EA', text: '#1A6A3A' },
  Advanced:     { bg: '#FDF2F8', text: '#7B1F6A' },
}

const TAG_COLORS: Record<string, string> = {
  Trivia:     '#6C5CE7',
  Matching:   '#00B894',
  Simulation: '#E17055',
}

interface GameCardProps {
  game: Game
  onPlay: (id: string) => void
}

export function GameCard({ game, onPlay }: GameCardProps) {
  const level = LEVEL_COLORS[game.level] ?? LEVEL_COLORS.Beginner
  const tagColor = TAG_COLORS[game.tag] ?? '#888'

  return (
    <div
      onClick={() => onPlay(game.id)}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.15s',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Thumbnail */}
      <div className="game-card-thumb" style={{
        height: 240,
        background: game.thumbnail ? '#f0f0f0' : (game.thumbnailBg ?? '#e0e0e0'),
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}>
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          // Gradient placeholder with icon
          <div style={{
            width: '100%', height: '100%',
            background: game.thumbnailBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <game.icon size={48} color="rgba(255,255,255,0.6)" strokeWidth={1.2} />
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {/* Level badge */}
        <span style={{
          display: 'inline-block',
          alignSelf: 'flex-start',
          padding: '2px 10px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: level.bg,
          color: level.text,
        }}>
          {game.level}
        </span>

        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.35 }}>
          {game.title}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#f0f0f0', margin: '2px 0' }} />

        {/* Footer row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: tagColor,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>{game.tag}</span>
          </div>
          <span style={{ fontSize: 11, color: '#999' }}>▶ Play</span>
        </div>
      </div>
    </div>
  )
}
