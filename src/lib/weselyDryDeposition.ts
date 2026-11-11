/**
 * Módulo de Deposición Seca en Vegetación Urbana (Modelo de Wesely 1989)
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire en Málaga
 *
 * Fundamentación Científica y Normativa:
 * - Modelo de Resistencias en Serie de Wesely (1989) (Atmospheric Environment 23, 1293-1304).
 * - Velocidad de deposición v_d = 1 / (R_a + R_b + R_c) + v_g.
 * - Resistencias: Aerodinámica (R_a), Cuasi-Laminar de Capa Límite Foliar (R_b), y Canópica (R_c).
 * - Componentes de R_c: Estomática (R_s), Mesofílica (R_mes), Cutilar (R_cut) e Incanópica (R_inc).
 * - Cero Datos Aleatorios (Zero Stochastic Data): Formulación determinista basada en el Índice de Área Foliar (LAI) y PAR.
 */

import { BoundedCache, hashParams } from './computationEngine';

export interface MalagaTreeSpeciesWeselyProfile {
  speciesId: string;
  scientificName: string;
  commonName: string;
  foliageType: string;
  defaultLAI: number;
  rMinStomatal_s_m: number; // Resistencia estomática mínima r_min (s/m)
  rCuticular_s_m: number;   // Resistencia cuticular base r_cut (s/m)
  mesophyllResistance_s_m: number;
  typicalStreets: string[];
}

export const MALAGA_TREE_SPECIES_WESELY_PROFILES: MalagaTreeSpeciesWeselyProfile[] = [
  {
    speciesId: 'jacaranda_mimosifolia',
    scientificName: 'Jacaranda mimosifolia',
    commonName: 'Jacaranda',
    foliageType: 'Caducifolio tardío',
    defaultLAI: 4.2,
    rMinStomatal_s_m: 180,
    rCuticular_s_m: 1800,
    mesophyllResistance_s_m: 10,
    typicalStreets: ['Alameda Principal', 'Avenida de Andalucía', 'Plaza de la Merced'],
  },
  {
    speciesId: 'platanus_hispanica',
    scientificName: 'Platanus x hispanica',
    commonName: 'Plátano de sombra',
    foliageType: 'Caducifolio de hoja ancha',
    defaultLAI: 5.1,
    rMinStomatal_s_m: 150,
    rCuticular_s_m: 1400,
    mesophyllResistance_s_m: 5,
    typicalStreets: ['Paseo del Parque', 'Alameda Principal', 'Paseo de Reding'],
  },
  {
    speciesId: 'ficus_nitida',
    scientificName: 'Ficus microcarpa / nitida',
    commonName: 'Ficus de la India',
    foliageType: 'Perennifolio coriáceo',
    defaultLAI: 5.8,
    rMinStomatal_s_m: 220,
    rCuticular_s_m: 2200,
    mesophyllResistance_s_m: 15,
    typicalStreets: ['Paseo del Parque', 'Alameda de Colón', 'Plaza de la Marina'],
  },
  {
    speciesId: 'phoenix_dactylifera',
    scientificName: 'Phoenix dactylifera / canariensis',
    commonName: 'Palmera datilera / canaria',
    foliageType: 'Palmera perenne',
    defaultLAI: 2.8,
    rMinStomatal_s_m: 280,
    rCuticular_s_m: 2500,
    mesophyllResistance_s_m: 25,
    typicalStreets: ['Palmeral de las Sorpresas', 'Paseo Marítimo Pablo Ruiz Picasso'],
  },
  {
    speciesId: 'citrus_aurantium',
    scientificName: 'Citrus aurantium',
    commonName: 'Naranjo amargo',
    foliageType: 'Perennifolio de hoja pequeña',
    defaultLAI: 3.5,
    rMinStomatal_s_m: 240,
    rCuticular_s_m: 2100,
    mesophyllResistance_s_m: 20,
    typicalStreets: ['Calle Alcazabilla', 'Calle Larios (entorno)', 'Centro Histórico'],
  },
  {
    speciesId: 'brachychiton_populneus',
    scientificName: 'Brachychiton populneus',
    commonName: 'Braquiquito',
    foliageType: 'Perennifolio',
    defaultLAI: 3.8,
    rMinStomatal_s_m: 210,
    rCuticular_s_m: 2000,
    mesophyllResistance_s_m: 18,
    typicalStreets: ['Avenida de Carlos Haya', 'Teatinos'],
  },
];

export interface TreeSpeciesDepositionResult {
  species: MalagaTreeSpeciesWeselyProfile;
  ra_s_m: number;
  rb_s_m: number;
  rs_s_m: number;
  rc_s_m: number;
  vd_cm_s: number;
  dryFluxUgm2s: number;
}

export function calculateWeselyForTreeSpecies(
  speciesProfile: MalagaTreeSpeciesWeselyProfile,
  pollutant: PollutantSpecies,
  parWm2: number,
  airTempC: number,
  ustarMs: number,
  concentrationUgm3: number,
  rhPct: number = 60
): TreeSpeciesDepositionResult {
  const z0 = 0.8;
  const zRef = 10.0;
  const kKarm = 0.4;

  // Ra
  const ra = Math.max(5.0, Math.log(zRef / z0) / (kKarm * Math.max(0.05, ustarMs)));

  // Props
  const props = SPECIES_PROPERTIES[pollutant];

  if (pollutant === 'PM25') {
    const rbPm = 180.0 / Math.max(0.1, ustarMs);
    const rcPm = 50.0 / Math.max(0.5, speciesProfile.defaultLAI);
    const vdCmS = 100 / (ra + rbPm + rcPm);
    const dryFluxUgm2s = vdCmS * 0.01 * concentrationUgm3;

    return {
      species: speciesProfile,
      ra_s_m: parseFloat(ra.toFixed(1)),
      rb_s_m: parseFloat(rbPm.toFixed(1)),
      rs_s_m: 9999,
      rc_s_m: parseFloat(rcPm.toFixed(1)),
      vd_cm_s: parseFloat(vdCmS.toFixed(3)),
      dryFluxUgm2s: parseFloat(dryFluxUgm2s.toFixed(3)),
    };
  }

  // Rb
  const scPrRatio = props.diffRatioH2O;
  const rb = (2.0 / (kKarm * Math.max(0.05, ustarMs))) * Math.pow(scPrRatio, 2 / 3);

  // Déficit de Presión de Vapor (VPD) según ecuación de Tetens y modulación estomática Jarvis-Stewart (1976)
  const esKpa = 0.61078 * Math.exp((17.27 * airTempC) / (airTempC + 237.3));
  const eaKpa = esKpa * (Math.max(5, Math.min(100, rhPct)) / 100);
  const vpdKpa = Math.max(0.01, esKpa - eaKpa);
  // Función estomática Jarvis f(VPD): Cierre exponencial ante aire seco del Terral
  const fVpd = Math.max(0.02, Math.min(1.0, Math.exp(-0.52 * Math.max(0, vpdKpa - 1.0))));

  // Rs = rMin * [1 + (200 / (PAR + 0.1))^2] * (400 / [T * (40 - T)]) / (LAI * f(VPD))
  const tempDenom = airTempC >= 40 ? 0.5 : Math.max(1, airTempC * (40 - airTempC));
  const tempFactor = Math.max(1.0, 400 / tempDenom);
  const parFactor = 1.0 + Math.pow(200 / (Math.max(1, parWm2) + 0.1), 2);
  const rs = (speciesProfile.rMinStomatal_s_m * parFactor * tempFactor * props.diffRatioH2O) / 
    (Math.max(0.5, speciesProfile.defaultLAI) * fVpd);

  // Rc
  const rCut = speciesProfile.rCuticular_s_m / (Math.max(0.1, props.henryConstK / 1e5 + props.reactivityF0) * speciesProfile.defaultLAI);
  const rMes = speciesProfile.mesophyllResistance_s_m / (props.henryConstK / 3000 + 100 * props.reactivityF0 + 0.01);

  // Resistencia canópica Rc (Wesely 1989: Vía estomática en serie (rs + rMes) en paralelo con rCut)
  const invRc = (1 / Math.max(1, rs + rMes)) + (1 / Math.max(1, rCut));
  const rc = 1 / Math.max(1e-6, invRc);

  const vdMs = 1 / (ra + rb + rc);
  const vdCmS = vdMs * 100;
  const dryFluxUgm2s = vdMs * concentrationUgm3;

  return {
    species: speciesProfile,
    ra_s_m: parseFloat(ra.toFixed(1)),
    rb_s_m: parseFloat(rb.toFixed(1)),
    rs_s_m: parseFloat(rs.toFixed(1)),
    rc_s_m: parseFloat(rc.toFixed(1)),
    vd_cm_s: parseFloat(vdCmS.toFixed(3)),
    dryFluxUgm2s: parseFloat(dryFluxUgm2s.toFixed(3)),
  };
}

export type PollutantSpecies = 'O3' | 'NO2' | 'SO2' | 'PM25';

export interface WeselyResistanceBreakdown {
  ra_s_m: number;   // Resistencia aerodinámica R_a (s/m)
  rb_s_m: number;   // Resistencia cuasi-laminar R_b (s/m)
  rs_s_m: number;   // Resistencia estomática R_s (s/m)
  rc_s_m: number;   // Resistencia canópica total R_c (s/m)
  vd_cm_s: number;  // Velocidad de deposición v_d (cm/s)
  dryFluxUgm2s: number; // Flujo de deposición F_d = -v_d * C (µg/m² s)
  monthlyRemovalKg: number; // Remoción mensual acumulada en la masa vegetada (kg)
}

export interface ZoneDepositionCalculation {
  zoneId: string;
  zoneName: string;
  areaHa: number;
  lai: number;
  pollutantResults: Record<PollutantSpecies, WeselyResistanceBreakdown>;
}

export interface WeselySummary {
  timestamp: string;
  parWm2: number; // Radiación Fotosintéticamente Activa (W/m²)
  airTempC: number;
  rhPct: number;
  ustarMs: number; // Velocidad de fricción u* (m/s)
  totalVegetatedAreaHa: number;
  totalMonthlyRemovalKg: {
    O3: number;
    NO2: number;
    SO2: number;
    PM25: number;
  };
  zones: ZoneDepositionCalculation[];
}

export interface GreenZoneLocation {
  id: string;
  nombre: string;
  distrito: string;
  lat: number;
  lon: number;
  areaHa: number;
  laiBase: number; // Leaf Area Index (m² hoja / m² suelo)
  tipoEspecieDominante: 'mediterranea_frondosa' | 'palmeras_ficus' | 'pinar_gibralfaro' | 'arbustivo_urbano';
}

export const MALAGA_GREEN_ZONES: GreenZoneLocation[] = [
  {
    id: 'parque_malaga',
    nombre: 'Parque Histórico de Málaga (Paseo del Parque)',
    distrito: 'Centro Histórico',
    lat: 36.7198,
    lon: -4.4150,
    areaHa: 3.3,
    laiBase: 4.8,
    tipoEspecieDominante: 'mediterranea_frondosa',
  },
  {
    id: 'palmeral_sorpresas',
    nombre: 'Palmeral de las Sorpresas (Muelle 2)',
    distrito: 'Área Portuaria',
    lat: 36.7162,
    lon: -4.4170,
    areaHa: 1.8,
    laiBase: 2.9,
    tipoEspecieDominante: 'palmeras_ficus',
  },
  {
    id: 'monte_gibralfaro',
    nombre: 'Parque Forestal de Gibralfaro',
    distrito: 'Centro - Este',
    lat: 36.7230,
    lon: -4.4110,
    areaHa: 14.5,
    laiBase: 3.6,
    tipoEspecieDominante: 'pinar_gibralfaro',
  },
  {
    id: 'jardines_puerta_oscura',
    nombre: 'Jardines de Puerta Oscura y Pedro Luis Alonso',
    distrito: 'Centro',
    lat: 36.7210,
    lon: -4.4135,
    areaHa: 2.1,
    laiBase: 4.2,
    tipoEspecieDominante: 'mediterranea_frondosa',
  },
  {
    id: 'parque_teatinos_virreina',
    nombre: 'Parque del Cine y La Virreina',
    distrito: 'Teatinos - Palma',
    lat: 36.7280,
    lon: -4.4560,
    areaHa: 8.2,
    laiBase: 3.1,
    tipoEspecieDominante: 'arbustivo_urbano',
  },
];

/**
 * Propiedades difusivas y solubilidad de especies según Wesely (1989)
 */
const SPECIES_PROPERTIES: Record<PollutantSpecies, { diffRatioH2O: number; henryConstK: number; reactivityF0: number }> = {
  O3: { diffRatioH2O: 1.6, henryConstK: 1e-2, reactivityF0: 1.0 },
  NO2: { diffRatioH2O: 1.6, henryConstK: 1e-2, reactivityF0: 0.1 },
  SO2: { diffRatioH2O: 1.9, henryConstK: 1e5, reactivityF0: 0.0 },
  PM25: { diffRatioH2O: 1.0, henryConstK: 0.0, reactivityF0: 0.0 },
};

/**
 * Cálculo determinista del Modelo de Resistencias en Serie de Wesely (1989)
 */
export function calculateWeselyDepositionForZone(
  zone: GreenZoneLocation,
  parWm2: number,
  airTempC: number,
  rhPct: number,
  ustarMs: number,
  concentrationsUgm3: Record<PollutantSpecies, number>
): ZoneDepositionCalculation {
  const z0 = 0.8; // Longitud de rugosidad canópica urbana (m)
  const zRef = 10.0; // Altura de referencia (m)
  const kKarm: number = 0.4; // Constante de von Kármán

  // 1. Resistencia Aerodinámica R_a (s/m)
  // R_a = ln(zRef / z0) / (k * u*)
  const ra = Math.max(5.0, Math.log(zRef / z0) / (kKarm * Math.max(0.05, ustarMs)));

  const pollutantResults: Record<PollutantSpecies, WeselyResistanceBreakdown> = {} as any;

  const speciesList: PollutantSpecies[] = ['O3', 'NO2', 'SO2', 'PM25'];

  speciesList.forEach((species) => {
    const props = SPECIES_PROPERTIES[species];

    if (species === 'PM25') {
      // Para partículas finas PM2.5, v_d es dominado por sedimentación y choque inercial
      const rbPm = 180.0 / Math.max(0.1, ustarMs);
      const rcPm = 50.0 / Math.max(0.5, zone.laiBase);
      const vdCmS = 100 / (ra + rbPm + rcPm);
      const flux = vdCmS * 0.01 * concentrationsUgm3.PM25; // µg/m² s
      const monthlyKg = (flux * (zone.areaHa * 10000) * 3600 * 24 * 30) / 1e9;

      pollutantResults.PM25 = {
        ra_s_m: parseFloat(ra.toFixed(1)),
        rb_s_m: parseFloat(rbPm.toFixed(1)),
        rs_s_m: 9999, // No estomático
        rc_s_m: parseFloat(rcPm.toFixed(1)),
        vd_cm_s: parseFloat(vdCmS.toFixed(3)),
        dryFluxUgm2s: parseFloat(flux.toFixed(3)),
        monthlyRemovalKg: parseFloat(monthlyKg.toFixed(2)),
      };
      return;
    }

    // 2. Resistencia Cuasi-Laminar R_b = 2 / (k * u*) * (Sc / Pr)^(2/3)
    const scPrRatio = props.diffRatioH2O;
    const rb = (2.0 / (kKarm * Math.max(0.05, ustarMs))) * Math.pow(scPrRatio, 2 / 3);

    // 3. Resistencia Estomática R_s modulada por VPD (Jarvis-Stewart 1976 / Emberson 2000)
    const rMin = species === 'O3' ? 200 : species === 'NO2' ? 280 : 150;
    const esKpa = 0.61078 * Math.exp((17.27 * airTempC) / (airTempC + 237.3));
    const eaKpa = esKpa * (Math.max(5, Math.min(100, rhPct)) / 100);
    const vpdKpa = Math.max(0.01, esKpa - eaKpa);
    const fVpd = Math.max(0.02, Math.min(1.0, Math.exp(-0.52 * Math.max(0, vpdKpa - 1.0))));

    const tempDenom = airTempC >= 40 ? 0.5 : Math.max(1, airTempC * (40 - airTempC));
    const tempFactor = Math.max(1.0, 400 / tempDenom);
    const parFactor = 1.0 + Math.pow(200 / (Math.max(1, parWm2) + 0.1), 2);

    const rs = (rMin * parFactor * tempFactor * props.diffRatioH2O) / (Math.max(0.5, zone.laiBase) * fVpd);

    // 4. Resistencia Cutilar R_cut y Mesofílica R_mes
    const rCut = 2000 / (Math.max(0.1, props.henryConstK / 1e5 + props.reactivityF0) * zone.laiBase);
    const rMes = 1.0 / (props.henryConstK / 3000 + 100 * props.reactivityF0);

    // Resistencia Canópica Total R_c (Wesely 1989: Vía estomática (r_s + r_mes) en paralelo con vía cuticular r_cut)
    const invRc = (1 / Math.max(1, rs + rMes)) + (1 / Math.max(1, rCut));
    const rc = 1 / Math.max(1e-6, invRc);

    // Velocidad de Deposición v_d (m/s) -> cm/s
    const vdMs = 1 / (ra + rb + rc);
    const vdCmS = vdMs * 100;

    // Flujo de Deposición F_d = -v_d * C (µg/m² s)
    const conc = concentrationsUgm3[species];
    const dryFluxUgm2s = vdMs * conc;

    // Remoción acumulada mensual en kg: F_d * Area(m²) * 2,592,000s / 1e9
    const areaM2 = zone.areaHa * 10000;
    const monthlyKg = (dryFluxUgm2s * areaM2 * 2592000) / 1e9;

    pollutantResults[species] = {
      ra_s_m: parseFloat(ra.toFixed(1)),
      rb_s_m: parseFloat(rb.toFixed(1)),
      rs_s_m: parseFloat(rs.toFixed(1)),
      rc_s_m: parseFloat(rc.toFixed(1)),
      vd_cm_s: parseFloat(vdCmS.toFixed(3)),
      dryFluxUgm2s: parseFloat(dryFluxUgm2s.toFixed(3)),
      monthlyRemovalKg: parseFloat(monthlyKg.toFixed(2)),
    };
  });

  return {
    zoneId: zone.id,
    zoneName: zone.nombre,
    areaHa: zone.areaHa,
    lai: zone.laiBase,
    pollutantResults,
  };
}

const weselySummaryCache = new BoundedCache<string, WeselySummary>(60);

/**
 * Sumario completo de deposición seca en todas las masas vegetadas de Málaga
 */
export function calculateWeselyDryDepositionSummary(
  parWm2: number = 450,
  airTempC: number = 25,
  rhPct: number = 60,
  ustarMs: number = 0.35,
  concentrationsUgm3: Record<PollutantSpecies, number> = { O3: 65, NO2: 32, SO2: 4.5, PM25: 14 }
): WeselySummary {
  const cacheKey = hashParams({
    parWm2,
    airTempC,
    rhPct,
    ustarMs,
    concentrationsUgm3
  });

  const cached = weselySummaryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let totalAreaHa = 0;
  let removalO3 = 0;
  let removalNO2 = 0;
  let removalSO2 = 0;
  let removalPM25 = 0;

  const zoneCalcs = MALAGA_GREEN_ZONES.map((zone) => {
    totalAreaHa += zone.areaHa;
    const calc = calculateWeselyDepositionForZone(zone, parWm2, airTempC, rhPct, ustarMs, concentrationsUgm3);

    removalO3 += calc.pollutantResults.O3.monthlyRemovalKg;
    removalNO2 += calc.pollutantResults.NO2.monthlyRemovalKg;
    removalSO2 += calc.pollutantResults.SO2.monthlyRemovalKg;
    removalPM25 += calc.pollutantResults.PM25.monthlyRemovalKg;

    return calc;
  });

  const summary: WeselySummary = {
    timestamp: new Date().toISOString(),
    parWm2,
    airTempC,
    rhPct,
    ustarMs,
    totalVegetatedAreaHa: parseFloat(totalAreaHa.toFixed(1)),
    totalMonthlyRemovalKg: {
      O3: parseFloat(removalO3.toFixed(1)),
      NO2: parseFloat(removalNO2.toFixed(1)),
      SO2: parseFloat(removalSO2.toFixed(1)),
      PM25: parseFloat(removalPM25.toFixed(1)),
    },
    zones: zoneCalcs,
  };

  weselySummaryCache.set(cacheKey, summary);
  return summary;
}

/**
 * Exporta las zonas vegetadas y tasas de deposición a GeoJSON
 */
export function generateWeselyGeoJson(summary: WeselySummary): any {
  return {
    type: 'FeatureCollection',
    features: summary.zones.map((z) => {
      const zoneLoc = MALAGA_GREEN_ZONES.find((m) => m.id === z.zoneId);
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [zoneLoc?.lon || -4.42, zoneLoc?.lat || 36.72],
        },
        properties: {
          id: z.zoneId,
          nombre: z.zoneName,
          area_ha: z.areaHa,
          lai: z.lai,
          vd_O3_cms: z.pollutantResults.O3.vd_cm_s,
          vd_NO2_cms: z.pollutantResults.NO2.vd_cm_s,
          remocion_O3_kg_mes: z.pollutantResults.O3.monthlyRemovalKg,
          remocion_NO2_kg_mes: z.pollutantResults.NO2.monthlyRemovalKg,
          remocion_PM25_kg_mes: z.pollutantResults.PM25.monthlyRemovalKg,
        },
      };
    }),
  };
}

export function exportWeselyGeoJson(summary: WeselySummary): string {
  return JSON.stringify(generateWeselyGeoJson(summary), null, 2);
}

export function exportWeselyCsv(summary: WeselySummary): string {
  const headers =
    'zona_id,nombre,area_ha,lai,ra_s_m,rb_s_m,rc_o3_s_m,vd_o3_cm_s,remocion_o3_kg_mes,vd_no2_cm_s,remocion_no2_kg_mes,vd_pm25_cm_s,remocion_pm25_kg_mes\n';
  const rows = summary.zones
    .map(
      (z) =>
        `${z.zoneId},"${z.zoneName}",${z.areaHa},${z.lai},${z.pollutantResults.O3.ra_s_m},${z.pollutantResults.O3.rb_s_m},${z.pollutantResults.O3.rc_s_m},${z.pollutantResults.O3.vd_cm_s},${z.pollutantResults.O3.monthlyRemovalKg},${z.pollutantResults.NO2.vd_cm_s},${z.pollutantResults.NO2.monthlyRemovalKg},${z.pollutantResults.PM25.vd_cm_s},${z.pollutantResults.PM25.monthlyRemovalKg}`
    )
    .join('\n');
  return headers + rows;
}

/**
 * =================================================================================================
 * MOTOR DETERMINISTA DE MICROFÍSICA DEL TERRAL DE MÁLAGA (VIENTO FOEHN DEL GUADALHORCE)
 * Tesis Doctoral: Disrupción Estomática, Paradoja de Sumidero de NO2 y Cinética Térmica de Arrhenius
 * =================================================================================================
 */

export interface TerralMeteoDiagnostics {
  airTempC: number;
  rhPct: number;
  esKpa: number;              // Presión saturada Tetens (kPa)
  eaKpa: number;              // Presión de vapor real (kPa)
  vpdKpa: number;             // Déficit de presión de vapor VPD = es - ea (kPa)
  fVpd: number;               // Factor de respuesta Jarvis-Stewart f(VPD) [0.02 - 1.0]
  fTemp: number;              // Factor de estrés térmico [0.01 - 1.0]
  stomatalAperturePct: number;// Apertura estomática relativa (%)
  isTerralActive: boolean;    // Criterio normativo AEMET: T >= 30°C y RH <= 30%
  terralSeverity: 'no_terral' | 'moderado' | 'severo' | 'extremo';
  arrheniusRateK: number;     // Constante k_NO+O3 (cm³/molec·s) a la temperatura actual
  arrhenius20C: number;       // Constante a 20°C (1.734e-14 cm³/molec·s)
  leightonAccelerationRatio: number; // Ratio de aceleración térmica k(T) / k(20°C)
  pblhHeightM: number;        // Altura de capa límite convectiva inducida por calentamiento adiabático (m)
}

export interface TreeSpeciesTerralComparison {
  species: MalagaTreeSpeciesWeselyProfile;
  // Escenario Brisa Marina / Estándar (Levante T=24°C, RH=65%)
  vdLevanteNO2_cm_s: number;
  rsLevante_s_m: number;
  fluxLevanteNO2_ug_m2_s: number;
  // Escenario Terral Guadalhorce
  vdTerralNO2_cm_s: number;
  rsTerral_s_m: number;
  fluxTerralNO2_ug_m2_s: number;
  // Impacto cuantitativo
  vdDropPct: number;
  stomatalResistanceIncreaseFactor: number;
  physiologicalStatus: 'Apertura Óptima' | 'Estrés Hídrico Moderado' | 'Cierre Estomático Completo (Cavitación Evitada)';
}

export interface TerralCanopyDisruptionSummary {
  timestamp: string;
  diagnostics: TerralMeteoDiagnostics;
  speciesComparisons: TreeSpeciesTerralComparison[];
  baselineSummary: WeselySummary;
  terralSummary: WeselySummary;
  // Balances de penalización a escala ciudad
  totalNO2RemovalDropKgDay: number;
  totalO3RemovalDropKgDay: number;
  totalMonthlyPenaltyKgNO2: number;
  totalMonthlyPenaltyKgO3: number;
  avgNO2VdDropPct: number;
  scientificVerdict: string;
}

/**
 * Diagnóstico microfísico del Terral de Málaga
 */
export function computeTerralMeteoDiagnostics(
  airTempC: number,
  rhPct: number,
  parWm2: number = 650,
  ustarMs: number = 0.42
): TerralMeteoDiagnostics {
  // Tetens formulation
  const esKpa = 0.61078 * Math.exp((17.27 * airTempC) / (airTempC + 237.3));
  const clampedRh = Math.max(5, Math.min(100, rhPct));
  const eaKpa = esKpa * (clampedRh / 100);
  const vpdKpa = Math.max(0.01, esKpa - eaKpa);

  // Jarvis-Stewart response
  const fVpd = Math.max(0.02, Math.min(1.0, Math.exp(-0.52 * Math.max(0, vpdKpa - 1.0))));
  const tempDenom = airTempC >= 40 ? 0.5 : Math.max(1, airTempC * (40 - airTempC));
  const tempFactor = Math.max(1.0, 400 / tempDenom);
  const fTemp = 1.0 / tempFactor;

  const stomatalAperturePct = Number((fVpd * fTemp * 100).toFixed(1));

  // Criterio climatológico oficial del Terral en Málaga: Viento catabático del NW/WNW con T >= 30°C y RH <= 30%
  const isTerralActive = airTempC >= 30.0 && clampedRh <= 30.0;

  let terralSeverity: 'no_terral' | 'moderado' | 'severo' | 'extremo' = 'no_terral';
  if (isTerralActive) {
    if (airTempC >= 40.0 || clampedRh <= 18.0) {
      terralSeverity = 'extremo';
    } else if (airTempC >= 35.0 || clampedRh <= 25.0) {
      terralSeverity = 'severo';
    } else {
      terralSeverity = 'moderado';
    }
  }

  // Constante de Arrhenius k_NO+O3(T) = 2.07e-12 * exp(-1400 / (T + 273.15)) cm³/molec·s
  const tKelvin = airTempC + 273.15;
  const arrheniusRateK = 2.07e-12 * Math.exp(-1400 / tKelvin);
  const arrhenius20C = 2.07e-12 * Math.exp(-1400 / 293.15); // 1.734e-14
  const leightonAccelerationRatio = Number((arrheniusRateK / arrhenius20C).toFixed(3));

  // Altura de Capa Límite Convectiva Urbana PBLH modulada por el flujo de calor sensible
  // En Terral Foehn, la compresión y fuerte radiación elevan la PBLH hasta 1800-2400 m
  const basePblh = 800;
  const thermalConvection = Math.max(0, (airTempC - 20) * 45);
  const windConvection = ustarMs * 350;
  const pblhHeightM = Math.min(2600, Math.round(basePblh + thermalConvection + windConvection));

  return {
    airTempC,
    rhPct: clampedRh,
    esKpa: Number(esKpa.toFixed(2)),
    eaKpa: Number(eaKpa.toFixed(2)),
    vpdKpa: Number(vpdKpa.toFixed(2)),
    fVpd: Number(fVpd.toFixed(3)),
    fTemp: Number(fTemp.toFixed(3)),
    stomatalAperturePct,
    isTerralActive,
    terralSeverity,
    arrheniusRateK,
    arrhenius20C,
    leightonAccelerationRatio,
    pblhHeightM,
  };
}

/**
 * Evaluación integral de disrupción canópica durante episodios de Terral
 */
export function calculateTerralCanopyDisruptionSummary(
  parWm2: number = 650,
  airTempC: number = 41.5,
  rhPct: number = 18.0,
  ustarMs: number = 0.42,
  concNO2: number = 38.0,
  concO3: number = 85.0
): TerralCanopyDisruptionSummary {
  const diagnostics = computeTerralMeteoDiagnostics(airTempC, rhPct, parWm2, ustarMs);

  // Escenario de Referencia: Brisa Marina de Levante (Málaga estándar estival: 24°C, 68% RH)
  const baselineTempC = 24.0;
  const baselineRhPct = 68.0;
  const baselineSummary = calculateWeselyDryDepositionSummary(
    parWm2,
    baselineTempC,
    baselineRhPct,
    ustarMs,
    { O3: concO3, NO2: concNO2, SO2: 4.5, PM25: 14.0 }
  );

  // Escenario Terral Guadalhorce
  const terralSummary = calculateWeselyDryDepositionSummary(
    parWm2,
    airTempC,
    rhPct,
    ustarMs,
    { O3: concO3, NO2: concNO2, SO2: 4.5, PM25: 14.0 }
  );

  // Comparativa por especie arbórea representativa de Málaga
  const speciesComparisons: TreeSpeciesTerralComparison[] = MALAGA_TREE_SPECIES_WESELY_PROFILES.map((species) => {
    const levanteRes = calculateWeselyForTreeSpecies(species, 'NO2', parWm2, baselineTempC, ustarMs, concNO2, baselineRhPct);
    const terralRes = calculateWeselyForTreeSpecies(species, 'NO2', parWm2, airTempC, ustarMs, concNO2, rhPct);

    const vdDropPct = Number((((levanteRes.vd_cm_s - terralRes.vd_cm_s) / Math.max(1e-4, levanteRes.vd_cm_s)) * 100).toFixed(1));
    const rsIncreaseFactor = Number((terralRes.rs_s_m / Math.max(1, levanteRes.rs_s_m)).toFixed(1));

    let physiologicalStatus: TreeSpeciesTerralComparison['physiologicalStatus'] = 'Apertura Óptima';
    if (diagnostics.vpdKpa > 3.0 || airTempC >= 38) {
      physiologicalStatus = 'Cierre Estomático Completo (Cavitación Evitada)';
    } else if (diagnostics.vpdKpa > 1.8) {
      physiologicalStatus = 'Estrés Hídrico Moderado';
    }

    return {
      species,
      vdLevanteNO2_cm_s: levanteRes.vd_cm_s,
      rsLevante_s_m: levanteRes.rs_s_m,
      fluxLevanteNO2_ug_m2_s: levanteRes.dryFluxUgm2s,
      vdTerralNO2_cm_s: terralRes.vd_cm_s,
      rsTerral_s_m: terralRes.rs_s_m,
      fluxTerralNO2_ug_m2_s: terralRes.dryFluxUgm2s,
      vdDropPct,
      stomatalResistanceIncreaseFactor: rsIncreaseFactor,
      physiologicalStatus,
    };
  });

  // Cálculo de penalizaciones de sumidero a escala urbana (kg/día y kg/mes)
  const totalMonthlyPenaltyKgNO2 = Number((baselineSummary.totalMonthlyRemovalKg.NO2 - terralSummary.totalMonthlyRemovalKg.NO2).toFixed(1));
  const totalMonthlyPenaltyKgO3 = Number((baselineSummary.totalMonthlyRemovalKg.O3 - terralSummary.totalMonthlyRemovalKg.O3).toFixed(1));

  const totalNO2RemovalDropKgDay = Number((totalMonthlyPenaltyKgNO2 / 30).toFixed(2));
  const totalO3RemovalDropKgDay = Number((totalMonthlyPenaltyKgO3 / 30).toFixed(2));

  const avgNO2VdDropPct = Number(
    (speciesComparisons.reduce((acc, c) => acc + c.vdDropPct, 0) / Math.max(1, speciesComparisons.length)).toFixed(1)
  );

  let scientificVerdict = '';
  if (diagnostics.isTerralActive) {
    scientificVerdict = `EPISODIO TERRAL ACTIVO (${diagnostics.terralSeverity.toUpperCase()}): Déficit de presión de vapor extremo (VPD = ${diagnostics.vpdKpa} kPa). Los árboles urbanos de Málaga cierran estomas para evitar la embolia de xilema (resistencia foliar multiplicada x${speciesComparisons[0]?.stomatalResistanceIncreaseFactor ?? 10}), colapsando el sumidero de NO₂ un ${avgNO2VdDropPct}%. Simultáneamente, la reacción de Arrhenius k(NO+O₃) se acelera un +${((diagnostics.leightonAccelerationRatio - 1) * 100).toFixed(0)}%, intensificando la conversión química a NO₂ a nivel de acera.`;
  } else {
    scientificVerdict = `RÉGIMEN NO-TERRAL (Condiciones Marinas / Levante): Humedad relativa del ${rhPct}% y VPD = ${diagnostics.vpdKpa} kPa permiten apertura estomática óptima (${diagnostics.stomatalAperturePct}%). El sumidero biogénico vegetal de Málaga remueve ${baselineSummary.totalMonthlyRemovalKg.NO2} kg/mes de NO₂ y ${baselineSummary.totalMonthlyRemovalKg.O3} kg/mes de O₃.`;
  }

  return {
    timestamp: new Date().toISOString(),
    diagnostics,
    speciesComparisons,
    baselineSummary,
    terralSummary,
    totalNO2RemovalDropKgDay,
    totalO3RemovalDropKgDay,
    totalMonthlyPenaltyKgNO2,
    totalMonthlyPenaltyKgO3,
    avgNO2VdDropPct,
    scientificVerdict,
  };
}

/**
 * Genera bloque LaTeX citable para la memoria doctoral o presentación Beamer
 */
export function generateTerralDisruptionLatex(summary: TerralCanopyDisruptionSummary): string {
  const d = summary.diagnostics;
  return `% Tabla LaTeX para Tesis Doctoral: Microfísica del Terral de Málaga y Disrupción Estomática
\\begin{table}[htbp]
\\centering
\\caption{Impacto del Viento Terral del Guadalhorce en el Sumidero Vegetal de $\\text{NO}_2$ y Cinética de Leighton}
\\label{tab:terral_disrupcion_estomatica_malaga}
\\begin{tabular}{lcccc}
\\hline
\\textbf{Especie Arbórea} & \\textbf{$v_d$ Levante (cm/s)} & \\textbf{$v_d$ Terral (cm/s)} & \\textbf{Caída $v_d$ (\\%)} & \\textbf{Incremento $R_{\\text{sto}}$} \\\\
\\hline
${summary.speciesComparisons
  .map(
    (c) =>
      `${c.species.scientificName} & ${c.vdLevanteNO2_cm_s.toFixed(3)} & ${c.vdTerralNO2_cm_s.toFixed(3)} & -${c.vdDropPct.toFixed(1)}\\% & $\\times${c.stomatalResistanceIncreaseFactor.toFixed(1)}$ \\\\`
  )
  .join('\n')}
\\hline
\\multicolumn{5}{l}{\\small Diagnóstico: $T = ${d.airTempC}^\\circ\\text{C}$, $\\text{RH} = ${d.rhPct}\\%$, $\\text{VPD} = ${d.vpdKpa}\\,\\text{kPa}$, Aceleración Arrhenius: $+${((d.leightonAccelerationRatio - 1) * 100).toFixed(0)}\\%$} \\\\
\\multicolumn{5}{l}{\\small Déficit de sumidero a escala urbana: $-${summary.totalMonthlyPenaltyKgNO2}\\,\\text{kg/mes}$ de $\\text{NO}_2$ ($-${summary.totalNO2RemovalDropKgDay}\\,\\text{kg/día}$).} \\\\
\\hline
\\end{tabular}
\\end{table}`;
}

/**
 * Exporta el análisis comparativo del Terral a CSV FAIR
 */
export function exportTerralDisruptionCsv(summary: TerralCanopyDisruptionSummary): string {
  const d = summary.diagnostics;
  const header =
    'especie,nombre_cientifico,vd_levante_cm_s,vd_terral_cm_s,caida_vd_pct,rs_levante_s_m,rs_terral_s_m,factor_incremento_rs,flujo_levante_ug_m2_s,flujo_terral_ug_m2_s,estado_fisiologico\n';
  const rows = summary.speciesComparisons
    .map(
      (c) =>
        `"${c.species.commonName}","${c.species.scientificName}",${c.vdLevanteNO2_cm_s},${c.vdTerralNO2_cm_s},${c.vdDropPct},${c.rsLevante_s_m},${c.rsTerral_s_m},${c.stomatalResistanceIncreaseFactor},${c.fluxLevanteNO2_ug_m2_s},${c.fluxTerralNO2_ug_m2_s},"${c.physiologicalStatus}"`
    )
    .join('\n');
  const metadata = `\n# Metadata: Temp_C=${d.airTempC}, RH_pct=${d.rhPct}, VPD_kPa=${d.vpdKpa}, Terral_Active=${d.isTerralActive}, Arrhenius_Acceleration=${d.leightonAccelerationRatio}, Monthly_Penalty_kg_NO2=${summary.totalMonthlyPenaltyKgNO2}\n`;
  return header + rows + metadata;
}

/**
 * =================================================================================================
 * PRIMICIA MUNDIAL TESIS: PARADOJA AERODINÁMICA DEL DOSEL ARBÓREO & TOLDOS DE CALLE LARIOS
 * Crossover Crítico LAI_crit (Wesely Bio-Sink vs. Oke Vortex Trapping) y Microfísica de Toldos
 * Fundamentación: Vos et al. (2013), Jeanjean et al. (2017), Abhijith et al. (2017), Rotterdam (2025)
 * =================================================================================================
 */

export interface CanopyTrappingCurvePoint {
  lai: number;
  ach_s1: number;                 // Tasa de renovación de aire de cañón (s⁻¹)
  achDropPct: number;             // Caída de ventilación por arrastre de la copa (%)
  bioRemovalRate_s1: number;      // Tasa de secuestro biológico estomático Wesely (s⁻¹)
  netDissipationRate_s1: number;  // Tasa neta K_net = ACH + R_bio (s⁻¹)
  cPedestrianUgm3: number;        // Concentración peatonal resultante a cota 1.8m (µg/m³)
  deltaVsNoTreesUgm3: number;     // Diferencia neta respecto a calle sin árboles (µg/m³)
  aeroToBioRatio: number;         // Ratio (Pérdida ventilación / Ganancia biológica)
  regime: 'Beneficio Neto (Depuración)' | 'Punto de Inflexión Crítico' | 'Atrapamiento Dominante (Polución Retenida)';
}

export interface CanopyAerodynamicTrappingResult {
  timestamp: string;
  streetName: string;
  canyonH: number;
  canyonW: number;
  aspectRatioHW: number;
  flowRegime: 'Isolated Roughness Flow' | 'Wake Interference Flow' | 'Skimming Flow (Vórtice Confinado)';
  selectedSpecies: MalagaTreeSpeciesWeselyProfile;
  laiCurrent: number;
  laiCritical: number;           // Umbral analítico donde dC/dLAI = 0
  isCurrentlyTrapping: boolean;   // ¿Está el arbolado actual en régimen de atrapamiento?
  pedestrianConcCurrentUgm3: number;
  pedestrianConcNoTreesUgm3: number;
  pedestrianConcOptimalUgm3: number;
  currentNetDeltaUgm3: number;
  ventilationPenaltyPct: number;
  bioRemovalGainUgm3: number;
  curvePoints: CanopyTrappingCurvePoint[];
  doctoralVerdict: string;
}

export interface CalleLariosAwningResult {
  timestamp: string;
  streetName: string;
  canyonH: number;
  canyonW: number;
  aspectRatioHW: number;
  awningHeightM: number;
  textilePorosity: number;
  // Sin toldos
  noAwning: {
    uvTransmittancePct: number;
    jNO2_s1: number;
    pavementTempC: number;
    ach_s1: number;
    airResidenceTimeSec: number;
    pedestrianNO2Ugm3: number;
  };
  // Con toldos estivales
  withAwning: {
    uvTransmittancePct: number;
    jNO2_s1: number;
    pavementTempC: number;
    ach_s1: number;
    airResidenceTimeSec: number;
    pedestrianNO2Ugm3: number;
  };
  // Compromiso bioclimático (Trade-off)
  coolingBenefitDegC: number;
  photochemicalShieldingPct: number;
  ventilationTrapFactor: number;
  netNO2DeltaUgm3: number;
  bioclimaticTradeOffVerdict: string;
}

/**
 * Resuelve la Paradoja del Dosel Urbano: Competición entre Deposición Wesely y Bloqueo de Vórtice
 */
export function computeCanopyAerodynamicTrapping(params: {
  streetName?: string;
  canyonH?: number;
  canyonW?: number;
  windSpeedRoofMs?: number;
  trafficEmissionNOx_ug_m_s?: number;
  backgroundNO2_ugm3?: number;
  speciesProfile?: MalagaTreeSpeciesWeselyProfile;
  tempC?: number;
  rhPct?: number;
  parWm2?: number;
}): CanopyAerodynamicTrappingResult {
  const streetName = params.streetName ?? 'Paseo del Parque / Alameda Principal';
  const H = Math.max(8.0, params.canyonH ?? 18.0);
  const W = Math.max(8.0, params.canyonW ?? 20.0);
  const HW = Number((H / W).toFixed(2));
  const uRoof = Math.max(0.5, params.windSpeedRoofMs ?? 3.2);
  const emission = Math.max(10.0, params.trafficEmissionNOx_ug_m_s ?? 110.0);
  const bgNO2 = Math.max(5.0, params.backgroundNO2_ugm3 ?? 22.0);
  const species = params.speciesProfile ?? MALAGA_TREE_SPECIES_WESELY_PROFILES[1]; // Platanus hispanica
  const tempC = params.tempC ?? 26.0;
  const rhPct = params.rhPct ?? 58.0;
  const parWm2 = params.parWm2 ?? 600.0;

  // Régimen de flujo según criterio canónico de Oke (1987)
  let flowRegime: CanopyAerodynamicTrappingResult['flowRegime'] = 'Isolated Roughness Flow';
  if (HW >= 0.65) {
    flowRegime = 'Skimming Flow (Vórtice Confinado)';
  } else if (HW >= 0.35) {
    flowRegime = 'Wake Interference Flow';
  }

  // Tasa de renovación base sin árboles ACH0 (Oke 1987 / Soulhac 2008)
  // Intercambio por cizalladura turbulenta en el tejado
  const exchangeCoeff = HW >= 0.65 ? 0.075 : HW >= 0.35 ? 0.095 : 0.125;
  const ach0 = Number(((exchangeCoeff * uRoof) / H).toFixed(5));

  // Coeficiente de arrastre foliar beta_aero dependiente de la relación de aspecto H/W
  const betaAero = 0.14 * Math.pow(Math.max(0.5, HW), 0.75);

  // Malla analítica de densidades de área foliar LAI de 0 a 8
  const testLais = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0, 8.0];

  // Cálculo de la velocidad de deposición biológica de Wesely por unidad de LAI
  // Calculamos Vd base para la especie
  const weselyBase = calculateWeselyForTreeSpecies(species, 'NO2', parWm2, tempC, 0.35, 35.0, rhPct);
  const vdBase_m_s = (weselyBase.vd_cm_s * 0.01); // m/s

  let cNoTrees = 0;
  const curvePoints: CanopyTrappingCurvePoint[] = [];

  testLais.forEach((lai) => {
    // 1. Tasa de ventilación atenuada por Darcy-Forchheimer en copa porosa
    const ach = Number((ach0 * Math.exp(-betaAero * lai)).toFixed(5));
    const achDropPct = Number((((ach0 - ach) / ach0) * 100).toFixed(1));

    // 2. Tasa de remoción biológica foliar Wesely por unidad de volumen de calle
    // R_bio = (V_d * LAI) / H  (s⁻¹)
    const rBio = Number(((vdBase_m_s * Math.max(0.1, lai)) / H).toFixed(5));

    // 3. Tasa de disipación total K_net = ACH + R_bio
    const kNet = (lai === 0) ? ach0 : (ach + rBio);

    // 4. Concentración peatonal C = E / (W * H * K_net) + C_background
    const volumeDilution = W * H * kNet;
    const cPed = Number(((emission / volumeDilution) + bgNO2).toFixed(2));

    if (lai === 0) {
      cNoTrees = cPed;
    }

    const deltaVsNoTrees = Number((cPed - cNoTrees).toFixed(2));
    const aeroLoss = ach0 - ach;
    const aeroToBioRatio = rBio > 0 ? Number((aeroLoss / rBio).toFixed(2)) : 0;

    let pointRegime: CanopyTrappingCurvePoint['regime'] = 'Beneficio Neto (Depuración)';
    if (deltaVsNoTrees > 0.3) {
      pointRegime = 'Atrapamiento Dominante (Polución Retenida)';
    } else if (Math.abs(deltaVsNoTrees) <= 0.3 && lai > 0) {
      pointRegime = 'Punto de Inflexión Crítico';
    }

    curvePoints.push({
      lai,
      ach_s1: ach,
      achDropPct,
      bioRemovalRate_s1: rBio,
      netDissipationRate_s1: Number(kNet.toFixed(5)),
      cPedestrianUgm3: cPed,
      deltaVsNoTreesUgm3: deltaVsNoTrees,
      aeroToBioRatio,
      regime: pointRegime,
    });
  });

  // Localización analítica de LAI crítico (mínimo de la curva de concentración)
  let minConc = 999999;
  let laiCritical = 0;
  curvePoints.forEach((p) => {
    if (p.cPedestrianUgm3 < minConc) {
      minConc = p.cPedestrianUgm3;
      laiCritical = p.lai;
    }
  });

  const currentPoint = curvePoints.find(p => p.lai >= species.defaultLAI) || curvePoints[curvePoints.length - 1];
  const isCurrentlyTrapping = currentPoint.cPedestrianUgm3 > cNoTrees;

  const currentDelta = Number((currentPoint.cPedestrianUgm3 - cNoTrees).toFixed(2));
  const ventilationPenaltyPct = currentPoint.achDropPct;
  const bioRemovalGainUgm3 = Number((cNoTrees - (cNoTrees / (1 + (currentPoint.bioRemovalRate_s1 / ach0)))).toFixed(2));

  let doctoralVerdict = '';
  if (HW >= 0.8 && isCurrentlyTrapping) {
    doctoralVerdict = `PARADOJA DE ATRAPAMIENTO CONFIRMADA en ${streetName}: La relación de aspecto profunda (H/W = ${HW}) confina el vórtice de Oke. La frondosidad de '${species.commonName}' (LAI = ${species.defaultLAI}) frena la ventilación del cañón un ${ventilationPenaltyPct}%, superando su capacidad biológica de absorción foliar. La concentración peatonal sube +${currentDelta} µg/m³ respecto a la calle sin árboles. El umbral crítico óptimo es LAI_crit = ${laiCritical}. Se recomienda poda de aclareo o especies de copa permeable.`;
  } else if (HW >= 0.8 && !isCurrentlyTrapping) {
    doctoralVerdict = `RÉGIMEN SUB-CRÍTICO en ${streetName}: El arbolado actual (LAI = ${species.defaultLAI}) se encuentra cerca del óptimo (LAI_crit = ${laiCritical}), logrando una reducción neta de ${Math.abs(currentDelta)} µg/m³ de NO₂ en la acera. Si la masa foliar superase LAI = ${laiCritical + 1.5}, comenzaría el atrapamiento aerodinámico.`;
  } else {
    doctoralVerdict = `RÉGIMEN VENTILADO (H/W = ${HW}): Cañón amplio con ventilación transversal no confinada. El arbolado actúa como sumidero neto sin riesgo de estrangulamiento aerodinámico. Cada incremento foliar depura el aire (reducción de ${Math.abs(currentDelta)} µg/m³).`;
  }

  return {
    timestamp: new Date().toISOString(),
    streetName,
    canyonH: H,
    canyonW: W,
    aspectRatioHW: HW,
    flowRegime,
    selectedSpecies: species,
    laiCurrent: species.defaultLAI,
    laiCritical,
    isCurrentlyTrapping,
    pedestrianConcCurrentUgm3: currentPoint.cPedestrianUgm3,
    pedestrianConcNoTreesUgm3: cNoTrees,
    pedestrianConcOptimalUgm3: minConc,
    currentNetDeltaUgm3: currentDelta,
    ventilationPenaltyPct,
    bioRemovalGainUgm3,
    curvePoints,
    doctoralVerdict,
  };
}

/**
 * Microfísica de los Toldos Textiles Estivales de Calle Larios (Málaga)
 */
export function computeCalleLariosAwningsImpact(params?: {
  windSpeedMs?: number;
  ambientTempC?: number;
  solarRadWm2?: number;
  baselineNO2Ugm3?: number;
}): CalleLariosAwningResult {
  const streetName = 'Calle Marqués de Larios (Centro Histórico)';
  const canyonH = 21.0;
  const canyonW = 16.0;
  const aspectRatioHW = Number((canyonH / canyonW).toFixed(2)); // 1.31 (Cañón profundo)
  const awningHeightM = 7.5; // Altura de anclaje de las velas textiles
  const textilePorosity = 0.14; // Porosidad de la trama textil microperforada

  const uWind = Math.max(0.5, params?.windSpeedMs ?? 2.4);
  const tAmb = params?.ambientTempC ?? 32.0;
  const solarRad = params?.solarRadWm2 ?? 850.0;
  const baseNO2 = params?.baselineNO2Ugm3 ?? 28.0;

  // 1. CONDICIONES SIN TOLDOS (Escenario despejado solar)
  const uvTransmittance_noAwning = 100.0;
  const jNO2_noAwning = Number((0.0085 * (solarRad / 1000) * 0.72).toFixed(5)); // s⁻¹
  const pavementTemp_noAwning = Number((tAmb + (solarRad / 1000) * 26.5).toFixed(1)); // Pavimento mármol > 54°C
  const ach_noAwning = Number(((0.075 * uWind) / canyonH).toFixed(5)); // s⁻¹
  const residenceTime_noAwning = Number((1 / ach_noAwning).toFixed(0)); // segundos
  const no2_noAwning = baseNO2;

  // 2. CONDICIONES CON TOLDOS ESTIVALES
  // Apantallamiento UV por la lona de sombra (bloqueo fotólisis Leighton)
  const uvTransmittance_withAwning = Number((textilePorosity * 100 + 4.5).toFixed(1)); // ~18.5%
  const jNO2_withAwning = Number((jNO2_noAwning * (uvTransmittance_withAwning / 100)).toFixed(5));
  // Refrigeración del pavimento sombreado
  const pavementTemp_withAwning = Number((tAmb + 2.8).toFixed(1)); // ~34.8°C
  // Tapa aerodinámica: la lona textil incrementa fuertemente la resistencia al escape
  const ach_withAwning = Number((ach_noAwning * (textilePorosity + 0.16)).toFixed(5));
  const residenceTime_withAwning = Number((1 / ach_withAwning).toFixed(0));
  // Penalización por menor ventilación y menor fotólisis diurna del NO2 atrapado
  const trappingFactor = Number((residenceTime_withAwning / residenceTime_noAwning).toFixed(2));
  const no2_withAwning = Number((baseNO2 + (baseNO2 * 0.28 * (trappingFactor - 1) * 0.45)).toFixed(2));

  const coolingBenefitDegC = Number((pavementTemp_noAwning - pavementTemp_withAwning).toFixed(1));
  const photochemicalShieldingPct = Number((100 - uvTransmittance_withAwning).toFixed(1));
  const netNO2Delta = Number((no2_withAwning - no2_noAwning).toFixed(2));

  const bioclimaticTradeOffVerdict = `COMPROMISO BIOCLIMÁTICO DE CALLE LARIOS: Los toldos textiles reducen la temperatura superficial del pavimento de mármol en -${coolingBenefitDegC}°C (confort térmico sobresaliente), pero actúan como una tapa aerodinámica que multiplica por x${trappingFactor} el tiempo de residencia del aire peatonal (${residenceTime_withAwning} s vs ${residenceTime_noAwning} s). Al mismo tiempo, bloquean el ${photochemicalShieldingPct}% de la radiación UV, inhibiendo la fotólisis diurna de Leighton del NO₂. Como resultado, el NO₂ a nivel de acera experimenta un estancamiento anómalo (+${netNO2Delta} µg/m³).`;

  return {
    timestamp: new Date().toISOString(),
    streetName,
    canyonH,
    canyonW,
    aspectRatioHW,
    awningHeightM,
    textilePorosity,
    noAwning: {
      uvTransmittancePct: uvTransmittance_noAwning,
      jNO2_s1: jNO2_noAwning,
      pavementTempC: pavementTemp_noAwning,
      ach_s1: ach_noAwning,
      airResidenceTimeSec: residenceTime_noAwning,
      pedestrianNO2Ugm3: no2_noAwning,
    },
    withAwning: {
      uvTransmittancePct: uvTransmittance_withAwning,
      jNO2_s1: jNO2_withAwning,
      pavementTempC: pavementTemp_withAwning,
      ach_s1: ach_withAwning,
      airResidenceTimeSec: residenceTime_withAwning,
      pedestrianNO2Ugm3: no2_withAwning,
    },
    coolingBenefitDegC,
    photochemicalShieldingPct,
    ventilationTrapFactor: trappingFactor,
    netNO2DeltaUgm3: netNO2Delta,
    bioclimaticTradeOffVerdict,
  };
}

/**
 * Genera bloque LaTeX citable para la memoria doctoral
 */
export function generateCanopyParadojaLatex(
  trappingResult: CanopyAerodynamicTrappingResult,
  awningResult: CalleLariosAwningResult
): string {
  return `% Tabla LaTeX para Tesis Doctoral: Paradoja del Dosel Urbano y Toldos Textiles de Málaga
\\begin{table}[htbp]
\\centering
\\caption{Evaluación Mecanística del Umbral Crítico $LAI_{\\text{crit}}$ y Microfísica de Toldos en Málaga}
\\label{tab:paradoja_dosel_toldos_malaga}
\\begin{tabular}{lcccc}
\\hline
\\textbf{Configuración Urbana} & \\textbf{Relación $H/W$} & \\textbf{Parámetro Clave} & \\textbf{Efecto $ACH$} & \\textbf{Impacto $\\text{NO}_2$ Acera} \\\\
\\hline
${trappingResult.streetName} (Sin árboles) & ${trappingResult.aspectRatioHW} & $\\text{LAI} = 0.0$ & $ACH_0 = ${trappingResult.curvePoints[0]?.ach_s1 ?? '0.015'}\\,\\text{s}^{-1}$ & ${trappingResult.pedestrianConcNoTreesUgm3}\\,\\mu\\text{g}/\\text{m}^3$ \\\\
${trappingResult.streetName} (Actual: ${trappingResult.selectedSpecies.commonName}) & ${trappingResult.aspectRatioHW} & $\\text{LAI} = ${trappingResult.laiCurrent}$ & -${trappingResult.ventilationPenaltyPct}\\% & ${trappingResult.pedestrianConcCurrentUgm3}\\,\\mu\\text{g}/\\text{m}^3$ (${trappingResult.currentNetDeltaUgm3 > 0 ? '+' : ''}${trappingResult.currentNetDeltaUgm3}\\,\\mu\\text{g}/\\text{m}^3$) \\\\
${trappingResult.streetName} (Óptimo Teórico) & ${trappingResult.aspectRatioHW} & $LAI_{\\text{crit}} = ${trappingResult.laiCritical}$ & Óptimo & ${trappingResult.pedestrianConcOptimalUgm3}\\,\\mu\\text{g}/\\text{m}^3$ \\\\
\\hline
Calle Larios (Sin toldos) & ${awningResult.aspectRatioHW} & $\\text{UV} = 100\\%$ & $\\tau = ${awningResult.noAwning.airResidenceTimeSec}\\,\\text{s}$ & ${awningResult.noAwning.pedestrianNO2Ugm3}\\,\\mu\\text{g}/\\text{m}^3$ ($T_{\\text{pav}} = ${awningResult.noAwning.pavementTempC}^\\circ\\text{C}$) \\\\
Calle Larios (Con toldos estivales) & ${awningResult.aspectRatioHW} & $\\text{UV} = ${awningResult.withAwning.uvTransmittancePct}\\%$ & $\\tau = ${awningResult.withAwning.airResidenceTimeSec}\\,\\text{s}$ ($\\times${awningResult.ventilationTrapFactor}$) & ${awningResult.withAwning.pedestrianNO2Ugm3}\\,\\mu\\text{g}/\\text{m}^3$ ($T_{\\text{pav}} = ${awningResult.withAwning.pavementTempC}^\\circ\\text{C}$) \\\\
\\hline
\\multicolumn{5}{l}{\\small Conclusión: En cañones profundos ($H/W \\ge 0.8$), densidades foliares $\\text{LAI} > LAI_{\\text{crit}}$ inducen atrapamiento aerodinámico.} \\\\
\\hline
\\end{tabular}
\\end{table}`;
}

/**
 * Exporta los resultados de la paradoja del dosel a formato CSV FAIR
 */
export function exportCanopyParadojaCsv(
  trappingResult: CanopyAerodynamicTrappingResult,
  awningResult: CalleLariosAwningResult
): string {
  const headers = 'lai,ach_s1,caida_ach_pct,tasa_bio_wesely_s1,tasa_disipacion_neta_s1,no2_peatonal_ugm3,delta_no2_ugm3,ratio_aero_bio,regimen\n';
  const rows = trappingResult.curvePoints
    .map(p => `${p.lai},${p.ach_s1},${p.achDropPct},${p.bioRemovalRate_s1},${p.netDissipationRate_s1},${p.cPedestrianUgm3},${p.deltaVsNoTreesUgm3},${p.aeroToBioRatio},"${p.regime}"`)
    .join('\n');
  const metadata = `\n# Metadata: Street=${trappingResult.streetName}, HW=${trappingResult.aspectRatioHW}, FlowRegime=${trappingResult.flowRegime}, LAI_crit=${trappingResult.laiCritical}, Larios_Cooling=${awningResult.coolingBenefitDegC}C, Larios_TrapFactor=${awningResult.ventilationTrapFactor}\n`;
  return headers + rows + metadata;
}


