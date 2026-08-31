import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Background } from '../components/Background';
import { ProgressBar } from '../components/ProgressBar';
import { HeaderBadge } from '../components/HeaderBadge';
import { OutroScene } from './OutroScene';

export const TrafficHeroShorts: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070e', overflow: 'hidden' }}>
      <Background />
      <ProgressBar />

      {/* Cyber Beat Audio */}
      <Audio src={staticFile('audio/bg_cyber_beat.wav')} volume={0.16} loop />

      {/* SCENE 1: HOOK (0 - 210 / 7s) */}
      <Sequence from={0} durationInFrames={210}>
        <Audio src={staticFile('audio/tr_01_hook.mp3')} volume={1} />
        <TrafficSceneHook />
      </Sequence>

      {/* SCENE 2: GAMEPLAY (210 - 450 / 8s) */}
      <Sequence from={210} durationInFrames={240}>
        <Audio src={staticFile('audio/tr_02_gameplay.mp3')} volume={1} />
        <TrafficSceneGameplay />
      </Sequence>

      {/* SCENE 3: ACADEMY & CERTIFICATES (450 - 690 / 8s) */}
      <Sequence from={450} durationInFrames={240}>
        <Audio src={staticFile('audio/tr_03_academy.mp3')} volume={1} />
        <TrafficSceneAcademy />
      </Sequence>

      {/* SCENE 4: CTA & URL (690 - 900 / 7s) */}
      <Sequence from={690} durationInFrames={210}>
        <Audio src={staticFile('audio/tr_04_cta.mp3')} volume={1} />
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const TrafficSceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const textSlide = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 100 } });

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
      <HeaderBadge label="MUMBAI DRIVING SIMULATOR" icon="🚗" tagColor="#F2B84B" />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 28,
          maxWidth: 960,
        }}
      >
        <div
          style={{
            transform: `translateY(${(1 - textSlide) * 40}px)`,
            opacity: Math.max(0, textSlide),
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 24,
              fontWeight: 700,
              color: '#F2B84B',
              letterSpacing: 4,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            CAN YOU SURVIVE MUMBAI ROADS?
          </div>
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
            MUMBAI TRAFFIC <span style={{ color: '#F2B84B' }}>HERO 3D</span>
          </h1>
        </div>

        <div
          style={{
            width: '100%',
            height: 540,
            borderRadius: 32,
            overflow: 'hidden',
            border: '2px solid #F2B84B',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(242, 184, 75, 0.3)',
            transform: `scale(${scale})`,
            position: 'relative',
          }}
        >
          <Img
            src={staticFile('05_traffic_driving_gameplay.png')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(242, 184, 75, 0.4)',
            borderRadius: 16,
            padding: '14px 28px',
            color: '#F2B84B',
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          🏙️ Andheri & Marine Drive
        </div>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(0, 210, 255, 0.4)',
            borderRadius: 16,
            padding: '14px 28px',
            color: '#00D2FF',
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          ⚡ Real-time WebGL
        </div>
      </div>
    </div>
  );
};

const TrafficSceneGameplay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const textSlide = spring({ frame: frame - 6, fps, config: { damping: 14, stiffness: 100 } });

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
      <HeaderBadge label="HEAVY TRAFFIC AI & ROAD RULES" icon="🚦" tagColor="#00D2FF" />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 28,
          maxWidth: 960,
        }}
      >
        <div
          style={{
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
              lineHeight: 1.1,
              margin: '0 0 8px 0',
            }}
          >
            Autos, Buses, Signals & <br />
            <span style={{ color: '#00D2FF' }}>Rule Breaker Profiling</span>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, color: '#94a3b8', margin: 0 }}>
            Realistic NPC AI, aggressive overtakes, zebra crossings & police fines.
          </p>
        </div>

        <div
          style={{
            width: '100%',
            height: 540,
            borderRadius: 32,
            overflow: 'hidden',
            border: '2px solid #00D2FF',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 210, 255, 0.3)',
            transform: `scale(${scale})`,
            position: 'relative',
          }}
        >
          <Img
            src={staticFile('07_desktop_project_traffic_gameplay.png')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 24px', color: '#fff', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 20 }}>
          🛺 Rickshaw Swerves
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 24px', color: '#fff', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 20 }}>
          🚓 Police Radar Checks
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 24px', color: '#fff', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 20 }}>
          🚌 Auto & BEST Bus Fleet
        </div>
      </div>
    </div>
  );
};

const TrafficSceneAcademy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const textSlide = spring({ frame: frame - 6, fps, config: { damping: 14, stiffness: 100 } });

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
      <HeaderBadge label="DRIVING ACADEMY & LICENSES" icon="🎓" tagColor="#10B981" />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 28,
          maxWidth: 960,
        }}
      >
        <div
          style={{
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
              lineHeight: 1.1,
              margin: '0 0 8px 0',
            }}
          >
            Master 52 Scenarios & <br />
            <span style={{ color: '#10B981' }}>Earn Official Certificates</span>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, color: '#94a3b8', margin: 0 }}>
            Learn actual RTO traffic rules, junction etiquette & defensive driving.
          </p>
        </div>

        <div
          style={{
            width: '100%',
            height: 540,
            borderRadius: 32,
            overflow: 'hidden',
            border: '2px solid #10B981',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(16, 185, 129, 0.3)',
            transform: `scale(${scale})`,
            position: 'relative',
            background: '#fff',
          }}
        >
          <Img
            src={staticFile('official_traffic_certificate.png')}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 24px', color: '#10B981', fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 20 }}>
          📜 Mumbai Police & Sneh Asha Certified
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 24px', color: '#F2B84B', fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 20 }}>
          🏆 52 Verified Scenarios
        </div>
      </div>
    </div>
  );
};
