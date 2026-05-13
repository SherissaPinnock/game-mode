import type { RoadmapLevel } from '@/components/LearningRoadmap'

export const GAME_ID = 'load-balancer'

export const LOAD_BALANCER_LEVELS: RoadmapLevel[] = [
  {
    id: 'load-balancer',
    title: 'Load Balancer',
    subtitle: 'Route the nightclub rush across three live servers',
    icon: '🪩',
    conceptTitle: 'Why Load Balancers Matter',
    conceptBody: 'A load balancer spreads incoming traffic across multiple backend servers so no single machine gets slammed while the others sit idle.',
    conceptHighlight: 'Balanced traffic keeps latency down, prevents crashes, and makes the whole system feel smoother to users.',
  },
  {
    id: 'reverse-proxy',
    title: 'Reverse Proxy',
    subtitle: 'Shield the club entrance and smooth request flow',
    icon: '🛡️',
    conceptTitle: 'Reverse Proxies',
    conceptBody: 'A reverse proxy sits in front of your backend, forwarding requests, hiding internals, and helping with TLS termination, caching, and smarter routing.',
    conceptHighlight: 'One clean front door can protect many services behind it.',
  },
  {
    id: 'api-gateway',
    title: 'API Gateway',
    subtitle: 'Coordinate the full service lineup',
    icon: '🚪',
    conceptTitle: 'API Gateways',
    conceptBody: 'An API gateway centralises auth, rate limits, and request orchestration for multiple services so clients hit one entry point instead of a tangled mesh.',
    conceptHighlight: 'Gateways turn a cluster of services into a cleaner platform experience.',
  },
]
