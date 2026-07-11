import React from 'react'
import { t, btn } from './tokens'

export default function CertificateViewer({
  userName,
  lessonName,
  date,
  onClose,
}: {
  userName: string
  lessonName: string
  date?: string
  onClose?: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200000,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '40px 32px',
          maxWidth: 440,
          width: '90%',
          textAlign: 'center',
          border: `2px solid ${t.accent}`,
          position: 'relative',
        }}
      >
        <span
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            cursor: 'pointer',
            fontSize: 18,
            color: t.muted,
          }}
        >
          ✕
        </span>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: '8px 0 4px' }}>
          Certificate of Completion
        </h2>
        <p style={{ fontSize: 13, color: t.muted, marginBottom: 20 }}>
          Traffic Driving Academy
        </p>
        <div style={{ fontSize: 22, fontWeight: 700, color: t.accent, margin: '16px 0 4px' }}>
          {userName}
        </div>
        <p style={{ fontSize: 14, color: t.text, margin: '4px 0' }}>
          has successfully completed
        </p>
        <div style={{ fontSize: 18, fontWeight: 600, color: t.text, margin: '4px 0 16px' }}>
          {lessonName}
        </div>
        <div style={{ fontSize: 12, color: t.muted2 }}>
          {date || new Date().toLocaleDateString()}
        </div>
        <button
          style={{ ...btn, background: t.accent, color: '#fff', marginTop: 24, width: '100%' }}
        >
          Download
        </button>
      </div>
    </div>
  )
}
