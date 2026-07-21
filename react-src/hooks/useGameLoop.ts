/**
 * useGameLoop — requestAnimationFrame hook that drives the 60fps update cycle.
 */

import { useRef, useEffect, useCallback } from 'react';

export function useGameLoop(callback: (dt: number) => void, isRunning: boolean): void {
  const callbackRef = useRef(callback);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  callbackRef.current = callback;

  const loop = useCallback((time: number) => {
    const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.05) : 1 / 60;
    lastTimeRef.current = time;
    callbackRef.current(dt);
    frameRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = 0;
      frameRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isRunning, loop]);
}
