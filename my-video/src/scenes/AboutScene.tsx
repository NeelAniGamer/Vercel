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

export const AboutScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const textSlide = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const statsOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
      <HeaderBadge label="ABOUT OUR STUDIO" icon="💡" tagColor="#00D2FF" />

      {/* Main Showcase Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          width: '100%',
          maxWidth: 960,
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            transform: `translateY(${(1 - textSlide) * 40}px)`,
            opacity: Math.max(0, textSlide),
          }}
        >
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 64,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.15,
              margin: '0 0 12px 0',
            }}
          >
            A Student Tech Collective <br />
            <span style={{ color: '#00D2FF' }}>Pushing the Web to its Limits</span>
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 28,
              color: '#94a3b8',
              margin: 0,
            }}
          >
            Real-time procedural 3D, physics simulations & WebGL gaming.
          </p>
        </div>

        {/* Studio Screenshot in Glass Device Mockup */}
        <div
          style={{
            width: '100%',
            height: 520,
            borderRadius: 32,
            overflow: 'hidden',
            border: '2px solid rgba(0, 210, 255, 0.4)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 210, 255, 0.2)',
            transform: `scale(${cardScale})`,
            position: 'relative',
            background: '#070a14',
          }}
        >
          <Img
            src={staticFile('01_home_hero.png')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Overlay Tag */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 24,
              right: 24,
              background: 'rgba(7, 10, 20, 0.85)',
              backdropFilter: 'blur(16px)',
              borderRadius: 20,
              padding: '16px 24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ color: '#F2B84B', fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700 }}>
                STUDIO HUB
              </div>
              <div style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 24, fontWeight: 800 }}>
                Interactive 3D Orrery & Hub
              </div>
            </div>
            <div
              style={{
                background: '#00D2FF22',
                color: '#00D2FF',
                border: '1px solid #00D2FF',
                borderRadius: 12,
                padding: '6px 16px',
                fontFamily: "'Space Mono', monospace",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              LIVE WEB
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          width: '100%',
          maxWidth: 960,
          opacity: statsOpacity,
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            padding: '24px 16px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ fontSize: 44, fontWeight: 900, color: '#F2B84B', fontFamily: "'Space Mono', monospace" }}>
            6+
          </div>
          <div style={{ fontSize: 20, color: '#cbd5e1', fontWeight: 600, marginTop: 4 }}>
            Web Apps
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            padding: '24px 16px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ fontSize: 44, fontWeight: 900, color: '#00D2FF', fontFamily: "'Space Mono', monospace" }}>
            0
          </div>
          <div style={{ fontSize: 20, color: '#cbd5e1', fontWeight: 600, marginTop: 4 }}>
            Installs Required
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            padding: '24px 16px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ fontSize: 44, fontWeight: 900, color: '#10B981', fontFamily: "'Space Mono', monospace" }}>
            100%
          </div>
          <div style={{ fontSize: 20, color: '#cbd5e1', fontWeight: 600, marginTop: 4 }}>
            Student Made
          </div>
        </div>
      </div>
    </div>
  );
};
