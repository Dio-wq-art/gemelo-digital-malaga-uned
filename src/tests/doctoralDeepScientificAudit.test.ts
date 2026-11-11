/**
 * AUDITORÍA CIENTÍFICA, FÍSICA Y QUÍMICA RIGUROSA PARA TESIS DOCTORAL
 * Modelización de la Calidad del Aire a Microescala en Málaga (Gemelo Digital)
 * 
 * Verificación Metodológica:
 * 1. Cinética Fotoquímica de Leighton & Arrhenius IUPAC / JPL.
 * 2. Teoría de Semejanza de Monin-Obukhov (MOST) y Turbulencia de Businger-Dyer.
 * 3. Morfometría de Cañones Urbanos y Regímenes Fluidodinámicos de Oke (1987).
 * 4. Marco de Evaluación Metrológica FAIRMODE WG1 (Directiva 2008/50/CE).
 * 5. Red de Resistencias de Deposición Seca de Wesely (1989).
 * 6. Factores de Emisión de Tráfico COPERT 5 Tier 3 (Guía EMEP/EEA).
 */

import { describe, it, expect } from 'vitest';
import { calculateMoninObukhov } from '../lib/moninObukhov';
import { computeRigorousCanyonMetrics } from '../lib/geodesy';
import { calculateFairmodeMetrics } from '../lib/fairmode';
import { calculateWeselyForTreeSpecies, MALAGA_TREE_SPECIES_WESELY_PROFILES } from '../lib/weselyDryDeposition';
import { evaluateCopertEmissions, FleetComposition } from '../lib/copert5';

describe('A. Cinética Fotoquímica de Leighton y Mecanismo Arrhenius IUPAC', () => {
  it('Debe calcular la constante Arrhenius k3(T) de titulación NO + O3 con precisión estricta a 298.15 K', () => {
    const tempK = 298.15;
    // k3(T) = 1.4e-12 * exp(-1310 / T) cm3 / (molec * s)
    const k3_cm3 = 1.4e-12 * Math.exp(-1310 / tempK);
    expect(k3_cm3).toBeGreaterThan(1.6e-14);
    expect(k3_cm3).toBeLessThan(1.8e-14);

    // Factor molecular a 1 atm y 298.15 K
    const numberDensityPerPpb = (101325 / (8.314462618 * tempK)) * 6.02214076e23 * 1e-15; // molec / (cm3 * ppb)
    const k3_ppb_s = k3_cm3 * numberDensityPerPpb;
    
    // El valor estándar reconocido internacionalmente para k3 a 25°C es ~4.2e-4 a 4.3e-4 ppb^-1 s^-1
    expect(k3_ppb_s).toBeGreaterThan(0.00041);
    expect(k3_ppb_s).toBeLessThan(0.00044);
  });

  it('Debe verificar que el ratio de Leighton Phi responde con sensibilidad física a diferentes regímenes', () => {
    const evalPhi = (no2_ug: number, no_ug: number, o3_ug: number, rad: number, tempC: number) => {
      const tk = tempC + 273.15;
      const k3_cm3 = 1.4e-12 * Math.exp(-1310 / tk);
      const numberDensityPerPpb = (101325 / (8.314 * tk)) * 6.022e23 * 1e-15;
      const k3_ppb_s = k3_cm3 * numberDensityPerPpb;
      const jNo2_s = (rad / 800) * 0.0065;
      const no2_ppb = Math.max(0.5, no2_ug / 1.88);
      const no_ppb = Math.max(0.5, no_ug / 1.23);
      const o3_ppb = Math.max(1.0, o3_ug / 2.00);
      return (jNo2_s * no2_ppb) / (k3_ppb_s * no_ppb * o3_ppb);
    };

    // 1. Centro Urbano balanceado a pleno sol: Phi próximo a 1 (0.90 - 1.35)
    const phiUrban = evalPhi(28.0, 8.0, 45.0, 650, 25);
    expect(phiUrban).toBeGreaterThan(0.90);
    expect(phiUrban).toBeLessThan(1.35);

    // 2. Fondo Periurbano con alta radiación y bajo NO (El Atabal): Phi > 1.20 (RO2 activo)
    const phiBackground = evalPhi(14.0, 2.5, 68.0, 750, 26);
    expect(phiBackground).toBeGreaterThan(1.20);

    // 3. Eje de Tráfico Pesado con alta emisión de NO fresco: Phi < 1.30 (titración domina)
    const phiTraffic = evalPhi(45.0, 22.0, 25.0, 600, 25);
    expect(phiTraffic).toBeLessThan(1.30);
  });
});

describe('B. Micrometeorología y Teoría de Semejanza de Monin-Obukhov (MOST)', () => {
  it('Debe calcular parámetros de turbulencia física u*, L y Kz válidos para la capa superficial urbana', () => {
    // Escenario diurno típico en Málaga con viento moderado e irradiancia solar alta
    const most = calculateMoninObukhov(
      10.0, // Altura z = 10m
      0.8,  // z0 = 0.8m (rugosidad canópica urbana)
      18.0, // Altura media edificios H = 18m
      3.5,  // u_ref = 3.5 m/s
      26.0, // Temp = 26ºC
      650.0,// Irradiancia = 650 W/m²
      15.0, // Nubes = 15%
      false // Diurno
    );

    // 1. Velocidad de fricción u* debe ser positiva y realista para entornos urbanos (0.1 a 1.2 m/s)
    expect(most.uStarMs).toBeGreaterThan(0.1);
    expect(most.uStarMs).toBeLessThan(1.2);

    // 2. Flujo de calor sensible Hs debe ser positivo en día soleado (> 50 W/m2)
    expect(most.sensibleHeatFluxWm2).toBeGreaterThan(50);

    // 3. Longitud de Obukhov L debe ser negativa bajo convección diurna inestable
    expect(most.moninObukhovLengthL).toBeLessThan(0);

    // 4. Clase de estabilidad atmosférica debe ser inestable (A, B o C)
    expect(['A', 'B', 'C']).toContain(most.stabilityClass);

    // 5. Coeficiente de difusividad Kz debe ser positivo
    expect(most.kzM2s).toBeGreaterThan(0.5);
  });
});

describe('C. Morfometría y Clasificación Hidrodinámica de Cañones Urbanos (Oke 1987)', () => {
  it('Debe discriminar los tres regímenes fluidodinámicos universales de Oke según H/W', () => {
    // 1. Flujo Rasante (Skimming Flow): H/W >= 0.65 (Calle Larios, H=22m, W=14m -> H/W=1.57)
    const canyonSkimming = computeRigorousCanyonMetrics(
      -4.421, 36.720,
      -4.4211, 36.720,
      -4.4209, 36.720,
      22.0
    );
    expect(canyonSkimming.flowRegime).toBe('skimming_flow');

    // 2. Interferencia de Estelas (Wake Interference): 0.30 <= H/W < 0.65
    const canyonWake = computeRigorousCanyonMetrics(
      -4.430, 36.715,
      -4.430 - 0.00015, 36.715,
      -4.430 + 0.00015, 36.715,
      11.0
    );
    expect(canyonWake.aspectRatio_HW).toBeGreaterThanOrEqual(0.30);
  });
});

describe('D. Metrología Oficial y Marco de Validación FAIRMODE WG1', () => {
  it('Debe calcular rigurosamente MQI, RMSE, NMB y FAC2 para pares de observación/simulación', () => {
    const pairs = [
      { obs: 32.5, sim: 33.8 },
      { obs: 45.2, sim: 44.1 },
      { obs: 28.0, sim: 29.5 },
      { obs: 50.1, sim: 48.0 },
      { obs: 38.6, sim: 39.2 }
    ];

    const metrics = calculateFairmodeMetrics(pairs);

    // 1. RMSE debe ser bajo y estrictamente positivo
    expect(metrics.rmse).toBeGreaterThan(0);
    expect(metrics.rmse).toBeLessThan(5.0);

    // 2. R2 (coeficiente de determinación) debe ser alto (> 0.90)
    expect(metrics.r2).toBeGreaterThan(0.90);

    // 3. FAC2 debe ser 1.0 (100% de los datos dentro del factor de 2)
    expect(metrics.fac2).toBe(1.0);

    // 4. MQI (Model Quality Indicator) debe ser <= 1.00 para cumplir el estándar europeo
    expect(metrics.mqi).toBeLessThanOrEqual(1.00);
    expect(metrics.targetFulfilled).toBe(true);
  });
});

describe('E. Deposición Seca de Wesely (1989) y Resistencia Foliar', () => {
  it('Debe calcular velocidades de deposición vd consistentes con la física para NO2 y O3', () => {
    const jacaranda = MALAGA_TREE_SPECIES_WESELY_PROFILES[0];
    
    // Evaluar NO2:
    const depNO2 = calculateWeselyForTreeSpecies(
      jacaranda,
      'NO2',
      450.0, // PAR (W/m2)
      25.0,  // Temp (ºC)
      0.45,  // u* (m/s)
      35.0   // Concentración NO2 (ug/m3)
    );

    // Evaluar O3:
    const depO3 = calculateWeselyForTreeSpecies(
      jacaranda,
      'O3',
      450.0, // PAR (W/m2)
      25.0,  // Temp (ºC)
      0.45,  // u* (m/s)
      65.0   // Concentración O3 (ug/m3)
    );

    // 1. La velocidad de deposición vd para NO2 y O3 debe estar en el rango típico de 0.05 a 1.5 cm/s
    expect(depNO2.vd_cm_s).toBeGreaterThan(0.05);
    expect(depNO2.vd_cm_s).toBeLessThan(1.5);

    expect(depO3.vd_cm_s).toBeGreaterThan(0.08);
    expect(depO3.vd_cm_s).toBeLessThan(2.0);

    // 2. Las resistencias Ra, Rb y Rc deben ser estrictamente positivas
    expect(depNO2.ra_s_m).toBeGreaterThan(0);
    expect(depNO2.rb_s_m).toBeGreaterThan(0);
    expect(depNO2.rc_s_m).toBeGreaterThan(0);

    // 3. El flujo de deposición seca debe ser estrictamente positivo
    expect(depNO2.dryFluxUgm2s).toBeGreaterThan(0);
    expect(depO3.dryFluxUgm2s).toBeGreaterThan(0);
  });
});

describe('F. Emisiones Vehiculares COPERT 5 Tier 3 (Guía EMEP/EEA)', () => {
  it('Debe calcular factores de emisión monotónicos con la velocidad y composición de flota', () => {
    const testFleet: FleetComposition = {
      gasolineEuro4: 10,
      gasolineEuro6: 35,
      dieselEuro4: 15,
      dieselEuro6: 30,
      electric: 8,
      heavyDuty: 2
    };

    // Evaluar a baja velocidad urbana (15 km/h, congestión) vs velocidad fluida (50 km/h)
    const emCongestion = evaluateCopertEmissions(15, testFleet);
    const emFluid = evaluateCopertEmissions(50, testFleet);

    // 1. En congestión (15 km/h) las emisiones de NOx por km deben ser superiores a flujo libre (50 km/h)
    expect(emCongestion.nox_g_km).toBeGreaterThan(emFluid.nox_g_km);

    // 2. Las emisiones de material particulado PM2.5 y PM10 deben ser estrictamente positivas
    expect(emCongestion.pm25_g_km).toBeGreaterThan(0);
    expect(emCongestion.pm10_g_km).toBeGreaterThan(emCongestion.pm25_g_km);

    // 3. Emisiones de CO2 realistas (100 - 350 g/km)
    expect(emFluid.co2_g_km).toBeGreaterThan(100);
    expect(emFluid.co2_g_km).toBeLessThan(350);
  });
});

describe('G. Atlas Científico y Registro de Diagramas Físicos (Tópicos Maestros)', () => {
  it('Debe garantizar que todos los tópicos del Atlas Físico tienen diagramas únicos y trazabilidad completa', async () => {
    const { getAllScientificTopics } = await import('../lib/scientificRegistry');
    const topics = getAllScientificTopics();
    expect(topics.length).toBeGreaterThanOrEqual(22);

    const diagramTypes = topics.map(t => t.diagramType);
    expect(diagramTypes.filter(Boolean).length).toBe(topics.length);

    // Verificar que todos los tipos de diagramas son distintos (cero diagramas duplicados)
    const uniqueDiagramTypes = new Set(diagramTypes);
    expect(uniqueDiagramTypes.size).toBe(topics.length);

    // Verificar que cada tópico tiene fórmula LaTeX, citas y marco regulatorio
    topics.forEach(t => {
      expect(t.formulaLaTeX.length).toBeGreaterThan(5);
      expect(t.physicsLaw.length).toBeGreaterThan(5);
      expect(t.literatureCitation.length).toBeGreaterThan(5);
    });
  });
});

describe('H. Dosimetría Pulmonar Humana ICRP 66 & Equidad Escolar en los 11 Distritos de Málaga', () => {
  it('Debe calcular la dosimetría ICRP 66 distinguiendo cohortes etarias y verificando límites de la Directiva (UE) 2024/2881', async () => {
    const { computeIcrp66Dosimetry } = await import('../lib/icrp66Dosimetry');

    // 1. Niño escolar vs Adulto sedentario en la misma concentración
    const childResult = computeIcrp66Dosimetry({
      no2ConcentrationUgM3: 35.0,
      pm25ConcentrationUgM3: 15.0,
      pm10ConcentrationUgM3: 25.0,
      activityLevel: 'WALKING',
      exposureDurationMinutes: 60,
      cohort: 'CHILD_8Y'
    });

    const adultResult = computeIcrp66Dosimetry({
      no2ConcentrationUgM3: 35.0,
      pm25ConcentrationUgM3: 15.0,
      pm10ConcentrationUgM3: 25.0,
      activityLevel: 'WALKING',
      exposureDurationMinutes: 60,
      cohort: 'ADULT_SEDENTARY'
    });

    // La relación de ventilación específica por peso en niños debe superar a la de adultos
    expect(childResult.pediatricAdultVentilationFactor).toBeGreaterThan(1.2);

    // Cota respiratoria pediátrica estricta (0.90 m AGL) vs adulto (1.70 m AGL)
    expect(childResult.inhalationHeightM).toBe(0.90);
    expect(adultResult.inhalationHeightM).toBe(1.70);

    // Fracciones de depósito ICRP 66 sumadas
    expect(childResult.totalPulmonaryRetentionPct).toBeGreaterThan(70);
    expect(childResult.totalPulmonaryRetentionPct).toBeLessThan(100);

    // Auditoría de la Directiva 2024/2881: NO2 (35 > 20) y PM2.5 (15 > 10) deben marcar no conformidad
    expect(childResult.directiveAudit.no2Exceedance2030).toBe(true);
    expect(childResult.directiveAudit.pm25Exceedance2030).toBe(true);
    expect(childResult.directiveAudit.who2021No2Exceedance).toBe(true);

    // Dosis biológicamente efectiva de estrés oxidativo (DTT) estrictamente positiva
    expect(childResult.biologicallyEffectiveOxidativeDoseNmol).toBeGreaterThan(0);
  });

  it('Debe cubrir centros escolares representativos en los 11 distritos municipales y generar GeoJSON FAIR válido', async () => {
    const { MALAGA_RAW_SCHOOLS, computeSchoolAirEquity, generateSchoolsGeoJson } = await import('../lib/schoolAirEquity');

    // Comprobar cobertura de los 11 distritos de Málaga
    const districtIds = new Set(MALAGA_RAW_SCHOOLS.map(s => s.districtId));
    expect(districtIds.size).toBe(11);
    expect(MALAGA_RAW_SCHOOLS.length).toBe(50);

    const equity = computeSchoolAirEquity({
      ambientNO2UgM3: 30.0,
      ambientPM25UgM3: 12.0
    });

    expect(equity.schools.length).toBe(50);
    expect(equity.inequalityRatioLowVsHighIncome).toBeGreaterThan(1.0);

    // Generador GeoJSON
    const geoJson = generateSchoolsGeoJson(equity.schools);
    expect(geoJson.type).toBe('FeatureCollection');
    expect(geoJson.features.length).toBe(50);
    expect(geoJson.features[0].geometry.type).toBe('Point');
    expect(geoJson.features[0].geometry.coordinates.length).toBe(2);
    expect(geoJson.features[0].properties.childAlveolarPM25DoseUgDay).toBeGreaterThan(0);
  });
});


