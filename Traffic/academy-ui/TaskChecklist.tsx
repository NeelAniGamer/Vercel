import React from 'react'
import { t, card, sectionTitle } from './tokens'

export default function TaskChecklist({
  tasks,
}: {
  tasks: Array<{ label: string; done: boolean }>
}) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={sectionTitle}>Tasks</div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map((task, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `2px solid ${task.done ? t.green : '#ccc'}`,
                background: task.done ? t.green : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {task.done ? '✓' : ''}
            </div>
            <span
              style={{
                fontSize: 14,
                color: task.done ? t.muted : t.text,
                textDecoration: task.done ? 'line-through' : 'none',
              }}
            >
              {task.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
