import React from 'react'
import { card, btn, sectionTitle } from './tokens'

export default function TheoryPanel({
  content,
  onContinue,
}: {
  content: string
  onContinue?: () => void
}) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={sectionTitle}>Theory</div>
      <div
        style={{
          fontSize: 14,
          color: '#1a1a1a',
          lineHeight: 1.6,
          marginTop: 8,
        }}
      >
        {content}
      </div>
      <button
        onClick={onContinue}
        style={{ ...btn, background: '#3b8c66', color: '#fff', marginTop: 16, width: '100%' }}
      >
        I Understand
      </button>
    </div>
  )
}
