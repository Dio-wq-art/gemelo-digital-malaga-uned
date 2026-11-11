import { describe, it, expect } from 'vitest';
import {
  computeIsotopeForensicApportionment,
  computeDistancesToMalagaEmitters,
  computeEquilibriumFractionationAlpha,
  MALAGA_ISOTOPIC_ENDMEMBERS,
  exportIsotopeForensicJson,
  exportIsotopeForensicCsv,
} from '../lib/no2IsotopeForensicEngine';
import {
  computeTerralMeteoDiagnostics,
  calculateTerralCanopyDisruptionSummary,
  calculateWeselyForTreeSpecies,
  generateTerralDisruptionLatex,
  exportTerralDisruptionCsv,
  MALAGA_TREE_SPECIES_WESELY_PROFILES,
} from '../lib/weselyDryDeposition';

describe('TESIS DOCTORAL - PILAR 1: Fraccionamiento Isotópico de Nitrógeno (δ¹⁵N & δ¹⁸O)', () => {
  it('calcula distancias geodésicas deterministas a los macro-emisores de Málaga', () => {
    // Coordenadas de Calle Larios (Centro Histórico)
    const distances = computeDistancesToMalagaEmitters(36.7213, -4.4214);
    expect(distances.distPortKm).toBeGreaterThan(0.5);
    expect(distances.distPortKm).toBeLessThan(3.0);
    expect(distances.distCementKm).toBeGreaterThan(6.0);
    expect(distances.distCementKm).toBeLessThan(12.0);
    expect(distances.distAirportKm).toBeGreaterThan(5.0);
    expect(distances.distAirportKm).toBeLessThan(12.0);
  });

  it('resuelve el balance de mezcla isotópica multicomponente sin aleatoriedad', () => {
    const apportionment = computeIsotopeForensicApportionment({
      no2Ugm3: 38.5,
      noUgm3: 10.5,
      o3Ugm3: 65.0,
      temperatureC: 25.0,
      solarRadiationWm2: 600.0,
      svf: 0.45,
      windSpeedMs: 2.8,
      distanceToPortKm: 1.8,
      distanceToCementAranaKm: 8.5,
      distanceToAirportKm: 6.2,
      distanceToNearestHighwayKm: 0.4,
    });

    expect(apportionment.delta15N_bulk_permil).toBeDefined();
    expect(Number.isFinite(apportionment.delta15N_bulk_permil)).toBe(true);
    expect(apportionment.delta18O_bulk_permil).toBeGreaterThan(50.0);
    expect(apportionment.delta17O_anomaly_permil).toBeGreaterThan(10.0);
    expect(apportionment.contributions.length).toBe(6);

    // La suma de porcentajes de contribución debe ser exactamente 100%
    const totalPct = apportionment.contributions.reduce((sum, c) => sum + c.sharePct, 0);
    expect(Math.round(totalPct)).toBe(100);
  });

  it('calcula el enriquecimiento cinético fotoquímico PSS (ε_chem) acoplado a Leighton', () => {
    const highSunApportionment = computeIsotopeForensicApportionment({
      no2Ugm3: 30.0,
      noUgm3: 8.0,
      o3Ugm3: 80.0,
      temperatureC: 28.0,
      solarRadiationWm2: 850.0, // Mediodía despejado
      svf: 0.8,
      distanceToPortKm: 2.5,
      distanceToCementAranaKm: 9.0,
      distanceToAirportKm: 7.0,
    });

    expect(highSunApportionment.kineticEnrichment_permil).toBeGreaterThan(0);
    expect(highSunApportionment.kineticEnrichment_permil).toBeLessThan(10);
  });

  it('exporta el informe forense isotópico en formatos FAIR (JSON y CSV)', () => {
    const result = computeIsotopeForensicApportionment({
      no2Ugm3: 35.0,
      temperatureC: 22.0,
      solarRadiationWm2: 500.0,
      o3Ugm3: 60.0,
      distanceToPortKm: 1.8,
      distanceToCementAranaKm: 8.2,
      distanceToAirportKm: 5.5,
    });

    const json = exportIsotopeForensicJson(result, 'Calle Larios, Málaga');
    const csv = exportIsotopeForensicCsv(result, 'Calle Larios, Málaga');

    expect(json).toContain('"delta15N_permil_vs_AirN2"');
    expect(json).toContain('FAIR-Data-Isotope-Forensics');
    expect(csv).toContain('Source_Name,Category,Share_Percent');
    expect(csv).toContain('Bulk_Delta15N_permil');
  });
});

describe('TESIS DOCTORAL - PILAR 2: Microfísica del Terral de Málaga (Viento Foehn & Paradoja Estomática)', () => {
  it('detecta deterministamente el régimen de Terral según el criterio oficial', () => {
    // Brisa marina de Levante
    const levanteDiag = computeTerralMeteoDiagnostics(24.0, 68.0);
    expect(levanteDiag.isTerralActive).toBe(false);
    expect(levanteDiag.terralSeverity).toBe('no_terral');
    expect(levanteDiag.vpdKpa).toBeLessThan(1.5);

    // Terral extremo del Guadalhorce
    const terralDiag = computeTerralMeteoDiagnostics(41.5, 16.0);
    expect(terralDiag.isTerralActive).toBe(true);
    expect(terralDiag.terralSeverity).toBe('extremo');
    expect(terralDiag.vpdKpa).toBeGreaterThan(5.0);
  });

  it('simula el colapso de apertura estomática (Jarvis-Stewart) bajo aire desecado del Terral', () => {
    const levanteDiag = computeTerralMeteoDiagnostics(24.0, 68.0);
    const terralDiag = computeTerralMeteoDiagnostics(41.5, 16.0);

    // Apertura estomática cae drásticamente para evitar la embolia de xilema
    expect(levanteDiag.stomatalAperturePct).toBeGreaterThan(60.0);
    expect(terralDiag.stomatalAperturePct).toBeLessThan(10.0);
  });

  it('cuantifica la aceleración cinética de Arrhenius k(NO + O3) a altas temperaturas', () => {
    const standard20 = computeTerralMeteoDiagnostics(20.0, 60.0);
    const terral42 = computeTerralMeteoDiagnostics(42.0, 15.0);

    expect(standard20.leightonAccelerationRatio).toBeCloseTo(1.0, 1);
    // A 42°C, la velocidad de titulación bimolecular se acelera más de un 35%
    expect(terral42.leightonAccelerationRatio).toBeGreaterThan(1.35);
  });

  it('demuestra la caída de la velocidad de deposición v_d(NO2) en todas las especies de Málaga', () => {
    const summary = calculateTerralCanopyDisruptionSummary(650, 41.5, 18.0, 0.42, 38.0, 85.0);

    expect(summary.speciesComparisons.length).toBe(MALAGA_TREE_SPECIES_WESELY_PROFILES.length);
    summary.speciesComparisons.forEach((comp) => {
      // La caída de velocidad de deposición de NO2 debe ser superior al 60%
      expect(comp.vdDropPct).toBeGreaterThan(60.0);
      expect(comp.vdTerralNO2_cm_s).toBeLessThan(comp.vdLevanteNO2_cm_s);
      expect(comp.stomatalResistanceIncreaseFactor).toBeGreaterThan(3.0);
    });

    // El balance de pérdida de sumidero a escala urbana debe ser significativo
    expect(summary.totalMonthlyPenaltyKgNO2).toBeGreaterThan(10.0);
    expect(summary.avgNO2VdDropPct).toBeGreaterThan(70.0);
  });

  it('genera tabla LaTeX citable y exportación CSV FAIR para la memoria doctoral', () => {
    const summary = calculateTerralCanopyDisruptionSummary(650, 40.0, 20.0, 0.40, 35.0, 75.0);
    const latex = generateTerralDisruptionLatex(summary);
    const csv = exportTerralDisruptionCsv(summary);

    expect(latex).toContain('\\begin{table}');
    expect(latex).toContain('Jacaranda mimosifolia');
    expect(latex).toContain('\\caption{Impacto del Viento Terral del Guadalhorce');
    expect(csv).toContain('especie,nombre_cientifico,vd_levante_cm_s,vd_terral_cm_s');
    expect(csv).toContain('# Metadata: Temp_C=40');
  });
});
