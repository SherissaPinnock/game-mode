import type { LevelConfig, LevelState } from '../types/game.types'

function makeId() {
  return Math.random().toString(36).slice(2, 8)
}

const INITIAL_COMMIT_ID = 'init-001'

function defaultState(): LevelState {
  return {
    currentBranch: 'main',
    availableBranches: ['main'],
    workingDirectory: [],
    stagingArea: [],
    localRepo: [],
    remoteRepo: [],
    openPullRequests: [],
    conflictState: null,
    notifications: [],
    completedObjectives: [],
    actionHistory: [],
    failState: false,
    commitMessageDraft: '',
    branchNameDraft: '',
    prDraft: { title: '', description: '', reviewer: '' },
  }
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'The Safe Transit',
    emoji: '📦',
    scenario:
      'You fixed a nasty bug in bugfix.js. The code is working locally. Now you need to safely save your progress to version control so it\'s preserved and shareable.',
    objective: 'Stage your changes and create a commit with a meaningful message.',
    concepts: ['Working Directory', 'Staging Area', 'Commit'],
    startingState: {
      ...defaultState(),
      workingDirectory: [{ id: 'f1', name: 'bugfix.js', status: 'modified' }],
    },
    availableActions: ['add', 'commit'],
    winConditions: [
      {
        id: 'has-commit',
        check: (s: LevelState) => s.localRepo.length > 0,
        label: 'Created at least one commit',
      },
      {
        id: 'working-dir-clean',
        check: (s: LevelState) => s.workingDirectory.length === 0 && s.stagingArea.length === 0,
        label: 'Working directory is clean',
      },
    ],
    failConditions: [],
    etiquetteLessons: [
      {
        id: 'meaningful-commits',
        icon: '📝',
        title: 'Write Meaningful Commit Messages',
        description: 'Say WHY, not just what. "fix null pointer in auth" beats "fix stuff" every time.',
      },
      {
        id: 'stage-first',
        icon: '🎯',
        title: 'Stage Before You Commit',
        description: 'Staging lets you craft precise commits. Only commit what belongs together.',
      },
    ],
    hints: [
      'Start with Add — it moves files from the working directory into staging.',
      'Once staged, use Commit. You\'ll need to write a message explaining what you changed.',
    ],
    summaryContent: {
      whatYouDid: 'You staged your modified file and saved it with a descriptive commit message.',
      bestPractice: 'Always stage intentionally and write messages that explain the "why." Future you will thank present you.',
      realTeamScenario: 'A teammate needs to understand your change in a code review. A clear commit message means they spend 30 seconds — not 30 minutes — understanding your intent.',
    },
  },

  {
    id: 2,
    title: 'The Timeline Split',
    emoji: '🌿',
    scenario:
      'Production is live and stable on main. You need to build an experimental dark mode feature. Developing it directly on main would risk breaking live users.',
    objective: 'Create a feature branch, make your changes there, commit, and switch back to main.',
    concepts: ['Branches', 'Context Switching', 'Protecting Main'],
    startingState: {
      ...defaultState(),
      workingDirectory: [{ id: 'f2', name: 'ui-theme.js', status: 'modified' }],
      localRepo: [
        {
          id: INITIAL_COMMIT_ID,
          message: 'Initial commit',
          branch: 'main',
          timestamp: Date.now() - 86400000,
        },
      ],
    },
    availableActions: ['create-branch', 'switch-branch', 'add', 'commit'],
    winConditions: [
      {
        id: 'feature-branch-exists',
        check: (s: LevelState) => s.availableBranches.some(b => b !== 'main'),
        label: 'Created a feature branch',
      },
      {
        id: 'commit-on-feature',
        check: (s: LevelState) =>
          s.localRepo.some(c => c.branch !== 'main' && c.id !== INITIAL_COMMIT_ID),
        label: 'Committed on the feature branch',
      },
      {
        id: 'back-on-main',
        check: (s: LevelState) => s.currentBranch === 'main',
        label: 'Switched back to main',
      },
    ],
    failConditions: [
      {
        id: 'committed-to-main',
        check: (s: LevelState) =>
          s.localRepo.filter(c => c.branch === 'main' && c.id !== INITIAL_COMMIT_ID).length > 0,
        label: 'Committed to main directly',
        message: 'You committed directly to main! 🚨 That\'s where production lives. Your teammates are going to have a very bad day.',
        emoji: '🚨',
      },
    ],
    etiquetteLessons: [
      {
        id: 'feature-branches',
        icon: '🌿',
        title: 'Always Work on a Feature Branch',
        description: 'Branches isolate work-in-progress. Main should always reflect what\'s in production.',
      },
      {
        id: 'descriptive-branch-names',
        icon: '🏷️',
        title: 'Name Branches Descriptively',
        description: '"feature/dark-mode" is infinitely more helpful than "johns-stuff".',
      },
    ],
    hints: [
      'Create a branch first. Give it a descriptive name like "feature/dark-mode".',
      'Switch to the new branch before making changes.',
      'After committing, switch back to main to show the work is isolated.',
    ],
    summaryContent: {
      whatYouDid: 'You created a feature branch, committed your changes there, and switched back to main.',
      bestPractice: 'Main should always be deployable. Feature branches keep experimental work isolated until it\'s ready for review.',
      realTeamScenario: 'If your feature breaks mid-development, main is unaffected. Your teammates can keep shipping while you debug in isolation.',
    },
  },

  {
    id: 3,
    title: 'Joining Histories',
    emoji: '🔗',
    scenario:
      'Your teammate updated main while you were building the login feature on a separate branch. Now you need to bring those histories together — but there\'s a conflict.',
    objective: 'Switch to main, initiate the merge, resolve the conflict, and finalize.',
    concepts: ['Merging', 'Merge Conflicts', 'Conflict Resolution'],
    startingState: {
      ...defaultState(),
      currentBranch: 'feature-login',
      availableBranches: ['main', 'feature-login'],
      localRepo: [
        {
          id: INITIAL_COMMIT_ID,
          message: 'Initial commit',
          branch: 'main',
          timestamp: Date.now() - 86400000,
        },
        {
          id: makeId(),
          message: 'Add OAuth2 login flow',
          branch: 'feature-login',
          timestamp: Date.now() - 3600000,
        },
        {
          id: makeId(),
          message: 'Update password auth (teammate)',
          branch: 'main',
          timestamp: Date.now() - 1800000,
        },
      ],
    },
    availableActions: ['switch-branch', 'merge', 'resolve-conflict'],
    winConditions: [
      {
        id: 'merge-commit-exists',
        check: (s: LevelState) => s.localRepo.some(c => c.isMerge === true),
        label: 'Merge commit created',
      },
      {
        id: 'no-conflict',
        check: (s: LevelState) => s.conflictState === null,
        label: 'Conflict resolved',
      },
    ],
    failConditions: [],
    etiquetteLessons: [
      {
        id: 'conflicts-normal',
        icon: '🤝',
        title: 'Conflicts Are Normal — Don\'t Panic',
        description: 'Merge conflicts are a sign the team is collaborating actively. They\'re expected, not exceptional.',
      },
      {
        id: 'read-the-diff',
        icon: '🔍',
        title: 'Read the Diff Before Resolving',
        description: 'Never blindly accept "theirs" or "mine." Understand what each version does before choosing.',
      },
    ],
    hints: [
      'You\'re on feature-login. Merges happen on the branch you\'re merging INTO — switch to main first.',
      'After switching, use Merge. A conflict will appear — read both sides carefully.',
      'Resolve the conflict, then run Merge again to finalize.',
    ],
    summaryContent: {
      whatYouDid: 'You merged a feature branch into main after resolving a conflict between two versions of the same file.',
      bestPractice: 'Merge regularly to avoid large, complex conflicts. Small conflicts are easy to resolve; merge after weeks apart and you\'re in trouble.',
      realTeamScenario: 'Your team uses daily stand-ups to coordinate who\'s touching which files. Frequent merges mean conflicts are tiny and painless.',
    },
  },

  {
    id: 4,
    title: 'The Cloud',
    emoji: '☁️',
    scenario:
      'The shared team repository has new commits from your colleagues. You\'ve also been working locally and have commits to share. Time to synchronize safely.',
    objective: 'Pull remote changes first, then push your local commits.',
    concepts: ['Remote Repositories', 'Push', 'Pull', 'Synchronization'],
    startingState: (() => {
      const remoteCommit1 = { id: 'remote-001', message: 'Update API endpoints (Sarah)', branch: 'main', timestamp: Date.now() - 7200000 }
      const remoteCommit2 = { id: 'remote-002', message: 'Fix CORS headers (Marcus)', branch: 'main', timestamp: Date.now() - 3600000 }
      const localCommit1 = { id: INITIAL_COMMIT_ID, message: 'Initial commit', branch: 'main', timestamp: Date.now() - 86400000 }
      const localCommit2 = { id: 'local-002', message: 'Add user profile page', branch: 'main', timestamp: Date.now() - 900000 }
      return {
        ...defaultState(),
        localRepo: [localCommit1, localCommit2],
        remoteRepo: [localCommit1, remoteCommit1, remoteCommit2],
      }
    })(),
    availableActions: ['pull', 'push'],
    winConditions: [
      {
        id: 'pulled-first',
        check: (s: LevelState) => {
          const pullIdx = s.actionHistory.indexOf('pull')
          const pushIdx = s.actionHistory.indexOf('push')
          return pullIdx !== -1 && (pushIdx === -1 || pullIdx < pushIdx)
        },
        label: 'Pulled before pushing',
      },
      {
        id: 'pushed',
        check: (s: LevelState) => s.actionHistory.includes('push') && !s.failState,
        label: 'Successfully pushed to remote',
      },
    ],
    failConditions: [
      {
        id: 'pushed-before-pull',
        check: (s: LevelState) => {
          const pushIdx = s.actionHistory.indexOf('push')
          const pullIdx = s.actionHistory.indexOf('pull')
          return pushIdx !== -1 && (pullIdx === -1 || pushIdx < pullIdx) && s.failState
        },
        label: 'Pushed before pulling',
        message: 'Remote rejected your push! Your colleagues already pushed changes you don\'t have. Always pull first.',
        emoji: '🚨',
      },
    ],
    etiquetteLessons: [
      {
        id: 'pull-first',
        icon: '⬇️',
        title: 'Always Pull Before You Push',
        description: 'Your teammates don\'t stop working while you code. Sync first, publish second.',
      },
      {
        id: 'push-often',
        icon: '⬆️',
        title: 'Push Frequently',
        description: 'Small, frequent pushes are easier to review and less likely to cause big conflicts.',
      },
    ],
    hints: [
      'The remote has commits you don\'t have locally — check the remote zone.',
      'Pull those changes first. Then your push will succeed.',
    ],
    summaryContent: {
      whatYouDid: 'You pulled your teammates\' changes into your local repo, then pushed your own work up.',
      bestPractice: 'Make pulling a reflex before any push. It takes 2 seconds and prevents rejected pushes and merge nightmares.',
      realTeamScenario: 'On a real team, CI/CD pipelines trigger on every push. If you push before pulling, you might overwrite a colleague\'s fix that just went to production.',
    },
  },

  {
    id: 5,
    title: 'The Review',
    emoji: '👁️',
    scenario:
      'Your feature/payment-ui branch is polished and ready for production. The right way to merge is through a pull request — not a direct push to main, and definitely not a force push.',
    objective: 'Open a pull request, request a reviewer, then squash and merge cleanly.',
    concepts: ['Pull Requests', 'Code Review', 'Clean History', 'Collaboration Etiquette'],
    startingState: (() => {
      const prCommit1 = { id: 'pr-c1', message: 'Add payment form UI', branch: 'feature/payment-ui', timestamp: Date.now() - 3600000 }
      const prCommit2 = { id: 'pr-c2', message: 'Add payment validation', branch: 'feature/payment-ui', timestamp: Date.now() - 1800000 }
      const prCommit3 = { id: 'pr-c3', message: 'Fix currency formatting', branch: 'feature/payment-ui', timestamp: Date.now() - 600000 }
      return {
        ...defaultState(),
        currentBranch: 'feature/payment-ui',
        availableBranches: ['main', 'feature/payment-ui'],
        localRepo: [prCommit1, prCommit2, prCommit3],
        remoteRepo: [prCommit1, prCommit2, prCommit3],
      }
    })(),
    availableActions: ['open-pr', 'request-reviewer', 'squash-merge', 'force-push'],
    winConditions: [
      {
        id: 'pr-merged',
        check: (s: LevelState) => s.openPullRequests.some(pr => pr.status === 'merged'),
        label: 'PR merged successfully',
      },
    ],
    failConditions: [
      {
        id: 'force-pushed',
        check: (s: LevelState) => s.actionHistory.includes('force-push'),
        label: 'Used force push',
        message: 'You force pushed to main! History is corrupted. Your teammates\' work is gone. Trust: destroyed. 💀',
        emoji: '💥',
      },
    ],
    etiquetteLessons: [
      {
        id: 'pr-context',
        icon: '📬',
        title: 'Give Your PR Context',
        description: 'A PR title and description help reviewers understand what changed and why. Never leave it blank.',
      },
      {
        id: 'no-force-push',
        icon: '🚨',
        title: 'Never Force Push to Shared Branches',
        description: 'Force pushing rewrites history. On a shared branch, this destroys your colleagues\' work.',
      },
    ],
    hints: [
      'Open a PR with a descriptive title and description — context is kindness.',
      'Request a reviewer before merging. Code review catches bugs and spreads knowledge.',
      'Squash and Merge keeps history clean. Force Push is a trap — never use it.',
    ],
    summaryContent: {
      whatYouDid: 'You opened a pull request with context, requested a reviewer, and merged cleanly using squash merge.',
      bestPractice: 'PRs are conversations, not just code delivery. Good descriptions, clear titles, and patient review cycles produce better software.',
      realTeamScenario: 'At most companies, main is protected — direct pushes are blocked. PRs are the only way in. Mastering the PR workflow is mastering team development.',
    },
  },
]

export const ROADMAP_LEVELS = LEVELS.map(l => ({
  id: String(l.id),
  title: l.title,
  subtitle: l.objective,
  icon: l.emoji,
  conceptTitle: l.concepts.join(' · '),
  conceptBody: l.scenario,
  conceptHighlight: l.hints[0],
}))
