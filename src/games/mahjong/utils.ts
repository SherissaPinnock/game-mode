import type { Tile } from './types'

// ─── Sorting ──────────────────────────────────────────────────────────────────

const SUIT_ORDER = { characters: 0, circles: 1, bamboo: 2, winds: 3, dragons: 4 }

export function sortTiles(a: Tile, b: Tile): number {
  const sd = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
  if (sd !== 0) return sd
  return a.value - b.value
}

function sameTile(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.value === b.value
}

// ─── Win detection ────────────────────────────────────────────────────────────

function canFormMelds(tiles: Tile[]): boolean {
  if (tiles.length === 0) return true
  const sorted = [...tiles].sort(sortTiles)
  const first = sorted[0]

  // Try triplet
  if (
    sorted.length >= 3 &&
    sameTile(sorted[0], sorted[1]) &&
    sameTile(sorted[1], sorted[2])
  ) {
    if (canFormMelds(sorted.slice(3))) return true
  }

  // Try sequence (suited only, not honors)
  if (['characters', 'circles', 'bamboo'].includes(first.suit)) {
    const suit = first.suit
    const v = first.value
    const idx2 = sorted.findIndex((t, i) => i > 0 && t.suit === suit && t.value === v + 1)
    if (idx2 !== -1) {
      const idx3 = sorted.findIndex((t, i) => i > idx2 && t.suit === suit && t.value === v + 2)
      if (idx3 !== -1) {
        const rest = sorted.filter((_, i) => i !== 0 && i !== idx2 && i !== idx3)
        if (canFormMelds(rest)) return true
      }
    }
  }

  return false
}

// Standard winning hand: 4 melds + 1 pair (14 tiles)
export function isWinningHand(hand: Tile[]): boolean {
  if (hand.length !== 14) return false
  const sorted = [...hand].sort(sortTiles)

  const tried = new Set<string>()
  for (let i = 0; i < sorted.length - 1; i++) {
    const key = `${sorted[i].suit}-${sorted[i].value}`
    if (tried.has(key)) continue
    tried.add(key)
    if (sameTile(sorted[i], sorted[i + 1])) {
      const rest = sorted.filter((_, idx) => idx !== i && idx !== i + 1)
      if (canFormMelds(rest)) return true
    }
  }
  return false
}

// ─── Bot helpers ──────────────────────────────────────────────────────────────

export function botAnswersCorrectly(): boolean {
  return Math.random() < 0.55
}

// Discard the tile that looks most isolated (not near any pair/sequence)
export function chooseBotDiscard(hand: Tile[]): number {
  // Count how many tiles of the same suit/value exist
  const grouped: Record<string, number> = {}
  for (const t of hand) {
    const k = `${t.suit}-${t.value}`
    grouped[k] = (grouped[k] ?? 0) + 1
  }

  // Score each tile: higher = more isolated (discard first)
  let worstIdx = 0
  let worstScore = -Infinity

  hand.forEach((t, i) => {
    const count = grouped[`${t.suit}-${t.value}`] ?? 1
    // Honor tiles (winds/dragons) can't form sequences
    const isHonor = t.suit === 'winds' || t.suit === 'dragons'
    // Check adjacency for sequences
    const hasLeft  = hand.some(x => x.suit === t.suit && x.value === t.value - 1)
    const hasRight = hand.some(x => x.suit === t.suit && x.value === t.value + 1)
    const seqPotential = (!isHonor && (hasLeft || hasRight)) ? 1 : 0

    // Lower count + no sequence adjacency = more isolated
    const score = (1 / count) - seqPotential * 0.5 + (isHonor ? 0.2 : 0)
    if (score > worstScore) { worstScore = score; worstIdx = i }
  })

  return worstIdx
}
