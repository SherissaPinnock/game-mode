import type { Category } from './performance'

/**
 * ─── Course Recommendation Data ─────────────────────────────────────────────
 *
 * Edit this file to add/update course links for each category.
 * Each category maps to an array of courses that will be recommended
 * when a player scores below 70% in that topic.
 *
 * Replace the placeholder `#` URLs with real course links.
 */

export interface CourseLink {
  title: string
  description: string
  url: string
}

export const COURSE_MAP: Record<Category, CourseLink[]> = {

  javascript: [
    { title: 'JavaScript Deep Dive', description: 'Closures, scope, prototypes, async patterns', url: 'https://www.intellibus.academy/learning-paths/javascript-time-travel' },
    { title: 'Modern JS (ES6+)', description: 'Arrow functions, destructuring, modules, promises', url: '#modern-js-course' },
  ],
  networking: [
    { title: 'HTTP & Web Protocols', description: 'HTTP methods, status codes, REST, WebSockets', url: '#http-course' },
    { title: 'API Design', description: 'RESTful APIs, authentication, rate limiting', url: '#api-design-course' },
  ],
  'cloud-aws': [
    { title: 'AWS Cloud Practitioner', description: 'EC2, S3, Lambda, IAM fundamentals', url: '#aws-cloud-course' },
  ],
  scaling: [
    { title: 'System Scaling Strategies', description: 'Horizontal vs vertical, load balancing, caching', url: '#scaling-course' },
    { title: 'High Availability Design', description: 'Redundancy, failover, auto-scaling groups', url: '#ha-course' },
  ],
  devops: [
    { title: 'Docker & Containers', description: 'Containerization, images, volumes, networking', url: 'https://www.intellibus.academy/learning-paths/docker-universe' },
  ],
  databases: [
    { title: 'SQL Fundamentals', description: 'Queries, joins, indexes, normalization', url: 'https://www.intellibus.academy/learning-paths/sql-sovereignty' },
  ],
  security: [
    { title: 'Web Security Basics', description: 'HTTPS, CORS, XSS, CSRF, authentication', url: 'https://www.intellibus.academy/learning-paths/aws-securitygroups#' },
    { title: 'Auth & Authorization', description: 'OAuth, JWT, session management', url: '#auth-course' },
  ],
  architecture: [
    { title: 'Architecture Patterns', description: 'Load balancers, CDN, message queues, caching layers', url: 'https://www.intellibus.academy/learning-paths/aws-loadbalancing' },
  ],
  git: [
    { title: 'Git Mastery', description: 'Branching, rebasing, merge strategies, workflows', url: 'https://www.intellibus.academy/learning-paths/git-as-a-time-machine' },
  ],
  react: [
    { title: 'React Deep Dive', description: 'Hooks, state management, performance optimization', url: 'https://www.intellibus.academy/learning-paths/react-constellation' },
  ],
  python: [
    { title: 'Python Essentials', description: 'Built-ins, data types, list comprehensions', url: 'https://www.intellibus.academy/learning-paths/python-ascendancy' },
  ],
  data: [
    {title: "Data Essentials", description: '', url:''}
  ],
  
  prompting: [
    { title: 'Prompt Engineering Guide', description: 'Roles, constraints, format control, chain-of-thought techniques', url: 'https://www.intellibus.academy/learning-paths/hugging-face' },
    { title: 'Advanced Prompting Patterns', description: 'Few-shot examples, structured outputs, and evaluation strategies', url: '#advanced-prompting-course' },
  ],
}

/** Human-readable display names for each category. */
export const CATEGORY_LABELS: Record<Category, string> = {
  javascript: 'JavaScript',
  networking: 'Networking & HTTP',
  'cloud-aws': 'Cloud & AWS',
  scaling: 'Scaling',
  devops: 'DevOps',
  databases: 'Databases',
  security: 'Security',
  architecture: 'System Architecture',
  git: 'Git',
  react: 'React',
  python: 'Python',
  prompting: 'Prompt Engineering',
  data: 'Data'
}
