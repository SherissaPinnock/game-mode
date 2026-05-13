import type { CSSProperties } from 'react'
import type { ServerId, ServerState } from '../types'

interface ServerDoorProps {
  server: ServerState
  centerX: number
  isHovered: boolean
  isHinted: boolean
  isDragging: boolean
}

const ACCENT_CLASS: Record<ServerId, string> = {
  1: 'lb-server-red',
  2: 'lb-server-blue',
  3: 'lb-server-green',
}

export function ServerDoor({ server, centerX, isHovered, isHinted, isDragging }: ServerDoorProps) {
  const crashed = server.crashTimerMs > 0
  const overloaded = !crashed && server.load > server.capacity
  const fillPercent = Math.min(100, (server.load / server.capacity) * 100)
  const connectionCount = Math.max(0, Math.ceil(server.load))
  const statusLabel = crashed ? 'rebooting' : overloaded ? 'overloaded' : 'stable'

  return (
    <div
      className={[
        'lb-server',
        ACCENT_CLASS[server.id],
        crashed ? 'is-crashed' : '',
        overloaded ? 'is-overloaded' : '',
        isHovered ? 'is-hovered' : '',
        isHinted ? 'is-hinted' : '',
        isDragging ? 'is-drag-active' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--lb-server-x': `${centerX}%` } as CSSProperties}
    >
      <div className="lb-server-meter">
        <div className="lb-server-meter-head">
          <strong>{server.label}</strong>
          <span>{connectionCount}/{server.capacity} conn</span>
        </div>

        <div className="lb-server-meter-track" aria-hidden="true">
          <div className="lb-server-meter-fill" style={{ width: `${fillPercent}%` }} />
        </div>

        <div className="lb-server-meter-status">
          <span>{statusLabel}</span>
          <span>{Math.round(fillPercent)}% load</span>
        </div>
      </div>

      <div className="lb-server-target" aria-hidden="true" />
    </div>
  )
}
