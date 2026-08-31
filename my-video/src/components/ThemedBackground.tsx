import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export type ThemeType = 'studio' | 'traffic' | 'solar' | 'ati' | 'gesture' | 'qr' | 'rpg' | 'techstack' | 'cyber';

interface ThemedBackgroundProps {
  theme?: ThemeType;
}

const themeStyles: Record<
  ThemeType,
  {
    bg: string;
    glow1: string;
    glow2: string;
    gridColor: string;
  }
> = {
  cyber: {
    bg: 'radial-gradient(circle at 50% 30%, #070e1c 0%, #03050a 100%)',
    glow1: 'rgba(0, 210, 255, 0.35)',
    glow2: 'rgba(99, 102, 241, 0.28)',
    gridColor: 'rgba(0, 210, 255, 0.08)',
  },

  studio: {
    bg: 'radial-gradient(circle at 50% 30%, #0c1427 0%, #05070e 100%)',
    glow1: 'rgba(0, 210, 255, 0.25)',
    glow2: 'rgba(242, 184, 75, 0.18)',
    gridColor: 'rgba(0, 210, 255, 0.07)',
  },
  traffic: {
    bg: 'radial-gradient(circle at 60% 40%, #1c1508 0%, #0a0805 100%)',
    glow1: 'rgba(242, 184, 75, 0.35)',
    glow2: 'rgba(239, 68, 68, 0.22)',
    gridColor: 'rgba(242, 184, 75, 0.08)',
  },
  solar: {
    bg: 'radial-gradient(circle at 40% 50%, #071529 0%, #020611 100%)',
    glow1: 'rgba(56, 189, 248, 0.30)',
    glow2: 'rgba(99, 102, 241, 0.25)',
    gridColor: 'rgba(56, 189, 248, 0.06)',
  },
  ati: {
    bg: 'radial-gradient(circle at 50% 40%, #1e092b 0%, #090210 100%)',
    glow1: 'rgba(236, 72, 153, 0.32)',
    glow2: 'rgba(168, 85, 247, 0.28)',
    gridColor: 'rgba(236, 72, 153, 0.07)',
  },
  gesture: {
    bg: 'radial-gradient(circle at 50% 50%, #051a14 0%, #020b08 100%)',
    glow1: 'rgba(16, 185, 129, 0.32)',
    glow2: 'rgba(6, 182, 212, 0.22)',
    gridColor: 'rgba(16, 185, 129, 0.08)',
  },
  qr: {
    bg: 'radial-gradient(circle at 50% 30%, #071833 0%, #030a16 100%)',
    glow1: 'rgba(14, 165, 233, 0.32)',
    glow2: 'rgba(59, 130, 246, 0.25)',
    gridColor: 'rgba(14, 165, 233, 0.07)',
  },
  rpg: {
    bg: 'radial-gradient(circle at 40% 60%, #081a1f 0%, #030b0e 100%)',
    glow1: 'rgba(6, 182, 212, 0.30)',
    glow2: 'rgba(245, 158, 11, 0.22)',
    gridColor: 'rgba(6, 182, 212, 0.07)',
  },
  techstack: {
    bg: 'radial-gradient(circle at 50% 50%, #1a1506 0%, #080703 100%)',
    glow1: 'rgba(245, 158, 11, 0.30)',
    glow2: 'rgba(242, 184, 75, 0.25)',
    gridColor: 'rgba(245, 158, 11, 0.07)',
  },
};

export const ThemedBackground: React.FC<ThemedBackgroundProps> = ({ theme = 'studio' }) => {
  const frame = useCurrentFrame();
  const cfg = themeStyles[theme] || themeStyles.studio;

  // Gentle ambient float
  const floatX = interpolate(Math.sin(frame / 60), [-1, 1], [-20, 20]);
  const floatY = interpolate(Math.cos(frame / 70), [-1, 1], [-20, 20]);

  return (
    <AbsoluteFill style={{ background: cfg.bg, overflow: 'hidden' }}>
      {/* Dynamic Ambient Glow 1 */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${cfg.glow1} 0%, transparent 70%)`,
          top: -150 + floatY,
          left: -150 + floatX,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Dynamic Ambient Glow 2 */}
      <div
        style={{
          position: 'absolute',
          width: 850,
          height: 850,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${cfg.glow2} 0%, transparent 70%)`,
          bottom: -150 - floatY,
          right: -150 - floatX,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Futuristic Isometric Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, ${cfg.gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${cfg.gridColor} 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          opacity: 0.8,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
