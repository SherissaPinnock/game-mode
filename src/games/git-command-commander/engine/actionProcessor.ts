import { ACTION_HANDLERS } from '../data/actions'
import type { LevelState, Notification, ActionResult } from '../types/game.types'

function makeNotificationId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function processAction(
  actionId: string,
  state: LevelState,
  input?: string
): { newState: LevelState; animationHint: string | null } {
  const handler = ACTION_HANDLERS[actionId]
  if (!handler) {
    const notification: Notification = {
      id: makeNotificationId(),
      type: 'warning',
      message: `Unknown action: ${actionId}`,
      timestamp: Date.now(),
    }
    return {
      newState: { ...state, notifications: [...state.notifications, notification] },
      animationHint: null,
    }
  }

  const result: ActionResult = handler(state, input)

  const notification: Notification = {
    id: makeNotificationId(),
    type: result.notification.type,
    message: result.notification.message,
    timestamp: Date.now(),
    emoji: result.notification.emoji,
  }

  const newState: LevelState = {
    ...state,
    ...result.stateUpdate,
    notifications: [...state.notifications, notification].slice(-5),
    actionHistory: [...state.actionHistory, actionId],
  }

  return { newState, animationHint: result.animationHint ?? null }
}
