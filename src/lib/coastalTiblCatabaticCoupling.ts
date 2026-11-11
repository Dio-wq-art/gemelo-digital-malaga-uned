/**
 * Modelo Determinista de Capa Límite Térmica Interna Costera (TIBL) y Vientos Catabáticos de los Montes de Málaga.
 * Modelado del salto de rugosidad z0_mar -> z0_ciudad, evolución de la TIBL con la distancia a la línea de costa,
 * y atrapamiento de plumas portuarias bajo drenaje nocturno catabático (Terral / Viento de los Montes).
 * 
 * Fundamentación Científica:
 * - Garratt (1990): The Internal Boundary Layer — A Review (Boundary-Layer Meteorology).
 * - Venkatram (1977): Internal boundary layer development and dispersion in a coastal zone.
 * - Stull (1988): An Introduction to Boundary Layer Meteorology.
 * - Tesis Doctoral: Gemelo Digital de Málaga.
 */

export interface TiblDistanceStep {
  distanceInlandM: number; // Distancia tierra adentro desde la orilla [m] (0 a 6000 m)
  tiblHeightM: number; // Altura de la TIBL térmica h_i(x) [m]
  miblHeightM: number; // Altura de la capa límite mecánica h_m(x) [m]
  effectiveRoughnessZ0: number; // Rugosidad aerodinámica z0 [m]
  surfaceFrictionVelocityUstarMs: number; // Velocidad de fricción u* [m/s]
  plumeConfinementIndexPct: number; // % de confinamiento vertical de emisiones
  zoneLabel: string;
}

export interface CoastalTiblParameters {
  distanceInlandM: number; // Distancia receptor a la costa (0 a 8000 m)
  landSurfaceTempC: number; // Temperatura suelo urbano [°C]
  seaSurfaceTempC: number; // SST Mar de Alborán [°C]
  windSpeedCoastMs: number; // Velocidad del viento en la costa [m/s]
  windDirectionDeg: number; // Dirección del viento (grados)
  sensibleHeatFluxWm2: number; // Flujo de calor sensible urbano H_0 [W/m²]
  marineLapseRateKm: number; // Gradiente vertical de temperatura marina gamma [K/m] (típico 0.006 K/m)
  isNocturnalCatabaticActive: boolean; // Drenaje catabático de Montes de Málaga activo
}

export interface CoastalTiblSimulationResult {
  tiblHeightAtReceptorM: number; // h_i en el punto activo [m]
  miblHeightAtReceptorM: number; // h_m capa mecánica [m]
  thermalJumpDeltaTC: number; // Salto térmico Tierra - Mar [°C]
  roughnessTransitionZ0M: number; // Salto z0_mar -> z0_ciudad
  fumigationRiskLevel: 'bajo' | 'moderado' | 'critico_fumigacion';
  fumigationDescription: string;
  catabaticWindSpeedMs: number; // Velocidad del viento catabático de los Montes [m/s]
  catabaticInversionHeightM: number; // Altura de la inversión térmica por drenaje frío [m]
  transectProfile: TiblDistanceStep[];
  scientificInterpretation: string;
}

/**
 * Cálculo de la altura de la TIBL térmica según Garratt (1990) y Venkatram (1977):
 * h_i(x) = sqrt( (2 * H_0 * x) / (gamma * rho * c_p * u) )
 */
export function calculateGarrattTiblHeight(
  distanceInlandM: number,
  sensibleHeatFluxWm2: number,
  marineLapseRateKm: number,
  windSpeedMs: number,
  deltaTC: number
): number {
  if (distanceInlandM <= 5.0) return 8.0; // Espesor inicial sobre la línea de rompiente

  const rhoCp = 1200.0; // J/(m³·K)
  const gamma = Math.max(0.002, marineLapseRateKm);
  const u = Math.max(0.5, windSpeedMs);

  // Si es de día y el suelo está más caliente que el mar (H_0 > 0)
  if (sensibleHeatFluxWm2 > 10.0 && deltaTC > 0) {
    const numerator = 2.0 * sensibleHeatFluxWm2 * distanceInlandM;
    const denominator = gamma * rhoCp * u;
    const hTibl = Math.sqrt(numerator / denominator);
    return Math.max(15.0, Math.min(650.0, hTibl));
  }

  // Régimen nocturno / neutro o brisa fría: expansión parabólica amortiguada
  const hNocturnal = 0.25 * Math.pow(Math.max(10.0, distanceInlandM), 0.65);
  return Math.max(15.0, Math.min(250.0, hNocturnal));
}

/**
 * Cálculo de la Capa Límite Interna Mecánica (MIBL) por salto de rugosidad según Elliott (1958) / Wood (1982):
 * h_m(x) = 0.38 * z0_urbano^0.2 * x^0.8
 */
export function calculateMechanicalMiblHeight(
  distanceInlandM: number,
  z0UrbanM: number = 1.2
): number {
  if (distanceInlandM <= 5.0) return 3.0;
  const hm = 0.38 * Math.pow(z0UrbanM, 0.2) * Math.pow(distanceInlandM, 0.8);
  return Math.max(5.0, Math.min(450.0, hm));
}

/**
 * Simulación Determinista del Acoplamiento TIBL - Viento Catabático
 */
export function simulateCoastalTiblCatabatic(
  params: CoastalTiblParameters
): CoastalTiblSimulationResult {
  const {
    distanceInlandM,
    landSurfaceTempC,
    seaSurfaceTempC,
    windSpeedCoastMs,
    windDirectionDeg,
    sensibleHeatFluxWm2,
    marineLapseRateKm,
    isNocturnalCatabaticActive
  } = params;

  // 1. Salto térmico superficial
  const deltaTC = landSurfaceTempC - seaSurfaceTempC;

  // 2. Alturas en el receptor activo
  const tiblHeightAtReceptorM = calculateGarrattTiblHeight(
    distanceInlandM,
    sensibleHeatFluxWm2,
    marineLapseRateKm,
    windSpeedCoastMs,
    deltaTC
  );

  const miblHeightAtReceptorM = calculateMechanicalMiblHeight(distanceInlandM, 1.2);

  // 3. Drenaje catabático de los Montes de Málaga (Mahrt 1982 / Whiteman 2000)
  // Viento descendente por gravedad desde 600m hacia el cauce del Guadalmedina y litoral
  let catabaticWindSpeedMs = 0.0;
  let catabaticInversionHeightM = 280.0;

  if (isNocturnalCatabaticActive) {
    const deltaTCatabatic = Math.max(1.5, seaSurfaceTempC - landSurfaceTempC + 4.0);
    // Velocidad catabática teórica u_cat = sqrt(g * delta_T * h_montes * sin(theta) / T_0)
    catabaticWindSpeedMs = Math.min(6.5, 0.75 * Math.sqrt((9.81 * deltaTCatabatic * 600.0 * Math.sin(0.08)) / 295.15));
    // Confinamiento de la inversión a ras de suelo en el litoral
    catabaticInversionHeightM = Math.max(45.0, 75.0 - (distanceInlandM / 1000.0) * 5.0);
  }

  // 4. Nivel de riesgo de fumigación de plumas portuarias / industriales
  // Fumigación ocurre cuando la pluma emitida en capa estable penetra dentro de la TIBL convectiva
  let fumigationRiskLevel: 'bajo' | 'moderado' | 'critico_fumigacion' = 'bajo';
  let fumigationDescription = 'Dispersión costera estándar sin fumigación de plumas elevadas.';

  if (distanceInlandM > 200 && distanceInlandM < 2500 && tiblHeightAtReceptorM > 40 && tiblHeightAtReceptorM < 180) {
    fumigationRiskLevel = 'critico_fumigacion';
    fumigationDescription = 'Riesgo crítico de fumigación: La TIBL térmica en crecimiento intersecta la pluma de chimenea de buques en el Puerto, forzando la mezcla turbulenta instantánea a cota peatonal.';
  } else if (distanceInlandM <= 200) {
    fumigationRiskLevel = 'moderado';
    fumigationDescription = 'Zona de interfase marina inmediata con baja altura de mezcla h_i < 35m.';
  }

  // 5. Transecto transversal litoral (0m a 5000m tierra adentro)
  const distances = [0, 50, 150, 300, 600, 1000, 1800, 2500, 3500, 5000];
  const transectProfile: TiblDistanceStep[] = distances.map(dist => {
    const hTibl = calculateGarrattTiblHeight(dist, sensibleHeatFluxWm2, marineLapseRateKm, windSpeedCoastMs, deltaTC);
    const hMibl = calculateMechanicalMiblHeight(dist, 1.2);
    
    // Transición de rugosidad z0
    const z0 = dist < 30 ? 0.0002 : dist < 300 ? 0.35 : 1.2;
    const uStar = 0.4 * windSpeedCoastMs / Math.log(10.0 / z0);
    
    // Confinamiento vertical
    const confinementPct = Math.min(95, Math.max(15, 100.0 - (hTibl / 400.0) * 80.0));

    let zoneLabel = 'Orilla Marítima (Rompiente)';
    if (dist >= 50 && dist < 400) zoneLabel = 'Paseo Marítimo / Muelle Heredia';
    else if (dist >= 400 && dist < 1500) zoneLabel = 'Centro Urbano / Alameda';
    else if (dist >= 1500 && dist < 3000) zoneLabel = 'Corona Residencial Interior';
    else if (dist >= 3000) zoneLabel = 'Pie de Monte / Montes de Málaga';

    return {
      distanceInlandM: dist,
      tiblHeightM: parseFloat(hTibl.toFixed(1)),
      miblHeightM: parseFloat(hMibl.toFixed(1)),
      effectiveRoughnessZ0: z0,
      surfaceFrictionVelocityUstarMs: parseFloat(uStar.toFixed(3)),
      plumeConfinementIndexPct: parseFloat(confinementPct.toFixed(1)),
      zoneLabel
    };
  });

  const scientificInterpretation = `A una distancia de ${distanceInlandM}m de la costa con ΔT = ${deltaTC.toFixed(1)}°C (Tierra - Mar), la Capa Límite Térmica Interna (TIBL) alcanza una altura de ${tiblHeightAtReceptorM.toFixed(1)}m, acompañada por una capa mecánica (MIBL) de ${miblHeightAtReceptorM.toFixed(1)}m originada por el salto de rugosidad (z₀ = 0.0002m → 1.2m). ${isNocturnalCatabaticActive ? `El drenaje catabático de los Montes de Málaga aporta un flujo de ${catabaticWindSpeedMs.toFixed(1)} m/s que confina las emisiones a <${catabaticInversionHeightM.toFixed(0)}m de cota.` : ''} Diagnóstico: ${fumigationDescription}`;

  return {
    tiblHeightAtReceptorM: parseFloat(tiblHeightAtReceptorM.toFixed(1)),
    miblHeightAtReceptorM: parseFloat(miblHeightAtReceptorM.toFixed(1)),
    thermalJumpDeltaTC: parseFloat(deltaTC.toFixed(2)),
    roughnessTransitionZ0M: 1.2,
    fumigationRiskLevel,
    fumigationDescription,
    catabaticWindSpeedMs: parseFloat(catabaticWindSpeedMs.toFixed(2)),
    catabaticInversionHeightM: parseFloat(catabaticInversionHeightM.toFixed(1)),
    transectProfile,
    scientificInterpretation
  };
}
