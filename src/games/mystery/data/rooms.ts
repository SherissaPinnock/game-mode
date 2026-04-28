export interface Room {
  id: string
  label: string
  icon: string
  zone: { x: number; y: number; w: number; h: number } // % of board
  cx: number  // center x %
  cy: number  // center y %
}

export const ROOMS: Room[] = [
  {
    id: 'bedroom', label: 'Bedroom', icon: '🛏️',
    zone: { x: 2, y: 2, w: 45, h: 29 },
    cx: 22, cy: 15,
  },
  {
    id: 'living', label: 'Living Room', icon: '🪑',
    zone: { x: 2, y: 33, w: 45, h: 30 },
    cx: 22, cy: 47,
  },
  {
    id: 'library', label: 'Library', icon: '📚',
    zone: { x: 2, y: 65, w: 45, h: 34 },
    cx: 22, cy: 80,
  },
  {
    id: 'study', label: 'Study', icon: '🔭',
    zone: { x: 53, y: 2, w: 44, h: 47 },
    cx: 74, cy: 25,
  },
  {
    id: 'kitchen', label: 'Kitchen', icon: '🍳',
    zone: { x: 53, y: 51, w: 44, h: 47 },
    cx: 74, cy: 74,
  },
]
