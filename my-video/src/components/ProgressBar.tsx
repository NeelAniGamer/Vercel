import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #F2B84B 0%, #00D2FF 50%, #8B5CF6 100%)',
          boxShadow: '0 0 12px rgba(0, 210, 255, 0.8)',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
};
