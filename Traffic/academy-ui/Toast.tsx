import React from 'react'
import { t } from './tokens'

export default function Toast({
  message,
  color = t.green,
  visible = true,
}: {
  message: string
  color?: string
  visible?: boolean
}) {
  if (!visible) return null
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: color,
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 300000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {message}
    </div>
  )
}
