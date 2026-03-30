interface DiceProps {
  value: number | null
  rolling?: boolean
}

const dots: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
}

export function Dice({ value, rolling }: DiceProps) {
  const face = value && value >= 1 && value <= 6 ? value : 1
  const positions = dots[face]

  return (
    <div
      className={`
        w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl border-2 border-slate-300
        shadow-lg p-2 grid grid-cols-3 grid-rows-3 gap-0
        ${rolling ? 'animate-spin' : 'animate-bounce-once'}
      `}
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        const hasDot = positions.some(([r, c]) => r === row && c === col)
        return (
          <div key={i} className="flex items-center justify-center">
            {hasDot && (
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-800" />
            )}
          </div>
        )
      })}
    </div>
  )
}
