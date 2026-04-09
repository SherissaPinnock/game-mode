import type { Mystery, Clue } from '../types'

export const SUSPECTS = ['Prof. Byte', 'Lady Ada', 'Colonel Code', 'Miss Script'] as const
export const DEVICES  = ['Laptop', 'Smart Watch', 'USB Drive', 'Raspberry Pi'] as const

// The 4 rooms that can be the mystery room
export const MYSTERY_ROOM_IDS = ['study', 'library', 'billiard-room', 'kitchen'] as const

export const MYSTERY_ROOM_NAMES: Record<string, string> = {
  study:          'Study',
  library:        'Library',
  'billiard-room': 'Billiard Room',
  kitchen:        'Kitchen',
}

// Rooms that provide each clue type (matches rooms.ts clueType assignments)
const SUSPECT_ROOMS  = ['study', 'library', 'gallery']     // clueType: suspect
const DEVICE_ROOMS   = ['hall', 'billiard-room', 'ballroom'] // clueType: device
const LOCATION_ROOMS = ['living-room', 'dining-room', 'kitchen'] // clueType: location

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const SUSPECT_TEMPLATES = [
  (name: string) =>
    `Witnesses report that ${name} was seen arguing loudly just before the lockdown — but the culprit slipped away unnoticed.`,
  (name: string) =>
    `A smudged name tag reading "${name}" was found near the control panel — but it doesn't match the hacker's profile.`,
  (name: string) =>
    `Security footage confirms ${name} has a solid alibi. They couldn't have triggered the breach.`,
]

const DEVICE_TEMPLATES = [
  (name: string) =>
    `Forensic analysis of the network logs rules out a ${name} as the intrusion vector.`,
  (name: string) =>
    `A ${name} was recovered from a guest room, but its serial number doesn't match the attack signature.`,
  (name: string) =>
    `The IT specialist confirms: a ${name} lacks the capability for this type of hack.`,
]

const LOCATION_TEMPLATES = [
  (roomName: string) =>
    `Access logs for the ${roomName} show no unauthorized connections during the incident window.`,
  (roomName: string) =>
    `The mansion's Wi-Fi dead zone in the ${roomName} makes it an unlikely staging ground for the hack.`,
  (roomName: string) =>
    `A thorough search of the ${roomName} turned up nothing suspicious — the hacker wasn't there.`,
]

export function generateMysteryAndClues(): { mystery: Mystery; clues: Clue[] } {
  // Pick the mystery
  const mystery: Mystery = {
    suspect: pickRandom(SUSPECTS),
    device:  pickRandom(DEVICES),
    room:    pickRandom(MYSTERY_ROOM_IDS),
  }

  const clues: Clue[] = []

  // Suspect clues — 3 clues, each eliminates one non-answer suspect
  const nonAnswerSuspects = shuffle(SUSPECTS.filter(s => s !== mystery.suspect))
  SUSPECT_ROOMS.forEach((roomId, i) => {
    const template = SUSPECT_TEMPLATES[i % SUSPECT_TEMPLATES.length]
    clues.push({
      id:          `clue-suspect-${i}`,
      roomId,
      type:        'suspect',
      eliminates:  nonAnswerSuspects[i],
      flavorText:  template(nonAnswerSuspects[i]),
    })
  })

  // Device clues — 3 clues, each eliminates one non-answer device
  const nonAnswerDevices = shuffle(DEVICES.filter(d => d !== mystery.device))
  DEVICE_ROOMS.forEach((roomId, i) => {
    const template = DEVICE_TEMPLATES[i % DEVICE_TEMPLATES.length]
    clues.push({
      id:          `clue-device-${i}`,
      roomId,
      type:        'device',
      eliminates:  nonAnswerDevices[i],
      flavorText:  template(nonAnswerDevices[i]),
    })
  })

  // Location clues — 3 clues, each eliminates one non-answer mystery room
  const nonAnswerRooms = shuffle(MYSTERY_ROOM_IDS.filter(r => r !== mystery.room))
  LOCATION_ROOMS.forEach((roomId, i) => {
    const template = LOCATION_TEMPLATES[i % LOCATION_TEMPLATES.length]
    const eliminatedRoomName = MYSTERY_ROOM_NAMES[nonAnswerRooms[i]]
    clues.push({
      id:          `clue-location-${i}`,
      roomId,
      type:        'location',
      eliminates:  nonAnswerRooms[i],
      flavorText:  template(eliminatedRoomName),
    })
  })

  return { mystery, clues }
}
