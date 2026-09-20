import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  StandardGlass,
  AppleLiquidGlass,
  LiquidGlassDock,
  SvgLiquidFilters,
  playGlassTone,
  triggerGlassHaptic
} from './LiquidGlass.jsx';

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);
  const [refraction, setRefraction] = useState(true);
  const [chromatic, setChromatic] = useState(true);
  const [lightTracking, setLightTracking] = useState(true);
  const [sheenSweep, setSheenSweep] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dockActive, setDockActive] = useState(0);

  const dockItems = [
    { label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { label: 'Optics', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10"/></svg> },
    { label: 'Physics', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
    { label: 'Audio', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> },
    { label: 'Settings', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
  ];

  return (
    <div className={theme === 'light' ? 'light-mode' : ''}>
      <header className="lab-header">
        <div className="lab-badge">Optical Physics &amp; Kinematics</div>
        <h1>Liquid Glass UI System</h1>
        <p>
          Recreating VisionOS-Grade Optical Refraction, Dynamic Specular Light Glints, And Tactile Apple Spring Kinematics In React — Alongside A Performant Standard Edition For Regular Users.
        </p>
      </header>

      {/* Interactive Controls Bar */}
      <div className="controls-panel">
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            Dark VisionOS
          </button>
          <button
            type="button"
            className={`toggle-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            Light Mica
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`apple-glass-pill ${refraction ? 'primary' : ''}`}
            onClick={() => setRefraction(!refraction)}
          >
            SVG Refraction: {refraction ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            className={`apple-glass-pill ${chromatic ? 'primary' : ''}`}
            onClick={() => setChromatic(!chromatic)}
          >
            Prismatic Edge: {chromatic ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            className={`apple-glass-pill ${sheenSweep ? 'primary' : ''}`}
            onClick={() => setSheenSweep(!sheenSweep)}
          >
            Specular Sheen: {sheenSweep ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            className={`apple-glass-pill ${soundEnabled ? 'primary' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            Glass Audio: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Dual Edition Showcase */}
      <div className="showcase-grid">
        {/* Standard Edition Card */}
        <StandardGlass id="standardGlassCard">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>Standard Glass Edition</h3>
            <span className="tag-badge tag-standard">Standard Edition</span>
          </div>
          <p style={{ color: 'var(--dim)', fontSize: '0.94rem', lineHeight: 1.6 }}>
            Universal Pure CSS Implementation Optimized For Low-Power Devices, Mobile Browsers, And Clean UI Hierarchies.
          </p>
          <ul className="feature-list">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>18px Frosted Blur With 160% Vibrancy Saturation</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Dual Rim: Specular Highlight Crest &amp; Ambient Drop Shadow</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Zero GPU Frame Drops — 60 FPS On Low-End Mobile &amp; Desktop</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Accessible Contrast Ratios Meeting WCAG 2.2 Standards</span>
            </li>
          </ul>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <a href="/" className="apple-glass-pill primary">Explore Hub</a>
            <a href="/download" className="apple-glass-pill">Get App</a>
          </div>
        </StandardGlass>

        {/* Apple VisionOS Edition Card */}
        <AppleLiquidGlass
          id="appleLiquidGlassCard"
          refraction={refraction}
          chromatic={chromatic}
          lightTracking={lightTracking}
          draggable={true}
          sheenSweep={sheenSweep}
          sound={soundEnabled}
        >
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>Apple VisionOS Edition</h3>
            <span className="tag-badge tag-apple">VisionOS Liquid</span>
          </div>
          <p style={{ color: 'var(--dim)', fontSize: '0.94rem', lineHeight: 1.6 }}>
            Full React Interactive Component Featuring Physical SVG Lens Distortion, Elastic Jelly Drag, And Pointer Light Glints.
          </p>
          <ul className="feature-list">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Physical Lens Distortion (SVG feDisplacementMap Refraction)</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Interactive Spring Physics With Tactile Jelly Rebound</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Dynamic Specular Highlight Follows Cursor &amp; Device Tilt</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Synthesized Web Audio Glass Chimes &amp; Haptic Pulse Feedback</span>
            </li>
          </ul>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="apple-glass-pill primary"
              onClick={() => {
                if (soundEnabled) playGlassTone(1200, 0.25);
                triggerGlassHaptic(15);
              }}
            >
              Trigger Chime
            </button>
            <button
              type="button"
              className="apple-glass-pill"
              onClick={() => {
                if (soundEnabled) playGlassTone(640, 0.35);
                triggerGlassHaptic([10, 20, 10]);
              }}
            >
              Haptic Pulse
            </button>
          </div>
          <div className="hint-drag">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/></svg>
            <span>Click &amp; Drag Anywhere On This Glass To Test Elastic Bounce</span>
          </div>
        </AppleLiquidGlass>
      </div>

      {/* Floating VisionOS Liquid Glass Dock */}
      <div className="dock-showcase-area">
        <h4 style={{ color: 'var(--dim)', margin: '0 0 16px', letterSpacing: '0.08em', textTransform: 'capitalize' }}>
          VisionOS Floating Liquid Dock (Interactive)
        </h4>
        <LiquidGlassDock
          items={dockItems}
          activeIndex={dockActive}
          onSelect={(idx) => setDockActive(idx)}
        />
      </div>

      <SvgLiquidFilters />
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
