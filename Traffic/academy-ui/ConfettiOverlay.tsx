import React from 'react'

export default function ConfettiOverlay({
  active = false,
}: {
  active?: boolean
}) {
  if (!active) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 400000,
      }}
    >
      <canvas style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
