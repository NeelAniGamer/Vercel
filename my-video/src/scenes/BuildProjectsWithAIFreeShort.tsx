import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ThemedBackground } from '../components/ThemedBackground';
import { ProgressBar } from '../components/ProgressBar';

export const BuildProjectsWithAIFreeShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#070a14', overflow: 'hidden' }}>
      <ThemedBackground theme="cyber" />
      <ProgressBar />

      {/* High-Energy Brazilian Phonk / Drift Beats */}
      <Audio src={staticFile('audio/bg_phonk_funk_beat.wav')} volume={0.22} loop />

      {/* SCENE 1: THE HOOK (0 - 320 frames / ~10.6s) */}
      <Sequence from={0} durationInFrames={320}>
        <Audio src={staticFile('audio/free_01_hook.mp3')} volume={1} />
        <Scene1Hook />
      </Sequence>

      {/* SCENE 2: CODING & AI PAIR PROGRAMMING (320 - 660 frames / ~11.3s) */}
      <Sequence from={320} durationInFrames={340}>
        <Audio src={staticFile('audio/free_02_coding.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Scene2CodingAI />
      </Sequence>

      {/* SCENE 3: 3D GRAPHICS & THREE.JS ENGINE (660 - 1000 frames / ~11.3s) */}
      <Sequence from={660} durationInFrames={340}>
        <Audio src={staticFile('audio/free_03_threejs.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Scene3ThreeJSEngine />
      </Sequence>

      {/* SCENE 4: BACKEND, AUTH & VERCEL HOSTING (1000 - 1340 frames / ~11.3s) */}
      <Sequence from={1000} durationInFrames={340}>
        <Audio src={staticFile('audio/free_04_backend.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Scene4BackendHosting />
      </Sequence>

      {/* SCENE 5: REMOTION CODE VIDEO GENERATION (1340 - 1680 frames / ~11.3s) */}
      <Sequence from={1340} durationInFrames={340}>
        <Audio src={staticFile('audio/free_05_remotion.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Scene5RemotionCode />
      </Sequence>

      {/* SCENE 6: CALL TO ACTION & FREE ACCESS (1680 - 2060 frames / ~12.6s) */}
      <Sequence from={1680} durationInFrames={380}>
        <Audio src={staticFile('audio/free_06_cta.mp3')} volume={1} />
        <Scene6OutroCTA />
      </Sequence>
    </AbsoluteFill>
  );
};

/* SCENE 1: THE HOOK */
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const pulse = interpolate(Math.sin(frame / 6), [-1, 1], [0.98, 1.02]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 900,
          padding: '14px 34px',
          borderRadius: 999,
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.8)',
          transform: `scale(${scale})`,
          letterSpacing: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span>💡</span> BUILD WITH AI + PC • 100% FREE <span>🚀</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 22,
          width: '100%',
          maxWidth: 980,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 66,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.08,
            margin: 0,
            textShadow: '0 10px 40px rgba(0,0,0,0.9)',
          }}
        >
          BUILD FULL 3D GAMES <br />
          <span style={{ color: '#10b981' }}>& APPS WITH AI FOR FREE!</span>
        </h1>

        <div
          style={{
            width: '100%',
            height: 540,
            borderRadius: 34,
            overflow: 'hidden',
            border: '3px solid #10b981',
            boxShadow: '0 30px 90px rgba(0,0,0,0.95), 0 0 50px rgba(16,185,129,0.5)',
            transform: `scale(${pulse})`,
            position: 'relative',
            background: '#070a14',
          }}
        >
          <OffthreadVideo
            src={staticFile('videos/gameplay_driving.mp4')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            startFrom={0}
          />

          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              background: 'rgba(16, 185, 129, 0.95)',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: 16,
              fontFamily: "'Space Mono', monospace",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            🎮 3D MUMBAI DRIVING
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              background: 'rgba(7, 10, 20, 0.92)',
              border: '1.5px solid #10b981',
              color: '#10b981',
              padding: '10px 20px',
              borderRadius: 16,
              fontFamily: "'Space Mono', monospace",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            ✨ ZERO SUBSCRIPTIONS
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          💻 Just A PC & Free AI
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,210,255,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          ⚡ 100% Free Tools
        </div>
      </div>
    </div>
  );
};

/* SCENE 2: CODING & AI PAIR PROGRAMMING */
const Scene2CodingAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'rgba(7, 10, 20, 0.9)',
          border: '2px solid #F2B84B',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#F2B84B',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 800,
          boxShadow: '0 0 25px rgba(242, 184, 75, 0.5)',
        }}
      >
        🛠️ TOOL #1: AI PAIR PROGRAMMING & WEB CORE
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 20,
          width: '100%',
          maxWidth: 980,
          transform: `scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 64,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          AI CODING ASSISTANTS <br />
          <span style={{ color: '#F2B84B' }}>+ VANILLA HTML / CSS / JS</span>
        </h1>

        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Card 1: AI Prompting */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1.5px solid rgba(242, 184, 75, 0.4)',
              borderRadius: 24,
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ fontSize: 42 }}>🤖</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 800 }}>
                  AI Coding Assistants & LLMs
                </div>
                <div style={{ color: '#94a3b8', fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600 }}>
                  Generates physics formulas, UI logic, and game architectures
                </div>
              </div>
            </div>
            <div style={{ background: '#10b981', color: '#ffffff', padding: '6px 16px', borderRadius: 999, fontFamily: "'Space Mono', monospace", fontWeight: 800, fontSize: 16 }}>
              FREE
            </div>
          </div>

          {/* Card 2: Web Standards */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1.5px solid rgba(0, 210, 255, 0.4)',
              borderRadius: 24,
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ fontSize: 42 }}>⚡</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 800 }}>
                  HTML5, CSS3 & JavaScript
                </div>
                <div style={{ color: '#94a3b8', fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600 }}>
                  Zero-overhead execution, runs instantly on any browser
                </div>
              </div>
            </div>
            <div style={{ background: '#10b981', color: '#ffffff', padding: '6px 16px', borderRadius: 999, fontFamily: "'Space Mono', monospace", fontWeight: 800, fontSize: 16 }}>
              0$ COST
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(242,184,75,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          🚀 No Heavy Game Engines
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          ⚡ 100% In-Browser
        </div>
      </div>
    </div>
  );
};

/* SCENE 3: 3D GRAPHICS & THREE.JS ENGINE */
const Scene3ThreeJSEngine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'rgba(7, 10, 20, 0.9)',
          border: '2px solid #00D2FF',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#00D2FF',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 800,
          boxShadow: '0 0 25px rgba(0, 210, 255, 0.5)',
        }}
      >
        🌐 TOOL #2: THREE.JS & OPEN 3D ASSETS
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 20,
          width: '100%',
          maxWidth: 980,
          transform: `scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 64,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          THREE.JS 60 FPS 3D <br />
          <span style={{ color: '#00D2FF' }}>+ OPEN SOURCE ASSET PACKS</span>
        </h1>

        <div style={{ width: '100%', height: 440, borderRadius: 32, overflow: 'hidden', border: '2.5px solid #00D2FF', position: 'relative' }}>
          <OffthreadVideo
            src={staticFile('videos/gameplay_driving.mp4')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            startFrom={100}
          />
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, background: 'rgba(7,10,20,0.9)', padding: '14px 20px', borderRadius: 16, display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(0,210,255,0.4)' }}>
            <span style={{ color: '#00D2FF', fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 800 }}>
              🏎️ PACEJKA TIRE KINEMATICS
            </span>
            <span style={{ color: '#10b981', fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 800 }}>
              🆓 KENNEY 3D ASSETS
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,210,255,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          🎮 Real-time 3D Raycasting
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(242,184,75,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          ⚡ 60 FPS Mobile & Desktop
        </div>
      </div>
    </div>
  );
};

/* SCENE 4: BACKEND, AUTH & VERCEL HOSTING */
const Scene4BackendHosting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'rgba(7, 10, 20, 0.9)',
          border: '2px solid #EC4899',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#EC4899',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 800,
          boxShadow: '0 0 25px rgba(236, 72, 153, 0.5)',
        }}
      >
        ☁️ TOOL #3: VERCEL + SUPABASE POSTGRES
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 20,
          width: '100%',
          maxWidth: 980,
          transform: `scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 64,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          GLOBAL EDGE HOSTING <br />
          <span style={{ color: '#EC4899' }}>& FREE SUPABASE DATABASE</span>
        </h1>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(236, 72, 153, 0.4)', borderRadius: 24, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ fontSize: 42 }}>▲</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 800 }}>
                  Vercel Edge Network
                </div>
                <div style={{ color: '#94a3b8', fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600 }}>
                  Global CDN, zero-config deployment, custom domains
                </div>
              </div>
            </div>
            <div style={{ background: '#10b981', color: '#ffffff', padding: '6px 16px', borderRadius: 999, fontFamily: "'Space Mono', monospace", fontWeight: 800, fontSize: 16 }}>
              FREE
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(16, 185, 129, 0.4)', borderRadius: 24, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ fontSize: 42 }}>⚡</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 800 }}>
                  Supabase PostgreSQL & Auth
                </div>
                <div style={{ color: '#94a3b8', fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600 }}>
                  Free cloud database, Google OAuth, certificate ledger
                </div>
              </div>
            </div>
            <div style={{ background: '#10b981', color: '#ffffff', padding: '6px 16px', borderRadius: 999, fontFamily: "'Space Mono', monospace", fontWeight: 800, fontSize: 16 }}>
              FREE
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(236,72,153,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          🔒 Google OAuth Login
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          📜 Anti-Tamper Certificates
        </div>
      </div>
    </div>
  );
};

/* SCENE 5: REMOTION CODE VIDEO GENERATION */
const Scene5RemotionCode: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'rgba(7, 10, 20, 0.9)',
          border: '2px solid #8B5CF6',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#8B5CF6',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 800,
          boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)',
        }}
      >
        🎥 TOOL #4: PROGRAMMATIC VIDEO IN CODE
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 20,
          width: '100%',
          maxWidth: 980,
          transform: `scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 64,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          REMOTION + PLAYWRIGHT <br />
          <span style={{ color: '#8B5CF6' }}>VIDEO CREATED IN CODE!</span>
        </h1>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(139, 92, 246, 0.4)', borderRadius: 24, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ fontSize: 42 }}>🎬</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 800 }}>
                  Remotion (React Video Engine)
                </div>
                <div style={{ color: '#94a3b8', fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600 }}>
                  Write videos with React, TypeScript & CSS keyframes
                </div>
              </div>
            </div>
            <div style={{ background: '#10b981', color: '#ffffff', padding: '6px 16px', borderRadius: 999, fontFamily: "'Space Mono', monospace", fontWeight: 800, fontSize: 16 }}>
              OPEN SOURCE
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(0, 210, 255, 0.4)', borderRadius: 24, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ fontSize: 42 }}>🤖</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 800 }}>
                  Playwright + FFmpeg
                </div>
                <div style={{ color: '#94a3b8', fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600 }}>
                  Automated high-FPS gameplay capture and MP4 encoding
                </div>
              </div>
            </div>
            <div style={{ background: '#10b981', color: '#ffffff', padding: '6px 16px', borderRadius: 999, fontFamily: "'Space Mono', monospace", fontWeight: 800, fontSize: 16 }}>
              100% FREE
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          ✂️ Zero Paid Video Editors
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          ⚡ 100% Automated
        </div>
      </div>
    </div>
  );
};

/* SCENE 6: CALL TO ACTION & FREE ACCESS */
const Scene6OutroCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const pulse = interpolate(Math.sin(frame / 5), [-1, 1], [0.98, 1.03]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '2px solid #10b981',
          borderRadius: 999,
          padding: '10px 32px',
          color: '#10b981',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 2,
        }}
      >
        🚀 START BUILDING TODAY
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 26,
          width: '100%',
          maxWidth: 980,
          transform: `scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 70,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          ALL YOU NEED IS <br />
          <span style={{ color: '#10b981' }}>A PC AND AI!</span>
        </h1>

        <div
          style={{
            width: '100%',
            transform: `scale(${pulse})`,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(0,210,255,0.2) 100%)',
            border: '3px solid #10b981',
            borderRadius: 36,
            padding: '36px 28px',
            boxShadow: '0 0 60px rgba(16, 185, 129, 0.6)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, color: '#10b981', letterSpacing: 3, fontWeight: 800 }}>
            🌟 SEE ALL LIVE PROJECTS
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: 1, wordBreak: 'break-all' }}>
            advancedlogiclabs.dpdns.org
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, color: '#00D2FF', fontWeight: 700 }}>
            🚗 Play Mumbai Traffic Hero & Solar System
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
          <span>💬</span> WHAT PROJECT WILL YOU BUILD? COMMENT BELOW!
        </div>
      </div>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, color: '#64748b', letterSpacing: 2 }}>
        CLASS OF LEARNERS • LIKE & SUBSCRIBE
      </div>
    </div>
  );
};
