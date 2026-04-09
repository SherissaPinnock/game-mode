import type { Question } from '../types'

/** Full pool of tech-trivia questions. A random subset is picked each game. */
export const questions: Question[] = [
  // ── JavaScript ───────────────────────────────────────────────────────────
  {
    id: 5,
    question: 'Which of these is NOT a JavaScript framework or library?',
    options: ['React', 'Angular', 'Django', 'Vue'],
    correctIndex: 2,
    category: 'javascript',
  },
  {
    id: 9,
    question: 'Which keyword declares a block-scoped variable in JavaScript?',
    options: ['var', 'let', 'def', 'dim'],
    correctIndex: 1,
    category: 'javascript',
  },

  // ── Databases ────────────────────────────────────────────────────────────
  {
    id: 6,
    question: 'What does SQL stand for?',
    options: ['Structured Query Language', 'System Query Logic', 'Scalable Query Language', 'Structured Queue Logic'],
    correctIndex: 0,
    category: 'databases',
  },

  // ── Git ──────────────────────────────────────────────────────────────────
  {
    id: 10,
    question: 'What does "git stash" do?',
    options: ['Deletes uncommitted changes', 'Temporarily shelves uncommitted changes', 'Creates a new branch', 'Merges two branches'],
    correctIndex: 1,
    category: 'git',
  },

  // ── Cloud AWS ────────────────────────────────────────────────────────────
  {
    id: 101,
    question: 'What does EC2 stand for in AWS?',
    options: ['Elastic Compute Cloud', 'Extended Container Cluster', 'Edge Cache Configuration', 'Elastic Container Compute'],
    correctIndex: 0,
    category: 'cloud-aws',
  },
  {
    id: 102,
    question: 'Which AWS service is used to store and retrieve objects like images and files?',
    options: ['RDS', 'EC2', 'S3', 'Lambda'],
    correctIndex: 2,
    category: 'cloud-aws',
  },
  {
    id: 103,
    question: 'What is AWS Lambda?',
    options: ['A managed Kubernetes service', 'A serverless compute service that runs code on demand', 'A relational database service', 'A DNS routing service'],
    correctIndex: 1,
    category: 'cloud-aws',
  },
  {
    id: 104,
    question: 'Which AWS service provides a managed relational database?',
    options: ['DynamoDB', 'ElastiCache', 'RDS', 'Redshift'],
    correctIndex: 2,
    category: 'cloud-aws',
  },
  {
    id: 105,
    question: 'What is the purpose of an AWS IAM Role?',
    options: ['To host static websites', 'To grant permissions to AWS services and users', 'To monitor application performance', 'To load-balance traffic across instances'],
    correctIndex: 1,
    category: 'cloud-aws',
  },
  {
    id: 106,
    question: 'Which AWS service distributes content from edge locations around the world?',
    options: ['Route 53', 'CloudFront', 'Elastic Beanstalk', 'CloudWatch'],
    correctIndex: 1,
    category: 'cloud-aws',
  },
  {
    id: 107,
    question: 'AWS regions are made up of multiple what?',
    options: ['VPCs', 'S3 buckets', 'Availability Zones', 'IAM roles'],
    correctIndex: 2,
    category: 'cloud-aws',
  },
  {
    id: 108,
    question: 'Which AWS service is a fully managed NoSQL database?',
    options: ['Aurora', 'DynamoDB', 'Neptune', 'Redshift'],
    correctIndex: 1,
    category: 'cloud-aws',
  },
  {
    id: 109,
    question: 'What does SQS stand for in AWS?',
    options: ['Simple Queue Service', 'Scalable Query System', 'Secure Queue Storage', 'Simple Query Scheduler'],
    correctIndex: 0,
    category: 'cloud-aws',
  },
  {
    id: 110,
    question: 'Which service would you use to automatically scale EC2 capacity up or down?',
    options: ['Elastic Load Balancer', 'Auto Scaling', 'CloudFormation', 'Elastic Beanstalk'],
    correctIndex: 1,
    category: 'cloud-aws',
  },

  // ── DevOps ───────────────────────────────────────────────────────────────
  {
    id: 201,
    question: 'What does CI/CD stand for?',
    options: ['Code Integration / Code Deployment', 'Continuous Integration / Continuous Delivery', 'Container Image / Container Deployment', 'Compiled Integration / Compiled Distribution'],
    correctIndex: 1,
    category: 'devops',
  },
  {
    id: 202,
    question: 'Which tool is primarily used for container orchestration?',
    options: ['Ansible', 'Terraform', 'Kubernetes', 'Jenkins'],
    correctIndex: 2,
    category: 'devops',
  },
  {
    id: 203,
    question: 'What is Infrastructure as Code (IaC)?',
    options: ['Writing application code inside cloud consoles', 'Managing and provisioning infrastructure through machine-readable config files', 'Embedding infrastructure costs in code comments', 'Running code directly on bare-metal servers'],
    correctIndex: 1,
    category: 'devops',
  },
  {
    id: 204,
    question: 'Which file format does Docker use to define how an image is built?',
    options: ['docker-compose.yml', 'Dockerfile', '.dockerignore', 'container.json'],
    correctIndex: 1,
    category: 'devops',
  },
  {
    id: 205,
    question: 'In Kubernetes, what is the smallest deployable unit?',
    options: ['Node', 'Cluster', 'Pod', 'Service'],
    correctIndex: 2,
    category: 'devops',
  },
  {
    id: 206,
    question: 'What is the purpose of a load balancer?',
    options: ['Encrypt traffic between services', 'Distribute incoming traffic across multiple servers', 'Store application state', 'Monitor server CPU usage'],
    correctIndex: 1,
    category: 'devops',
  },
  {
    id: 207,
    question: 'Which Terraform command previews changes before applying them?',
    options: ['terraform apply', 'terraform validate', 'terraform plan', 'terraform init'],
    correctIndex: 2,
    category: 'devops',
  },
  {
    id: 208,
    question: 'What does a "blue-green deployment" strategy do?',
    options: ['Deploys to mobile and desktop separately', 'Runs two identical environments to enable zero-downtime releases', 'Colour-codes logs by severity', 'Splits traffic 50/50 for A/B testing'],
    correctIndex: 1,
    category: 'devops',
  },
  {
    id: 209,
    question: 'What is the role of Ansible in a DevOps pipeline?',
    options: ['Monitoring and alerting', 'Container runtime', 'Configuration management and automation', 'Source control'],
    correctIndex: 2,
    category: 'devops',
  },
  {
    id: 210,
    question: 'Which metric best indicates the health of a CI/CD pipeline?',
    options: ['Lines of code per commit', 'Mean Time to Recovery (MTTR)', 'Number of developers', 'Database query count'],
    correctIndex: 1,
    category: 'devops',
  },

  // ── Data ─────────────────────────────────────────────────────────────────
  {
    id: 301,
    question: 'What does ETL stand for in data engineering?',
    options: ['Extract, Transfer, Load', 'Extract, Transform, Load', 'Evaluate, Test, Launch', 'Encode, Transmit, Log'],
    correctIndex: 1,
    category: 'data',
  },
  {
    id: 302,
    question: 'Which of these is a columnar database well-suited for analytics?',
    options: ['MongoDB', 'Redis', 'MySQL', 'Amazon Redshift'],
    correctIndex: 3,
    category: 'data',
  },
  {
    id: 303,
    question: 'What is a data warehouse primarily used for?',
    options: ['Real-time transactional processing', 'Storing raw files and media', 'Analytical reporting across large historical datasets', 'Caching frequently accessed records'],
    correctIndex: 2,
    category: 'data',
  },
  {
    id: 304,
    question: 'Which SQL clause filters results after aggregation?',
    options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'],
    correctIndex: 2,
    category: 'data',
  },
  {
    id: 305,
    question: 'What is Apache Kafka primarily used for?',
    options: ['Relational data storage', 'Real-time event streaming and message brokering', 'Infrastructure provisioning', 'Container orchestration'],
    correctIndex: 1,
    category: 'data',
  },
  {
    id: 306,
    question: 'In machine learning, what is "overfitting"?',
    options: ['A model that trains too slowly', 'A model that performs well on training data but poorly on unseen data', 'A model with too few parameters', 'A model trained on too little data'],
    correctIndex: 1,
    category: 'data',
  },
  {
    id: 307,
    question: 'What does a PRIMARY KEY constraint enforce in a relational database?',
    options: ['Each row has a unique, non-null identifier', 'Values must reference another table', 'The column is indexed for full-text search', 'The column stores encrypted values'],
    correctIndex: 0,
    category: 'data',
  },
  {
    id: 308,
    question: 'Which file format is commonly used for big data processing due to its columnar storage?',
    options: ['CSV', 'JSON', 'Parquet', 'XML'],
    correctIndex: 2,
    category: 'data',
  },
  {
    id: 309,
    question: 'What is a data lake?',
    options: ['A structured database for transactional data', 'A centralised repository storing raw data in any format at any scale', 'A replicated cache cluster', 'A type of graph database'],
    correctIndex: 1,
    category: 'data',
  },
  {
    id: 310,
    question: 'Which Python library is the industry standard for data manipulation and analysis?',
    options: ['NumPy', 'Matplotlib', 'Pandas', 'SciPy'],
    correctIndex: 2,
    category: 'data',
  },
]
