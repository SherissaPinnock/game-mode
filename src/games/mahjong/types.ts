export type Suit = 'characters' | 'circles' | 'bamboo' | 'winds' | 'dragons'

export interface Tile {
  uid: string      // unique instance id e.g. 'characters-3-2'
  suit: Suit
  value: number    // 1-9 for suited; 1-4 winds (E/S/W/N); 1-3 dragons (Red/Green/White)
  unicode: string
}

export interface Question {
  id: number
  question: string
  options: string[]
  correctIndex: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export type GameMode = 'vs-bot' | 'solo'

export type GamePhase =
  | 'intro'
  | 'question'       // player must answer to draw
  | 'must-discard'   // player drew (14 tiles), pick one to discard
  | 'wrong-answer'   // brief pause before bot/next
  | 'bot-turn'       // bot animating
  | 'finished'

export interface GameResult {
  winner: 'player' | 'bot' | 'draw'
  questionCount: number
  correctCount: number
  turnsPlayed: number
}
