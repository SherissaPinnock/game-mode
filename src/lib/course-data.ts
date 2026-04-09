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
  ],
  networking: [
    { title: 'HTTP & Web Protocols', description: 'HTTP methods, status codes, REST, WebSockets', url: 'https://www.intellibus.academy/learning-paths/amazon-route' },
  ],
  'cloud-aws': [
    { title: 'AWS Cloud Practitioner', description: 'EC2, S3, Lambda, IAM fundamentals', url: 'https://www.intellibus.academy/learning-paths/amazon-s3' },
  ],
  scaling: [
    { title: 'System Scaling Strategies', description: 'Horizontal vs vertical, load balancing, caching', url: 'https://www.intellibus.academy/learning-paths/aws-loadbalancing' },
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
  ],

  'web development' : [
    { title: 'Next.js Fundamentals', description: 'Frontend, backend, databases, deployment', url: 'https://www.intellibus.academy/learning-paths/nextjs-evolution' },
    { title: 'Nest JS', description: 'Frontend, backend, databases, deployment', url: 'https://www.intellibus.academy/learning-paths/nestjs-sanctuary' },
  ],
  'C#': [
    { title: 'C# for Beginners', description: 'Syntax, OOP, LINQ, async programming', url: 'https://www.intellibus.academy/learning-paths/csharp-architecture' },
  ],
  other: [
    { title: 'General Programming Concepts', description: 'Algorithms, data structures, design patterns', url: 'https://www.intellibus.academy/learning-paths' },
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
  data: 'Data',
  'web development': 'Web Development',
  'C#': 'C#',
  other: 'Other',
}
