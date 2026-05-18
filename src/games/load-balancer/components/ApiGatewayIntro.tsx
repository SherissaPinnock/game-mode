import { useState } from 'react'
import { DJBytebeatIntro } from './DJBytebeatIntro'

const CONCEPT_SCRIPT: string[] = [
  'Welcome to Club Nexus Protocol Division.',
  'Before your shift starts, let me school you on what an API Gateway actually IS.',
  'Think of it like the VIP entrance to a nightclub — but for network traffic.',
  'Every request hitting your system has to pass through the gateway first. No exceptions.',
  'The gateway checks: Is your API key valid? Has it expired? Are you who you claim to be?',
  'It also spots spam — bots and bad actors hammering the system with fake requests. Your job is to BLOCK them.',
  'Legit requests get routed to the right backend: Arcade, Bar, or Dancefloor.',
  'Without a gateway, any random request hits your servers directly. Total chaos.',
  'With a gateway? Only verified, authenticated traffic gets through.',
  'Bad gateways leak spam, let in expired keys, and crash the whole venue.',
  'Good gateways keep things fast, clean, and online.',
  'You ARE the gateway tonight. Know your role.',
]

const TUTORIAL_SCRIPT: string[] = [
  "Alright rookie, here's your control panel breakdown.",
  'LEFT — the ENTRY TICKET. Name alias, endpoint destination, and API key with an expiry date.',
  'If that expiry date is in the past? REJECT. No expired passes in Club Nexus.',
  'CENTER — the CCTV FEED. Live portrait of whoever is at the door. Read their energy.',
  'RIGHT — your STAT PANELS. Reputation score, time remaining, and correct handles toward your shift goal.',
  'You need to hit the correct-handle goal AND keep reputation above the minimum. Both. Or you fail.',
  'In Shift 3, a VIP GUEST LIST appears on the ticket. Someone claiming VIP? Check the list.',
  "Name not on it? That's a crasher. REJECT them — do NOT let them through.",
  'BOTTOM ROW — your action buttons. ACCEPT routes them in. REJECT turns them away. BLOCK flags spam.',
  "Spam requests are binary — all zeros and ones for an alias. Easy to spot once you've seen one.",
  'Time is always ticking. The queue builds up. Stay sharp.',
  "Your shift starts now. Don't choke.",
]

type Phase = 'concept' | 'tutorial'

interface ApiGatewayIntroProps {
  narratorSrc: string
  backgroundSrc: string
  onBack: () => void
  onStart: () => void
  musicMuted: boolean
  onToggleMusic: () => void
}

export function ApiGatewayIntro({
  narratorSrc,
  backgroundSrc,
  onBack,
  onStart,
  musicMuted,
  onToggleMusic,
}: ApiGatewayIntroProps) {
  const [phase, setPhase] = useState<Phase>('concept')

  if (phase === 'concept') {
    return (
      <DJBytebeatIntro
        narratorSrc={narratorSrc}
        backgroundSrc={backgroundSrc}
        onBack={onBack}
        onStart={() => setPhase('tutorial')}
        musicMuted={musicMuted}
        onToggleMusic={onToggleMusic}
        script={CONCEPT_SCRIPT}
        levelTitle="Level 2: API Gateway"
        phaseLabel="What is an API Gateway?"
        onSkipAll={onStart}
      />
    )
  }

  return (
    <DJBytebeatIntro
      narratorSrc={narratorSrc}
      backgroundSrc={backgroundSrc}
      onBack={() => setPhase('concept')}
      onStart={onStart}
      musicMuted={musicMuted}
      onToggleMusic={onToggleMusic}
      script={TUTORIAL_SCRIPT}
      levelTitle="Level 2: API Gateway"
      phaseLabel="Control Panel Briefing"
      onSkipAll={onStart}
    />
  )
}
