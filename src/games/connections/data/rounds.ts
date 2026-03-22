import type { ConnectionsRound } from '../types'

/**
 * Each round has exactly 4 groups of 4 items.
 * Yellow = easiest, Purple = hardest (matching NYT Connections convention).
 */
export const rounds: ConnectionsRound[] = [
  {
    id: 1,
    groups: [
      {
        id: 'html-tags',
        category: 'HTML Semantic Tags',
        color: 'yellow',
        items: ['HEADER', 'FOOTER', 'ARTICLE', 'SECTION'],
      },
      {
        id: 'box-model',
        category: 'CSS Box Model Parts',
        color: 'green',
        items: ['MARGIN', 'PADDING', 'BORDER', 'CONTENT'],
      },
      {
        id: 'http-methods',
        category: 'HTTP Methods',
        color: 'blue',
        items: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      {
        id: 'promise-methods',
        category: 'JavaScript Promise Methods',
        color: 'purple',
        items: ['THEN', 'CATCH', 'FINALLY', 'RESOLVE'],
      },
    ],
  },
  {
    id: 2,
    groups: [
      {
        id: 'python-builtins',
        category: 'Python Built-in Functions',
        color: 'yellow',
        items: ['PRINT', 'RANGE', 'LEN', 'TYPE'],
      },
      {
        id: 'git-commands',
        category: 'Git Commands',
        color: 'green',
        items: ['COMMIT', 'PUSH', 'PULL', 'STASH'],
      },
      {
        id: 'react-hooks',
        category: 'React Hooks (drop the "use")',
        color: 'blue',
        items: ['STATE', 'EFFECT', 'REF', 'MEMO'],
      },
      {
        id: 'design-patterns',
        category: 'Design Patterns',
        color: 'purple',
        items: ['SINGLETON', 'OBSERVER', 'FACTORY', 'DECORATOR'],
      },
    ],
  },
  {
    id: 3,
    groups: [
      {
        id: 'sorting',
        category: 'Sorting Algorithms',
        color: 'yellow',
        items: ['BUBBLE', 'MERGE', 'QUICK', 'HEAP'],
      },
      {
        id: 'db-types',
        category: 'Database Types',
        color: 'green',
        items: ['RELATIONAL', 'GRAPH', 'DOCUMENT', 'COLUMNAR'],
      },
      {
        id: 'testing-types',
        category: 'Types of Software Testing',
        color: 'blue',
        items: ['UNIT', 'INTEGRATION', 'SMOKE', 'REGRESSION'],
      },
      {
        id: 'agile',
        category: 'Agile Ceremonies',
        color: 'purple',
        items: ['STANDUP', 'RETROSPECTIVE', 'PLANNING', 'REVIEW'],
      },
    ],
  },
]
