import type { ConnectionsRound } from '../types'

/**
 * Each round has exactly 4 groups of 4 items.
 * Yellow = easiest, Purple = hardest (matching NYT Connections convention).
 */
export const rounds: ConnectionsRound[] = [
  // ── Round 1: Web fundamentals ─────────────────────────────────────────────
  {
    id: 1,
    groups: [
      {
        id: 'git-commands',
        category: 'Git Commands',
        color: 'yellow',
        items: ['COMMIT', 'PUSH', 'PULL', 'STASH'],
        topic: 'git',
      },
      {
        id: 'promise-methods',
        category: 'JavaScript Promise Methods',
        color: 'green',
        items: ['THEN', 'CATCH', 'FINALLY', 'RESOLVE'],
        topic: 'javascript',
      },
      {
        id: 'git-commands',
        category: 'Git Commands',
        color: 'blue',
        items: ['COMMIT', 'PUSH', 'PULL', 'STASH'],
        topic: 'git',
      },
      {
        id: 'db-types',
        category: 'Database Types',
        color: 'purple',
        items: ['RELATIONAL', 'GRAPH', 'DOCUMENT', 'COLUMNAR'],
        topic: 'databases',
      },
    ],
  },

  // ── Round 2: Languages & frameworks ──────────────────────────────────────
  {
    id: 2,
    groups: [
      {
        id: 'python-builtins',
        category: 'Python Built-in Functions',
        color: 'yellow',
        items: ['PRINT', 'RANGE', 'LEN', 'TYPE'],
        topic: 'python',
      },
      {
        id: 'react-hooks',
        category: 'React Hooks (drop the "use")',
        color: 'green',
        items: ['STATE', 'EFFECT', 'REF', 'MEMO'],
        topic: 'react',
      },
      {
        id: 'python-data-types',
        category: 'Python Data Types',
        color: 'blue',
        items: ['LIST', 'DICT', 'TUPLE', 'SET'],
        topic: 'python',
      },
      {
        id: 'sql-clauses',
        category: 'SQL Clauses',
        color: 'purple',
        items: ['SELECT', 'WHERE', 'HAVING', 'JOIN'],
        topic: 'databases',
      },
    ],
  },

  // ── Round 3: Cloud AWS ────────────────────────────────────────────────────
  {
    id: 3,
    groups: [
      {
        id: 'aws-compute',
        category: 'AWS Compute Services',
        color: 'yellow',
        items: ['EC2', 'LAMBDA', 'ECS', 'FARGATE'],
        topic: 'cloud-aws',
      },
      {
        id: 'aws-storage',
        category: 'AWS Storage Services',
        color: 'green',
        items: ['S3', 'EBS', 'EFS', 'GLACIER'],
        topic: 'cloud-aws',
      },
      {
        id: 'aws-database',
        category: 'AWS Database Services',
        color: 'blue',
        items: ['RDS', 'DYNAMODB', 'AURORA', 'ELASTICACHE'],
        topic: 'cloud-aws',
      },
      {
        id: 'aws-networking',
        category: 'AWS Networking Services',
        color: 'purple',
        items: ['VPC', 'ROUTE53', 'CLOUDFRONT', 'API GATEWAY'],
        topic: 'cloud-aws',
      },
    ],
  },

  // ── Round 4: DevOps ───────────────────────────────────────────────────────
  {
    id: 4,
    groups: [
      {
        id: 'docker-concepts',
        category: 'Docker Concepts',
        color: 'yellow',
        items: ['IMAGE', 'CONTAINER', 'VOLUME', 'REGISTRY'],
        topic: 'devops',
      },
      {
        id: 'k8s-objects',
        category: 'Kubernetes Objects',
        color: 'green',
        items: ['POD', 'SERVICE', 'INGRESS', 'DEPLOYMENT'],
        topic: 'devops',
      },
      {
        id: 'cicd-stages',
        category: 'CI/CD Pipeline Stages',
        color: 'blue',
        items: ['BUILD', 'TEST', 'RELEASE', 'DEPLOY'],
        topic: 'devops',
      },
      {
        id: 'iac-tools',
        category: 'Infrastructure as Code Tools',
        color: 'purple',
        items: ['TERRAFORM', 'ANSIBLE', 'PULUMI', 'CLOUDFORMATION'],
        topic: 'devops',
      },
    ],
  },

  // ── Round 5: Data ─────────────────────────────────────────────────────────
  {
    id: 5,
    groups: [
      {
        id: 'etl-steps',
        category: 'ETL Pipeline Steps',
        color: 'yellow',
        items: ['EXTRACT', 'TRANSFORM', 'LOAD', 'VALIDATE'],
        topic: 'data',
      },
      {
        id: 'data-file-formats',
        category: 'Big Data File Formats',
        color: 'green',
        items: ['PARQUET', 'AVRO', 'ORC', 'DELTA'],
        topic: 'data',
      },
      {
        id: 'streaming-tools',
        category: 'Data Streaming & Messaging Tools',
        color: 'blue',
        items: ['KAFKA', 'KINESIS', 'PUBSUB', 'RABBITMQ'],
        topic: 'data',
      },
      {
        id: 'ml-concepts',
        category: 'Machine Learning Concepts',
        color: 'purple',
        items: ['OVERFITTING', 'PRECISION', 'RECALL', 'EPOCH'],
        topic: 'data',
      },
    ],
  },

  // ── Round 6: Mixed cloud & devops ─────────────────────────────────────────
  {
    id: 6,
    groups: [
      {
        id: 'aws-iam',
        category: 'AWS IAM Concepts',
        color: 'yellow',
        items: ['USER', 'ROLE', 'POLICY', 'GROUP'],
        topic: 'cloud-aws',
      },
      {
        id: 'devops-metrics',
        category: 'DevOps Key Metrics (DORA)',
        color: 'green',
        items: ['LEAD TIME', 'DEPLOY FREQ', 'MTTR', 'CHANGE FAIL'],
        topic: 'devops',
      },
      {
        id: 'observability-pillars',
        category: 'Observability Pillars',
        color: 'blue',
        items: ['LOGS', 'METRICS', 'TRACES', 'ALERTS'],
        topic: 'devops',
      },
      {
        id: 'data-warehouse-concepts',
        category: 'Data Warehouse Concepts',
        color: 'purple',
        items: ['FACT TABLE', 'DIMENSION', 'STAR SCHEMA', 'SNOWFLAKE'],
        topic: 'data',
      },
    ],
  },
]
