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
  'html-css': [
    { title: 'HTML & CSS Fundamentals', description: 'Semantic HTML, box model, flexbox, grid', url: '#html-css-course' },
    { title: 'CSS Layout Mastery', description: 'Responsive design and modern CSS techniques', url: '#css-layout-course' },
  ],
  javascript: [
    { title: 'JavaScript Deep Dive', description: 'Closures, scope, prototypes, async patterns', url: 'https://www.intellibus.academy/learning-paths/javascript-time-travel' },
    { title: 'Modern JS (ES6+)', description: 'Arrow functions, destructuring, modules, promises', url: '#modern-js-course' },
  ],
  'data-structures': [
    { title: 'Data Structures & Algorithms', description: 'Arrays, linked lists, trees, hash maps', url: '#dsa-course' },
    { title: 'Big O Notation', description: 'Time and space complexity analysis', url: '#big-o-course' },
  ],
  networking: [
    { title: 'HTTP & Web Protocols', description: 'HTTP methods, status codes, REST, WebSockets', url: '#http-course' },
    { title: 'API Design', description: 'RESTful APIs, authentication, rate limiting', url: '#api-design-course' },
  ],
  'cloud-aws': [
    { title: 'AWS Cloud Practitioner', description: 'EC2, S3, Lambda, IAM fundamentals', url: '#aws-cloud-course' },
    { title: 'Cloud Architecture Basics', description: 'Regions, availability zones, managed services', url: '#cloud-arch-course' },
  ],
  scaling: [
    { title: 'System Scaling Strategies', description: 'Horizontal vs vertical, load balancing, caching', url: '#scaling-course' },
    { title: 'High Availability Design', description: 'Redundancy, failover, auto-scaling groups', url: '#ha-course' },
  ],
  devops: [
    { title: 'Docker & Containers', description: 'Containerization, images, volumes, networking', url: 'https://www.intellibus.academy/learning-paths/docker-universe' },
    { title: 'Kubernetes Essentials', description: 'Pods, services, deployments, orchestration', url: '#k8s-course' },
  ],
  databases: [
    { title: 'SQL Fundamentals', description: 'Queries, joins, indexes, normalization', url: 'https://www.intellibus.academy/learning-paths/sql-sovereignty' },
    { title: 'Database Design', description: 'Relational vs NoSQL, schema design, transactions', url: '#db-design-course' },
  ],
  security: [
    { title: 'Web Security Basics', description: 'HTTPS, CORS, XSS, CSRF, authentication', url: '#security-course' },
    { title: 'Auth & Authorization', description: 'OAuth, JWT, session management', url: '#auth-course' },
  ],
  architecture: [
    { title: 'System Design Fundamentals', description: 'Monoliths, microservices, event-driven design', url: '#sysdesign-course' },
    { title: 'Architecture Patterns', description: 'Load balancers, CDN, message queues, caching layers', url: 'https://www.intellibus.academy/learning-paths/aws-loadbalancing' },
  ],
  git: [
    { title: 'Git Mastery', description: 'Branching, rebasing, merge strategies, workflows', url: '#git-course' },
  ],
  testing: [
    { title: 'Testing Fundamentals', description: 'Unit, integration, E2E, TDD methodology', url: '#testing-course' },
  ],
  react: [
    { title: 'React Deep Dive', description: 'Hooks, state management, performance optimization', url: 'https://www.intellibus.academy/learning-paths/react-constellation' },
    { title: 'React Patterns', description: 'Compound components, render props, custom hooks', url: '#react-patterns-course' },
  ],
  algorithms: [
    { title: 'Sorting & Searching', description: 'Bubble, merge, quick sort, binary search', url: '#algorithms-course' },
  ],
  python: [
    { title: 'Python Essentials', description: 'Built-ins, data types, list comprehensions', url: '#python-course' },
  ],
  agile: [
    { title: 'Agile & Scrum', description: 'Ceremonies, sprints, user stories, retrospectives', url: '#agile-course' },
  ],
  'design-patterns': [
    { title: 'Design Patterns', description: 'Singleton, Observer, Factory, Strategy, Decorator', url: '#patterns-course' },
  ],
}

/** Human-readable display names for each category. */
export const CATEGORY_LABELS: Record<Category, string> = {
  'html-css': 'HTML & CSS',
  javascript: 'JavaScript',
  'data-structures': 'Data Structures',
  networking: 'Networking & HTTP',
  'cloud-aws': 'Cloud & AWS',
  scaling: 'Scaling',
  devops: 'DevOps',
  databases: 'Databases',
  security: 'Security',
  architecture: 'System Architecture',
  git: 'Git',
  testing: 'Testing',
  react: 'React',
  algorithms: 'Algorithms',
  python: 'Python',
  agile: 'Agile',
  'design-patterns': 'Design Patterns',
}
