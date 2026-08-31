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
import { Background } from '../components/Background';

interface LongProjectItem {
  num: number;
  title: string;
  category: string;
  tagline: string;
  image: string;
  accentColor: string;
  badge: string;
}

const longProjects: LongProjectItem[] = [
  {
    num: 1,
    title: 'Mumbai Traffic Hero',
    category: '3D DRIVING SIMULATOR',
    tagline: 'Authentic Mumbai city streets, AI traffic, rickshaw swerves & 100+ licensing tests.',
    image: '05_traffic_driving_gameplay.png',
    accentColor: '#F2B84B',
    badge: '🚗 3D SIMULATOR',
  },
  {
    num: 2,
    title: 'Solar Engine 3D',
    category: 'CELESTIAL ORBITAL PHYSICS',
    tagline: 'Accurate planetary orbits, real gravity physics, and time-travel controls.',
    image: '03_solar_system.png',
    accentColor: '#00D2FF',
    badge: '🪐 COSMIC ORRERY',
  },
  {
    num: 3,
    title: 'ATI Typing Instructor',
    category: 'ARCADE SPEED TYPING',
    tagline: 'High-speed touch typing training with live telemetry metrics and custom lessons.',
    image: '04_ati_typing_instructor.png',
    accentColor: '#A855F7',
    badge: '⚡ SPEED TYPING',
  },
  {
    num: 4,
    title: 'Gesture Controller AI',
    category: 'COMPUTER VISION AI',
    tagline: 'Real-time webcam hand tracking AI for controlling browser apps in mid-air.',
    image: '09_desktop_project_gesture_control.png',
    accentColor: '#EC4899',
    badge: '🖐️ WEBCAM VISION AI',
  },
  {
    num: 5,
    title: 'Dynamic QR Studio',
    category: 'QR CODE GENERATOR & ANALYTICS',
    tagline: 'Dynamic redirection, custom gradient styling, embedded logos & vector export.',
    image: '11_desktop_project_qr_editor.png',
    accentColor: '#38BDF8',
    badge: '📱 DYNAMIC QR STUDIO',
  },
  {
    num: 6,
    title: 'Terra3D & RPG Engine',
    category: '3D GLOBE & PROCEDURAL RPG',
    tagline: 'Interactive 3D Earth atlas combined with retro procedural quest games.',
    image: '10_desktop_project_rpg_engine.png',
    accentColor: '#10B981',
    badge: '🌍 3D ATLAS & RPG',
  },
];

export const LongFormStudioShowcase: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070e', overflow: 'hidden' }}>
      <Background />

      <Audio src={staticFile('audio/bg_cyber_beat.wav')} volume={0.14} loop />

      {/* 1. INTRO (0 - 360 frames / 12s) */}
      <Sequence from={0} durationInFrames={360}>
        <Audio src={staticFile('audio/long_01_intro.mp3')} volume={1} />
        <LongIntroScene />
      </Sequence>

      {/* 2. 6-PROJECTS WALKTHROUGH (360 - 1440 frames / 36s = 6s each) */}
      <Sequence from={360} durationInFrames={1080}>
        <Audio src={staticFile('audio/long_02_showcase.mp3')} volume={1} />
        <LongProjectsCarousel />
      </Sequence>

      {/* 3. OUTRO & LIVE SITE (1440 - 1800 frames / 12s) */}
      <Sequence from={1440} durationInFrames={360}>
        <Audio src={staticFile('audio/long_03_outro.mp3')} volume={1} />
        <Audio src={staticFile('audio/ding.wav')} volume={0.5} />
        <LongOutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const LongIntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const textSlide = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 100 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 100px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      {/* Left Text */}
      <div
        style={{
          flex: 1.2,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          transform: `translateX(${(1 - textSlide) * -40}px)`,
          opacity: Math.max(0, textSlide),
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(242, 184, 75, 0.12)',
            border: '1.5px solid #F2B84B',
            borderRadius: 999,
            padding: '8px 24px',
            width: 'fit-content',
            color: '#F2B84B',
            fontFamily: "'Space Mono', monospace",
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          ✨ STUDENT TECH STUDIO • MUMBAI
        </div>

        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 68,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          CLASS OF LEARNERS <br />
          <span style={{ color: '#00D2FF' }}>Interactive 3D Web Studio</span>
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 24,
            lineHeight: 1.5,
            color: '#94a3b8',
            margin: 0,
            maxWidth: 700,
          }}
        >
          Building high-performance 3D simulations, games, and engines directly on the open web. Zero installs, pure JavaScript & Three.js.
        </p>
      </div>

      {/* Right Hero Image Card */}
      <div
        style={{
          flex: 1,
          height: 600,
          borderRadius: 36,
          overflow: 'hidden',
          border: '3px solid rgba(0, 210, 255, 0.5)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.9), 0 0 50px rgba(0,210,255,0.3)',
          transform: `scale(${logoScale})`,
        }}
      >
        <Img
          src={staticFile('01_home_hero.png')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    </div>
  );
};

const LongProjectsCarousel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 6 projects over 1080 frames (180 frames = 6s each)
  const index = Math.min(Math.floor(frame / 180), longProjects.length - 1);
  const project = longProjects[index];
  const localFrame = frame % 180;

  const cardSpring = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 110 } });
  const zoom = interpolate(localFrame, [0, 180], [1.0, 1.08]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 100px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: `1.5px solid ${project.accentColor}`,
            borderRadius: 999,
            padding: '8px 24px',
            color: project.accentColor,
            fontFamily: "'Space Mono', monospace",
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          FEATURED PROJECT #{project.num} OF 6
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 10 }}>
          {longProjects.map((p, i) => (
            <div
              key={i}
              style={{
                width: i === index ? 40 : 12,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === index ? project.accentColor : 'rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Center Layout: Left Image Mockup, Right Details */}
      <div
        style={{
          display: 'flex',
          gap: 60,
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            flex: 1.3,
            height: 560,
            borderRadius: 32,
            overflow: 'hidden',
            border: `3px solid ${project.accentColor}`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.9), 0 0 40px ${project.accentColor}44`,
            transform: `scale(${cardSpring})`,
          }}
        >
          <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})` }}>
            <Img
              src={staticFile(project.image)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 20,
              fontWeight: 800,
              color: project.accentColor,
              letterSpacing: 3,
            }}
          >
            {project.category}
          </div>

          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 60,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {project.title}
          </h1>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 24,
              lineHeight: 1.5,
              color: '#cbd5e1',
              margin: 0,
            }}
          >
            {project.tagline}
          </p>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 20,
              padding: '16px 24px',
              color: '#ffffff',
              fontFamily: "'Space Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              width: 'fit-content',
            }}
          >
            {project.badge}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontFamily: "'Space Mono', monospace", fontSize: 16, color: '#64748b' }}>
        EXPLORE LIVE: advancedlogiclabs.dpdns.org
      </div>
    </div>
  );
};

const LongOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 100px',
        textAlign: 'center',
        gap: 36,
        zIndex: 10,
      }}
    >
      <h1
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 68,
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        EXPERIENCE ALL 6 APPS <span style={{ color: '#F2B84B' }}>LIVE TODAY</span>
      </h1>

      <div
        style={{
          background: 'linear-gradient(135deg, rgba(242,184,75,0.15) 0%, rgba(0,210,255,0.15) 100%)',
          border: '3px solid #F2B84B',
          borderRadius: 36,
          padding: '36px 60px',
          boxShadow: '0 0 60px rgba(242, 184, 75, 0.5)',
          transform: `scale(${scale})`,
        }}
      >
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, color: '#F2B84B', fontWeight: 800, marginBottom: 8 }}>
          🌐 OFFICIAL WEBSITE
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 44, fontWeight: 900, color: '#ffffff' }}>
          advancedlogiclabs.dpdns.org
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, color: '#00D2FF', marginTop: 12 }}>
          📱 Android App available at /download
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ background: '#ef4444', color: '#fff', padding: '16px 36px', borderRadius: 20, fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 800 }}>
          🔔 SUBSCRIBE FOR UPDATES
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '16px 36px', borderRadius: 20, fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 800 }}>
          🔗 LINK IN DESCRIPTION
        </div>
      </div>
    </div>
  );
};
