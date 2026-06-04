import type { Notification } from '../../types/game.types'

interface NotificationSystemProps {
  notifications: Notification[]
}

export function NotificationSystem({ notifications }: NotificationSystemProps) {
  if (notifications.length === 0) return null

  return (
    <div className="gcc-notif-stack" role="log" aria-live="polite">
      {notifications.map(n => (
        <div key={n.id} className={`gcc-notif gcc-notif-${n.type}`}>
          {n.emoji && <span className="gcc-notif-emoji">{n.emoji}</span>}
          <span className="gcc-notif-msg">{n.message}</span>
        </div>
      ))}
    </div>
  )
}
