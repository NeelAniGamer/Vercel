import React from 'react'
import { t, card } from './tokens'

export default function NamePrompt({
  onSubmit,
}: {
  onSubmit?: (name: string) => void
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
      <div style={{ ...card, maxWidth: 400, textAlign: 'center', padding: 30 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text }}>
          Welcome to Traffic Academy
        </h2>
        <p style={{ color: t.muted, fontSize: 14, marginBottom: 16 }}>
          Enter your name to begin training.
        </p>
        <input
          placeholder="Your Name"
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 16,
            background: t.bg,
            color: t.text,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        <button
          style={{ ...btn, background: t.accent, color: '#fff', width: '100%' }}
        >
          Start Journey
        </button>
      </div>
    </div>
  )
}
