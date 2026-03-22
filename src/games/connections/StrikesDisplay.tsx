interface StrikesDisplayProps {
  mistakes: number
  maxMistakes: number
}

/**
 * Shows remaining guesses as filled/empty dots.
 * Dot turns solid when a mistake is made.
 */
export function StrikesDisplay({ mistakes, maxMistakes }: StrikesDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">Mistakes remaining:</span>
      {Array.from({ length: maxMistakes }, (_, i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-full border-2 border-foreground transition-colors duration-300"
          style={{
            backgroundColor: i < maxMistakes - mistakes ? 'var(--foreground)' : 'transparent',
          }}
        />
      ))}
    </div>
  )
}
