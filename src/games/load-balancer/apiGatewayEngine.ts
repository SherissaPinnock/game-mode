export type GatewayEndpointId = 1 | 2 | 3 | 4

export type ApiGatewayPhase = 'playing' | 'won' | 'lost'

export type TicketStatus = 'unchecked' | 'valid' | 'expired'

export type RequestFormat = 'json' | 'binary'

export type RequestKind = 'normal' | 'spam' | 'vip-crasher'

export type GatewaySublevel = 1 | 2 | 3

export interface GatewayTicket {
  key: string
  issuedAtMs: number
  expiresAtMs: number
  issuedLabel: string
  expiresLabel: string
}

export interface GatewayPayload {
  format: RequestFormat
  displayLines: string[]
  translatedPreview: string
}

export interface GatewayRequest {
  id: number
  alias: string
  portraitIndex: number
  sourceIp: string
  kind: RequestKind
  prompt: string
  answer: GatewayEndpointId
  ticket: GatewayTicket
  ticketStatus: TicketStatus
  payload: GatewayPayload
  translated: boolean
  queueTimeMs: number
  isVipListed: boolean
}

export interface SpamWaveState {
  sourceIp: string
  remaining: number
  cadenceMs: number
  cooldownMs: number
}

export interface GatewayLevelConfig {
  sublevel: GatewaySublevel
  goalCount: number
  goalReputation: number
  durationMs: number
  expiredRate: number
  binaryRate: number
  maxSpamWaves: number
  includesVip: boolean
  endpointIds: GatewayEndpointId[]
  vipListSize: number
  vipCrasherRate: number
  spawnBaseMs: number
  title: string
  description: string
}

export const LEVEL_CONFIGS: Record<GatewaySublevel, GatewayLevelConfig> = {
  1: {
    sublevel: 1,
    goalCount: 5,
    goalReputation: 70,
    durationMs: 90_000,
    expiredRate: 0.3,
    binaryRate: 0,
    maxSpamWaves: 0,
    includesVip: false,
    endpointIds: [1, 2, 3],
    vipListSize: 0,
    vipCrasherRate: 0,
    spawnBaseMs: 7_500,
    title: 'Night Shift Basics',
    description: 'Route each guest and watch those expiry dates. Handle 5 correct.',
  },
  2: {
    sublevel: 2,
    goalCount: 7,
    goalReputation: 65,
    durationMs: 80_000,
    expiredRate: 0.42,
    binaryRate: 0.38,
    maxSpamWaves: 1,
    includesVip: false,
    endpointIds: [1, 2, 3],
    vipListSize: 0,
    vipCrasherRate: 0,
    spawnBaseMs: 6_200,
    title: 'Binary Protocol Night',
    description: 'Expired keys and binary payloads incoming. 80 seconds. Handle 7 correct.',
  },
  3: {
    sublevel: 3,
    goalCount: 10,
    goalReputation: 55,
    durationMs: 150_000,
    expiredRate: 0.28,
    binaryRate: 0.45,
    maxSpamWaves: 2,
    includesVip: true,
    endpointIds: [1, 2, 3, 4],
    vipListSize: 5,
    vipCrasherRate: 0.18,
    spawnBaseMs: 5_500,
    title: 'VIP Access',
    description: 'The velvet rope is open. Check the guest list before routing anyone to /vip.',
  },
}

export interface ApiGatewayState {
  phase: ApiGatewayPhase
  sublevel: GatewaySublevel
  timeLeftMs: number
  reputation: number
  breaches: number
  handledCount: number
  correctCount: number
  rejectedCount: number
  goalCount: number
  goalReputation: number
  includesVip: boolean
  vipGuestList: string[]
  blockedIp: string | null
  nextId: number
  nextSpawnMs: number
  nextSpamWaveMs: number
  queueWarningCooldownMs: number
  spamWavesTriggered: number
  spamWave: SpamWaveState | null
  queue: GatewayRequest[]
}

export type ApiGatewayEvent =
  | { type: 'validate'; status: Exclude<TicketStatus, 'unchecked'> }
  | { type: 'translate' }
  | { type: 'route-ok'; target: GatewayEndpointId }
  | { type: 'route-wrong'; target: GatewayEndpointId }
  | { type: 'reject'; correct: boolean }
  | { type: 'breach'; reason: 'unvalidated' | 'expired' | 'untranslated' }
  | { type: 'spam-start'; ip: string }
  | { type: 'spam-blocked'; ip: string; blockedCount: number }
  | { type: 'queue-warning'; backlog: number }
  | { type: 'vip-crasher'; alias: string }
  | { type: 'win' }
  | { type: 'lose'; reason: 'breaches' | 'reputation' | 'timeout' }

export interface GatewayUpdateResult {
  state: ApiGatewayState
  events: ApiGatewayEvent[]
}

const INITIAL_REPUTATION = 100
const QUEUE_SAFE_SIZE = 6
const QUEUE_WARNING_COOLDOWN_MS = 6_000
const MAX_SPAM_WAVES = 2
const SPAM_REQUESTS_PER_WAVE = 7
const SPAM_CADENCE_MS = 280

export interface GatewayEndpointDefinition {
  path: string
  label: string
  summary: string
  requests: string[]
  payloads: string[]
}

const REQUEST_NAMES = [
  'Mina',
  'Jules',
  'Kade',
  'Nova',
  'Rin',
  'Zuri',
  'Niko',
  'Asha',
  'Remy',
  'Ivy',
  'Dax',
  'Lena',
  'Milo',
  'Skye',
  'Tess',
]

const VIP_CRASHER_REQUESTS = [
  'I heard VIP is free tonight, my name should be there.',
  'I am definitely on the list, just check under my name.',
  'They told me VIP — I came all the way across town.',
  'Look, I know someone. Just let me through.',
  'I am basically VIP, can you just wave me in?',
]

export const GATEWAY_ENDPOINTS: Record<GatewayEndpointId, GatewayEndpointDefinition> = {
  1: {
    path: '/arcade',
    label: 'Arcade',
    summary: 'Games, cabinets, and leaderboard traffic',
    requests: [
      'I need the arcade, the claw machine owes me a win.',
      'Point me to the games floor.',
      'I came here to beat somebody at air hockey.',
      'I just want tokens and neon cabinets.',
    ],
    payloads: [
      '{"mode":"versus","tokens":24,"cabinet":"galaga"}',
      '{"leaderboard":"nightly","game":"pinball","credits":2}',
      '{"wristband":"player","station":"rhythm","queue":1}',
    ],
  },
  2: {
    path: '/bar',
    label: 'Bar',
    summary: 'Drink orders, tabs, and lounge service',
    requests: [
      'I just need a drink before the set starts.',
      'Can someone route me to the bar?',
      'I need a cold soda and a place to lean.',
      'Where do I cash in for a mocktail around here?',
    ],
    payloads: [
      '{"tab":"open","drink":"ginger_ale","glass":"tall"}',
      '{"order":"mocktail","garnish":"lime","ice":"light"}',
      '{"service":"lounge","seat":"stool","refill":true}',
    ],
  },
  3: {
    path: '/dancefloor',
    label: 'Dance Floor',
    summary: 'Music, movement, and main floor access',
    requests: [
      'I gotta show my moves right now.',
      'Send me where the beat is loudest.',
      'I came here for the dancefloor and the strobe lights.',
      'Please tell me the route to the main floor.',
    ],
    payloads: [
      '{"track":"house","zone":"main_floor","strobe":true}',
      '{"tempo":"128bpm","floor":"open","pass":"all_access"}',
      '{"dj":"midnight_set","energy":"peak","crowd":"packed"}',
    ],
  },
  4: {
    path: '/vip',
    label: 'VIP Lounge',
    summary: 'Guest list, bottle service, and premium booth access',
    requests: [
      'My name should be on the VIP list.',
      'I am here for bottle service and the velvet rope.',
      'Can you route me to the private lounge upstairs?',
      'I need access to the premium booth area.',
    ],
    payloads: [
      '{"guestlist":"priority","booth":"gold","service":"bottle"}',
      '{"tier":"vip","host":"velvet","band":"premium"}',
      '{"access":"lounge","reservation":"midnight","table":"private"}',
    ],
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function encodeBinary(input: string) {
  return Array.from(input).map(character => character.charCodeAt(0).toString(2).padStart(8, '0'))
}

function groupBinaryLines(groups: string[], groupsPerLine = 2) {
  const lines: string[] = []

  for (let index = 0; index < groups.length; index += groupsPerLine) {
    lines.push(groups.slice(index, index + groupsPerLine).join('  '))
  }

  return lines
}

function buildApiKey() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const sections = Array.from({ length: 2 }, () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(''),
  )

  return sections.join('-')
}

function buildIpAddress(prefixA = 172, prefixB = 18) {
  return `${prefixA}.${prefixB}.${Math.floor(10 + (Math.random() * 180))}.${Math.floor(10 + (Math.random() * 180))}`
}

function buildTicket(today: Date, shouldExpire: boolean): GatewayTicket {
  const todayStart = startOfLocalDay(today)
  const expiresOn = shouldExpire
    ? addDays(new Date(todayStart), -1 - Math.floor(Math.random() * 4))
    : addDays(new Date(todayStart), Math.floor(Math.random() * 5))
  const issuedOn = addDays(expiresOn, -2 - Math.floor(Math.random() * 6))

  return {
    key: buildApiKey(),
    issuedAtMs: issuedOn.getTime(),
    expiresAtMs: expiresOn.getTime(),
    issuedLabel: formatGatewayDate(issuedOn),
    expiresLabel: formatGatewayDate(expiresOn),
  }
}

function buildPayload(answer: GatewayEndpointId, format: RequestFormat): GatewayPayload {
  const preview = pickRandom(GATEWAY_ENDPOINTS[answer].payloads)

  if (format === 'json') {
    return {
      format,
      displayLines: [preview],
      translatedPreview: preview,
    }
  }

  return {
    format,
    displayLines: groupBinaryLines(encodeBinary(preview), 2),
    translatedPreview: preview,
  }
}

function buildPrompt(answer: GatewayEndpointId) {
  return pickRandom(GATEWAY_ENDPOINTS[answer].requests)
}

function buildVipGuestList(size: number): string[] {
  const shuffled = [...REQUEST_NAMES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, size)
}

function cloneRequest(request: GatewayRequest): GatewayRequest {
  return {
    ...request,
    ticket: { ...request.ticket },
    payload: {
      ...request.payload,
      displayLines: [...request.payload.displayLines],
    },
  }
}

function cloneState(state: ApiGatewayState): ApiGatewayState {
  return {
    ...state,
    spamWave: state.spamWave ? { ...state.spamWave } : null,
    queue: state.queue.map(cloneRequest),
    vipGuestList: state.vipGuestList, // read-only array, reference is fine
  }
}

function createGatewayRequest(
  nextId: number,
  today: Date,
  portraitCount: number,
  config: GatewayLevelConfig,
  vipGuestList: string[],
  options: {
    kind?: RequestKind
    sourceIp?: string
  } = {},
): GatewayRequest {
  const earlyWarmup = nextId <= 2
  const kind = options.kind ?? 'normal'

  let answer: GatewayEndpointId
  let isVipListed: boolean

  if (kind === 'vip-crasher') {
    answer = 4
    isVipListed = false
  } else {
    answer = config.endpointIds[Math.floor(Math.random() * config.endpointIds.length)] as GatewayEndpointId
    if (answer === 4 && vipGuestList.length > 0) {
      isVipListed = true
    } else {
      isVipListed = false
    }
  }

  const format: RequestFormat = earlyWarmup
    ? 'json'
    : Math.random() < config.binaryRate ? 'binary' : 'json'

  const shouldExpire = earlyWarmup
    ? false
    : Math.random() < config.expiredRate

  let prompt: string
  let alias: string

  if (kind === 'vip-crasher') {
    prompt = pickRandom(VIP_CRASHER_REQUESTS)
    // Pick an alias NOT on the guest list
    const nonListedNames = REQUEST_NAMES.filter(name => !vipGuestList.includes(name))
    alias = pickRandom(nonListedNames.length > 0 ? nonListedNames : REQUEST_NAMES)
  } else {
    prompt = buildPrompt(answer)
    if (answer === 4 && vipGuestList.length > 0) {
      alias = pickRandom(vipGuestList)
    } else {
      alias = pickRandom(REQUEST_NAMES)
    }
  }

  return {
    id: nextId,
    alias,
    portraitIndex: portraitCount > 0 ? Math.floor(Math.random() * portraitCount) : 0,
    sourceIp: options.sourceIp ?? buildIpAddress(),
    kind,
    prompt,
    answer,
    ticket: buildTicket(today, shouldExpire),
    ticketStatus: 'unchecked',
    payload: buildPayload(answer, format),
    translated: format === 'json',
    queueTimeMs: 0,
    isVipListed,
  }
}

function removeActiveRequest(state: ApiGatewayState) {
  state.queue = state.queue.slice(1)
}

function resolvePhase(state: ApiGatewayState, events: ApiGatewayEvent[]) {
  if (state.phase !== 'playing') {
    return { state, events }
  }

  if (state.breaches >= 3) {
    state.phase = 'lost'
    events.push({ type: 'lose', reason: 'breaches' })
    return { state, events }
  }

  if (state.reputation <= 0) {
    state.phase = 'lost'
    events.push({ type: 'lose', reason: 'reputation' })
    return { state, events }
  }

  if (state.correctCount >= state.goalCount && state.reputation >= state.goalReputation) {
    state.phase = 'won'
    events.push({ type: 'win' })
    return { state, events }
  }

  if (state.timeLeftMs <= 0) {
    state.phase = 'lost'
    events.push({ type: 'lose', reason: 'timeout' })
  }

  return { state, events }
}

function spawnNormalRequest(
  state: ApiGatewayState,
  today: Date,
  portraitCount: number,
  config: GatewayLevelConfig,
  vipGuestList: string[],
) {
  state.queue = [...state.queue, createGatewayRequest(state.nextId, today, portraitCount, config, vipGuestList)]
  state.nextId += 1
}

function spawnSpamRequest(
  state: ApiGatewayState,
  today: Date,
  portraitCount: number,
  ip: string,
  config: GatewayLevelConfig,
  vipGuestList: string[],
) {
  state.queue = [
    ...state.queue,
    createGatewayRequest(state.nextId, today, portraitCount, config, vipGuestList, {
      kind: 'spam',
      sourceIp: ip,
    }),
  ]
  state.nextId += 1
}

function spawnVipCrasherRequest(
  state: ApiGatewayState,
  today: Date,
  portraitCount: number,
  config: GatewayLevelConfig,
  vipGuestList: string[],
) {
  state.queue = [
    ...state.queue,
    createGatewayRequest(state.nextId, today, portraitCount, config, vipGuestList, { kind: 'vip-crasher' }),
  ]
  state.nextId += 1
}

export function formatGatewayDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function isTicketExpired(expiresAtMs: number, today: Date) {
  return expiresAtMs < startOfLocalDay(today)
}

export function createInitialApiGatewayState(
  today = new Date(),
  portraitCount = 15,
  sublevel: GatewaySublevel = 1,
): ApiGatewayState {
  const config = LEVEL_CONFIGS[sublevel]
  const vipGuestList = config.includesVip ? buildVipGuestList(config.vipListSize) : []

  const initial: ApiGatewayState = {
    phase: 'playing',
    sublevel,
    timeLeftMs: config.durationMs,
    reputation: INITIAL_REPUTATION,
    breaches: 0,
    handledCount: 0,
    correctCount: 0,
    rejectedCount: 0,
    goalCount: config.goalCount,
    goalReputation: config.goalReputation,
    includesVip: config.includesVip,
    vipGuestList,
    blockedIp: null,
    nextId: 1,
    nextSpawnMs: config.spawnBaseMs,
    nextSpamWaveMs: 55_000,
    queueWarningCooldownMs: 0,
    spamWavesTriggered: 0,
    spamWave: null,
    queue: [],
  }

  spawnNormalRequest(initial, today, portraitCount, config, vipGuestList)
  return initial
}

export function getActiveRequest(state: ApiGatewayState) {
  return state.queue[0] ?? null
}

export function getWaitlistCount(state: ApiGatewayState) {
  return Math.max(0, state.queue.length - 1)
}

export function getCurrentSpamIp(state: ApiGatewayState) {
  if (state.spamWave) return state.spamWave.sourceIp
  return state.queue.find(request => request.kind === 'spam')?.sourceIp ?? null
}

function inspectRequest(request: GatewayRequest, today: Date) {
  return {
    expired: isTicketExpired(request.ticket.expiresAtMs, today),
    untranslated: request.payload.format === 'binary' && !request.translated,
  }
}

export function validateActiveRequest(current: ApiGatewayState, today = new Date()): GatewayUpdateResult {
  const active = getActiveRequest(current)
  if (!active || current.phase !== 'playing' || active.ticketStatus !== 'unchecked') {
    return { state: current, events: [] }
  }

  const next = cloneState(current)
  const nextActive = next.queue[0]
  nextActive.ticketStatus = isTicketExpired(nextActive.ticket.expiresAtMs, today) ? 'expired' : 'valid'

  return resolvePhase(next, [{ type: 'validate', status: nextActive.ticketStatus }])
}

export function translateActiveRequest(current: ApiGatewayState): GatewayUpdateResult {
  const active = getActiveRequest(current)
  if (!active || current.phase !== 'playing' || active.payload.format !== 'binary' || active.translated) {
    return { state: current, events: [] }
  }

  const next = cloneState(current)
  next.queue[0].translated = true

  return resolvePhase(next, [{ type: 'translate' }])
}

export function rejectActiveRequest(current: ApiGatewayState): GatewayUpdateResult {
  return rejectGatewayRequest(current)
}

export function rejectGatewayRequest(current: ApiGatewayState, today = new Date()): GatewayUpdateResult {
  const active = getActiveRequest(current)
  if (!active || current.phase !== 'playing') {
    return { state: current, events: [] }
  }

  const next = cloneState(current)
  const nextActive = next.queue[0]
  const events: ApiGatewayEvent[] = []
  const { expired, untranslated } = inspectRequest(nextActive, today)

  if (expired || untranslated || nextActive.kind === 'vip-crasher') {
    next.rejectedCount += 1
    next.handledCount += 1
    next.correctCount += 1
    next.reputation = clamp(next.reputation + 2, 0, 100)
    events.push({ type: 'reject', correct: true })
  } else {
    next.reputation = clamp(next.reputation - 8, 0, 100)
    events.push({ type: 'reject', correct: false })
  }

  removeActiveRequest(next)
  return resolvePhase(next, events)
}

export function acceptGatewayRequest(
  current: ApiGatewayState,
  target: GatewayEndpointId,
  today = new Date(),
): GatewayUpdateResult {
  const active = getActiveRequest(current)
  if (!active || current.phase !== 'playing') {
    return { state: current, events: [] }
  }

  const next = cloneState(current)
  const nextActive = next.queue[0]
  const events: ApiGatewayEvent[] = []
  const { expired, untranslated } = inspectRequest(nextActive, today)

  if (expired) {
    next.breaches += 1
    next.reputation = clamp(next.reputation - 10, 0, 100)
    events.push({ type: 'breach', reason: 'expired' })
  } else if (untranslated) {
    next.breaches += 1
    next.reputation = clamp(next.reputation - 10, 0, 100)
    events.push({ type: 'breach', reason: 'untranslated' })
  } else if (nextActive.kind === 'vip-crasher') {
    next.reputation = clamp(next.reputation - 18, 0, 100)
    events.push({ type: 'vip-crasher', alias: nextActive.alias })
  } else if (nextActive.answer !== target) {
    next.reputation = clamp(next.reputation - 9, 0, 100)
    events.push({ type: 'route-wrong', target })
  } else {
    next.handledCount += 1
    next.correctCount += 1
    next.reputation = clamp(next.reputation + 2, 0, 100)
    events.push({ type: 'route-ok', target })
  }

  removeActiveRequest(next)
  return resolvePhase(next, events)
}

export function routeActiveRequest(
  current: ApiGatewayState,
  target: GatewayEndpointId,
): GatewayUpdateResult {
  const active = getActiveRequest(current)
  if (!active || current.phase !== 'playing') {
    return { state: current, events: [] }
  }

  const next = cloneState(current)
  const nextActive = next.queue[0]
  const events: ApiGatewayEvent[] = []

  if (nextActive.ticketStatus === 'unchecked') {
    next.breaches += 1
    next.reputation = clamp(next.reputation - 12, 0, 100)
    events.push({ type: 'breach', reason: 'unvalidated' })
  } else if (nextActive.ticketStatus === 'expired') {
    next.breaches += 1
    next.reputation = clamp(next.reputation - 10, 0, 100)
    events.push({ type: 'breach', reason: 'expired' })
  } else if (nextActive.payload.format === 'binary' && !nextActive.translated) {
    next.breaches += 1
    next.reputation = clamp(next.reputation - 10, 0, 100)
    events.push({ type: 'breach', reason: 'untranslated' })
  } else if (nextActive.answer !== target) {
    next.reputation = clamp(next.reputation - 9, 0, 100)
    events.push({ type: 'route-wrong', target })
  } else {
    next.handledCount += 1
    next.correctCount += 1
    next.reputation = clamp(next.reputation + 2, 0, 100)
    events.push({ type: 'route-ok', target })
  }

  removeActiveRequest(next)
  return resolvePhase(next, events)
}

export function blockCurrentSpamIp(current: ApiGatewayState): GatewayUpdateResult {
  const targetIp = getCurrentSpamIp(current)

  if (!targetIp || current.phase !== 'playing') {
    return { state: current, events: [] }
  }

  const next = cloneState(current)
  const blockedCount = next.queue.filter(request => request.sourceIp === targetIp).length

  next.blockedIp = targetIp
  next.queue = next.queue.filter(request => request.sourceIp !== targetIp)

  if (next.spamWave?.sourceIp === targetIp) {
    next.spamWave = null
  }

  return resolvePhase(next, [{ type: 'spam-blocked', ip: targetIp, blockedCount }])
}

export function tickApiGatewayState(
  current: ApiGatewayState,
  deltaMs: number,
  today = new Date(),
  portraitCount = 15,
): GatewayUpdateResult {
  if (current.phase !== 'playing') {
    return { state: current, events: [] }
  }

  const config = LEVEL_CONFIGS[current.sublevel]
  const next = cloneState(current)
  const events: ApiGatewayEvent[] = []
  const elapsedSeconds = deltaMs / 1000
  const progress = 1 - (next.timeLeftMs / config.durationMs)

  next.timeLeftMs = Math.max(0, next.timeLeftMs - deltaMs)
  next.nextSpawnMs -= deltaMs
  next.nextSpamWaveMs -= deltaMs
  next.queueWarningCooldownMs = Math.max(0, next.queueWarningCooldownMs - deltaMs)
  next.queue = next.queue.map(request => ({
    ...request,
    queueTimeMs: request.queueTimeMs + deltaMs,
  }))

  const spawnIntervalMs = config.spawnBaseMs - (1_800 * clamp(progress, 0, 1))

  while (next.nextSpawnMs <= 0) {
    const shouldBeCrasher =
      config.includesVip && config.vipCrasherRate > 0 && Math.random() < config.vipCrasherRate
    if (shouldBeCrasher) {
      spawnVipCrasherRequest(next, today, portraitCount, config, next.vipGuestList)
    } else {
      spawnNormalRequest(next, today, portraitCount, config, next.vipGuestList)
    }
    next.nextSpawnMs += spawnIntervalMs
  }

  if (!next.spamWave && next.spamWavesTriggered < config.maxSpamWaves && next.nextSpamWaveMs <= 0) {
    const spamIp = buildIpAddress(185, 91)
    next.spamWave = {
      sourceIp: spamIp,
      remaining: SPAM_REQUESTS_PER_WAVE,
      cadenceMs: SPAM_CADENCE_MS,
      cooldownMs: 0,
    }
    next.spamWavesTriggered += 1
    next.nextSpamWaveMs += 24_000 + (next.spamWavesTriggered * 4_500)
    events.push({ type: 'spam-start', ip: spamIp })
  }

  if (next.spamWave) {
    next.spamWave.cooldownMs -= deltaMs

    while (next.spamWave && next.spamWave.remaining > 0 && next.spamWave.cooldownMs <= 0) {
      if (next.blockedIp === next.spamWave.sourceIp) {
        next.spamWave = null
        break
      }

      spawnSpamRequest(next, today, portraitCount, next.spamWave.sourceIp, config, next.vipGuestList)
      next.spamWave.remaining -= 1
      next.spamWave.cooldownMs += next.spamWave.cadenceMs
    }

    if (next.spamWave && next.spamWave.remaining <= 0) {
      next.spamWave = null
    }
  }

  const queuePressure = Math.max(0, next.queue.length - QUEUE_SAFE_SIZE)
  if (queuePressure > 0) {
    next.reputation = clamp(next.reputation - (queuePressure * 0.65 * elapsedSeconds), 0, 100)
  }

  if (next.queue.length >= 8 && next.queueWarningCooldownMs === 0) {
    next.queueWarningCooldownMs = QUEUE_WARNING_COOLDOWN_MS
    events.push({ type: 'queue-warning', backlog: next.queue.length })
  }

  // Keep MAX_SPAM_WAVES available but use config in logic above
  void MAX_SPAM_WAVES

  return resolvePhase(next, events)
}
