import type { StageConfig, CodeBlock, Direction } from '@/games/thread/types'

function start(id: string, threadId: string): CodeBlock {
  return { id, threadId, kind: 'start' }
}

function startTemplate(id: string, threadId: string): CodeBlock {
  return { id, threadId, kind: 'start', editableThread: true }
}

function join(id: string, threadId: string): CodeBlock {
  return { id, threadId, kind: 'join' }
}

function joinTemplate(id: string, threadId: string): CodeBlock {
  return { id, threadId, kind: 'join', editableThread: true }
}

function sleep(id: string, threadId: string, durationMs: number): CodeBlock {
  return { id, threadId, kind: 'sleep', durationMs }
}

function sleepTemplate(id: string, threadId: string, durationMs: number): CodeBlock {
  return { id, threadId, kind: 'sleep', durationMs, editableThread: true }
}

function setName(id: string, threadId: string, nameValue: string): CodeBlock {
  return { id, threadId, kind: 'set-name', nameValue }
}

function setNameTemplate(id: string, threadId: string, nameValue: string): CodeBlock {
  return { id, threadId, kind: 'set-name', nameValue, editableThread: true }
}

function isAlive(id: string, threadId: string): CodeBlock {
  return { id, threadId, kind: 'is-alive' }
}

function isAliveTemplate(id: string, threadId: string): CodeBlock {
  return { id, threadId, kind: 'is-alive', editableThread: true }
}

function acquire(id: string, threadId: string, lockId: string): CodeBlock {
  return { id, threadId, kind: 'acquire', lockId }
}

function acquireTemplate(id: string, threadId: string, lockId: string): CodeBlock {
  return { id, threadId, kind: 'acquire', lockId, editableThread: true }
}

function release(id: string, threadId: string, lockId: string): CodeBlock {
  return { id, threadId, kind: 'release', lockId }
}

function releaseTemplate(id: string, threadId: string, lockId: string): CodeBlock {
  return { id, threadId, kind: 'release', lockId, editableThread: true }
}

function move(id: string, threadId: string, direction: Direction, steps: number): CodeBlock {
  return { id, threadId, kind: 'move', direction, steps }
}

function moveTemplate(id: string, threadId: string): CodeBlock {
  return {
    id,
    threadId,
    kind: 'move',
    editableThread: true,
    direction: 'right',
    steps: 1,
    editableDirection: true,
    editableSteps: true,
    minSteps: 1,
    maxSteps: 6,
  }
}

export const THREAD_GAME_ID = 'thread'

export const THREAD_STAGES: StageConfig[] = [
  {
    id: 'relay-race',
    stageNumber: '1-1',
    title: 'Relay Race',
    subtitle: 'A hands the lane off before B can move',
    icon: '🏁',
    conceptTitle: 'start() + join()',
    conceptBody: 'start() launches the worker, and join() makes the caller wait until that worker finishes. In this stage, Thread B must stay behind the relay gate until Thread A has fully completed its run.',
    conceptHighlight: 'join() is the baton handoff. Without it, the next line can run before the first thread is done.',
    briefing: 'Build a route for each worker, but make Thread A fully clear the lane before Thread B begins.',
    objective: 'Launch Thread A, send it to the right flag, wait for it with join(), then launch Thread B toward the left flag.',
    ghostTip: 'A only needs one grouped move, and B runs in the opposite direction after the join.',
    goalMode: 'all-goals',
    grid: [
      '########',
      '#......#',
      '#.####.#',
      '#......#',
      '#.####.#',
      '#......#',
      '#......#',
      '########',
    ],
    robots: [
      { id: 'threadA', displayName: 'Ember', accent: '#df7c5a', trail: 'rgba(223,124,90,0.28)', start: { x: 1, y: 6 }, defaultName: 'threadA' },
      { id: 'threadB', displayName: 'Teal', accent: '#6fa8a2', trail: 'rgba(111,168,162,0.28)', start: { x: 6, y: 1 }, defaultName: 'threadB' },
    ],
    goals: [
      { robotId: 'threadA', x: 6, y: 6, label: 'A flag' },
      { robotId: 'threadB', x: 1, y: 1, label: 'B flag' },
    ],
    doors: [
      {
        id: 'relay-door',
        x: 3,
        y: 1,
        label: 'relay',
        rule: { type: 'reach-goal', robotId: 'threadA' },
      },
    ],
    availableBlocks: [
      startTemplate('p1-start', 'threadA'),
      moveTemplate('p1-move', 'threadA'),
      joinTemplate('p1-join', 'threadA'),
    ],
    ghostProgram: [
      start('g1-a-start', 'threadA'),
      move('g1-a-move', 'threadA', 'right', 5),
      join('g1-a-join', 'threadA'),
      start('g1-b-start', 'threadB'),
      move('g1-b-move', 'threadB', 'left', 5),
    ],
  },
  {
    id: 'simultaneous-switch',
    stageNumber: '1-2',
    title: 'Simultaneous Switch',
    subtitle: 'Both workers must land together',
    icon: '⚡',
    conceptTitle: 'start() is non-blocking',
    conceptBody: 'Calling start() does not pause the caller. The main flow keeps going, which is why you can launch two workers nearly back to back and let them overlap.',
    conceptHighlight: 'Back-to-back starts create overlap. If one worker begins much earlier, their timing falls out of sync.',
    briefing: 'Both workers already know where to go. The puzzle is deciding when each one starts.',
    objective: 'Start both threads in the right order so they hit their switches together.',
    ghostTip: 'Watch the ghost carefully: the workers are already aimed at each other from opposite sides.',
    goalMode: 'sync-switches',
    syncWindowMs: 180,
    grid: [
      '########',
      '#......#',
      '#......#',
      '#.####.#',
      '#......#',
      '#......#',
      '#......#',
      '########',
    ],
    robots: [
      { id: 'threadA', displayName: 'Amber', accent: '#d68647', trail: 'rgba(214,134,71,0.26)', start: { x: 1, y: 2 }, defaultName: 'threadA' },
      { id: 'threadB', displayName: 'Mint', accent: '#59a89a', trail: 'rgba(89,168,154,0.26)', start: { x: 6, y: 5 }, defaultName: 'threadB' },
    ],
    goals: [
      { robotId: 'threadA', x: 4, y: 2, label: 'A switch' },
      { robotId: 'threadB', x: 3, y: 5, label: 'B switch' },
    ],
    switches: [
      { id: 'switch-a', robotId: 'threadA', x: 4, y: 2, label: 'sync A' },
      { id: 'switch-b', robotId: 'threadB', x: 3, y: 5, label: 'sync B' },
    ],
    presetInstructions: {
      threadA: [
        { kind: 'move', direction: 'right' },
        { kind: 'move', direction: 'right' },
        { kind: 'move', direction: 'right' },
      ],
      threadB: [
        { kind: 'move', direction: 'left' },
        { kind: 'move', direction: 'left' },
        { kind: 'move', direction: 'left' },
      ],
    },
    availableBlocks: [
      startTemplate('p2-start', 'threadA'),
    ],
    ghostProgram: [
      start('g2-a-start', 'threadA'),
      start('g2-b-start', 'threadB'),
    ],
  },
  {
    id: 'named-worker',
    stageNumber: '1-3',
    title: 'Named Worker',
    subtitle: 'Checkpoint gates inspect each thread identity',
    icon: '🪪',
    conceptTitle: 'setName() and identity checks',
    conceptBody: 'Threads can carry readable names, which is useful for debugging and coordination. Here the gate checks that identity before it lets each worker pass.',
    conceptHighlight: 'A thread name is more than a label. Systems often branch behavior based on the worker that shows up.',
    briefing: 'Set each worker identity first, then send each one through its matching gate.',
    objective: 'Assign the correct names, then move Thread A right and Thread B left through their matching gates.',
    ghostTip: 'The route itself is simple. The real mistake to avoid is launching a thread before its name is set.',
    goalMode: 'all-goals',
    grid: [
      '########',
      '#......#',
      '#......#',
      '#.####.#',
      '#......#',
      '#......#',
      '#......#',
      '########',
    ],
    robots: [
      { id: 'threadA', displayName: 'Crimson', accent: '#cb7868', trail: 'rgba(203,120,104,0.26)', start: { x: 1, y: 2 }, defaultName: 'threadA' },
      { id: 'threadB', displayName: 'Azure', accent: '#6b97bf', trail: 'rgba(107,151,191,0.26)', start: { x: 6, y: 5 }, defaultName: 'threadB' },
    ],
    goals: [
      { robotId: 'threadA', x: 6, y: 2, label: 'Alpha flag' },
      { robotId: 'threadB', x: 1, y: 5, label: 'Beta flag' },
    ],
    doors: [
      { id: 'alpha-gate', x: 4, y: 2, label: 'alpha', rule: { type: 'name', requiredName: 'alpha' } },
      { id: 'beta-gate', x: 3, y: 5, label: 'beta', rule: { type: 'name', requiredName: 'beta' } },
    ],
    availableBlocks: [
      setNameTemplate('p3-name-alpha', 'threadA', 'alpha'),
      setNameTemplate('p3-name-beta', 'threadA', 'beta'),
      startTemplate('p3-start', 'threadA'),
      moveTemplate('p3-move', 'threadA'),
    ],
    ghostProgram: [
      setName('g3-a-name', 'threadA', 'alpha'),
      setName('g3-b-name', 'threadB', 'beta'),
      start('g3-a-start', 'threadA'),
      move('g3-a-move', 'threadA', 'right', 5),
      start('g3-b-start', 'threadB'),
      move('g3-b-move', 'threadB', 'left', 5),
    ],
  },
  {
    id: 'the-nap',
    stageNumber: '1-4',
    title: 'The Nap',
    subtitle: 'A resting worker keeps the lane powered',
    icon: '🔋',
    conceptTitle: 'sleep() pauses only that thread',
    conceptBody: 'sleep(ms) suspends the current thread for a period of time, but other threads keep running. That makes sleep a timing tool when another worker needs a shared resource to stay available.',
    conceptHighlight: 'A sleeping thread does not block its peers. It only pauses itself.',
    briefing: 'Thread A begins on the charge pad. Keep the door powered long enough for Thread B to cross, then finish A’s route.',
    objective: 'Start A, sleep it on the pad, run B left through the lower door, then send A to the right flag.',
    ghostTip: 'If A moves too soon, the lower door drops before B can cross.',
    goalMode: 'all-goals',
    grid: [
      '########',
      '#......#',
      '#......#',
      '#.####.#',
      '#......#',
      '#......#',
      '#......#',
      '########',
    ],
    robots: [
      { id: 'threadA', displayName: 'Ember', accent: '#d88158', trail: 'rgba(216,129,88,0.26)', start: { x: 2, y: 2 }, defaultName: 'threadA' },
      { id: 'threadB', displayName: 'Mint', accent: '#74afa0', trail: 'rgba(116,175,160,0.26)', start: { x: 6, y: 5 }, defaultName: 'threadB' },
    ],
    goals: [
      { robotId: 'threadA', x: 6, y: 2, label: 'A flag' },
      { robotId: 'threadB', x: 1, y: 5, label: 'B flag' },
    ],
    pads: [
      { id: 'nap-pad', x: 2, y: 2, label: 'charge' },
    ],
    doors: [
      { id: 'nap-door', x: 4, y: 5, label: 'hold', rule: { type: 'hold-pad', robotId: 'threadA', padId: 'nap-pad' } },
    ],
    availableBlocks: [
      startTemplate('p4-start', 'threadA'),
      sleepTemplate('p4-sleep', 'threadA', 960),
      moveTemplate('p4-move', 'threadA'),
    ],
    ghostProgram: [
      start('g4-a-start', 'threadA'),
      sleep('g4-a-sleep', 'threadA', 960),
      start('g4-b-start', 'threadB'),
      move('g4-b-move', 'threadB', 'left', 5),
      move('g4-a-move', 'threadA', 'right', 4),
    ],
  },
  {
    id: 'the-check-in',
    stageNumber: '1-5',
    title: 'The Check-In',
    subtitle: 'A monitor reads lifecycle checkpoints',
    icon: '📡',
    conceptTitle: 'isAlive() and thread lifecycle',
    conceptBody: 'A thread moves through a small lifecycle: before start it is not alive, while running it is alive, and after completion it is not alive again. isAlive() gives you a fast probe into that state.',
    conceptHighlight: 'The monitor wants the sequence false → true → false, which maps to before start, during execution, and after join.',
    briefing: 'Guide Thread A to the flag while the monitor checks its lifecycle at three different moments.',
    objective: 'Make the monitor read false, then true, then false while Thread A climbs up and cuts right to its flag.',
    ghostTip: 'The middle check must happen while the worker is still moving, not after it finishes.',
    goalMode: 'probe-sequence',
    grid: [
      '########',
      '#......#',
      '#.####.#',
      '#......#',
      '#.####.#',
      '#......#',
      '#......#',
      '########',
    ],
    robots: [
      { id: 'threadA', displayName: 'Signal', accent: '#6d97c7', trail: 'rgba(109,151,199,0.26)', start: { x: 1, y: 6 }, defaultName: 'threadA' },
    ],
    goals: [
      { robotId: 'threadA', x: 6, y: 3, label: 'worker flag' },
    ],
    monitor: {
      robot: {
        id: 'monitor',
        accent: '#7dcfd3',
        trail: 'rgba(125,207,211,0.28)',
        start: { x: 1, y: 1 },
      },
      terminals: [
        { x: 2, y: 1, label: 'before start' },
        { x: 4, y: 1, label: 'during run' },
        { x: 6, y: 1, label: 'after join' },
      ],
      expected: [false, true, false],
    },
    availableBlocks: [
      isAliveTemplate('p5-live', 'threadA'),
      startTemplate('p5-start', 'threadA'),
      moveTemplate('p5-move', 'threadA'),
      joinTemplate('p5-join', 'threadA'),
    ],
    ghostProgram: [
      isAlive('g5-a-live-before', 'threadA'),
      start('g5-a-start', 'threadA'),
      move('g5-a-up', 'threadA', 'up', 3),
      move('g5-a-right', 'threadA', 'right', 5),
      isAlive('g5-a-live-during', 'threadA'),
      join('g5-a-join', 'threadA'),
      isAlive('g5-a-live-after', 'threadA'),
    ],
  },
  {
    id: 'pick-up-the-key',
    stageNumber: '2-1',
    title: 'Pick Up the Key',
    subtitle: 'A lock is something the worker physically carries',
    icon: '🗝️',
    conceptTitle: 'acquire(lock)',
    conceptBody: 'A lock is not just an invisible rule. In this game, it behaves like a physical key the robot picks up and carries with it.',
    conceptHighlight: 'When the worker holds the lock, the matching door opens.',
    briefing: 'Wake the worker, pick up the key, then carry it through the first locked door.',
    objective: 'Start Thread A, acquire lock1 while standing on it, then move right to the flag.',
    ghostTip: 'The lock tile sits under the worker at the start, so pickup happens before the first move.',
    goalMode: 'all-goals',
    grid: [
      '########',
      '########',
      '#......#',
      '#......#',
      '#......#',
      '########',
      '########',
      '########',
    ],
    robots: [
      { id: 'threadA', displayName: 'Key Runner', accent: '#d88158', trail: 'rgba(216,129,88,0.26)', start: { x: 1, y: 3 }, defaultName: 'threadA' },
    ],
    goals: [
      { robotId: 'threadA', x: 6, y: 3, label: 'flag' },
    ],
    locks: [
      { id: 'lock1', x: 1, y: 3, label: 'lock1' },
    ],
    doors: [
      { id: 'key-door', x: 3, y: 3, label: 'key door', rule: { type: 'lock-held', lockId: 'lock1', robotId: 'threadA' } },
    ],
    availableBlocks: [
      startTemplate('p21-start', 'threadA'),
      acquireTemplate('p21-acquire', 'threadA', 'lock1'),
      moveTemplate('p21-move', 'threadA'),
    ],
    ghostProgram: [
      start('g21-start', 'threadA'),
      acquire('g21-acquire', 'threadA', 'lock1'),
      move('g21-move', 'threadA', 'right', 5),
    ],
  },
  {
    id: 'put-it-back',
    stageNumber: '2-2',
    title: 'Put It Back',
    subtitle: 'Release the lock once you no longer need it',
    icon: '🚪',
    conceptTitle: 'release(lock)',
    conceptBody: 'Holding a lock forever can block other work. Once the first door is behind you, release() puts the key back down so the next mechanism can wake up.',
    conceptHighlight: 'The second door opens only after the lock has been released.',
    briefing: 'Carry the key through the first door, then put it back so the second room can unlock.',
    objective: 'Acquire lock1, move right into the middle room, release lock1, then continue to the final flag.',
    ghostTip: 'If you keep holding the key, the last door never opens and the robot just waits there.',
    goalMode: 'all-goals',
    grid: [
      '########',
      '#......#',
      '#......#',
      '#......#',
      '#......#',
      '#......#',
      '#......#',
      '########',
    ],
    robots: [
      { id: 'threadA', displayName: 'Key Runner', accent: '#d88158', trail: 'rgba(216,129,88,0.26)', start: { x: 1, y: 3 }, defaultName: 'threadA' },
    ],
    goals: [
      { robotId: 'threadA', x: 6, y: 3, label: 'flag' },
    ],
    locks: [
      { id: 'lock1', x: 1, y: 3, label: 'lock1' },
    ],
    doors: [
      { id: 'key-door-a', x: 3, y: 3, label: 'held', rule: { type: 'lock-held', lockId: 'lock1', robotId: 'threadA' } },
      { id: 'key-door-b', x: 5, y: 3, label: 'release', rule: { type: 'lock-released', lockId: 'lock1' } },
    ],
    availableBlocks: [
      startTemplate('p22-start', 'threadA'),
      acquireTemplate('p22-acquire', 'threadA', 'lock1'),
      releaseTemplate('p22-release', 'threadA', 'lock1'),
      moveTemplate('p22-move', 'threadA'),
    ],
    ghostProgram: [
      start('g22-start', 'threadA'),
      acquire('g22-acquire', 'threadA', 'lock1'),
      move('g22-first', 'threadA', 'right', 3),
      release('g22-release', 'threadA', 'lock1'),
      move('g22-second', 'threadA', 'right', 2),
    ],
  },
  {
    id: 'the-standoff',
    stageNumber: '2-3',
    title: 'The Standoff',
    subtitle: 'Each worker holds one lock and waits for the other',
    icon: '⛓️',
    conceptTitle: 'deadlock',
    conceptBody: 'A deadlock happens when each thread is waiting for a lock that another thread refuses to release. Nobody crashes. Everybody just stops.',
    conceptHighlight: 'Both workers are still alive, but progress is frozen.',
    briefing: 'Watch the ghost until the freeze makes sense. There is no puzzle stack here yet.',
    objective: 'Study the freeze: each worker holds one key and waits forever for the other key to be released.',
    ghostTip: 'This is the first time “nothing happens” is the lesson.',
    goalMode: 'observe',
    interactionMode: 'observe',
    grid: [
      '########',
      '#......#',
      '#......#',
      '#......#',
      '#......#',
      '#......#',
      '#......#',
      '########',
    ],
    robots: [
      { id: 'threadA', displayName: 'Amber', accent: '#d88158', trail: 'rgba(216,129,88,0.26)', start: { x: 1, y: 2 }, defaultName: 'threadA' },
      { id: 'threadB', displayName: 'Teal', accent: '#74afa0', trail: 'rgba(116,175,160,0.26)', start: { x: 6, y: 5 }, defaultName: 'threadB' },
    ],
    goals: [],
    locks: [
      { id: 'lock1', x: 1, y: 2, label: 'lock1' },
      { id: 'lock2', x: 6, y: 5, label: 'lock2' },
    ],
    availableBlocks: [],
    ghostProgram: [
      start('g23-a-start', 'threadA'),
      start('g23-b-start', 'threadB'),
      acquire('g23-a-lock1', 'threadA', 'lock1'),
      acquire('g23-b-lock2', 'threadB', 'lock2'),
      move('g23-a-move', 'threadA', 'right', 2),
      move('g23-b-move', 'threadB', 'left', 2),
      acquire('g23-a-lock2', 'threadA', 'lock2'),
      acquire('g23-b-lock1', 'threadB', 'lock1'),
    ],
  },
]
