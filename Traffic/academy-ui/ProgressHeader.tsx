import React from 'react'
import { t } from './tokens'

export default function ProgressHeader({
  currentStep,
  totalSteps,
  labels,
}: {
  currentStep: number
  totalSteps: number
  labels?: string[]
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '12px 16px',
        background: t.glass2,
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background:
                i < currentStep ? t.accent : i === currentStep ? '#f39c12' : t.border,
              color: i <= currentStep ? '#fff' : t.muted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {i < currentStep ? '✓' : i + 1}
          </div>
          {labels?.[i] && (
            <span
              style={{
                fontSize: 12,
                color: i <= currentStep ? t.text : t.muted2,
                marginRight: 8,
              }}
            >
              {labels[i]}
            </span>
          )}
          {i < totalSteps - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: i < currentStep ? t.accent : t.border,
                borderRadius: 1,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
