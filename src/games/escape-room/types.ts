export type Phase = 'intro' | 'setup' | 'initial-roll' | 'playing' | 'game-over'
export type TurnPhase = 'roll' | 'choose-room' | 'in-room' | 'answering' | 'turn-end'

export interface Player {
  id: string
  name: string
  color: string
  position: string  // room id or 'start'
  cluesCollected: string[]  // clue ids
  eliminated: boolean
  initialRoll: number | null
}

export interface RoomDef {
  id: string
  name: string
  color: string
  darkColor: string
  col: number
  row: number
  connections: string[]
  secretPassage?: string
  clueType: 'suspect' | 'device' | 'location'
}

export interface AWSQuestion {
  id: string
  roomId: string
  text: string
  options: string[]
  correctIndex: number
}

export interface Clue {
  id: string
  roomId: string
  type: 'suspect' | 'device' | 'location'
  eliminates: string
  flavorText: string
}

export interface Mystery {
  suspect: string
  device: string
  room: string  // room id
}
