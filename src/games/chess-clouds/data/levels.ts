export interface Question {
  q: string
  options: string[]
  answer: number // 0-indexed
  explanation: string
}

export interface CaptureTarget {
  piece: 'p' | 'r' | 'b' | 'n' | 'q'
  count: number
  label: string
  emoji: string
}

export interface Level {
  id: number
  title: string
  missionName: string
  topic: string
  accentColor: string
  bgFrom: string
  bgTo: string
  intro: {
    headline: string
    body: string
    concepts: { icon: string; title: string; body: string }[]
  }
  fen: string
  missionBrief: string
  targets: CaptureTarget[]
  questions: Question[]
  victoryLine: string
}

export const LEVELS: Level[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // LEVEL 1 — Cloud Fundamentals
  // White: Ra1, Qd1, Ke1, Rh1
  // Black: Kf8, Rc4, Be5, Pb5, Pf5
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 1,
    title: 'Storm the Region',
    missionName: 'Cloud Fundamentals',
    topic: 'Cloud Computing Basics',
    accentColor: '#38bdf8',
    bgFrom: '#0f172a',
    bgTo: '#0c4a6e',
    intro: {
      headline: 'Welcome to the Cloud',
      body: 'Cloud computing delivers computing services — servers, storage, databases, networking — over the internet. Instead of owning hardware, you rent capacity from providers like AWS, Azure, or GCP.',
      concepts: [
        { icon: '🏗️', title: 'IaaS', body: 'Infrastructure as a Service — you manage OS, runtime, apps. The provider manages hardware. (e.g. AWS EC2)' },
        { icon: '🧩', title: 'PaaS', body: 'Platform as a Service — provider manages everything except your application code. (e.g. Heroku, Google App Engine)' },
        { icon: '☁️', title: 'SaaS', body: 'Software as a Service — fully managed software you just use. (e.g. Gmail, Salesforce)' },
        { icon: '🌍', title: 'Regions & AZs', body: 'Cloud providers split infrastructure into geographic Regions, each with multiple isolated Availability Zones for fault tolerance.' },
      ],
    },
    fen: '5k2/8/8/1p2bp2/2r5/8/8/R2QK2R w KQ - 0 1',
    missionBrief: 'Capture the enemy Rook, Bishop, and both Pawns — but to strike, you must prove your cloud knowledge!',
    targets: [
      { piece: 'r', count: 1, label: 'Rook',   emoji: '♜' },
      { piece: 'b', count: 1, label: 'Bishop', emoji: '♝' },
      { piece: 'p', count: 2, label: 'Pawns',  emoji: '♟' },
    ],
    questions: [
      {
        q: 'What does IaaS stand for?',
        options: ['Internet as a Service', 'Infrastructure as a Service', 'Integration as a Service', 'Instance as a Service'],
        answer: 1,
        explanation: 'IaaS (Infrastructure as a Service) gives you raw compute, storage and networking. You manage the OS and above.',
      },
      {
        q: 'Which of the following is an example of PaaS?',
        options: ['AWS EC2', 'Google App Engine', 'Gmail', 'AWS S3'],
        answer: 1,
        explanation: 'Google App Engine is PaaS — you deploy code and the platform handles servers, scaling, and patching.',
      },
      {
        q: "What does 'elasticity' mean in cloud computing?",
        options: ['Servers that stretch', 'Ability to scale resources up or down on demand', 'Flexible pricing models', 'Redundant backups'],
        answer: 1,
        explanation: 'Elasticity means you can scale capacity up during peaks and down in quiet periods — paying only for what you use.',
      },
      {
        q: 'What is a cloud Availability Zone?',
        options: ['A pricing tier', 'A geographic region', 'An isolated data centre location within a region', 'A VPN endpoint'],
        answer: 2,
        explanation: 'An AZ is one or more discrete data centres with redundant power and networking, isolated from failures in other AZs.',
      },
      {
        q: 'What is the main benefit of pay-as-you-go cloud pricing?',
        options: ['Fixed monthly bills', 'You only pay for the resources you actually consume', 'Free tier forever', 'No setup required'],
        answer: 1,
        explanation: 'Pay-as-you-go converts capital expenditure (buying servers) into operational expenditure — you pay only for what you use.',
      },
      {
        q: 'Which cloud model gives developers the MOST infrastructure control?',
        options: ['SaaS', 'PaaS', 'IaaS', 'FaaS'],
        answer: 2,
        explanation: 'IaaS gives access to raw VMs, networking, and storage, so developers control the OS, middleware, and runtime — unlike PaaS or SaaS.',
      },
    ],
    victoryLine: 'Region secured! You now know the core pillars of cloud computing.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEVEL 2 — Containers
  // White: Bc1, Ke1, Bf1
  // Black: Kf8, Nc5, Rf5, Pb6, Pd6, Pg5
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 2,
    title: 'Container Siege',
    missionName: 'Docker & Containers',
    topic: 'Containerization',
    accentColor: '#34d399',
    bgFrom: '#064e3b',
    bgTo: '#065f46',
    intro: {
      headline: 'Ship Anything, Anywhere',
      body: 'Containers package your application and all its dependencies into a single portable unit. Docker is the most popular container platform, letting you build, share, and run containers consistently across any environment.',
      concepts: [
        { icon: '📦', title: 'Image vs Container', body: 'An image is a read-only blueprint. A container is a live, running instance of that image — like a class vs an object.' },
        { icon: '📋', title: 'Dockerfile', body: 'A text file of instructions that tells Docker how to build your image: FROM, RUN, COPY, EXPOSE, CMD.' },
        { icon: '🏪', title: 'Docker Hub', body: 'A public registry where you push and pull Docker images. Like GitHub, but for container images.' },
        { icon: '🔌', title: 'Ports & Networks', body: 'Containers are isolated by default. EXPOSE documents a port; -p maps it to the host. Containers on the same network can talk to each other.' },
      ],
    },
    fen: '5k2/8/1p1p4/2n2rp1/8/8/8/2B1KB2 w - - 0 1',
    missionBrief: 'Take down the enemy Knight, Rook, and three Pawns. Each capture requires a container knowledge check!',
    targets: [
      { piece: 'n', count: 1, label: 'Knight', emoji: '♞' },
      { piece: 'r', count: 1, label: 'Rook',   emoji: '♜' },
      { piece: 'p', count: 3, label: 'Pawns',  emoji: '♟' },
    ],
    questions: [
      {
        q: 'What is a Docker image?',
        options: ['A running application process', 'A read-only template for creating containers', 'A virtual machine snapshot', 'A Docker registry entry'],
        answer: 1,
        explanation: 'A Docker image is a read-only, layered blueprint. When you run it, Docker creates a writeable container on top.',
      },
      {
        q: 'What must every Dockerfile start with?',
        options: ['RUN', 'CMD', 'FROM', 'COPY'],
        answer: 2,
        explanation: 'FROM defines the base image your new image builds upon, e.g. FROM node:18-alpine. It must be the first instruction.',
      },
      {
        q: 'Which command builds a Docker image from a Dockerfile?',
        options: ['docker run', 'docker create', 'docker build', 'docker start'],
        answer: 2,
        explanation: '`docker build -t my-app .` reads the Dockerfile in the current directory and produces a tagged image.',
      },
      {
        q: "What does Docker's EXPOSE instruction do?",
        options: ['Maps a container port to the host', 'Documents which port the container listens on', 'Opens a firewall rule', 'Starts the application'],
        answer: 1,
        explanation: 'EXPOSE is documentation only — it tells readers which port the app uses. To actually publish it, use -p 80:80 in `docker run`.',
      },
      {
        q: 'What is Docker Hub?',
        options: ['A Docker desktop app', 'A container orchestration tool', 'A public registry for Docker images', 'A networking plugin'],
        answer: 2,
        explanation: 'Docker Hub is the default public registry. `docker pull nginx` fetches the official nginx image from Docker Hub.',
      },
      {
        q: 'What is the key difference between CMD and ENTRYPOINT in a Dockerfile?',
        options: ['CMD runs before ENTRYPOINT', 'ENTRYPOINT defines the executable; CMD provides default arguments', 'They are identical', 'CMD is for build-time, ENTRYPOINT for runtime'],
        answer: 1,
        explanation: 'ENTRYPOINT sets the executable (e.g. python). CMD provides default args that users can override at runtime.',
      },
      {
        q: 'Which Docker command downloads an image without running it?',
        options: ['docker run', 'docker pull', 'docker fetch', 'docker load'],
        answer: 1,
        explanation: '`docker pull nginx:latest` downloads the image to your local daemon without starting a container.',
      },
    ],
    victoryLine: 'Siege complete! Your containers are battle-tested and ready to ship.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEVEL 3 — Load Balancing & Scaling
  // White: Ra1, Qd1, Ke1, Rh1
  // Black: Kf8, Rb5, Qd5, Rf5, Pe4, Pg4
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 3,
    title: 'Scaling Summit',
    missionName: 'Load Balancing & Auto-Scaling',
    topic: 'Scalability',
    accentColor: '#a78bfa',
    bgFrom: '#1e1b4b',
    bgTo: '#2e1065',
    intro: {
      headline: 'Handle Any Traffic',
      body: "When your app goes viral, it needs to scale. Load balancers distribute incoming requests across multiple servers, while auto-scaling groups automatically add or remove instances based on demand.",
      concepts: [
        { icon: '⚖️', title: 'Load Balancer', body: 'Sits in front of your servers and distributes traffic evenly. Removes unhealthy instances from the pool via health checks.' },
        { icon: '➡️', title: 'Horizontal Scaling', body: 'Add more instances (scale out). Preferred in the cloud — cheaper, no single point of failure.' },
        { icon: '⬆️', title: 'Vertical Scaling', body: 'Make existing instances bigger (more CPU/RAM). Has an upper limit and requires downtime.' },
        { icon: '📊', title: 'Auto Scaling Groups', body: 'AWS ASGs automatically launch or terminate EC2 instances based on metrics like CPU utilisation or request count.' },
      ],
    },
    fen: '5k2/8/8/1r1q1r2/4p1p1/8/8/R2QK2R w KQ - 0 1',
    missionBrief: 'The enemy Queen, two Rooks, and two Pawns are fortifying this region. Take them all down to scale up!',
    targets: [
      { piece: 'q', count: 1, label: 'Queen', emoji: '♛' },
      { piece: 'r', count: 2, label: 'Rooks', emoji: '♜' },
      { piece: 'p', count: 2, label: 'Pawns', emoji: '♟' },
    ],
    questions: [
      {
        q: 'What does a load balancer primarily do?',
        options: ['Monitors server health', 'Distributes incoming traffic across multiple servers', 'Caches static assets', 'Encrypts data in transit'],
        answer: 1,
        explanation: 'A load balancer receives requests and forwards them to backend instances, spreading load and removing unhealthy ones.',
      },
      {
        q: 'What is horizontal scaling?',
        options: ['Increasing CPU on one server', 'Adding more instances of a service', 'Expanding storage on one machine', 'Widening network bandwidth'],
        answer: 1,
        explanation: 'Horizontal scaling (scale out) adds more instances. It\'s preferred in the cloud as it\'s cheaper and eliminates single points of failure.',
      },
      {
        q: 'What is vertical scaling?',
        options: ['Adding more servers', 'Upgrading the CPU/RAM of an existing instance', 'Deploying to multiple regions', 'Increasing container replicas'],
        answer: 1,
        explanation: 'Vertical scaling (scale up) increases the size of existing instances. It has physical limits and often requires a restart.',
      },
      {
        q: 'What metric most commonly triggers cloud auto-scaling?',
        options: ['Disk space', 'CPU utilisation', 'Number of deployments', 'Error log count'],
        answer: 1,
        explanation: 'CPU utilisation is the most common trigger. AWS ASG scales out when CPU > 70% and in when CPU < 30%, for example.',
      },
      {
        q: 'What is a health check in load balancing?',
        options: ['A security audit', 'A periodic test to verify a server is responding correctly', 'A network ping', 'A database query test'],
        answer: 1,
        explanation: 'The load balancer sends periodic HTTP requests to each instance. If an instance fails to respond, it\'s removed from rotation.',
      },
      {
        q: 'Which scaling strategy is generally preferred for stateless cloud applications?',
        options: ['Vertical scaling', 'Horizontal scaling', 'Manual scaling', 'Temporal scaling'],
        answer: 1,
        explanation: 'Horizontal scaling is preferred because instances can fail without affecting others, and you can scale cheaply with commodity machines.',
      },
      {
        q: 'What is a "sticky session" in load balancing?',
        options: ['A session that never expires', 'Routing a user\'s requests to the same backend server each time', 'An encrypted session cookie', 'A WebSocket connection'],
        answer: 1,
        explanation: 'Sticky sessions (session affinity) tie a user to one backend. Useful for stateful apps, but can create uneven load distribution.',
      },
    ],
    victoryLine: 'Summit reached! Your services can now handle any traffic spike.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEVEL 4 — CI/CD Pipelines
  // White: Ra1, Qd1, Ke1, Rh1
  // Black: Kf8, Bc6, Bf6, Nb5, Ng5, Pe4
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 4,
    title: 'Pipeline Pursuit',
    missionName: 'CI/CD Deployments',
    topic: 'Continuous Integration & Deployment',
    accentColor: '#fb923c',
    bgFrom: '#431407',
    bgTo: '#7c2d12',
    intro: {
      headline: 'Code → Test → Ship',
      body: 'CI/CD automates the path from code commit to production. Continuous Integration merges and tests code frequently. Continuous Deployment automatically ships passing builds to production.',
      concepts: [
        { icon: '🔀', title: 'Continuous Integration', body: 'Developers merge code to a shared branch often. Each push triggers automated builds and tests, catching bugs early.' },
        { icon: '🚀', title: 'Continuous Deployment', body: 'Every passing build is automatically deployed to production — no human approval needed. Fast feedback loop.' },
        { icon: '🔵🟢', title: 'Blue/Green Deploy', body: 'Two identical environments. Traffic shifts from Blue (live) to Green (new). Instant rollback by shifting back.' },
        { icon: '🐦', title: 'Canary Release', body: 'Roll out to a small % of users first. If metrics look good, gradually increase to 100%. Limits blast radius of bugs.' },
      ],
    },
    fen: '5k2/8/2b2b2/1n4n1/4p3/8/8/R2QK2R w KQ - 0 1',
    missionBrief: 'Two Bishops, two Knights, and a Pawn block your pipeline. Answer the CI/CD questions to clear the path to prod!',
    targets: [
      { piece: 'b', count: 2, label: 'Bishops', emoji: '♝' },
      { piece: 'n', count: 2, label: 'Knights', emoji: '♞' },
      { piece: 'p', count: 1, label: 'Pawn',    emoji: '♟' },
    ],
    questions: [
      {
        q: 'What does CI stand for in DevOps?',
        options: ['Cloud Infrastructure', 'Continuous Integration', 'Code Inspection', 'Container Isolation'],
        answer: 1,
        explanation: 'Continuous Integration is the practice of merging all developer working copies to a shared mainline several times a day.',
      },
      {
        q: 'What is a blue-green deployment?',
        options: ['Deploying to two cloud regions simultaneously', 'Using two identical environments and switching traffic between them', 'A colour-coded staging process', 'A Docker Compose multi-service config'],
        answer: 1,
        explanation: 'Blue is live; green is the new version. After validating green, you switch the load balancer. Rolling back is instant — just switch back.',
      },
      {
        q: "What does 'shift left' mean in a CI/CD context?",
        options: ['Moving deployment to a different region', 'Running tests and security checks earlier in the development cycle', 'Reversing a deployment', 'Left-aligning code for readability'],
        answer: 1,
        explanation: 'Shifting left means catching issues (bugs, security flaws) as early as possible — ideally in the developer\'s IDE or on every commit.',
      },
      {
        q: 'What is a canary deployment?',
        options: ['A deployment that alerts on errors', 'Rolling out to a small subset of users before full release', 'A yellow-tagged staging branch', 'Auto-rollback on failure'],
        answer: 1,
        explanation: 'Like a canary in a coal mine, you test with a small % of real users. If the canary stays healthy, you deploy to everyone.',
      },
      {
        q: 'What is the main purpose of a CI pipeline?',
        options: ['Deploy code to production', 'Automatically build and test code on every commit', 'Monitor production logs', 'Provision cloud infrastructure'],
        answer: 1,
        explanation: 'The CI pipeline builds your project and runs tests on every push, ensuring the main branch always stays in a deployable state.',
      },
      {
        q: 'Which GitHub feature is most commonly used for CI/CD pipelines?',
        options: ['GitHub Pages', 'GitHub Actions', 'GitHub Copilot', 'GitHub Projects'],
        answer: 1,
        explanation: 'GitHub Actions uses YAML workflow files (.github/workflows/) to define build, test, and deploy pipelines triggered by push, PR, or schedule.',
      },
      {
        q: 'What is a deployment artifact?',
        options: ['A production bug', 'The compiled, packaged output ready for deployment (e.g. a Docker image or JAR)', 'A git tag', 'A log file from production'],
        answer: 1,
        explanation: 'An artifact is the deployable output of a build: a Docker image, ZIP file, compiled binary. It\'s stored and versioned for traceability.',
      },
    ],
    victoryLine: 'Pipeline cleared! Your code ships to prod automatically — zero manual steps.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEVEL 5 — Cloud Security (Final Boss)
  // White: Ra1, Bc1, Qd1, Ke1, Bf1, Rh1
  // Black: Kf8, Rb6, Rf6, Pc5, Qd5, Be5, Pf5
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 5,
    title: 'Secure the Fortress',
    missionName: 'IAM & Cloud Security',
    topic: 'Cloud Security',
    accentColor: '#f43f5e',
    bgFrom: '#1c0010',
    bgTo: '#4c0519',
    intro: {
      headline: 'Lock Down the Cloud',
      body: 'Security is not optional — it\'s the foundation everything else rests on. In the cloud, you must control who can access what, isolate network traffic, and protect data at every layer.',
      concepts: [
        { icon: '🔑', title: 'IAM', body: 'Identity & Access Management controls who (users, services, roles) can do what (actions) on which resources. Use roles, not root keys.' },
        { icon: '⚖️', title: 'Least Privilege', body: 'Grant only the minimum permissions required. If a Lambda function only reads from S3, it should only have s3:GetObject on that bucket.' },
        { icon: '🏰', title: 'VPC & Security Groups', body: 'A VPC is your private network in the cloud. Security groups act as virtual firewalls, controlling inbound/outbound traffic to instances.' },
        { icon: '🔒', title: 'Encryption', body: 'Encrypt data at rest (stored) and in transit (moving). S3 and RDS support automatic encryption. Use HTTPS/TLS for all traffic.' },
      ],
    },
    fen: '5k2/8/1r3r2/2pqbp2/8/8/8/R1BQKB1R w KQ - 0 1',
    missionBrief: 'FINAL BOSS: The enemy Queen commands two Rooks, a Bishop, and two Pawns. Prove your security mastery to capture them all!',
    targets: [
      { piece: 'q', count: 1, label: 'Queen',  emoji: '♛' },
      { piece: 'r', count: 2, label: 'Rooks',  emoji: '♜' },
      { piece: 'b', count: 1, label: 'Bishop', emoji: '♝' },
      { piece: 'p', count: 2, label: 'Pawns',  emoji: '♟' },
    ],
    questions: [
      {
        q: 'What does IAM stand for in AWS?',
        options: ['Internet Access Manager', 'Identity and Access Management', 'Infrastructure Administration Module', 'Instance Allocation Model'],
        answer: 1,
        explanation: 'AWS IAM lets you manage access to AWS services. You create users, groups, and roles, and attach policies that define allowed actions.',
      },
      {
        q: 'What is the Principle of Least Privilege?',
        options: ['Give users admin access by default', 'Grant only the minimum permissions required to do a job', 'Encrypt all data', 'Use multi-factor authentication'],
        answer: 1,
        explanation: 'Least privilege minimises attack surface. If a service is compromised, it can only access what it was explicitly permitted to.',
      },
      {
        q: 'What is an IAM Role?',
        options: ['A named user account', 'A set of permissions that can be assumed by AWS services or users', 'A network policy', 'A billing group'],
        answer: 1,
        explanation: 'Roles are assumed temporarily — a Lambda function assumes a role to get S3 access without storing long-lived credentials.',
      },
      {
        q: 'What is a VPC in AWS?',
        options: ['Virtual Private Computer', 'Virtual Private Cloud — an isolated network environment', 'A VPN connection', 'A dedicated server rack'],
        answer: 1,
        explanation: 'A VPC is your logically isolated section of the AWS cloud where you launch resources in a virtual network you define.',
      },
      {
        q: 'What does a Security Group do?',
        options: ['Manages IAM policies', 'Acts as a virtual firewall controlling traffic to EC2 instances', 'Encrypts data at rest', 'Stores secrets'],
        answer: 1,
        explanation: 'Security groups have inbound/outbound rules specifying allowed protocols, ports, and source IPs. They\'re stateful — return traffic is automatically allowed.',
      },
      {
        q: 'What is encryption at rest?',
        options: ['Encrypting data while it travels over the network', 'Encrypting data while it is stored on disk', 'Encrypting API keys in code', 'Pausing encryption during off-peak hours'],
        answer: 1,
        explanation: 'Encryption at rest protects stored data (S3, EBS, RDS). Even if someone physically accesses the disk, the data is unreadable without the key.',
      },
      {
        q: 'What is the difference between authentication and authorisation?',
        options: ['They are the same thing', 'Authentication verifies identity; authorisation determines what you can access', 'Authorisation verifies identity; authentication grants access', 'Authentication is for users; authorisation is for services'],
        answer: 1,
        explanation: 'AuthN: "Who are you?" (username + password, MFA). AuthZ: "What are you allowed to do?" (IAM policies, roles).',
      },
      {
        q: 'Which AWS service securely stores and manages secrets like DB passwords and API keys?',
        options: ['AWS Config', 'AWS Secrets Manager', 'AWS IAM', 'AWS CloudTrail'],
        answer: 1,
        explanation: 'AWS Secrets Manager stores, rotates, and audits secrets. Never hardcode credentials — retrieve them from Secrets Manager at runtime.',
      },
    ],
    victoryLine: 'Fortress secured! You\'ve mastered cloud security — the foundation of every production system.',
  },
]
