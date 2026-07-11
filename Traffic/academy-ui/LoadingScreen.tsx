import React from 'react'
import { t } from './tokens'

export default function LoadingScreen({
  progress = 100,
  status = 'Ready',
}: {
  progress?: number
  status?: string
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: t.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300000,
        transition: 'opacity .3s',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: t.text, marginBottom: 8 }}>
        🚦
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 20 }}>
        Traffic Academy
      </div>
      <div
        style={{
          width: 220,
          height: 6,
          borderRadius: 3,
          background: t.border,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: t.accent,
            borderRadius: 3,
            transition: 'width .3s',
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: t.muted, marginTop: 8 }}>
        {status} — {progress}%
      </div>
    </div>
  )
}
