import React from 'react'
import { t } from './tokens'

export function LevelMapNode({
  id,
  status,
  onClick,
}: {
  id: number
  status: 'locked' | 'current' | 'done'
  onClick?: () => void
}) {
  const fill =
    status === 'done' ? t.green : status === 'current' ? '#f39c12' : '#6b7280'
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <circle cx={0} cy={0} r={22} fill={fill} stroke="white" strokeWidth={3} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={13}
        fontWeight={600}
      >
        {id}
      </text>
    </g>
  )
}

export default function LevelMap({ levelCount = 52 }: { levelCount?: number }) {
  const nodes: Array<{ id: number; x: number; y: number }> = []
  const cx = 150
  for (let i = 0; i < Math.min(levelCount, 20); i++) {
    const row = Math.floor(i / 5)
    const col = i % 5
    const x = row % 2 === 0 ? 30 + col * 60 : 270 - col * 60
    const y = 30 + row * 70
    nodes.push({ id: i + 1, x, y })
  }

  let pathD = ''
  nodes.forEach((n, i) => {
    pathD += i === 0 ? `M ${n.x} ${n.y}` : ` L ${n.x} ${n.y}`
  })

  return (
    <svg
      width={300}
      height={Math.max(200, nodes[nodes.length - 1].y + 60)}
      viewBox={`0 0 300 ${Math.max(200, nodes[nodes.length - 1].y + 60)}`}
    >
      <path
        d={pathD}
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x},${n.y})`}>
          <LevelMapNode
            id={n.id}
            status={n.id <= 5 ? 'done' : n.id === 6 ? 'current' : 'locked'}
          />
        </g>
      ))}
    </svg>
  )
}
