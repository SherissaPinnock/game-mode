import char1Src from '@/assets/mystery/ashford.webp'
import char2Src from '@/assets/mystery/lady wren.webp'
import char3Src from '@/assets/mystery/cook 2.webp'

export interface Suspect {
  id: string
  name: string
  src: string         // walking sprite sheet (4 frames)
  spawnRoomId: string // room to spawn in at game start
  initialDelay: number // ms before first move
  // ── Future fields ─────────────────────────────────────────────
  // portraitSrc?: string          // bust for interview screen
  // alibi?: string                // claim about their whereabouts
  // clues?: string[]              // clues found when interviewing
  // interviewQuestions?: Question[]
}

export const SUSPECTS: Suspect[] = [
  {
    id: 'ashford',
    name: 'Colonel Ashford',
    src: char1Src,
    spawnRoomId: 'bedroom',
    initialDelay: 800,
  },
  {
    id: 'wren',
    name: 'Lady Wren',
    src: char2Src,
    spawnRoomId: 'study',
    initialDelay: 1600,
  },
  {
    id: 'bramble',
    name: 'Mrs. Bramble',
    src: char3Src,
    spawnRoomId: 'kitchen',
    initialDelay: 400,
  },
]
