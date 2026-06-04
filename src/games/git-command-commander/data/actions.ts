import type { ActionConfig, ActionResult, LevelState } from '../types/game.types'

export const ACTION_CONFIGS: Record<string, ActionConfig> = {
  'add': {
    id: 'add',
    label: 'Add',
    emoji: '➕',
    description: 'Stage modified files for commit',
  },
  'commit': {
    id: 'commit',
    label: 'Commit',
    emoji: '💾',
    description: 'Save a snapshot of staged changes',
    requiresInput: 'commit-message',
  },
  'create-branch': {
    id: 'create-branch',
    label: 'Create Branch',
    emoji: '🌿',
    description: 'Spin off a new line of development',
    requiresInput: 'branch-name',
  },
  'switch-branch': {
    id: 'switch-branch',
    label: 'Switch Branch',
    emoji: '🔀',
    description: 'Move to a different branch',
    requiresInput: 'confirm',
  },
  'merge': {
    id: 'merge',
    label: 'Merge',
    emoji: '🔗',
    description: 'Combine branch histories together',
  },
  'resolve-conflict': {
    id: 'resolve-conflict',
    label: 'Resolve Conflict',
    emoji: '⚡',
    description: 'Choose how to handle conflicting changes',
    requiresInput: 'conflict-choice',
  },
  'pull': {
    id: 'pull',
    label: 'Pull',
    emoji: '⬇️',
    description: 'Fetch and integrate remote changes',
  },
  'push': {
    id: 'push',
    label: 'Push',
    emoji: '⬆️',
    description: 'Publish local commits to the remote',
  },
  'open-pr': {
    id: 'open-pr',
    label: 'Open Pull Request',
    emoji: '📬',
    description: 'Propose merging your branch via a PR',
    requiresInput: 'pr-form',
  },
  'request-reviewer': {
    id: 'request-reviewer',
    label: 'Request Reviewer',
    emoji: '👁️',
    description: 'Ask a teammate to review your PR',
  },
  'squash-merge': {
    id: 'squash-merge',
    label: 'Squash & Merge',
    emoji: '✅',
    description: 'Combine commits into one and merge cleanly',
  },
  'force-push': {
    id: 'force-push',
    label: 'Force Push',
    emoji: '💥',
    description: 'Overwrite remote history — use with extreme caution',
    danger: true,
  },
}

function makeId() {
  return Math.random().toString(36).slice(2, 8)
}

export const ACTION_HANDLERS: Record<string, (state: LevelState, input?: string) => ActionResult> = {
  'add': (state) => {
    if (state.workingDirectory.length === 0) {
      return {
        stateUpdate: {},
        notification: { type: 'warning', message: 'Nothing to stage — working directory is clean.', emoji: '🤷' },
      }
    }
    const staged = state.workingDirectory.map(f => ({ ...f, status: 'staged' as const }))
    return {
      stateUpdate: {
        stagingArea: [...state.stagingArea, ...staged],
        workingDirectory: [],
      },
      notification: {
        type: 'success',
        message: `${staged.length} file${staged.length > 1 ? 's' : ''} staged and ready to commit.`,
        emoji: '✅',
      },
      animationHint: 'file-move',
    }
  },

  'commit': (state, message) => {
    if (!message || message.trim().length === 0) {
      return {
        stateUpdate: {},
        notification: { type: 'error', message: 'Empty commit messages rejected. What did you change and why?', emoji: '🚫' },
      }
    }
    if (state.stagingArea.length === 0) {
      return {
        stateUpdate: {},
        notification: { type: 'warning', message: 'Nothing staged. Use Add first to stage your changes.', emoji: '👆' },
      }
    }
    const commit = {
      id: makeId(),
      message: message.trim(),
      branch: state.currentBranch,
      timestamp: Date.now(),
    }
    return {
      stateUpdate: {
        localRepo: [...state.localRepo, commit],
        stagingArea: [],
        commitMessageDraft: '',
      },
      notification: { type: 'success', message: `Committed: "${message.trim()}"`, emoji: '💾' },
      animationHint: 'file-move',
    }
  },

  'create-branch': (state, branchName) => {
    if (!branchName || branchName.trim().length === 0) {
      return {
        stateUpdate: {},
        notification: { type: 'error', message: 'Branch needs a name.', emoji: '🚫' },
      }
    }
    const name = branchName.trim().replace(/\s+/g, '-').toLowerCase()
    if (state.availableBranches.includes(name)) {
      return {
        stateUpdate: {},
        notification: { type: 'warning', message: `Branch "${name}" already exists.`, emoji: '⚠️' },
      }
    }
    return {
      stateUpdate: {
        availableBranches: [...state.availableBranches, name],
        branchNameDraft: '',
      },
      notification: { type: 'success', message: `Branch "${name}" created from ${state.currentBranch}.`, emoji: '🌿' },
      animationHint: 'branch-split',
    }
  },

  'switch-branch': (state) => {
    const otherBranches = state.availableBranches.filter(b => b !== state.currentBranch)
    if (otherBranches.length === 0) {
      return {
        stateUpdate: {},
        notification: { type: 'warning', message: 'No other branches to switch to. Create one first.', emoji: '🤔' },
      }
    }
    const target = otherBranches[0]
    return {
      stateUpdate: { currentBranch: target },
      notification: { type: 'info', message: `Switched to branch "${target}".`, emoji: '🔀' },
      animationHint: 'branch-switch',
    }
  },

  'merge': (state) => {
    if (state.currentBranch !== 'main') {
      return {
        stateUpdate: {},
        notification: {
          type: 'warning',
          message: 'Switch to main first. You merge feature branches INTO main, not the other way.',
          emoji: '⚠️',
        },
        animationHint: 'shake',
      }
    }
    if (state.conflictState && !state.conflictState.resolved) {
      return {
        stateUpdate: {},
        notification: { type: 'error', message: 'Conflict detected! Resolve it before completing the merge.', emoji: '💥' },
        animationHint: 'shake',
      }
    }
    if (state.conflictState?.resolved) {
      const mergeCommit = {
        id: makeId(),
        message: `Merge feature-login into main`,
        branch: 'main',
        timestamp: Date.now(),
        isMerge: true,
      }
      return {
        stateUpdate: {
          localRepo: [...state.localRepo, mergeCommit],
          conflictState: null,
        },
        notification: { type: 'success', message: 'Merge complete! Histories joined.', emoji: '🎉' },
        animationHint: 'merge',
      }
    }
    const featureBranch = state.availableBranches.find(b => b !== 'main')
    if (!featureBranch) {
      return {
        stateUpdate: {},
        notification: { type: 'warning', message: 'No feature branch to merge.', emoji: '🤷' },
      }
    }
    return {
      stateUpdate: {
        conflictState: {
          file: 'auth.js',
          incoming: `// feature-login: Added OAuth2 flow\nfunction login(provider) {\n  return oauth.connect(provider);\n}`,
          current: `// main: Simple password auth\nfunction login(user, pass) {\n  return db.verify(user, pass);\n}`,
          resolved: false,
        },
      },
      notification: { type: 'warning', message: 'Conflict detected in auth.js! You need to resolve it.', emoji: '⚡' },
      animationHint: 'shake',
    }
  },

  'resolve-conflict': (state, choice) => {
    if (!state.conflictState) {
      return {
        stateUpdate: {},
        notification: { type: 'info', message: 'No active conflict to resolve.', emoji: '🤷' },
      }
    }
    const validChoices = ['incoming', 'current', 'both']
    if (!choice || !validChoices.includes(choice)) {
      return {
        stateUpdate: {},
        notification: { type: 'warning', message: 'Choose: incoming, current, or both.', emoji: '🤔' },
      }
    }
    return {
      stateUpdate: {
        conflictState: { ...state.conflictState, resolved: true, choice: choice as 'incoming' | 'current' | 'both' },
      },
      notification: {
        type: 'success',
        message: `Conflict resolved — kept ${choice} changes. Run Merge to finalize.`,
        emoji: '✅',
      },
    }
  },

  'pull': (state) => {
    if (state.remoteRepo.length <= state.localRepo.filter(c => c.branch === state.currentBranch).length) {
      return {
        stateUpdate: {},
        notification: { type: 'info', message: 'Already up to date with remote.', emoji: '✅' },
      }
    }
    const remoteOnlyCommits = state.remoteRepo.filter(
      rc => !state.localRepo.find(lc => lc.id === rc.id)
    )
    return {
      stateUpdate: {
        localRepo: [...state.localRepo, ...remoteOnlyCommits],
      },
      notification: {
        type: 'success',
        message: `Pulled ${remoteOnlyCommits.length} new commit${remoteOnlyCommits.length > 1 ? 's' : ''} from remote.`,
        emoji: '⬇️',
      },
      animationHint: 'pull-down',
    }
  },

  'push': (state) => {
    const remoteHasNewCommits = state.remoteRepo.some(
      rc => !state.localRepo.find(lc => lc.id === rc.id)
    )
    if (remoteHasNewCommits) {
      return {
        stateUpdate: {
          failState: true,
          failReason: 'Remote rejected your push — pull first! The remote has commits you don\'t have locally.',
        },
        notification: {
          type: 'error',
          message: '💥 Remote rejected push! Your teammates already pushed. Pull their changes first.',
          emoji: '🚨',
        },
        animationHint: 'shake',
      }
    }
    const localAhead = state.localRepo.filter(lc => !state.remoteRepo.find(rc => rc.id === lc.id))
    if (localAhead.length === 0) {
      return {
        stateUpdate: {},
        notification: { type: 'info', message: 'Nothing to push — remote is already up to date.', emoji: '✅' },
      }
    }
    return {
      stateUpdate: {
        remoteRepo: [...state.remoteRepo, ...localAhead],
      },
      notification: {
        type: 'success',
        message: `Pushed ${localAhead.length} commit${localAhead.length > 1 ? 's' : ''} to remote. 🚀`,
        emoji: '⬆️',
      },
      animationHint: 'push-up',
    }
  },

  'open-pr': (state, input) => {
    if (!input) {
      return {
        stateUpdate: {},
        notification: { type: 'warning', message: 'Fill in the PR form first.', emoji: '📝' },
      }
    }
    let prData: { title: string; description: string; reviewer: string }
    try {
      prData = JSON.parse(input)
    } catch {
      return {
        stateUpdate: {},
        notification: { type: 'error', message: 'Invalid PR form data.', emoji: '🚫' },
      }
    }
    if (!prData.title?.trim()) {
      return {
        stateUpdate: {},
        notification: { type: 'warning', message: 'PR title is required.', emoji: '📝' },
      }
    }
    const pr = {
      id: makeId(),
      title: prData.title.trim(),
      fromBranch: state.currentBranch,
      toBranch: 'main',
      status: 'open' as const,
      description: prData.description,
      reviewer: prData.reviewer,
    }
    return {
      stateUpdate: {
        openPullRequests: [...state.openPullRequests, pr],
        prDraft: { title: '', description: '', reviewer: '' },
      },
      notification: { type: 'success', message: `PR opened: "${pr.title}"`, emoji: '📬' },
    }
  },

  'request-reviewer': (state) => {
    const openPR = state.openPullRequests.find(pr => pr.status === 'open')
    if (!openPR) {
      return {
        stateUpdate: {},
        notification: { type: 'warning', message: 'Open a PR first before requesting a reviewer.', emoji: '📝' },
      }
    }
    const updated = state.openPullRequests.map(pr =>
      pr.id === openPR.id ? { ...pr, status: 'reviewing' as const, reviewer: 'alex.dev' } : pr
    )
    return {
      stateUpdate: { openPullRequests: updated },
      notification: { type: 'success', message: 'Review requested — alex.dev is on it 👀', emoji: '👁️' },
    }
  },

  'squash-merge': (state) => {
    const reviewingPR = state.openPullRequests.find(pr => pr.status === 'reviewing')
    if (!reviewingPR) {
      return {
        stateUpdate: {},
        notification: { type: 'warning', message: 'PR needs a reviewer before merging.', emoji: '⚠️' },
      }
    }
    const mergeCommit = {
      id: makeId(),
      message: `Squash merge: ${reviewingPR.title}`,
      branch: 'main',
      timestamp: Date.now(),
      isMerge: true,
    }
    const updated = state.openPullRequests.map(pr =>
      pr.id === reviewingPR.id ? { ...pr, status: 'merged' as const } : pr
    )
    return {
      stateUpdate: {
        openPullRequests: updated,
        remoteRepo: [...state.remoteRepo, mergeCommit],
        localRepo: [...state.localRepo, mergeCommit],
      },
      notification: {
        type: 'success',
        message: `PR merged cleanly. Production updated! 🚀`,
        emoji: '✅',
      },
      animationHint: 'celebrate',
    }
  },

  'force-push': (_state) => ({
    stateUpdate: {
      failState: true,
      failReason: 'You force pushed to main. Your team\'s history is now corrupted. Trust: destroyed. 💀',
    },
    notification: {
      type: 'error',
      message: 'You pushed directly with force. Your teammates are typing aggressively... 😡',
      emoji: '💥',
    },
    animationHint: 'shake',
  }),
}
