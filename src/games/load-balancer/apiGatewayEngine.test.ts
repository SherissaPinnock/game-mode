import { describe, expect, it } from 'vitest'

import {
  acceptGatewayRequest,
  blockCurrentSpamIp,
  createInitialApiGatewayState,
  isTicketExpired,
  rejectGatewayRequest,
  routeActiveRequest,
  tickApiGatewayState,
  translateActiveRequest,
  validateActiveRequest,
  type ApiGatewayState,
  type GatewayRequest,
} from '@/games/load-balancer/apiGatewayEngine'

function buildRequest(overrides: Partial<GatewayRequest> = {}): GatewayRequest {
  return {
    id: overrides.id ?? 1,
    alias: overrides.alias ?? 'Test Guest',
    portraitIndex: overrides.portraitIndex ?? 0,
    sourceIp: overrides.sourceIp ?? '10.0.0.1',
    kind: overrides.kind ?? 'normal',
    prompt: overrides.prompt ?? '1 + 1 = ?',
    answer: overrides.answer ?? 2,
    ticket: overrides.ticket ?? {
      key: 'TEST-KEY',
      issuedAtMs: new Date('2026-05-09T00:00:00').getTime(),
      expiresAtMs: new Date('2026-05-13T00:00:00').getTime(),
      issuedLabel: 'May 9, 2026',
      expiresLabel: 'May 13, 2026',
    },
    ticketStatus: overrides.ticketStatus ?? 'unchecked',
    payload: overrides.payload ?? {
      format: 'json',
      displayLines: ['{"vip":1}'],
      translatedPreview: '{"vip":1}',
    },
    translated: overrides.translated ?? true,
    queueTimeMs: overrides.queueTimeMs ?? 0,
    isVipListed: overrides.isVipListed ?? false,
  }
}

function buildState(overrides: Partial<ApiGatewayState> = {}): ApiGatewayState {
  return {
    phase: overrides.phase ?? 'playing',
    sublevel: overrides.sublevel ?? 1,
    timeLeftMs: overrides.timeLeftMs ?? 120_000,
    reputation: overrides.reputation ?? 100,
    breaches: overrides.breaches ?? 0,
    handledCount: overrides.handledCount ?? 0,
    correctCount: overrides.correctCount ?? 0,
    rejectedCount: overrides.rejectedCount ?? 0,
    goalCount: overrides.goalCount ?? 5,
    goalReputation: overrides.goalReputation ?? 70,
    includesVip: overrides.includesVip ?? false,
    vipGuestList: overrides.vipGuestList ?? [],
    blockedIp: overrides.blockedIp ?? null,
    nextId: overrides.nextId ?? 99,
    nextSpawnMs: overrides.nextSpawnMs ?? 2_000,
    nextSpamWaveMs: overrides.nextSpamWaveMs ?? 18_000,
    queueWarningCooldownMs: overrides.queueWarningCooldownMs ?? 0,
    spamWavesTriggered: overrides.spamWavesTriggered ?? 0,
    spamWave: overrides.spamWave ?? null,
    queue: overrides.queue ?? [buildRequest()],
  }
}

describe('api gateway engine', () => {
  it('starts with a single readable onboarding guest before pressure ramps up', () => {
    const today = new Date('2026-05-13T12:00:00')
    const state = createInitialApiGatewayState(today, 5)

    expect(state.timeLeftMs).toBe(90_000)
    expect(state.queue).toHaveLength(1)
    expect(state.nextSpawnMs).toBe(7_500)
    expect(state.nextSpamWaveMs).toBe(55_000)

    const validated = validateActiveRequest(state, today)
    expect(validated.events).toEqual([{ type: 'validate', status: 'valid' }])
    expect(validated.state.queue[0]?.payload.format).toBe('json')
  })

  it('treats keys that expire today as still valid', () => {
    const today = new Date('2026-05-13T12:00:00')
    const expiresToday = new Date('2026-05-13T00:00:00').getTime()

    expect(isTicketExpired(expiresToday, today)).toBe(false)
  })

  it('requires binary payloads to be translated before routing', () => {
    const today = new Date('2026-05-13T12:00:00')
    const state = buildState({
      queue: [
        buildRequest({
          ticketStatus: 'valid',
          payload: {
            format: 'binary',
            displayLines: ['01111011 00100010'],
            translatedPreview: '{"vip":1}',
          },
          translated: false,
          answer: 2,
        }),
      ],
    })

    const result = routeActiveRequest(state, 2)

    expect(result.events).toEqual([{ type: 'breach', reason: 'untranslated' }])
    expect(result.state.breaches).toBe(1)
    expect(result.state.queue).toHaveLength(0)

    const translated = translateActiveRequest(state)
    expect(translated.state.queue[0]?.translated).toBe(true)

    const rerouted = routeActiveRequest(translated.state, 2)
    expect(rerouted.events).toEqual([{ type: 'route-ok', target: 2 }])
    expect(rerouted.state.handledCount).toBe(1)
    expect(validateActiveRequest(state, today).state.queue[0]?.ticketStatus).toBe('valid')
  })

  it('rejects expired tickets after validation', () => {
    const today = new Date('2026-05-13T12:00:00')
    const expiredState = buildState({
      queue: [
        buildRequest({
          ticket: {
            key: 'OLD-KEY',
            issuedAtMs: new Date('2026-05-04T00:00:00').getTime(),
            expiresAtMs: new Date('2026-05-10T00:00:00').getTime(),
            issuedLabel: 'May 4, 2026',
            expiresLabel: 'May 10, 2026',
          },
          ticketStatus: 'unchecked',
          translated: true,
        }),
      ],
    })

    const validated = validateActiveRequest(expiredState, today)
    const rejected = rejectGatewayRequest(validated.state, today)

    expect(validated.events).toEqual([{ type: 'validate', status: 'expired' }])
    expect(rejected.events).toEqual([{ type: 'reject', correct: true }])
    expect(rejected.state.handledCount).toBe(1)
    expect(rejected.state.rejectedCount).toBe(1)
    expect(rejected.state.queue).toHaveLength(0)
  })

  it('treats raw binary acceptance as a breach in the unguided flow', () => {
    const today = new Date('2026-05-13T12:00:00')
    const state = buildState({
      queue: [
        buildRequest({
          payload: {
            format: 'binary',
            displayLines: ['01111011 00100010'],
            translatedPreview: '{"vip":1}',
          },
          translated: false,
          answer: 2,
        }),
      ],
    })

    const accepted = acceptGatewayRequest(state, 2, today)

    expect(accepted.events).toEqual([{ type: 'breach', reason: 'untranslated' }])
    expect(accepted.state.breaches).toBe(1)
    expect(accepted.state.queue).toHaveLength(0)
  })

  it('lets the player reject raw binary traffic without penalty', () => {
    const today = new Date('2026-05-13T12:00:00')
    const state = buildState({
      queue: [
        buildRequest({
          payload: {
            format: 'binary',
            displayLines: ['01111011 00100010'],
            translatedPreview: '{"vip":1}',
          },
          translated: false,
        }),
      ],
    })

    const rejected = rejectGatewayRequest(state, today)

    expect(rejected.events).toEqual([{ type: 'reject', correct: true }])
    expect(rejected.state.rejectedCount).toBe(1)
    expect(rejected.state.queue).toHaveLength(0)
  })

  it('accepts translated binary once the payload is readable and the endpoint is correct', () => {
    const today = new Date('2026-05-13T12:00:00')
    const state = buildState({
      queue: [
        buildRequest({
          answer: 2,
          payload: {
            format: 'binary',
            displayLines: ['01111011 00100010'],
            translatedPreview: '{"order":"mocktail","garnish":"lime"}',
          },
          translated: false,
        }),
      ],
    })

    const translated = translateActiveRequest(state)
    const accepted = acceptGatewayRequest(translated.state, 2, today)

    expect(translated.state.queue[0]?.translated).toBe(true)
    expect(accepted.events).toEqual([{ type: 'route-ok', target: 2 }])
    expect(accepted.state.breaches).toBe(0)
    expect(accepted.state.handledCount).toBe(1)
  })

  it('accepts only when the player picked the correct server and the request is safe', () => {
    const today = new Date('2026-05-13T12:00:00')
    const state = buildState({
      queue: [
        buildRequest({
          answer: 3,
          payload: {
            format: 'json',
            displayLines: ['{"vip":1}'],
            translatedPreview: '{"vip":1}',
          },
          translated: true,
        }),
      ],
    })

    const accepted = acceptGatewayRequest(state, 3, today)
    const wrongDoor = acceptGatewayRequest(state, 1, today)

    expect(accepted.events).toEqual([{ type: 'route-ok', target: 3 }])
    expect(accepted.state.handledCount).toBe(1)
    expect(wrongDoor.events).toEqual([{ type: 'route-wrong', target: 1 }])
    expect(wrongDoor.state.reputation).toBeLessThan(state.reputation)
  })

  it('blocks an active spam wave and clears matching requests immediately', () => {
    const spamIp = '185.91.44.13'
    const state = buildState({
      queue: [
        buildRequest({ id: 1, sourceIp: spamIp, kind: 'spam' }),
        buildRequest({ id: 2, sourceIp: spamIp, kind: 'spam' }),
        buildRequest({ id: 3, sourceIp: '10.0.0.9', kind: 'normal' }),
      ],
      spamWave: {
        sourceIp: spamIp,
        remaining: 6,
        cadenceMs: 200,
        cooldownMs: 0,
      },
    })

    const blocked = blockCurrentSpamIp(state)

    expect(blocked.events).toEqual([{ type: 'spam-blocked', ip: spamIp, blockedCount: 2 }])
    expect(blocked.state.blockedIp).toBe(spamIp)
    expect(blocked.state.spamWave).toBeNull()
    expect(blocked.state.queue).toHaveLength(1)
    expect(blocked.state.queue[0]?.sourceIp).toBe('10.0.0.9')
  })

  it('spawns a spam wave on tick when the timer reaches the trigger window', () => {
    const today = new Date('2026-05-13T12:00:00')
    const state = createInitialApiGatewayState(today, 5)
    state.nextSpamWaveMs = 50
    state.nextSpawnMs = 100_000

    const result = tickApiGatewayState(state, 100, today, 5)

    expect(result.events[0]).toMatchObject({ type: 'spam-start' })
    expect(result.state.queue.length).toBeGreaterThanOrEqual(2)
  })
})
