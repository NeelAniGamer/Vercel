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

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const urlScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const ctaSlide = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const extraSlide = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const glowPulse = interpolate(Math.sin(frame / 8), [-1, 1], [0.8, 1.3]);
  const urlGlow = interpolate(Math.sin(frame / 6), [-1, 1], [20, 45]);

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
      {/* Top Header Badge */}
      <HeaderBadge label="PLAY & EXPLORE LIVE" icon="🌐" tagColor="#F2B84B" />

      {/* Center Main Callout */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 36,
          width: '100%',
          maxWidth: 980,
        }}
      >
        {/* Animated App Icon */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 35,
            border: '3px solid #F2B84B',
            boxShadow: `0 20px 50px rgba(242, 184, 75, ${0.4 * glowPulse})`,
            overflow: 'hidden',
          }}
        >
          <Img
            src={staticFile('Icon.png')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Big Heading */}
        <div>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 72,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              margin: '0 0 16px 0',
            }}
          >
            TRY THEM ALL <span style={{ color: '#F2B84B' }}>NOW!</span>
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 32,
              color: '#94a3b8',
              margin: 0,
            }}
          >
            No install needed. Runs smoothly on Mobile & PC browsers.
          </p>
        </div>

        {/* The Huge Glowing URL Box */}
        <div
          style={{
            width: '100%',
            transform: `scale(${urlScale})`,
            background: 'linear-gradient(135deg, rgba(242,184,75,0.15) 0%, rgba(0,210,255,0.15) 100%)',
            border: '2px solid #F2B84B',
            borderRadius: 36,
            padding: '36px 32px',
            boxShadow: `0 0 ${urlGlow}px rgba(242, 184, 75, 0.5), inset 0 0 30px rgba(0, 210, 255, 0.2)`,
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 22,
              color: '#F2B84B',
              letterSpacing: 4,
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            🌐 OFFICIAL WEBSITE
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 40,
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: 1,
              wordBreak: 'break-all',
              textShadow: '0 0 20px rgba(255,255,255,0.6)',
            }}
          >
            advancedlogiclabs.dpdns.org
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginTop: 6,
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '8px 20px',
              borderRadius: 20,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <span style={{ fontSize: 20 }}>📱</span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 20,
                color: '#cbd5e1',
                fontWeight: 600,
              }}
            >
              Android App: <span style={{ color: '#00D2FF' }}>/download</span>
            </span>
          </div>
        </div>

        {/* Subscribe & Action Pill */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            transform: `translateY(${(1 - ctaSlide) * 30}px)`,
            opacity: Math.max(0, ctaSlide),
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              flex: 1,
              maxWidth: 400,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: 24,
              padding: '22px 28px',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              fontSize: 26,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              boxShadow: '0 15px 40px rgba(239, 68, 68, 0.4)',
            }}
          >
            <span>🔔</span> SUBSCRIBE & LIKE
          </div>

          <div
            style={{
              flex: 1,
              maxWidth: 400,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
              borderRadius: 24,
              padding: '22px 28px',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              fontSize: 26,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
            }}
          >
            <span>🔗</span> LINK IN PINNED COMMENT
          </div>
        </div>
      </div>

      {/* Bottom Studio Branding */}
      <div
        style={{
          textAlign: 'center',
          transform: `translateY(${(1 - extraSlide) * 20}px)`,
          opacity: Math.max(0, extraSlide),
        }}
      >
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 20,
            color: '#64748b',
            letterSpacing: 2,
          }}
        >
          CLASS OF LEARNERS • ADVANCED LOGIC LABS
        </div>
      </div>
    </div>
  );
};
