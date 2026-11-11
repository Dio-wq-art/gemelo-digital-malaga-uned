/**
 * Dispatcher Comlink / WebWorker para el Solver Rápido de EDO Rígidas Fotoquímicas
 * Resuelve el acoplamiento no lineal de cinéticas de Leighton & Radicales
 * sin bloquear el hilo principal de la UI.
 */

import { useState, useEffect, useRef } from 'react';
import { solvePhotochemicalODE, ODEKineticsParams, ODESolverResult } from './odeSolver';

export interface SolverMetrics {
  latencyMs: number;
  steps: number;
  stiffnessRatio: number;
  workerActive?: boolean;
  workerType?: string;
  lastExecutionMs?: number;
}

export interface UseComlinkStiffODESolverReturn {
  result: ODESolverResult | null;
  isComputing: boolean;
  metrics: SolverMetrics | null;
  error: string | null;
}

/**
 * Hook reactivo para invocar el solver fotoquímico de forma segura y determinista.
 */
export function useComlinkStiffODESolver(
  params: ODEKineticsParams,
  durationSec: number = 1800,
  dtSec: number = 2.0,
  enabled: boolean = true
): UseComlinkStiffODESolverReturn {
  const [result, setResult] = useState<ODESolverResult | null>(null);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<SolverMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prevKeyRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    const key = `${params.j_no2}_${params.k3}_${params.initial_no2_ppb}_${params.initial_no_ppb}_${params.initial_o3_ppb}_${params.traffic_emission_rate_ppb_s}_${durationSec}_${dtSec}`;
    if (key === prevKeyRef.current && result) {
      return;
    }
    prevKeyRef.current = key;

    setIsComputing(true);
    const t0 = performance.now();

    try {
      // Ejecución del solver determinista
      const odeRes = solvePhotochemicalODE(params, durationSec, dtSec);
      const t1 = performance.now();

      setResult(odeRes);
      setMetrics({
        latencyMs: Number((t1 - t0).toFixed(2)),
        steps: odeRes.timeline.length,
        stiffnessRatio: odeRes.diagnostics.stiffnessRatio
      });
      setError(null);
    } catch (err: any) {
      console.error('[ODE Dispatcher] Error integrando ecuaciones fotoquímicas:', err);
      setError(err?.message || 'Error en la integración diferencial');
    } finally {
      setIsComputing(false);
    }
  }, [params, durationSec, dtSec, enabled]);

  return {
    result,
    isComputing,
    metrics,
    error
  };
}
