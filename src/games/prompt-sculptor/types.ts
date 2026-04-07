export type TechniqueType = 'role' | 'examples' | 'constraints' | 'format' | 'cot'
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type GamePhase = 'tutorial' | 'intro' | 'playing' | 'success' | 'complete'

export interface TechniqueOption {
  id: string
  type: TechniqueType
  label: string
  description: string
  promptText: string  // what gets shown in the assembled prompt
  cost: number        // complexity points
}

export interface Challenge {
  id: string
  title: string
  emoji: string
  difficulty: Difficulty
  conceptLabel: string   // e.g. "Format Constraints"
  description: string
  basePrompt: string     // the unchangeable core broken prompt
  targetOutput: string
  targetLabel: string    // e.g. "Target: Strict JSON"
  availableTechniques: TechniqueOption[]
  minimumCost: number    // fewest pts needed to solve
  getOutput: (appliedIds: Set<string>) => string
  hint: string
}
