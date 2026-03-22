/** How accurately the arrow hit the target. */
export type HitZone = 'bullseye' | 'inner' | 'middle' | 'outer' | 'miss'

export interface Question {
  id: number
  question: string
  options: string[]
  /** Index into options[] that is correct. */
  correctIndex: number
}

export interface ArrowShot {
  arrowIndex: number  // which turn (0-based)
  power: number       // 0–100; 50 = dead centre of the power bar
  zone: HitZone
  score: number       // points earned for this arrow
  canvasX: number     // pixel x on the 300×300 target canvas
  canvasY: number     // pixel y on the 300×300 target canvas
}
