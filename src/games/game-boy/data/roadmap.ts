import type { RoadmapLevel } from '@/components/LearningRoadmap'

export const GAME_ID = 'game-boy'

export const GAME_BOY_LEVELS: RoadmapLevel[] = [
  {
    id: 'images',
    title: 'Cartridge of Code',
    subtitle: 'From image package to running app',
    icon: '🕹️',
    conceptTitle: 'Docker Images + Containers',
    conceptBody: 'A Docker image is the packaged software, like a game cartridge. A container is the live running version after you insert it and press start.',
    conceptHighlight: 'Image = package. Container = running copy.',
  },
  {
    id: 'build-pull-run',
    title: 'Build-Pull-Run',
    subtitle: 'The cartridge factory',
    icon: '🏭',
    conceptTitle: 'docker build, docker pull, docker run',
    conceptBody: 'Build creates your own cartridge image, pull fetches a ready-made one from the store, and run powers the cartridge on as a live game session.',
    conceptHighlight: 'Build it, grab it, then boot it.',
  },
  {
    id: 'dockerfiles',
    title: 'Blueprint Brawl',
    subtitle: 'Write the cartridge recipe',
    icon: '🧱',
    conceptTitle: 'Dockerfiles',
    conceptBody: 'A Dockerfile is the step-by-step blueprint Docker follows to build the same image every time. The order of instructions matters.',
    conceptHighlight: 'Recipe first. Image second.',
  },
  {
    id: 'volumes',
    title: 'Save Slot',
    subtitle: 'Keep important data between runs',
    icon: '💾',
    conceptTitle: 'Docker Volumes',
    conceptBody: 'Containers are easy to replace, so important data should live outside them. Volumes are persistent storage spaces Docker keeps around even when containers stop or get recreated.',
    conceptHighlight: 'Volumes keep data safe when the container changes.',
  },
  {
    id: 'docker-compose',
    title: 'Squad Launch',
    subtitle: 'Boot a full stack together',
    icon: '🎛️',
    conceptTitle: 'Docker Compose',
    conceptBody: 'Docker Compose defines multiple services in one place so you can start an app, database, cache, and supporting tools together with a single command.',
    conceptHighlight: 'Compose is your launch sheet for a whole app instead of one container at a time.',
  },
]

export type GameBoyConceptLevelId =
  | 'volumes'
  | 'docker-compose'

export interface GameBoyConceptLesson {
  analogyTitle: string
  analogyBody: string
  conceptSummary: string
  quickFacts: string[]
  commandLabel: string
  commandExample: string
  commandExplanation: string
  challengeQuestion: string
  challengeOptions: string[]
  correctOption: string
  challengeHint: string
  successMessage: string
}

export const INTRO_CONTAINER_LESSON: GameBoyConceptLesson = {
  analogyTitle: 'From cartridge to live session',
  analogyBody: 'A cartridge is just packaged software until you slide it into the console and power it on. That live play session is the container.',
  conceptSummary: 'Containers are the version of the app that is currently "awake" and doing work.',
  quickFacts: [
    'Images are read-only templates; containers are what actually run.',
    'The same image can create several containers at once.',
    'When a container stops, Docker can start a fresh one from the same image.',
  ],
  commandLabel: 'Typical command',
  commandExample: 'docker run -d -p 8080:80 nginx',
  commandExplanation: 'This starts a new container from the nginx image and maps port 80 in the container to port 8080 on your machine.',
  challengeQuestion: 'What turns a Docker image into something people can actually use?',
  challengeOptions: [
    'Running it as a container',
    'Writing it into a volume',
    'Copying it into a README',
  ],
  correctOption: 'Running it as a container',
  challengeHint: 'Think about the difference between packaged software and software that is currently powered on.',
  successMessage: 'Exactly. The image is the cartridge, and the running container is the live game session.',
}

export const GAME_BOY_CONCEPT_LESSONS: Record<GameBoyConceptLevelId, GameBoyConceptLesson> = {
  volumes: {
    analogyTitle: 'Your save file should survive the console restart',
    analogyBody: 'If your save lived only inside a temporary game session, you would lose progress each time the console reset. Volumes keep the save outside the session.',
    conceptSummary: 'Volumes give containers persistent storage managed by Docker. They are ideal for databases, uploads, and any data that must survive container replacement.',
    quickFacts: [
      'Containers are disposable; volumes are meant to stick around.',
      'Several containers can share the same volume when appropriate.',
      'Volumes are safer for app data than writing into the container filesystem.',
    ],
    commandLabel: 'Typical command',
    commandExample: 'docker run -v notes-data:/app/data my-notes-app',
    commandExplanation: 'Docker mounts the named volume notes-data into the container so app data stays available after the container is removed.',
    challengeQuestion: 'Why would you add a Docker volume to an app?',
    challengeOptions: [
      'To keep data even when the container is replaced',
      'To make a Dockerfile optional',
      'To turn an image into multiple services',
    ],
    correctOption: 'To keep data even when the container is replaced',
    challengeHint: 'Picture save files, uploaded images, or database rows that must still exist tomorrow.',
    successMessage: 'Yes. Volumes protect the important data even when containers come and go.',
  },
  'docker-compose': {
    analogyTitle: 'Boot the whole gaming setup together',
    analogyBody: 'Sometimes you do not just need the console. You need the cartridge, a memory card, a speaker dock, and a scoreboard all started together. Compose launches the full setup from one file.',
    conceptSummary: 'Docker Compose defines multi-service applications. One configuration file can describe a web app, database, cache, ports, volumes, and environment variables so the entire stack starts in one consistent way.',
    quickFacts: [
      'Compose is great for local development and small multi-service deployments.',
      'Each service can build from a Dockerfile or pull an image.',
      'Services can share networks and volumes declared in the same file.',
    ],
    commandLabel: 'Typical command',
    commandExample: 'docker compose up --build',
    commandExplanation: 'Docker builds any changed services, creates the network and volumes it needs, and starts the full app stack together.',
    challengeQuestion: 'What problem does Docker Compose solve best?',
    challengeOptions: [
      'Running multiple related services from one configuration',
      'Turning logs into volumes automatically',
      'Replacing the Docker daemon on your machine',
    ],
    correctOption: 'Running multiple related services from one configuration',
    challengeHint: 'Think about cases where your app also needs a database or cache to work.',
    successMessage: 'Perfect. Compose is the launch sheet that starts the whole team of containers together.',
  },
}
