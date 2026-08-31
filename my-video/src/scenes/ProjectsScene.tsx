import React from 'react';
import {
  Img,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { HeaderBadge } from '../components/HeaderBadge';

interface ProjectData {
  title: string;
  category: string;
  tagline: string;
  image: string;
  badge: string;
  accentColor: string;
  features: string[];
}

const projects: ProjectData[] = [
  {
    title: 'Mumbai Traffic Hero',
    category: '3D DRIVING SIMULATOR',
    tagline: 'Master Mumbai streets & Indian traffic rules in real-time 3D!',
    image: '05_traffic_driving_gameplay.png',
    badge: '🚗 FLAGSHIP 3D SIMULATOR',
    accentColor: '#F2B84B',
    features: ['Real-time Mumbai Traffic AI', '100+ Driving License Exams', 'Custom Vehicles & Lambos'],
  },
  {
    title: 'Solar Engine 3D',
    category: 'ASTRONOMY & PHYSICS',
    tagline: 'Explore planets, orbits, and gravity in an accurate celestial orrery.',
    image: '03_solar_system.png',
    badge: '🪐 CELESTIAL ORRERY',
    accentColor: '#00D2FF',
    features: ['Accurate Orbital Physics', 'Time-Dilation Controls', 'Full 3D Planetary Exploration'],
  },
  {
    title: 'ATI Typing Instructor',
    category: 'ARCADE TYPING & AI GESTURES',
    tagline: 'Hardcore touch typing with arcade themes and webcam hand tracking.',
    image: '04_ati_typing_instructor.png',
    badge: '⚡ SPEED TYPING & GESTURES',
    accentColor: '#A855F7',
    features: ['Live WPM & Accuracy Telemetry', 'Webcam Gesture AI Controls', 'Multiple Difficulty Tiers'],
  },
  {
    title: 'Terra3D & RPG Engine',
    category: 'WORLD ATLAS & PROCEDURAL RPG',
    tagline: 'Interactive 3D Earth atlas and retro tile-based quest adventures.',
    image: '10_desktop_project_rpg_engine.png',
    badge: '🌍 3D ATLAS & QUEST ENGINE',
    accentColor: '#10B981',
    features: ['Interactive 3D Globe', 'Procedural Terrain & Shaders', 'Retro RPG Quest Systems'],
  },
];

export const ProjectsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 4 projects across 360 frames (90 frames each = 3s)
  const projectIndex = Math.min(Math.floor(frame / 90), projects.length - 1);
  const project = projects[projectIndex];
  const localFrame = frame % 90;

  const cardScale = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const textSlide = spring({
    frame: localFrame - 5,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const featuresSlide = spring({
    frame: localFrame - 15,
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
      {/* Top Header Badge */}
      <HeaderBadge
        label={`PROJECT ${projectIndex + 1} OF 4`}
        icon="🔥"
        tagColor={project.accentColor}
      />

      {/* Main Project Card */}
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
              color: project.accentColor,
              letterSpacing: 4,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            {project.category}
          </div>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 66,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              margin: '0 0 12px 0',
              textShadow: `0 0 30px ${project.accentColor}44`,
            }}
          >
            {project.title}
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 28,
              color: '#94a3b8',
              margin: 0,
              maxWidth: 820,
            }}
          >
            {project.tagline}
          </p>
        </div>

        {/* Big Preview Mockup */}
        <div
          style={{
            width: '100%',
            height: 520,
            borderRadius: 32,
            overflow: 'hidden',
            border: `2px solid ${project.accentColor}`,
            boxShadow: `0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px ${project.accentColor}44`,
            transform: `scale(${cardScale})`,
            position: 'relative',
            background: '#070a14',
          }}
        >
          <Img
            src={staticFile(project.image)}
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
              border: `1px solid ${project.accentColor}`,
              borderRadius: 14,
              padding: '10px 20px',
              color: '#ffffff',
              fontFamily: "'Space Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {project.badge}
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            transform: `translateY(${(1 - featuresSlide) * 30}px)`,
            opacity: Math.max(0, featuresSlide),
          }}
        >
          {project.features.map((feat, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 18,
                padding: '14px 24px',
                fontFamily: "'Inter', sans-serif",
                fontSize: 22,
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

      {/* Mini Progress Indicators for the 4 projects */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
        }}
      >
        {projects.map((p, idx) => {
          const isActive = idx === projectIndex;
          return (
            <div
              key={idx}
              style={{
                width: isActive ? 60 : 20,
                height: 10,
                borderRadius: 5,
                backgroundColor: isActive ? p.accentColor : 'rgba(255, 255, 255, 0.2)',
                boxShadow: isActive ? `0 0 12px ${p.accentColor}` : 'none',
                transition: 'all 0.3s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
