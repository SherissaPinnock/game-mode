import type { RoadmapLevel } from '@/components/LearningRoadmap'

export const GAME_ID = 'db-quest'

export const DB_LEVELS: RoadmapLevel[] = [
  {
    id: 'normalization',
    title: 'Redundancy Riot',
    subtitle: 'Tame the messy warehouse ledger',
    icon: '📋',
    conceptTitle: 'Database Normalization (1NF → 3NF)',
    conceptBody: 'A table that stores everything in one place creates chaos. Changing one customer\'s address means updating hundreds of rows — miss one and your data is corrupted. Normalization splits your data into focused tables connected by foreign keys so every fact lives in exactly one place.',
    conceptHighlight: 'The golden rule: every piece of data should be stored in exactly one place. Repeated values across rows is a red flag your schema needs splitting.',
  },
  {
    id: 'indexing',
    title: 'City Planner',
    subtitle: 'Build the right index for each city query',
    icon: '🗂️',
    conceptTitle: 'Database Indexing',
    conceptBody: 'Without an index, every query scans row after row like a clerk walking every street in town. An index is a fast lookup path that lets the database jump to the right slice of data first.',
    conceptHighlight: 'Composite indexes read left to right. Put equality filters first, and range filters like `>` after them whenever possible.',
  },
  {
    id: 'ctes',
    title: 'The Query Chain',
    subtitle: 'Untangle nested queries with CTEs',
    icon: '🔗',
    conceptTitle: 'Common Table Expressions (CTEs)',
    conceptBody: 'A CTE (WITH clause) is a named temporary result set you reference within a query. Instead of nesting subquery inside subquery, CTEs let you build logic step by step — readable, reusable, and easy to debug.',
    conceptHighlight: 'CTEs make complex SQL self-documenting. Break a 10-level nested query into named steps and any teammate can follow the logic.',
  },
]
