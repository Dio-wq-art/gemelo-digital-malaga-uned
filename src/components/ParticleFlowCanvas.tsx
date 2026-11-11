import React, { useEffect, useRef, useState } from 'react';
import { hardwareMonitor } from '../lib/computationEngine';

interface ParticleFlowCanvasProps {
  windSpeedKmh: number;
  windDirDeg: number;
  active: boolean;
  opacity?: number;
}

export const ParticleFlowCanvas = React.memo(function ParticleFlowCanvas({
  windSpeedKmh,
  windDirDeg,
  active,
  opacity = 0.85
}: ParticleFlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [offscreenSupported] = useState(() => typeof HTMLCanvasElement !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype);

  useEffect(() => {
    if (!offscreenSupported) return;

    const container = containerRef.current;
    if (!container) return;

    // Create a fresh canvas element each time the effect runs
    // This avoids InvalidStateError in React StrictMode when re-transferring control
    const canvas = document.createElement('canvas');
    canvas.className = "absolute inset-0 pointer-events-none z-10";
    canvas.style.opacity = opacity.toString();
    canvas.style.willChange = 'transform';
    canvas.style.transform = 'translateZ(0)';
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 600;
    
    container.appendChild(canvas);

    workerRef.current = new Worker(new URL('../workers/particleWorker.ts', import.meta.url), { type: 'module' });

    const offscreen = canvas.transferControlToOffscreen();
    
    workerRef.current.postMessage({
      type: 'init',
      payload: { canvas: offscreen }
    }, [offscreen]);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        workerRef.current?.postMessage({
          type: 'resize',
          payload: {
            width: entry.contentRect.width,
            height: entry.contentRect.height
          }
        });
      }
    });

    resizeObserver.observe(container);

    // Dynamic LOD & Page Visibility handler to pause canvas worker when tab is in background
    const handleVisibilityChange = () => {
      if (document.hidden) {
        workerRef.current?.postMessage({ type: 'stop' });
      } else if (active) {
        workerRef.current?.postMessage({ type: 'start' });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
      workerRef.current?.postMessage({ type: 'stop' });
      workerRef.current?.terminate();
      workerRef.current = null;
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, [offscreenSupported, opacity, active]);

  useEffect(() => {
    if (!workerRef.current) return;
    
    workerRef.current.postMessage({
      type: 'update',
      payload: {
        windSpeedKmh,
        windDirDeg,
        throttle: hardwareMonitor.shouldThrottleParticleCount()
      }
    });

    if (active) {
      workerRef.current.postMessage({ type: 'start' });
    } else {
      workerRef.current.postMessage({ type: 'stop' });
    }
  }, [windSpeedKmh, windDirDeg, active]);

  if (!offscreenSupported) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-10" />
  );
});

