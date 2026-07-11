/* Traffic Academy UI Components — extracted from Traffic/Academy.html
   Import into Figma or a React project.  All styles are inline
   (no external CSS dependency) so Figma can render them as-is. */

import React from 'react'

/* ================================================================
   0.  THEME TOKENS — mirrors :root CSS vars from Academy.html
   ================================================================ */

const t = {
  bg: '#f5f0e8',
  card: '#ffffff',
  text: '#1a1a1a',
  muted: '#888888',
  muted2: '#aaaaaa',
  border: '#e0e0e0',
  accent: '#3b8c66',
  accent2: '#60c8a0',
  green: '#00c851',
  red: '#ff3b30',
  hover: '#e8e3d8',
  glass: 'rgba(255,255,255,0.55)',
  glass2: 'rgba(255,255,255,0.85)',
}

/* ================================================================
   1.  HELPER / SHARED STYLES
   ================================================================ */

const btn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px 20px',
  borderRadius: 12,
  border: 'none',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all .15s',
}

const card: React.CSSProperties = {
  background: t.card,
  padding: 20,
  borderRadius: 16,
  border: `1px solid ${t.border}`,
  width: '100%',
}

const chip: React.CSSProperties = {
  ...btn,
  background: t.glass,
  color: t.text,
  border: `1px solid ${t.border}`,
  padding: '10px 16px',
  borderRadius: 12,
}

const dot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: t.muted2,
}

const dotActive: React.CSSProperties = { ...dot, background: t.accent, width: 24, borderRadius: 5 }

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: t.muted,
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
  marginBottom: 4,
}

/* ================================================================
   2.  ONBOARDING OVERLAY (full-screen, 5 screens)
   ================================================================ */

export function OnboardingOverlay({ currentScreen = 0 }: { currentScreen?: number }) {
  const screens = ['Welcome', 'Name', 'Auth', 'Details', 'Complete']
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200000,
      }}
    >
      {/* Dots */}
      <div style={{ position: 'absolute', top: 20, display: 'flex', gap: 8 }}>
        {screens.map((_, i) => (
          <div key={i} style={i <= currentScreen ? dotActive : dot} />
        ))}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          top: 44,
          left: '10%',
          width: '80%',
          height: 4,
          borderRadius: 2,
          background: t.border,
        }}
      >
        <div
          style={{
            width: `${(currentScreen / 4) * 100}%`,
            height: '100%',
            borderRadius: 2,
            background: t.accent,
            transition: 'width .3s',
          }}
        />
      </div>

      <div style={{ ...card, maxWidth: 400, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text }}>
          {currentScreen === 0 && 'Welcome to Traffic Academy'}
          {currentScreen === 1 && 'What should we call you?'}
          {currentScreen === 2 && 'Choose how to sign in'}
          {currentScreen === 3 && 'Tell us about yourself'}
          {currentScreen === 4 && "You're all set!"}
        </h2>

        {currentScreen === 0 && (
          <p style={{ color: t.muted, marginTop: 8, fontSize: 14 }}>
            Learn to drive safely in Indian city environments.
          </p>
        )}

        {currentScreen === 1 && (
          <input
            placeholder="Your Name"
            style={{
              width: '100%',
              padding: 10,
              marginTop: 16,
              background: t.bg,
              color: t.text,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              fontSize: 14,
            }}
          />
        )}

        {currentScreen === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <button style={{ ...chip }}>Sign in with Google</button>
            <button style={{ ...chip }}>Continue as Guest</button>
          </div>
        )}

        {currentScreen === 4 && (
          <p style={{ color: t.green, fontSize: 18, marginTop: 16, fontWeight: 600 }}>
            🎉 Let's go!
          </p>
        )}

        <button
          style={{
            ...btn,
            background: t.accent,
            color: '#fff',
            marginTop: 20,
            width: '100%',
          }}
        >
          {currentScreen < 4 ? 'Continue' : 'Start Driving'}
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   3.  LOADING SCREEN
   ================================================================ */

export function LoadingScreen({ progress = 100, status = 'Ready' }: { progress?: number; status?: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: t.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300000,
        transition: 'opacity .3s',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: t.text, marginBottom: 8 }}>🚦</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 20 }}>Traffic Academy</div>
      <div style={{ width: 220, height: 6, borderRadius: 3, background: t.border, overflow: 'hidden' }}>
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: t.accent,
            borderRadius: 3,
            transition: 'width .3s',
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: t.muted, marginTop: 8 }}>
        {status} — {progress}%
      </div>
    </div>
  )
}

/* ================================================================
   4.  HERO / START SCREEN
   ================================================================ */

export function HeroScreen({
  userName = '',
  onStart,
}: {
  userName?: string
  onStart?: () => void
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: t.bg,
        padding: 20,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 8 }}>🚦</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: t.text, margin: '8px 0' }}>Traffic Academy</h1>
      <p style={{ color: t.muted, fontSize: 14, maxWidth: 320, marginBottom: 8 }}>
        Learn to drive safely in Indian city environments
      </p>
      {userName && (
        <div id="cname" style={{ color: t.accent, fontWeight: 600, fontSize: 13, marginBottom: 16 }}>
          {userName.toUpperCase()}
        </div>
      )}
      <button onClick={onStart} style={{ ...btn, background: t.accent, color: '#fff', padding: '12px 32px', fontSize: 16 }}>
        Get Started
      </button>
    </div>
  )
}

/* ================================================================
   5.  APP SHELL — nav bar + content area
   ================================================================ */

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: t.bg }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: t.glass2,
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🚦</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Academy</span>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 13, color: t.muted }}>
          <span>Levels</span>
          <span>Certificates</span>
          <span style={{ fontSize: 10, color: t.muted2, cursor: 'pointer' }}>v2.4.1</span>
        </div>
      </nav>
      {children}
    </div>
  )
}

/* ================================================================
   6.  LEVEL MAP — Duolingo-style SVG path
   ================================================================ */

export function LevelMapNode({
  id,
  status,
  onClick,
}: {
  id: number
  status: 'locked' | 'current' | 'done'
  onClick?: () => void
}) {
  const fill = status === 'done' ? t.green : status === 'current' ? '#f39c12' : '#6b7280'
  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <circle cx={0} cy={0} r={22} fill={fill} stroke="white" strokeWidth={3} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={13}
        fontWeight={600}
      >
        {id}
      </text>
    </g>
  )
}

export function LevelMap({ levelCount = 52 }: { levelCount?: number }) {
  // Simplified Duolingo-style winding path
  const nodes: Array<{ id: number; x: number; y: number }> = []
  const cx = 150
  for (let i = 0; i < Math.min(levelCount, 20); i++) {
    const row = Math.floor(i / 5)
    const col = i % 5
    const x = row % 2 === 0 ? 30 + col * 60 : 270 - col * 60
    const y = 30 + row * 70
    nodes.push({ id: i + 1, x, y })
  }

  let pathD = ''
  nodes.forEach((n, i) => {
    pathD += i === 0 ? `M ${n.x} ${n.y}` : ` L ${n.x} ${n.y}`
  })

  return (
    <svg width={300} height={Math.max(200, nodes[nodes.length - 1].y + 60)} viewBox={`0 0 300 ${Math.max(200, nodes[nodes.length - 1].y + 60)}`}>
      <path d={pathD} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={4} strokeLinecap="round" />
      {nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x},${n.y})`}>
          <LevelMapNode id={n.id} status={n.id <= 5 ? 'done' : n.id === 6 ? 'current' : 'locked'} />
        </g>
      ))}
    </svg>
  )
}

/* ================================================================
   7.  LEVEL CARD (list view)
   ================================================================ */

export function LevelCard({
  id,
  name,
  icon = '📚',
  completed = false,
  locked = false,
  onSelect,
}: {
  id: number
  name: string
  icon?: string
  completed?: boolean
  locked?: boolean
  onSelect?: () => void
}) {
  return (
    <div
      onClick={locked ? undefined : onSelect}
      style={{
        ...card,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.5 : 1,
        transition: 'transform .1s, box-shadow .1s',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: completed ? t.green : t.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {completed ? '✅' : icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
          Lesson {id}
        </div>
      </div>
      <div style={{ fontSize: 12, color: completed ? t.green : t.muted2 }}>
        {completed ? 'Done' : locked ? '🔒' : '→'}
      </div>
    </div>
  )
}

/* ================================================================
   8.  BRIEFING MODAL
   ================================================================ */

export function BriefingModal({
  lessonId,
  title,
  description,
  onStart,
  onClose,
}: {
  lessonId: number
  title: string
  description: string
  onStart?: () => void
  onClose?: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200000,
      }}
    >
      <div style={{ ...card, maxWidth: 420, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: t.muted }}>Lesson {lessonId}</span>
          <span onClick={onClose} style={{ cursor: 'pointer', fontSize: 18, color: t.muted }}>✕</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: '0 0 8px' }}>{title}</h2>
        <p style={{ fontSize: 14, color: t.muted, lineHeight: 1.5, margin: '0 0 20px' }}>{description}</p>
        <button onClick={onStart} style={{ ...btn, background: t.accent, color: '#fff', width: '100%' }}>
          Start Lesson
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   9.  THEORY PANEL
   ================================================================ */

export function TheoryPanel({
  content,
  onContinue,
}: {
  content: string
  onContinue?: () => void
}) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={sectionTitle}>Theory</div>
      <div style={{ fontSize: 14, color: t.text, lineHeight: 1.6, marginTop: 8 }}>{content}</div>
      <button onClick={onContinue} style={{ ...btn, background: t.accent, color: '#fff', marginTop: 16, width: '100%' }}>
        I Understand
      </button>
    </div>
  )
}

/* ================================================================
   10.  TASK CHECKLIST
   ================================================================ */

export function TaskChecklist({
  tasks,
}: {
  tasks: Array<{ label: string; done: boolean }>
}) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={sectionTitle}>Tasks</div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `2px solid ${t.done ? t.green : '#ccc'}`,
                background: t.done ? t.green : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {t.done ? '✓' : ''}
            </div>
            <span style={{ fontSize: 14, color: t.done ? t.muted : t.text, textDecoration: t.done ? 'line-through' : 'none' }}>
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   11.  SCORE / RESULT CARD
   ================================================================ */

export function ScoreCard({
  score,
  total,
  passed,
  onRetry,
  onNext,
}: {
  score: number
  total: number
  passed: boolean
  onRetry?: () => void
  onNext?: () => void
}) {
  const pct = Math.round((score / total) * 100)
  return (
    <div style={{ ...card, maxWidth: 400, margin: '0 auto', textAlign: 'center', padding: 30 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '😢'}</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: '8px 0' }}>
        {passed ? 'Great Job!' : 'Try Again'}
      </h2>
      <div style={{ fontSize: 48, fontWeight: 800, color: passed ? t.green : t.red, margin: '12px 0' }}>
        {pct}%
      </div>
      <p style={{ fontSize: 14, color: t.muted, marginBottom: 20 }}>
        {score} / {total} tasks completed
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        {!passed && (
          <button onClick={onRetry} style={{ ...btn, flex: 1, background: t.bg, color: t.text, border: `1px solid ${t.border}` }}>
            Retry
          </button>
        )}
        <button onClick={onNext} style={{ ...btn, flex: 1, background: t.accent, color: '#fff' }}>
          {passed ? 'Next Lesson' : 'Back to Map'}
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   12.  CERTIFICATE VIEWER
   ================================================================ */

export function CertificateViewer({
  userName,
  lessonName,
  date,
  onClose,
}: {
  userName: string
  lessonName: string
  date?: string
  onClose?: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200000,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '40px 32px',
          maxWidth: 440,
          width: '90%',
          textAlign: 'center',
          border: `2px solid ${t.accent}`,
          position: 'relative',
        }}
      >
        <span onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, cursor: 'pointer', fontSize: 18, color: t.muted }}>
          ✕
        </span>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: '8px 0 4px' }}>Certificate of Completion</h2>
        <p style={{ fontSize: 13, color: t.muted, marginBottom: 20 }}>Traffic Driving Academy</p>
        <div style={{ fontSize: 22, fontWeight: 700, color: t.accent, margin: '16px 0 4px' }}>{userName}</div>
        <p style={{ fontSize: 14, color: t.text, margin: '4px 0' }}>has successfully completed</p>
        <div style={{ fontSize: 18, fontWeight: 600, color: t.text, margin: '4px 0 16px' }}>{lessonName}</div>
        <div style={{ fontSize: 12, color: t.muted2 }}>{date || new Date().toLocaleDateString()}</div>
        <button style={{ ...btn, background: t.accent, color: '#fff', marginTop: 24, width: '100%' }}>Download</button>
      </div>
    </div>
  )
}

/* ================================================================
   13.  PASSWORD NAME PROMPT (legacy fallback)
   ================================================================ */

export function NamePrompt({ onSubmit }: { onSubmit?: (name: string) => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200000,
      }}
    >
      <div style={{ ...card, maxWidth: 400, textAlign: 'center', padding: 30 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text }}>Welcome to Traffic Academy</h2>
        <p style={{ color: t.muted, fontSize: 14, marginBottom: 16 }}>Enter your name to begin training.</p>
        <input
          placeholder="Your Name"
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 16,
            background: t.bg,
            color: t.text,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        <button style={{ ...btn, background: t.accent, color: '#fff', width: '100%' }}>Start Journey</button>
      </div>
    </div>
  )
}

/* ================================================================
   14.  THEME TOGGLE (dark/light)
   ================================================================ */

export function ThemeToggle({ isDark = false, onToggle }: { isDark?: boolean; onToggle?: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        position: 'fixed',
        top: 60,
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        background: isDark ? '#333' : t.card,
        border: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 18,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {isDark ? '🌙' : '☀️'}
    </div>
  )
}

/* ================================================================
   15.  ADMIN DEV UNLOCK BADGE (bottom-right, invisible)
   ================================================================ */

export function DevUnlockBadge({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 5,
        right: 10,
        fontSize: '0.7rem',
        color: t.muted2,
        opacity: 0.3,
        cursor: 'pointer',
        zIndex: 9999,
      }}
      title="Dev options"
    >
      v2.4.1
    </div>
  )
}

/* ================================================================
   16.  2D SCENARIO CANVAS (Phaser placeholder)
   ================================================================ */

export function ScenarioCanvas({
  width = 600,
  height = 400,
}: {
  width?: number
  height?: number
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        background: '#1a2332',
        border: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: t.muted2,
        fontSize: 14,
        margin: '0 auto',
      }}
    >
      2D Scenario Canvas
    </div>
  )
}

/* ================================================================
   17.  MOBILE CONTROLS (steering + throttle)
   ================================================================ */

export function MobileControls() {
  const ctrlBtn: React.CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: 28,
    background: t.glass,
    border: `1px solid ${t.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    cursor: 'pointer',
    userSelect: 'none',
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 20px',
        pointerEvents: 'none',
        zIndex: 80,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'auto' }}>
        <div style={ctrlBtn}>◀</div>
        <div style={ctrlBtn}>▶</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'auto' }}>
        <div style={{ ...ctrlBtn, background: t.green, color: '#fff' }}>▲</div>
        <div style={{ ...ctrlBtn, background: t.red, color: '#fff' }}>▼</div>
      </div>
    </div>
  )
}

/* ================================================================
   18.  TRAFFIC LAW CALLOUT
   ================================================================ */

export function TrafficLawCallout({ law }: { law: string }) {
  return (
    <div
      style={{
        ...card,
        background: '#fff8e1',
        borderLeft: `4px solid #f39c12`,
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: '#f39c12', textTransform: 'uppercase' as const, marginBottom: 4 }}>
        Traffic Law
      </div>
      <p style={{ fontSize: 14, color: t.text, lineHeight: 1.5, margin: 0 }}>{law}</p>
    </div>
  )
}

/* ================================================================
   19.  PROGRESS HEADER (horizontal stepper)
   ================================================================ */

export function ProgressHeader({
  currentStep,
  totalSteps,
  labels,
}: {
  currentStep: number
  totalSteps: number
  labels?: string[]
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', background: t.glass2, borderBottom: `1px solid ${t.border}` }}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: i < currentStep ? t.accent : i === currentStep ? '#f39c12' : t.border,
              color: i <= currentStep ? '#fff' : t.muted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {i < currentStep ? '✓' : i + 1}
          </div>
          {labels?.[i] && (
            <span style={{ fontSize: 12, color: i <= currentStep ? t.text : t.muted2, marginRight: 8 }}>
              {labels[i]}
            </span>
          )}
          {i < totalSteps - 1 && (
            <div style={{ flex: 1, height: 2, background: i < currentStep ? t.accent : t.border, borderRadius: 1 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

/* ================================================================
   20.  TOAST NOTIFICATION
   ================================================================ */

export function Toast({
  message,
  color = t.green,
  visible = true,
}: {
  message: string
  color?: string
  visible?: boolean
}) {
  if (!visible) return null
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: color,
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 300000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {message}
    </div>
  )
}

/* ================================================================
   21.  CONFETTI BURST (canvas overlay placeholder)
   ================================================================ */

export function ConfettiOverlay({ active = false }: { active?: boolean }) {
  if (!active) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 400000,
        background: 'transparent',
      }}
    >
      <canvas style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

/* ================================================================
   22.  KEYBOARD OVERLAY DETECTOR (non-visual)
   ================================================================ */
// This is purely a logic component; renders nothing.
export function KeyboardDetector() {
  return null
}

/* ================================================================
   23.  COMPLETE ALL EXPORTS REGISTRY
   ================================================================ */

export const AcademyComponents = {
  OnboardingOverlay,
  LoadingScreen,
  HeroScreen,
  AppShell,
  LevelMap,
  LevelMapNode,
  LevelCard,
  BriefingModal,
  TheoryPanel,
  TaskChecklist,
  ScoreCard,
  CertificateViewer,
  NamePrompt,
  ThemeToggle,
  DevUnlockBadge,
  ScenarioCanvas,
  MobileControls,
  TrafficLawCallout,
  ProgressHeader,
  Toast,
  ConfettiOverlay,
  KeyboardDetector,
}
