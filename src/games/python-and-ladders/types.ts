export interface Question {
  id: number
  question: string
  code?: string
  options: string[]
  correctIndex: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface SnakeOrLadder {
  from: number
  to: number
  type: 'snake' | 'ladder'
}

export interface Player {
  id: 'p1' | 'p2'
  name: string
  position: number
  color: string
  emoji: string
}

export type GameMode = 'vs-bot' | 'vs-friend'

export type GamePhase =
  | 'intro'
  | 'question'          // active player answering
  | 'answered-wrong'    // active player got it wrong
  | 'ready-to-roll'     // active player earned a roll
  | 'rolling'           // showing dice result + moving
  | 'sliding'           // snake or ladder animation
  | 'pass-device'       // vs-friend: hand device to next player
  | 'bot-turn'          // vs-bot only: bot thinking
  | 'bot-result'        // vs-bot only: bot result displayed
  | 'finished'

export interface DiceRoll {
  value: number
  timestamp: number
}
