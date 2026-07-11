import React from 'react'

export default function DevUnlockBadge({
  onClick,
}: {
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 5,
        right: 10,
        fontSize: '0.7rem',
        color: '#aaa',
        opacity: 0.3,
        cursor: 'pointer',
        zIndex: 9999,
      }}
      title="Dev options"
    >
      v2.4.1
    </div>
  )
}
