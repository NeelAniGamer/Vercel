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
          🎥 {state.cameraMode === 'chase_close' ? '3rd Person' : state.cameraMode === 'chase_far' ? 'Tactical' : state.cameraMode === 'hood' ? 'Hood' : 'Bumper'}
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
            fontWeight: 700
          }}
        >
          🎨 Custom
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          title="Settings (Esc)"
          style={{
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            padding: '8px 12px',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700
          }}
        >
          ⚙️
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
            fontWeight: 700
          }}
        >
          ⛶ Fullscreen
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
