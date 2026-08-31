import React from 'react';
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { HeaderBadge } from '../components/HeaderBadge';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const titleSlide = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pillsSlide = spring({
    frame: frame - 40,
    fps,
    config: { damping: 12, stiffness: 110 },
  });

  const logoRotate = interpolate(frame, [0, 150], [-4, 4]);
  const glowPulse = interpolate(Math.sin(frame / 8), [-1, 1], [0.8, 1.2]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '120px 48px 100px 48px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      {/* Top Badge */}
      <HeaderBadge label="STUDIO SHOWCASE 2026" icon="🚀" tagColor="#F2B84B" />

      {/* Center Hero Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 32,
          maxWidth: 960,
        }}
      >
        {/* Animated Brand Logo with Glowing Rings */}
        <div
          style={{
            position: 'relative',
            width: 220,
            height: 220,
            transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -15,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #F2B84B 0%, #00D2FF 60%, transparent 80%)',
              opacity: 0.5 * glowPulse,
              filter: 'blur(20px)',
            }}
          />
          <Img
            src={staticFile('Icon.png')}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '40px',
              border: '3px solid rgba(242, 184, 75, 0.6)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Main Title */}
        <div
          style={{
            transform: `translateY(${(1 - titleSlide) * 60}px)`,
            opacity: Math.max(0, titleSlide),
          }}
        >
          <h2
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 32,
              fontWeight: 700,
              color: '#00D2FF',
              letterSpacing: 4,
              textTransform: 'uppercase',
              margin: '0 0 16px 0',
            }}
          >
            CLASS OF LEARNERS
          </h2>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 76,
              fontWeight: 900,
              lineHeight: 1.08,
              color: '#ffffff',
              margin: 0,
              textShadow: '0 10px 40px rgba(0,0,0,0.8)',
            }}
          >
            WE BUILT <span style={{ color: '#F2B84B' }}>6+ INSANE</span> 3D WEB APPS!
          </h1>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 32,
            lineHeight: 1.4,
            color: '#94a3b8',
            margin: 0,
            maxWidth: 800,
            opacity: subtitleOpacity,
          }}
        >
          Built by students from Mumbai. Real-time 3D physics, simulators, games, and engines — directly in your browser.
        </p>
      </div>

      {/* Bottom Floating Tech Pills */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          justifyContent: 'center',
          transform: `translateY(${(1 - pillsSlide) * 40}px)`,
          opacity: Math.max(0, pillsSlide),
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            borderRadius: 16,
            padding: '14px 28px',
            color: '#F2B84B',
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          🌐 Three.js r128
        </div>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            borderRadius: 16,
            padding: '14px 28px',
            color: '#00D2FF',
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          🏎️ Physics Engine
        </div>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            borderRadius: 16,
            padding: '14px 28px',
            color: '#10B981',
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          💯 100% Free & Open
        </div>
      </div>
    </div>
  );
};
