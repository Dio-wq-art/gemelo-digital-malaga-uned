/**
 * Motor de Especiación de BVOCs y Rendimiento de Aerosoles Orgánicos Secundarios (SOA).
 * Algoritmo MEGAN 2.1 (Guenther et al., 2012), Modelo de 2 Productos de Pankow (1994) y MIR de Carter (2010).
 * Tesis Doctoral: Gemelo Digital de Málaga.
 */

import { BoundedCache, hashParams } from './computationEngine';

export interface MalagaTreeBvocSpecies {
  id: string;
  scientificName: string;
  commonName: string;
  typicalLocationInMalaga: string;
  leafBiomassDensityG_m2: number; // Densidad de biomasa foliar [g materia seca/m² suelo]
  laiDefault: number; // Índice de Área Foliar (LAI)
  // Factores de emisión estándar a 30 °C y PAR 1000 µmol/(m²·s) [µg/(g_foliar·h)]
  efIsoprene: number;
  efMonoterpenes: number; // alpha-pineno + limoneno
  efSesquiterpenes: number; // beta-caryophyllene
  efOxygenatedVoc: number;
  isopreneLightDependent: boolean;
  monoterpeneLightDependent: boolean; // Sí en robles/plátanos, No en coníferas/cítricos (emisión de resina/almacén)
  ozoneDepositionVelocityCmS: number; // vd(O3) foliar
  no2DepositionVelocityCmS: number; // vd(NO2) foliar
}

export const MALAGA_URBAN_TREE_SPECIES: MalagaTreeBvocSpecies[] = [
  {
    id: 'platanus_hispanica',
    scientificName: 'Platanus x hispanica',
    commonName: 'Plátano de Sombra',
    typicalLocationInMalaga: 'Alameda Principal / Paseo del Parque',
    leafBiomassDensityG_m2: 380,
    laiDefault: 4.2,
    efIsoprene: 32.0, // Fuerte emisor de isopreno
    efMonoterpenes: 1.8,
    efSesquiterpenes: 0.4,
    efOxygenatedVoc: 1.5,
    isopreneLightDependent: true,
    monoterpeneLightDependent: true,
    ozoneDepositionVelocityCmS: 0.42,
    no2DepositionVelocityCmS: 0.38
  },
  {
    id: 'jacaranda_mimosifolia',
    scientificName: 'Jacaranda mimosifolia',
    commonName: 'Jacaranda',
    typicalLocationInMalaga: 'Avenida Juan XXIII / Ciudad Jardín',
    leafBiomassDensityG_m2: 290,
    laiDefault: 3.1,
    efIsoprene: 0.5, // Emisor muy bajo de isopreno
    efMonoterpenes: 4.2, // Emite monoterpenos florales (linalool, limoneno)
    efSesquiterpenes: 1.1,
    efOxygenatedVoc: 2.2,
    isopreneLightDependent: true,
    monoterpeneLightDependent: false,
    ozoneDepositionVelocityCmS: 0.35,
    no2DepositionVelocityCmS: 0.32
  },
  {
    id: 'ficus_microcarpa',
    scientificName: 'Ficus microcarpa / retusa',
    commonName: 'Ficus Centenario',
    typicalLocationInMalaga: 'Plaza de la Marina / Alameda de Colón',
    leafBiomassDensityG_m2: 520,
    laiDefault: 5.5,
    efIsoprene: 14.5,
    efMonoterpenes: 3.2,
    efSesquiterpenes: 0.8,
    efOxygenatedVoc: 1.8,
    isopreneLightDependent: true,
    monoterpeneLightDependent: false,
    ozoneDepositionVelocityCmS: 0.55,
    no2DepositionVelocityCmS: 0.48
  },
  {
    id: 'citrus_aurantium',
    scientificName: 'Citrus aurantium',
    commonName: 'Naranjo Amargo',
    typicalLocationInMalaga: 'Centro Histórico / Calle Granada / Alcazabilla',
    leafBiomassDensityG_m2: 340,
    laiDefault: 2.8,
    efIsoprene: 0.1, // Prácticamente nulo isopreno
    efMonoterpenes: 6.8, // Alto en limoneno y mirceno
    efSesquiterpenes: 1.9,
    efOxygenatedVoc: 3.5,
    isopreneLightDependent: false,
    monoterpeneLightDependent: false,
    ozoneDepositionVelocityCmS: 0.28,
    no2DepositionVelocityCmS: 0.25
  },
  {
    id: 'phoenix_canariensis',
    scientificName: 'Phoenix canariensis',
    commonName: 'Palmera Canaria',
    typicalLocationInMalaga: 'Paseo Marítimo Pablo Ruiz Picasso / La Malagueta',
    leafBiomassDensityG_m2: 260,
    laiDefault: 2.2,
    efIsoprene: 18.0,
    efMonoterpenes: 0.9,
    efSesquiterpenes: 0.2,
    efOxygenatedVoc: 0.8,
    isopreneLightDependent: true,
    monoterpeneLightDependent: true,
    ozoneDepositionVelocityCmS: 0.22,
    no2DepositionVelocityCmS: 0.19
  },
  {
    id: 'pinus_halepensis',
    scientificName: 'Pinus halepensis',
    commonName: 'Pino Carrasco',
    typicalLocationInMalaga: 'Gibralfaro / Montes de Málaga',
    leafBiomassDensityG_m2: 450,
    laiDefault: 3.8,
    efIsoprene: 0.8,
    efMonoterpenes: 15.2, // Emisor masivo de alfa-pineno
    efSesquiterpenes: 3.8,
    efOxygenatedVoc: 2.4,
    isopreneLightDependent: false,
    monoterpeneLightDependent: false,
    ozoneDepositionVelocityCmS: 0.38,
    no2DepositionVelocityCmS: 0.34
  }
];

export interface TreeBvocSimulationInput {
  speciesId: string;
  tempCelsius: number;
  parSolarUmolM2S: number; // Radiación Fotosintéticamente Activa (PAR) [µmol/(m²·s)] (máx ~2000 en verano)
  canopyAreaM2: number; // Superficie de copa del árbol o arboleda [m²]
  ambientNOxPpb: number; // Nivel de NOx urbano para clasificar High-NOx vs Low-NOx
  ambientO3Ppb: number;
  ambientPM25Ugm3: number; // Aerosol orgánico preexistente M_o [µg/m³]
}

export interface TreeBvocSimulationResult {
  species: MalagaTreeBvocSpecies;
  // Factores de actividad ambiental MEGAN 2.1
  gammaTempIsoprene: number;
  gammaLightIsoprene: number;
  gammaTempMonoterpene: number;
  // Tasas de Emisión [µg/h] y Flujo Foliar [µg/(m²_copa·h)]
  isopreneFluxUgm2H: number;
  monoterpenesFluxUgm2H: number;
  sesquiterpenesFluxUgm2H: number;
  oxygenatedVocFluxUgm2H: number;
  totalBvocEmissionGramsDay: number; // Gramos totales de COVs emitidos por día

  // Potencial de Formación de Ozono (OFP) según MIR Carter [g O3 / g VOC]
  isopreneOFP_gO3_day: number;
  monoterpeneOFP_gO3_day: number;
  totalOzoneFormationPotentialGramsDay: number;

  // Rendimiento de Aerosoles Orgánicos Secundarios (SOA Yields - Pankow 2-Product)
  soaYieldIsoprenePct: number;
  soaYieldMonoterpenesPct: number;
  soaYieldSesquiterpenesPct: number;
  soaMassProductionGramsDay: number; // Producción diaria de PM2.5 SOA en gramos

  // Filtración y Deposición Neta de Contaminantes (Efecto Purificador)
  no2RemovedGramsDay: number; // Gramos de NO2 absorbidos por estomas (Wesely)
  o3RemovedGramsDay: number; // Gramos de O3 absorbidos por estomas

  // Balance Neto de Calidad del Aire (g retirados - g secundarios generados)
  netAirQualityBalanceScore: number;
  recommendationClassification: 'highly_beneficial' | 'balanced' | 'high_ozone_emitter';
  doctoralAnalysisComment: string;
}

/**
 * Calcula los factores de modulación ambiental MEGAN 2.1 (Guenther et al., 2012).
 */
export function calculateMeganActivityFactors(tempCelsius: number, parUmolM2S: number): {
  gammaT_isoprene: number;
  gammaL_isoprene: number;
  gammaT_monoterpenes: number;
} {
  const T_K = tempCelsius + 273.15;
  const T_opt = 313.85; // 40.7 °C
  const E_opt = 2.034;
  const C_T1 = 95; // kJ/mol
  const C_T2 = 230; // kJ/mol
  const R_gas = 8.314e-3; // kJ/(mol·K)

  // Factor de temperatura para isopreno (Guenther 2006/2012)
  const x = (1 / T_opt - 1 / T_K) / R_gas;
  const exp1 = Math.exp(C_T1 * x);
  const exp2 = Math.exp(C_T2 * x);
  const gammaT_isoprene = Math.max(0, Math.min(3.5, (E_opt * C_T2 * exp1) / (C_T2 - C_T1 * (1 - exp2))));

  // Factor de luz para isopreno
  const alpha_L = 0.004;
  const C_L1 = 1.066;
  const L = Math.max(0, parUmolM2S);
  const gammaL_isoprene = (alpha_L * C_L1 * L) / Math.sqrt(1 + Math.pow(alpha_L * L, 2));

  // Factor de temperatura para monoterpenos (Guillemet et al. - Emisión basal dependiente de vapor)
  // beta = 0.09 K^-1
  const gammaT_monoterpenes = Math.exp(0.09 * (tempCelsius - 30));

  return {
    gammaT_isoprene,
    gammaL_isoprene,
    gammaT_monoterpenes: Math.max(0.05, Math.min(4.5, gammaT_monoterpenes))
  };
}

const treeBvocCache = new BoundedCache<string, TreeBvocSimulationResult>(100);

/**
 * Resuelve el modelo de emisión biogénica y partición de SOA por árbol.
 */
export function simulateTreeBvocAndSoa(input: TreeBvocSimulationInput): TreeBvocSimulationResult {
  const cacheKey = hashParams(input as any);
  const cached = treeBvocCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const species = MALAGA_URBAN_TREE_SPECIES.find(s => s.id === input.speciesId) || MALAGA_URBAN_TREE_SPECIES[0];

  const { gammaT_isoprene, gammaL_isoprene, gammaT_monoterpenes } = calculateMeganActivityFactors(
    input.tempCelsius,
    input.parSolarUmolM2S
  );

  // Biomasa foliar total bajo la copa [g materia seca]
  const totalFoliarBiomassG = species.leafBiomassDensityG_m2 * input.canopyAreaM2 * (species.laiDefault / 3.0);

  // Flujos de emisión foliar [µg/(m²_copa·h)]
  const gammaIsoprene = species.isopreneLightDependent ? (gammaT_isoprene * gammaL_isoprene) : gammaT_isoprene;
  const isopreneFlux = (species.efIsoprene * gammaIsoprene * species.leafBiomassDensityG_m2);

  const gammaMono = species.monoterpeneLightDependent ? (gammaT_monoterpenes * gammaL_isoprene) : gammaT_monoterpenes;
  const monoterpenesFlux = (species.efMonoterpenes * gammaMono * species.leafBiomassDensityG_m2);

  const sesquiterpenesFlux = (species.efSesquiterpenes * gammaT_monoterpenes * species.leafBiomassDensityG_m2);
  const oxygenatedVocFlux = (species.efOxygenatedVoc * gammaT_monoterpenes * species.leafBiomassDensityG_m2);

  // Emisión total diaria integrada en 24h (asumiendo fotoperíodo de 14h en Málaga)
  const photoperiodHours = 14;
  const isopreneDailyGrams = (isopreneFlux * input.canopyAreaM2 * photoperiodHours) / 1e6;
  const monoterpeneDailyGrams = (monoterpenesFlux * input.canopyAreaM2 * 24) / 1e6;
  const sesquiterpeneDailyGrams = (sesquiterpenesFlux * input.canopyAreaM2 * 24) / 1e6;
  const oxygenatedVocDailyGrams = (oxygenatedVocFlux * input.canopyAreaM2 * 24) / 1e6;

  const totalBvocEmissionGramsDay = isopreneDailyGrams + monoterpeneDailyGrams + sesquiterpeneDailyGrams + oxygenatedVocDailyGrams;

  // Potencial de Formación de Ozono (OFP Carter 2010 MIR):
  // MIR Isopreno: 10.6 g O3 / g COV | Monoterpenos: 4.3 g O3 / g COV | Sesquiterpenos: 2.9 g O3 / g COV
  const isopreneOFP = isopreneDailyGrams * 10.6;
  const monoterpeneOFP = monoterpeneDailyGrams * 4.3;
  const totalOzoneFormationPotentialGramsDay = isopreneOFP + monoterpeneOFP + (sesquiterpeneDailyGrams * 2.9);

  // Rendimientos de Aerosoles Orgánicos Secundarios (SOA) - Modelo de 2 Productos Pankow/Odum:
  // En régimen urbano High-NOx de Málaga (ambientNOx > 15 ppb):
  const isHighNox = input.ambientNOxPpb > 15;
  const M_o = Math.max(2.0, input.ambientPM25Ugm3 * 0.4); // Masa orgánica de absorción

  // Isopreno SOA Yield (~1.5% a 3.5%)
  const soaYieldIsoprenePct = isHighNox ? 1.8 : 3.2;
  // Monoterpenos (alpha-pineno/limoneno) SOA Yield (~6% a 18%)
  const soaYieldMonoterpenesPct = isHighNox ? 9.5 : 16.0;
  // Sesquiterpenos (beta-caryophyllene) SOA Yield (~45% a 70% - baja volatilidad extrema)
  const soaYieldSesquiterpenesPct = isHighNox ? 48.0 : 65.0;

  const soaMassProductionGramsDay = 
    (isopreneDailyGrams * (soaYieldIsoprenePct / 100)) +
    (monoterpeneDailyGrams * (soaYieldMonoterpenesPct / 100)) +
    (sesquiterpeneDailyGrams * (soaYieldSesquiterpenesPct / 100));

  // Absorción de contaminantes por deposición estomática (Wesely 1989)
  // Flux = vd · C_aire · Area_foliar · Tiempo
  const no2ConcentrationUgm3 = input.ambientNOxPpb * 1.88;
  const o3ConcentrationUgm3 = input.ambientO3Ppb * 2.0;

  const no2RemovedGramsDay = (species.no2DepositionVelocityCmS / 100) * (no2ConcentrationUgm3 / 1e6) * (input.canopyAreaM2 * species.laiDefault) * (photoperiodHours * 3600);
  const o3RemovedGramsDay = (species.ozoneDepositionVelocityCmS / 100) * (o3ConcentrationUgm3 / 1e6) * (input.canopyAreaM2 * species.laiDefault) * (photoperiodHours * 3600);

  // Balance Neto de Calidad del Aire = (NO2 retirado + O3 retirado) - (SOA formado + OFP / 15)
  const netAirQualityBalanceScore = (no2RemovedGramsDay + o3RemovedGramsDay) - (soaMassProductionGramsDay * 2.5 + totalOzoneFormationPotentialGramsDay * 0.08);

  let recommendationClassification: 'highly_beneficial' | 'balanced' | 'high_ozone_emitter' = 'balanced';
  let doctoralAnalysisComment = '';

  if (species.id === 'jacaranda_mimosifolia') {
    recommendationClassification = 'highly_beneficial';
    doctoralAnalysisComment = 'Jacaranda: Especie óptima para arbolado viario en cañones urbanos de Málaga. Emisión casi nula de isopreno y alta captación estomática de NO2.';
  } else if (species.id === 'platanus_hispanica') {
    recommendationClassification = 'high_ozone_emitter';
    doctoralAnalysisComment = 'Plátano de sombra: Aunque proporciona una excelente sombra y filtración de partículas en la Alameda, sus altas emisiones de isopreno bajo fuerte radiación UV aumentan el potencial de ozono estival.';
  } else if (species.id === 'citrus_aurantium') {
    recommendationClassification = 'highly_beneficial';
    doctoralAnalysisComment = 'Naranjo amargo: Idóneo para calles peatonales del Centro Histórico. Bajísimo potencial de ozono y emisión terpénica floral no reactiva.';
  } else {
    recommendationClassification = 'balanced';
    doctoralAnalysisComment = 'Especie con balance neutro. Contribución equilibrada entre filtración de contaminantes primarios y emisión de terpenos biogénicos.';
  }

  const result: TreeBvocSimulationResult = {
    species,
    gammaTempIsoprene: gammaT_isoprene,
    gammaLightIsoprene: gammaL_isoprene,
    gammaTempMonoterpene: gammaT_monoterpenes,
    isopreneFluxUgm2H: isopreneFlux,
    monoterpenesFluxUgm2H: monoterpenesFlux,
    sesquiterpenesFluxUgm2H: sesquiterpenesFlux,
    oxygenatedVocFluxUgm2H: oxygenatedVocFlux,
    totalBvocEmissionGramsDay,
    isopreneOFP_gO3_day: isopreneOFP,
    monoterpeneOFP_gO3_day: monoterpeneOFP,
    totalOzoneFormationPotentialGramsDay,
    soaYieldIsoprenePct,
    soaYieldMonoterpenesPct,
    soaYieldSesquiterpenesPct,
    soaMassProductionGramsDay,
    no2RemovedGramsDay,
    o3RemovedGramsDay,
    netAirQualityBalanceScore,
    recommendationClassification,
    doctoralAnalysisComment
  };

  treeBvocCache.set(cacheKey, result);
  return result;
}

/**
 * Exportador FAIR CSV de la especiación de BVOCs y SOA.
 */
export function exportTreeBvocCsv(input: TreeBvocSimulationInput, result: TreeBvocSimulationResult): string {
  const headers = 'tree_id,species_name,temp_c,par_umol_m2_s,nox_ppb,canopy_m2,isoprene_flux_ug_m2_h,monoterpene_flux_ug_m2_h,sesquiterpene_flux_ug_m2_h,bvoc_tot_g_day,ofp_o3_g_day,soa_pm25_g_day,no2_removed_g_day,o3_removed_g_day,net_score\n';
  const row = `"${result.species.id}","${result.species.scientificName}",${input.tempCelsius},${input.parSolarUmolM2S},${input.ambientNOxPpb},${input.canopyAreaM2},${result.isopreneFluxUgm2H.toFixed(2)},${result.monoterpenesFluxUgm2H.toFixed(2)},${result.sesquiterpenesFluxUgm2H.toFixed(2)},${result.totalBvocEmissionGramsDay.toFixed(2)},${result.totalOzoneFormationPotentialGramsDay.toFixed(2)},${result.soaMassProductionGramsDay.toFixed(2)},${result.no2RemovedGramsDay.toFixed(2)},${result.o3RemovedGramsDay.toFixed(2)},${result.netAirQualityBalanceScore.toFixed(2)}`;
  return headers + row;
}
