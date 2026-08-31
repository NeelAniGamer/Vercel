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
import { ThemedBackground } from '../components/ThemedBackground';
import { ProgressBar } from '../components/ProgressBar';

// Measured durations @30fps with +15f padding
const SCENES = [
  { id: 'research_01_intro', frames: 530 },
  { id: 'research_02_ecosystem', frames: 695 },
  { id: 'research_03_cloud_deployment', frames: 860 },
  { id: 'research_04_ai_suite', frames: 895 },
  { id: 'research_05_3d_generative', frames: 770 },
  { id: 'research_06_backend_data', frames: 815 },
  { id: 'research_07_supporting_outro', frames: 870 },
];
export const RESEARCH_TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.frames, 0); // 5435

export const ResearchTechStackReport: React.FC = () => {
  let cursor = 0;
  const seq = (i: number) => {
    const s = cursor;
    cursor += SCENES[i].frames;
    return s;
  };
  const s0 = seq(0);
  const s1 = seq(1);
  const s2 = seq(2);
  const s3 = seq(3);
  const s4 = seq(4);
  const s5 = seq(5);
  const s6 = seq(6);

  return (
    <AbsoluteFill style={{ backgroundColor: '#070a14', overflow: 'hidden' }}>
      <ThemedBackground theme="studio" />
      <ProgressBar />
      <Audio src={staticFile('audio/bg_smooth_ambient.wav')} volume={0.14} loop />

      <Sequence from={s0} durationInFrames={SCENES[0].frames}>
        <Audio src={staticFile('audio/research_01_intro.mp3')} volume={1} />
        <Scene1Intro />
      </Sequence>
      <Sequence from={s1} durationInFrames={SCENES[1].frames}>
        <Audio src={staticFile('audio/research_02_ecosystem.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.28} />
        <Scene2Ecosystem />
      </Sequence>
      <Sequence from={s2} durationInFrames={SCENES[2].frames}>
        <Audio src={staticFile('audio/research_03_cloud_deployment.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.28} />
        <Scene3CloudDeployment />
      </Sequence>
      <Sequence from={s3} durationInFrames={SCENES[3].frames}>
        <Audio src={staticFile('audio/research_04_ai_suite.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.28} />
        <Scene4AISuite />
      </Sequence>
      <Sequence from={s4} durationInFrames={SCENES[4].frames}>
        <Audio src={staticFile('audio/research_05_3d_generative.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.28} />
        <Scene5ThreeD />
      </Sequence>
      <Sequence from={s5} durationInFrames={SCENES[5].frames}>
        <Audio src={staticFile('audio/research_06_backend_data.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.28} />
        <Scene6Backend />
      </Sequence>
      <Sequence from={s6} durationInFrames={SCENES[6].frames}>
        <Audio src={staticFile('audio/research_07_supporting_outro.mp3')} volume={1} />
        <Scene7Outro />
      </Sequence>
    </AbsoluteFill>
  );
};

/* =============================================================================
   SHARED UI PRIMITIVES
   ============================================================================= */
const MonoPill: React.FC<{ children: React.ReactNode; color?: string; glow?: boolean }> = ({
  children,
  color = '#00D2FF',
  glow = true,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      background: `${color}14`,
      border: `1.5px solid ${color}55`,
      color,
      fontFamily: "'Space Mono', monospace",
      fontSize: 13,
      fontWeight: 800,
      letterSpacing: 2,
      padding: '7px 16px',
      borderRadius: 999,
      boxShadow: glow ? `0 0 20px ${color}33` : undefined,
    }}
  >
    {children}
  </div>
);

const SectionLabel: React.FC<{ num: string; label: string; color: string }> = ({ num, label, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: color,
        color: '#070a14',
        fontFamily: "'Space Mono', monospace",
        fontWeight: 900,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {num}
    </div>
    <span
      style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: 2.5,
        color,
      }}
    >
      {label}
    </span>
  </div>
);

/* =============================================================================
   SCENE 1: INTRO — Comprehensive Research title
   ============================================================================= */
const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const s2 = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 120 } });
  const s3 = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 120 } });
  const zoom = interpolate(frame, [0, 530], [1, 1.05], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '46px 64px 42px 64px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transform: `translateY(${(1 - s) * -20}px)`,
          opacity: s,
        }}
      >
        <MonoPill color="#F2B84B">◆ COMPREHENSIVE RESEARCH REPORT</MonoPill>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            color: '#64748b',
            letterSpacing: 1.5,
            fontWeight: 700,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
          CLASS OF LEARNERS • MUMBAI • 2026
        </div>
      </div>

      {/* Center hero */}
      <div style={{ flex: 1, display: 'flex', gap: 46, alignItems: 'center', marginTop: 18 }}>
        {/* Left copy */}
        <div style={{ flex: 1.15, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 3,
              color: '#00D2FF',
              transform: `translateX(${(1 - s2) * -20}px)`,
              opacity: s2,
            }}
          >
            TECH STACK • AI ECOSYSTEM • INFRASTRUCTURE
          </div>

          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 0.95,
              color: '#ffffff',
              margin: 0,
              transform: `scale(${interpolate(s2, [0, 1], [0.96, 1])})`,
              opacity: s2,
            }}
          >
            How 6 Students
            <br />
            Built <span style={{ color: '#00D2FF' }}>25+ 3D Apps</span>
            <br />
            <span style={{ color: '#F2B84B' }}>for $0</span>
          </h1>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 19,
              lineHeight: 1.5,
              color: '#cbd5e1',
              margin: 0,
              maxWidth: 640,
              transform: `translateY(${(1 - s3) * 12}px)`,
              opacity: s3,
            }}
          >
            An exact breakdown of every platform, tool, and service — from{' '}
            <b style={{ color: '#ffffff' }}>Vercel & GitHub</b> to <b style={{ color: '#ffffff' }}>Antigravity, Supabase & Luma AI</b> — and the
            precise role each plays in production.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 4,
              transform: `translateY(${(1 - s3) * 10}px)`,
              opacity: s3,
            }}
          >
            {[
              { l: 'Vercel Edge', c: '#ffffff' },
              { l: 'GitHub CI/CD', c: '#9ca3af' },
              { l: 'Antigravity', c: '#38bdf8' },
              { l: 'Supabase', c: '#34d399' },
              { l: 'Three.js', c: '#F2B84B' },
              { l: 'Luma Genie', c: '#c084fc' },
            ].map((t) => (
              <span
                key={t.l}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  fontWeight: 800,
                  color: t.c,
                  border: `1px solid ${t.c}44`,
                  background: `${t.c}14`,
                  padding: '6px 12px',
                  borderRadius: 999,
                }}
              >
                {t.l}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8, opacity: s3 }}>
            <div
              style={{
                background: '#F2B84B',
                color: '#070a14',
                fontFamily: "'Space Mono', monospace",
                fontWeight: 900,
                fontSize: 13,
                padding: '10px 18px',
                borderRadius: 12,
              }}
            >
              ▲ classoflearners.vercel.app
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: '#e2e8f0',
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                fontSize: 13,
                padding: '10px 18px',
                borderRadius: 12,
              }}
            >
              advancedlogiclabs.dpdns.org
            </div>
          </div>
        </div>

        {/* Right visual - hero image stack */}
        <div
          style={{
            flex: 0.85,
            height: 560,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            transform: `scale(${s})`,
            opacity: s,
          }}
        >
          <div
            style={{
              flex: 1,
              borderRadius: 24,
              overflow: 'hidden',
              border: '2px solid rgba(0,210,255,0.5)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(0,210,255,0.18)',
              background: '#000',
              position: 'relative',
            }}
          >
            <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})` }}>
              <Img src={staticFile('01_home_hero.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                background: 'rgba(7,10,20,0.88)',
                border: '1px solid rgba(0,210,255,0.5)',
                borderRadius: 12,
                padding: '8px 14px',
                color: '#00D2FF',
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              ● LIVE PRODUCTION • ZERO BUILD
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 14,
                left: 14,
                right: 14,
                background: 'rgba(7,10,20,0.88)',
                backdropFilter: 'blur(10px)',
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 800, color: '#F2B84B' }}>
                25+ STATIC + REACT APPS
              </span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 800, color: '#34d399' }}>
                ◉ VERCEL EDGE GLOBAL
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)', height: 110 }}>
              <Img src={staticFile('05_traffic_driving_gameplay.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)', height: 110 }}>
              <Img src={staticFile('03_solar_system.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)', height: 110 }}>
              <Img src={staticFile('04_ati_typing_instructor.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer meta */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 14,
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: '#64748b',
          letterSpacing: 1.5,
          opacity: s3,
        }}
      >
        <span>REPORT SOURCE: README • AGENTS.MD • VERIFIED CODEBASE — AUG 2026</span>
        <span style={{ color: '#00D2FF' }}>PLAY ANY PROJECT IN BROWSER • NO INSTALL</span>
      </div>
    </div>
  );
};

/* =============================================================================
   SCENE 2: ECOSYSTEM OVERVIEW — 3 layers
   ============================================================================= */
const Scene2Ecosystem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const layers = [
    {
      title: 'AI & Agentic Dev Suite',
      color: '#38bdf8',
      items: ['Antigravity', 'Gemini 3.7', 'Claude Code', 'Codex', 'OpenCode', 'Lovable'],
      desc: 'Code generation & testing',
      icon: '🤖',
    },
    {
      title: '3D & Generative Pipeline',
      color: '#F2B84B',
      items: ['Three.js r128', 'Rapier3D', 'Free 3D Assets', 'Luma Genie', 'Blender'],
      desc: 'Bundled models & shaders',
      icon: '🎨',
    },
    {
      title: 'Cloud, DNS & Deploy',
      color: '#34d399',
      items: ['GitHub', 'Vercel Edge', 'ClouDNS', 'Digitalplat', 'Supabase', 'Freebuff'],
      desc: 'Global delivery & auth',
      icon: '☁️',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '46px 64px 42px 64px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionLabel num="01" label="ARCHITECTURAL ECOSYSTEM OVERVIEW" color="#38bdf8" />
        <MonoPill color="#38bdf8">MERMAID GRAPH • THREE-LAYER ARCHITECTURE</MonoPill>
      </div>

      <h2
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 42,
          fontWeight: 900,
          color: '#fff',
          margin: '14px 0 6px 0',
          lineHeight: 1.1,
          transform: `translateY(${(1 - s) * 16}px)`,
          opacity: s,
        }}
      >
        Three layers. <span style={{ color: '#38bdf8' }}>One zero-cost</span> production pipeline
      </h2>
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          color: '#94a3b8',
          fontSize: 16,
          margin: 0,
          maxWidth: 900,
          lineHeight: 1.5,
        }}
      >
        AI suite generates code → Asset pipeline bundles models & shaders → Cloud layer auto-deploys to the edge with global DNS
      </p>

      {/* Three layer cards + arrows */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          marginTop: 18,
        }}
      >
        {layers.map((layer, idx) => {
          const cs = spring({ frame: frame - idx * 10, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <React.Fragment key={layer.title}>
              <div
                style={{
                  flex: 1,
                  background: 'rgba(15,23,42,0.92)',
                  border: `2px solid ${layer.color}55`,
                  borderRadius: 22,
                  padding: '22px 22px',
                  boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 26px ${layer.color}18`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transform: `scale(${cs}) translateY(${(1 - cs) * 18}px)`,
                  opacity: cs,
                  height: 360,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${layer.color}22`,
                      border: `1px solid ${layer.color}66`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                    }}
                  >
                    {layer.icon}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 900,
                      fontSize: 16,
                      color: layer.color,
                      lineHeight: 1.15,
                    }}
                  >
                    {layer.title}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {layer.items.map((it) => (
                    <span
                      key={it}
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#e2e8f0',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '5px 10px',
                        borderRadius: 999,
                      }}
                    >
                      {it}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    background: `${layer.color}14`,
                    border: `1px solid ${layer.color}33`,
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: layer.color,
                    textAlign: 'center',
                    letterSpacing: 0.5,
                  }}
                >
                  → {layer.desc}
                </div>
              </div>

              {idx < layers.length - 1 && (
                <div
                  style={{
                    fontSize: 22,
                    color: layers[idx + 1].color,
                    fontWeight: 900,
                    opacity: cs,
                    transform: `scale(${cs})`,
                  }}
                >
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Pipeline footer */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          marginTop: 16,
          flexWrap: 'wrap',
        }}
      >
        {[
          'GH → Vercel auto CI/CD on push',
          'ClouDNS → Digitalplat → Vercel',
          'Vercel → Supabase Auth & Realtime',
          'Freebuff → Local desktop cache',
        ].map((t) => (
          <span
            key={t}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: '#94a3b8',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '6px 12px',
              borderRadius: 999,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div
        style={{
          textAlign: 'center',
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: '#64748b',
          marginTop: 10,
          letterSpacing: 1,
        }}
      >
        GRAPH TD: Github deploys to Vercel • Digitalplat resolves to edge • Supabase powers auth
      </div>
    </div>
  );
};

/* =============================================================================
   SCENE 3: CLOUD & DEPLOYMENT — Vercel, GitHub, ClouDNS, Digitalplat
   ============================================================================= */
const Scene3CloudDeployment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const cards = [
    {
      name: 'Vercel',
      cat: 'Cloud Hosting & Edge CDN',
      role: 'Primary Production Host — vercel.json cleanUrls, / → /home rewrite, Speed Insights',
      stats: 'Zero-build static',
      color: '#ffffff',
      icon: '▲',
      badge: 'EDGE PRIMARY',
    },
    {
      name: 'GitHub',
      cat: 'Version Control & CI/CD',
      role: 'Single Source of Truth — NeelAniGamer/Vercel • push to main = global deploy',
      stats: 'COL.apk via releases',
      color: '#9ca3af',
      icon: '◆',
      badge: 'SOURCE OF TRUTH',
    },
    {
      name: 'ClouDNS',
      cat: 'Managed Anycast DNS',
      role: 'Global GeoDNS + DDoS • CNAME cname.vercel-dns.com • TXT verification bWaer2…',
      stats: '30+ edge locations',
      color: '#38bdf8',
      icon: '🌍',
      badge: 'ANYCAST DNS',
    },
    {
      name: 'Digitalplat',
      cat: 'DDNS & Routing',
      role: 'Live custom domain — advancedlogiclabs.dpdns.org • High-availability routing',
      stats: '*.dpdns.org',
      color: '#FBBF24',
      icon: '🌐',
      badge: 'LIVE DOMAIN',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '46px 64px 42px 64px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionLabel num="02" label="CLOUD, DNS & DEPLOYMENT" color="#F2B84B" />
        <MonoPill color="#F2B84B">cleanUrls + rewrites + Anycast • SUB-100MS EDGE</MonoPill>
      </div>

      <div style={{ display: 'flex', gap: 40, marginTop: 16, flex: 1, alignItems: 'stretch' }}>
        {/* Left: cards */}
        <div style={{ flex: 1.35, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.map((c, i) => {
            const cs = spring({ frame: frame - i * 7, fps, config: { damping: 14, stiffness: 120 } });
            return (
              <div
                key={c.name}
                style={{
                  display: 'flex',
                  gap: 16,
                  background: 'rgba(15,23,42,0.94)',
                  border: `1.5px solid ${c.color}44`,
                  borderRadius: 18,
                  padding: '14px 18px',
                  alignItems: 'center',
                  transform: `translateX(${(1 - cs) * -24}px)`,
                  opacity: cs,
                  boxShadow: `0 10px 30px rgba(0,0,0,0.5)`,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: `${c.color}18`,
                    border: `1px solid ${c.color}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 900,
                    color: c.color,
                    flexShrink: 0,
                  }}
                >
                  {c.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 18, color: '#fff' }}>{c.name}</span>
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: 1,
                        color: c.color,
                        background: `${c.color}18`,
                        border: `1px solid ${c.color}44`,
                        padding: '3px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {c.badge}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: 1, marginTop: 2 }}>
                    {c.cat}
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#cbd5e1', marginTop: 4, lineHeight: 1.35 }}>{c.role}</div>
                </div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    fontWeight: 800,
                    color: c.color,
                    background: `${c.color}14`,
                    border: `1px solid ${c.color}33`,
                    padding: '6px 10px',
                    borderRadius: 10,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.stats}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: vercel.json visual + stats */}
        <div
          style={{
            flex: 0.65,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            transform: `scale(${s})`,
            opacity: s,
          }}
        >
          <div
            style={{
              background: 'rgba(7,10,20,0.9)',
              border: '1.5px solid rgba(255,255,255,0.14)',
              borderRadius: 18,
              padding: '16px 18px',
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              lineHeight: 1.7,
              color: '#e2e8f0',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ color: '#F2B84B', fontWeight: 900, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }}>vercel.json — EDGE CONFIG</div>
            <div>
              <span style={{ color: '#64748b' }}>{'{'}</span>
              <br />
              &nbsp;&nbsp;<span style={{ color: '#38bdf8' }}>"cleanUrls"</span>: <span style={{ color: '#22c55e' }}>true</span>,{' '}
              <span style={{ color: '#64748b' }}>// /home /solar /ati</span>
              <br />
              &nbsp;&nbsp;<span style={{ color: '#38bdf8' }}>"rewrites"</span>: [{' '}
              <span style={{ color: '#F2B84B' }}>"source":"/"</span> → <span style={{ color: '#F2B84B' }}>"destination":"/home"</span> {"}]"}
              <br />
              &nbsp;&nbsp;<span style={{ color: '#38bdf8' }}>"redirects"</span>:{' '}
              <span style={{ color: '#94a3b8' }}>/index.html → /home (301)</span>
              <br />
              <span style={{ color: '#64748b' }}>{'}'}</span>
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, rgba(242,184,75,0.14) 0%, rgba(242,184,75,0.06) 100%)',
              border: '1px solid rgba(242,184,75,0.25)',
              borderRadius: 16,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#F2B84B' }}>
              PERFORMANCE TELEMETRY
            </div>
            {[
              { k: 'Hosting', v: '25+ zero-build HTML5' },
              { k: 'Insights', v: '@vercel/speed-insights 2.0' },
              { k: 'Protocol', v: 'Edge CDN • cname.vercel-dns.com' },
            ].map((r) => (
              <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>{r.k}</span>
                <span style={{ color: '#ffffff', fontWeight: 800 }}>{r.v}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: '12px 14px',
              textAlign: 'center',
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 800,
              color: '#e2e8f0',
            }}
          >
            ▲ PUSH TO MAIN → GLOBAL DEPLOY IN SECONDS
          </div>
        </div>
      </div>
    </div>
  );
};

/* =============================================================================
   SCENE 4: AI ENGINEERING SUITE
   ============================================================================= */
const Scene4AISuite: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const agents = [
    {
      name: 'Antigravity',
      sub: 'Google DeepMind • Agentic IDE',
      role: 'Active pair-programmer & system architect. Enforces AGENTS.md strictness: col-router → col-ui.css → col-ui.js → col-auth order.',
      color: '#38bdf8',
      icon: '🛸',
      tag: '100+ skills',
    },
    {
      name: 'Gemini 2.5 / 3.7 Flash',
      sub: 'Multimodal Frontier LLM • 1–2M ctx',
      role: 'Core cognitive engine for code synthesis, screenshot QA & Pacejka physics math.',
      color: '#60a5fa',
      icon: '✨',
      tag: '2M TOKENS',
    },
    {
      name: 'Claude + Codex',
      sub: 'Anthropic & OpenAI • CLI agents',
      role: 'Deep multi-file refactoring. Claude owns 7k-line game_core.js; Codex runs @playwright/mcp automation via .codex/config.toml.',
      color: '#f97316',
      icon: '🧠',
      tag: '7K LINES',
    },
    {
      name: 'OpenCode',
      sub: 'Open-source agent runner • MCP',
      role: 'opencode.json + @browsermcp/mcp 0.1.3 for headless visual checks and layout audits.',
      color: '#a855f7',
      icon: '🔓',
      tag: 'MCP BROWSER',
    },
    {
      name: 'Lovable',
      sub: 'Full-stack AI Builder',
      role: 'Rapid UI prototyping — dashboards, cards & React components migrated to col-ui.css tokens.',
      color: '#ec4899',
      icon: '💖',
      tag: 'UI SCAFFOLD',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '46px 64px 42px 64px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionLabel num="03" label="AI & AGENTIC DEVELOPMENT SUITE" color="#a855f7" />
        <MonoPill color="#a855f7">ANTIGRAVITY • CLAUDE CODE • CODEX • OPENCODE • LOVABLE</MonoPill>
      </div>

      <h2
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 32,
          fontWeight: 900,
          color: '#fff',
          margin: '12px 0 14px 0',
          lineHeight: 1.15,
        }}
      >
        Velocity engine: <span style={{ color: '#a855f7' }}>5 AI agents</span> orchestrated as one build system
      </h2>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {agents.map((a, i) => {
          const cs = spring({ frame: frame - i * 8, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <div
              key={a.name}
              style={{
                display: 'flex',
                gap: 16,
                background: 'rgba(15,23,42,0.94)',
                border: `1.5px solid ${a.color}44`,
                borderRadius: 18,
                padding: '14px 18px',
                alignItems: 'center',
                transform: `translateX(${(1 - cs) * -22}px)`,
                opacity: cs,
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: `${a.color}18`,
                  border: `1px solid ${a.color}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {a.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 17, color: '#fff' }}>{a.name}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 800, color: a.color, background: `${a.color}18`, border: `1px solid ${a.color}44`, padding: '3px 8px', borderRadius: 999 }}>
                    {a.tag}
                  </span>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: a.color, marginTop: 1 }}>{a.sub}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>{a.role}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* =============================================================================
   SCENE 5: 3D & GENERATIVE PIPELINE
   ============================================================================= */
const Scene5ThreeD: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const zoom = interpolate(frame, [0, 770], [1, 1.06], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '46px 64px 42px 64px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionLabel num="04" label="3D & GENERATIVE ASSET PIPELINE" color="#F2B84B" />
        <MonoPill color="#F2B84B">THREE.JS r128 + 0.185 • RAPIER WASM • DRACO GLB</MonoPill>
      </div>

      <div style={{ display: 'flex', gap: 28, marginTop: 16, flex: 1 }}>
        {/* Left video hero */}
        <div
          style={{
            flex: 1.1,
            borderRadius: 22,
            overflow: 'hidden',
            border: '2px solid rgba(242,184,75,0.6)',
            boxShadow: '0 18px 50px rgba(0,0,0,0.6), 0 0 32px rgba(242,184,75,0.18)',
            position: 'relative',
            background: '#000',
            transform: `scale(${s})`,
            opacity: s,
            height: 460,
          }}
        >
          <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})` }}>
            <Img src={staticFile('05_traffic_driving_gameplay.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: 'rgba(7,10,20,0.9)',
              border: '1px solid rgba(242,184,75,0.6)',
              borderRadius: 12,
              padding: '7px 12px',
              color: '#F2B84B',
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            Mumbai Traffic Hero • Three.js WebGL
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(7,10,20,0.96))',
              padding: '18px 16px 14px 16px',
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {['Auto Rickshaw', 'BEST Bus', 'Lambo', 'Barriers'].map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#e2e8f0',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  padding: '5px 10px',
                  borderRadius: 999,
                }}
              >
                {t}
              </span>
            ))}
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                fontWeight: 800,
                color: '#F2B84B',
                background: 'rgba(242,184,75,0.18)',
                border: '1px solid rgba(242,184,75,0.4)',
                padding: '5px 10px',
                borderRadius: 999,
                marginLeft: 'auto',
              }}
            >
              60 FPS • Zero-GC Pools
            </span>
          </div>
        </div>

        {/* Right specs */}
        <div style={{ flex: 0.9, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            {
              title: 'Three.js r128 + 0.185',
              desc: 'col-3d.js procedural backgrounds + Traffic/render_core.js • Two stacks: legacy static & Vite/TS Electron port',
              color: '#ffffff',
              icon: '⬢',
            },
            {
              title: 'Free 3D Assets → Bundles',
              desc: 'Sketchfab / Poly Pizza / Kenney meshes → Draco-compressed GLB → JS bundles: cert_assets.js (18MB) • env.js • auto.js',
              color: '#34d399',
              icon: '📦',
            },
            {
              title: 'Luma AI / Genie 3D',
              desc: 'Text-to-3D, NeRF Gaussian Splats & Dream Machine video for ads-video showcase clips',
              color: '#c084fc',
              icon: '🔮',
            },
            {
              title: 'Rapier3D WASM',
              desc: 'Deterministic physics in Traffic/src/ (Vite TS port) — replaces legacy Cannon path',
              color: '#38bdf8',
              icon: '⚙️',
            },
          ].map((c, i) => {
            const cs = spring({ frame: frame - 12 - i * 7, fps, config: { damping: 14, stiffness: 120 } });
            return (
              <div
                key={c.title}
                style={{
                  background: 'rgba(15,23,42,0.94)',
                  border: `1.5px solid ${c.color}44`,
                  borderRadius: 16,
                  padding: '13px 16px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  transform: `translateX(${(1 - cs) * 20}px)`,
                  opacity: cs,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${c.color}18`,
                    border: `1px solid ${c.color}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 14, color: c.color }}>{c.title}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#94a3b8', lineHeight: 1.4, marginTop: 2 }}>{c.desc}</div>
                </div>
              </div>
            );
          })}

          <div
            style={{
              marginTop: 'auto',
              background: 'rgba(242,184,75,0.1)',
              border: '1px solid rgba(242,184,75,0.28)',
              borderRadius: 12,
              padding: '10px 14px',
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 800,
              color: '#F2B84B',
              textAlign: 'center',
            }}
          >
            Cosmos.glb • shield.glb • knots.glb • book.glb in col-3d.js procedural scenes
          </div>
        </div>
      </div>
    </div>
  );
};

/* =============================================================================
   SCENE 6: BACKEND & DATA — Supabase + Freebuff
   ============================================================================= */
const Scene6Backend: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    {
      name: 'Supabase',
      cat: 'Backend-as-a-Service • Postgres + Auth',
      role: 'Global auth via supabase.js v2.108.1 + col-auth.js (Google OAuth + email). Telemetry for achievements & leaderboards via col-achievements.js',
      color: '#34d399',
      icon: '⚡',
      detail: 'config.json vs Traffic/config.json — isolated creds',
      badge: 'v2.108.1',
    },
    {
      name: 'Freebuff',
      cat: 'Local Desktop DB • Embedded SQLite',
      role: '.freebuff/desktop.db (~54MB) + WAL • Local index, asset hashes & offline simulator cache — no cloud query needed',
      color: '#a78bfa',
      icon: '🗄️',
      detail: 'offline tooling & state caching',
      badge: '54MB SQLITE',
    },
    {
      name: 'Config Separation',
      cat: 'Dual Config • Secrets Isolation',
      role: 'Never mix root config.json (global auth) with Traffic/config.json (sim creds) + .env.local / Traffic/.env gitignored',
      color: '#f472b6',
      icon: '🔐',
      detail: 'AGENTS.md DO NOT TOUCH',
      badge: 'ISOLATED',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '46px 64px 42px 64px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionLabel num="05" label="BACKEND, AUTH & DATA LAYER" color="#34d399" />
        <MonoPill color="#34d399">SUPABASE POSTGRES • FREEBUFF SQLITE • AUTH SEPARATION</MonoPill>
      </div>

      <h2
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 28,
          fontWeight: 900,
          color: '#fff',
          margin: '14px 0 16px 0',
        }}
      >
        Realtime Postgres in the cloud. <span style={{ color: '#34d399' }}>SQLite on the desktop.</span> Strictly isolated.
      </h2>

      <div style={{ display: 'flex', gap: 16, flex: 1 }}>
        {rows.map((r, i) => {
          const cs = spring({ frame: frame - i * 8, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <div
              key={r.name}
              style={{
                flex: 1,
                background: 'rgba(15,23,42,0.94)',
                border: `1.5px solid ${r.color}44`,
                borderRadius: 20,
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transform: `scale(${cs}) translateY(${(1 - cs) * 14}px)`,
                opacity: cs,
                boxShadow: `0 14px 36px rgba(0,0,0,0.5)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${r.color}18`,
                    border: `1px solid ${r.color}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {r.icon}
                </div>
                <div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 18, color: r.color }}>{r.name}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: 0.8 }}>
                    {r.cat}
                  </div>
                </div>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    fontWeight: 800,
                    color: r.color,
                    background: `${r.color}18`,
                    border: `1px solid ${r.color}44`,
                    padding: '4px 8px',
                    borderRadius: 999,
                  }}
                >
                  {r.badge}
                </span>
              </div>

              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#cbd5e1', lineHeight: 1.45, flex: 1 }}>{r.role}</div>

              <div
                style={{
                  background: `${r.color}10`,
                  border: `1px solid ${r.color}22`,
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  color: r.color,
                  textAlign: 'center',
                }}
              >
                {r.detail}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auth flow diagram */}
      <div
        style={{
          marginTop: 16,
          background: 'rgba(7,10,20,0.9)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          fontWeight: 800,
          color: '#e2e8f0',
        }}
      >
        <span style={{ color: '#34d399' }}>col-auth.js</span>
        <span style={{ color: '#64748b' }}>→</span>
        <span>Google OAuth hash (#access_token) + col-auth-changed event</span>
        <span style={{ color: '#64748b' }}>→</span>
        <span style={{ color: '#a78bfa' }}>window.supabaseClient / window.colUser</span>
        <span style={{ color: '#64748b' }}>•</span>
        <span style={{ color: '#f472b6' }}>qr.html uses isolated gSignIn() — do not merge</span>
      </div>
    </div>
  );
};

/* =============================================================================
   SCENE 7: OUTRO — Supporting tech + CTA
   ============================================================================= */
const Scene7Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const pulse = interpolate(Math.sin(frame / 14), [-1, 1], [0.98, 1.02]);

  const supporting = [
    { name: 'MediaPipe / WebRTC', desc: '21 joints • WASM', color: '#10b981', icon: '🖐️' },
    { name: 'Rapier3D', desc: 'WASM physics', color: '#38bdf8', icon: '⚙️' },
    { name: 'Electron', desc: 'Desktop port', color: '#60a5fa', icon: '🖥️' },
    { name: 'Playwright', desc: 'Smoke tests', color: '#a78bfa', icon: '🎭' },
    { name: 'PWA / SW', desc: 'col-cache-v4', color: '#F2B84B', icon: '📲' },
    { name: 'APK', desc: 'v1.6 code 7', color: '#f472b6', icon: '🤖' },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '46px 64px 42px 64px',
        boxSizing: 'border-box',
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <MonoPill color="#F2B84B">SUPPORTING TECHNOLOGIES • PWA • ELECTRON • PLAYWRIGHT • MEDIAPIPE</MonoPill>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, transform: `scale(${s})`, opacity: s }}>
        <h2
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 52,
            fontWeight: 900,
            color: '#fff',
            margin: 0,
            lineHeight: 1.05,
            textAlign: 'center',
          }}
        >
          A small team. <span style={{ color: '#F2B84B' }}>A global stack.</span>
          <br />
          <span style={{ color: '#00D2FF', fontSize: 36 }}>Shipped for $0 on the open web.</span>
        </h2>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900 }}>
          {supporting.map((t) => (
            <div
              key={t.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(15,23,42,0.9)',
                border: `1px solid ${t.color}44`,
                padding: '8px 14px',
                borderRadius: 999,
              }}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 800, color: t.color }}>{t.name}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#94a3b8' }}>{t.desc}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 6,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              background: '#F2B84B',
              color: '#070a14',
              borderRadius: 18,
              padding: '18px 28px',
              textAlign: 'center',
              transform: `scale(${pulse})`,
              boxShadow: '0 12px 40px rgba(242,184,75,0.35)',
            }}
          >
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 22, lineHeight: 1 }}>classoflearners.vercel.app</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 800, letterSpacing: 1, marginTop: 6, opacity: 0.8 }}>
              TRY SOLAR • TRAFFIC • ATI • GESTURE • QR • RPG — IN BROWSER
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 18,
              padding: '18px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#00D2FF' }}>
              INFRASTRUCTURE CREDENTIALS
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#e2e8f0' }}>
              Vercel Edge <span style={{ color: '#64748b' }}>•</span> ClouDNS Anycast <span style={{ color: '#64748b' }}>•</span> Digitalplat DDNS
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#94a3b8' }}>
              Supabase Auth <span style={{ color: '#64748b' }}>•</span> Freebuff SQLite <span style={{ color: '#64748b' }}>•</span> PWA v4 offline
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 999,
          padding: '10px 20px',
        }}
      >
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>
          ⭐ STAR NeelAniGamer/Vercel ON GITHUB
        </span>
        <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
          Build with AI. Ship to edge. For free. Mumbai → World.
        </span>
      </div>
    </div>
  );
};
