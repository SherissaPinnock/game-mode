import { Target, Network, LayoutGrid, Server, Hammer, Dices, Stethoscope, Pencil, Lightbulb, Database, type LucideIcon } from 'lucide-react'

import archeryThumb      from '@/assets/game thumbnails/archery thumbnail.webp'
import connectionsThumb  from '@/assets/game thumbnails/tech-connections-thumbnail.webp'
import devopsThumb       from '@/assets/game thumbnails/devops-diagnostics thumbnail.webp'
import buildStartupThumb from '@/assets/game thumbnails/build-a-start-up thumbnail.webp'
import pythonLaddersThumb from '@/assets/game thumbnails/pythons-and-ladders-thumbnail.webp'
import scaleThumb from '@/assets/game thumbnails/scale-or-die thumbnail.webp'
import clueThumb from '@/assets/game thumbnails/clue thumbnail.webp'
import memoryThumb from '@/assets/game thumbnails/memory_match thumbnail.webp'
import promptThumb from '@/assets/game thumbnails/prompt-sculptor thumbnail.webp'
import checkersThumb from '@/assets/game thumbnails/checkers thumbnail.webp'
import sudokuThumb from '@/assets/game thumbnails/sudoku thumbnail.webp'
import hackgammonThumb from '@/assets/game thumbnails/hackgammon thumbnail.webp'
import chessThumb from '@/assets/game thumbnails/cloud chess.webp'
import mahjongThumb from '@/assets/game thumbnails/mahjong.webp'

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
  {
    id: 'sudoku',
    title: 'Sharp Sudoku',
    description: 'Answer C# questions while mastering Sudoku ',
    icon: Lightbulb,
    tag: 'Trivia',
    level: 'Intermediate',
    thumbnail: sudokuThumb
  },
  {
    id: 'checkers',
    title: 'Git Checkers',
    description: 'Answer git and version control questions while mastering checkers ',
    icon: Lightbulb,
    tag: 'Trivia',
    level: 'Beginner',
    thumbnail: checkersThumb
  },
  {
    id: 'hackgammon',
    title: 'Hackgammon',
    description: 'Race checkers home in a trivia-powered backgammon remix with NestJS and Next.js questions.',
    icon: Dices,
    tag: 'Trivia',
    level: 'Advanced',
    thumbnail: hackgammonThumb,
  },
  {
    id: 'mahjong',
    title: 'Tech Mahjong',
    description: 'Match tiles to clear the board in this tech-themed Mahjong game. Answer questions to earn power-ups and bonuses.',
    icon: LayoutGrid,
    tag: 'Matching',
    level: 'Advanced',
    thumbnail: mahjongThumb,
  },
  {
    id: 'chess-clouds',
    title: 'Chess in the Clouds',
    description: 'A guided chess quest where every capture requires a cloud computing question. 5 missions covering containers, CI/CD, scaling, security and more.',
    icon: Server,
    tag: 'Strategy',
    level: 'Intermediate',
    thumbnail: chessThumb
  },
  {
    id: 'db-quest',
    title: 'DB Quest',
    description: 'A guided journey through database optimisation. Learn normalization, indexing, and CTEs through interactive animations and hands-on challenges.',
    icon: Database,
    tag: 'Simulation',
    level: 'Intermediate',
    thumbnailBg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
  },
]
