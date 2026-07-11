import React from 'react'
import { t } from './tokens'

export default function ScenarioCanvas({
  width = 600,
  height = 400,
}: {
  width?: number
  height?: number
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        background: '#1a2332',
        border: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: t.muted2,
        fontSize: 14,
        margin: '0 auto',
      }}
    >
      2D Scenario Canvas
    </div>
  )
}
