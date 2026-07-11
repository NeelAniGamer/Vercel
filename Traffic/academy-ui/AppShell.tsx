import React from 'react'
import { t } from './tokens'

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: t.bg }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: t.glass2,
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🚦</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>
            Academy
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            fontSize: 13,
            color: t.muted,
          }}
        >
          <span>Levels</span>
          <span>Certificates</span>
        </div>
      </nav>
      {children}
    </div>
  )
}
