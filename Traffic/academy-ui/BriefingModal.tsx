import React from 'react'
import { t, card, btn } from './tokens'

export default function BriefingModal({
  lessonId,
  title,
  description,
  onStart,
  onClose,
}: {
  lessonId: number
  title: string
  description: string
  onStart?: () => void
  onClose?: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200000,
      }}
    >
      <div style={{ ...card, maxWidth: 420, padding: 28 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 12, color: t.muted }}>Lesson {lessonId}</span>
          <span
            onClick={onClose}
            style={{ cursor: 'pointer', fontSize: 18, color: t.muted }}
          >
            ✕
          </span>
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: t.text,
            margin: '0 0 8px',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 14,
            color: t.muted,
            lineHeight: 1.5,
            margin: '0 0 20px',
          }}
        >
          {description}
        </p>
        <button
          onClick={onStart}
          style={{ ...btn, background: t.accent, color: '#fff', width: '100%' }}
        >
          Start Lesson
        </button>
      </div>
    </div>
  )
}
