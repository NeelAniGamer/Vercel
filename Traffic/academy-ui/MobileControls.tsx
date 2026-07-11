import React from 'react'
import { t } from './tokens'

export default function MobileControls() {
  const ctrlBtn: React.CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: 28,
    background: t.glass,
    border: `1px solid ${t.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    cursor: 'pointer',
    userSelect: 'none',
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 20px',
        pointerEvents: 'none',
        zIndex: 80,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'auto' }}>
        <div style={ctrlBtn}>◀</div>
        <div style={ctrlBtn}>▶</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'auto' }}>
        <div style={{ ...ctrlBtn, background: t.green, color: '#fff' }}>▲</div>
        <div style={{ ...ctrlBtn, background: t.red, color: '#fff' }}>▼</div>
      </div>
    </div>
  )
}
