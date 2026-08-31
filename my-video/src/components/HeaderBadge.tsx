import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface HeaderBadgeProps {
  label: string;
  icon?: string;
  tagColor?: string;
}

export const HeaderBadge: React.FC<HeaderBadgeProps> = ({
  label,
  icon = '⚡',
  tagColor = '#F2B84B',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const glowPulse = interpolate(Math.sin(frame / 10), [-1, 1], [0.6, 1]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 24px',
        borderRadius: 999,
        background: 'rgba(255, 255, 255, 0.06)',
        border: `1px solid ${tagColor}`,
        boxShadow: `0 0 ${16 * glowPulse}px ${tagColor}44`,
        backdropFilter: 'blur(16px)',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 2,
          color: '#ffffff',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
};
