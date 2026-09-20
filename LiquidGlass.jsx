import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Synthesizes a subtle, realistic glass crystal chime using Web Audio API
 */
export function playGlassTone(frequency = 920, duration = 0.28) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.8, ctx.currentTime + duration * 0.4);

    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    // AudioContext blocked or not supported
  }
}

/**
 * Triggers gentle tactile vibration haptics on supported mobile/trackpad devices
 */
export function triggerGlassHaptic(pattern = [8, 12, 6]) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (err) {}
}

/**
 * Embedded SVG Optical Refraction Filters
 */
export function SvgLiquidFilters() {
  return (
    <svg
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="apple-liquid-lens" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.015" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="0.4" result="smoothDisplaced" />
          <feComposite in="smoothDisplaced" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="apple-pill-refract" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="1" result="tur" />
          <feDisplacementMap in="SourceGraphic" in2="tur" scale="9" xChannelSelector="B" yChannelSelector="R" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TIER 1: StandardGlass
 * Lightweight, high-performance frosted glass for regular users and low-end hardware.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function StandardGlass({
  children,
  className = '',
  style = {},
  onClick,
  ...props
}) {
  return (
    <div
      className={`standard-glass ${className}`}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TIER 2: AppleLiquidGlass
 * Apple visionOS-grade refractive liquid glass with spring kinematics,
 * dynamic specular light tracking, and tactile audio/haptics.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function AppleLiquidGlass({
  children,
  className = '',
  style = {},
  refraction = true,
  chromatic = true,
  lightTracking = true,
  draggable = true,
  elasticity = 0.85, // 0.1 to 1.5 multiplier
  sound = true,
  haptics = true,
  sheenSweep = false,
  onBounce,
  ...props
}) {
  const cardRef = useRef(null);
  const [isPressing, setIsPressing] = useState(false);
  const [transformState, setTransformState] = useState({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotateX: 0,
    rotateY: 0,
  });

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    active: false,
    vx: 0,
    vy: 0,
  });

  // Track cursor / pointer to update dynamic specular glint coordinates
  const handlePointerMove = useCallback((e) => {
    if (!lightTracking || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pctX = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    const pctY = Math.max(0, Math.min(100, Math.round((y / rect.height) * 100)));

    cardRef.current.style.setProperty('--light-x', `${pctX}%`);
    cardRef.current.style.setProperty('--light-y', `${pctY}%`);

    // Dynamic 3D tilt
    if (!dragRef.current.active) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotX = ((y - centerY) / centerY) * -5;
      const rotY = ((x - centerX) / centerX) * 5;
      setTransformState((prev) => ({
        ...prev,
        rotateX: rotX,
        rotateY: rotY,
      }));
    } else {
      // Drag physics: liquid squish and rubber-band displacement
      const dx = (e.clientX - dragRef.current.startX) * elasticity;
      const dy = (e.clientY - dragRef.current.startY) * elasticity;
      dragRef.current.vx = dx - dragRef.current.currentX;
      dragRef.current.vy = dy - dragRef.current.currentY;
      dragRef.current.currentX = dx;
      dragRef.current.currentY = dy;

      // Squish along movement direction
      const stretch = Math.min(0.08, (Math.abs(dx) + Math.abs(dy)) * 0.0006);

      setTransformState({
        x: dx,
        y: dy,
        scaleX: 1 + stretch,
        scaleY: 1 - stretch,
        rotateX: dy * -0.05,
        rotateY: dx * 0.05,
      });
    }
  }, [lightTracking, elasticity]);

  const handlePointerDown = (e) => {
    if (!draggable) return;
    setIsPressing(true);
    dragRef.current.active = true;
    dragRef.current.startX = e.clientX - dragRef.current.currentX;
    dragRef.current.startY = e.clientY - dragRef.current.currentY;

    if (sound) playGlassTone(1120, 0.15);
    if (haptics) triggerGlassHaptic(8);

    // Initial press squish
    setTransformState((prev) => ({
      ...prev,
      scaleX: 0.96,
      scaleY: 0.96,
    }));
  };

  const handlePointerUp = () => {
    if (!dragRef.current.active) return;
    setIsPressing(false);
    dragRef.current.active = false;

    // Apple Spring Snapback: rebound with slight overshooting bounce
    setTransformState({
      x: 0,
      y: 0,
      scaleX: 1.04,
      scaleY: 0.97,
      rotateX: 0,
      rotateY: 0,
    });

    if (sound) playGlassTone(740, 0.32);
    if (haptics) triggerGlassHaptic([10, 15, 8]);
    if (onBounce) onBounce();

    // Settle back to rest state after spring oscillation
    setTimeout(() => {
      setTransformState({
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotateX: 0,
        rotateY: 0,
      });
      dragRef.current.currentX = 0;
      dragRef.current.currentY = 0;
    }, 450);
  };

  const handlePointerLeave = () => {
    if (!dragRef.current.active) {
      setTransformState({
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotateX: 0,
        rotateY: 0,
      });
    } else {
      handlePointerUp();
    }
  };

  const transformStyle = `perspective(1000px) translate3d(${transformState.x}px, ${transformState.y}px, 0px) scale(${transformState.scaleX}, ${transformState.scaleY}) rotateX(${transformState.rotateX}deg) rotateY(${transformState.rotateY}deg)`;

  return (
    <div
      ref={cardRef}
      className={`apple-liquid-glass ${refraction ? 'refract-optical' : ''} ${chromatic ? 'has-chromatic' : ''} ${isPressing ? 'is-pressing' : ''} ${className}`}
      style={{
        transform: transformStyle,
        ...style,
      }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {sheenSweep && <div className="apple-sheen-sweep" aria-hidden="true" />}
      <div style={{ position: 'relative', zIndex: 3 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Apple VisionOS Floating Liquid Glass Dock
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function LiquidGlassDock({ items = [], activeIndex = 0, onSelect }) {
  return (
    <nav className="apple-glass-dock" aria-label="Liquid Glass Dock">
      {items.map((item, idx) => {
        const isActive = idx === activeIndex;
        return (
          <button
            key={idx}
            type="button"
            className="apple-dock-item"
            style={{
              borderColor: isActive ? 'rgba(242, 184, 75, 0.6)' : undefined,
              boxShadow: isActive ? '0 0 16px rgba(242, 184, 75, 0.35)' : undefined,
            }}
            onClick={() => {
              playGlassTone(880 + idx * 80, 0.2);
              triggerGlassHaptic(8);
              if (onSelect) onSelect(idx, item);
            }}
            aria-label={item.label || `Dock Item ${idx + 1}`}
            title={item.label}
          >
            {item.icon}
          </button>
        );
      })}
    </nav>
  );
}
