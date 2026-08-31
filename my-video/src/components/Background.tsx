import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  const orb1X = interpolate(Math.sin(frame / 35), [-1, 1], [15, 85]);
  const orb1Y = interpolate(Math.cos(frame / 45), [-1, 1], [10, 50]);

  const orb2X = interpolate(Math.cos(frame / 40), [-1, 1], [80, 20]);
  const orb2Y = interpolate(Math.sin(frame / 50), [-1, 1], [85, 45]);

  const orb3X = interpolate(Math.sin(frame / 60), [-1, 1], [30, 70]);
  const orb3Y = interpolate(Math.cos(frame / 55), [-1, 1], [70, 25]);

  const gridOffset = (frame * 1.2) % 60;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#05070e',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* Background radial glowing ambient orbs */}
      <div
        style={{
          position: 'absolute',
          top: `${orb1Y}%`,
          left: `${orb1X}%`,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(242,184,75,0.22) 0%, rgba(242,184,75,0) 70%)',
          filter: 'blur(80px)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: `${orb2Y}%`,
          left: `${orb2X}%`,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,210,255,0.18) 0%, rgba(0,210,255,0) 70%)',
          filter: 'blur(90px)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: `${orb3Y}%`,
          left: `${orb3X}%`,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0) 70%)',
          filter: 'blur(75px)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Cyberpunk grid overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          backgroundPosition: `0px ${gridOffset}px`,
          opacity: 0.8,
        }}
      />

      {/* Top vignette & bottom vignette for depth */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,7,14,0.75) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
