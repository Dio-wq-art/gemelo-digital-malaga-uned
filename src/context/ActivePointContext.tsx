import React, { createContext, useContext } from 'react';
import { ResolvedLocationMetadata } from '../lib/locationSync';
import { LocalAssimilatedState } from '../lib/spatialAssimilation';
import { MeteoData, PhysicsResult } from '../lib/physics';
import { MalagaStreetTreeRecord, StreetLiveAbsorptionMetrics } from '../lib/malagaTreesInventory';

export interface ActivePointContextValue {
  location: { lat: number; lon: number };
  activePoint: ResolvedLocationMetadata;
  assimilation: LocalAssimilatedState;
  data: MeteoData;
  result: PhysicsResult | null;
  nearestTreeStreet?: MalagaStreetTreeRecord | null;
  activeTreeLiveMetrics?: StreetLiveAbsorptionMetrics | null;
  syncActivePoint: (
    lat: number,
    lon: number,
    options?: {
      name?: string;
      zoom?: number;
      pitch?: number;
      fly?: boolean;
      openInspector?: boolean;
      openStreetView?: boolean;
      silentReset?: boolean;
      clickedFeatures?: any;
    }
  ) => void;
}

export const ActivePointContext = createContext<ActivePointContextValue | null>(null);

export const useActivePoint = (): ActivePointContextValue | null => {
  return useContext(ActivePointContext);
};

/**
 * Hook selector optimizado para evitar re-renders globales innecesarios.
 * Permite extraer únicamente la porción requerida del contexto del punto activo.
 */
export function useActivePointSelector<T>(selector: (val: ActivePointContextValue) => T): T | null {
  const ctx = useContext(ActivePointContext);
  if (!ctx) return null;
  return selector(ctx);
}
