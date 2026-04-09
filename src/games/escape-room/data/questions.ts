import type { AWSQuestion } from '../types'

export const QUESTIONS: AWSQuestion[] = [
  // ── Study: CloudFormation / IaC ──────────────────────────────────
  {
    id: 'study-1',
    roomId: 'study',
    text: 'What is the primary file format used to write AWS CloudFormation templates?',
    options: ['XML', 'JSON or YAML', 'TOML', 'INI'],
    correctIndex: 1,
  },
  {
    id: 'study-2',
    roomId: 'study',
    text: 'In CloudFormation, what section declares the AWS resources you want to provision?',
    options: ['Parameters', 'Outputs', 'Resources', 'Mappings'],
    correctIndex: 2,
  },
  {
    id: 'study-3',
    roomId: 'study',
    text: 'Which CloudFormation feature lets you reuse a template by passing variable inputs at stack creation?',
    options: ['Outputs', 'Parameters', 'Conditions', 'Metadata'],
    correctIndex: 1,
  },

  // ── Hall: IAM ────────────────────────────────────────────────────
  {
    id: 'hall-1',
    roomId: 'hall',
    text: 'What AWS IAM entity represents an application or service that needs to call AWS APIs?',
    options: ['IAM User', 'IAM Group', 'IAM Role', 'IAM Policy'],
    correctIndex: 2,
  },
  {
    id: 'hall-2',
    roomId: 'hall',
    text: 'Which IAM policy type is attached directly to an AWS resource (e.g. S3 bucket)?',
    options: ['Identity-based policy', 'Resource-based policy', 'Service control policy', 'Permission boundary'],
    correctIndex: 1,
  },
  {
    id: 'hall-3',
    roomId: 'hall',
    text: 'What does the IAM principle of least privilege mean?',
    options: [
      'Grant all permissions by default',
      'Grant only the permissions required to perform a task',
      'Use root account for all operations',
      'Disable MFA for easier access',
    ],
    correctIndex: 1,
  },

  // ── Living Room: CloudFront / CDN ────────────────────────────────
  {
    id: 'living-room-1',
    roomId: 'living-room',
    text: 'What is AWS CloudFront primarily used for?',
    options: [
      'Running containerized workloads',
      'Distributing content globally via edge locations',
      'Managing relational databases',
      'Automating infrastructure deployments',
    ],
    correctIndex: 1,
  },
  {
    id: 'living-room-2',
    roomId: 'living-room',
    text: 'What is a CloudFront "origin"?',
    options: [
      'An edge location near the user',
      'The original source of the content CloudFront caches',
      'A security group rule',
      'A Lambda@Edge function',
    ],
    correctIndex: 1,
  },
  {
    id: 'living-room-3',
    roomId: 'living-room',
    text: 'Which CloudFront feature lets you run code at edge locations without managing servers?',
    options: ['CloudFront Functions / Lambda@Edge', 'CloudTrail', 'AWS WAF', 'Route 53'],
    correctIndex: 0,
  },

  // ── Library: S3 ─────────────────────────────────────────────────
  {
    id: 'library-1',
    roomId: 'library',
    text: 'What is the maximum size of a single object stored in Amazon S3?',
    options: ['5 GB', '50 GB', '5 TB', '500 GB'],
    correctIndex: 2,
  },
  {
    id: 'library-2',
    roomId: 'library',
    text: 'Which S3 storage class is best for infrequently accessed data that needs millisecond retrieval?',
    options: ['S3 Standard', 'S3 Glacier', 'S3 Standard-IA', 'S3 Intelligent-Tiering'],
    correctIndex: 2,
  },
  {
    id: 'library-3',
    roomId: 'library',
    text: 'What S3 feature generates a time-limited URL allowing public access to a private object?',
    options: ['Bucket policy', 'ACL', 'Pre-signed URL', 'Transfer Acceleration'],
    correctIndex: 2,
  },

  // ── Dining Room: RDS ─────────────────────────────────────────────
  {
    id: 'dining-room-1',
    roomId: 'dining-room',
    text: 'Which of the following database engines is NOT supported by Amazon RDS?',
    options: ['MySQL', 'PostgreSQL', 'MongoDB', 'Oracle'],
    correctIndex: 2,
  },
  {
    id: 'dining-room-2',
    roomId: 'dining-room',
    text: 'What RDS feature automatically creates a standby replica in a different AZ for high availability?',
    options: ['Read Replica', 'Multi-AZ Deployment', 'RDS Proxy', 'Aurora Serverless'],
    correctIndex: 1,
  },
  {
    id: 'dining-room-3',
    roomId: 'dining-room',
    text: 'What is the purpose of an RDS Read Replica?',
    options: [
      'Provide automatic failover in case of primary failure',
      'Scale out read-heavy database workloads',
      'Encrypt data at rest',
      'Run database schema migrations',
    ],
    correctIndex: 1,
  },

  // ── Billiard Room: EC2 ───────────────────────────────────────────
  {
    id: 'billiard-room-1',
    roomId: 'billiard-room',
    text: 'Which EC2 pricing model offers the largest discount in exchange for a 1- or 3-year commitment?',
    options: ['On-Demand', 'Spot Instances', 'Reserved Instances', 'Dedicated Hosts'],
    correctIndex: 2,
  },
  {
    id: 'billiard-room-2',
    roomId: 'billiard-room',
    text: 'What is an Amazon Machine Image (AMI)?',
    options: [
      'A network interface attached to an EC2 instance',
      'A pre-configured template used to launch EC2 instances',
      'A type of EBS volume',
      'An IAM role for EC2',
    ],
    correctIndex: 1,
  },
  {
    id: 'billiard-room-3',
    roomId: 'billiard-room',
    text: 'Which EC2 storage type provides the highest IOPS performance attached directly to the host?',
    options: ['Amazon S3', 'Amazon EFS', 'Instance Store', 'Amazon EBS'],
    correctIndex: 2,
  },

  // ── Gallery: SQS / Messaging ─────────────────────────────────────
  {
    id: 'gallery-1',
    roomId: 'gallery',
    text: 'What is the maximum message retention period for Amazon SQS?',
    options: ['1 day', '7 days', '14 days', '30 days'],
    correctIndex: 2,
  },
  {
    id: 'gallery-2',
    roomId: 'gallery',
    text: 'What type of SQS queue guarantees that messages are processed exactly once and in order?',
    options: ['Standard Queue', 'Dead-letter Queue', 'FIFO Queue', 'Delay Queue'],
    correctIndex: 2,
  },
  {
    id: 'gallery-3',
    roomId: 'gallery',
    text: 'What does the SQS "Visibility Timeout" control?',
    options: [
      'How long a message is retained if not deleted',
      'How long a received message is hidden from other consumers',
      'The maximum message size',
      'The delay before a message is first available',
    ],
    correctIndex: 1,
  },

  // ── Ballroom: Lambda / Serverless ────────────────────────────────
  {
    id: 'ballroom-1',
    roomId: 'ballroom',
    text: 'What is the maximum execution timeout for a single AWS Lambda function invocation?',
    options: ['1 minute', '5 minutes', '15 minutes', '60 minutes'],
    correctIndex: 2,
  },
  {
    id: 'ballroom-2',
    roomId: 'ballroom',
    text: 'Which Lambda invocation type is asynchronous and does NOT wait for the function to complete?',
    options: ['RequestResponse', 'Event', 'DryRun', 'Synchronous'],
    correctIndex: 1,
  },
  {
    id: 'ballroom-3',
    roomId: 'ballroom',
    text: 'What triggers a Lambda "cold start"?',
    options: [
      'The function receives too many requests',
      'A new execution environment is initialized for the function',
      'The function runs out of memory',
      'The IAM role is updated',
    ],
    correctIndex: 1,
  },

  // ── Kitchen: ALB / Auto Scaling ──────────────────────────────────
  {
    id: 'kitchen-1',
    roomId: 'kitchen',
    text: 'Which AWS load balancer operates at the HTTP/HTTPS layer (Layer 7)?',
    options: ['Classic Load Balancer', 'Network Load Balancer', 'Application Load Balancer', 'Gateway Load Balancer'],
    correctIndex: 2,
  },
  {
    id: 'kitchen-2',
    roomId: 'kitchen',
    text: 'What Auto Scaling policy triggers scaling based on a specific CloudWatch metric threshold?',
    options: ['Scheduled scaling', 'Predictive scaling', 'Step/Simple scaling', 'Manual scaling'],
    correctIndex: 2,
  },
  {
    id: 'kitchen-3',
    roomId: 'kitchen',
    text: 'What is the purpose of a "cooldown period" in Auto Scaling?',
    options: [
      'To warm up new instances before traffic arrives',
      'To prevent rapid successive scaling actions',
      'To delay the first scaling event after launch',
      'To reduce costs by keeping fewer instances',
    ],
    correctIndex: 1,
  },
]
