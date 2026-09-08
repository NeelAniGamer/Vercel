import React from 'react';
import { QualityPresetName, CameraMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  quality: QualityPresetName;
  cameraMode: CameraMode;
  renderDistance: number;
  onClose: () => void;
  onQualityChange: (quality: QualityPresetName) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  onRenderDistanceChange: (dist: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  quality,
  cameraMode,
  renderDistance,
  onClose,
  onQualityChange,
  onCameraModeChange,
  onRenderDistanceChange
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(7, 10, 20, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      userSelect: 'none',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        padding: '28px 36px',
        width: 460,
        maxWidth: '90%',
        color: '#ffffff',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚙️</span>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>SIMULATOR SETTINGS</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 20,
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        {/* Quality Preset Selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Graphics Quality Preset
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
            {(['LOW', 'MED', 'HIGH', 'ULTRA'] as const).map(q => (
              <button
                key={q}
                onClick={() => onQualityChange(q)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: quality === q ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: quality === q ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: quality === q ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s ease'
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Camera View Selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Camera Perspective
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
            {[
              { id: 'chase_close', label: '🏎️ 3rd Person Close' },
              { id: 'chase_far', label: '🚁 Aerial Tactical' },
              { id: 'hood', label: '👀 Hood Cam' },
              { id: 'bumper', label: '🏎️ Bumper Low' }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => onCameraModeChange(c.id as CameraMode)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: cameraMode === c.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: cameraMode === c.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: cameraMode === c.id ? '#ffffff' : '#94a3b8',
                  textAlign: 'left'
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Render Distance Slider */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Render Horizon Distance
            </label>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>{renderDistance}m</span>
          </div>
          <input
            type="range"
            min="150"
            max="800"
            step="50"
            value={renderDistance}
            onChange={(e) => onRenderDistanceChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
          />
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
            border: 'none',
            color: '#ffffff',
            padding: '12px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Save & Resume Driving
        </button>
      </div>
    </div>
  );
};
