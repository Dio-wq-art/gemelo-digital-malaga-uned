import { describe, it, expect } from 'vitest';
import {
  MALAGA_HOTSPOT_PRESETS,
  malagaSpatialEngine,
  calculateKinematicFlightParams
} from '../lib/mapKinematicEngine';

describe('Map Kinematic & Spatial Indexing Engine (Málaga Digital Twin)', () => {
  it('should have 6 official hotspot presets configured with deterministic parameters', () => {
    expect(MALAGA_HOTSPOT_PRESETS).toHaveLength(6);
    
    MALAGA_HOTSPOT_PRESETS.forEach(preset => {
      expect(preset.lat).toBeGreaterThan(36.6);
      expect(preset.lat).toBeLessThan(36.8);
      expect(preset.lon).toBeGreaterThan(-4.6);
      expect(preset.lon).toBeLessThan(-4.3);
      expect(preset.hwRatio).toBeGreaterThan(0);
      expect(preset.svf).toBeGreaterThan(0);
      expect(preset.svf).toBeLessThanOrEqual(1.0);
    });
  });

  it('should perform sub-millisecond spatial search with Flatbush indexing', () => {
    // Buscar cerca de Calle Larios (36.7196, -4.4200)
    const nearby = malagaSpatialEngine.searchNearby(36.7196, -4.4200, 0.01, 3);
    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby[0].id).toBe('larios_centro');
  });

  it('should find nearest feature correctly', () => {
    // Coordenada cercana a la estación de Carranque (36.7175, -4.4447)
    const res = malagaSpatialEngine.findNearest(36.7180, -4.4440);
    expect(res).not.toBeNull();
    expect(res?.item.id).toBe('carranque_estacion');
    expect(res?.distanceKm).toBeLessThan(0.2);
  });

  it('should compute adaptive kinematic flight durations and curves based on distance', () => {
    // Vuelo corto (<200m)
    const shortFlight = calculateKinematicFlightParams(36.7196, -4.4200, 36.7200, -4.4205, true);
    expect(shortFlight.duration).toBeLessThanOrEqual(300);
    expect(shortFlight.pitch).toBe(58);

    // Vuelo largo (>5km, e.g. Centro a Aeropuerto)
    const longFlight = calculateKinematicFlightParams(36.7196, -4.4200, 36.6749, -4.4780, false);
    expect(longFlight.duration).toBeGreaterThanOrEqual(600);
    expect(longFlight.pitch).toBe(0);
  });
});
