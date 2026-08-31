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
import { IntroScene } from './IntroScene';
import { AboutScene } from './AboutScene';
import { OutroScene } from './OutroScene';

interface ProjectCardProps {
  index: number;
  total: number;
  title: string;
  category: string;
  tagline: string;
  image: string;
  badge: string;
  accentColor: string;
  features: string[];
  audioFile: string;
}

const ProjectSingleScene: React.FC<ProjectCardProps> = ({
  index,
  total,
  title,
  category,
  tagline,
  image,
  badge,
  accentColor,
  features,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const textSlide = spring({
    frame: frame - 4,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const featuresSlide = spring({
    frame: frame - 12,
    fps,
    config: { damping: 12, stiffness: 110 },
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
      <Audio src={staticFile(`audio/${audioFile}`)} volume={1} />
      <Audio src={staticFile('audio/whoosh.wav')} volume={0.4} />

      {/* Top Header Badge */}
      <HeaderBadge
        label={`PROJECT ${index} OF ${total}`}
        icon="🔥"
        tagColor={accentColor}
      />

      {/* Main Project Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          width: '100%',
          maxWidth: 960,
        }}
      >
        {/* Category & Title */}
        <div
          style={{
            textAlign: 'center',
            transform: `translateY(${(1 - textSlide) * 40}px)`,
            opacity: Math.max(0, textSlide),
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 22,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: 4,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {category}
          </div>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 62,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              margin: '0 0 10px 0',
              textShadow: `0 0 30px ${accentColor}44`,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 26,
              color: '#94a3b8',
              margin: 0,
              maxWidth: 820,
            }}
          >
            {tagline}
          </p>
        </div>

        {/* Big Preview Mockup */}
        <div
          style={{
            width: '100%',
            height: 520,
            borderRadius: 32,
            overflow: 'hidden',
            border: `2px solid ${accentColor}`,
            boxShadow: `0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px ${accentColor}44`,
            transform: `scale(${cardScale})`,
            position: 'relative',
            background: '#070a14',
          }}
        >
          <Img
            src={staticFile(image)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Tag Pill inside image */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(7, 10, 20, 0.85)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${accentColor}`,
              borderRadius: 14,
              padding: '10px 20px',
              color: '#ffffff',
              fontFamily: "'Space Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {badge}
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            justifyContent: 'center',
            transform: `translateY(${(1 - featuresSlide) * 30}px)`,
            opacity: Math.max(0, featuresSlide),
          }}
        >
          {features.map((feat, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 18,
                padding: '12px 22px',
                fontFamily: "'Inter', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#f8fafc',
                backdropFilter: 'blur(10px)',
              }}
            >
              ✨ {feat}
            </div>
          ))}
        </div>
      </div>

      {/* 6-step Progress Indicators */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5, 6].map((step) => {
          const isActive = step === index;
          return (
            <div
              key={step}
              style={{
                width: isActive ? 45 : 16,
                height: 8,
                borderRadius: 4,
                backgroundColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.2)',
                boxShadow: isActive ? `0 0 10px ${accentColor}` : 'none',
                transition: 'all 0.3s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export const SixProjectsShorts: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070e', overflow: 'hidden' }}>
      <Background />
      <ProgressBar />

      {/* Global Background Ambient Beat */}
      <Audio src={staticFile('audio/bg_cyber_beat.wav')} volume={0.16} loop />

      {/* 1. Intro Hook (0 to 120 / 4s) */}
      <Sequence from={0} durationInFrames={120}>
        <Audio src={staticFile('audio/sh6_01_intro.mp3')} volume={1} />
        <IntroScene />
      </Sequence>

      {/* 2. About Our Studio (120 to 240 / 4s) */}
      <Sequence from={120} durationInFrames={120}>
        <Audio src={staticFile('audio/sh6_02_about.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.4} />
        <AboutScene />
      </Sequence>

      {/* 3. Project 1: Mumbai Traffic Hero (240 to 390 / 5s) */}
      <Sequence from={240} durationInFrames={150}>
        <ProjectSingleScene
          index={1}
          total={6}
          title="Mumbai Traffic Hero"
          category="3D DRIVING SIMULATOR"
          tagline="Survive real Mumbai streets & Indian traffic tests in 3D!"
          image="05_traffic_driving_gameplay.png"
          badge="🚗 3D DRIVING SIMULATOR"
          accentColor="#F2B84B"
          features={['Real-Time Traffic AI', '100+ License Exams', 'Custom Supercars']}
          audioFile="sh6_03_traffic.mp3"
        />
      </Sequence>

      {/* 4. Project 2: Solar Engine 3D (390 to 540 / 5s) */}
      <Sequence from={390} durationInFrames={150}>
        <ProjectSingleScene
          index={2}
          total={6}
          title="Solar Engine 3D"
          category="CELESTIAL ORRERY & PHYSICS"
          tagline="Accurate solar system simulation with real orbital gravity."
          image="03_solar_system.png"
          badge="🪐 ORBITAL COSMOS"
          accentColor="#00D2FF"
          features={['Real Scale Orbits', 'Time Dilation Speed', 'Planetary Information']}
          audioFile="sh6_04_solar.mp3"
        />
      </Sequence>

      {/* 5. Project 3: ATI Typing Instructor (540 to 690 / 5s) */}
      <Sequence from={540} durationInFrames={150}>
        <ProjectSingleScene
          index={3}
          total={6}
          title="ATI Typing Instructor"
          category="ARCADE TOUCH TYPING"
          tagline="Master speed typing with real-time WPM telemetry and lessons."
          image="04_ati_typing_instructor.png"
          badge="⚡ SPEED TYPING"
          accentColor="#8B5CF6"
          features={['Live Speed Telemetry', 'Custom Lesson Modules', 'Arcade Themes']}
          audioFile="sh6_05_ati.mp3"
        />
      </Sequence>

      {/* 6. Project 4: Gesture Controller (690 to 840 / 5s) */}
      <Sequence from={690} durationInFrames={150}>
        <ProjectSingleScene
          index={4}
          total={6}
          title="Gesture Controller"
          category="COMPUTER VISION AI"
          tagline="Control browser games with webcam hand gestures in thin air!"
          image="09_desktop_project_gesture_control.png"
          badge="🖐️ WEBCAM HAND TRACKING"
          accentColor="#EC4899"
          features={['Zero Plugin Vision AI', 'Real-time Pinch & Swipe', 'Interactive Control']}
          audioFile="sh6_06_gesture.mp3"
        />
      </Sequence>

      {/* 7. Project 5: QR Editor & Dynamic QR (840 to 990 / 5s) */}
      <Sequence from={840} durationInFrames={150}>
        <ProjectSingleScene
          index={5}
          total={6}
          title="QR Editor & Dynamic Q"
          category="CUSTOM QR CODE STUDIO"
          tagline="Design dynamic QR codes with live branding, gradients & analytics."
          image="11_desktop_project_qr_editor.png"
          badge="📱 DYNAMIC QR STUDIO"
          accentColor="#38BDF8"
          features={['Dynamic URL Redirection', 'Custom Gradients & Logos', 'High-Res Vector Export']}
          audioFile="sh6_07_qr.mp3"
        />
      </Sequence>

      {/* 8. Project 6: Terra3D & RPG Engine (990 to 1140 / 5s) */}
      <Sequence from={990} durationInFrames={150}>
        <ProjectSingleScene
          index={6}
          total={6}
          title="Terra3D & RPG Engine"
          category="3D GLOBE & PROCEDURAL RPG"
          tagline="Interactive 3D Earth atlas and retro tile-based quest adventures."
          image="10_desktop_project_rpg_engine.png"
          badge="🌍 3D ATLAS & RPG"
          accentColor="#10B981"
          features={['Interactive 3D Globe', 'Procedural Shaders', 'Retro RPG Quest Systems']}
          audioFile="sh6_08_rpg.mp3"
        />
      </Sequence>

      {/* 9. Outro & URL CTA (1140 to 1350 / 7s) */}
      <Sequence from={1140} durationInFrames={210}>
        <Audio src={staticFile('audio/sh6_09_outro.mp3')} volume={1} />
        <Audio src={staticFile('audio/ding.wav')} volume={0.5} />
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
