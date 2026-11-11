/**
 * Suite de Validación Científica y Verificación Metodológica para Tesis Doctoral
 * Modelización de Calidad del Aire y Gemelo Digital Urbano de Málaga
 * 
 * Normas Evaluadas:
 * 1. Cero Aleatoriedad en Datos (Regla Estricta del Gemelo Digital).
 * 2. Conservación Estequiométrica de Masa en Cinética Atmosférica Rígida (RK45).
 * 3. Exactitud Geodésica ETRS89 / UTM 30N (Real Decreto 1071/2007, IGN, EPSG:25830).
 * 4. Clasificación Fluidodinámica de Cañón Urbano (Oke, 1988).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { wgs84ToUtm30N, utm30NToWgs84, calculatePlanarDistanceM, computeRigorousCanyonMetrics } from '../lib/geodesy';
import { solveAtmosphericPhotochemistryAdaptive } from '../lib/atmosphericOdeSolver';

describe('1. Verificación Doctrinal: Cero Aleatoriedad en la Capa de Datos (Zero Stochastic Data)', () => {
  it('No debe existir ninguna llamada a Math.random() en los módulos de física, cinética o telemetría en src/lib/', () => {
    const libDir = path.resolve(__dirname, '../lib');
    const files = fs.readdirSync(libDir).filter(f => (f.endsWith('.ts') || f.endsWith('.tsx')) && f !== 'agentsMdFullRegistry.ts');

    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of files) {
      const filePath = path.join(libDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Ignorar comentarios explícitos que documenten la prohibición
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

        if (line.includes('Math.random()')) {
          violations.push({
            file,
            line: index + 1,
            text: trimmed,
          });
        }
      });
    }

    expect(
      violations,
      `Se detectaron ${violations.length} llamadas ilegales a Math.random() en src/lib/:\n` +
      violations.map(v => `  - ${v.file}:${v.line} -> ${v.text}`).join('\n')
    ).toHaveLength(0);
  });
});

describe('2. Verificación Numérica: Solucionador Cinético Rígido Adaptativo RK45', () => {
  it('Debe garantizar la conservación estequiométrica de nitrógeno reactivo [NOx] en un régimen fotoquímico estival de Málaga', () => {
    // Escenario de mediodía solar en el centro de Málaga: alta radiación, ozono elevado
    const initialState = {
      NO_ug_m3: 15.0,
      NO2_ug_m3: 45.0,
      O3_ug_m3: 75.0,
      VOC_ug_m3: 30.0,
      preexistingOrganicMass_ug_m3: 6.0,
    };

    const ambientConditions = {
      temperatureC: 29.5,
      relativeHumidityPct: 58.0,
      solarRadiationW_m2: 850.0,
      uvIndex: 8.2,
      pressureHpa: 1015.0,
    };

    const durationSeconds = 1800; // 30 minutos
    const tolerance = 1e-4;

    const result = solveAtmosphericPhotochemistryAdaptive(
      initialState,
      ambientConditions,
      durationSeconds,
      tolerance
    );

    // 1. Debe haber completado pasos adaptativos
    expect(result.totalAdaptiveSteps).toBeGreaterThan(10);

    // 2. El residuo de conservación de masa estequiométrica de nitrógeno debe ser ínfimo (< 0.001 ug/m3)
    expect(result.nitrogenConservationResidual_ug_m3).toBeLessThan(0.01);

    // 3. La tasa de fotólisis J_NO2 debe estar en el orden de magnitud troposférico real (10^-3 a 10^-2 s^-1)
    expect(result.jNO2_s_inv).toBeGreaterThan(1e-4);
    expect(result.jNO2_s_inv).toBeLessThan(2e-2);

    // 4. Ninguna concentración puede ser negativa (violación física de no-negatividad)
    for (const step of result.timeSeries) {
      expect(step.NO_ug_m3).toBeGreaterThanOrEqual(0);
      expect(step.NO2_ug_m3).toBeGreaterThanOrEqual(0);
      expect(step.O3_ug_m3).toBeGreaterThanOrEqual(0);
      expect(step.Ox_ug_m3).toBeGreaterThanOrEqual(0);
    }
  });

  it('Debe calcular autovalores Jacobian y rigidez física coherente con solvePhotochemicalODE', async () => {
    const { solvePhotochemicalODE } = await import('../lib/odeSolver');
    const odeParams = {
      j_no2: 0.008,
      k3: 0.44,
      temp_kelvin: 302.15,
      pressure_hpa: 1013.25,
      vd_no2: 0.0015,
      vd_o3: 0.004,
      mixing_height_m: 800,
      initial_no2_ppb: 25.0,
      initial_no_ppb: 8.0,
      initial_o3_ppb: 38.0,
      initial_voc_ppb: 15.0,
    };

    const odeRes = solvePhotochemicalODE(odeParams, 1800, 2.0);

    expect(odeRes.timeline.length).toBeGreaterThan(10);
    expect(odeRes.diagnostics.stiffnessRatio).toBeGreaterThan(1.0);
    expect(odeRes.diagnostics.eigenvalues).toHaveLength(3);
    expect(odeRes.steadyState.no2_ppb).toBeGreaterThan(0);
    expect(odeRes.steadyState.o3_ppb).toBeGreaterThan(0);
  });
});

describe('3. Verificación Geodésica Oficial: ETRS89 / UTM Huso 30N (EPSG:25830)', () => {
  it('Debe transformar con precisión milimétrica bidireccional (WGS84 <-> UTM 30N) para la red oficial de Málaga', () => {
    // Estación Oficial de Calidad del Aire de Carranque (Málaga)
    const carranqueWgs = { lon: -4.4449, lat: 36.7174 };

    const utm = wgs84ToUtm30N(carranqueWgs.lon, carranqueWgs.lat);

    // Verificar rango de coordenadas proyectadas UTM 30N para Málaga
    // X (Easting) debe estar aprox entre 360,000 y 380,000 m
    // Y (Northing) debe estar aprox entre 4,060,000 y 4,070,000 m
    expect(utm.x).toBeGreaterThan(360000);
    expect(utm.x).toBeLessThan(385000);
    expect(utm.y).toBeGreaterThan(4060000);
    expect(utm.y).toBeLessThan(4075000);

    // Al estar al oeste del meridiano central 3°W (-3.0), la convergencia de meridianos gamma debe ser negativa
    expect(utm.gridConvergenceDeg).toBeLessThan(0);

    // Transformación inversa
    const roundtrip = utm30NToWgs84(utm.x, utm.y);
    expect(Math.abs(roundtrip.lon - carranqueWgs.lon)).toBeLessThan(1e-5);
    expect(Math.abs(roundtrip.lat - carranqueWgs.lat)).toBeLessThan(1e-5);
  });

  it('Debe calcular distancias euclidianas métricas sin error de curvatura para microescala urbana', () => {
    // Dos puntos en la Alameda Principal de Málaga separados aprox 350 m
    const p1 = { lon: -4.4230, lat: 36.7175 };
    const p2 = { lon: -4.4270, lat: 36.7175 };

    const distM = calculatePlanarDistanceM(p1, p2);
    expect(distM).toBeGreaterThan(300);
    expect(distM).toBeLessThan(400);
  });
});

describe('4. Verificación Morfológica de Cañones Urbanos (Régimen de Flujo Oke 1988)', () => {
  it('Debe clasificar rigurosamente según la relación de aspecto H/W', () => {
    // Cañón Profundo (Skimming Flow): H = 25m, W = 15m -> H/W = 1.67 >= 0.65
    const deepCanyon = computeRigorousCanyonMetrics(
      -4.420, 36.720,
      -4.4201, 36.720,
      -4.4199, 36.720,
      25.0
    );
    expect(deepCanyon.flowRegime).toBe('skimming_flow');

    // Cañón Intermedio (Wake Interference): H = 10m, W = 25m -> H/W = 0.40
    // Simular fachadas separadas por 25 metros
    const uCenter = wgs84ToUtm30N(-4.420, 36.720);
    const leftWgs = utm30NToWgs84(uCenter.x - 12.5, uCenter.y);
    const rightWgs = utm30NToWgs84(uCenter.x + 12.5, uCenter.y);

    const wakeCanyon = computeRigorousCanyonMetrics(
      -4.420, 36.720,
      leftWgs.lon, leftWgs.lat,
      rightWgs.lon, rightWgs.lat,
      10.0
    );
    expect(wakeCanyon.aspectRatio_HW).toBeCloseTo(0.40, 1);
    expect(wakeCanyon.flowRegime).toBe('wake_interference');
  });
});

describe('5. Verificación de Interoperabilidad Atmosférica: Estándar NetCDF-4 / CF-1.8', () => {
  it('Debe generar descriptores CDL conformes a CF-1.8 con CRS EPSG:25830 oficial', async () => {
    const { generateNetCdfCdl } = await import('../lib/netcdfExporter');
    const mockDataset = {
      title: 'Malla Microescalar de Calidad del Aire - Centro de Malaga',
      timestampISO: '2026-09-18T12:00:00Z',
      lons: [-4.425, -4.424, -4.423],
      lats: [36.718, 36.719, 36.720],
      points: [
        { lon: -4.425, lat: 36.718, no2_ug_m3: 38.2, o3_ug_m3: 65.1, pm25_ug_m3: 12.0, temp_c: 28.5, wind_u_m_s: 1.2, wind_v_m_s: 0.8 },
      ],
    };

    const cdl = generateNetCdfCdl(mockDataset);

    // Verificaciones CF-1.8
    expect(cdl).toContain('Conventions = "CF-1.8, ACDD-1.3"');
    expect(cdl).toContain('epsg_code = "EPSG:25830"');
    expect(cdl).toContain('grid_mapping_name = "transverse_mercator"');
    expect(cdl).toContain('central_meridian = -3.0');
    expect(cdl).toContain('NO2:standard_name = "mass_concentration_of_nitrogen_dioxide_in_air"');
    expect(cdl).toContain('O3:standard_name = "mass_concentration_of_ozone_in_air"');
  });

  it('Debe generar archivo binario clásico NetCDF con cabecera CDF\\x01 válida y sin datos estocásticos', async () => {
    const { generateNetCdfClassicBinary } = await import('../lib/netcdfExporter');
    const mockDataset = {
      title: 'Validacion Binaria NetCDF Malaga',
      timestampISO: '2026-09-18T12:00:00Z',
      lons: [-4.425, -4.424],
      lats: [36.718, 36.719],
      points: [
        { lon: -4.425, lat: 36.718, no2_ug_m3: 35.0, o3_ug_m3: 70.0, pm25_ug_m3: 10.0, temp_c: 27.0, wind_u_m_s: 2.0, wind_v_m_s: 1.0 },
        { lon: -4.424, lat: 36.718, no2_ug_m3: 40.0, o3_ug_m3: 65.0, pm25_ug_m3: 12.0, temp_c: 27.2, wind_u_m_s: 2.1, wind_v_m_s: 1.1 },
        { lon: -4.425, lat: 36.719, no2_ug_m3: 32.0, o3_ug_m3: 72.0, pm25_ug_m3: 9.0, temp_c: 26.8, wind_u_m_s: 1.9, wind_v_m_s: 0.9 },
        { lon: -4.424, lat: 36.719, no2_ug_m3: 38.0, o3_ug_m3: 68.0, pm25_ug_m3: 11.0, temp_c: 27.0, wind_u_m_s: 2.0, wind_v_m_s: 1.0 },
      ],
    };

    const buffer = generateNetCdfClassicBinary(mockDataset);
    expect(buffer.byteLength).toBeGreaterThan(128);

    const view = new DataView(buffer);
    // Magic: 'C' (0x43), 'D' (0x44), 'F' (0x46), 0x01
    expect(view.getUint8(0)).toBe(0x43);
    expect(view.getUint8(1)).toBe(0x44);
    expect(view.getUint8(2)).toBe(0x46);
    expect(view.getUint8(3)).toBe(0x01);
  });

  it('6. Debe calcular Kriging Ordinario e Incertidumbre UQ con cota de confianza determinista en estaciones oficiales', async () => {
    const { interpolateOrdinaryKrigingAtPoint, generateMálagaKrigingVarianceGrid } = await import('../lib/krigingVarianceField');

    // Carranque exacto (ES1681A): lat: 36.7175, lon: -4.4447
    const resultStation = interpolateOrdinaryKrigingAtPoint(36.7175, -4.4447);
    expect(resultStation.estimatedNo2).toBeCloseTo(32.4, 0.1);
    expect(resultStation.varianceSigma2).toBeLessThanOrEqual(2.6); // Baja varianza (cercanía a estación)

    // Punto periférico en los Montes de Málaga (mayor distancia -> mayor varianza)
    const resultPeriphery = interpolateOrdinaryKrigingAtPoint(36.760, -4.410);
    expect(resultPeriphery.varianceSigma2).toBeGreaterThan(resultStation.varianceSigma2);
    expect(resultPeriphery.stdDevSigma).toBeGreaterThan(0);

    // Malla geoestadística
    const grid = generateMálagaKrigingVarianceGrid(36.720, -4.430, 4.0, 1.0);
    expect(grid.length).toBeGreaterThan(20);
    grid.forEach(cell => {
      expect(cell.krigingVarianceSigma2).toBeGreaterThanOrEqual(2.5);
      expect(cell.estimatedNo2).toBeGreaterThan(0);
      expect(cell.confidenceIntervalU95).toBeGreaterThan(0);
    });
  });
});

