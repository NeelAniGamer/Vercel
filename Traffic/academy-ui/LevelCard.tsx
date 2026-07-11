import React from 'react'
import { t, card } from './tokens'

export default function LevelCard({
  id,
  name,
  icon = '📚',
  completed = false,
  locked = false,
  onSelect,
}: {
  id: number
  name: string
  icon?: string
  completed?: boolean
  locked?: boolean
  onSelect?: () => void
}) {
  return (
    <div
      onClick={locked ? undefined : onSelect}
      style={{
        ...card,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.5 : 1,
        transition: 'transform .1s, box-shadow .1s',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: completed ? t.green : t.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {completed ? '✅' : icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{name}</div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
          Lesson {id}
        </div>
      </div>
      <div style={{ fontSize: 12, color: completed ? t.green : t.muted2 }}>
        {completed ? 'Done' : locked ? '🔒' : '→'}
      </div>
    </div>
  )
}
