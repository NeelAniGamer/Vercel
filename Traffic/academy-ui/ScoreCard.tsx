import React from 'react'
import { t, card, btn } from './tokens'

export default function ScoreCard({
  score,
  total,
  passed,
  onRetry,
  onNext,
}: {
  score: number
  total: number
  passed: boolean
  onRetry?: () => void
  onNext?: () => void
}) {
  const pct = Math.round((score / total) * 100)
  return (
    <div style={{ ...card, maxWidth: 400, margin: '0 auto', textAlign: 'center', padding: 30 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '😢'}</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: '8px 0' }}>
        {passed ? 'Great Job!' : 'Try Again'}
      </h2>
      <div style={{ fontSize: 48, fontWeight: 800, color: passed ? t.green : t.red, margin: '12px 0' }}>
        {pct}%
      </div>
      <p style={{ fontSize: 14, color: t.muted, marginBottom: 20 }}>
        {score} / {total} tasks completed
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        {!passed && (
          <button
            onClick={onRetry}
            style={{ ...btn, flex: 1, background: t.bg, color: t.text, border: `1px solid ${t.border}` }}
          >
            Retry
          </button>
        )}
        <button onClick={onNext} style={{ ...btn, flex: 1, background: t.accent, color: '#fff' }}>
          {passed ? 'Next Lesson' : 'Back to Map'}
        </button>
      </div>
    </div>
  )
}
