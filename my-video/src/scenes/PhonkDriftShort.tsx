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

export const PhonkDriftShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050308', overflow: 'hidden' }}>
      <ThemedBackground theme="traffic" />
      <ProgressBar />

      {/* Modern, Deep & Punchy Drift Beat (Zero 8-bit chiptune cheese) */}
      <Audio src={staticFile('audio/bg_pro_drift_beat.wav')} volume={0.7} loop />

      {/* 1. HOOK: "Bro thought he could drift in Mumbai traffic!" (0 - 180 / 6s) */}
      <Sequence from={0} durationInFrames={180}>
        <Audio src={staticFile('audio/funk_01_hook.mp3')} volume={1} />
        <PhonkHookScene />
      </Sequence>

      {/* 2. AUTO-RICKSHAW CHAOS: "Look at these autos cutting at 200 km/h!" (180 - 360 / 6s) */}
      <Sequence from={180} durationInFrames={180}>
        <Audio src={staticFile('audio/funk_02_autos.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.5} />
        <PhonkAutosScene />
      </Sequence>

      {/* 3. POLICE CHASE & RED LIGHTS: "Police radar chasing, zero brakes!" (360 - 540 / 6s) */}
      <Sequence from={360} durationInFrames={180}>
        <Audio src={staticFile('audio/funk_03_police.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.5} />
        <PhonkPoliceChaseScene />
      </Sequence>

      {/* 4. MAX DRIFT COMBO: "Pure Mumbai drift physics running 60 FPS!" (540 - 720 / 6s) */}
      <Sequence from={540} durationInFrames={180}>
        <Audio src={staticFile('audio/funk_04_drift.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.5} />
        <PhonkMaxDriftScene />
      </Sequence>

      {/* 5. OUTRO HYPE: "Can you beat my high score? Play free right now!" (720 - 900 / 6s) */}
      <Sequence from={720} durationInFrames={180}>
        <Audio src={staticFile('audio/funk_05_cta.mp3')} volume={1} />
        <PhonkOutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

/* 1. HOOK SCENE WITH REAL LIVE DRIVING GAMEPLAY VIDEO */
const PhonkHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beatBounce = interpolate(Math.sin((frame / 14) * Math.PI * 2), [-1, 1], [0.98, 1.03]);
  const alertScale = spring({ frame, fps, config: { damping: 10, stiffness: 140 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 40px 80px 40px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: '#ef4444',
          color: '#ffffff',
          fontFamily: "'Space Mono', monospace",
          fontSize: 26,
          fontWeight: 900,
          padding: '12px 36px',
          borderRadius: 999,
          boxShadow: '0 0 45px rgba(239, 68, 68, 0.95)',
          transform: `scale(${alertScale})`,
          letterSpacing: 2,
        }}
      >
        💀 BRO THOUGHT HE COULD DRIFT 💀
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
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 72,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.05,
            margin: 0,
            textShadow: '0 0 40px rgba(242, 184, 75, 0.8)',
          }}
        >
          MUMBAI DRIFT <br />
          <span style={{ color: '#F2B84B' }}>LIVE GAMEPLAY 🏎️💨</span>
        </h1>

        {/* REAL MOVING 60 FPS GAMEPLAY VIDEO CONTAINER */}
        <div
          style={{
            width: '100%',
            height: 560,
            borderRadius: 34,
            overflow: 'hidden',
            border: '3.5px solid #F2B84B',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 60px rgba(242, 184, 75, 0.6)',
            transform: `scale(${beatBounce})`,
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
              background: '#ef4444',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: 16,
              fontFamily: "'Space Mono', monospace",
              fontSize: 22,
              fontWeight: 900,
              boxShadow: '0 0 20px rgba(239,68,68,0.8)',
            }}
          >
            🔥 240 KM/H
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              background: 'rgba(7,10,20,0.92)',
              border: '2px solid #F2B84B',
              color: '#F2B84B',
              padding: '12px 24px',
              borderRadius: 16,
              fontFamily: "'Space Mono', monospace",
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            ⚡ LIVE THREE.JS 3D
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          color: '#F2B84B',
          fontWeight: 800,
          letterSpacing: 3,
        }}
      >
        🔊 REAL GAMEPLAY FOOTAGE
      </div>
    </div>
  );
};

/* 2. AUTOS SCENE WITH LIVE GAMEPLAY */
const PhonkAutosScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beatBounce = interpolate(Math.sin((frame / 14) * Math.PI * 2), [-1, 1], [0.97, 1.03]);
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 40px 80px 40px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: '#F2B84B',
          color: '#000000',
          fontFamily: "'Space Mono', monospace",
          fontSize: 24,
          fontWeight: 900,
          padding: '12px 34px',
          borderRadius: 999,
          boxShadow: '0 0 35px rgba(242, 184, 75, 0.8)',
          transform: `scale(${scale})`,
          letterSpacing: 2,
        }}
      >
        🛺 AUTO-RICKSHAW CUTS 🛺
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
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 66,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.06,
            margin: 0,
          }}
        >
          CUTTING 3 LANES AT <br />
          <span style={{ color: '#ef4444' }}>MAXIMUM VELOCITY!</span>
        </h1>

        <div
          style={{
            width: '100%',
            height: 560,
            borderRadius: 34,
            overflow: 'hidden',
            border: '3.5px solid #ef4444',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 60px rgba(239, 68, 68, 0.6)',
            transform: `scale(${beatBounce})`,
            position: 'relative',
            background: '#070a14',
          }}
        >
          <OffthreadVideo
            src={staticFile('videos/gameplay_driving.mp4')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            startFrom={180}
          />

          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: 16,
              fontFamily: "'Space Mono', monospace",
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            ⚠️ NO INDICATOR
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(242,184,75,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          ⚡ 60 FPS WebGL
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          🔥 Indian Traffic AI
        </div>
      </div>
    </div>
  );
};

/* 3. POLICE CHASE & ACADEMY SCENE */
const PhonkPoliceChaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beatBounce = interpolate(Math.sin((frame / 14) * Math.PI * 2), [-1, 1], [0.97, 1.03]);
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 40px 80px 40px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: '#00D2FF',
          color: '#000000',
          fontFamily: "'Space Mono', monospace",
          fontSize: 24,
          fontWeight: 900,
          padding: '12px 34px',
          borderRadius: 999,
          boxShadow: '0 0 35px rgba(0, 210, 255, 0.8)',
          transform: `scale(${scale})`,
          letterSpacing: 2,
        }}
      >
        🚨 5-STAR POLICE RADAR CHASE 🚨
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
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 66,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.06,
            margin: 0,
          }}
        >
          RED LIGHTS JUMPED <br />
          <span style={{ color: '#00D2FF' }}>SPEED CHECKPOINTS!</span>
        </h1>

        <div
          style={{
            width: '100%',
            height: 560,
            borderRadius: 34,
            overflow: 'hidden',
            border: '3.5px solid #00D2FF',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 60px rgba(0, 210, 255, 0.5)',
            transform: `scale(${beatBounce})`,
            position: 'relative',
            background: '#070a14',
          }}
        >
          <OffthreadVideo
            src={staticFile('videos/gameplay_academy.mp4')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            startFrom={0}
          />

          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              background: '#ef4444',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: 16,
              fontFamily: "'Space Mono', monospace",
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            🚓 ₹5000 CHALLAN PENALTY
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,210,255,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          🚔 Police Interceptor AI
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(242,184,75,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          🏁 100+ License Tests
        </div>
      </div>
    </div>
  );
};

/* 4. MAX DRIFT COCKPIT & CHASE SCENE */
const PhonkMaxDriftScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beatBounce = interpolate(Math.sin((frame / 14) * Math.PI * 2), [-1, 1], [0.97, 1.03]);
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 40px 80px 40px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: '#EC4899',
          color: '#ffffff',
          fontFamily: "'Space Mono', monospace",
          fontSize: 24,
          fontWeight: 900,
          padding: '12px 34px',
          borderRadius: 999,
          boxShadow: '0 0 35px rgba(236, 72, 153, 0.8)',
          transform: `scale(${scale})`,
          letterSpacing: 2,
        }}
      >
        🏎️ 3D COCKPIT & CHASE CAMS 🏎️
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
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 66,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.06,
            margin: 0,
          }}
        >
          PURE MUMBAI DRIFT <br />
          <span style={{ color: '#EC4899' }}>NO DOWNLOAD NEEDED!</span>
        </h1>

        <div
          style={{
            width: '100%',
            height: 560,
            borderRadius: 34,
            overflow: 'hidden',
            border: '3.5px solid #EC4899',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 60px rgba(236, 72, 153, 0.5)',
            transform: `scale(${beatBounce})`,
            position: 'relative',
            background: '#070a14',
          }}
        >
          <OffthreadVideo
            src={staticFile('videos/gameplay_driving.mp4')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            startFrom={360}
          />

          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              background: 'rgba(7,10,20,0.92)',
              border: '2px solid #EC4899',
              padding: '14px 20px',
              borderRadius: 18,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#EC4899', fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 900 }}>
              🔥 LIVE VEHICLE DYNAMICS
            </span>
            <span style={{ color: '#00D2FF', fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 800 }}>
              100% IN BROWSER
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(236,72,153,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          📱 Mobile Friendly
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,210,255,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          🎮 Keyboard & Touch Controls
        </div>
      </div>
    </div>
  );
};

/* 5. OUTRO HYPE SCENE */
const PhonkOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const pulse = interpolate(Math.sin((frame / 14) * Math.PI * 2), [-1, 1], [0.98, 1.03]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 40px 80px 40px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'rgba(242, 184, 75, 0.2)',
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
        ✨ 100% FREE • PLAY NOW
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
            fontSize: 72,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.06,
            margin: 0,
          }}
        >
          CAN YOU BEAT MY <br />
          <span style={{ color: '#F2B84B' }}>HIGH SCORE? 🏎️💨</span>
        </h1>

        <div
          style={{
            width: '100%',
            transform: `scale(${pulse})`,
            background: 'linear-gradient(135deg, rgba(242,184,75,0.25) 0%, rgba(239,68,68,0.25) 100%)',
            border: '3.5px solid #F2B84B',
            borderRadius: 36,
            padding: '36px 28px',
            boxShadow: '0 0 60px rgba(242, 184, 75, 0.7)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, color: '#F2B84B', letterSpacing: 3, fontWeight: 900 }}>
            🌐 OFFICIAL GAME SITE
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: 1, wordBreak: 'break-all' }}>
            advancedlogiclabs.dpdns.org
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, color: '#00D2FF', fontWeight: 700 }}>
            🏆 Play at /Traffic/Driving
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
          <span>👇</span> COMMENT YOUR BEST DRIFT SCORE!
        </div>
      </div>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, color: '#64748b', letterSpacing: 2 }}>
        CLASS OF LEARNERS • LIKE & SUBSCRIBE
      </div>
    </div>
  );
};
