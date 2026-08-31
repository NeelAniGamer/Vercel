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
import { ProgressBar } from '../components/ProgressBar';

interface ProjectSlideProps {
  num: number;
  title: string;
  category: string;
  tagline: string;
  image: string;
  badge: string;
  accentColor: string;
  theme: ThemeType;
  features: string[];
  audioFile: string;
}

const ViralProjectSlide: React.FC<ProjectSlideProps> = ({
  num,
  title,
  category,
  tagline,
  image,
  badge,
  accentColor,
  theme,
  features,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, 130], [1.0, 1.12], { extrapolateRight: 'clamp' });
  const cardSpring = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const textSpring = spring({ frame: frame - 3, fps, config: { damping: 14, stiffness: 110 } });
  const pillSpring = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 120 } });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <ThemedBackground theme={theme} />
      <Audio src={staticFile(`audio/${audioFile}`)} volume={1} />
      <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />

      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '100px 40px 80px 40px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        {/* Top Floating Number Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'rgba(7, 10, 20, 0.9)',
            border: `2px solid ${accentColor}`,
            boxShadow: `0 0 25px ${accentColor}66`,
            borderRadius: 999,
            padding: '10px 28px',
            backdropFilter: 'blur(16px)',
            transform: `scale(${cardSpring})`,
          }}
        >
          <span
            style={{
              background: accentColor,
              color: '#000',
              fontWeight: 900,
              fontSize: 22,
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Space Mono', monospace",
            }}
          >
            #{num}
          </span>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: 2,
            }}
          >
            PROJECT {num} OF 6
          </span>
        </div>

        {/* Center Showcase Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            width: '100%',
            maxWidth: 980,
          }}
        >
          {/* Title */}
          <div
            style={{
              textAlign: 'center',
              transform: `translateY(${(1 - textSpring) * 35}px)`,
              opacity: Math.max(0, textSpring),
            }}
          >
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 24,
                fontWeight: 800,
                color: accentColor,
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {category}
            </div>
            <h1
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 64,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.08,
                margin: '0 0 8px 0',
                textShadow: `0 0 35px ${accentColor}55`,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 26,
                color: '#cbd5e1',
                fontWeight: 600,
                margin: 0,
                maxWidth: 860,
              }}
            >
              {tagline}
            </p>
          </div>

          {/* Dynamic Zooming Gameplay Screen */}
          <div
            style={{
              width: '100%',
              height: 560,
              borderRadius: 34,
              overflow: 'hidden',
              border: `3px solid ${accentColor}`,
              boxShadow: `0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px ${accentColor}55`,
              transform: `scale(${cardSpring})`,
              position: 'relative',
              background: '#070a14',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
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
            </div>

            {/* Floating Tag */}
            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(7, 10, 20, 0.9)',
                backdropFilter: 'blur(14px)',
                border: `1.5px solid ${accentColor}`,
                borderRadius: 16,
                padding: '12px 22px',
                color: '#ffffff',
                fontFamily: "'Space Mono', monospace",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {badge}
            </div>
          </div>

          {/* Dynamic Feature Pills */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
              transform: `translateY(${(1 - pillSpring) * 25}px)`,
              opacity: Math.max(0, pillSpring),
            }}
          >
            {features.map((feat, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: 20,
                  padding: '12px 24px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#ffffff',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}
              >
                🔥 {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Dots */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              style={{
                width: s === num ? 50 : 16,
                height: 10,
                borderRadius: 5,
                backgroundColor: s === num ? accentColor : 'rgba(255, 255, 255, 0.25)',
                boxShadow: s === num ? `0 0 12px ${accentColor}` : 'none',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ViralSixProjectsShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070e', overflow: 'hidden' }}>
      <ProgressBar />
      {/* Clean, smooth background audio loop (Zero ticks or clicks!) */}
      <Audio src={staticFile('audio/bg_smooth_ambient.wav')} volume={0.16} loop />

      {/* 1. VIRAL HOOK (0 - 110 frames / 3.6s) */}
      <Sequence from={0} durationInFrames={110}>
        <Audio src={staticFile('audio/v6_01_hook.mp3')} volume={1} />
        <ViralHookScene />
      </Sequence>

      {/* 2. CURIOSITY BRIDGE (110 - 200 frames / 3s) */}
      <Sequence from={110} durationInFrames={90}>
        <Audio src={staticFile('audio/v6_02_bridge.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <CuriosityBridgeScene />
      </Sequence>

      {/* 3. PROJECT 1: Mumbai Traffic Hero (200 - 330 frames) - TRAFFIC THEME */}
      <Sequence from={200} durationInFrames={130}>
        <ViralProjectSlide
          num={1}
          title="Mumbai Traffic Hero"
          category="3D DRIVING SIMULATOR"
          tagline="Survive real Mumbai streets, auto swerves & traffic rules in 3D!"
          image="05_traffic_driving_gameplay.png"
          badge="🚗 MUMBAI 3D SIM"
          accentColor="#F2B84B"
          theme="traffic"
          features={['Real Indian Traffic AI', '52 Driving Scenarios', 'Pacejka MF 5.2 Physics']}
          audioFile="v6_03_traffic.mp3"
        />
      </Sequence>

      {/* 4. PROJECT 2: Solar Engine 3D (330 - 460 frames) - SOLAR THEME */}
      <Sequence from={330} durationInFrames={130}>
        <ViralProjectSlide
          num={2}
          title="Solar Engine 3D"
          category="ORBITAL COSMOS SIMULATOR"
          tagline="Explore planets, real orbital gravity, and time-travel controls."
          image="03_solar_system.png"
          badge="🪐 ORBITAL COSMOS"
          accentColor="#38BDF8"
          theme="solar"
          features={['100% Real Gravity', 'Time Dilation Speed', 'Full 3D Planets']}
          audioFile="v6_04_solar.mp3"
        />
      </Sequence>

      {/* 5. PROJECT 3: ATI Typing Instructor (460 - 590 frames) - ATI THEME */}
      <Sequence from={460} durationInFrames={130}>
        <ViralProjectSlide
          num={3}
          title="ATI Typing Instructor"
          category="ARCADE SPEED TYPING"
          tagline="Hardcore touch typing with live speed telemetry and arcade modes."
          image="04_ati_typing_instructor.png"
          badge="⚡ SPEED TYPING"
          accentColor="#EC4899"
          theme="ati"
          features={['Live WPM Telemetry', 'Accuracy Tracking', 'Arcade Themes']}
          audioFile="v6_05_ati.mp3"
        />
      </Sequence>

      {/* 6. PROJECT 4: Gesture AI (590 - 720 frames) - GESTURE THEME */}
      <Sequence from={590} durationInFrames={130}>
        <ViralProjectSlide
          num={4}
          title="Gesture Controller AI"
          category="WEBCAM COMPUTER VISION"
          tagline="Control your browser using hand gestures in mid-air!"
          image="09_desktop_project_gesture_control.png"
          badge="🖐️ VISION AI CONTROL"
          accentColor="#10B981"
          theme="gesture"
          features={['Zero Plugins Needed', 'Real-Time Webcam AI', 'Pinch & Swipe 3D']}
          audioFile="v6_06_gesture.mp3"
        />
      </Sequence>

      {/* 7. PROJECT 5: Dynamic QR Studio (720 - 850 frames) - QR THEME */}
      <Sequence from={720} durationInFrames={130}>
        <ViralProjectSlide
          num={5}
          title="QR Editor & Dynamic Q"
          category="DYNAMIC QR CODE STUDIO"
          tagline="Generate styled QR codes with live branding, gradients & analytics."
          image="11_desktop_project_qr_editor.png"
          badge="📱 DYNAMIC QR CODES"
          accentColor="#0284C7"
          theme="qr"
          features={['Dynamic Redirection', 'Custom Logos & Styles', 'High-Res Vector Export']}
          audioFile="v6_07_qr.mp3"
        />
      </Sequence>

      {/* 8. PROJECT 6: Terra3D & RPG Engine (850 - 980 frames) - RPG THEME */}
      <Sequence from={850} durationInFrames={130}>
        <ViralProjectSlide
          num={6}
          title="Terra3D & RPG Engine"
          category="3D GLOBE & RETRO RPG"
          tagline="Interactive 3D Earth atlas and retro tile-based quest adventures."
          image="10_desktop_project_rpg_engine.png"
          badge="🌍 3D ATLAS & RPG"
          accentColor="#06B6D4"
          theme="rpg"
          features={['Interactive 3D Globe', 'Procedural Shaders', 'Retro RPG Quest Systems']}
          audioFile="v6_08_rpg.mp3"
        />
      </Sequence>

      {/* 9. VIRAL CTA & URL (980 - 1180 frames) - STUDIO THEME */}
      <Sequence from={980} durationInFrames={200}>
        <Audio src={staticFile('audio/v6_09_cta.mp3')} volume={1} />
        <ViralOutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const ViralHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = interpolate(Math.sin(frame / 4), [-1, 1], [0.95, 1.05]);
  const alertScale = spring({ frame, fps, config: { damping: 10, stiffness: 140 } });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <ThemedBackground theme="traffic" />
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
            padding: '14px 36px',
            borderRadius: 999,
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.9)',
            transform: `scale(${alertScale})`,
            letterSpacing: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>🚨</span> 99% OF DRIVERS FAIL THIS! <span>🚨</span>
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
              textShadow: '0 10px 40px rgba(0,0,0,0.9)',
            }}
          >
            WE BUILT A <span style={{ color: '#F2B84B' }}>3D MUMBAI</span> TRAFFIC GAME!
          </h1>

          <div
            style={{
              width: '100%',
              height: 560,
              borderRadius: 34,
              overflow: 'hidden',
              border: '3px solid #F2B84B',
              boxShadow: '0 30px 90px rgba(0,0,0,0.95), 0 0 50px rgba(242,184,75,0.5)',
              transform: `scale(${pulse})`,
              position: 'relative',
            }}
          >
            <Img
              src={staticFile('05_traffic_driving_gameplay.png')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: 24,
                right: 24,
                background: 'rgba(7, 10, 20, 0.9)',
                backdropFilter: 'blur(16px)',
                padding: '16px 24px',
                borderRadius: 20,
                border: '1px solid rgba(242, 184, 75, 0.6)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#F2B84B', fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 800 }}>
                🎮 100% IN-BROWSER 3D
              </span>
              <span style={{ color: '#00D2FF', fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700 }}>
                NO DOWNLOAD
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: '#94a3b8',
            letterSpacing: 2,
          }}
        >
          ⚡ REAL-TIME WEBGL DRIVING SIMULATOR
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CuriosityBridgeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const pulse = interpolate(Math.sin(frame / 3), [-1, 1], [0.95, 1.05]);

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
          justifyContent: 'center',
          padding: '80px 40px',
          textAlign: 'center',
          gap: 40,
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '2px solid #00D2FF',
            borderRadius: 999,
            padding: '12px 36px',
            color: '#00D2FF',
            fontFamily: "'Space Mono', monospace",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 3,
          }}
        >
          STUDENT TECH COLLECTIVE • MUMBAI
        </div>

        <div style={{ transform: `scale(${scale})` }}>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 78,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.08,
              margin: '0 0 20px 0',
            }}
          >
            6 INSANE WEB APPS <br />
            <span style={{ color: '#F2B84B' }}>MADE IN PURE CODE!</span>
          </h1>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(0,210,255,0.2) 100%)',
            border: '2px solid #EC4899',
            borderRadius: 30,
            padding: '24px 40px',
            transform: `scale(${pulse})`,
            boxShadow: '0 0 40px rgba(236, 72, 153, 0.5)',
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 34,
              fontWeight: 900,
              color: '#ffffff',
            }}
          >
            👀 WAIT TILL YOU SEE <span style={{ color: '#EC4899' }}>#4 (GESTURE AI)</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ViralOutroScene: React.FC = () => {
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
          padding: '100px 40px 80px 40px',
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
            maxWidth: 980,
            transform: `scale(${scale})`,
          }}
        >
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 74,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.08,
              margin: 0,
            }}
          >
            WHICH ONE ARE YOU <br />
            <span style={{ color: '#F2B84B' }}>TRYING FIRST?</span>
          </h1>

          <div
            style={{
              width: '100%',
              transform: `scale(${pulse})`,
              background: 'linear-gradient(135deg, rgba(242,184,75,0.2) 0%, rgba(0,210,255,0.2) 100%)',
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
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 22,
                color: '#F2B84B',
                letterSpacing: 3,
                fontWeight: 800,
              }}
            >
              🌐 OFFICIAL SITE
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 42,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: 1,
                wordBreak: 'break-all',
                textShadow: '0 0 25px rgba(255,255,255,0.7)',
              }}
            >
              advancedlogiclabs.dpdns.org
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 22,
                color: '#00D2FF',
                fontWeight: 700,
              }}
            >
              📱 Android APK available at /download
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 24,
              padding: '20px 32px',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <span>👇</span> COMMENT 1 TO 6 BELOW!
          </div>
        </div>

        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 20,
            color: '#64748b',
            letterSpacing: 2,
          }}
        >
          CLASS OF LEARNERS • LIKE & SUBSCRIBE
        </div>
      </div>
    </AbsoluteFill>
  );
};
