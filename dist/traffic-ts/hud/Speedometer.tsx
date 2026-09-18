import React from 'react';

interface SpeedometerProps {
  speedKmh: number;
  gear: 'P' | 'R' | 'N' | 'D';
  gearNumber: number;
  rpm: number;
  maxRpm: number;
  nitroRemaining: number;
  lateralG: number;
}

export const Speedometer: React.FC<SpeedometerProps> = ({
  speedKmh,
  gear,
  gearNumber,
  rpm,
  maxRpm,
  nitroRemaining,
  lateralG
}) => {
  // Angle calculation for needle (-120 deg to +120 deg)
  const maxSpeed = 220;
  const speedRatio = Math.min(1.0, speedKmh / maxSpeed);
  const needleAngle = -120 + speedRatio * 240;

  // RPM progress stroke
  const rpmRatio = Math.min(1.0, Math.max(0, (rpm - 1000) / (maxRpm - 1000)));
  const rpmDashOffset = 251.2 * (1 - rpmRatio * 0.75);

  return (
    <div style={{
      position: 'relative',
      width: 170,
      height: 170,
      background: 'rgba(11, 15, 26, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '50%',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), inset 0 0 24px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* SVG Dial Arc & RPM Ring */}
      <svg width="170" height="170" viewBox="0 0 170 170" style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Background Track */}
        <circle
          cx="85"
          cy="85"
          r="68"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
          strokeDasharray="320"
          strokeDashoffset="80"
          strokeLinecap="round"
          transform="rotate(135 85 85)"
        />
        {/* Dynamic RPM Arc */}
        <circle
          cx="85"
          cy="85"
          r="68"
          fill="none"
          stroke={rpmRatio > 0.85 ? '#ef4444' : rpmRatio > 0.65 ? '#f2b84b' : '#38bdf8'}
          strokeWidth="6"
          strokeDasharray="320"
          strokeDashoffset={320 * (1 - rpmRatio * 0.75)}
          strokeLinecap="round"
          transform="rotate(135 85 85)"
          style={{ transition: 'stroke 0.15s ease' }}
        />
      </svg>

      {/* Rotating Speed Needle */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 3,
          height: 60,
          background: 'linear-gradient(to top, transparent, #38bdf8)',
          transformOrigin: 'bottom center',
          transform: `translate(-50%, -100%) rotate(${needleAngle}deg)`,
          boxShadow: '0 0 8px #38bdf8',
          borderRadius: 2,
          transition: 'transform 0.05s linear'
        }}
      />

      {/* Center Pivot */}
      <div style={{
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: '#38bdf8',
        boxShadow: '0 0 10px #38bdf8'
      }} />

      {/* Digital Readout */}
      <div style={{ marginTop: 28, textAlign: 'center', zIndex: 2 }}>
        <div style={{
          fontSize: 34,
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1,
          letterSpacing: -1,
          fontFamily: "'Space Mono', monospace"
        }}>
          {speedKmh}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1 }}>
          KM/H
        </div>
      </div>

      {/* Gear & RPM info below center */}
      <div style={{
        marginTop: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        zIndex: 2
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 800,
          color: gear === 'R' ? '#ef4444' : '#38bdf8',
          background: 'rgba(255,255,255,0.1)',
          padding: '1px 6px',
          borderRadius: 4
        }}>
          {gear === 'D' ? `D${gearNumber}` : gear}
        </span>
        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
          {Math.round(rpm)} RPM
        </span>
      </div>

      {/* Nitro Bar */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        width: 70,
        height: 4,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${nitroRemaining}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
          borderRadius: 2,
          transition: 'width 0.1s linear'
        }} />
      </div>
    </div>
  );
};
