/**
 * =================================================================================================
 * MOTOR ANALÍTICO DETERMINISTA DE CINÉTICA Y MICROESCALA DE NO2 (TESIS DOCTORAL)
 * =================================================================================================
 * Implementa formulaciones analíticas cerradas y deterministas (CERO datos estocásticos / CERO Math.random):
 * 1. Invariante Fotoquímico de Oxidantes Totales (Ox = NO2 + O3) y Partición f_NO2 Primario/Secundario (Clapp & Jenkin 2001, COPERT 5).
 * 2. Atenuación Geométrica de Fotólisis J_NO2 por Sombra 3D en Cañones Urbanos (Oke 1987, Fast-JX).
 * 3. Química Heterogénea de Halógenos Marinos (N2O5 + NaCl -> ClNO2 -> Cl• burst matutino, IUPAC / Roberts 2009).
 * 4. Indicador Satelital de Sensibilidad Química de Sillman (HCHO / NO2, Sentinel-5P / Sentinel-4).
 * 5. Número Adimensional Damköhler Urbano (Da = tau_transporte / tau_quimica).
 */

export interface OxPartitionResult {
  oxUgM3: number;
  oxPpb: number;
  fNo2PrimaryFraction: number;
  no2PrimaryUgM3: number;
  no2SecondaryUgM3: number;
  primaryPercentage: number;
  secondaryPercentage: number;
  regionalOxBackgroundUgM3: number;
  localOxProductionUgM3: number;
  scientificCitation: string;
}

export interface CanyonJNo2ShadingResult {
  jNo2ZenithalS1: number;
  jNo2CanyonS1: number;
  shadowFraction: number;
  attenuationPct: number;
  aspectRatioHw: number;
  svf: number;
  solarZenithDeg: number;
  relativeAzimuthDeg: number;
  isDirectSunlight: boolean;
}

export interface MarineHalogenActivationResult {
  clno2Ppb: number;
  chlorineRadicalFluxMoleculesCm3S: number;
  morningNoToNo2AccelerationFactor: number;
  n2o5UptakeProbabilityGamma: number;
  clno2YieldPhi: number;
  marineInfluenceDistanceKm: number;
  status: 'ACTIVE_BURST' | 'MODERATE' | 'NEGLIGIBLE_INLAND';
}

export interface SillmanRegimeResult {
  ratioHchoNo2: number;
  regime: 'VOC_LIMITED' | 'TRANSITION' | 'NOX_LIMITED';
  regimeLabel: string;
  zbeOzoneImpactForecast: string;
  hchoColumnUmolM2: number;
  no2ColumnUmolM2: number;
  doi: string;
}

export interface DamkohlerResult {
  damkohlerNumber: number;
  tauTransportResSec: number;
  tauChemicalRelaxSec: number;
  regime: 'TRANSPORT_DOMINATED' | 'INTERMEDIATE' | 'PHOTOSTATIONARY_EQUILIBRIUM';
  photochemicalEquilibriumPct: number;
  okeAerodynamicFlow: string;
}

export interface ComprehensiveNO2MicroscaleReport {
  oxPartition: OxPartitionResult;
  canyonShading: CanyonJNo2ShadingResult;
  marineHalogens: MarineHalogenActivationResult;
  sillmanSensitivity: SillmanRegimeResult;
  damkohler: DamkohlerResult;
  summaryExecutive: string;
}

/**
 * 1. Partición Analítica de Ox e Invariante de Oxidantes Totales (Clapp & Jenkin 2001)
 */
export function computeOxInvariantsAndPrimaryNO2Partition(
  no2UgM3: number,
  o3UgM3: number,
  noUgM3: number,
  trafficFactor: number = 1.0,
  dieselFraction: number = 0.58
): OxPartitionResult {
  const oxUgM3 = Number((no2UgM3 + o3UgM3).toFixed(1));
  const oxPpb = Number(((no2UgM3 / 1.88) + (o3UgM3 / 2.00)).toFixed(1));
  
  // Fracción primaria f_NO2 según composición del parque de Málaga (COPERT 5 / DGT)
  const fNo2PrimaryFraction = Number((0.14 + 0.12 * Math.max(0.0, Math.min(1.0, dieselFraction))).toFixed(3));
  
  // Masa NOx local equivalente (NO + NO2)
  const noAsNo2Eq = noUgM3 * (46.0055 / 30.0061);
  const noxLocalUgM3 = no2UgM3 + noAsNo2Eq;
  
  // Aporte primario vehicular directo de NO2
  const no2PrimaryUgM3 = Number(Math.min(no2UgM3 * 0.85, (fNo2PrimaryFraction * noxLocalUgM3 * Math.min(1.5, trafficFactor * 0.75))).toFixed(1));
  const no2SecondaryUgM3 = Number(Math.max(0.0, no2UgM3 - no2PrimaryUgM3).toFixed(1));
  
  const primaryPercentage = Number(((no2PrimaryUgM3 / Math.max(0.1, no2UgM3)) * 100).toFixed(1));
  const secondaryPercentage = Number((100.0 - primaryPercentage).toFixed(1));
  
  const regionalOxBackgroundUgM3 = Number(Math.max(20.0, (o3UgM3 * 0.90 + no2UgM3 * 0.25)).toFixed(1));
  const localOxProductionUgM3 = Number(Math.max(0.0, oxUgM3 - regionalOxBackgroundUgM3).toFixed(1));

  return {
    oxUgM3,
    oxPpb,
    fNo2PrimaryFraction,
    no2PrimaryUgM3,
    no2SecondaryUgM3,
    primaryPercentage,
    secondaryPercentage,
    regionalOxBackgroundUgM3,
    localOxProductionUgM3,
    scientificCitation: 'Clapp, L. J., & Jenkin, M. E. (2001). Analysis of the relationship between ambient levels of O3, NO2 and NO as a function of NOx in the UK. Atmospheric Environment, 35(36), 6391-6405.'
  };
}

/**
 * 2. Atenuación Geométrica de Fotólisis J_NO2 por Sombra 3D en Cañón (Oke 1987, Fast-JX)
 */
export function compute3DCanyonSolarShadingJNO2(
  jNo2Zenithal: number,
  aspectRatioHw: number,
  streetOrientationDeg: number = 90,
  solarZenithDeg: number = 38,
  solarAzimuthDeg: number = 180,
  svf: number = 0.45
): CanyonJNo2ShadingResult {
  const thetaZRad = (Math.max(5.0, Math.min(88.0, solarZenithDeg)) * Math.PI) / 180;
  const alphaStreetRad = (streetOrientationDeg * Math.PI) / 180;
  const phiSRad = (solarAzimuthDeg * Math.PI) / 180;
  
  const relAzimuthRad = Math.abs(phiSRad - alphaStreetRad);
  const sinRelAzimuth = Math.abs(Math.sin(relAzimuthRad));
  
  // Fracción geométrica de sombra en el suelo del cañón
  const tanThetaZ = Math.tan(thetaZRad);
  const rawShadow = aspectRatioHw * tanThetaZ * Math.max(0.05, sinRelAzimuth);
  const shadowFraction = Number(Math.min(1.0, Math.max(0.0, rawShadow)).toFixed(3));
  
  // J_NO2 en fondo del cañón = radiación directa no apantallada + radiación difusa ponderada por SVF
  const directFactor = 1.0 - shadowFraction;
  const diffuseFactor = shadowFraction * Math.max(0.15, svf);
  const effectiveFactor = Math.max(0.18, Math.min(1.0, directFactor + diffuseFactor));
  
  const jNo2CanyonS1 = Number((jNo2Zenithal * effectiveFactor).toFixed(5));
  const attenuationPct = Number(((1.0 - effectiveFactor) * 100).toFixed(1));
  const isDirectSunlight = shadowFraction < 0.65;

  return {
    jNo2ZenithalS1: Number(jNo2Zenithal.toFixed(5)),
    jNo2CanyonS1,
    shadowFraction,
    attenuationPct,
    aspectRatioHw,
    svf,
    solarZenithDeg: Number(solarZenithDeg.toFixed(1)),
    relativeAzimuthDeg: Number(((relAzimuthRad * 180) / Math.PI).toFixed(1)),
    isDirectSunlight
  };
}

/**
 * 3. Química Heterogénea de Halógenos Marinos (N2O5 + NaCl -> ClNO2 -> Cl•)
 */
export function computeMarineHalogenN2O5Activation(
  no2Ppb: number,
  o3Ppb: number,
  marineAerosolSalinityPsu: number = 36.8,
  distanceToCoastKm: number = 1.2,
  tempC: number = 22.0,
  rhPct: number = 68.0
): MarineHalogenActivationResult {
  const coastalDecay = Math.exp(-Math.max(0.0, distanceToCoastKm) / 3.8);
  const rhFactor = Math.max(0.3, Math.min(1.0, rhPct / 100.0));
  
  // Probabilidad de absorción de N2O5 sobre spray salino húmedo (IUPAC Task Group)
  const n2o5UptakeProbabilityGamma = Number((0.032 * rhFactor * (marineAerosolSalinityPsu / 35.0) * coastalDecay).toFixed(4));
  
  // Rendimiento de ClNO2 frente a hidrólisis pura de HNO3
  const clno2YieldPhi = Number((0.88 * (1.0 - Math.exp(-marineAerosolSalinityPsu / 8.5)) * coastalDecay).toFixed(3));
  
  // Concentración nocturna/matinal acumulada de nitrilo de cloro (ClNO2)
  const precursorLoading = Math.sqrt(Math.max(0.1, no2Ppb * o3Ppb * 0.05));
  const clno2Ppb = Number((precursorLoading * clno2YieldPhi * 0.45 * coastalDecay).toFixed(3));
  
  // Flujo de radicales de cloro Cl• liberados al amanecer (fotólisis rápida)
  const chlorineRadicalFluxMoleculesCm3S = Number((clno2Ppb * 2.46e10 * 1.8e-4 * coastalDecay).toExponential(2));
  
  // Aceleración de la conversión matutina NO -> NO2
  const morningNoToNo2AccelerationFactor = Number((1.0 + 2.15 * clno2YieldPhi * coastalDecay).toFixed(2));
  
  const status: 'ACTIVE_BURST' | 'MODERATE' | 'NEGLIGIBLE_INLAND' = 
    distanceToCoastKm <= 2.0 && clno2Ppb > 0.15 ? 'ACTIVE_BURST' :
    distanceToCoastKm <= 5.5 ? 'MODERATE' : 'NEGLIGIBLE_INLAND';

  return {
    clno2Ppb,
    chlorineRadicalFluxMoleculesCm3S,
    morningNoToNo2AccelerationFactor,
    n2o5UptakeProbabilityGamma,
    clno2YieldPhi,
    marineInfluenceDistanceKm: Number(distanceToCoastKm.toFixed(2)),
    status
  };
}

/**
 * 4. Indicador Satelital de Sensibilidad Química de Sillman (HCHO / NO2)
 */
export function computeSillmanChemicalSensitivityRatio(
  hchoColumnUmolM2: number = 32.5,
  no2ColumnUmolM2: number = 42.8
): SillmanRegimeResult {
  const ratioHchoNo2 = Number((hchoColumnUmolM2 / Math.max(0.1, no2ColumnUmolM2)).toFixed(2));
  
  let regime: 'VOC_LIMITED' | 'TRANSITION' | 'NOX_LIMITED';
  let regimeLabel: string;
  let zbeOzoneImpactForecast: string;
  
  if (ratioHchoNo2 < 1.0) {
    regime = 'VOC_LIMITED';
    regimeLabel = 'Régimen Limitado por COVs (Sillman < 1.0)';
    zbeOzoneImpactForecast = 'La reducción de tráfico vehicular baja intensamente el NO2, pero puede generar un leve repunte local de O3 al disminuir la titración rápida de NO.';
  } else if (ratioHchoNo2 <= 2.0) {
    regime = 'TRANSITION';
    regimeLabel = 'Régimen Mixto de Transición (1.0 ≤ Sillman ≤ 2.0)';
    zbeOzoneImpactForecast = 'Zona de alta sensibilidad combinada. Reducciones coordinadas de emisiones vehiculares e industriales disminuyen eficazmente tanto NO2 como O3.';
  } else {
    regime = 'NOX_LIMITED';
    regimeLabel = 'Régimen Limitado por NOx (Sillman > 2.0)';
    zbeOzoneImpactForecast = 'Régimen suburbano/rural. La mitigación de NOx reduce directamente la producción neta fotoquímica de O3 troposférico.';
  }

  return {
    ratioHchoNo2,
    regime,
    regimeLabel,
    zbeOzoneImpactForecast,
    hchoColumnUmolM2,
    no2ColumnUmolM2,
    doi: '10.1029/95JD02995'
  };
}

/**
 * 5. Número Adimensional Damköhler Urbano (Da = tau_transporte / tau_quimica)
 */
export function computeUrbanDamkohlerNumber(
  streetWidthM: number = 18.0,
  buildingHeightM: number = 22.0,
  windSpeedCanyonMs: number = 1.8,
  verticalTurbulenceSigmaW: number = 0.35,
  k3Arrhenius: number = 0.44,
  o3Ppb: number = 42.0,
  jNo2: number = 0.0055
): DamkohlerResult {
  // Tiempo de residencia aerodinámica del aire en el cañón urbano (Oke 1987)
  const effectiveCirculationSpeed = Math.max(0.15, windSpeedCanyonMs * 0.35 + verticalTurbulenceSigmaW);
  const tauTransportResSec = Number(((streetWidthM * buildingHeightM) / (effectiveCirculationSpeed * Math.max(2.0, streetWidthM * 0.5))).toFixed(1));
  
  // Tiempo característico de relajación química fotoestacionaria de Leighton
  // k3 en ppm^-1 min^-1 convertido a s^-1: k3_s = (k3Arrhenius / (60 * 1000)) * o3Ppb
  const k3S1 = (k3Arrhenius / 60000.0) * o3Ppb;
  const tauChemicalRelaxSec = Number((1.0 / Math.max(1e-4, k3S1 + jNo2)).toFixed(1));
  
  // Número de Damköhler: Da = tau_transporte / tau_química
  const damkohlerNumber = Number((tauTransportResSec / Math.max(0.1, tauChemicalRelaxSec)).toFixed(2));
  
  let regime: 'TRANSPORT_DOMINATED' | 'INTERMEDIATE' | 'PHOTOSTATIONARY_EQUILIBRIUM';
  if (damkohlerNumber < 0.5) {
    regime = 'TRANSPORT_DOMINATED';
  } else if (damkohlerNumber <= 2.0) {
    regime = 'INTERMEDIATE';
  } else {
    regime = 'PHOTOSTATIONARY_EQUILIBRIUM';
  }
  
  const photochemicalEquilibriumPct = Number(((1.0 - Math.exp(-damkohlerNumber)) * 100).toFixed(1));
  
  const hw = buildingHeightM / Math.max(1.0, streetWidthM);
  const okeAerodynamicFlow = hw > 0.7 ? 'Skimming Flow (Flujo Rasante con Vórtice Confinado)' :
                             hw > 0.3 ? 'Wake Interference (Interferencia de Estelas)' : 'Isolated Roughness (Obstáculos Aislados)';

  return {
    damkohlerNumber,
    tauTransportResSec,
    tauChemicalRelaxSec,
    regime,
    photochemicalEquilibriumPct,
    okeAerodynamicFlow
  };
}

/**
 * Función Maestra Integradora para Evaluación In Situ Completa
 */
export function evaluateComprehensiveNO2Microscale(params: {
  no2UgM3: number;
  o3UgM3: number;
  noUgM3: number;
  trafficFactor: number;
  dieselFraction?: number;
  aspectRatioHw: number;
  streetWidthM?: number;
  buildingHeightM?: number;
  streetOrientationDeg?: number;
  solarZenithDeg?: number;
  solarAzimuthDeg?: number;
  svf?: number;
  jNo2Zenithal?: number;
  marineAerosolSalinityPsu?: number;
  distanceToCoastKm?: number;
  tempC?: number;
  rhPct?: number;
  hchoColumnUmolM2?: number;
  no2ColumnUmolM2?: number;
  windSpeedCanyonMs?: number;
  verticalTurbulenceSigmaW?: number;
  k3Arrhenius?: number;
}): ComprehensiveNO2MicroscaleReport {
  const oxPartition = computeOxInvariantsAndPrimaryNO2Partition(
    params.no2UgM3,
    params.o3UgM3,
    params.noUgM3,
    params.trafficFactor,
    params.dieselFraction ?? 0.58
  );

  const canyonShading = compute3DCanyonSolarShadingJNO2(
    params.jNo2Zenithal ?? 0.0055,
    params.aspectRatioHw,
    params.streetOrientationDeg ?? 90,
    params.solarZenithDeg ?? 38,
    params.solarAzimuthDeg ?? 180,
    params.svf ?? 0.45
  );

  const marineHalogens = computeMarineHalogenN2O5Activation(
    params.no2UgM3 / 1.88,
    params.o3UgM3 / 2.00,
    params.marineAerosolSalinityPsu ?? 36.8,
    params.distanceToCoastKm ?? 1.2,
    params.tempC ?? 22.0,
    params.rhPct ?? 68.0
  );

  const sillmanSensitivity = computeSillmanChemicalSensitivityRatio(
    params.hchoColumnUmolM2 ?? 32.5,
    params.no2ColumnUmolM2 ?? 42.8
  );

  const damkohler = computeUrbanDamkohlerNumber(
    params.streetWidthM ?? 18.0,
    params.buildingHeightM ?? (params.streetWidthM ?? 18.0) * params.aspectRatioHw,
    params.windSpeedCanyonMs ?? 1.8,
    params.verticalTurbulenceSigmaW ?? 0.35,
    params.k3Arrhenius ?? 0.44,
    params.o3UgM3 / 2.00,
    canyonShading.jNo2CanyonS1
  );

  const summaryExecutive = `Diagnóstico de microescala NO2: Ox total = ${oxPartition.oxUgM3} µg/m³ (${oxPartition.primaryPercentage}% primario / ${oxPartition.secondaryPercentage}% secundario). Sombra 3D atenúa fotólisis J_NO2 en ${canyonShading.attenuationPct}%. Número de Damköhler Da = ${damkohler.damkohlerNumber} (${damkohler.photochemicalEquilibriumPct}% de equilibrio alcanzado). Régimen Sillman: ${sillmanSensitivity.regime}. Activación halógena costera: ${marineHalogens.status} (aceleración matutina ×${marineHalogens.morningNoToNo2AccelerationFactor}).`;

  return {
    oxPartition,
    canyonShading,
    marineHalogens,
    sillmanSensitivity,
    damkohler,
    summaryExecutive
  };
}
