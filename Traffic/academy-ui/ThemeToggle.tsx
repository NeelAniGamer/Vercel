import React from 'react'
import { t } from './tokens'

export default function ThemeToggle({
  isDark = false,
  onToggle,
}: {
  isDark?: boolean
  onToggle?: () => void
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        position: 'fixed',
        top: 60,
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        background: isDark ? '#333' : t.card,
        border: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 18,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {isDark ? '🌙' : '☀️'}
    </div>
  )
}
