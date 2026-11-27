import React, { useState } from 'react';
import { HUDState, QualityPresetName, CameraMode, VehicleCustomization } from '../types';
import { Speedometer } from './Speedometer';
import { MiniMap } from './MiniMap';
import { ChallanAlert } from './ChallanAlert';
import { SettingsModal } from './SettingsModal';
import { VehicleStudioModal } from './VehicleStudioModal';

interface GameHUDProps {
  state: HUDState;
  quality: QualityPresetName;
  renderDistance: number;
  custom: VehicleCustomization;
  onToggleFullscreen?: () => void;
  onQualityChange: (quality: QualityPresetName) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  onCycleCamera: () => void;
  onRenderDistanceChange: (dist: number) => void;
  onCustomizationChange: (custom: VehicleCustomization) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  state,
  quality,
  renderDistance,
  custom,
  onToggleFullscreen,
  onQualityChange,
  onCameraModeChange,
  onCycleCamera,
  onRenderDistanceChange,
  onCustomizationChange
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const isOverspeeding = state.speedKmh > state.speedLimit;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      userSelect: 'none',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Left: Speed Limit Sign & Score */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        {/* Circular Indian Speed Limit Sign */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#ffffff',
          border: `5px solid ${isOverspeeding ? '#ef4444' : '#dc2626'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isOverspeeding ? '0 0 16px rgba(239, 68, 68, 0.8)' : '0 6px 18px rgba(0,0,0,0.4)',
          transform: isOverspeeding ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.15s ease, border-color 0.15s ease'
        }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
            {state.speedLimit}
          </span>
          <span style={{ fontSize: 7, fontWeight: 800, color: '#64748b' }}>LIMIT</span>
        </div>

        {/* Safety Score Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 12,
          padding: '8px 16px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>
            SAFETY SCORE
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: state.score >= 80 ? '#34d399' : '#f2b84b' }}>
            {state.score} / 100
          </span>
        </div>
      </div>

      {/* Top Right: Quick Action Toolbar */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'auto'
      }}>
        <button
          onClick={onCycleCamera}
          title="Switch Camera Perspective (C)"
          style={{
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            padding: '8px 12px',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
          </svg>
          {state.cameraMode === 'chase_close' ? '3rd Person' : state.cameraMode === 'chase_far' ? 'Tactical' : state.cameraMode === 'hood' ? 'Hood' : 'Bumper'}
        </button>

        <button
          onClick={() => setIsCustomOpen(true)}
          title="Vehicle Customizer"
          style={{
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            padding: '8px 12px',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
          Custom
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          title="Settings (Esc)"
          aria-label="Settings"
          style={{
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            padding: '8px 12px',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <button
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen (F11)"
          style={{
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            padding: '8px 14px',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          Fullscreen
        </button>
      </div>

      {/* Top Center: Challan Violation Alert */}
      <ChallanAlert violation={state.recentViolation} />

      {/* Bottom Left: Interactive MiniMap Radar */}
      <div style={{ position: 'absolute', bottom: 24, left: 24 }}>
        <MiniMap
          playerX={state.playerX}
          playerZ={state.playerZ}
          playerHeading={state.playerHeading}
          dots={state.radarDots}
        />
      </div>

      {/* Bottom Right: Digital & Analog Speedometer */}
      <div style={{ position: 'absolute', bottom: 24, right: 24 }}>
        <Speedometer
          speedKmh={state.speedKmh}
          gear={state.gear}
          gearNumber={state.gearNumber}
          rpm={state.rpm}
          maxRpm={state.maxRpm}
          nitroRemaining={state.nitroRemaining}
          lateralG={state.lateralG}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        quality={quality}
        cameraMode={state.cameraMode}
        renderDistance={renderDistance}
        onClose={() => setIsSettingsOpen(false)}
        onQualityChange={onQualityChange}
        onCameraModeChange={onCameraModeChange}
        onRenderDistanceChange={onRenderDistanceChange}
      />

      {/* Vehicle Customizer Studio Modal */}
      <VehicleStudioModal
        isOpen={isCustomOpen}
        custom={custom}
        onClose={() => setIsCustomOpen(false)}
        onChange={onCustomizationChange}
      />
    </div>
  );
};
