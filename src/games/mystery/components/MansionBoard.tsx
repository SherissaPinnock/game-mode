import { useState } from 'react'
import mansionSrc from '@/assets/mystery/mansion.webp'
import { ROOMS } from '../data/rooms'
import { SPRITE_SCALE, FRAME_COUNT } from '../data/constants'
import type { Char } from '../engine/characters'
import { playClick } from '@/lib/sounds'
import './MansionBoard.css'

export interface SpriteDim { fw: number; h: number }

interface Props {
  chars: Char[]
  dims: Record<string, SpriteDim>
  /** When true, rooms are clickable and the hover overlay shows. */
  interactive: boolean
  onRoomClick?: (roomId: string) => void
  /** Rooms that are accessible; locked rooms show a lock icon and block clicks. */
  unlockedRooms?: string[]
}

export default function MansionBoard({ chars, dims, interactive, onRoomClick, unlockedRooms }: Props) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null)

  function handleRoomClick(roomId: string) {
    if (unlockedRooms && !unlockedRooms.includes(roomId)) return
    playClick()
    onRoomClick?.(roomId)
  }

  return (
    <div className="msb-wrap">
      <div className="msb-board">
        <img src={mansionSrc} className="msb-img" alt="Blackwood Manor" draggable={false} />

        {/* Clickable room zones */}
        {interactive && ROOMS.map(room => {
          const locked = unlockedRooms ? !unlockedRooms.includes(room.id) : false
          return (
            <div
              key={room.id}
              className={`msb-zone ${hoveredRoom === room.id ? 'hovered' : ''} ${locked ? 'locked' : ''}`}
              style={{
                left:   `${room.zone.x}%`,
                top:    `${room.zone.y}%`,
                width:  `${room.zone.w}%`,
                height: `${room.zone.h}%`,
              }}
              onClick={() => handleRoomClick(room.id)}
              onMouseEnter={() => setHoveredRoom(room.id)}
              onMouseLeave={() => setHoveredRoom(null)}
            >
              {locked && <span className="msb-lock">🔒</span>}
            </div>
          )
        })}

        {/* Suspect sprites */}
        {chars.map(char => {
          const d  = dims[char.src] ?? { fw: 32, h: 48 }
          const dw = Math.round(d.fw * SPRITE_SCALE)
          const dh = Math.round(d.h  * SPRITE_SCALE)
          return (
            <div
              key={char.id}
              className="msb-char"
              style={{ left: `${char.x}%`, top: `${char.y}%` }}
            >
              <span className="msb-char-label">{char.name}</span>
              <div
                className="msb-char-sprite-wrap"
                style={{ transform: char.frame === 1 ? 'scaleX(-1)' : 'none' }}
              >
                <div
                  className="msb-sprite"
                  style={{
                    width:               dw,
                    height:              dh,
                    backgroundImage:     `url(${char.src})`,
                    backgroundSize:      `${dw * FRAME_COUNT}px ${dh}px`,
                    backgroundPositionX: `-${char.frame * dw}px`,
                    backgroundPositionY: '0px',
                    backgroundRepeat:    'no-repeat',
                  }}
                />
              </div>
              <div className="msb-char-shadow" style={{ width: Math.round(dw * 0.6) }} />
            </div>
          )
        })}
      </div>

      {/* Room tooltip */}
      {interactive && hoveredRoom && (() => {
        const r = ROOMS.find(x => x.id === hoveredRoom)!
        return <div className="msb-tooltip">{r.icon} {r.label} — click to investigate</div>
      })()}
    </div>
  )
}
