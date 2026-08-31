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
import { ThemedBackground, ThemeType } from '../components/ThemedBackground';

interface ChapterProps {
  chNum: number;
  totalChapters: number;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  accentColor: string;
  theme: ThemeType;
  primaryImage: string;
  secondaryImage?: string;
  specs: { label: string; value: string }[];
  keyFeatures: string[];
  techStack: string[];
  audioFile: string;
}

const ChapterSlide: React.FC<ChapterProps> = ({
  chNum,
  totalChapters,
  title,
  subtitle,
  category,
  badge,
  accentColor,
  theme,
  primaryImage,
  secondaryImage,
  specs,
  keyFeatures,
  techStack,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const cardSpring = spring({ frame: frame - 4, fps, config: { damping: 14, stiffness: 100 } });
  const rightSpring = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 100 } });

  const zoom = interpolate(frame, [0, 2400], [1.0, 1.07], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <ThemedBackground theme={theme} />
      <Audio src={staticFile(`audio/${audioFile}`)} volume={1} />
      <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.35} />

      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px 70px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        {/* TOP CHAPTER BAR */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            paddingBottom: 16,
            transform: `translateY(${(1 - headerSpring) * -25}px)`,
            opacity: Math.max(0, headerSpring),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                background: accentColor,
                color: '#000',
                fontWeight: 900,
                fontSize: 18,
                borderRadius: 10,
                padding: '5px 16px',
                fontFamily: "'Space Mono', monospace",
              }}
            >
              CHAPTER {chNum} / {totalChapters}
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 20,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: 2,
              }}
            >
              {category}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: `1.5px solid ${accentColor}`,
              borderRadius: 999,
              padding: '6px 20px',
              color: accentColor,
              fontFamily: "'Space Mono', monospace",
              fontSize: 16,
              fontWeight: 800,
              boxShadow: `0 0 20px ${accentColor}44`,
            }}
          >
            {badge}
          </div>
        </div>

        {/* CENTER CONTENT: SPLIT SCREEN */}
        <div
          style={{
            display: 'flex',
            gap: 50,
            alignItems: 'center',
            height: '76%',
            width: '100%',
          }}
        >
          {/* LEFT PANEL: HERO SHOWCASE VIEWPORT */}
          <div
            style={{
              flex: 1.25,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              transform: `scale(${cardSpring})`,
            }}
          >
            <div
              style={{
                flex: 1,
                borderRadius: 28,
                overflow: 'hidden',
                border: `3px solid ${accentColor}`,
                boxShadow: `0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px ${accentColor}33`,
                position: 'relative',
                background: '#070a14',
              }}
            >
              <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})` }}>
                <Img
                  src={staticFile(primaryImage)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Inset Sub-Image */}
              {secondaryImage && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    width: 220,
                    height: 130,
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '2px solid rgba(255, 255, 255, 0.85)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85)',
                  }}
                >
                  <Img
                    src={staticFile(secondaryImage)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            {/* Quick Stat Pill Row */}
            <div style={{ display: 'flex', gap: 14 }}>
              {specs.map((spec, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: 16,
                    padding: '10px 16px',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}
                  >
                    {spec.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 18,
                      fontWeight: 800,
                      color: accentColor,
                      marginTop: 2,
                    }}
                  >
                    {spec.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL: ARCHITECTURAL DETAILS & SPECS */}
          <div
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 18,
              transform: `translateX(${(1 - rightSpring) * 25}px)`,
              opacity: Math.max(0, rightSpring),
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 50,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  margin: '0 0 8px 0',
                  textShadow: `0 0 35px ${accentColor}44`,
                }}
              >
                {title}
              </h1>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 20,
                  color: '#cbd5e1',
                  lineHeight: 1.45,
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            </div>

            {/* Key Feature Callouts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 15,
                  fontWeight: 800,
                  color: accentColor,
                  letterSpacing: 2,
                }}
              >
                ENGINEERING HIGHLIGHTS
              </div>
              {keyFeatures.map((feat, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '10px 16px',
                  }}
                >
                  <span style={{ color: accentColor, fontSize: 18 }}>✦</span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#f8fafc',
                      lineHeight: 1.35,
                    }}
                  >
                    {feat}
                  </span>
                </div>
              ))}
            </div>

            {/* Tech Stack Badges */}
            <div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: 2,
                  marginBottom: 6,
                }}
              >
                TECHNOLOGY STACK
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {techStack.map((tech, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      borderRadius: 8,
                      padding: '5px 12px',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      color: '#ffffff',
                      fontWeight: 700,
                    }}
                  >
                    {tech}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BAR */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: 14,
            fontFamily: "'Space Mono', monospace",
            fontSize: 15,
            color: '#64748b',
          }}
        >
          <div>CLASS OF LEARNERS • IN-DEPTH 10-MIN MASTERCLASS</div>
          <div style={{ color: '#F2B84B', fontWeight: 800 }}>🌐 advancedlogiclabs.dpdns.org</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TenMinuteMasterDocumentary: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070e', overflow: 'hidden' }}>
      {/* Clean, smooth background audio loop (Zero ticks or clicks!) */}
      <Audio src={staticFile('audio/bg_smooth_ambient.wav')} volume={0.15} loop />

      {/* CHAPTER 1: INTRO & MISSION (0 - 1800 frames / 60s) */}
      <Sequence from={0} durationInFrames={1800}>
        <ChapterSlide
          chNum={1}
          totalChapters={9}
          title="Class Of Learners Studio"
          subtitle="A Mumbai student engineering initiative proving that native 3D games and AI can run directly inside the browser with zero downloads."
          category="STUDIO VISION & ARCHITECTURE"
          badge="🚀 ZERO INSTALL"
          accentColor="#00D2FF"
          theme="studio"
          primaryImage="01_home_hero.png"
          secondaryImage="02_about_classroom.png"
          specs={[
            { label: 'Platform', value: 'Open Web (WebGL)' },
            { label: 'Target FPS', value: '60 FPS Native' },
            { label: 'Origin', value: 'Mumbai, India' },
          ]}
          keyFeatures={[
            'Built with modern Three.js WebGL procedural graphics',
            'Full PWA offline capabilities with Service Workers',
            '100% free and open educational student ecosystem',
          ]}
          techStack={['Three.js r128', 'WebGL 2.0', 'TypeScript', 'Vite', 'PWA']}
          audioFile="m10_ch1_intro.mp3"
        />
      </Sequence>

      {/* CHAPTER 2: MUMBAI TRAFFIC HERO (1800 - 4050 frames / 75s) */}
      <Sequence from={1800} durationInFrames={2250}>
        <ChapterSlide
          chNum={2}
          totalChapters={9}
          title="Mumbai Traffic Hero"
          subtitle="Real-time 3D Indian driving simulator capturing authentic Mumbai streets, aggressive auto AI, and over 100 licensing exams."
          category="3D DRIVING SIMULATOR & RTO ACADEMY"
          badge="🚗 3D SIMULATOR"
          accentColor="#F2B84B"
          theme="traffic"
          primaryImage="05_traffic_driving_gameplay.png"
          secondaryImage="06_traffic_academy_dashboard.png"
          specs={[
            { label: 'Traffic AI', value: 'Autonomous Agents' },
            { label: 'License Tests', value: '100+ Levels' },
            { label: 'Physics', value: 'Raycasted Vehicle' },
          ]}
          keyFeatures={[
            'Authentic Indian vehicle dynamics (Autos, BEST Buses, Supercars)',
            'Traffic rules engine monitoring signals, speed traps & lane cuts',
            'Verifiable digital certificates upon passing RTO driving tests',
          ]}
          techStack={['Three.js', 'Cannon Physics', 'Canvas2D Telemetry', 'Vite']}
          audioFile="m10_ch2_traffic.mp3"
        />
      </Sequence>

      {/* CHAPTER 3: SOLAR ENGINE 3D (4050 - 5950 frames / 63s) */}
      <Sequence from={4050} durationInFrames={1900}>
        <ChapterSlide
          chNum={3}
          totalChapters={9}
          title="Solar Engine 3D"
          subtitle="Accurate gravitational orrery simulating Keplerian planetary mechanics, atmospheric raymarching, and time travel dilation."
          category="CELESTIAL ORBITAL PHYSICS"
          badge="🪐 ORBITAL COSMOS"
          accentColor="#38BDF8"
          theme="solar"
          primaryImage="03_solar_system.png"
          specs={[
            { label: 'Gravity Model', value: 'True Keplerian' },
            { label: 'Time Dilation', value: '1x to 10,000x' },
            { label: 'Bodies', value: '8 Planets + Moons' },
          ]}
          keyFeatures={[
            'Real-time orbital velocity calculation and trajectory paths',
            'Custom GLSL atmospheric scattering & solar corona shaders',
            'Interactive camera tracking and planetary data telemetry',
          ]}
          techStack={['WebGL GLSL', 'Three.js', 'Astrophysics Maths', 'ES6']}
          audioFile="m10_ch3_solar.mp3"
        />
      </Sequence>

      {/* CHAPTER 4: ATI TYPING INSTRUCTOR (5950 - 7820 frames / 62s) */}
      <Sequence from={5950} durationInFrames={1870}>
        <ChapterSlide
          chNum={4}
          totalChapters={9}
          title="ATI Typing Instructor"
          subtitle="Adrenaline-fueled touch-typing simulator with cyberpunk audio-visual feedback, accuracy heatmaps, and coding syntax lessons."
          category="ARCADE TOUCH TYPING ENGINE"
          badge="⚡ SPEED TYPING"
          accentColor="#EC4899"
          theme="ati"
          primaryImage="04_ati_typing_instructor.png"
          specs={[
            { label: 'Input Latency', value: '< 1ms Instant' },
            { label: 'Telemetry', value: 'Live WPM + Heatmap' },
            { label: 'Curriculum', value: 'Home-Row to C++' },
          ]}
          keyFeatures={[
            'Real-time keystroke variance, net accuracy, and burst speed graphs',
            'Dynamic neon theme response reacting to typing velocity',
            'Custom lesson creator for coding languages and legal transcripts',
          ]}
          techStack={['Web Audio API', 'DOM Telemetry', 'LocalStorage Sync', 'CSS3']}
          audioFile="m10_ch4_ati.mp3"
        />
      </Sequence>

      {/* CHAPTER 5: GESTURE CONTROLLER AI (7820 - 9720 frames / 63s) */}
      <Sequence from={7820} durationInFrames={1900}>
        <ChapterSlide
          chNum={5}
          totalChapters={9}
          title="Gesture Controller AI"
          subtitle="Touchless spatial computing interface utilizing client-side machine learning to track 21 hand joints via webcam with zero external latency."
          category="COMPUTER VISION & NEURAL AI"
          badge="🖐️ VISION AI"
          accentColor="#10B981"
          theme="gesture"
          primaryImage="09_desktop_project_gesture_control.png"
          specs={[
            { label: 'Hand Joints', value: '21 3D Coordinates' },
            { label: 'Inference', value: '100% Local Device' },
            { label: 'Privacy', value: 'Zero Stream Upload' },
          ]}
          keyFeatures={[
            'Webcam hand landmark detection running inside WebAssembly',
            'Pinch-to-grab 3D objects, air swipes, and palm pause detection',
            'Strict privacy architecture with zero video frames sent to servers',
          ]}
          techStack={['MediaPipe ML', 'WebAssembly', 'WebGL', 'WebRTC Camera']}
          audioFile="m10_ch5_gesture.mp3"
        />
      </Sequence>

      {/* CHAPTER 6: DYNAMIC QR STUDIO (9720 - 11500 frames / 59s) */}
      <Sequence from={9720} durationInFrames={1780}>
        <ChapterSlide
          chNum={6}
          totalChapters={9}
          title="Dynamic QR Code Studio"
          subtitle="Professional vector QR code styling canvas with multi-stop gradients, embedded brand logos, dynamic redirects, and real-time scan analytics."
          category="VECTOR DESIGN & DYNAMIC ROUTING"
          badge="📱 DYNAMIC QR"
          accentColor="#0284C7"
          theme="qr"
          primaryImage="11_desktop_project_qr_editor.png"
          specs={[
            { label: 'Export Formats', value: 'SVG, PNG 4K' },
            { label: 'Redirect Speed', value: '< 2ms Edge' },
            { label: 'Styling', value: 'Gradients & Logos' },
          ]}
          keyFeatures={[
            'Change destination URL at any time without reprinting codes',
            'Advanced vector module shapes with customizable rounded corners',
            'Real-time scan counter and device telemetry analytics dashboard',
          ]}
          techStack={['HTML5 Canvas', 'SVG Vector', 'Edge Rewriting', 'Supabase']}
          audioFile="m10_ch6_qr.mp3"
        />
      </Sequence>

      {/* CHAPTER 7: TERRA3D & RPG ENGINE (11500 - 12900 frames / 46s) */}
      <Sequence from={11500} durationInFrames={1400}>
        <ChapterSlide
          chNum={7}
          totalChapters={9}
          title="Terra3D & RPG Engine"
          subtitle="Procedural 3D Earth atlas combined with a modular 2D/2.5D retro RPG tile engine featuring dialogue trees and inventory mechanics."
          category="3D ATLAS & RETRO RPG FRAMEWORK"
          badge="🌍 3D GLOBE & RPG"
          accentColor="#06B6D4"
          theme="rpg"
          primaryImage="10_desktop_project_rpg_engine.png"
          specs={[
            { label: 'Globe Shaders', value: 'Normal & Clouds' },
            { label: 'Tile Physics', value: 'Grid Collision' },
            { label: 'Dialogue', value: 'Branching Nodes' },
          ]}
          keyFeatures={[
            'High-definition procedural Earth globe with atmospheric shaders',
            'Lightweight tile-based retro RPG quest and collision system',
            'Demonstrates high-performance gaming architectures in vanilla JS',
          ]}
          techStack={['Three.js', 'Procedural Shaders', 'State Machines', 'ES6']}
          audioFile="m10_ch7_rpg.mp3"
        />
      </Sequence>

      {/* CHAPTER 8: UNIFIED WEB STACK & PWA (12900 - 13850 frames / 32s) */}
      <Sequence from={12900} durationInFrames={950}>
        <ChapterSlide
          chNum={8}
          totalChapters={9}
          title="Unified Web Architecture"
          subtitle="How we engineered sub-second load times, service worker offline caching, and compiled Android APKs for worldwide accessibility."
          category="CLOUD STACK & MOBILE PWA"
          badge="⚡ FAST LOADING"
          accentColor="#F59E0B"
          theme="techstack"
          primaryImage="07_mobile_dashboard_view.png"
          specs={[
            { label: 'Load Time', value: '< 800ms Edge' },
            { label: 'Offline Mode', value: 'Cache-First SW' },
            { label: 'APK Packaging', value: 'Native Android' },
          ]}
          keyFeatures={[
            'Static edge delivery on Vercel with clean URL routing',
            'Service worker cache-first architecture for offline playability',
            'Native Android APK build available directly on /download',
          ]}
          techStack={['Vercel Edge', 'Service Worker', 'Android APK', 'Supabase Auth']}
          audioFile="m10_ch8_techstack.mp3"
        />
      </Sequence>

      {/* CHAPTER 9: OUTRO & PLAY LIVE (13850 - 15200 frames / 45s) */}
      <Sequence from={13850} durationInFrames={1350}>
        <ChapterSlide
          chNum={9}
          totalChapters={9}
          title="Experience It Live"
          subtitle="Explore all six projects right now in your browser or download the Android app. Open source, student-built, and 100% free."
          category="CONCLUSION & COMMUNITY"
          badge="✨ PLAY TODAY"
          accentColor="#F2B84B"
          theme="studio"
          primaryImage="01_home_hero.png"
          specs={[
            { label: 'Domain', value: 'advancedlogiclabs.dpdns.org' },
            { label: 'Cost', value: '100% Free' },
            { label: 'Community', value: 'Class Of Learners' },
          ]}
          keyFeatures={[
            'Play all 6 applications right now with zero downloads',
            'Android APK available directly from our download page',
            'Subscribe and comment your favorite project below!',
          ]}
          techStack={['Subscribe', 'Share', 'Comment', 'Explore']}
          audioFile="m10_ch9_outro.mp3"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
