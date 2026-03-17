import { Brain, Bug, Keyboard, type LucideIcon } from 'lucide-react'

export interface Game {
  id: string
  title: string
  description: string
  icon: LucideIcon
  tag: string
}

export const games: Game[] = [
  {
    id: 'code-quiz',
    title: 'Code Quiz',
    description: 'Test your programming knowledge across languages and frameworks with rapid-fire multiple choice questions.',
    icon: Brain,
    tag: 'Knowledge',
  },
  {
    id: 'bug-hunt',
    title: 'Bug Hunt',
    description: 'Spot and squash bugs hidden in real code snippets before the timer runs out. Sharp eyes only.',
    icon: Bug,
    tag: 'Debugging',
  },
  {
    id: 'type-race',
    title: 'Type Race',
    description: 'Race against the clock typing out code as fast and accurately as you can. Build muscle memory for syntax.',
    icon: Keyboard,
    tag: 'Speed',
  },
]
