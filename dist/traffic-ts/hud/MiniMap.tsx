import React from 'react';
import { TrafficRadarDot } from '../types';

interface MiniMapProps {
  playerX: number;
  playerZ: number;
  playerHeading: number;
  dots: TrafficRadarDot[];
}

export const MiniMap: React.FC<MiniMapProps> = ({
  playerX,
  playerZ,
  playerHeading,
  dots
}) => {
  const radarRadiusMeters = 90;
  const mapSizePx = 130;
  const centerPx = mapSizePx / 2;
  const scale = (mapSizePx / 2) / radarRadiusMeters;

  return (
    <div style={{
      width: mapSizePx,
      height: mapSizePx,
      background: 'rgba(11, 15, 26, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '50%',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      userSelect: 'none'
    }}>
      {/* Radar Sweep Rings */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '25%',
        width: '50%',
        height: '50%',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        width: 1,
        height: '100%',
        background: 'rgba(255, 255, 255, 0.06)'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        width: '100%',
        height: 1,
        background: 'rgba(255, 255, 255, 0.06)'
      }} />

      {/* North Marker */}
      <div style={{
        position: 'absolute',
        top: 4,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 9,
        fontWeight: 800,
        color: '#ef4444'
      }}>
        N
      </div>

      {/* Nearby Traffic Blips */}
      {dots.map((dot, i) => {
        const dx = dot.x - playerX;
        const dz = dot.z - playerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > radarRadiusMeters) return null;

        const screenX = centerPx + dx * scale;
        const screenY = centerPx - dz * scale;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#f2b84b',
              boxShadow: '0 0 6px #f2b84b',
              transform: 'translate(-50%, -50%)'
            }}
          />
        );
      })}

      {/* Center Player Arrow */}
      <div
        style={{
          position: 'absolute',
          top: centerPx,
          left: centerPx,
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderBottom: '12px solid #38bdf8',
          transformOrigin: '50% 50%',
          transform: `translate(-50%, -50%) rotate(${playerHeading * (180 / Math.PI)}deg)`,
          filter: 'drop-shadow(0 0 4px #38bdf8)'
        }}
      />
    </div>
  );
};
