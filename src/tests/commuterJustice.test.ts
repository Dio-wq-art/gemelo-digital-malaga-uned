import { describe, it, expect } from 'vitest';
import { computeEnvironmentalJusticeAnalysis, MALAGA_RAW_DISTRICTS } from '../lib/environmentalJustice';

describe('Paradoja del Tráfico Pendular y Justicia Ambiental en Málaga', () => {
  it('contiene los 11 distritos oficiales con parámetros y arterias de movilidad válidas', () => {
    expect(MALAGA_RAW_DISTRICTS.length).toBe(11);
    MALAGA_RAW_DISTRICTS.forEach(d => {
      expect(d.dailyEndoVeh).toBeGreaterThan(0);
      expect(d.dailyExoVeh).toBeGreaterThan(0);
      expect(d.arteries.length).toBeGreaterThan(5);
      expect(d.mitigation.length).toBeGreaterThan(5);
    });
  });

  it('calcula deterministamente la asimetría de flujos pendulares y el NO2 importado', () => {
    const analysis = computeEnvironmentalJusticeAnalysis({
      activePointNO2: 36.0,
      activePointPM25: 14.0
    });

    expect(analysis.commuterProfiles.length).toBe(11);

    // Carretera de Cádiz (Distrito 7) y Cruz de Humilladero (Distrito 6) deben identificarse como corredores de sacrificio
    const ctroCadiz = analysis.commuterProfiles.find(p => p.districtId === 7);
    const cruzHumilladero = analysis.commuterProfiles.find(p => p.districtId === 6);
    const este = analysis.commuterProfiles.find(p => p.districtId === 2);

    expect(ctroCadiz).toBeDefined();
    expect(cruzHumilladero).toBeDefined();
    expect(este).toBeDefined();

    // Carretera de Cádiz debe tener >75% de tráfico de paso exógeno
    expect(ctroCadiz!.exogenousTrafficPct).toBeGreaterThan(75);
    expect(ctroCadiz!.burdenVerdict).toBe('CORREDOR_SACRIFICIO_METROPOLITANO');

    // Cruz de Humilladero debe tener alto índice de injusticia
    expect(cruzHumilladero!.commuterInjusticeIndex).toBeGreaterThan(3.5);

    // Distrito Este debe clasificarse como zona protegida emisora
    expect(este!.burdenVerdict).toBe('ZONA_PROTEGIDA_EMISORA');
    expect(este!.exogenousTrafficPct).toBeLessThan(30);

    // Conservación de balance de masa: totalNO2UgM3 = endogenousNO2UgM3 + importedExogenousNO2UgM3 (con redondeo)
    analysis.commuterProfiles.forEach(p => {
      const sum = Number((p.endogenousNO2UgM3 + p.importedExogenousNO2UgM3).toFixed(1));
      expect(Math.abs(sum - p.totalNO2UgM3)).toBeLessThanOrEqual(0.2);
    });
  });
});
