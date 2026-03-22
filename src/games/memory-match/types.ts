export type CardState = 'hidden' | 'flipped' | 'matched'

export interface Card {
  /** Unique instance ID. */
  id: string
  /** Shared by the two cards that form a pair. */
  conceptId: string
  /** Short text shown on the card face. */
  display: string
  /** Whether this card is the concept name or the syntax/answer. */
  role: 'term' | 'match'
  state: CardState
}
