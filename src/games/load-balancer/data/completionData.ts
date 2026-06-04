import type { GameCompletionData } from '@/components/GameCompleteModal'

export const LOAD_BALANCER_COMPLETION: Omit<GameCompletionData, 'score' | 'stats'> = {
  gameEmoji: '🪩',
  gameName: 'The Load Balancer',
  tagline: 'Club Nexus stayed online. Traffic distributed, servers alive.',
  keyLearnings: [
    'A load balancer distributes incoming requests across multiple servers so no single machine gets overwhelmed.',
    'Round-robin and load-aware routing prevent hotspots — always spread traffic before one server starts lagging.',
    'Server crashes chain-react. One overloaded node adds pressure to the others, triggering a cascade failure.',
    'Reputation tracks system health over time — consistent balance earns bonuses, traffic spikes damage the whole club.',
  ],
  devRelevance: 'Load balancing is how every high-traffic production system stays up. Platforms like AWS ELB, NGINX, and HAProxy use the same core logic you just played — when a service cannot scale vertically, you spread the load horizontally, and the balancer is what makes that invisible to the user.',
  nextHint: 'Up next: API Gateway — validate, inspect, and route traffic before it ever hits a service.',
}

export const API_GATEWAY_COMPLETION: Omit<GameCompletionData, 'score' | 'stats'> = {
  gameEmoji: '🚪',
  gameName: 'API Gateway',
  tagline: 'All three shifts cleared. Gateway secured.',
  keyLearnings: [
    'An API gateway is the single entry point for all client traffic — it validates, routes, and protects before requests ever reach a service.',
    'API keys carry expiry dates. Accepting expired credentials is a real security breach, not just a game mechanic.',
    'Binary payloads must be decoded and inspected before routing — never forward raw data you have not read.',
    'Rate limiting and IP blocking are core gateway features. A flood source that gets through can saturate your entire backend.',
    'Guest lists are access control lists. The same logic powers roles, permissions, and OAuth scopes in real systems.',
  ],
  devRelevance: 'API gateways like AWS API Gateway, Kong, and Apigee centralise auth, rate limiting, and routing so individual services do not have to implement it themselves. Every request to a production REST or GraphQL API passes through one. The pattern you just ran — validate identity, inspect payload, route to the right service — is the same one running at Netflix, Stripe, and every major platform you use daily.',
}
