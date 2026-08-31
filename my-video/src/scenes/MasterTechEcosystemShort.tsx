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

export const MasterTechEcosystemShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#070a14', overflow: 'hidden' }}>
      <ThemedBackground theme="cyber" />
      <ProgressBar />

      {/* Cyberpunk Phonk / High-Tech Ambient Beats */}
      <Audio src={staticFile('audio/bg_phonk_funk_beat.wav')} volume={0.22} loop />

      {/* SCENE 1: THE MASTER STACK HOOK (0 - 450 frames / ~15s) */}
      <Sequence from={0} durationInFrames={450}>
        <Audio src={staticFile('audio/eco_01_hook.mp3')} volume={1} />
        <Scene1MasterHook />
      </Sequence>

      {/* SCENE 2: AI MULTI-AGENT BRAIN (450 - 980 frames / ~17.6s) */}
      <Sequence from={450} durationInFrames={530}>
        <Audio src={staticFile('audio/eco_02_ai_agents.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Scene2AIBrain />
      </Sequence>

      {/* SCENE 3: 3D GRAPHICS & ASSET PIPELINE (980 - 1550 frames / ~19s) */}
      <Sequence from={980} durationInFrames={570}>
        <Audio src={staticFile('audio/eco_03_3d_assets.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Scene3ThreeDAssets />
      </Sequence>

      {/* SCENE 4: CLOUD, DNS & EDGE STACK (1550 - 2080 frames / ~17.6s) */}
      <Sequence from={1550} durationInFrames={530}>
        <Audio src={staticFile('audio/eco_04_cloud_stack.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Scene4CloudStack />
      </Sequence>

      {/* SCENE 5: OUTRO & ACTION PLAN (2080 - 2420 frames / ~11.3s) */}
      <Sequence from={2080} durationInFrames={340}>
        <Audio src={staticFile('audio/eco_05_outro.mp3')} volume={1} />
        <Scene5Outro />
      </Sequence>
    </AbsoluteFill>
  );
};

/* =========================================================================
   SCENE 1: MASTER HOOK
   ========================================================================= */
const Scene1MasterHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const pulse = interpolate(Math.sin(frame / 6), [-1, 1], [0.98, 1.02]);

  const stackItems = [
    { name: 'Vercel', color: '#FFFFFF', icon: '▲' },
    { name: 'GitHub', color: '#9CA3AF', icon: '🐙' },
    { name: 'Antigravity', color: '#38BDF8', icon: '🛸' },
    { name: 'Gemini 3.7', color: '#60A5FA', icon: '✨' },
    { name: 'Claude', color: '#F97316', icon: '🧠' },
    { name: 'Codex', color: '#10B981', icon: '💻' },
    { name: 'Lovable', color: '#EC4899', icon: '💖' },
    { name: 'OpenCode', color: '#A855F7', icon: '🔓' },
    { name: 'Supabase', color: '#34D399', icon: '⚡' },
    { name: 'ClouDNS', color: '#38BDF8', icon: '🌍' },
    { name: 'Digitalplat', color: '#FBBF24', icon: '🌐' },
    { name: 'Lumalabs', color: '#C084FC', icon: '🔮' },
  ];

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
      {/* Top Header Badge */}
      <div
        style={{
          background: 'linear-gradient(135deg, #00D2FF 0%, #3B82F6 100%)',
          color: '#ffffff',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 900,
          padding: '14px 34px',
          borderRadius: 999,
          boxShadow: '0 0 40px rgba(0, 210, 255, 0.8)',
          transform: `scale(${titleSpring})`,
          letterSpacing: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span>⚡</span> CLASS OF LEARNERS TECH STACK <span>🚀</span>
      </div>

      {/* Central Hook Card */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 48,
            fontWeight: 900,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.15,
            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
          }}
        >
          How We Built <span style={{ color: '#00D2FF' }}>25+ 3D Apps</span> & Games for{' '}
          <span
            style={{
              background: '#FCD34D',
              color: '#070A14',
              padding: '2px 14px',
              borderRadius: 12,
              transform: `scale(${pulse})`,
              display: 'inline-block',
            }}
          >
            $0 DOLLARS
          </span>
        </div>

        {/* Floating Interactive Grid of all 12 key tools */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            maxWidth: 960,
            marginTop: 10,
          }}
        >
          {stackItems.map((item, idx) => {
            const itemSpring = spring({
              frame: frame - 15 - idx * 4,
              fps,
              config: { damping: 12, stiffness: 140 },
            });
            return (
              <div
                key={item.name}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: `1.5px solid ${item.color}66`,
                  padding: '12px 20px',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 15px ${item.color}22`,
                  transform: `scale(${Math.max(0, itemSpring)})`,
                }}
              >
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 20,
                    fontWeight: 700,
                    color: item.color,
                  }}
                >
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Subtitle Pill */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 20,
          padding: '16px 32px',
          color: '#E2E8F0',
          fontFamily: "'Inter', sans-serif",
          fontSize: 22,
          fontWeight: 600,
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
        }}
      >
        🏛️ Engineered by 6 Student Developers in Mumbai
      </div>
    </div>
  );
};

/* =========================================================================
   SCENE 2: AI MULTI-AGENT BRAIN
   ========================================================================= */
const Scene2AIBrain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  const aiAgents = [
    {
      title: 'Antigravity & Gemini 3.7',
      desc: 'Autonomous multi-file architecture, math & physics logic',
      tag: 'DeepMind Core',
      icon: '🛸',
      color: '#38BDF8',
    },
    {
      title: 'Claude Code & Codex',
      desc: 'Modular refactoring, strict script loading & agent hooks',
      tag: 'Anthropic / OpenAI',
      icon: '🧠',
      color: '#F97316',
    },
    {
      title: 'OpenCode & Playwright',
      desc: 'Headless browser MCP & visual regression testing',
      tag: 'MCP Testing',
      icon: '🔓',
      color: '#A855F7',
    },
    {
      title: 'Lovable Full-Stack Builder',
      desc: 'Rapid UI prototyping, dashboard cards & React stores',
      tag: 'UI Scaffolding',
      icon: '💖',
      color: '#EC4899',
    },
  ];

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
      {/* Category Pill */}
      <div
        style={{
          background: 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)',
          color: '#FFFFFF',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 900,
          padding: '12px 32px',
          borderRadius: 999,
          boxShadow: '0 0 30px rgba(56, 189, 248, 0.6)',
          transform: `scale(${titleSpring})`,
          letterSpacing: 2,
        }}
      >
        🤖 THE AI MULTI-AGENT BRAIN
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          maxWidth: 960,
        }}
      >
        {aiAgents.map((agent, i) => {
          const cardSpring = spring({
            frame: frame - 15 - i * 8,
            fps,
            config: { damping: 14, stiffness: 120 },
          });

          return (
            <div
              key={agent.title}
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: `2px solid ${agent.color}88`,
                borderRadius: 24,
                padding: '20px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: `0 10px 30px rgba(0,0,0,0.6), 0 0 20px ${agent.color}22`,
                transform: `translateX(${interpolate(cardSpring, [0, 1], [-100, 0])}px) scale(${cardSpring})`,
                opacity: cardSpring,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div
                  style={{
                    fontSize: 40,
                    width: 70,
                    height: 70,
                    borderRadius: 18,
                    background: `${agent.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${agent.color}66`,
                  }}
                >
                  {agent.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 26,
                      fontWeight: 800,
                      color: '#FFFFFF',
                    }}
                  >
                    {agent.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 18,
                      color: '#94A3B8',
                      marginTop: 4,
                    }}
                  >
                    {agent.desc}
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: `${agent.color}33`,
                  border: `1px solid ${agent.color}`,
                  color: agent.color,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {agent.tag}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 20,
          color: '#38BDF8',
          background: 'rgba(56, 189, 248, 0.1)',
          padding: '12px 28px',
          borderRadius: 999,
          border: '1px solid rgba(56, 189, 248, 0.3)',
        }}
      >
        ⚡ Zero Bottlenecks • 100% Agentic Velocity
      </div>
    </div>
  );
};

/* =========================================================================
   SCENE 3: 3D GRAPHICS & ASSET PIPELINE
   ========================================================================= */
const Scene3ThreeDAssets: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

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
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#FFFFFF',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 900,
          padding: '12px 32px',
          borderRadius: 999,
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.6)',
          transform: `scale(${titleSpring})`,
          letterSpacing: 2,
        }}
      >
        🎮 3D GRAPHICS & ASSET PIPELINE
      </div>

      {/* Center Video Frame with 3D driving gameplay */}
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          borderRadius: 28,
          overflow: 'hidden',
          border: '3px solid #10B981',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(16, 185, 129, 0.4)',
          position: 'relative',
          height: 620,
          background: '#000',
        }}
      >
        <OffthreadVideo
          src={staticFile('videos/gameplay_driving.mp4')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Overlay Badges on Video */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid #10B981',
            borderRadius: 14,
            padding: '10px 18px',
            color: '#10B981',
            fontFamily: "'Space Mono', monospace",
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          🏎️ Mumbai Traffic Hero 3D
        </div>

        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid #FCD34D',
            borderRadius: 14,
            padding: '10px 18px',
            color: '#FCD34D',
            fontFamily: "'Space Mono', monospace",
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          ⚡ 60 FPS • Zero-GC Pools
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            background: 'rgba(7, 10, 20, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 18,
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          <div style={{ color: '#E2E8F0', fontSize: 16, fontFamily: "'Inter', sans-serif" }}>
            🎨 <b>Free 3D Assets:</b> Auto, Bus, Lambo Meshes
          </div>
          <div style={{ color: '#E2E8F0', fontSize: 16, fontFamily: "'Inter', sans-serif" }}>
            🔮 <b>Lumalabs Genie:</b> AI 3D Props & Visuals
          </div>
          <div style={{ color: '#E2E8F0', fontSize: 16, fontFamily: "'Inter', sans-serif" }}>
            ⚙️ <b>Three.js + Rapier:</b> Pacejka MF 5.2 Physics
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 20,
          color: '#10B981',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '12px 28px',
          borderRadius: 999,
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        ✨ 18MB Draco Asset Bundles Preloaded In Browser
      </div>
    </div>
  );
};

/* =========================================================================
   SCENE 4: CLOUD, DNS & EDGE STACK
   ========================================================================= */
const Scene4CloudStack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  const infraNodes = [
    {
      title: 'Vercel Edge Platform',
      desc: 'Zero-build static HTML5 serving, cleanUrls & Speed Insights',
      icon: '▲',
      color: '#FFFFFF',
    },
    {
      title: 'ClouDNS Anycast Routing',
      desc: 'Global GeoDNS, DDoS mitigation, CNAME & SSL verification',
      icon: '🌍',
      color: '#38BDF8',
    },
    {
      title: 'Digitalplat Dynamic DNS',
      desc: 'Live custom domain (advancedlogiclabs.dpdns.org)',
      icon: '🌐',
      color: '#FBBF24',
    },
    {
      title: 'Supabase Serverless DB & Auth',
      desc: 'PostgreSQL, Google OAuth, Realtime achievements & licenses',
      icon: '⚡',
      color: '#34D399',
    },
    {
      title: 'Freebuff Local Desktop DB',
      desc: 'Embedded SQLite desktop.db for offline index & dev caching',
      icon: '🗄️',
      color: '#A78BFA',
    },
  ];

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
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          color: '#FFFFFF',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 900,
          padding: '12px 32px',
          borderRadius: 999,
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.6)',
          transform: `scale(${titleSpring})`,
          letterSpacing: 2,
        }}
      >
        ☁️ CLOUD, DNS & EDGE INFRASTRUCTURE
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 960,
        }}
      >
        {infraNodes.map((node, i) => {
          const itemSpring = spring({
            frame: frame - 15 - i * 6,
            fps,
            config: { damping: 14, stiffness: 120 },
          });

          return (
            <div
              key={node.title}
              style={{
                background: 'rgba(15, 23, 42, 0.92)',
                border: `1.5px solid ${node.color}66`,
                borderRadius: 20,
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                boxShadow: `0 8px 24px rgba(0,0,0,0.5)`,
                transform: `scale(${itemSpring})`,
                opacity: itemSpring,
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  background: `${node.color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${node.color}55`,
                }}
              >
                {node.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: node.color,
                  }}
                >
                  {node.title}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 16,
                    color: '#94A3B8',
                    marginTop: 2,
                  }}
                >
                  {node.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 20,
          color: '#FBBF24',
          background: 'rgba(245, 158, 11, 0.1)',
          padding: '12px 28px',
          borderRadius: 999,
          border: '1px solid rgba(245, 158, 11, 0.3)',
        }}
      >
        🌐 Global Anycast CDN • Sub-100ms Edge Latency
      </div>
    </div>
  );
};

/* =========================================================================
   SCENE 5: GRAND OUTRO & CALL TO ACTION
   ========================================================================= */
const Scene5Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const pulse = interpolate(Math.sin(frame / 6), [-1, 1], [0.97, 1.03]);

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
          background: 'linear-gradient(135deg, #00D2FF 0%, #3B82F6 100%)',
          color: '#ffffff',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 900,
          padding: '14px 34px',
          borderRadius: 999,
          boxShadow: '0 0 40px rgba(0, 210, 255, 0.8)',
          transform: `scale(${titleSpring})`,
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
          gap: 24,
          textAlign: 'center',
          maxWidth: 960,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 52,
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.15,
          }}
        >
          You Don’t Need Funding.
          <br />
          <span style={{ color: '#00D2FF' }}>You Need The Right Stack.</span>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '2px solid #38BDF8',
            borderRadius: 24,
            padding: '24px 36px',
            boxShadow: '0 10px 40px rgba(0, 210, 255, 0.3)',
            transform: `scale(${pulse})`,
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 32,
              fontWeight: 900,
              color: '#38BDF8',
            }}
          >
            classoflearners.vercel.app
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 20,
              color: '#94A3B8',
              marginTop: 8,
            }}
          >
            Play Mumbai Traffic Hero • Solar System • Ati Typing • QR Studio
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 20,
          padding: '16px 36px',
          color: '#E2E8F0',
          fontFamily: "'Inter', sans-serif",
          fontSize: 22,
          fontWeight: 700,
          textAlign: 'center',
        }}
      >
        ⭐ Star the repo on GitHub • Build with AI for Free!
      </div>
    </div>
  );
};
