import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ThemedBackground } from '../components/ThemedBackground';
import { ProgressBar } from '../components/ProgressBar';

export const TechSpotlightShorts: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070e', overflow: 'hidden' }}>
      <ProgressBar />
      {/* Clean smooth background audio loop (Zero ticks or clicks) */}
      <Audio src={staticFile('audio/bg_smooth_ambient.wav')} volume={0.16} loop />

      {/* 1. VIRAL HOOK (0 - 150 frames / 5s) */}
      <Sequence from={0} durationInFrames={150}>
        <Audio src={staticFile('audio/vtech_01_hook.mp3')} volume={1} />
        <TechViralHookScene />
      </Sequence>

      {/* 2. GESTURE CONTROLLER AI SPOTLIGHT (150 - 450 frames / 10s) */}
      <Sequence from={150} durationInFrames={300}>
        <Audio src={staticFile('audio/vtech_02_gesture.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <TechGestureScene />
      </Sequence>

      {/* 3. SOLAR ENGINE 3D SPOTLIGHT (450 - 750 frames / 10s) */}
      <Sequence from={450} durationInFrames={300}>
        <Audio src={staticFile('audio/vtech_03_solar.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <TechSolarScene />
      </Sequence>

      {/* 4. OUTRO & URL CTA (750 - 900 frames / 5s) */}
      <Sequence from={750} durationInFrames={150}>
        <Audio src={staticFile('audio/vtech_04_cta.mp3')} volume={1} />
        <TechOutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const TechViralHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const pulse = interpolate(Math.sin(frame / 4), [-1, 1], [0.96, 1.04]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <ThemedBackground theme="gesture" />
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '100px 48px 80px 48px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        {/* Top Floating Alert */}
        <div
          style={{
            background: '#10B981',
            color: '#000000',
            fontFamily: "'Space Mono', monospace",
            fontSize: 24,
            fontWeight: 900,
            padding: '12px 34px',
            borderRadius: 999,
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.8)',
            transform: `scale(${scale})`,
            letterSpacing: 2,
          }}
        >
          🖐️ STOP USING YOUR MOUSE! 🖐️
        </div>

        {/* Center Dual Split Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 24,
            width: '100%',
            maxWidth: 960,
          }}
        >
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 72,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.06,
              margin: 0,
              textShadow: '0 10px 40px rgba(0,0,0,0.9)',
            }}
          >
            CONTROL GAMES WITH <br />
            <span style={{ color: '#10B981' }}>YOUR HAND IN MID-AIR!</span>
          </h1>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              width: '100%',
              transform: `scale(${pulse})`,
            }}
          >
            <div
              style={{
                height: 480,
                borderRadius: 30,
                overflow: 'hidden',
                border: '3px solid #10B981',
                boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)',
                position: 'relative',
              }}
            >
              <Img
                src={staticFile('09_desktop_project_gesture_control.png')}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  right: 16,
                  background: 'rgba(7,10,20,0.9)',
                  padding: '10px',
                  borderRadius: 12,
                  color: '#10B981',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                🖐️ WEBCAM VISION AI
              </div>
            </div>

            <div
              style={{
                height: 480,
                borderRadius: 30,
                overflow: 'hidden',
                border: '3px solid #38BDF8',
                boxShadow: '0 20px 60px rgba(56, 189, 248, 0.4)',
                position: 'relative',
              }}
            >
              <Img
                src={staticFile('03_solar_system.png')}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  right: 16,
                  background: 'rgba(7,10,20,0.9)',
                  padding: '10px',
                  borderRadius: 12,
                  color: '#38BDF8',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                🪐 3D SOLAR ENGINE
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 22,
            color: '#94a3b8',
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          ⚡ 100% IN-BROWSER • ZERO HARDWARE NEEDED
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TechGestureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const zoom = interpolate(frame, [0, 300], [1.0, 1.1]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <ThemedBackground theme="gesture" />
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '100px 48px 80px 48px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(7, 10, 20, 0.9)',
            border: '2px solid #10B981',
            borderRadius: 999,
            padding: '10px 28px',
            color: '#10B981',
            fontFamily: "'Space Mono', monospace",
            fontSize: 22,
            fontWeight: 800,
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)',
          }}
        >
          🖐️ SPOTLIGHT: GESTURE AI
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 22,
            width: '100%',
            maxWidth: 960,
          }}
        >
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, color: '#10B981', fontWeight: 800, letterSpacing: 3, marginBottom: 4 }}>
              COMPUTER VISION AI
            </div>
            <h1
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 66,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.08,
                margin: 0,
                textShadow: '0 0 35px rgba(16,185,129,0.5)',
              }}
            >
              Gesture Controller AI
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, color: '#cbd5e1', margin: '8px 0 0 0', fontWeight: 600 }}>
              Tracks 21 hand joints through your webcam in real-time!
            </p>
          </div>

          <div
            style={{
              width: '100%',
              height: 540,
              borderRadius: 34,
              overflow: 'hidden',
              border: '3px solid #10B981',
              boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px rgba(16, 185, 129, 0.4)',
              transform: `scale(${scale})`,
              position: 'relative',
              background: '#070a14',
            }}
          >
            <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})` }}>
              <Img
                src={staticFile('09_desktop_project_gesture_control.png')}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(7,10,20,0.9)',
                border: '1.5px solid #10B981',
                borderRadius: 16,
                padding: '10px 20px',
                color: '#ffffff',
                fontFamily: "'Space Mono', monospace",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              ✨ 21 3D JOINTS TRACKED
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 20 }}>
              🔥 Pinch & Grab 3D Objects
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 20 }}>
              🔒 100% Local Device Privacy
            </div>
          </div>
        </div>

        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, color: '#64748b', letterSpacing: 2 }}>
          POWERED BY WEBASSEMBLY & MEDIAPIPE AI
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TechSolarScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const zoom = interpolate(frame, [0, 300], [1.0, 1.1]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <ThemedBackground theme="solar" />
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '100px 48px 80px 48px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(7, 10, 20, 0.9)',
            border: '2px solid #38BDF8',
            borderRadius: 999,
            padding: '10px 28px',
            color: '#38BDF8',
            fontFamily: "'Space Mono', monospace",
            fontSize: 22,
            fontWeight: 800,
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.5)',
          }}
        >
          🪐 SPOTLIGHT: SOLAR ENGINE 3D
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 22,
            width: '100%',
            maxWidth: 960,
          }}
        >
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, color: '#38BDF8', fontWeight: 800, letterSpacing: 3, marginBottom: 4 }}>
              CELESTIAL ORBITAL MECHANICS
            </div>
            <h1
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 66,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.08,
                margin: 0,
                textShadow: '0 0 35px rgba(56,189,248,0.5)',
              }}
            >
              Solar Engine 3D
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, color: '#cbd5e1', margin: '8px 0 0 0', fontWeight: 600 }}>
              Real-scale Keplerian gravity physics and time-dilation controls.
            </p>
          </div>

          <div
            style={{
              width: '100%',
              height: 540,
              borderRadius: 34,
              overflow: 'hidden',
              border: '3px solid #38BDF8',
              boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px rgba(56, 189, 248, 0.4)',
              transform: `scale(${scale})`,
              position: 'relative',
              background: '#070a14',
            }}
          >
            <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})` }}>
              <Img
                src={staticFile('03_solar_system.png')}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(7,10,20,0.9)',
                border: '1.5px solid #38BDF8',
                borderRadius: 16,
                padding: '10px 20px',
                color: '#ffffff',
                fontFamily: "'Space Mono', monospace",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              🚀 REAL-SCALE PHYSICS
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 20 }}>
              ⏳ 1x to 10,000x Time Speed
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(242,184,75,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 20 }}>
              🪐 8 Planets + Moons 3D
            </div>
          </div>
        </div>

        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, color: '#64748b', letterSpacing: 2 }}>
          POWERED BY THREE.JS & GLSL SHADERS
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TechOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const pulse = interpolate(Math.sin(frame / 5), [-1, 1], [0.98, 1.03]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <ThemedBackground theme="studio" />
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '100px 48px 80px 48px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(242, 184, 75, 0.15)',
            border: '2px solid #F2B84B',
            borderRadius: 999,
            padding: '10px 32px',
            color: '#F2B84B',
            fontFamily: "'Space Mono', monospace",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          ✨ 100% FREE • PLAY INSTANTLY
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 28,
            width: '100%',
            maxWidth: 960,
            transform: `scale(${scale})`,
          }}
        >
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 72,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.08,
              margin: 0,
            }}
          >
            TRY BOTH APPS LIVE <br />
            <span style={{ color: '#00D2FF' }}>IN YOUR BROWSER!</span>
          </h1>

          <div
            style={{
              width: '100%',
              transform: `scale(${pulse})`,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(56,189,248,0.2) 100%)',
              border: '3px solid #00D2FF',
              borderRadius: 36,
              padding: '36px 28px',
              boxShadow: '0 0 60px rgba(0, 210, 255, 0.5)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, color: '#00D2FF', letterSpacing: 3, fontWeight: 800 }}>
              🌐 OFFICIAL PORTAL
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 42, fontWeight: 900, color: '#ffffff', letterSpacing: 1, wordBreak: 'break-all' }}>
              advancedlogiclabs.dpdns.org
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, color: '#F2B84B', fontWeight: 700 }}>
              📱 Android APK available at /download
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 24,
              padding: '18px 32px',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              fontSize: 26,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <span>👇</span> TRY IT FREE • LINK IN COMMENTS!
          </div>
        </div>

        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, color: '#64748b', letterSpacing: 2 }}>
          CLASS OF LEARNERS • LIKE & SUBSCRIBE
        </div>
      </div>
    </AbsoluteFill>
  );
};
