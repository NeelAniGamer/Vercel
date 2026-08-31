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

export const MumbaiTrafficHeroThreeMinShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#070a14', overflow: 'hidden' }}>
      <ThemedBackground theme="traffic" />
      <ProgressBar />

      {/* Modern, Clean & Smooth Ambient Soundtrack (Zero clicks/ticks) */}
      <Audio src={staticFile('audio/bg_smooth_ambient.wav')} volume={0.2} loop />

      {/* ACT 1: THE ULTIMATE MUMBAI DRIVING CHALLENGE (0 - 900 frames / 30s) */}
      <Sequence from={0} durationInFrames={900}>
        <Audio src={staticFile('audio/mth_01_hook.mp3')} volume={1} />
        <Act1HookScene />
      </Sequence>

      {/* ACT 2: AUTONOMOUS AI & RAYCAST PHYSICS (900 - 1700 frames / 27s) */}
      <Sequence from={900} durationInFrames={800}>
        <Audio src={staticFile('audio/mth_02_ai.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Act2PhysicsAIScene />
      </Sequence>

      {/* ACT 3: 100+ DRIVING ACADEMY EXAMS & RTO TESTS (1700 - 2600 frames / 30s) */}
      <Sequence from={1700} durationInFrames={900}>
        <Audio src={staticFile('audio/mth_03_academy.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Act3AcademyLicenseScene />
      </Sequence>

      {/* ACT 4: GARAGE CUSTOM CARS & POLICE INTERCEPTORS (2600 - 3250 frames / 22s) */}
      <Sequence from={2600} durationInFrames={650}>
        <Audio src={staticFile('audio/mth_04_garage.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Act4GarageCustomCarsScene />
      </Sequence>

      {/* ACT 5: VIRAL CTA & PLAY FREE IN BROWSER (3250 - 3950 frames / 23s) */}
      <Sequence from={3250} durationInFrames={700}>
        <Audio src={staticFile('audio/mth_05_cta.mp3')} volume={1} />
        <Act5OutroCTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

/* ACT 1: HOOK WITH REAL LIVE DRIVING GAMEPLAY VIDEO */
const Act1HookScene: React.FC = () => {
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
          background: '#ef4444',
          color: '#ffffff',
          fontFamily: "'Space Mono', monospace",
          fontSize: 24,
          fontWeight: 900,
          padding: '14px 36px',
          borderRadius: 999,
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.9)',
          transform: `scale(${scale})`,
          letterSpacing: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span>🚨</span> CAN YOU SURVIVE 60 SECONDS? <span>🚨</span>
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
            fontSize: 70,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.06,
            margin: 0,
            textShadow: '0 10px 40px rgba(0,0,0,0.9)',
          }}
        >
          MUMBAI TRAFFIC <br />
          <span style={{ color: '#F2B84B' }}>3D DRIVING GAME!</span>
        </h1>

        <div
          style={{
            width: '100%',
            height: 560,
            borderRadius: 34,
            overflow: 'hidden',
            border: '3px solid #F2B84B',
            boxShadow: '0 30px 90px rgba(0,0,0,0.95), 0 0 50px rgba(242,184,75,0.6)',
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
              background: 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: 16,
              fontFamily: "'Space Mono', monospace",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            ⚠️ WATCH OUT FOR AUTOS!
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              background: 'rgba(7, 10, 20, 0.92)',
              border: '1.5px solid #F2B84B',
              color: '#F2B84B',
              padding: '10px 20px',
              borderRadius: 16,
              fontFamily: "'Space Mono', monospace",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            🎮 100% IN BROWSER
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(242,184,75,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          🛺 3-Lane Auto Swerves
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          🚦 Real Traffic Signals
        </div>
      </div>
    </div>
  );
};

/* ACT 2: AUTONOMOUS AI & VEHICLE PHYSICS WITH LIVE GAMEPLAY */
const Act2PhysicsAIScene: React.FC = () => {
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
        🧠 AUTONOMOUS TRAFFIC AI ENGINE
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
        <div>
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
            REAL-TIME CITY TRAFFIC <br />
            <span style={{ color: '#00D2FF' }}>& RAYCASTED PHYSICS</span>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 24, color: '#cbd5e1', margin: '8px 0 0 0', fontWeight: 600 }}>
            Dynamic suspension, tire friction, and multiple camera angles!
          </p>
        </div>

        <div
          style={{
            width: '100%',
            height: 540,
            borderRadius: 34,
            overflow: 'hidden',
            border: '3px solid #00D2FF',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px rgba(0, 210, 255, 0.4)',
            transform: `scale(${scale})`,
            position: 'relative',
            background: '#070a14',
          }}
        >
          <OffthreadVideo
            src={staticFile('videos/gameplay_driving.mp4')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            startFrom={150}
          />

          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              background: 'rgba(7, 10, 20, 0.92)',
              backdropFilter: 'blur(14px)',
              padding: '14px 20px',
              borderRadius: 18,
              border: '1px solid rgba(0, 210, 255, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#00D2FF', fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 800 }}>
              🏎️ COCKPIT & CHASE CAMS
            </span>
            <span style={{ color: '#F2B84B', fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700 }}>
              ⚡ 60 FPS WEBGL
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,210,255,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          🚌 BEST City Bus Schedules
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(242,184,75,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          🎯 Dynamic Speedometer Telemetry
        </div>
      </div>
    </div>
  );
};

/* ACT 3: DRIVING ACADEMY WITH REAL LEVEL GAMEPLAY & CERTIFICATES */
const Act3AcademyLicenseScene: React.FC = () => {
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
        🏆 OFFICIAL TRAFFIC ACADEMY & LICENSING
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
        <div>
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
            52 DRIVING SCENARIOS <br />
            <span style={{ color: '#F2B84B' }}>& OFFICIAL CERTIFICATES</span>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 24, color: '#cbd5e1', margin: '8px 0 0 0', fontWeight: 600 }}>
            Complete school zones, junction etiquette, emergency lanes, and earn your verified certificate!
          </p>
        </div>

        <div
          style={{
            width: '100%',
            height: 540,
            borderRadius: 34,
            overflow: 'hidden',
            border: '3px solid #F2B84B',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px rgba(242, 184, 75, 0.5)',
            transform: `scale(${scale})`,
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
              right: 20,
              background: 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: 16,
              fontFamily: "'Space Mono', monospace",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            🚨 RADAR SPEED FINES
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(242,184,75,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          🅿️ Real Mumbai Traffic Rules
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          📜 Mumbai Police & Sneh Asha Certified
        </div>
      </div>
    </div>
  );
};

/* ACT 4: AUTHENTIC MUMBAI FLEET & DYNAMICS */
const Act4GarageCustomCarsScene: React.FC = () => {
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
        🛺 AUTHENTIC MUMBAI FLEET & DYNAMICS
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
        <div>
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
            MULTI-VEHICLE FLEET <br />
            <span style={{ color: '#EC4899' }}>& PACEJKA MF 5.2 TIRE PHYSICS</span>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 24, color: '#cbd5e1', margin: '8px 0 0 0', fontWeight: 600 }}>
            Auto-rickshaws, BEST Buses, Sedans, Bikes & realistic handling on Indian roads.
          </p>
        </div>

        <div
          style={{
            width: '100%',
            height: 540,
            borderRadius: 34,
            overflow: 'hidden',
            border: '3px solid #EC4899',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px rgba(236, 72, 153, 0.4)',
            transform: `scale(${scale})`,
            position: 'relative',
            background: '#070a14',
          }}
        >
          <OffthreadVideo
            src={staticFile('videos/gameplay_driving.mp4')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            startFrom={300}
          />

          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              background: 'rgba(7, 10, 20, 0.92)',
              backdropFilter: 'blur(14px)',
              padding: '14px 20px',
              borderRadius: 18,
              border: '1px solid rgba(236, 72, 153, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#EC4899', fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 800 }}>
              🛺 AUTO, BEST BUS & SEDAN
            </span>
            <span style={{ color: '#00D2FF', fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700 }}>
              PACEJKA MF 5.2
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(236,72,153,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          🚌 BEST Single & Double Deckers
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(242,184,75,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          ⚡ 3-Wheel Rickshaw Dynamics
        </div>
      </div>
    </div>
  );
};

/* ACT 5: VIRAL CTA & PLAY FREE */
const Act5OutroCTAScene: React.FC = () => {
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
        ✨ 100% FREE • NO DOWNLOAD
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
          PLAY MUMBAI TRAFFIC <br />
          <span style={{ color: '#F2B84B' }}>HERO RIGHT NOW!</span>
        </h1>

        <div
          style={{
            width: '100%',
            transform: `scale(${pulse})`,
            background: 'linear-gradient(135deg, rgba(242,184,75,0.2) 0%, rgba(239,68,68,0.2) 100%)',
            border: '3px solid #F2B84B',
            borderRadius: 36,
            padding: '36px 28px',
            boxShadow: '0 0 60px rgba(242, 184, 75, 0.6)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, color: '#F2B84B', letterSpacing: 3, fontWeight: 800 }}>
            🚗 INSTANT WEB GAME
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
          <span>👇</span> COMMENT YOUR DRIVING SCORE BELOW!
        </div>
      </div>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, color: '#64748b', letterSpacing: 2 }}>
        CLASS OF LEARNERS • LIKE & SUBSCRIBE
      </div>
    </div>
  );
};
