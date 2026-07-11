import React from 'react'
import { t, card, sectionTitle } from './tokens'

export default function TrafficLawCallout({ law }: { law: string }) {
  return (
    <div
      style={{
        ...card,
        background: '#fff8e1',
        borderLeft: '4px solid #f39c12',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#f39c12',
          textTransform: 'uppercase' as const,
          marginBottom: 4,
        }}
      >
        Traffic Law
      </div>
      <p style={{ fontSize: 14, color: t.text, lineHeight: 1.5, margin: 0 }}>
        {law}
      </p>
    </div>
  )
}
