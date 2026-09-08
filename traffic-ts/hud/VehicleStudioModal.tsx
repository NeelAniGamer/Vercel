import React from 'react';
import { VehicleCustomization } from '../types';

interface VehicleStudioModalProps {
  isOpen: boolean;
  custom: VehicleCustomization;
  onClose: () => void;
  onChange: (custom: VehicleCustomization) => void;
}

const PAINT_PALETTE = [
  { name: 'Apex Blue', hex: 0x2563eb, bg: '#2563eb' },
  { name: 'Radiant Red', hex: 0xdc2626, bg: '#dc2626' },
  { name: 'Cyber Cyan', hex: 0x06b6d4, bg: '#06b6d4' },
  { name: 'Emerald Pearl', hex: 0x15803d, bg: '#15803d' },
  { name: 'Sunburst Gold', hex: 0xd97706, bg: '#d97706' },
  { name: 'Onyx Black', hex: 0x1e293b, bg: '#1e293b' }
];

const RIM_PALETTE = [
  { name: 'Chrome Silver', hex: 0xe2e8f0, bg: '#e2e8f0' },
  { name: 'Matte Bronze', hex: 0xb45309, bg: '#b45309' },
  { name: 'Racing Gold', hex: 0xfacc15, bg: '#facc15' },
  { name: 'Gunmetal Grey', hex: 0x475569, bg: '#475569' }
];

export const VehicleStudioModal: React.FC<VehicleStudioModalProps> = ({
  isOpen,
  custom,
  onClose,
  onChange
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
            <span style={{ fontSize: 22 }}>🎨</span>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>VEHICLE CUSTOMIZER</span>
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

        {/* Body Paint Palette */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Body Paint Finish
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            {PAINT_PALETTE.map(p => (
              <div
                key={p.name}
                title={p.name}
                onClick={() => onChange({ ...custom, bodyColor: p.hex })}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: p.bg,
                  cursor: 'pointer',
                  border: custom.bodyColor === p.hex ? '3px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                  transform: custom.bodyColor === p.hex ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Rim Palette */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Alloy Wheel Finish
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            {RIM_PALETTE.map(r => (
              <div
                key={r.name}
                title={r.name}
                onClick={() => onChange({ ...custom, rimColor: r.hex })}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: r.bg,
                  cursor: 'pointer',
                  border: custom.rimColor === r.hex ? '3px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                  transform: custom.rimColor === r.hex ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Aero Parts Toggles */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Carbon Aerodynamics
          </label>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <label style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600
            }}>
              <span>Front Splitter</span>
              <input
                type="checkbox"
                checked={custom.hasSplitter}
                onChange={(e) => onChange({ ...custom, hasSplitter: e.target.checked })}
                style={{ accentColor: '#38bdf8', width: 16, height: 16 }}
              />
            </label>

            <label style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600
            }}>
              <span>Ducktail Wing</span>
              <input
                type="checkbox"
                checked={custom.hasWing}
                onChange={(e) => onChange({ ...custom, hasWing: e.target.checked })}
                style={{ accentColor: '#38bdf8', width: 16, height: 16 }}
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
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
          Apply Customization
        </button>
      </div>
    </div>
  );
};
