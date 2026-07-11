import React from 'react'
import { t, btn } from './tokens'

export default function HeroScreen({
  userName = '',
  onStart,
}: {
  userName?: string
  onStart?: () => void
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: t.bg,
        padding: 20,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 8 }}>🚦</div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: t.text,
          margin: '8px 0',
        }}
      >
        Traffic Academy
      </h1>
      <p
        style={{
          color: t.muted,
          fontSize: 14,
          maxWidth: 320,
          marginBottom: 8,
        }}
      >
        Learn to drive safely in Indian city environments
      </p>
      {userName && (
        <div
          style={{
            color: t.accent,
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {userName.toUpperCase()}
        </div>
      )}
      <button
        onClick={onStart}
        style={{
          ...btn,
          background: t.accent,
          color: '#fff',
          padding: '12px 32px',
          fontSize: 16,
        }}
      >
        Get Started
      </button>
    </div>
  )
}
