/**
 * Módulo Físico-Químico de Macro-Emisores de Málaga: Planta Cementera de La Araña (Este) vs Aeropuerto AGP (Oeste).
 * Normativa: Directiva 2010/75/UE (IPPC / E-PRTR), OACI Anexo 16 Vol. II, EMEP/EEA Tier 3.
 * Tesis Doctoral: Gemelo Digital de Málaga.
 * Cero aleatoriedad (Math.random === 0).
 */

export interface IndustrialStackParameters {
  facilityId: string;
  facilityName: string;
  sectorCode: string; // E-PRTR
  lat: number;
  lon: number;
  stackHeightM: number;
  stackDiameterM: number;
  stackVelocityMs: number;
  gasTemperatureC: number;
  volumetricFlowNm3H: number;
  fuelType: string;
  emissionRateNOxGs: number;
  emissionRateSO2Gs: number;
  emissionRatePM10Gs: number;
  emissionRatePM25Gs: number;
  annualCO2FossilTon: number;
  annualNOxTon: number;
  annualSO2Ton: number;
  annualPM10Ton: number;
}

export interface AirportLtoBenchmark {
  facilityId: string;
  facilityName: string;
  icaoCode: string;
  lat: number;
  lon: number;
  annualPassengers: number;
  dailyMovementsAverage: number;
  activeRunways: string[];
  referenceEngines: string[];
  annualNOxLtoTon: number;
  annualCOLtoTon: number;
  annualNvPmSootTon: number;
  annualFuelBurnTon: number;
  corridorRoadTrafficAadt: number; // IMD MA-21
  corridorRoadNOxTonYear: number;
}

export interface PlumeDispersionResult {
  sourceId: 'arana_cementos' | 'aeropuerto_agp';
  sourceName: string;
  effectiveReleaseHeightM: number; // Hs + Delta_h
  plumeRiseDeltaHM: number;
  downwindAngleDeg: number;
  plumeAxisBearingDeg: number;
  activeWindSpeedMs: number;
  ambientTempC: number;
  atmosphericStabilityClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  dispersionRegimeName: string;
  primaryAffectedDistricts: string[];
  receptorImpactSummary: string;
  // Concentraciones máximas estimadas en superficie
  maxGroundLevelNO2UgM3: number;
  distanceToMaxGroundConcKm: number;
}

export interface ActivePointMacroSourceImpact {
  pointName: string;
  lat: number;
  lon: number;
  // Aportes Cementera La Araña
  distToAranaKm: number;
  bearingToAranaDeg: number;
  isDownwindFromArana: boolean;
  deltaNO2AranaUgM3: number;
  deltaSO2AranaUgM3: number;
  deltaPM10AranaUgM3: number;
  // Aportes Aeropuerto AGP
  distToAirportKm: number;
  bearingToAirportDeg: number;
  isDownwindFromAirport: boolean;
  deltaNO2AirportUgM3: number;
  deltaPM25AirportUgM3: number;
  deltaBCAirportUgM3: number;
  // Diagnóstico comparativo
  predominantMacroSource: 'arana_cementos' | 'aeropuerto_agp' | 'none';
  dominantSourceExplanation: string;
  downwindAngleDeg: number;
  aranaTrajectoryDescription: string;
  airportTrajectoryDescription: string;
}

export interface NearbyDetectorStation {
  id: string;
  name: string;
  type: 'air_quality_station' | 'satellite_pixel' | 'meteorological_metar' | 'traffic_loop' | 'ocean_buoy';
  typeLabel: string;
  network: string;
  lat: number;
  lon: number;
  distanceToSourceKm: number;
  directionFromSource: string;
  keySensors: string[];
  operationalRole: string;
  referenceStandard: string;
}

/**
 * Detectores y sensores oficiales asimilables en el entorno de la Planta Cementera de La Araña (Este)
 */
export const ARANA_NEARBY_DETECTORS: NearbyDetectorStation[] = [
  {
    id: 'candado_aai_perimetral',
    name: 'Estación Perimetral El Candado / Autocontrol AAI',
    type: 'air_quality_station',
    typeLabel: 'Estación Fija Inmisión',
    network: 'Red de Vigilancia de la Junta de Andalucía / AAI Heidelberg',
    lat: 36.7145,
    lon: -4.3312,
    distanceToSourceKm: 1.4,
    directionFromSource: 'ONO (Hacia El Candado)',
    keySensors: ['NO2', 'NO', 'PM10', 'SO2', 'Partículas Sedimentables'],
    operationalRole: 'Vigilancia continua en la interfase residencial entre la cementera y la barriada de El Candado. Mide el impacto directo con viento de Levante.',
    referenceStandard: 'Directiva 2008/50/CE & Autorización Ambiental Integrada AAI'
  },
  {
    id: 'tropomi_arana_pixel',
    name: 'Píxel Troposférico Satelital Sentinel-5P (TROPOMI)',
    type: 'satellite_pixel',
    typeLabel: 'Sensor Satelital ESA',
    network: 'Copernicus Atmospheric Monitoring Service (CAMS)',
    lat: 36.7118,
    lon: -4.3168,
    distanceToSourceKm: 0.0,
    directionFromSource: 'Cenital (3.5x5.5 km²)',
    keySensors: ['Columna Troposférica NO2 (µmol/m²)', 'HCHO', 'Aerosol Index (AI)'],
    operationalRole: 'Detección satelital de la pluma total de combustión y descarbonatación en la vertical de la chimenea.',
    referenceStandard: 'Misión ESA Copernicus Sentinel-5P'
  },
  {
    id: 'puerto_candado_buoy',
    name: 'Boya Meteorológica Costera Alborán / El Candado',
    type: 'ocean_buoy',
    typeLabel: 'Boya Oceanográfica',
    network: 'Puertos del Estado / Red de Boyas Costeras',
    lat: 36.7050,
    lon: -4.3280,
    distanceToSourceKm: 1.3,
    directionFromSource: 'SSO (Mar de Alborán)',
    keySensors: ['SST (°C)', 'Viento Litoral (u, θ)', 'Humedad Relativa', 'Presión Barométrica'],
    operationalRole: 'Determina el gradiente térmico mar-tierra que desencadena la fumigación costera (TIBL) y advección de spray salino hacia el foco.',
    referenceStandard: 'Red REDCOS Puertos del Estado'
  }
];

/**
 * Detectores y sensores oficiales asimilables en el entorno del Aeropuerto de Málaga AGP (Oeste)
 */
export const AIRPORT_NEARBY_DETECTORS: NearbyDetectorStation[] = [
  {
    id: 'guadalhorce_aeropuerto_station',
    name: 'Estación Calidad del Aire Guadalhorce / Aeropuerto AGP (ES2105A)',
    type: 'air_quality_station',
    typeLabel: 'Cabina Oficial Red Junta',
    network: 'Red de Calidad del Aire de la Junta de Andalucía / AENA',
    lat: 36.6749,
    lon: -4.4780,
    distanceToSourceKm: 0.2,
    directionFromSource: 'Pie de Pista 13/31',
    keySensors: ['NO2', 'NO', 'PM10', 'PM2.5', 'Black Carbon (Soot)', 'SO2', 'O3'],
    operationalRole: 'Monitorización de las emisiones directas del ciclo LTO (despegue, carreteo y aterrizaje) en la capa límite superficial.',
    referenceStandard: 'OACI Anexo 16 Vol. II & Directiva 2008/50/CE'
  },
  {
    id: 'metar_lemg_aemet',
    name: 'Estación Meteorológica Aeronáutica AEMET LEMG (6155A)',
    type: 'meteorological_metar',
    typeLabel: 'Anemometría METAR/SPECI',
    network: 'AEMET Aeronáutica / OACI',
    lat: 36.6750,
    lon: -4.4990,
    distanceToSourceKm: 0.1,
    directionFromSource: 'Cabecera Operativa',
    keySensors: ['Viento Cabecera (u, θ)', 'Temperatura Aire / Rocío', 'QNH Barométrico', 'RVR Visibilidad'],
    operationalRole: 'Reportes METAR/SPECI oficiales cada 30 min. Determina la orientación activa de pistas (13 vs 31) y dispersión por drenaje fluvial.',
    referenceStandard: 'Reglamento de Circulación Aérea Operativa OACI'
  },
  {
    id: 'ma21_traffic_loop',
    name: 'Espiras de Aforo de Tráfico Autovía MA-21 / Acceso Aeropuerto',
    type: 'traffic_loop',
    typeLabel: 'Espiras Inductivas DGT',
    network: 'DGT / Área de Movilidad Ayuntamiento de Málaga',
    lat: 36.6800,
    lon: -4.4720,
    distanceToSourceKm: 0.8,
    directionFromSource: 'Noreste (Corredor MA-21)',
    keySensors: ['IMD Horaria (veh/h)', 'Velocidad Media Vías', 'Fracción Flota Pesada (%)'],
    operationalRole: 'Cuantifica las emisiones vehiculares inducidas por la actividad de pasajeros y logística de carga en el eje de Carretera de Cádiz.',
    referenceStandard: 'COPERT 5 / Guía EMEP/EEA 2023'
  }
];

/**
 * Datos oficiales de la Planta de Cemento de La Araña (Heidelberg Materials / FYM)
 * Fuente: Registro Estatal E-PRTR (PRTR-España ES-PRTR-290001) / AAI Junta de Andalucía
 */
export const ARANA_CEMENT_PLANT_DATA: IndustrialStackParameters = {
  facilityId: 'ES-PRTR-290001',
  facilityName: 'Fábrica de Cemento Heidelberg Materials (La Araña)',
  sectorCode: 'IPPC 3.1 / Fabricación de Clinker y Cemento',
  lat: 36.7118,
  lon: -4.3168,
  stackHeightM: 85.0,
  stackDiameterM: 2.8,
  stackVelocityMs: 18.5,
  gasTemperatureC: 210.0,
  volumetricFlowNm3H: 410000,
  fuelType: 'Coque de petróleo + Combustibles Derivados de Residuos (CDR) + Biomasa',
  emissionRateNOxGs: 128.5, // g/s en operación nominal continua
  emissionRateSO2Gs: 34.2,
  emissionRatePM10Gs: 8.4,
  emissionRatePM25Gs: 3.6,
  annualCO2FossilTon: 785400,
  annualNOxTon: 4052,
  annualSO2Ton: 1078,
  annualPM10Ton: 265
};

/**
 * Datos oficiales del Aeropuerto de Málaga-Costa del Sol (LEMG / AGP)
 * Fuente: OACI Engine Databank / AENA Estadísticas Anuales / EMEP/EEA Aviación Tier 3
 */
export const MALAGA_AIRPORT_LEMG_DATA: AirportLtoBenchmark = {
  facilityId: 'AENA-LEMG-AGP',
  facilityName: 'Aeropuerto de Málaga-Costa del Sol (AGP/LEMG)',
  icaoCode: 'LEMG',
  lat: 36.6749,
  lon: -4.4780,
  annualPassengers: 22340000,
  dailyMovementsAverage: 450,
  activeRunways: ['Pista 13/31 (3.200 m)', 'Pista 12/30 (2.750 m)'],
  referenceEngines: ['CFM International CFM56-7B (Boeing 737-800)', 'CFM LEAP-1A (Airbus A320neo)', 'Pratt & Whitney PW1100G'],
  annualNOxLtoTon: 1845,
  annualCOLtoTon: 1420,
  annualNvPmSootTon: 42.5,
  annualFuelBurnTon: 165000,
  corridorRoadTrafficAadt: 86500, // IMD Autovía MA-21 (Avenida Velázquez)
  corridorRoadNOxTonYear: 620
};

/**
 * Cálculo analítico de elevación de penacho de Holland (1953) y Briggs (1975)
 * delta_h = (vs * d / u) * [ 1.5 + 2.68e-3 * P * d * ((Ts - Ta) / Ts) ]
 */
export function calculateHollandPlumeRise(
  stackVelMs: number,
  stackDiameterM: number,
  windSpeedMs: number,
  gasTempC: number,
  ambientTempC: number,
  pressureHpa: number = 1013.25
): number {
  const u = Math.max(0.8, windSpeedMs);
  const Ts = gasTempC + 273.15;
  const Ta = ambientTempC + 273.15;
  const d = stackDiameterM;

  const deltaH = (stackVelMs * d / u) * (1.5 + 2.68e-3 * pressureHpa * d * ((Ts - Ta) / Ts));
  return Number(Math.max(5.0, Math.min(180.0, deltaH)).toFixed(1));
}

/**
 * Determina la clase de estabilidad atmosférica de Pasquill-Gifford (A-F) determinísticamente
 */
export function determinePasquillStabilityClass(
  windSpeedMs: number,
  solarRadiationWm2: number
): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
  if (solarRadiationWm2 > 600) {
    if (windSpeedMs < 2) return 'A';
    if (windSpeedMs < 3) return 'A';
    if (windSpeedMs < 5) return 'B';
    return 'C';
  } else if (solarRadiationWm2 > 300) {
    if (windSpeedMs < 2) return 'B';
    if (windSpeedMs < 5) return 'C';
    return 'D';
  } else if (solarRadiationWm2 > 100) {
    if (windSpeedMs < 2) return 'C';
    return 'D';
  } else {
    // Nocturno o nubosidad densa
    if (windSpeedMs < 2) return 'F';
    if (windSpeedMs < 3) return 'E';
    return 'D';
  }
}

/**
 * Simulación física del comportamiento de dispersión de la Planta de La Araña
 */
export function evaluateAranaCementPlume(
  windSpeedMs: number,
  windDirDeg: number,
  ambientTempC: number,
  solarRadiationWm2: number = 650
): PlumeDispersionResult {
  const stack = ARANA_CEMENT_PLANT_DATA;
  const plumeRise = calculateHollandPlumeRise(
    stack.stackVelocityMs,
    stack.stackDiameterM,
    windSpeedMs,
    stack.gasTemperatureC,
    ambientTempC
  );
  const effectiveHeight = stack.stackHeightM + plumeRise;
  const downwindBearing = (windDirDeg + 180) % 360;
  const stability = determinePasquillStabilityClass(windSpeedMs, solarRadiationWm2);

  // Clasificación del cuadrante de dispersión
  let primaryDistricts: string[] = [];
  let regimeName = '';
  let impactSummary = '';

  // Viento de Levante (E/SE: 80° - 140°) empuja hacia el Oeste (El Candado, El Palo, Málaga Este)
  if (windDirDeg >= 70 && windDirDeg <= 140) {
    regimeName = 'Régimen de Levante Costero (Advección Hacia Málaga Este)';
    primaryDistricts = ['La Araña', 'El Candado', 'El Palo', 'Pedregalejo', 'Estribaciones Montes'];
    impactSummary = 'La pluma industrial se desplaza paralela a la línea de costa impactando las cotas intermedias de El Candado y El Palo.';
  } else if (windDirDeg >= 280 && windDirDeg <= 350) {
    // Terral (NW: 280° - 350°) empuja hacia el Mar de Alborán (SE)
    regimeName = 'Régimen de Terral Noroeste (Dispersión Mar Adentro)';
    primaryDistricts = ['Bahía de Málaga Exterior', 'Mar de Alborán'];
    impactSummary = 'Viento catabático de Terral arrastra la totalidad de la pluma hacia alta mar sin afección a zonas residenciales.';
  } else if (windDirDeg >= 220 && windDirDeg < 280) {
    // Poniente (SW/W: 220° - 280°) empuja hacia Rincón de la Victoria / Axarquía
    regimeName = 'Régimen de Poniente Litoral (Advección Hacia La Axarquía)';
    primaryDistricts = ['La Cala del Moral', 'Rincón de la Victoria', 'Totalán'];
    impactSummary = 'La pluma se desplaza en dirección este fuera del municipio de Málaga, hacia el litoral de La Cala del Moral.';
  } else {
    regimeName = 'Régimen de Brisas Locales / Transición Térmica';
    primaryDistricts = ['Litoral Oriental de La Araña', 'Bahía'];
    impactSummary = 'Condiciones de mezcla local con sobreelevación de penacho por encima de la capa límite urbana superficial.';
  }

  // Máxima concentración estimada en superficie (ecuación gaussiana elevada)
  // C_max = (2 * Q) / (e * pi * u * H_eff^2) * (sigma_z / sigma_y)
  const Q_nox = stack.emissionRateNOxGs * 1e6; // µg/s
  const u = Math.max(1.0, windSpeedMs);
  const maxConc = Number(((2 * Q_nox) / (Math.E * Math.PI * u * Math.pow(effectiveHeight, 2)) * 0.45).toFixed(1));
  const distMaxKm = Number((effectiveHeight * 0.015).toFixed(2));

  return {
    sourceId: 'arana_cementos',
    sourceName: stack.facilityName,
    effectiveReleaseHeightM: effectiveHeight,
    plumeRiseDeltaHM: plumeRise,
    downwindAngleDeg: downwindBearing,
    plumeAxisBearingDeg: downwindBearing,
    activeWindSpeedMs: windSpeedMs,
    ambientTempC,
    atmosphericStabilityClass: stability,
    dispersionRegimeName: regimeName,
    primaryAffectedDistricts: primaryDistricts,
    receptorImpactSummary: impactSummary,
    maxGroundLevelNO2UgM3: maxConc,
    distanceToMaxGroundConcKm: distMaxKm
  };
}

/**
 * Simulación física del impacto del Aeropuerto AGP sobre los distritos de la Zona Oeste
 */
export function evaluateAirportWesternImpact(
  windSpeedMs: number,
  windDirDeg: number,
  ambientTempC: number,
  dailyFlightsCount: number = 450
): PlumeDispersionResult {
  const airport = MALAGA_AIRPORT_LEMG_DATA;
  const downwindBearing = (windDirDeg + 180) % 360;
  const flightFactor = Math.max(0.5, dailyFlightsCount / 450);

  let affectedDistricts: string[] = [];
  let regimeName = '';
  let impactSummary = '';

  // Brisa marina de S/SO (160° - 240°) empuja directamente hacia el N/NE: Carretera de Cádiz, Churriana, Cruz de Humilladero
  if (windDirDeg >= 150 && windDirDeg <= 240) {
    regimeName = 'Brisa Marina Suroeste (Canalización Hacia Carretera de Cádiz)';
    affectedDistricts = ['Distrito 7: Carretera de Cádiz (Huelin, La Paz, San Andrés)', 'Distrito 8: Churriana (Guadalmar, San Julián)', 'Distrito 6: Cruz de Humilladero', 'Polígono Guadalhorce'];
    impactSummary = 'MÁXIMA AFECCIÓN POBLACIONAL: La brisa marina empuja las emisiones de rodaje, despegue y corredor MA-21 directamente sobre la zona de mayor densidad urbana de Málaga.';
  } else if (windDirDeg >= 300 || windDirDeg <= 30) {
    // Viento del Norte / Terral (empuja hacia el Mar / Sur)
    regimeName = 'Ventilación del Guadalhorce Hacia el Mar (Despeje Urbano)';
    affectedDistricts = ['Litoral Sur de Guadalmar', 'Desembocadura del Guadalhorce'];
    impactSummary = 'El flujo descendente del valle ventila las pistas hacia el mar, reduciendo significativamente la inmisión en Carretera de Cádiz.';
  } else {
    regimeName = 'Dispersión Lateral en Valle del Guadalhorce';
    affectedDistricts = ['Churriana', 'Alhaurín de la Torre (Límite)', 'Polígonos Industriales Oeste'];
    impactSummary = 'Dispersión en abanico sobre la vega baja y polígonos industriales del margen occidental.';
  }

  // Concentración a nivel peatonal 1.8m AGL en el receptor representativo de Carretera de Cádiz
  const isSouthBreeze = windDirDeg >= 150 && windDirDeg <= 240;
  const baseNO2Ground = isSouthBreeze ? (14.5 * flightFactor * (3.0 / Math.max(1.5, windSpeedMs))) : 3.8;

  return {
    sourceId: 'aeropuerto_agp',
    sourceName: airport.facilityName,
    effectiveReleaseHeightM: 15.0, // Cota baja de emisión de pistas y rodaje
    plumeRiseDeltaHM: 0.0,
    downwindAngleDeg: downwindBearing,
    plumeAxisBearingDeg: downwindBearing,
    activeWindSpeedMs: windSpeedMs,
    ambientTempC,
    atmosphericStabilityClass: 'D',
    dispersionRegimeName: regimeName,
    primaryAffectedDistricts: affectedDistricts,
    receptorImpactSummary: impactSummary,
    maxGroundLevelNO2UgM3: Number(baseNO2Ground.toFixed(1)),
    distanceToMaxGroundConcKm: 2.8 // Distancia del umbral de pista a Carretera de Cádiz
  };
}

/**
 * Calcula la distancia haversine en kilómetros entre dos coordenadas WGS84
 */
export function calculateHaversineDistanceKm(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Calcula el acimut / rumbo en grados desde un punto A hasta un punto B
 */
export function calculateBearingDeg(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return Number(((brng + 360) % 360).toFixed(1));
}

/**
 * Evalúa el impacto simultáneo de La Araña (Este) y Aeropuerto AGP (Oeste) en el punto activo actual
 */
export function evaluateActivePointMacroSourcesImpact(
  pointName: string,
  lat: number,
  lon: number,
  windSpeedMs: number,
  windDirDeg: number,
  ambientTempC: number
): ActivePointMacroSourceImpact {
  const arana = ARANA_CEMENT_PLANT_DATA;
  const airport = MALAGA_AIRPORT_LEMG_DATA;

  // 1. Métricas con respecto a La Araña (Este)
  const distArana = calculateHaversineDistanceKm(lat, lon, arana.lat, arana.lon);
  const bearingFromArana = calculateBearingDeg(arana.lat, arana.lon, lat, lon);
  const windDownwind = (windDirDeg + 180) % 360;
  const diffAngleArana = Math.abs(((bearingFromArana - windDownwind + 180) % 360) - 180);
  const isDownwindArana = diffAngleArana <= 45.0;

  // Aporte analítico de La Araña en el punto
  let deltaNO2Arana = 0;
  let deltaSO2Arana = 0;
  let deltaPM10Arana = 0;

  if (isDownwindArana && distArana > 0.5 && distArana < 25.0) {
    const sigmaY = 0.15 * distArana * 1000;
    const effH = calculateHollandPlumeRise(arana.stackVelocityMs, arana.stackDiameterM, windSpeedMs, arana.gasTemperatureC, ambientTempC) + arana.stackHeightM;
    const decayFactor = Math.exp(-Math.pow(diffAngleArana / 18.0, 2)) * Math.exp(-distArana / 12.0);
    deltaNO2Arana = Number(((arana.emissionRateNOxGs * 1000 / (Math.PI * Math.max(1.0, windSpeedMs) * sigmaY)) * decayFactor * 0.4).toFixed(2));
    deltaSO2Arana = Number((deltaNO2Arana * (arana.emissionRateSO2Gs / arana.emissionRateNOxGs)).toFixed(2));
    deltaPM10Arana = Number((deltaNO2Arana * (arana.emissionRatePM10Gs / arana.emissionRateNOxGs)).toFixed(2));
  }

  // 2. Métricas con respecto al Aeropuerto AGP (Oeste)
  const distAirport = calculateHaversineDistanceKm(lat, lon, airport.lat, airport.lon);
  const bearingFromAirport = calculateBearingDeg(airport.lat, airport.lon, lat, lon);
  const diffAngleAirport = Math.abs(((bearingFromAirport - windDownwind + 180) % 360) - 180);
  const isDownwindAirport = diffAngleAirport <= 45.0;

  let deltaNO2Airport = 0;
  let deltaPM25Airport = 0;
  let deltaBCAirport = 0;

  if (isDownwindAirport && distAirport > 0.2 && distAirport < 20.0) {
    const decayFactorAirport = Math.exp(-Math.pow(diffAngleAirport / 22.0, 2)) * Math.exp(-distAirport / 6.5);
    deltaNO2Airport = Number(((28.5 / Math.max(1.2, windSpeedMs)) * decayFactorAirport).toFixed(2));
    deltaPM25Airport = Number((deltaNO2Airport * 0.42).toFixed(2));
    deltaBCAirport = Number((deltaNO2Airport * 0.08).toFixed(2));
  }

  // 3. Diagnóstico comparativo y trayectoria de penachos
  let predominant: 'arana_cementos' | 'aeropuerto_agp' | 'none' = 'none';
  let explanation = '';

  const aranaTrajectory = windDirDeg >= 70 && windDirDeg <= 140
    ? `Rumbo ${(windDownwind).toFixed(0)}° O (Levante hacia El Candado, El Palo y Málaga Este)`
    : windDirDeg >= 280 && windDirDeg <= 350
    ? `Rumbo ${(windDownwind).toFixed(0)}° SE (Terral hacia el Mar de Alborán mar adentro)`
    : windDirDeg >= 200 && windDirDeg < 280
    ? `Rumbo ${(windDownwind).toFixed(0)}° E (Poniente hacia La Cala del Moral y Axarquía)`
    : `Rumbo ${(windDownwind).toFixed(0)}° (Régimen de brisas costeras locales)`;

  const airportTrajectory = windDirDeg >= 300 || windDirDeg <= 40
    ? `Rumbo ${(windDownwind).toFixed(0)}° S/SE (Drenaje del Guadalhorce hacia Guadalmar y Bahía)`
    : windDirDeg >= 120 && windDirDeg <= 200
    ? `Rumbo ${(windDownwind).toFixed(0)}° N/NE (Brisa marina hacia Teatinos y Valle interior)`
    : `Rumbo ${(windDownwind).toFixed(0)}° (Dispersión transversal hacia Carretera de Cádiz / MA-21)`;

  if (deltaNO2Airport > deltaNO2Arana && deltaNO2Airport > 0.5) {
    predominant = 'aeropuerto_agp';
    explanation = `El punto está en el corredor de sotavento del Aeropuerto de Málaga (d = ${distAirport} km). El despegue y rodaje de aeronaves y el eje MA-21 aportan +${deltaNO2Airport} µg/m³ de NO₂.`;
  } else if (deltaNO2Arana > deltaNO2Airport && deltaNO2Arana > 0.5) {
    predominant = 'arana_cementos';
    explanation = `El punto está alineado con la pluma elevada de la Planta Cementera de La Araña (d = ${distArana} km). La chimenea aporta +${deltaNO2Arana} µg/m³ de NO₂ y +${deltaSO2Arana} µg/m³ de SO₂.`;
  } else {
    explanation = `El viento actual (${windSpeedMs.toFixed(1)} m/s, dir ${windDirDeg}°) no alinea directamente este punto con los conos de dispersión de ninguno de los dos macro-emisores.`;
  }

  return {
    pointName,
    lat,
    lon,
    distToAranaKm: distArana,
    bearingToAranaDeg: bearingFromArana,
    isDownwindFromArana: isDownwindArana,
    deltaNO2AranaUgM3: deltaNO2Arana,
    deltaSO2AranaUgM3: deltaSO2Arana,
    deltaPM10AranaUgM3: deltaPM10Arana,
    distToAirportKm: distAirport,
    bearingToAirportDeg: bearingFromAirport,
    isDownwindFromAirport: isDownwindAirport,
    deltaNO2AirportUgM3: deltaNO2Airport,
    deltaPM25AirportUgM3: deltaPM25Airport,
    deltaBCAirportUgM3: deltaBCAirport,
    predominantMacroSource: predominant,
    dominantSourceExplanation: explanation,
    downwindAngleDeg: windDownwind,
    aranaTrajectoryDescription: aranaTrajectory,
    airportTrajectoryDescription: airportTrajectory
  };
}
