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

// Measured @30fps +15 padding each
const SHORTS_SCENES = [
  { id: 'shorts_01_hook', frames: 274 }, // 259 +15
  { id: 'shorts_02_cloud', frames: 511 }, // 496+15
  { id: 'shorts_03_ai', frames: 538 }, // 523+15
  { id: 'shorts_04_3d', frames: 457 }, // 442+15
  { id: 'shorts_05_backend', frames: 344 }, // 329+15
  { id: 'shorts_06_outro', frames: 386 }, // 371+15
];
export const RESEARCH_SHORTS_TOTAL = SHORTS_SCENES.reduce((a, s) => a + s.frames, 0); // 2510

export const ResearchShorts: React.FC = () => {
  let cur = 0;
  const at = (i: number) => {
    const v = cur;
    cur += SHORTS_SCENES[i].frames;
    return v;
  };
  const s0 = at(0);
  const s1 = at(1);
  const s2 = at(2);
  const s3 = at(3);
  const s4 = at(4);
  const s5 = at(5);

  return (
    <AbsoluteFill style={{ backgroundColor: '#070a14', overflow: 'hidden' }}>
      <ThemedBackground theme="cyber" />
      <ProgressBar />
      <Audio src={staticFile('audio/bg_phonk_funk_beat.wav')} volume={0.18} loop />

      <Sequence from={s0} durationInFrames={SHORTS_SCENES[0].frames}>
        <Audio src={staticFile('audio/shorts_01_hook.mp3')} volume={1} />
        <ShortsHook />
      </Sequence>
      <Sequence from={s1} durationInFrames={SHORTS_SCENES[1].frames}>
        <Audio src={staticFile('audio/shorts_02_cloud.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.32} />
        <ShortsCloud />
      </Sequence>
      <Sequence from={s2} durationInFrames={SHORTS_SCENES[2].frames}>
        <Audio src={staticFile('audio/shorts_03_ai.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.32} />
        <ShortsAI />
      </Sequence>
      <Sequence from={s3} durationInFrames={SHORTS_SCENES[3].frames}>
        <Audio src={staticFile('audio/shorts_04_3d.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.32} />
        <Shorts3D />
      </Sequence>
      <Sequence from={s4} durationInFrames={SHORTS_SCENES[4].frames}>
        <Audio src={staticFile('audio/shorts_05_backend.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.32} />
        <ShortsBackend />
      </Sequence>
      <Sequence from={s5} durationInFrames={SHORTS_SCENES[5].frames}>
        <Audio src={staticFile('audio/shorts_06_outro.mp3')} volume={1} />
        <ShortsOutro />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------- SHARED ----------
const Pill: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: `${color}18`,
      border: `1.5px solid ${color}66`,
      color,
      fontFamily: "'Space Mono', monospace",
      fontSize: 16,
      fontWeight: 900,
      letterSpacing: 1.5,
      padding: '10px 22px',
      borderRadius: 999,
      boxShadow: `0 0 24px ${color}33`,
    }}
  >
    {children}
  </div>
);

// ---------- SCENE 1: HOOK ----------
const ShortsHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const s2 = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 120 } });
  const s3 = spring({ frame: frame - 16, fps, config: { damping: 14, stiffness: 120 } });
  const pulse = interpolate(Math.sin(frame / 10), [-1, 1], [0.98, 1.03]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '86px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
        textAlign: 'center',
      }}
    >
      <div style={{ transform: `scale(${s})`, opacity: s }}>
        <Pill color="#F2B84B">◆ COMPREHENSIVE RESEARCH • TECH STACK</Pill>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, transform: `scale(${s2})`, opacity: s2 }}>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 3,
            color: '#00D2FF',
          }}
        >
          6 STUDENTS • MUMBAI • 2026
        </div>

        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 1.05,
            color: '#fff',
          }}
        >
          How We Built
          <br />
          <span style={{ color: '#00D2FF' }}>25+ 3D Apps</span>
          <br />
          <span
            style={{
              background: '#F2B84B',
              color: '#070a14',
              padding: '2px 18px',
              borderRadius: 14,
              display: 'inline-block',
              transform: `scale(${pulse})`,
            }}
          >
            for $0
          </span>
        </div>

        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 22,
            color: '#cbd5e1',
            lineHeight: 1.45,
            maxWidth: 900,
          }}
        >
          The exact master stack behind <b style={{ color: '#fff' }}>Class Of Learners</b> — every platform, tool & service
          and what it actually does in production.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 920 }}>
          {[
            { l: 'Vercel', c: '#fff' },
            { l: 'GitHub', c: '#9ca3af' },
            { l: 'Antigravity', c: '#38bdf8' },
            { l: 'Claude', c: '#f97316' },
            { l: 'Supabase', c: '#34d399' },
            { l: 'Three.js', c: '#F2B84B' },
            { l: 'Luma AI', c: '#c084fc' },
            { l: 'Gemini', c: '#60a5fa' },
          ].map((t) => (
            <span
              key={t.l}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 15,
                fontWeight: 800,
                color: t.c,
                border: `1px solid ${t.c}44`,
                background: `${t.c}14`,
                padding: '8px 16px',
                borderRadius: 999,
              }}
            >
              {t.l}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          width: '100%',
          borderRadius: 24,
          overflow: 'hidden',
          border: '2px solid rgba(0,210,255,0.5)',
          boxShadow: '0 18px 50px rgba(0,0,0,0.7)',
          height: 520,
          position: 'relative',
          transform: `scale(${s3})`,
          opacity: s3,
        }}
      >
        <Img src={staticFile('01_home_hero.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(7,10,20,0.96))',
            padding: '20px 18px 16px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          <span style={{ color: '#F2B84B' }}>25+ LIVE APPS • ZERO BUILD</span>
          <span style={{ color: '#00D2FF' }}>SHORTS • 60S MASTER STACK</span>
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 14,
          color: '#94a3b8',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '10px 22px',
          borderRadius: 999,
          opacity: s3,
        }}
      >
        Keep watching — full deep dive in 60 seconds ↓
      </div>
    </div>
  );
};

// ---------- SCENE 2: CLOUD ----------
const ShortsCloud: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    { name: 'Vercel', desc: 'Primary host — cleanUrls, / → /home, Speed Insights, zero-build static', color: '#fff', icon: '▲', badge: 'EDGE' },
    { name: 'GitHub', desc: 'NeelAniGamer/Vercel — push to main = global deploy, APK releases', color: '#9ca3af', icon: '◆', badge: 'CI/CD' },
    { name: 'ClouDNS', desc: 'Anycast 30+ POPs, DDoS, CNAME → cname.vercel-dns.com, TXT bWaer2…', color: '#38bdf8', icon: '🌍', badge: 'DNS' },
    { name: 'Digitalplat', desc: 'Live domain advancedlogiclabs.dpdns.org — high-availability routing', color: '#F2B84B', icon: '🌐', badge: 'DPDNS' },
  ];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '86px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
        gap: 18,
      }}
    >
      <Pill color="#F2B84B">☁️ CLOUD, DNS & DEPLOYMENT</Pill>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
          Push to <span style={{ color: '#F2B84B' }}>deploy globally</span>
          <br />
          <span style={{ fontSize: 22, color: '#cbd5e1', fontWeight: 600 }}>in seconds — no servers</span>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        {items.map((it, i) => {
          const cs = spring({ frame: frame - i * 7, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <div
              key={it.name}
              style={{
                display: 'flex',
                gap: 16,
                background: 'rgba(15,23,42,0.94)',
                border: `2px solid ${it.color}44`,
                borderRadius: 20,
                padding: '18px 20px',
                alignItems: 'center',
                transform: `scale(${cs}) translateY(${(1 - cs) * 12}px)`,
                opacity: cs,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `${it.color}18`,
                  border: `1px solid ${it.color}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 900,
                  color: it.color,
                }}
              >
                {it.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 22, color: '#fff' }}>{it.name}</span>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 11,
                      fontWeight: 800,
                      color: it.color,
                      background: `${it.color}18`,
                      border: `1px solid ${it.color}44`,
                      padding: '4px 10px',
                      borderRadius: 999,
                    }}
                  >
                    {it.badge}
                  </span>
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#94a3b8', marginTop: 4, lineHeight: 1.35 }}>{it.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: 'rgba(242,184,75,0.1)',
          border: '1px solid rgba(242,184,75,0.28)',
          borderRadius: 16,
          padding: '12px 20px',
          fontFamily: "'Space Mono', monospace",
          fontSize: 14,
          fontWeight: 800,
          color: '#F2B84B',
          textAlign: 'center',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        vercel.json: cleanUrls true • rewrites / → /home • redirects /index.html → /home
      </div>
    </div>
  );
};

// ---------- SCENE 3: AI ----------
const ShortsAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const agents = [
    { name: 'Antigravity + Gemini', role: 'Architect • 1–2M ctx • enforces AGENTS.md script order', color: '#38bdf8', icon: '🛸', tag: 'DEEPMIND' },
    { name: 'Claude + Codex', role: '7k-line refactoring • @playwright/mcp automation via .codex/config.toml', color: '#f97316', icon: '🧠', tag: '7K LINES' },
    { name: 'OpenCode', role: 'opencode.json + @browsermcp/mcp 0.1.3 • headless visual QA', color: '#a855f7', icon: '🔓', tag: 'MCP' },
    { name: 'Lovable', role: 'Rapid dashboard & React prototyping → col-ui.css tokens', color: '#ec4899', icon: '💖', tag: 'UI' },
  ];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '86px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
        gap: 18,
      }}
    >
      <Pill color="#a855f7">🤖 AI & AGENTIC DEVELOPMENT SUITE</Pill>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
          <span style={{ color: '#a855f7' }}>5 AI agents</span> = one build system
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: '#94a3b8', marginTop: 6 }}>Antigravity orchestrates • Claude & Codex ship • OpenCode verifies</div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {agents.map((a, i) => {
          const cs = spring({ frame: frame - i * 7, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <div
              key={a.name}
              style={{
                display: 'flex',
                gap: 16,
                background: 'rgba(15,23,42,0.94)',
                border: `1.5px solid ${a.color}44`,
                borderRadius: 20,
                padding: '18px 20px',
                alignItems: 'center',
                transform: `scale(${cs})`,
                opacity: cs,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: `${a.color}18`,
                  border: `1px solid ${a.color}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                }}
              >
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 20, color: '#fff' }}>{a.name}</span>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 11,
                      fontWeight: 800,
                      color: a.color,
                      background: `${a.color}18`,
                      border: `1px solid ${a.color}44`,
                      padding: '4px 10px',
                      borderRadius: 999,
                    }}
                  >
                    {a.tag}
                  </span>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: a.color, marginTop: 2 }}>{a.role.split('•')[0]}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#cbd5e1', marginTop: 2, lineHeight: 1.35 }}>{a.role.split('•')[1]?.trim() ?? ''}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {['100+ skills', 'Gemini 3.7 Flash', 'Playwright MCP', 'BrowserMCP 0.1.3'].map((t) => (
          <span
            key={t}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              fontWeight: 800,
              color: '#e2e8f0',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              padding: '7px 14px',
              borderRadius: 999,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

// ---------- SCENE 4: 3D ----------
const Shorts3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const zoom = interpolate(frame, [0, 457], [1, 1.06], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '86px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
        gap: 18,
      }}
    >
      <Pill color="#F2B84B">🎮 3D & GENERATIVE ASSET PIPELINE</Pill>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
          <span style={{ color: '#F2B84B' }}>60 FPS</span> in the browser
          <br />
          <span style={{ fontSize: 20, color: '#cbd5e1', fontWeight: 600 }}>zero-GC • Draco GLB • WASM physics</span>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          borderRadius: 24,
          overflow: 'hidden',
          border: '2px solid rgba(242,184,75,0.55)',
          height: 460,
          position: 'relative',
          background: '#000',
          transform: `scale(${s})`,
          opacity: s,
        }}
      >
        <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})` }}>
          <Img src={staticFile('05_traffic_driving_gameplay.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            background: 'rgba(7,10,20,0.9)',
            border: '1px solid rgba(242,184,75,0.6)',
            borderRadius: 12,
            padding: '8px 14px',
            color: '#F2B84B',
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          Mumbai Traffic Hero • Three.js r128 + Rapier
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(7,10,20,0.96))',
            padding: '16px',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {['Auto', 'BEST Bus', 'Lambo', 'Barriers', 'Signals'].map((t) => (
            <span
              key={t}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                fontWeight: 800,
                color: '#e2e8f0',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '6px 12px',
                borderRadius: 999,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { title: 'Three.js r128 + 0.185', desc: 'col-3d.js + render_core.js • legacy static & Vite TS Electron', color: '#fff' },
          { title: 'Free 3D → Draco Bundles', desc: 'cert_assets.js 18MB • env.js • auto.js • cosmos.glb • shield.glb', color: '#34d399' },
          { title: 'Luma Genie + Rapier WASM', desc: 'Text-to-3D & NeRF splats + deterministic physics in Traffic/src', color: '#c084fc' },
        ].map((c, i) => {
          const cs = spring({ frame: frame - 14 - i * 6, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <div
              key={c.title}
              style={{
                background: 'rgba(15,23,42,0.94)',
                border: `1px solid ${c.color}33`,
                borderRadius: 16,
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                transform: `translateY(${(1 - cs) * 10}px)`,
                opacity: cs,
              }}
            >
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 16, color: c.color }}>{c.title}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#94a3b8', lineHeight: 1.35 }}>{c.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- SCENE 5: BACKEND ----------
const ShortsBackend: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    { name: 'Supabase', desc: 'Postgres + Auth • supabase.js v2.108.1 • Google OAuth + col-auth-changed • achievements', color: '#34d399', icon: '⚡' },
    { name: 'Freebuff', desc: '.freebuff/desktop.db 54MB • SQLite local index + WAL • offline cache', color: '#a78bfa', icon: '🗄️' },
    { name: 'Isolation', desc: 'config.json ≠ Traffic/config.json • .env.local gitignored • DO NOT MIX', color: '#f472b6', icon: '🔐' },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '86px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
        gap: 20,
      }}
    >
      <Pill color="#34d399">⚡ BACKEND, AUTH & DATA</Pill>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1.15 }}>
          Cloud Postgres.
          <br />
          <span style={{ color: '#34d399' }}>Desktop SQLite.</span> Isolated.
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#94a3b8', marginTop: 8, lineHeight: 1.4 }}>
          Realtime in the cloud, cache on the desktop — strictly separated per AGENTS.md
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((r, i) => {
          const cs = spring({ frame: frame - i * 7, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <div
              key={r.name}
              style={{
                display: 'flex',
                gap: 16,
                background: 'rgba(15,23,42,0.94)',
                border: `1.5px solid ${r.color}44`,
                borderRadius: 18,
                padding: '18px 20px',
                alignItems: 'center',
                transform: `scale(${cs})`,
                opacity: cs,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: `${r.color}18`,
                  border: `1px solid ${r.color}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                }}
              >
                {r.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 20, color: r.color }}>{r.name}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#cbd5e1', lineHeight: 1.4, marginTop: 4 }}>{r.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: 'rgba(7,10,20,0.9)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '12px 16px',
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          fontWeight: 800,
          color: '#94a3b8',
          textAlign: 'center',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        window.supabaseClient / window.colUser • col-auth-changed event • qr.html gSignIn isolated
      </div>
    </div>
  );
};

// ---------- SCENE 6: OUTRO ----------
const ShortsOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const pulse = interpolate(Math.sin(frame / 10), [-1, 1], [0.98, 1.04]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '86px 44px 80px 44px',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      <Pill color="#F2B84B">SUPPORTING TECH • PWA • ELECTRON • PLAYWRIGHT</Pill>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, transform: `scale(${s})`, opacity: s }}>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 52,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.05,
            textAlign: 'center',
          }}
        >
          Small team.
          <br />
          <span style={{ color: '#F2B84B' }}>Global stack.</span>
          <br />
          <span style={{ color: '#00D2FF', fontSize: 28 }}>Shipped for $0 on the open web.</span>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 880 }}>
          {[
            { l: 'MediaPipe', c: '#10b981' },
            { l: 'Rapier WASM', c: '#38bdf8' },
            { l: 'Electron', c: '#60a5fa' },
            { l: 'Playwright', c: '#a78bfa' },
            { l: 'PWA v4', c: '#F2B84B' },
            { l: 'APK v1.6', c: '#f472b6' },
          ].map((t) => (
            <span
              key={t.l}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 13,
                fontWeight: 800,
                color: t.c,
                background: `${t.c}14`,
                border: `1px solid ${t.c}44`,
                padding: '8px 14px',
                borderRadius: 999,
              }}
            >
              {t.l}
            </span>
          ))}
        </div>

        <div
          style={{
            background: '#F2B84B',
            color: '#070a14',
            borderRadius: 20,
            padding: '20px 32px',
            textAlign: 'center',
            transform: `scale(${pulse})`,
            boxShadow: '0 16px 48px rgba(242,184,75,0.4)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 26 }}>classoflearners.vercel.app</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 800, letterSpacing: 1, marginTop: 6, opacity: 0.85 }}>
            SOLAR • TRAFFIC • ATI • GESTURE • QR • RPG — PLAY IN BROWSER
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, marginTop: 6, opacity: 0.7 }}>advancedlogiclabs.dpdns.org • also live</div>
        </div>

        <div
          style={{
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 16,
            padding: '14px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#00D2FF' }}>
            SUMMARY: 14 PLATFORMS • ONE PIPELINE
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#cbd5e1', lineHeight: 1.4 }}>
            Vercel + GitHub + ClouDNS + Digitalplat + Supabase + Freebuff + Antigravity + Gemini + Claude + Codex + OpenCode + Lovable +
            Three.js + Luma AI
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 999,
          padding: '12px 22px',
        }}
      >
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 900, color: '#fff' }}>⭐ STAR ON GITHUB</span>
        <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>NeelAniGamer / Vercel • Build for free!</span>
      </div>
    </div>
  );
};
