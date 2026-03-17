import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Game } from '@/data/games'

interface GameCardProps {
  game: Game
  onPlay: (id: string) => void
}

export function GameCard({ game, onPlay }: GameCardProps) {
  const Icon = game.icon

  return (
    <Card className="flex-1 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary/40 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Icon className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <Badge variant="secondary">{game.tag}</Badge>
        </div>
        <CardTitle className="mt-3 text-base font-semibold">{game.title}</CardTitle>
        <CardDescription>{game.description}</CardDescription>
      </CardHeader>

      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onPlay(game.id)}
        >
          Play now
        </Button>
      </CardFooter>
    </Card>
  )
}
