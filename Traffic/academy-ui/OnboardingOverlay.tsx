import React from 'react'
import { t, btn } from './tokens'

const dot = {
  width: 12,
  height: 12,
  borderRadius: 6,
  background: t.border,
}

const dotActive = { ...dot, background: t.accent, width: 24, borderRadius: 5 }

export default function OnboardingOverlay({
  currentScreen = 0,
}: {
  currentScreen?: number
}) {
  const msgs = [
    'Welcome to Traffic Academy',
    'What should we call you?',
    'Choose how to sign in',
    'Tell us about yourself',
    "You're all set!",
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200000,
      }}
    >
      {/* Dot indicators */}
      <div style={{ position: 'absolute', top: 20, display: 'flex', gap: 8 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={i <= currentScreen ? dotActive : dot} />
        ))}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          top: 44,
          left: '10%',
          width: '80%',
          height: 4,
          borderRadius: 2,
          background: t.border,
        }}
      >
        <div
          style={{
            width: `${(currentScreen / 4) * 100}%`,
            height: '100%',
            borderRadius: 2,
            background: t.accent,
            transition: 'width .3s',
          }}
        />
      </div>

      {/* Screen card */}
      <div
        style={{
          background: t.card,
          padding: 20,
          borderRadius: 16,
          border: `1px solid ${t.border}`,
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text }}>
          {msgs[currentScreen]}
        </h2>

        {currentScreen === 1 && (
          <input
            placeholder="Your Name"
            style={{
              width: '100%',
              padding: 10,
              marginTop: 16,
              background: t.bg,
              color: t.text,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              fontSize: 14,
            }}
          />
        )}

        {currentScreen === 2 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 16,
            }}
          >
            <button style={{ ...btn, background: t.glass, color: t.text, border: `1px solid ${t.border}` }}>
              Sign in with Google
            </button>
            <button style={{ ...btn, background: t.glass, color: t.text, border: `1px solid ${t.border}` }}>
              Continue as Guest
            </button>
          </div>
        )}

        {currentScreen === 4 && (
          <p style={{ color: t.green, fontSize: 18, marginTop: 16, fontWeight: 600 }}>
            🎉 Let's go!
          </p>
        )}

        <button
          style={{
            ...btn,
            background: t.accent,
            color: '#fff',
            marginTop: 20,
            width: '100%',
          }}
        >
          {currentScreen < 4 ? 'Continue' : 'Start Driving'}
        </button>
      </div>
    </div>
  )
}
