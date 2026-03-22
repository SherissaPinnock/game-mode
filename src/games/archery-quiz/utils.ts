import type { HitZone } from './types'

/** The target canvas is 300×300 with its centre at (150, 150). */
export const TARGET_SIZE = 300
export const TARGET_CENTER = TARGET_SIZE / 2  // 150

/**
 * Pixel-radius bands on the target for each hit zone.
 * [minRadius, maxRadius] — arrow lands at a random angle within the band.
 */
const ZONE_RADII: Record<HitZone, [number, number]> = {
  bullseye: [0,   22],
  inner:    [24,  48],
  middle:   [50,  74],
  outer:    [76, 100],
  miss:     [112, 128], // outer edge of the visible canvas
}

/**
 * Maps a power-bar value (0–100, centre = 50) to a hit zone and score.
 * The further the needle is from centre, the worse the shot.
 */
export function getZoneFromPower(power: number): { zone: HitZone; score: number } {
  const dist = Math.abs(power - 50)
  if (dist <= 5)  return { zone: 'bullseye', score: 10 }
  if (dist <= 13) return { zone: 'inner',    score: 8  }
  if (dist <= 22) return { zone: 'middle',   score: 5  }
  if (dist <= 33) return { zone: 'outer',    score: 2  }
  return                  { zone: 'miss',    score: 0  }
}

/**
 * Returns a random pixel position inside the correct ring for a given zone.
 * Used to place arrow art on the TargetCanvas.
 */
export function calculateHitPosition(zone: HitZone): { canvasX: number; canvasY: number } {
  const [minR, maxR] = ZONE_RADII[zone]
  const angle  = Math.random() * 2 * Math.PI
  const radius = minR + Math.random() * (maxR - minR)
  return {
    canvasX: TARGET_CENTER + Math.cos(angle) * radius,
    canvasY: TARGET_CENTER + Math.sin(angle) * radius,
  }
}

/** Display metadata for each zone — label, emoji, and hex colour. */
export const ZONE_META: Record<HitZone, { label: string; emoji: string; color: string }> = {
  bullseye: { label: 'BULLSEYE!',   emoji: '🎯', color: '#b45309' },
  inner:    { label: 'Inner Ring',  emoji: '🔴', color: '#dc2626' },
  middle:   { label: 'Middle Ring', emoji: '🔵', color: '#2563eb' },
  outer:    { label: 'Outer Ring',  emoji: '⚪', color: '#6b7280' },
  miss:     { label: 'Miss!',       emoji: '💨', color: '#9ca3af' },
}
