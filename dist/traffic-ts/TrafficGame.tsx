import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TrafficEngine } from './engine/TrafficEngine';
import { GameHUD } from './hud/GameHUD';
import {
  VehicleType,
  GameMode,
  QualityPresetName,
  HUDState,
  CameraMode,
  VehicleCustomization
} from './types';

export interface TrafficGameProps {
  vehicle?: VehicleType;
  mode?: GameMode;
  initialQuality?: QualityPresetName;
  initialRenderDistance?: number;
  initialCustomization?: VehicleCustomization;
  className?: string;
  style?: React.CSSProperties;
  onScoreChange?: (score: number) => void;
  onViolation?: (violation: string) => void;
}

export const TrafficGame: React.FC<TrafficGameProps> = ({
  vehicle = 'sports_gt',
  mode = 'free_roam',
  initialQuality = 'HIGH',
  initialRenderDistance = 500,
  initialCustomization = {
    bodyColor: 0xdc2626,
    rimColor: 0x475569,
    caliperColor: 0xfacc15,
    hasSplitter: true,
    hasWing: true
  },
  className,
  style,
  onScoreChange,
  onViolation
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TrafficEngine | null>(null);

  const [quality, setQuality] = useState<QualityPresetName>(initialQuality);
  const [renderDistance, setRenderDistance] = useState<number>(initialRenderDistance);
  const [customization, setCustomization] = useState<VehicleCustomization>(initialCustomization);

  const [hudState, setHudState] = useState<HUDState>({
    speedKmh: 0,
    gear: 'D',
    gearNumber: 1,
    rpm: 1000,
    maxRpm: 8200,
    lateralG: 0,
    slipAngle: 0,
    speedLimit: 60,
    cameraMode: 'chase_close',
    headlightsOn: false,
    nitroRemaining: 100,
    score: 100,
    hp: 100,
    totalFine: 0,
    radarDots: [],
    playerX: 0,
    playerZ: 0,
    playerHeading: 0
  });

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleQualityChange = useCallback((newQuality: QualityPresetName) => {
    setQuality(newQuality);
    engineRef.current?.setQuality(newQuality);
  }, []);

  const handleRenderDistanceChange = useCallback((dist: number) => {
    setRenderDistance(dist);
    engineRef.current?.setRenderDistance(dist);
  }, []);

  const handleCustomizationChange = useCallback((custom: VehicleCustomization) => {
    setCustomization(custom);
    engineRef.current?.setCustomization(custom);
  }, []);

  const handleCameraModeChange = useCallback((cMode: CameraMode) => {
    engineRef.current?.setCameraMode(cMode);
  }, []);

  const handleCycleCamera = useCallback(() => {
    engineRef.current?.cycleCameraMode();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new TrafficEngine({
      canvas: canvasRef.current,
      vehicle,
      mode,
      quality,
      renderDistance,
      customization,
      onHUDUpdate: (newState) => {
        setHudState(newState);
        if (onScoreChange) onScoreChange(newState.score);
        if (onViolation && newState.recentViolation) {
          onViolation(newState.recentViolation.title);
        }
      }
    });

    engineRef.current = engine;
    engine.start();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        engine.cycleCameraMode();
      }
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
      engineRef.current = null;
    };
  }, [vehicle, mode]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 500,
        overflow: 'hidden',
        background: '#070a14',
        ...style
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          outline: 'none'
        }}
      />
      <GameHUD
        state={hudState}
        quality={quality}
        renderDistance={renderDistance}
        custom={customization}
        onToggleFullscreen={toggleFullscreen}
        onQualityChange={handleQualityChange}
        onCameraModeChange={handleCameraModeChange}
        onCycleCamera={handleCycleCamera}
        onRenderDistanceChange={handleRenderDistanceChange}
        onCustomizationChange={handleCustomizationChange}
      />
    </div>
  );
};

export default TrafficGame;
