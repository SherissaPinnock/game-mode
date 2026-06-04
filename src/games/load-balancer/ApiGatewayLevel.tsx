import { useCallback, useEffect, useRef, useState } from 'react'
import handbookSrc from '@/assets/bouncer/handbook.png'
import arcadeMachineIconSrc from '@/assets/bouncer/arcade-machine.svg'
import cocktailIconSrc from '@/assets/bouncer/cocktail.svg'
import danceFloorIconSrc from '@/assets/bouncer/dance-floor.svg'
import portraitSheetSrc from '@/assets/bouncer/silhouette transparent.png'
import starIconSrc from '@/assets/bouncer/star.svg'
import ticketSrc from '@/assets/bouncer/ticket.png'
import verticalTicketSrc from '@/assets/bouncer/vertical ticket.png'
import { GameCompleteModal } from '@/components/GameCompleteModal'
import {
  playClick,
  playComplete,
  playCorrect,
  playPop,
} from '@/lib/sounds'
import { API_GATEWAY_COMPLETION } from './data/completionData'
import {
  acceptGatewayRequest,
  blockCurrentSpamIp,
  createInitialApiGatewayState,
  formatGatewayDate,
  GATEWAY_ENDPOINTS,
  type GatewayEndpointId,
  getActiveRequest,
  getCurrentSpamIp,
  getWaitlistCount,
  LEVEL_CONFIGS,
  type GatewaySublevel,
  rejectGatewayRequest,
  tickApiGatewayState,
  translateActiveRequest,
  type ApiGatewayEvent,
  type ApiGatewayState,
} from './apiGatewayEngine'
import { extractPortraitSprites } from './sprite-utils'
import type { FloatingTone } from './types'

interface ApiGatewayLevelProps {
  onBack: () => void
  onToggleMusic: () => void
  musicMuted: boolean
  onComplete: () => void
}

interface AlertState {
  id: number
  text: string
  tone: FloatingTone
}

type ActiveGatewayRequest = ApiGatewayState['queue'][number] | null


function formatTimer(timeLeftMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(timeLeftMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function getEndpointIconSrc(path: string): string {
  if (path === '/arcade') return arcadeMachineIconSrc
  if (path === '/bar') return cocktailIconSrc
  if (path === '/dancefloor') return danceFloorIconSrc
  if (path === '/vip') return starIconSrc
  return starIconSrc
}

function getEndpointColor(path: string): string {
  if (path === '/arcade') return 'arcade'
  if (path === '/bar') return 'bar'
  if (path === '/dancefloor') return 'dancefloor'
  if (path === '/vip') return 'vip'
  return 'default'
}

function buildReputationHearts(reputation: number) {
  const total = 10
  const filled = Math.max(0, Math.min(total, Math.round(reputation / 10)))
  return Array.from({ length: total }, (_, index) => index < filled)
}

function getPayloadLabel(request: ActiveGatewayRequest) {
  if (!request) return 'No Payload'
  if (request.payload.format === 'binary' && !request.translated) return 'Binary'
  if (request.payload.format === 'binary') return 'Translated JSON'
  return 'JSON'
}

function getPayloadLines(request: ActiveGatewayRequest) {
  if (!request) {
    return ['No payload in queue']
  }

  if (request.payload.format === 'binary' && !request.translated) {
    return request.payload.displayLines
  }

  try {
    return JSON.stringify(JSON.parse(request.payload.translatedPreview), null, 2).split('\n')
  } catch {
    return [request.payload.translatedPreview]
  }
}

function describeEvent(event: ApiGatewayEvent): { text: string; tone: FloatingTone } | null {
  if (event.type === 'translate') {
    return { text: 'Payload translated to JSON', tone: 'bonus' }
  }

  if (event.type === 'route-ok') {
    return { text: `Accepted to ${GATEWAY_ENDPOINTS[event.target].path}`, tone: 'good' }
  }

  if (event.type === 'route-wrong') {
    return { text: `Wrong endpoint: ${GATEWAY_ENDPOINTS[event.target].path}`, tone: 'bad' }
  }

  if (event.type === 'reject') {
    return event.correct
      ? { text: 'Rejected correctly', tone: 'bonus' }
      : { text: 'Rejected safe traffic', tone: 'bad' }
  }

  if (event.type === 'breach') {
    const textByReason = {
      unvalidated: 'Security breach: unchecked request got through',
      expired: 'Security breach: expired API key accepted',
      untranslated: 'Security breach: raw binary was accepted',
    } satisfies Record<'unvalidated' | 'expired' | 'untranslated', string>

    return { text: textByReason[event.reason], tone: 'bad' }
  }

  if (event.type === 'spam-start') {
    return { text: `Flood surge from ${event.ip}`, tone: 'warn' }
  }

  if (event.type === 'spam-blocked') {
    return { text: `Blocked ${event.blockedCount} queued hits`, tone: 'bonus' }
  }

  if (event.type === 'queue-warning') {
    return { text: `Waitlist rising: ${event.backlog}`, tone: 'warn' }
  }

  if (event.type === 'vip-crasher') {
    return { text: `${event.alias} was not on the list — crasher got through`, tone: 'bad' }
  }

  if (event.type === 'win') {
    return { text: 'Gateway secure. Shift cleared.', tone: 'bonus' }
  }

  if (event.type === 'lose') {
    if (event.reason === 'timeout') return { text: 'Time ran out before the goal was reached', tone: 'bad' }
    return {
      text: event.reason === 'breaches' ? 'Three breaches triggered game over' : 'Reputation crashed to zero',
      tone: 'bad',
    }
  }

  return null
}

function playEventSound(event: ApiGatewayEvent) {
  if (event.type === 'translate') {
    playPop()
    return
  }

  if (event.type === 'route-ok') {
    playCorrect()
    return
  }

  if (event.type === 'reject' && event.correct) {
    playPop()
    return
  }

  if (event.type === 'spam-blocked') {
    playPop()
    return
  }

  if (event.type === 'win') {
    playComplete()
  }
}

interface ProtocolHandbookModalProps {
  onClose: () => void
  endpointOptions: Array<{ id: GatewayEndpointId; path: string; label: string; summary: string }>
}

function ProtocolHandbookModal({ onClose, endpointOptions }: ProtocolHandbookModalProps) {
  return (
    <div
      className="lb-handbook-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="lb-handbook-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lb-handbook-title"
      >
        <div className="lb-handbook-modal-head">
          <div className="lb-handbook-modal-book">
            <img src={handbookSrc} alt="" draggable={false} />
          </div>

          <div className="lb-handbook-modal-copy">
            <span className="lb-handbook-badge">Protocol Handbook</span>
            <h2 id="lb-handbook-title">Club Nexus gateway notes</h2>
            <p>
              Read the ticket yourself, translate raw binary before you trust it, and send the guest to the
              endpoint that actually matches what they want.
            </p>
          </div>
        </div>

        <div className="lb-handbook-modal-grid">
          <section className="lb-handbook-paper" style={{ backgroundImage: `url(${ticketSrc})` }}>
            <span className="lb-handbook-paper-kicker">Entry Rules</span>
            <ul>
              <li>Expired API keys should be rejected.</li>
              <li>Binary payloads must be translated before they can be accepted.</li>
              <li>If the clue trail does not match the endpoint, do not wave them through.</li>
              <li>Block a flood source before the queue crushes reputation.</li>
            </ul>
          </section>

          <section className="lb-handbook-paper" style={{ backgroundImage: `url(${ticketSrc})` }}>
            <span className="lb-handbook-paper-kicker">Endpoints</span>
            <div className="lb-handbook-endpoints">
              {endpointOptions.map(endpoint => (
                <div key={endpoint.id} className="lb-handbook-endpoint">
                  <strong>{endpoint.path}</strong>
                  <span>{endpoint.summary}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="lb-handbook-paper" style={{ backgroundImage: `url(${ticketSrc})` }}>
            <span className="lb-handbook-paper-kicker">Failure State</span>
            <p>
              Three breaches ends the shift. Letting the waitlist spiral will also tank club reputation even if
              the alarm never trips.
            </p>
          </section>
        </div>

        <div className="lb-handbook-modal-actions">
          <button className="lb-handbook-close-btn" onClick={onClose} type="button">
            Back to the booth
          </button>
        </div>
      </div>
    </div>
  )
}

export function ApiGatewayLevel({
  onBack,
  onToggleMusic,
  musicMuted,
  onComplete,
}: ApiGatewayLevelProps) {
  const [portraitSprites, setPortraitSprites] = useState<string[]>([])
  const [state, setState] = useState<ApiGatewayState>(() => createInitialApiGatewayState(new Date(), 15, 1))
  const [alert, setAlert] = useState<AlertState | null>(null)
  const [selectedEndpointId, setSelectedEndpointId] = useState<GatewayEndpointId | null>(null)
  const [handbookOpen, setHandbookOpen] = useState(false)
  const [sublevel, setSublevel] = useState<GatewaySublevel>(1)
  const [showCompleteModal, setShowCompleteModal] = useState(false)

  const stateRef = useRef(state)
  const alertTimeoutRef = useRef<number | null>(null)
  const completionSentRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const sublevelRef = useRef<GatewaySublevel>(1)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    let cancelled = false

    extractPortraitSprites(portraitSheetSrc)
      .then(sprites => {
        if (!cancelled && sprites.length > 0) {
          setPortraitSprites(sprites)
        }
      })
      .catch(() => {
        if (!cancelled) setPortraitSprites([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current !== null) {
        window.clearTimeout(alertTimeoutRef.current)
      }
    }
  }, [])

  const showAlert = useCallback((text: string, tone: FloatingTone) => {
    setAlert({
      id: Date.now() + Math.floor(Math.random() * 1_000),
      text,
      tone,
    })

    if (alertTimeoutRef.current !== null) {
      window.clearTimeout(alertTimeoutRef.current)
    }

    alertTimeoutRef.current = window.setTimeout(() => {
      setAlert(current => {
        if (current?.text !== text) return current
        return null
      })
    }, 2_200)
  }, [])

  const handleEvents = useCallback((events: ApiGatewayEvent[]) => {
    for (const event of events) {
      playEventSound(event)

      const alertDescriptor = describeEvent(event)
      if (alertDescriptor) {
        showAlert(alertDescriptor.text, alertDescriptor.tone)
      }

      if (event.type === 'win' && !completionSentRef.current) {
        completionSentRef.current = true
        if (sublevelRef.current >= 3) {
          onCompleteRef.current()
          setShowCompleteModal(true)
        }
      }
    }
  }, [showAlert])

  useEffect(() => {
    if (state.phase !== 'playing') return

    let frameId = 0
    let previous = performance.now()

    const tick = (now: number) => {
      const deltaMs = Math.min(50, now - previous)
      previous = now

      const result = tickApiGatewayState(
        stateRef.current,
        deltaMs,
        new Date(),
        Math.max(1, portraitSprites.length),
      )
      stateRef.current = result.state
      setState(result.state)
      handleEvents(result.events)
      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [handleEvents, portraitSprites.length, state.phase])

  function handleTranslate() {
    const active = getActiveRequest(stateRef.current)

    if (!active) {
      showAlert('No payload to translate right now', 'warn')
      return
    }

    if (active.payload.format !== 'binary') {
      showAlert('Payload is already readable JSON', 'warn')
      return
    }

    if (active.translated) {
      showAlert('Payload already translated', 'warn')
      return
    }

    const result = translateActiveRequest(stateRef.current)
    stateRef.current = result.state
    setState(result.state)
    handleEvents(result.events)
  }

  function handleAccept() {
    if (!selectedEndpointId) {
      showAlert('Pick an endpoint before accepting', 'warn')
      return
    }

    const result = acceptGatewayRequest(stateRef.current, selectedEndpointId, new Date())
    stateRef.current = result.state
    setState(result.state)
    setSelectedEndpointId(null)
    handleEvents(result.events)
  }

  function handleReject() {
    const active = getActiveRequest(stateRef.current)
    if (!active) {
      showAlert('Nobody is at the booth right now', 'warn')
      return
    }

    const result = rejectGatewayRequest(stateRef.current, new Date())
    stateRef.current = result.state
    setState(result.state)
    setSelectedEndpointId(null)
    handleEvents(result.events)
  }

  function handleBlock() {
    if (!getCurrentSpamIp(stateRef.current)) {
      showAlert('No active flood to block right now', 'warn')
      return
    }

    const result = blockCurrentSpamIp(stateRef.current)
    stateRef.current = result.state
    setState(result.state)
    setSelectedEndpointId(null)
    handleEvents(result.events)
  }

  function handleRetry() {
    completionSentRef.current = false
    const fresh = createInitialApiGatewayState(new Date(), Math.max(1, portraitSprites.length), sublevel)
    playClick()
    setAlert(null)
    setHandbookOpen(false)
    setSelectedEndpointId(null)
    stateRef.current = fresh
    setState(fresh)
  }

  function handleNextLevel() {
    if (sublevel >= 3) {
      onCompleteRef.current()
      setShowCompleteModal(true)
      return
    }
    const next = (sublevel + 1) as GatewaySublevel
    completionSentRef.current = false
    const fresh = createInitialApiGatewayState(new Date(), Math.max(1, portraitSprites.length), next)
    playClick()
    setAlert(null)
    setHandbookOpen(false)
    setSelectedEndpointId(null)
    setSublevel(next)
    sublevelRef.current = next
    stateRef.current = fresh
    setState(fresh)
  }

  const activeRequest = getActiveRequest(state)
  const waitlistCount = getWaitlistCount(state)
  const activeSpamIp = getCurrentSpamIp(state)
  const reputationHearts = buildReputationHearts(state.reputation)
  const activePortraitSrc = activeRequest
    ? portraitSprites[activeRequest.portraitIndex % Math.max(1, portraitSprites.length)] ?? ''
    : ''
  const payloadLines = getPayloadLines(activeRequest)
  const payloadLabel = getPayloadLabel(activeRequest)

  const isBinaryUntranslated = activeRequest?.payload.format === 'binary' && !activeRequest.translated
  const levelConfig = LEVEL_CONFIGS[sublevel]
  const endpointOptions = levelConfig.endpointIds.map(id => ({ id, ...GATEWAY_ENDPOINTS[id] }))
  const timeBarPct = Math.max(0, (state.timeLeftMs / levelConfig.durationMs) * 100)

  return (
    <>
    <div className="ag-shell">
      {/* Top nav */}
      <nav className="ag-topnav">
        <div className="ag-topnav-left">
          <button className="ag-nav-btn" onClick={onBack} type="button">← BACK</button>
        </div>

        <div className="ag-nav-title">
          <span className="ag-nav-kicker">CLUB NEXUS</span>
          <span className="ag-nav-name">API GATEWAY — SHIFT {sublevel} OF 3</span>
        </div>

        <div className="ag-topnav-right">
          <button
            className="ag-nav-btn ag-nav-btn--amber"
            onClick={() => { playClick(); setHandbookOpen(true) }}
            type="button"
          >
            📓 HANDBOOK
          </button>
          <button className="ag-nav-btn" onClick={onToggleMusic} type="button">
            🎵 {musicMuted ? 'OFF' : 'ON'}
          </button>
        </div>
      </nav>

      <div className="ag-mainframe">
        {/* Main workspace: ticket | camera | stats */}
        <div className="ag-workspace">

          {/* LEFT — Request ticket */}
          <div className="ag-ticket-panel">
            <div className="ag-panel-label ag-panel-label--pink">
              <span aria-hidden="true">★</span> REQUEST TICKET <span aria-hidden="true">★</span>
            </div>

            <div className="ag-ticket-body" style={{ backgroundImage: `url(${verticalTicketSrc})` }}>

              <div className="ag-ticket-field">
                <span className="ag-field-icon" aria-hidden="true">🎫</span>
                <div className="ag-field-content">
                  <span className="ag-field-key">TICKET ID</span>
                  <div className="ag-field-val-row">
                    <strong className="ag-field-val">{activeRequest?.ticket.key ?? '--------'}</strong>
                    <span className="ag-barcode" aria-hidden="true">||| |||| || ||||| ||||</span>
                  </div>
                </div>
              </div>

              <div className="ag-ticket-field">
                <span className="ag-field-icon" aria-hidden="true">🔑</span>
                <div className="ag-field-content">
                  <span className="ag-field-key">API KEY</span>
                  <span
                    className={`ag-key-status ag-key-status--${activeRequest?.ticketStatus ?? 'unchecked'}`}
                    aria-label={`API key status: ${activeRequest?.ticketStatus ?? 'unchecked'}`}
                  >
                    {activeRequest?.ticketStatus === 'valid' && 'VALID'}
                    {activeRequest?.ticketStatus === 'expired' && 'EXPIRED'}
                    {activeRequest?.ticketStatus === 'unchecked' && 'UNSCANNED'}
                    {!activeRequest && '------'}
                  </span>
                </div>
              </div>

              <div className="ag-ticket-field">
                <span className="ag-field-icon" aria-hidden="true">🌐</span>
                <div className="ag-field-content">
                  <span className="ag-field-key">IP ADDRESS</span>
                  <strong className="ag-field-val">{activeRequest?.sourceIp ?? '--- . --- . --- . ---'}</strong>
                </div>
              </div>

              <div className="ag-ticket-field">
                <span className="ag-field-icon" aria-hidden="true">🕐</span>
                <div className="ag-field-content">
                  <span className="ag-field-key">TIMESTAMP</span>
                  <strong className="ag-field-val ag-field-val--sm">
                    {activeRequest
                      ? `${activeRequest.ticket.issuedLabel}  ·  expires ${activeRequest.ticket.expiresLabel}`
                      : '-- --- ----'}
                  </strong>
                </div>
              </div>

              <div className="ag-ticket-request-box">
                <span className="ag-field-key">REQUEST</span>
                <p className="ag-request-text">
                  {activeRequest?.prompt ?? 'No guest at the desk.'}
                </p>
              </div>

              <div className="ag-ticket-field ag-ticket-translate-row">
                <div className="ag-field-content">
                  <span className="ag-field-key">FORMAT</span>
                  <strong className="ag-field-val">{payloadLabel}</strong>
                  {isBinaryUntranslated && (
                    <span className="ag-format-hint">→ Target: Club Language (ClubJSON)</span>
                  )}
                </div>
                <button
                  className="ag-translate-btn"
                  onClick={handleTranslate}
                  type="button"
                  disabled={state.phase !== 'playing'}
                >
                  ⟳ TRANSLATE
                </button>
              </div>

              <div className="ag-ticket-field">
                <span className="ag-field-icon" aria-hidden="true">★</span>
                <div className="ag-field-content">
                  <span className="ag-field-key">USER TIER</span>
                  <strong className="ag-field-val">
                    {activeRequest?.kind === 'spam' ? '⚠ FLAGGED' : 'STANDARD'}
                  </strong>
                </div>
              </div>

              <div className={`ag-payload-readout ${isBinaryUntranslated ? 'ag-payload-readout--binary' : 'ag-payload-readout--json'}`}>
                {payloadLines.slice(0, 3).map((line, i) => (
                  <code key={`${line}-${i}`}>{line}</code>
                ))}
              </div>

              {state.includesVip && (
                <div className="ag-guest-list">
                  <span className="ag-field-key">★ VIP GUEST LIST</span>
                  <div className="ag-guest-names">
                    {state.vipGuestList.map(name => (
                      <span key={name} className="ag-guest-name">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* CENTER — Camera feed */}
          <div className="ag-camera-col">
            <div className="ag-camera-screen">
              <div className="ag-camera-inner">
                {activePortraitSrc ? (
                  <img src={activePortraitSrc} alt="" className="ag-portrait" draggable={false} />
                ) : (
                  <div className="ag-portrait-placeholder" aria-hidden="true" />
                )}
              </div>

              {activeSpamIp && (
                <div
                  className={`ag-threat-badge ${state.blockedIp === activeSpamIp ? 'ag-threat-badge--blocked' : 'ag-threat-badge--active'}`}
                >
                  {state.blockedIp === activeSpamIp ? `✓ BLOCKED ${activeSpamIp}` : `⚠ FLOOD ${activeSpamIp}`}
                </div>
              )}

              <div className="ag-cam-label" aria-hidden="true">CAM-01 ◉ LIVE</div>
            </div>

            <div className="ag-identity-strip">
              <span className="ag-identity-kicker">
                {activeRequest?.kind === 'spam' ? '⚠ FLOOD SOURCE' : '◎ LIVE REQUEST'}
              </span>
              <strong className="ag-identity-name">{activeRequest?.alias ?? 'Queue Cooling Down'}</strong>
              <span className="ag-identity-ip">{activeRequest?.sourceIp ?? 'No active IP'}</span>
            </div>
          </div>

          {/* RIGHT — Stats */}
          <div className="ag-stats-col">
            <div className="ag-stat-card ag-stat-card--time">
              <div className="ag-stat-card-label">TIME REMAINING</div>
              <div
                className="ag-digital-clock"
                aria-label={`Time remaining: ${formatTimer(state.timeLeftMs)}`}
              >
                {formatTimer(state.timeLeftMs)}
              </div>
              <div className="ag-time-bar" role="progressbar" aria-valuenow={timeBarPct} aria-valuemin={0} aria-valuemax={100}>
                <div className="ag-time-bar-fill" style={{ width: `${timeBarPct}%` }} />
              </div>
            </div>

            <div className="ag-stat-card ag-stat-card--goal">
              <div className="ag-stat-card-label">GOAL</div>
              <div className="ag-goal-count">
                <span className="ag-goal-current">{state.correctCount}</span>
                <span className="ag-goal-sep">/</span>
                <span className="ag-goal-target">{state.goalCount}</span>
              </div>
              <span className="ag-queue-sub">CORRECT</span>
              <div className="ag-goal-bar">
                <div className="ag-goal-bar-fill" style={{ width: `${Math.min(100, (state.correctCount / state.goalCount) * 100)}%` }} />
              </div>
            </div>

            <div className="ag-stat-card ag-stat-card--queue">
              <div className="ag-stat-card-label">CURRENT QUEUE</div>
              <div className="ag-queue-row">
                <span className="ag-queue-count" aria-label={`${waitlistCount} people in queue`}>
                  {waitlistCount}
                </span>
                <span className="ag-queue-icons" aria-hidden="true">
                  {waitlistCount > 0 ? '👥' : '—'}
                </span>
              </div>
              <span className="ag-queue-sub">PEOPLE</span>
            </div>

            <div className="ag-stat-card ag-stat-card--rep">
              <div className="ag-stat-card-label">REPUTATION</div>
              <div
                className="ag-hearts"
                aria-label={`Reputation: ${Math.round(state.reputation)}%`}
              >
                {reputationHearts.map((filled, i) => (
                  <span key={i} className={`ag-heart ${filled ? 'ag-heart--on' : ''}`} aria-hidden="true">♥</span>
                ))}
              </div>
            </div>

            <div className="ag-stat-card ag-stat-card--breach">
              <div className="ag-stat-card-label">BREACHES</div>
              <div className="ag-breach-count" aria-label={`${state.breaches} of 3 breaches`}>
                {state.breaches}<span className="ag-breach-denom">/3</span>
              </div>
            </div>

            <div className="ag-stat-card ag-stat-card--today">
              <div className="ag-stat-card-label">TODAY</div>
              <div className="ag-today-date">{formatGatewayDate(new Date())}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="ag-actions">
            <button
              className="ag-action-btn ag-action-btn--accept"
              onClick={handleAccept}
              type="button"
              disabled={state.phase !== 'playing'}
            >
              <span className="ag-action-icon" aria-hidden="true">✓</span>
              ACCEPT
            </button>

            <button
              className="ag-action-btn ag-action-btn--reject"
              onClick={handleReject}
              type="button"
              disabled={state.phase !== 'playing'}
            >
              <span className="ag-action-icon" aria-hidden="true">✗</span>
              REJECT
            </button>

            <button
              className={`ag-action-btn ag-action-btn--block ${activeSpamIp ? 'is-hot' : ''} ${state.blockedIp === activeSpamIp && activeSpamIp ? 'is-done' : ''}`}
              onClick={handleBlock}
              type="button"
              disabled={state.phase !== 'playing'}
            >
              <span className="ag-action-icon" aria-hidden="true">🔒</span>
              BLOCK IP
            </button>
          </div>
        </div>

        {/* Route to endpoint */}
        <div className="ag-route-bar">
          <div className="ag-route-header">
            ROUTE TO ENDPOINT
            <span className="ag-route-rule" aria-hidden="true" />
          </div>

          <div className="ag-endpoint-strip">
            {endpointOptions.map(endpoint => (
              <button
                key={endpoint.id}
                className={`ag-ep-card ag-ep-card--${getEndpointColor(endpoint.path)} ${selectedEndpointId === endpoint.id ? 'is-selected' : ''}`}
                onClick={() => {
                  playClick()
                  setSelectedEndpointId(current => current === endpoint.id ? null : endpoint.id)
                }}
                type="button"
                disabled={state.phase !== 'playing'}
              >
                <span className="ag-ep-icon-shell" aria-hidden="true">
                  <img src={getEndpointIconSrc(endpoint.path)} alt="" className="ag-ep-icon" draggable={false} />
                </span>
                <span className="ag-ep-copy">
                  <span className="ag-ep-name">{endpoint.label}</span>
                  <span className="ag-ep-path">{endpoint.path}</span>
                </span>
              </button>
            ))}
          </div>

          <p className="ag-tip">
            ⓘ TIP: VALIDATE, TRANSLATE, ROUTE. KEEP THE CLUB SAFE.
          </p>
        </div>
      </div>

      {/* Floating alert */}
      {alert && (
        <div
          className={`ag-alert lb-floating-${alert.tone}`}
          role="status"
          aria-live="polite"
        >
          {alert.text}
        </div>
      )}

      {/* Handbook modal */}
      {handbookOpen && <ProtocolHandbookModal onClose={() => setHandbookOpen(false)} endpointOptions={endpointOptions} />}

      {/* Results overlay */}
      {state.phase !== 'playing' && (
        <div className="lb-results">
          <div className="lb-results-card">
            <div className="ag-sublevel-badge">Shift {sublevel} of 3</div>

            <div className={`lb-results-badge ${state.phase === 'won' ? 'good' : 'bad'}`}>
              {state.phase === 'won'
                ? `${levelConfig.title} — Cleared`
                : 'Shift Failed'}
            </div>

            <h2>
              {state.phase === 'won'
                ? sublevel < 3
                  ? 'Shift cleared. Ready for the next one?'
                  : 'All three shifts done. Gateway secure.'
                : 'The shift ended before you hit the target.'}
            </h2>

            <p>
              {state.phase === 'won'
                ? sublevel < 3
                  ? `You hit ${state.correctCount} correct with ${Math.round(state.reputation)}% reputation. Next shift raises the bar.`
                  : 'You read the tickets, translated what needed translating, and kept the VIP list clean.'
                : `You needed ${state.goalCount} correct at ${state.goalReputation}% rep. You got ${state.correctCount} correct at ${Math.round(state.reputation)}%.`}
            </p>

            <div className="lb-results-stats">
              <div className="lb-results-stat">
                <span>Correct</span>
                <strong>{state.correctCount}</strong>
              </div>
              <div className="lb-results-stat">
                <span>Breaches</span>
                <strong>{state.breaches}</strong>
              </div>
              <div className="lb-results-stat">
                <span>Reputation</span>
                <strong>{Math.round(state.reputation)}%</strong>
              </div>
            </div>

            <div className="lb-results-actions">
              {state.phase === 'won' && sublevel < 3 && (
                <button className="lb-panel-btn ag-next-btn" onClick={handleNextLevel} type="button">
                  Next Shift →
                </button>
              )}
              <button className="lb-panel-btn" onClick={handleRetry} type="button">
                Retry shift
              </button>
              <button className="lb-panel-btn" onClick={onBack} type="button">
                Back to roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {showCompleteModal && (
      <GameCompleteModal
        {...API_GATEWAY_COMPLETION}
        score={Math.max(0, state.correctCount * 120 + Math.round(state.reputation) * 3 - state.breaches * 80)}
        stats={[
          { label: 'Correct', value: state.correctCount },
          { label: 'Reputation', value: `${Math.round(state.reputation)}%` },
          { label: 'Breaches', value: state.breaches },
        ]}
        onPlayAgain={() => {
          setShowCompleteModal(false)
          completionSentRef.current = false
          const fresh = createInitialApiGatewayState(new Date(), Math.max(1, portraitSprites.length), 1)
          setSublevel(1)
          sublevelRef.current = 1
          stateRef.current = fresh
          setState(fresh)
          setAlert(null)
          setSelectedEndpointId(null)
        }}
        onBack={onBack}
      />
    )}
    </>
  )
}
