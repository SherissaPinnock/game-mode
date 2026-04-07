import { Target, Network, LayoutGrid, Server, Hammer, Dices, Stethoscope, Pencil, Lightbulb, type LucideIcon } from 'lucide-react'

import archeryThumb      from '@/assets/game thumbnails/archery thumbnail.png'
import connectionsThumb  from '@/assets/game thumbnails/tech-connections-thumbnail.png'
import devopsThumb       from '@/assets/game thumbnails/devops-diagnostics thumbnail.png'
import buildStartupThumb from '@/assets/game thumbnails/build-a-start-up thumbnail.png'
import pythonLaddersThumb from '@/assets/game thumbnails/pythons-and-ladders-thumbnail.png'
import scaleThumb from '@/assets/game thumbnails/scale-or-die thumbnail.png'
import clueThumb from '@/assets/game thumbnails/clue thumbnail.png'
import memoryThumb from '@/assets/game thumbnails/memory_match thumbnail.png'
import promptThumb from '@/assets/game thumbnails/prompt-sculptor thumbnail.png'

export interface Game {
  id: string
  title: string
  description: string
  icon: LucideIcon
  tag: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  thumbnail?: string
  thumbnailBg?: string // fallback gradient for games without a thumbnail
}

export const games: Game[] = [
  {
    id: 'archery-quiz',
    title: 'Archery Arena',
    description: 'Test your programming knowledge across languages and frameworks. The more you get right, the more chances you get to hit the bullseye.',
    icon: Target,
    tag: 'Trivia',
    level: 'Beginner',
    thumbnail: archeryThumb,
  },
  {
    id: 'python-and-ladders',
    title: 'Python & Ladders',
    description: 'Climb the corporate ladder by answering Python questions. Avoid pitfalls and reach the top!',
    icon: Dices,
    tag: 'Trivia',
    level: 'Beginner',
    thumbnail: pythonLaddersThumb,
  },
  {
    id: 'connections',
    title: 'Tech Connections',
    description: 'Link related programming concepts together to strengthen your understanding. A challenge for the analytical mind.',
    icon: Network,
    tag: 'Matching',
    level: 'Intermediate',
    thumbnail: connectionsThumb,
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Flip cards to find matching pairs of code snippets. A fun way to boost your memory and learn new patterns.',
    icon: LayoutGrid,
    tag: 'Matching',
    level: 'Beginner',
    thumbnail: memoryThumb,
  },
  {
    id: 'scale-or-die',
    title: 'Scale or Die',
    description: 'Make strategic decisions to scale your startup under pressure. Will you survive the traffic surge?',
    icon: Server,
    tag: 'Simulation',
    level: 'Advanced',
    thumbnail: scaleThumb,
  },
  {
    id: 'prompt-sculptor',
    title: 'Prompt Sculptor',
    description: 'Craft the perfect prompt to solve challenges. Test and refine your prompts to achieve the best results.',
    icon: Pencil,
    tag: 'Simulation',
    level: 'Intermediate',
    thumbnail: promptThumb,
  },
  {
    id: 'build-a-startup',
    title: 'Build a Startup',
    description: 'Drag and drop to build your own tech startup. Make smart choices to succeed in the competitive market.',
    icon: Hammer,
    tag: 'Simulation',
    level: 'Intermediate',
    thumbnail: buildStartupThumb,
  },
  {
    id: 'devops-dynamo',
    title: 'DevOps Diagnostics',
    description: 'Manage your infrastructure and deployments in this fast-paced DevOps simulation.',
    icon: Stethoscope,
    tag: 'Simulation',
    level: 'Advanced',
    thumbnail: devopsThumb,
  },
  {
    id: 'clue-game',
    title: 'Tech Clue',
    description: 'Guess the technology from a series of clues. The fewer clues you need, the more points you score.',
    icon: Lightbulb,
    tag: 'Trivia',
    level: 'Intermediate',
    thumbnail: clueThumb,
  },
]
