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
    title: 'The Index Vault',
    subtitle: 'Speed up queries with smart indexing',
    icon: '🗂️',
    conceptTitle: 'Database Indexing',
    conceptBody: 'Without an index, every query scans every row — like reading an entire book to find one word. An index is a sorted lookup structure that lets the database jump straight to the rows you need, skipping everything else.',
    conceptHighlight: 'A full table scan on 10 million rows can take seconds. The same query with the right index runs in milliseconds.',
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
