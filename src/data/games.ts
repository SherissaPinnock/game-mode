import { Target, Network, LayoutGrid, Server, Hammer, Dices, Stethoscope, Pencil, Lightbulb, type LucideIcon } from 'lucide-react'
// LayoutGrid is used by memory-match above

export interface Game {
  id: string
  title: string
  description: string
  icon: LucideIcon
  tag: string
}

export const games: Game[] = [
  {
    id: 'archery-quiz',
    title: 'Archery Quiz',
    description: 'Test your programming knowledge across languages and frameworks. The more you get right, the more chances you get to hit the bullseye.',
    icon: Target,
    tag: 'Knowledge',
  },
  {
    id: 'connections',
    title: 'Tech Connections',
    description: 'Link related programming concepts together to strengthen your understanding. A challenge for the analytical mind.',
    icon: Network,
    tag: 'Deep Thinking',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Flip cards to find matching pairs of code snippets. A fun way to boost your memory and learn new patterns.',
    icon: LayoutGrid,
    tag: 'Memory',
  },
  {
    id: 'scale-or-die',
    title: 'Scale or Die',
    description: 'Make strategic decisions to grow your startup. Will you scale or face the consequences?',
    icon: Server,
    tag: 'Strategy',
  },
  {
    id: 'build-a-startup',
    title: 'Build a Startup',
    description: 'Drag and drop to build your own tech startup. Make smart choices to succeed in the competitive market.',
    icon: Hammer,
    tag: 'Strategy',
  },
  {
    id: 'devops-dynamo',
    title: 'DevOps Diagnostics',
    description: 'Manage your infrastructure and deployments in this fast-paced DevOps simulation.',
    icon: Stethoscope,
    tag: 'Strategy',
  },
  {
    id: 'python-and-ladders',
    title: 'Python & Ladders',
    description: 'Climb the corporate ladder by answering Python questions. Avoid pitfalls and reach the top!',
    icon: Dices,
    tag: 'Knowledge',
  },
  {
    id: 'prompt-sculptor',
    title: 'Prompt Sculptor',
    description: 'Craft the perfect prompt to solve challenges. Test and refine your prompts to achieve the best results.',
    icon: Pencil,
    tag: 'Strategy',
  },
  {
    id: 'clue-game',
    title: 'Clue',
    description: 'Guess the technology based a series of clues. The fewer clues needed the more points',
    icon: Lightbulb,
    tag: 'Knowledge'
  }
]
