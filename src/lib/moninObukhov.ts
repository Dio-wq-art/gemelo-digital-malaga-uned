/**
 * Módulo para la Teoria de Semejanza de Monin-Obukhov (MOST)
 * Fundamentación Física y Micrometeorológica para la Capa Límite Superficial Urbana en Málaga.
 * Cero aleatoriedad, ecuaciones analíticas universales de Businger-Dyer.
 */

import { BoundedCache, hashParams } from './computationEngine';

export interface MoninObukhovResult {
  z_m: number;                       // Altura de evaluación (m)
  z0_m: number;                      // Longitud de rugosidad canópica (m)
  displacementD_m: number;           // Plano de desplazamiento (m)
  uRefMs: number;                    // Velocidad de viento de referencia a z_ref (m/s)
  tempC: number;                     // Temperatura ambiente (ºC)
  solarIrradianceWm2: number;        // Irradiancia solar (W/m²)
  uStarMs: number;                   // Velocidad de fricción superficial u* (m/s)
  sensibleHeatFluxWm2: number;       // Flujo de calor sensible H_s (W/m²)
  moninObukhovLengthL: number;       // Longitud de estabilidad de Monin-Obukhov L (m)
  zeta: number;                      // Parámetro de estabilidad adimensional (z-d)/L
  stabilityClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  stabilityDescription: string;
  phi_m: number;                     // Función adimensional de cizalladura de viento
  phi_h: number;                     // Función adimensional de transporte de calor/masa
  psi_m: number;                     // Corrección integrada de velocidad
  psi_h: number;                     // Corrección integrada de temperatura/masa
  kzM2s: number;                     // Coeficiente de difusividad turbulenta vertical K_z (m²/s)
  windSpeedAtZMs: number;            // Velocidad de viento ajustada a altura z (m/s)
}

const VON_KARMAN_K = 0.40;
const GRAVITY_G = 9.81;

const moninObukhovCache = new BoundedCache<string, MoninObukhovResult>(80);

/**
 * Evalúa las funciones universales de Businger-Dyer según el parámetro de estabilidad zeta = (z-d)/L
 */
export function calculateMoninObukhov(
  z_m: number = 10,
  z0_m: number = 0.8,               // Valor típico para centro urbano denso de Málaga
  buildingHeightH: number = 15,     // Altura media de la edificación
  uRefMs: number = 3.0,
  tempC: number = 22,
  solarIrradianceWm2: number = 450,
  cloudCoverPct: number = 10,
  isNight: boolean = false
): MoninObukhovResult {
  const cacheKey = hashParams({
    z_m,
    z0_m,
    buildingHeightH,
    uRefMs,
    tempC,
    solarIrradianceWm2,
    cloudCoverPct,
    isNight
  });

  const cached = moninObukhovCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const d = 0.7 * buildingHeightH;  // Plano de desplazamiento canópico
  // Altura de referencia meteorológica sobre el dosel (z_ref - d = 10m estándar)
  const zRefEff = Math.max(10.0, z0_m * 10.0);
  const zEff = Math.max(z0_m * Math.E, z_m > d ? z_m - d : Math.max(1.5, z0_m * 2.0));
  const tempK = tempC + 273.15;
  const rhoAir = 1.225; // kg/m³
  const cpAir = 1005;  // J/(kg·K)

  // 1. Estimación determinista del flujo de calor sensible H_s (W/m²)
  let sensibleHeatFluxWm2 = 0;
  if (isNight) {
    // Enfriamiento radiativo nocturno
    sensibleHeatFluxWm2 = -15 - (100 - cloudCoverPct) * 0.25;
  } else {
    // Calentamiento solar diurno modulado por albedo urbano (~0.18) y fracción de calor latente (~0.35)
    sensibleHeatFluxWm2 = Math.max(-5, solarIrradianceWm2 * (1 - 0.18) * 0.40);
  }

  // 2. Velocidad de fricción inicial u* adiabática evaluada en el nivel de referencia
  let uStarMs = (VON_KARMAN_K * uRefMs) / Math.log(zRefEff / z0_m);
  uStarMs = Math.max(0.05, Math.min(1.5, uStarMs));

  // 3. Longitud de Monin-Obukhov L
  // L = - (u*³ * T_k) / (k * g * (H_s / (rho * Cp)))
  const kinematicHeatFlux = sensibleHeatFluxWm2 / (rhoAir * cpAir); // K·m/s
  let moninObukhovLengthL = 9999;
  if (Math.abs(kinematicHeatFlux) > 0.0001) {
    moninObukhovLengthL = - (Math.pow(uStarMs, 3) * tempK) / (VON_KARMAN_K * GRAVITY_G * kinematicHeatFlux);
  }

  // Iteración de convergencia para u* y L acoplados por MOST
  for (let i = 0; i < 3; i++) {
    const zeta_ref = zRefEff / moninObukhovLengthL;
    let psi_m_ref = 0;
    if (zeta_ref < 0) {
      const x = Math.pow(1 - 16 * zeta_ref, 0.25);
      psi_m_ref = 2 * Math.log((1 + x) / 2) + Math.log((1 + x * x) / 2) - 2 * Math.atan(x) + Math.PI / 2;
    } else if (zeta_ref > 0) {
      psi_m_ref = -5 * Math.min( zeta_ref, 2.0 );
    }
    uStarMs = (VON_KARMAN_K * uRefMs) / Math.max(0.5, Math.log(zRefEff / z0_m) - psi_m_ref);
    uStarMs = Math.max(0.05, Math.min(1.5, uStarMs));

    if (Math.abs(kinematicHeatFlux) > 0.0001) {
      moninObukhovLengthL = - (Math.pow(uStarMs, 3) * tempK) / (VON_KARMAN_K * GRAVITY_G * kinematicHeatFlux);
    }
  }

  const zeta = zEff / moninObukhovLengthL;

  // 4. Funciones universales adimensionales de Businger-Dyer
  let phi_m = 1.0;
  let phi_h = 1.0;
  let psi_m = 0.0;
  let psi_h = 0.0;

  if (zeta < 0) {
    // Inestable (Convectivo)
    const x = Math.pow(1 - 16 * zeta, 0.25);
    phi_m = 1 / Math.pow(1 - 16 * zeta, 0.25);
    phi_h = 1 / Math.sqrt(1 - 16 * zeta);
    psi_m = 2 * Math.log((1 + x) / 2) + Math.log((1 + x * x) / 2) - 2 * Math.atan(x) + Math.PI / 2;
    psi_h = 2 * Math.log((1 + Math.sqrt(1 - 16 * zeta)) / 2);
  } else if (zeta > 0) {
    // Estable (Inversión Térmica)
    const zetaLimited = Math.min(zeta, 2.0);
    phi_m = 1 + 5 * zetaLimited;
    phi_h = 1 + 5 * zetaLimited;
    psi_m = -5 * zetaLimited;
    psi_h = -5 * zetaLimited;
  }

  // 5. Coeficiente de Difusividad Turbulenta Vertical K_z (m²/s)
  // K_z = (k * u* * z_eff) / phi_h
  const kzM2s = (VON_KARMAN_K * uStarMs * zEff) / Math.max(0.2, phi_h);

  // 6. Velocidad ajustada a la altura de evaluación z
  const windSpeedAtZMs = Math.max(0.1, (uStarMs / VON_KARMAN_K) * (Math.log(zEff / z0_m) - psi_m));

  // 7. Determinación de Clase de Estabilidad Pasquill-Gifford
  let stabilityClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'D';
  let stabilityDescription = 'Neutra (Turbulencia Mecánica Dominante)';

  if (zeta < -0.2) {
    stabilityClass = 'A';
    stabilityDescription = 'Extremadamente Inestable (Convección Térmica Fuerte)';
  } else if (zeta >= -0.2 && zeta < -0.05) {
    stabilityClass = 'B';
    stabilityDescription = 'Moderadamente Inestable';
  } else if (zeta >= -0.05 && zeta < -0.01) {
    stabilityClass = 'C';
    stabilityDescription = 'Ligeramente Inestable';
  } else if (zeta >= -0.01 && zeta <= 0.01) {
    stabilityClass = 'D';
    stabilityDescription = 'Neutra (Viento Fuerte / Nuboso)';
  } else if (zeta > 0.01 && zeta <= 0.1) {
    stabilityClass = 'E';
    stabilityDescription = 'Ligeramente Estable (Inversión Térmica Débil)';
  } else {
    stabilityClass = 'F';
    stabilityDescription = 'Moderadamente / Extremadamente Estable (Inversión Térmica Severa Nocturna)';
  }

  const result: MoninObukhovResult = {
    z_m,
    z0_m,
    displacementD_m: Number(d.toFixed(2)),
    uRefMs,
    tempC,
    solarIrradianceWm2,
    uStarMs: Number(uStarMs.toFixed(3)),
    sensibleHeatFluxWm2: Number(sensibleHeatFluxWm2.toFixed(1)),
    moninObukhovLengthL: Number(moninObukhovLengthL.toFixed(1)),
    zeta: Number(zeta.toFixed(4)),
    stabilityClass,
    stabilityDescription,
    phi_m: Number(phi_m.toFixed(3)),
    phi_h: Number(phi_h.toFixed(3)),
    psi_m: Number(psi_m.toFixed(3)),
    psi_h: Number(psi_h.toFixed(3)),
    kzM2s: Number(kzM2s.toFixed(3)),
    windSpeedAtZMs: Number(windSpeedAtZMs.toFixed(2))
  };

  moninObukhovCache.set(cacheKey, result);
  return result;
}

export type PasquillGiffordClass = 'A_Muy_Inestable' | 'B_Inestable' | 'C_Ligeramente_Inestable' | 'D_Neutra' | 'E_Estable' | 'F_Muy_Estable';

export interface MoninObukhovState {
  timestamp: string;
  pasquillClass: PasquillGiffordClass;
  obukhovLengthMetersL: number;
  frictionVelocityUStarMs: number;
  sensibleHeatFluxHsWM2: number;
  pblHeightMeters: number;
  roughnessLengthZ0Meters: number;
  moninObukhovStabilityZoverL: number;
  dispersionCharacteristics: string;
  scientificGuidance: string;
}

export function calculateMoninObukhovState(
  windSpeed10mMs: number,
  solarRadiationWM2: number,
  airTempCelsius: number,
  isNightTime: boolean,
  z0Meters: number = 0.8
): MoninObukhovState {
  const T0K = airTempCelsius + 273.15;
  const kVonKarman = 0.40;
  const gAccel = 9.81;
  const rhoAir = 1.225;
  const cpAir = 1005.0;

  const zMeasure = 10.0;
  const uStar = (kVonKarman * Math.max(0.5, windSpeed10mMs)) / Math.log(zMeasure / z0Meters);

  let Hs = 0.0;
  if (isNightTime) {
    Hs = -25.0;
  } else {
    Hs = Math.max(0, solarRadiationWM2 * 0.30);
  }

  const kinematicHeatFlux = Hs / (rhoAir * cpAir);
  let L = 0.0;
  if (Math.abs(kinematicHeatFlux) < 0.0001) {
    L = 100000.0;
  } else {
    L = - (Math.pow(uStar, 3) * T0K) / (kVonKarman * gAccel * kinematicHeatFlux);
  }

  const zPedestrian = 2.0;
  const zOverL = zPedestrian / L;

  let pasquillClass: PasquillGiffordClass = 'D_Neutra';
  let pblHeightM = 800;
  let dispersion = "";

  if (isNightTime) {
    if (windSpeed10mMs < 2.5) {
      pasquillClass = 'F_Muy_Estable';
      pblHeightM = 180;
      dispersion = "Inversión térmica severa. Los contaminantes del tráfico se acumulan en los primeros 180m sin mezcla vertical.";
    } else if (windSpeed10mMs < 4.5) {
      pasquillClass = 'E_Estable';
      pblHeightM = 320;
      dispersion = "Atmósfera estable. Mezcla vertical limitada; los cañones urbanos retienen óxidos de nitrógeno.";
    } else {
      pasquillClass = 'D_Neutra';
      pblHeightM = 600;
      dispersion = "Atmósfera neutra dominada por cizalladura mecánica del viento.";
    }
  } else {
    if (solarRadiationWM2 > 500 && windSpeed10mMs < 2.0) {
      pasquillClass = 'A_Muy_Inestable';
      pblHeightM = 1650;
      dispersion = "Fuerte mezcla convectiva diurna. Elevada altura de capa límite (1650m) que diluye los contaminantes primarios.";
    } else if (solarRadiationWM2 > 300 && windSpeed10mMs < 4.0) {
      pasquillClass = 'B_Inestable';
      pblHeightM = 1250;
      dispersion = "Mezcla convectiva moderada. Buena ventilación vertical.";
    } else if (solarRadiationWM2 > 100) {
      pasquillClass = 'C_Ligeramente_Inestable';
      pblHeightM = 950;
      dispersion = "Convección ligera complementada por turbulencia mecánica.";
    } else {
      pasquillClass = 'D_Neutra';
      pblHeightM = 700;
      dispersion = "Capa límite neutra dominada por la rugosidad urbana.";
    }
  }

  return {
    timestamp: new Date().toISOString(),
    pasquillClass,
    obukhovLengthMetersL: parseFloat(L.toFixed(1)),
    frictionVelocityUStarMs: parseFloat(uStar.toFixed(3)),
    sensibleHeatFluxHsWM2: parseFloat(Hs.toFixed(1)),
    pblHeightMeters: Math.round(pblHeightM),
    roughnessLengthZ0Meters: z0Meters,
    moninObukhovStabilityZoverL: parseFloat(zOverL.toFixed(4)),
    dispersionCharacteristics: dispersion,
    scientificGuidance: "Formulación de Monin-Obukhov (1954) y Gryning et al. (1987) para capas límite costero-urbanas de la Península Ibérica."
  };
}

export function exportMoninObukhovGeoJson(state: MoninObukhovState): string {
  const geojson = {
    type: "FeatureCollection",
    properties: {
      title: "Monin-Obukhov Boundary Layer Turbulence - Malaga Digital Twin",
      generatedAt: state.timestamp,
      pasquillClass: state.pasquillClass,
      obukhovLengthL: state.obukhovLengthMetersL,
      pblHeightMeters: state.pblHeightMeters
    },
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [-4.42, 36.72]
        },
        properties: { ...state }
      }
    ]
  };
  return JSON.stringify(geojson, null, 2);
}

export function exportMoninObukhovCsv(state: MoninObukhovState): string {
  const headers = "timestamp,pasquillClass,obukhovLengthMetersL,frictionVelocityUStarMs,sensibleHeatFluxHsWM2,pblHeightMeters,roughnessLengthZ0Meters,moninObukhovStabilityZoverL\n";
  const row = `"${state.timestamp}","${state.pasquillClass}",${state.obukhovLengthMetersL},${state.frictionVelocityUStarMs},${state.sensibleHeatFluxHsWM2},${state.pblHeightMeters},${state.roughnessLengthZ0Meters},${state.moninObukhovStabilityZoverL}`;
  return headers + row;
}

export interface CoastalThermalBoundaryLayerResult {
  timestamp: string;
  distanceFromCoastM: number;
  sstCelsius: number;
  landTempCelsius: number;
  deltaTCelsius: number;
  tiblHeightM: number;
  coastalFrictionVelocityMs: number;
  coastalObukhovLengthM: number;
  coastalStabilityZoverL: number;
  marineInversionStrengthKPer100m: number;
  advectivePlumeDampingFactor: number;
  dispersionRegime: 'COASTAL_FUMIGATION' | 'CONVECTIVE_INTERNAL_MIXING' | 'STABLE_MARINE_TRAPPING';
  regimeGuidance: string;
}

/**
 * Modela el crecimiento de la Capa Límite Térmica Interna (TIBL) y la estabilidad
 * de Monin-Obukhov en la franja de transición mar-tierra de la Bahía de Málaga (Garratt 1990 / Venkatram 1977)
 */
export function calculateCoastalThermalBoundaryLayer(
  distanceFromCoastM: number = 850, // p.ej. Paseo del Parque / Alameda
  sstCelsius: number = 19.8,
  landTempCelsius: number = 24.5,
  windSpeedMs: number = 3.2,
  solarRadiationWM2: number = 650,
  z0UrbanM: number = 0.8
): CoastalThermalBoundaryLayerResult {
  const deltaT = landTempCelsius - sstCelsius;
  const tempK = landTempCelsius + 273.15;
  const uStar = Math.max(0.08, (VON_KARMAN_K * windSpeedMs) / Math.log(Math.max(2, 10 / z0UrbanM)));
  
  // Gradiente adiabático seco menos gradiente térmico marino (gamma = dTheta/dz sobre el mar, ~0.006 K/m)
  const lapseRateOverSea = 0.006; // K/m
  
  // Fórmula analítica de Venkatram (1977) y Raynor (1979) para TIBL:
  // h_TIBL(x) = (u* / u_mean) * sqrt( (2 * x * deltaT) / gamma )
  let tiblHeightM = 120;
  if (deltaT > 0) {
    const rawTibl = (uStar / Math.max(0.5, windSpeedMs)) * Math.sqrt((2 * distanceFromCoastM * deltaT) / lapseRateOverSea);
    tiblHeightM = Math.min(1200, Math.max(80, Math.round(rawTibl)));
  } else {
    // Si la tierra está más fría (noche/terral), la capa es estable marina
    tiblHeightM = Math.min(400, Math.max(50, Math.round(150 + deltaT * 15)));
  }

  // Flujo de calor sensible costero acoplado al gradiente de SST
  const hsCoastal = Math.max(-20, solarRadiationWM2 * 0.32 + deltaT * 12.5);
  
  // Longitud de Obukhov costera L = - (u*^3 * rho * cp * T) / (k * g * Hs)
  const lCoastal = hsCoastal !== 0 ? -(Math.pow(uStar, 3) * 1.225 * 1005 * tempK) / (VON_KARMAN_K * GRAVITY_G * hsCoastal) : 9999;
  const zEval = 10;
  const coastalZoverL = zEval / lCoastal;

  // Fuerza de inversión marina remanente (K/100m)
  const marineInversionStrength = deltaT > 0 ? Number((deltaT * 100 / Math.max(50, tiblHeightM)).toFixed(2)) : 0;
  
  // Factor de amortiguamiento de plumas advectadas desde el puerto/muelles (0 a 1)
  const advectiveDamping = Number(Math.exp(-distanceFromCoastM / 2500).toFixed(3));

  let dispersionRegime: 'COASTAL_FUMIGATION' | 'CONVECTIVE_INTERNAL_MIXING' | 'STABLE_MARINE_TRAPPING' = 'CONVECTIVE_INTERNAL_MIXING';
  let regimeGuidance = '';

  if (deltaT > 2.0 && tiblHeightM < 250) {
    dispersionRegime = 'COASTAL_FUMIGATION';
    regimeGuidance = 'Fumigación Costera Activa: Plumas de buques en el puerto penetran la TIBL somera, provocando picos de concentración a cota de suelo en el Paseo del Parque.';
  } else if (deltaT > 0) {
    dispersionRegime = 'CONVECTIVE_INTERNAL_MIXING';
    regimeGuidance = 'Mezcla Térmica Interna: El calentamiento del sustrato urbano desarrolla la TIBL convectiva, favoreciendo la dispersión vertical progresiva.';
  } else {
    dispersionRegime = 'STABLE_MARINE_TRAPPING';
    regimeGuidance = 'Atrapamiento en Capa Marina Estable: La tierra más fría o terral nocturno suprime la convección, comprimiendo los contaminantes cerca de la costa.';
  }

  return {
    timestamp: new Date().toISOString(),
    distanceFromCoastM,
    sstCelsius,
    landTempCelsius,
    deltaTCelsius: Number(deltaT.toFixed(2)),
    tiblHeightM,
    coastalFrictionVelocityMs: Number(uStar.toFixed(3)),
    coastalObukhovLengthM: Number(lCoastal.toFixed(1)),
    coastalStabilityZoverL: Number(coastalZoverL.toFixed(4)),
    marineInversionStrengthKPer100m: marineInversionStrength,
    advectivePlumeDampingFactor: advectiveDamping,
    dispersionRegime,
    regimeGuidance
  };
}

