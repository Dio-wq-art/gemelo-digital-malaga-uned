import { describe, it, expect } from 'vitest';
import { calculatePINNParameters } from '../lib/physics';
import { 
  computeOxInvariantsAndPrimaryNO2Partition,
  compute3DCanyonSolarShadingJNO2,
  computeMarineHalogenN2O5Activation,
  computeSillmanChemicalSensitivityRatio,
  computeUrbanDamkohlerNumber,
  evaluateComprehensiveNO2Microscale
} from '../lib/no2MicroscaleKineticsEngine';

describe('Tesis Doctoral: Motor Determinista de Cinética y Microescala de NO2', () => {
  it('1. Partición de Ox Invariante y NO2 Primario vs Secundario (Clapp & Jenkin 2001)', () => {
    const no2 = 45.0; // µg/m³
    const o3 = 50.0;  // µg/m³
    const no = 15.0;  // µg/m³

    const res = computeOxInvariantsAndPrimaryNO2Partition(no2, o3, no, 1.2, 0.58);

    expect(res.oxUgM3).toBe(95.0);
    expect(res.primaryPercentage + res.secondaryPercentage).toBeCloseTo(100.0, 1);
    expect(res.no2PrimaryUgM3).toBeGreaterThan(0);
    expect(res.no2SecondaryUgM3).toBeGreaterThan(0);
    expect(res.no2PrimaryUgM3 + res.no2SecondaryUgM3).toBeCloseTo(no2, 1);
    expect(res.fNo2PrimaryFraction).toBeGreaterThan(0.15);
    expect(res.fNo2PrimaryFraction).toBeLessThan(0.35);
  });

  it('2. Atenuación de Fotólisis J_NO2 por Sombra 3D en Cañón Urbano', () => {
    const jZenith = 0.0055; // s^-1
    const hwDeep = 1.8;     // Cañón profundo (ej. Calle Larios)
    const hwOpen = 0.2;     // Avenida abierta

    const deepCanyon = compute3DCanyonSolarShadingJNO2(jZenith, hwDeep, 90, 45, 180, 0.35);
    const openStreet = compute3DCanyonSolarShadingJNO2(jZenith, hwOpen, 90, 45, 180, 0.85);

    expect(deepCanyon.jNo2CanyonS1).toBeLessThan(deepCanyon.jNo2ZenithalS1);
    expect(deepCanyon.attenuationPct).toBeGreaterThan(openStreet.attenuationPct);
    expect(deepCanyon.shadowFraction).toBeGreaterThan(0.5);
    expect(openStreet.shadowFraction).toBeLessThan(0.3);
  });

  it('3. Activación de Halógenos Marinos y Burst Matinal de ClNO2 en la Costa de Málaga', () => {
    const coastPoint = computeMarineHalogenN2O5Activation(25.0, 40.0, 36.8, 0.5, 22.0, 70.0);
    const inlandPoint = computeMarineHalogenN2O5Activation(25.0, 40.0, 36.8, 12.0, 22.0, 70.0);

    expect(coastPoint.clno2Ppb).toBeGreaterThan(inlandPoint.clno2Ppb);
    expect(coastPoint.morningNoToNo2AccelerationFactor).toBeGreaterThan(inlandPoint.morningNoToNo2AccelerationFactor);
    expect(coastPoint.status).toBe('ACTIVE_BURST');
    expect(inlandPoint.status).toBe('NEGLIGIBLE_INLAND');
  });

  it('4. Diagnóstico Satelital de Sensibilidad de Sillman (HCHO / NO2)', () => {
    const vocLimited = computeSillmanChemicalSensitivityRatio(25.0, 45.0); // Ratio 0.56
    const noxLimited = computeSillmanChemicalSensitivityRatio(65.0, 20.0); // Ratio 3.25

    expect(vocLimited.regime).toBe('VOC_LIMITED');
    expect(noxLimited.regime).toBe('NOX_LIMITED');
    expect(vocLimited.ratioHchoNo2).toBeLessThan(1.0);
    expect(noxLimited.ratioHchoNo2).toBeGreaterThan(2.0);
  });

  it('5. Número Adimensional de Damköhler Urbano (Oke 1987 / Leighton PSS)', () => {
    const calmCanyon = computeUrbanDamkohlerNumber(16, 24, 0.8, 0.2, 0.44, 40, 0.004);
    const windyAvenue = computeUrbanDamkohlerNumber(35, 12, 6.0, 0.8, 0.44, 40, 0.008);

    expect(calmCanyon.damkohlerNumber).toBeGreaterThan(windyAvenue.damkohlerNumber);
    expect(calmCanyon.photochemicalEquilibriumPct).toBeGreaterThan(windyAvenue.photochemicalEquilibriumPct);
    expect(calmCanyon.okeAerodynamicFlow).toContain('Skimming Flow');
  });

  it('6. Evaluación Holística en Tiempo Real para Punto Activo Asimilado', () => {
    const report = evaluateComprehensiveNO2Microscale({
      no2UgM3: 38.5,
      o3UgM3: 48.0,
      noUgM3: 12.0,
      trafficFactor: 1.1,
      aspectRatioHw: 1.25,
      distanceToCoastKm: 0.9,
      tempC: 23.5,
      rhPct: 62.0
    });

    expect(report.oxPartition).toBeDefined();
    expect(report.canyonShading).toBeDefined();
    expect(report.marineHalogens).toBeDefined();
    expect(report.sillmanSensitivity).toBeDefined();
    expect(report.damkohler).toBeDefined();
    expect(report.summaryExecutive).toContain('Diagnóstico de microescala NO2');
  });

  it('7. Caché LRU de Física Espacial (Respuesta instantánea 0.0 ms)', () => {
    const meteoSample = {
      temperatura_malaga: 22.5,
      direccion_viento_grados: 140,
      velocidad_viento_km_h: 12.0,
      lai_arbolado: 2.5,
      humedad_relativa: 58,
      uv_index: 6,
      pm2_5: 11.0,
      pm10: 20.0,
      dust: 3.0,
      ozone: 55.0,
      no2_satelite_base: 30.0,
      presion_atmosferica: 1013.25,
      lat: 36.7196,
      lon: -4.4200
    };

    const run1 = calculatePINNParameters(meteoSample);
    const run2 = calculatePINNParameters(meteoSample);

    // Misma referencia de objeto obtenida del caché
    expect(run1).toBe(run2);
  });
});
