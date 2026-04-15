import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Game } from '@/data/games'

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: '#eff6ff', text: '#1d4ed8' },
  Intermediate: { bg: '#f0fdf4', text: '#15803d' },
  Advanced:     { bg: '#fdf4ff', text: '#9333ea' },
}

const TAG_COLORS: Record<string, string> = {
  Trivia:     '#6366f1',
  Matching:   '#0ea5e9',
  Simulation: '#f97316',
}

interface GameCardProps {
  game: Game
  onPlay: (id: string) => void
}

export function GameCard({ game, onPlay }: GameCardProps) {
  const level    = LEVEL_COLORS[game.level] ?? LEVEL_COLORS.Beginner
  const tagColor = TAG_COLORS[game.tag] ?? '#888'

  return (
    <Card
      onClick={() => onPlay(game.id)}
      className="game-card"
    >
      {/* Thumbnail */}
      <div className="game-card-thumb">
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: game.thumbnailBg ?? 'linear-gradient(135deg,#1e1b4b,#312e81)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <game.icon size={36} color="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          </div>
        )}

        {/* Tag pill overlaid on thumbnail */}
        <span
          className="game-card-tag"
          style={{ background: tagColor }}
        >
          {game.tag}
        </span>
      </div>

      {/* Body */}
      <div className="game-card-body">
        <Badge
          className="game-card-level-badge"
          style={{ background: level.bg, color: level.text, border: 'none' }}
        >
          {game.level}
        </Badge>

        <p className="game-card-title">{game.title}</p>

        <div className="game-card-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <game.icon size={12} color="#94a3b8" />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{game.tag}</span>
          </div>
          <span className="game-card-play">▶ Play</span>
        </div>
      </div>
    </Card>
  )
}
