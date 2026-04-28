export interface Clue {
  id: string
  title: string
  summary: string       // shown in panel
  detail: string        // shown on expand
  roomId: string
  suspectId?: string
  icon: string
}

export const CLUES: Record<string, Clue> = {
  'kitchen-records': {
    id: 'kitchen-records',
    title: 'Kitchen Records',
    summary: 'Mrs. Bramble was absent from the kitchen for nearly 3 hours on the night of the murder.',
    detail:
      'Her cooking log shows a gap from 7:31 PM to 10:15 PM — almost three hours unaccounted for. ' +
      'She also purchased "Rodent Control Compound" that same morning. A private note reads: ' +
      '"Must speak with A. tonight. The usual place." — Who is A.?',
    roomId: 'kitchen',
    suspectId: 'bramble',
    icon: '📜',
  },
  'library-cipher': {
    id: 'library-cipher',
    title: 'The Cipher Letter',
    summary: 'A coded letter hidden inside a hollowed book, addressed to no one — but signed with a serpent seal.',
    detail:
      'Retrieved from the Library. The cipher, once decoded, references a debt Lord Blackwood was ' +
      'refusing to forgive. The serpent seal matches a ring worn by Colonel Ashford.',
    roomId: 'library',
    icon: '🔐',
  },
  'ashford-confession': {
    id: 'ashford-confession',
    title: "Ashford's Contradiction",
    summary: "Ashford claims he retired early — but his pocket watch was found stopped at 9:47 PM in the Study.",
    detail:
      'When confronted with the watch, Ashford admits he visited the Study that evening but insists ' +
      'Lord Blackwood was alive when he left. He refuses to say why he was there.',
    roomId: 'bedroom',
    suspectId: 'ashford',
    icon: '⌚',
  },
  'wren-poison': {
    id: 'wren-poison',
    title: "Lady Wren's Vial",
    summary: 'An empty perfume vial behind the fireplace — but the residue is not perfume.',
    detail:
      'Chemical analysis (per Dr. Hollis\'s notes) identifies the residue as aconitine — ' +
      'a fast-acting poison detectable only within hours of death. Lady Wren\'s initials are engraved on the cap.',
    roomId: 'bedroom',
    suspectId: 'wren',
    icon: '🧪',
  },
}

// Which clue unlocks which room
export const CLUE_UNLOCKS: Record<string, string> = {
  'kitchen-records':    'library',
  'library-cipher':     'bedroom',
  'wren-poison':        'living',
}

// Rooms that require ALL major clues
export const ALL_CLUES_UNLOCK = 'study'
export const MAIN_CLUE_IDS = ['kitchen-records', 'library-cipher', 'wren-poison']
