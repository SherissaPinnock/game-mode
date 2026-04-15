import type { Tile, Suit } from '../types'

// Unicode mahjong tile characters
const CHAR = ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏']  // 1-9 Characters (Man)
const BAMB = ['🀐','🀑','🀒','🀓','🀔','🀕','🀖','🀗','🀘']  // 1-9 Bamboo (Sou)
const CIRC = ['🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡']  // 1-9 Circles (Pin)
const WIND = ['🀀','🀁','🀂','🀃']                            // East, South, West, North
const DRAG = ['🀄','🀅','🀆']                                 // Red (中), Green (發), White (白)

export const WIND_NAMES = ['East', 'South', 'West', 'North']
export const DRAG_NAMES = ['Red Dragon', 'Green Dragon', 'White Dragon']

export function buildDeck(): Tile[] {
  const tiles: Tile[] = []

  const add = (suit: Suit, value: number, unicode: string) => {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ uid: `${suit}-${value}-${copy}`, suit, value, unicode })
    }
  }

  for (let v = 1; v <= 9; v++) add('characters', v, CHAR[v - 1])
  for (let v = 1; v <= 9; v++) add('bamboo',     v, BAMB[v - 1])
  for (let v = 1; v <= 9; v++) add('circles',    v, CIRC[v - 1])
  for (let v = 1; v <= 4; v++) add('winds',      v, WIND[v - 1])
  for (let v = 1; v <= 3; v++) add('dragons',    v, DRAG[v - 1])

  return tiles  // 136 tiles total
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
