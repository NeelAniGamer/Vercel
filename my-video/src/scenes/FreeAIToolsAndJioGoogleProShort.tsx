import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ThemedBackground } from '../components/ThemedBackground';
import { ProgressBar } from '../components/ProgressBar';

export const FreeAIToolsAndJioGoogleProShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#070a14', overflow: 'hidden' }}>
      <ThemedBackground theme="cyber" />
      <ProgressBar />

      {/* High-Energy Brazilian Phonk / Drift Beats */}
      <Audio src={staticFile('audio/bg_phonk_funk_beat.wav')} volume={0.24} loop />

      {/* SCENE 1: THE HOOK (0 - 320 frames / ~10.6s) */}
      <Sequence from={0} durationInFrames={320}>
        <Audio src={staticFile('audio/aitools_01_hook.mp3')} volume={1} />
        <Scene1Hook />
      </Sequence>

      {/* SCENE 2: ANTIGRAVITY vs OPENCODE vs FREEBUFF (320 - 740 frames / ~14s) */}
      <Sequence from={320} durationInFrames={420}>
        <Audio src={staticFile('audio/aitools_02_tools.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Scene2ToolsComparison />
      </Sequence>

      {/* SCENE 3: JIO SIM + GOOGLE AI PRO FREE IN INDIA (740 - 1160 frames / ~14s) */}
      <Sequence from={740} durationInFrames={420}>
        <Audio src={staticFile('audio/aitools_03_jio_offer.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Scene3JioGoogleOffer />
      </Sequence>

      {/* SCENE 4: GOOGLE AI PRO PERKS (2M CONTEXT, 2TB STORAGE) (1160 - 1580 frames / ~14s) */}
      <Sequence from={1160} durationInFrames={420}>
        <Audio src={staticFile('audio/aitools_04_perks.mp3')} volume={1} />
        <Audio src={staticFile('audio/whoosh_clean.wav')} volume={0.4} />
        <Scene4GooglePerks />
      </Sequence>

      {/* SCENE 5: OUTRO & ACTION PLAN (1580 - 1980 frames / ~13.3s) */}
      <Sequence from={1580} durationInFrames={400}>
        <Audio src={staticFile('audio/aitools_05_outro.mp3')} volume={1} />
        <Scene5OutroCTA />
      </Sequence>
    </AbsoluteFill>
  );
};

/* SCENE 1: THE HOOK */
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
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
          transform: `scale(${scale})`,
          letterSpacing: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span>🔥</span> TOP FREE AI TOOLS GUIDE <span>🚀</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 24,
          width: '100%',
          maxWidth: 980,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 66,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.08,
            margin: 0,
            textShadow: '0 10px 40px rgba(0,0,0,0.9)',
          }}
        >
          BEST FREE AI TOOLS <br />
          <span style={{ color: '#00D2FF' }}>FOR CODING & BUILDING!</span>
        </h1>

        {/* Highlight Feature Card */}
        <div
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(10,40,133,0.4) 0%, rgba(66,133,244,0.25) 100%)',
            border: '2.5px solid #00D2FF',
            borderRadius: 36,
            padding: '36px 30px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(0,210,255,0.4)',
            transform: `scale(${pulse})`,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <span style={{ fontSize: 36 }}>🇮🇳</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, color: '#F2B84B', fontWeight: 800 }}>
              EXCLUSIVE JIO USER PERK
            </span>
          </div>

          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 44,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.15,
            }}
          >
            CLAIM <span style={{ color: '#34A853' }}>GOOGLE AI PRO</span> <br />
            100% FOR FREE!
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 18px', borderRadius: 999, color: '#ffffff', fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700 }}>
              🧠 2M Token Context
            </span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 18px', borderRadius: 999, color: '#ffffff', fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700 }}>
              ☁️ 2 TB Cloud Storage
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,210,255,0.4)', borderRadius: 20, padding: '12px 24px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 800 }}>
          ⚡ Antigravity • OpenCode • Freebuff
        </div>
      </div>
    </div>
  );
};

/* SCENE 2: ANTIGRAVITY vs OPENCODE vs FREEBUFF */
const Scene2ToolsComparison: React.FC = () => {
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
        ⚡ FREE CODING TOOLS BREAKDOWN
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16,
          width: '100%',
          maxWidth: 980,
          transform: `scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 58,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          ANTIGRAVITY <span style={{ color: '#94a3b8' }}>vs</span> OPENCODE <br />
          <span style={{ color: '#F2B84B' }}>& FREEBUFF APIS</span>
        </h1>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Antigravity Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1.5px solid rgba(0, 210, 255, 0.5)',
              borderRadius: 22,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 36 }}>🚀</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#00D2FF', fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 800 }}>
                  Google Antigravity
                </div>
                <div style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 600 }}>
                  Autonomous agent workflows, precision edits (mind your token limits)
                </div>
              </div>
            </div>
            <div style={{ background: '#00D2FF', color: '#070a14', padding: '6px 14px', borderRadius: 999, fontFamily: "'Space Mono', monospace", fontWeight: 900, fontSize: 14 }}>
              AUTONOMOUS
            </div>
          </div>

          {/* OpenCode Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1.5px solid rgba(16, 185, 129, 0.5)',
              borderRadius: 22,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 36 }}>💻</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#10b981', fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 800 }}>
                  OpenCode Interpreter
                </div>
                <div style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 600 }}>
                  Generous / high token quotas, massive multi-file context reasoning
                </div>
              </div>
            </div>
            <div style={{ background: '#10b981', color: '#ffffff', padding: '6px 14px', borderRadius: 999, fontFamily: "'Space Mono', monospace", fontWeight: 900, fontSize: 14 }}>
              HIGH TOKENS
            </div>
          </div>

          {/* Freebuff / Open APIs Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1.5px solid rgba(242, 184, 75, 0.5)',
              borderRadius: 22,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 36 }}>⚡</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#F2B84B', fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 800 }}>
                  Freebuff & Free AI Endpoints
                </div>
                <div style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 600 }}>
                  Access top open-weights models for $0 without paid subscriptions
                </div>
              </div>
            </div>
            <div style={{ background: '#F2B84B', color: '#070a14', padding: '6px 14px', borderRadius: 999, fontFamily: "'Space Mono', monospace", fontWeight: 900, fontSize: 14 }}>
              100% FREE
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(242,184,75,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          💡 Pick the right tool for each task!
        </div>
      </div>
    </div>
  );
};

/* SCENE 3: JIO SIM + GOOGLE AI PRO FREE IN INDIA */
const Scene3JioGoogleOffer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
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
          background: 'linear-gradient(135deg, #0A2885 0%, #0066FF 100%)',
          border: '2px solid #00D2FF',
          borderRadius: 999,
          padding: '12px 32px',
          color: '#ffffff',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 900,
          boxShadow: '0 0 35px rgba(0, 102, 255, 0.7)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span>🇮🇳</span> JIO + GOOGLE EXCLUSIVE OFFER <span>✨</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 22,
          width: '100%',
          maxWidth: 980,
          transform: `scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 62,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          HAVE A <span style={{ color: '#0066FF' }}>JIO SIM</span> IN INDIA? <br />
          <span style={{ color: '#10b981' }}>CLAIM GOOGLE AI PRO FREE!</span>
        </h1>

        <div
          style={{
            width: '100%',
            transform: `scale(${pulse})`,
            background: 'linear-gradient(135deg, rgba(10,40,133,0.7) 0%, rgba(66,133,244,0.3) 100%)',
            border: '3px solid #00D2FF',
            borderRadius: 34,
            padding: '34px 28px',
            boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 50px rgba(0,102,255,0.6)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 44 }}>📱</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 26, color: '#F2B84B', fontWeight: 900 }}>
                Google One AI Premium Plan
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, color: '#e2e8f0', fontWeight: 700 }}>
                Free Offer For Eligible Jio Mobile & Fiber Users
              </div>
            </div>
          </div>

          <div
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 20,
              padding: '16px 20px',
              fontFamily: "'Inter', sans-serif",
              fontSize: 20,
              color: '#38bdf8',
              fontWeight: 800,
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <span>👉 Check MyJio App</span>
            <span>•</span>
            <span>👉 Activate in 1-Click</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,210,255,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          🇮🇳 18+ Months Free AI Value
        </div>
      </div>
    </div>
  );
};

/* SCENE 4: GOOGLE AI PRO PERKS */
const Scene4GooglePerks: React.FC = () => {
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
          border: '2px solid #34A853',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#34A853',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 800,
          boxShadow: '0 0 25px rgba(52, 168, 83, 0.5)',
        }}
      >
        🎁 GOOGLE AI PRO PERKS INCLUDED
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16,
          width: '100%',
          maxWidth: 980,
          transform: `scale(${scale})`,
        }}
      >
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
          MASSIVE 2M TOKENS <br />
          <span style={{ color: '#34A853' }}>+ 2 TB CLOUD STORAGE!</span>
        </h1>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Perk 1 */}
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(66, 133, 244, 0.5)', borderRadius: 20, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>🧠</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#4285F4', fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 800 }}>
                Gemini 1.5 / 2.0 Pro (2M Context)
              </div>
              <div style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600 }}>
                Upload entire codebases, multi-hour video feeds & documentation at once
              </div>
            </div>
          </div>

          {/* Perk 2 */}
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(234, 67, 53, 0.5)', borderRadius: 20, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>☁️</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#EA4335', fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 800 }}>
                2 TB Google One Storage
              </div>
              <div style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600 }}>
                Massive cloud backup for game builds, models, datasets & media assets
              </div>
            </div>
          </div>

          {/* Perk 3 */}
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(251, 188, 5, 0.5)', borderRadius: 20, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>⚡</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#FBBC05', fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 800 }}>
                Google AI Studio API Free Quotas
              </div>
              <div style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600 }}>
                Direct API keys for building intelligent web apps & backends
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(52,168,83,0.4)', borderRadius: 20, padding: '10px 22px', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>
          📝 AI Inside Gmail, Docs & Drive Included
        </div>
      </div>
    </div>
  );
};

/* SCENE 5: OUTRO & ACTION PLAN */
const Scene5OutroCTA: React.FC = () => {
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
          background: 'rgba(0, 210, 255, 0.15)',
          border: '2px solid #00D2FF',
          borderRadius: 999,
          padding: '10px 32px',
          color: '#00D2FF',
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 2,
        }}
      >
        🚀 START CODING FOR $0
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 24,
          width: '100%',
          maxWidth: 980,
          transform: `scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 68,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          ZERO EXCUSES. <br />
          <span style={{ color: '#00D2FF' }}>BUILD YOUR DREAM APP!</span>
        </h1>

        <div
          style={{
            width: '100%',
            transform: `scale(${pulse})`,
            background: 'linear-gradient(135deg, rgba(0,210,255,0.2) 0%, rgba(16,185,129,0.2) 100%)',
            border: '3px solid #00D2FF',
            borderRadius: 36,
            padding: '34px 28px',
            boxShadow: '0 0 60px rgba(0, 210, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, color: '#00D2FF', letterSpacing: 3, fontWeight: 800 }}>
            🌟 SEE ALL LIVE 3D PROJECTS
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: 1, wordBreak: 'break-all' }}>
            advancedlogiclabs.dpdns.org
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, color: '#F2B84B', fontWeight: 700 }}>
            🎮 Mumbai Traffic Hero • Solar 3D • ATI Typing
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 24,
            padding: '16px 30px',
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            fontSize: 24,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span>💬</span> WHICH FREE AI TOOL IS YOUR FAVORITE?
        </div>
      </div>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, color: '#64748b', letterSpacing: 2 }}>
        CLASS OF LEARNERS • LIKE & SUBSCRIBE
      </div>
    </div>
  );
};
