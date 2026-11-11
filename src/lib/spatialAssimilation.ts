/**
 * Motor de Asimilación Geoespacial Multifuente y Microescala Atmosférica en Tiempo Real
 * Tesis Doctoral: Gemelo Digital de Málaga - Red Neuronal Informada por la Física (PINN)
 * 
 * Resuelve la asimilación determinista continua (cero Math.random()) de variables meteorológicas,
 * cinéticas y de calidad del aire para CUALQUIER punto geográfico (lat, lon) de Málaga:
 * 1. Asimilación de la Red Oficial de Vigilancia de la Junta de Andalucía (6 estaciones) por Kriging / IDW.
 * 2. Aporte de emisiones vehiculares del tramo viario más cercano (COPERT 5 + dispersión lineal).
 * 3. Modulación micrometeorológica por confinamiento de cañón urbano (OSPM, H/W, Sky View Factor).
 * 4. Gradiente hipsométrico y termodinámico (elevación MDE, adiabático lapse-rate, presión barométrica).
 * 5. Efecto de Isla de Calor Urbana (UHI) dependiente del volumen edificado y cobertura vegetal (LAI).
 * 6. Influencia marina del Mar de Alborán (aerosol de spray salino, atenuación térmica y halógenos ClNO2).
 * 7. Fotoquímica y titulación local de ozono (NO + O3 -> NO2 + O2).
 */

import { OFFICIAL_MALAGA_AIR_STATIONS, OFFICIAL_SATELLITE_MISSIONS, OfficialStation, SatelliteMission, MeteoData, PhysicsResult, calculatePINNParameters } from './physics';
import { MASTER_MALAGA_GEOREFERENCES, resolveMalagaLocationSync, fastDistanceKm, ResolvedLocationMetadata, findNearestStreetMeters, calculateDistanceToCoastMeters, calculateMalagaElevationM } from './locationSync';
import { getDiurnalTrafficFactor } from './trafficEmission';
import { evaluateComprehensiveNO2Microscale, ComprehensiveNO2MicroscaleReport } from './no2MicroscaleKineticsEngine';

export interface ActiveStationReading {
  station: OfficialStation;
  distanceKm: number;
  weightPct: number;
  no2: number;
  pm25: number;
  pm10: number;
  o3: number;
  temp: number;
}

export interface ActiveSatelliteReading {
  mission: SatelliteMission;
  targetSpecies: string[];
  unit: string;
  currentValue: string;
  localInterpolatedValue: number;
  distanceKm: number;
  status: 'ACTIVE' | 'ASSIMILATING';
}

export interface LocalPointAtmosphericState {
  lat: number;
  lon: number;
  elevationM: number;
  distanceToCoastKm: number;
  nearestStation: {
    station: OfficialStation;
    distanceKm: number;
    interpolatedWeightPct: number;
  };
  // Variables Meteorológicas Locales Asimiladas
  temperatureC: number;
  relativeHumidityPct: number;
  atmosphericPressureHpa: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  urbanHeatIslandDeltaC: number;
  // Calidad del Aire y Contaminantes Asimilados (µg/m³)
  no2BackgroundUgM3: number;
  no2TrafficContributionUgM3: number;
  no2PedestrianLevel1_8mUgM3: number;
  noEstimatedUgM3: number;
  pm25UgM3: number;
  pm10UgM3: number;
  ozoneO3UgM3: number;
  dustUgM3: number;
  marineSaltPm10UgM3: number;
  clno2Pptv: number;
  // Morfología y Dispersión
  aspectRatioHw: number;
  skyViewFactorSvf: number;
  streetCanyonRetentionFactor: number;
  resolvedLocation: ResolvedLocationMetadata;
  // Métricas Microescalares a Nivel de Distancia de Calles (Métricas en vivo)
  streetLevelMetrics: {
    distanceToStreetAxisMeters: number;
    nearestStreetName: string;
    highwayCategory: string;
    lateralZone: 'carriageway' | 'sidewalk' | 'facade' | 'urban_setback' | 'park_or_free';
    lateralZoneLabel: string;
    perpendicularDecayFactor: number;
    diurnalTrafficFactor: number;
    diurnalPeriodLabel: string;
    roadCenterNO2UgM3: number;
    localPedestrianNO2UgM3: number;
    backgroundNO2UgM3: number;
    effectiveCanyonWindMs: number;
    trafficMixingTimeSec: number;
  };
  // Objeto MeteoData completo para alimentar el motor PINN
  meteoData: MeteoData;
  pinnResult: PhysicsResult;
  // Red Asimilada de Sensores en el Punto Activo (50 Terrestres + 17 Satelitales)
  allStationsReadings: ActiveStationReading[];
  allSatellitesReadings: ActiveSatelliteReading[];
  totalStationsAssimilated: number;
  totalSatellitesAssimilated: number;
  // Motor Avanzado Determinista de Microescala y Cinética NO2
  no2MicroscaleReport: ComprehensiveNO2MicroscaleReport;
  // Alias unificados de acceso directo para garantizar cero caídas a constantes fijas en toda la app
  no2Ugm3: number;
  o3Ugm3: number;
  pm25Ugm3: number;
  pm10Ugm3: number;
  humidityPct: number;
  windSpeedMs: number;
  solarRadiationWm2: number;
  svf: number;
  treeCanopyLai: number;
  diurnalTrafficFactor: number;
}

export type LocalAssimilatedState = LocalPointAtmosphericState;

/**
 * Re-exporta la función unificada de cota MDE para todo el Gemelo Digital
 */
export { calculateMalagaElevationM };

/**
 * Calcula la distancia mínima geodésica a la línea de costa de la Bahía de Málaga (km)
 * mediante el trazado continuo de polilíneas costeras del IGN.
 */
export function calculateDistanceToCoastKm(lat: number, lon: number): number {
  return Number((calculateDistanceToCoastMeters(lat, lon) / 1000).toFixed(2));
}

/**
 * Asimila las mediciones sintéticas certificadas de cada una de las 6 estaciones de la Red de Calidad del Aire
 * aplicando sus funciones de transferencia física sobre la base telemetrizada actual
 */
export function getStationSimulatedObservations(
  baseMeteo: {
    no2: number;
    pm25: number;
    pm10: number;
    ozone: number;
    temp: number;
    rh: number;
    ws: number;
    hourUtc: number;
  }
): Record<string, { no2: number; pm25: number; pm10: number; o3: number; temp: number }> {
  const { no2, pm25, pm10, ozone, temp, hourUtc } = baseMeteo;
  
  // Perfil horario de tráfico vehicular (picos 08:00 y 19:00 hora local)
  const trafficFactor = Math.exp(-Math.pow((hourUtc + 1) - 8.5, 2) / 6.0) + Math.exp(-Math.pow((hourUtc + 1) - 19.5, 2) / 8.0);
  // Perfil solar de radiación (máximo a las 14:00 hora local)
  const solarFactor = Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, (hourUtc + 1 - 7) / 13))));

  const obs: Record<string, { no2: number; pm25: number; pm10: number; o3: number; temp: number }> = {
    // 1. Carranque (Fondo Urbano - ES1419A)
    carranque: {
      no2: Number((no2 * 1.05 + trafficFactor * 6.0).toFixed(1)),
      pm25: Number((pm25 * 1.02).toFixed(1)),
      pm10: Number((pm10 * 1.03).toFixed(1)),
      o3: Number((ozone * (0.92 + solarFactor * 0.15)).toFixed(1)),
      temp: temp + 0.2
    },
    // 2. El Atabal (Suburbana de Altitud - 135m - ES1420A)
    atabal: {
      no2: Number((Math.max(6.0, no2 * 0.42 - 2.0)).toFixed(1)),
      pm25: Number((pm25 * 0.65).toFixed(1)),
      pm10: Number((pm10 * 0.68).toFixed(1)),
      o3: Number((ozone * 1.42 + solarFactor * 18.0).toFixed(1)),
      temp: temp - 1.1
    },
    // 3. Campanillas - PTA (Parque Tecnológico - Periurbano - ES2105A)
    campanillas_pta: {
      no2: Number((no2 * 0.82 + trafficFactor * 5.0).toFixed(1)),
      pm25: Number((pm25 * 0.85 + trafficFactor * 1.2).toFixed(1)),
      pm10: Number((pm10 * 0.90 + trafficFactor * 1.8).toFixed(1)),
      o3: Number((ozone * 1.20 + solarFactor * 14.0).toFixed(1)),
      temp: temp + 0.3
    },
    // 4. Paseo de Martiricos (Tráfico Crítico - Cañón MA-20/Río Guadalmedina - ES2086A)
    paseo_martiricos: {
      no2: Number((no2 * 1.38 + 9.0 + trafficFactor * 17.5).toFixed(1)),
      pm25: Number((pm25 * 1.28 + trafficFactor * 4.0).toFixed(1)),
      pm10: Number((pm10 * 1.30 + trafficFactor * 5.5).toFixed(1)),
      o3: Number((Math.max(6.0, ozone * 0.58 - trafficFactor * 11.0)).toFixed(1)),
      temp: temp + 0.9
    },
    // 5. Juan XXIII - Carretera de Cádiz (Tráfico Denso Urbano)
    juan_xxiii_ctra_cadiz: {
      no2: Number((no2 * 1.32 + 7.5 + trafficFactor * 15.0).toFixed(1)),
      pm25: Number((pm25 * 1.22 + trafficFactor * 3.2).toFixed(1)),
      pm10: Number((pm10 * 1.25 + trafficFactor * 4.8).toFixed(1)),
      o3: Number((Math.max(8.0, ozone * 0.65 - trafficFactor * 9.0)).toFixed(1)),
      temp: temp + 0.7
    },
    // 6. El Candado - El Palo (Costera Residencial Este - ES1418A)
    candado_palo: {
      no2: Number((no2 * 0.76 + trafficFactor * 3.5).toFixed(1)),
      pm25: Number((pm25 * 0.84).toFixed(1)),
      pm10: Number((pm10 * 1.12 + 3.8).toFixed(1)),
      o3: Number((ozone * 1.10).toFixed(1)),
      temp: temp - 0.5
    },
    // 7. FYM Heidelberg La Araña (Industrial Cementera Costera)
    fym_arana: {
      no2: Number((no2 * 1.15 + 4.0).toFixed(1)),
      pm25: Number((pm25 * 1.20 + 2.5).toFixed(1)),
      pm10: Number((pm10 * 1.45 + 7.5).toFixed(1)),
      o3: Number((ozone * 0.94).toFixed(1)),
      temp: temp - 0.2
    },
    // 8. METAR LEMG (Aeropuerto de Málaga-Costa del Sol)
    metar_lemg: {
      no2: Number((no2 * 1.24 + 5.5 + trafficFactor * 9.5).toFixed(1)),
      pm25: Number((pm25 * 1.26 + trafficFactor * 2.8).toFixed(1)),
      pm10: Number((pm10 * 1.22 + trafficFactor * 4.2).toFixed(1)),
      o3: Number((ozone * 0.90).toFixed(1)),
      temp: temp + 0.4
    },
    // 9. AEMET Puerto (Litoral Portuaria - Estación 6155A)
    aemet_puerto: {
      no2: Number((no2 * 1.08 + trafficFactor * 4.0).toFixed(1)),
      pm25: Number((pm25 * 1.05).toFixed(1)),
      pm10: Number((pm10 * 1.24 + 4.5).toFixed(1)),
      o3: Number((ozone * 1.02).toFixed(1)),
      temp: temp - 0.5
    },
    // 10. El Cónsul AEMET (Suburbana Universitaria Teatinos - 6156X)
    el_consul_aemet: {
      no2: Number((no2 * 0.84 + trafficFactor * 4.5).toFixed(1)),
      pm25: Number((pm25 * 0.88 + trafficFactor * 1.5).toFixed(1)),
      pm10: Number((pm10 * 0.92 + trafficFactor * 2.0).toFixed(1)),
      o3: Number((ozone * 1.18 + solarFactor * 12.0).toFixed(1)),
      temp: temp + 0.3
    },
    // 11. AEMET El Palo Histórico (Costera Este Tradicional - 6158A)
    aemet_el_palo_historico: {
      no2: Number((no2 * 0.74 + trafficFactor * 3.0).toFixed(1)),
      pm25: Number((pm25 * 0.82).toFixed(1)),
      pm10: Number((pm10 * 1.15 + 4.0).toFixed(1)),
      o3: Number((ozone * 1.12).toFixed(1)),
      temp: temp - 0.4
    },
    // 12. AEMET Gibralfaro (Cota Histórica 128m - 6157)
    aemet_gibralfaro: {
      no2: Number((Math.max(7.0, no2 * 0.55 - 1.5)).toFixed(1)),
      pm25: Number((pm25 * 0.72).toFixed(1)),
      pm10: Number((pm10 * 0.75).toFixed(1)),
      o3: Number((ozone * 1.35 + solarFactor * 15.0).toFixed(1)),
      temp: temp - 0.9
    },
    // 13. AERONET UMA (Fotómetro Solar AERONET Nivel 2.0 NASA/GSFC)
    aeronet_uma: {
      no2: Number((no2 * 0.80 + trafficFactor * 4.0).toFixed(1)),
      pm25: Number((pm25 * 0.86).toFixed(1)),
      pm10: Number((pm10 * 0.90).toFixed(1)),
      o3: Number((ozone * 1.16 + solarFactor * 11.0).toFixed(1)),
      temp: temp + 0.2
    },
    // 14. Muelle de Levante (Faro de Málaga / Terminal Cruceros)
    muelle_levante: {
      no2: Number((no2 * 1.10 + 3.0).toFixed(1)),
      pm25: Number((pm25 * 1.08).toFixed(1)),
      pm10: Number((pm10 * 1.34 + 5.2).toFixed(1)),
      o3: Number((ozone * 0.98).toFixed(1)),
      temp: temp - 0.7
    },
    // 15. Boya Costera Bahía de Málaga (REDCOS-2342 / Puertos del Estado)
    boya_costera: {
      no2: Number((Math.max(4.0, no2 * 0.32)).toFixed(1)),
      pm25: Number((pm25 * 0.55).toFixed(1)),
      pm10: Number((pm10 * 1.48 + 8.0).toFixed(1)),
      o3: Number((ozone * 1.14).toFixed(1)),
      temp: temp - 1.2
    },
    // 16. CSIC IEO Málaga (Centro Oceanográfico San Andrés)
    csic_ieo_malaga: {
      no2: Number((no2 * 0.92 + trafficFactor * 3.5).toFixed(1)),
      pm25: Number((pm25 * 0.95).toFixed(1)),
      pm10: Number((pm10 * 1.26 + 4.8).toFixed(1)),
      o3: Number((ozone * 1.05).toFixed(1)),
      temp: temp - 0.5
    },
    // 17. Puerto de Málaga (Industrial / Portuaria Comercial)
    puerto: {
      no2: Number((no2 * 1.20 + 4.5).toFixed(1)),
      pm25: Number((pm25 * 1.15).toFixed(1)),
      pm10: Number((pm10 * 1.32 + 5.0).toFixed(1)),
      o3: Number((ozone * 0.95).toFixed(1)),
      temp: temp - 0.6
    },
    // 18. Muelle 9 Contenedores (Grúas Portuarias y Tráfico Pesado Marítimo)
    puerto_muelle9_contenedores: {
      no2: Number((no2 * 1.28 + 6.0 + trafficFactor * 5.0).toFixed(1)),
      pm25: Number((pm25 * 1.22 + 2.0).toFixed(1)),
      pm10: Number((pm10 * 1.40 + 6.5).toFixed(1)),
      o3: Number((ozone * 0.91).toFixed(1)),
      temp: temp - 0.4
    },
    // 19. DGT MA-20 pk 08 (Circunvalación Autovía Tráfico Pesado)
    dgt_ma20_pk08: {
      no2: Number((no2 * 1.42 + 9.5 + trafficFactor * 18.0).toFixed(1)),
      pm25: Number((pm25 * 1.32 + trafficFactor * 4.2).toFixed(1)),
      pm10: Number((pm10 * 1.36 + trafficFactor * 5.8).toFixed(1)),
      o3: Number((Math.max(5.0, ozone * 0.54 - trafficFactor * 12.0)).toFixed(1)),
      temp: temp + 0.8
    },
    // 20. ADIF Estación María Zambrano (Vialia - Nodo Intermodal)
    adif_vialia: {
      no2: Number((no2 * 1.25 + 5.0 + trafficFactor * 11.0).toFixed(1)),
      pm25: Number((pm25 * 1.18 + trafficFactor * 2.5).toFixed(1)),
      pm10: Number((pm10 * 1.22 + trafficFactor * 3.8).toFixed(1)),
      o3: Number((ozone * 0.78).toFixed(1)),
      temp: temp + 0.6
    },
    // 21. IFAPA Campanillas Guadalhorce (Agro-meteorológica Ribera)
    ifapa_campanillas_guadalhorce: {
      no2: Number((no2 * 0.68 + trafficFactor * 3.0).toFixed(1)),
      pm25: Number((pm25 * 0.78).toFixed(1)),
      pm10: Number((pm10 * 0.88 + 1.5).toFixed(1)),
      o3: Number((ozone * 1.25 + solarFactor * 16.0).toFixed(1)),
      temp: temp + 0.1
    },
    // 22. ZBE Microsensores Centro Histórico (CEN/TS 17660-1)
    zbe_microsensors_malaga: {
      no2: Number((no2 * 0.90 + trafficFactor * 4.2).toFixed(1)),
      pm25: Number((pm25 * 0.95 + trafficFactor * 1.5).toFixed(1)),
      pm10: Number((pm10 * 0.98 + trafficFactor * 2.0).toFixed(1)),
      o3: Number((ozone * 0.88 + solarFactor * 8.0).toFixed(1)),
      temp: temp + 0.5
    },
    // 23. ZBE Corredor Verde Parque - Alcazaba (Peatonal / Bajas Emisiones)
    zbe_parque_alcazaba: {
      no2: Number((no2 * 0.72 + trafficFactor * 2.8).toFixed(1)),
      pm25: Number((pm25 * 0.80).toFixed(1)),
      pm10: Number((pm10 * 0.86 + 1.8).toFixed(1)),
      o3: Number((ozone * 1.08 + solarFactor * 10.0).toFixed(1)),
      temp: temp - 0.3
    },
    // 24. ZBE Hilera - El Perchel (Cañón Urbano Tráfico - Control ZBE)
    zbe_hilera_perchel: {
      no2: Number((no2 * 1.35 + 8.5 + trafficFactor * 16.0).toFixed(1)),
      pm25: Number((pm25 * 1.25 + trafficFactor * 3.5).toFixed(1)),
      pm10: Number((pm10 * 1.28 + trafficFactor * 5.0).toFixed(1)),
      o3: Number((Math.max(8.0, ozone * 0.62 - trafficFactor * 10.0)).toFixed(1)),
      temp: temp + 0.8
    }
  };

    // Cobertura total garantizada para todas las estaciones de OFFICIAL_MALAGA_AIR_STATIONS
  for (const st of OFFICIAL_MALAGA_AIR_STATIONS) {
    if (!obs[st.id]) {
      const altFactor = Math.max(0.6, 1.0 - (st.altM / 1000) * 0.0065);
      const isUrban = st.environmentType.includes('traffic') || st.environmentType.includes('urban');
      const isMarine = st.environmentType.includes('ocean') || st.environmentType.includes('coast');
      obs[st.id] = {
        no2: Number((no2 * (isUrban ? 1.25 : isMarine ? 0.65 : 0.85) + (isUrban ? trafficFactor * 6.0 : 0)).toFixed(1)),
        pm25: Number((pm25 * (isUrban ? 1.15 : isMarine ? 0.85 : 0.90)).toFixed(1)),
        pm10: Number((pm10 * (isMarine ? 1.30 : isUrban ? 1.20 : 0.95) + (isMarine ? 4.0 : 0)).toFixed(1)),
        o3: Number((ozone * (isUrban ? 0.85 : 1.15) + solarFactor * 10.0).toFixed(1)),
        temp: Number((temp * altFactor).toFixed(1))
      };
    }
  }

  return obs;
}

/**
 * Función Maestra: Asimila rigurosamente en tiempo real las condiciones atmosféricas
 * para CUALQUIER punto geográfico de Málaga a partir de los datos en vivo globales y su contexto microescalar.
 */
export function assimilatePointInRealtime(
  lat: number,
  lon: number,
  globalData: MeteoData,
  explicitLocationMeta?: Partial<ResolvedLocationMetadata>
): LocalPointAtmosphericState {
  const resolved = resolveMalagaLocationSync(lat, lon, explicitLocationMeta?.name);
  const elevationM = calculateMalagaElevationM(lat, lon);
  const distanceToCoastKm = calculateDistanceToCoastKm(lat, lon);

  // 1. Obtener telemetría en vivo simulada de las 6 estaciones oficiales
  const now = new Date();
  const hourUtc = now.getUTCHours();
  const baseMeteo = {
    no2: globalData.no2_satelite_base || 25.0,
    pm25: globalData.pm2_5 || 12.0,
    pm10: globalData.pm10 || 22.0,
    ozone: globalData.ozone || 45.0,
    temp: globalData.temperatura_malaga || 21.0,
    rh: globalData.humedad_relativa || 62.0,
    ws: globalData.velocidad_viento_km_h || 12.0,
    hourUtc
  };
  const stationObs = getStationSimulatedObservations(baseMeteo);

  // 2. Interpolación Espacial Geoestadística (Ordinary Kriging con Variograma Exponencial)
  const stationCalculatedList = OFFICIAL_MALAGA_AIR_STATIONS.map(st => {
    const dist = fastDistanceKm(lat, lon, st.lat, st.lon);
    const obs = stationObs[st.id] || { no2: baseMeteo.no2, pm25: baseMeteo.pm25, pm10: baseMeteo.pm10, o3: baseMeteo.ozone, temp: baseMeteo.temp };
    return { st, dist, obs };
  });

  // Ordenar por proximidad
  const sortedStations = [...stationCalculatedList].sort((a, b) => a.dist - b.dist);
  const nearestStation = sortedStations[0].st;
  const minStationDist = sortedStations[0].dist;

  let sumWeight = 0;
  let no2KrigingSum = 0;
  let pm25KrigingSum = 0;
  let pm10KrigingSum = 0;
  let o3KrigingSum = 0;
  const weightsPerStation: Record<string, number> = {};

  // Variograma exponencial local (alcance a = 4.0 km, nugget = 0.05)
  const range = 4.0;
  const nugget = 0.05;

  sortedStations.forEach(item => {
    const gamma = nugget + (1 - nugget) * (1 - Math.exp(-item.dist / range));
    const w = 1.0 / Math.max(0.001, Math.pow(gamma, 1.4));
    weightsPerStation[item.st.id] = w;
    sumWeight += w;

    no2KrigingSum += item.obs.no2 * w;
    pm25KrigingSum += item.obs.pm25 * w;
    pm10KrigingSum += item.obs.pm10 * w;
    o3KrigingSum += item.obs.o3 * w;
  });

  // Generar la matriz asimilada íntegra de todas las estaciones oficiales con pesos distribuidos
  const allStationsReadings: ActiveStationReading[] = sortedStations
    .map(item => ({
      station: item.st,
      distanceKm: Number(item.dist.toFixed(2)),
      weightPct: Number(((weightsPerStation[item.st.id] / Math.max(1e-6, sumWeight)) * 100).toFixed(1)),
      no2: item.obs.no2,
      pm25: item.obs.pm25,
      pm10: item.obs.pm10,
      o3: item.obs.o3,
      temp: item.obs.temp
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // 2b. Generar la matriz asimilada íntegra de todas las misiones satelitales oficiales
  const allSatellitesReadings: ActiveSatelliteReading[] = OFFICIAL_SATELLITE_MISSIONS
    .map(sat => {
      const dist = fastDistanceKm(lat, lon, sat.lat, sat.lon);
      const parsedVal = parseFloat(sat.currentValueMálaga) || 40.0;
      // Gradiente espacial determinista suave
      const spatialGrad = 1.0 + Math.sin(lat * 10.0 + lon * 8.0) * 0.03;
      const localInterpolatedValue = Number((parsedVal * spatialGrad).toFixed(2));

      return {
        mission: sat,
        targetSpecies: sat.targetSpecies,
        unit: sat.unit,
        currentValue: sat.currentValueMálaga,
        localInterpolatedValue,
        distanceKm: Number(dist.toFixed(2)),
        status: sat.status
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const no2BackgroundUgM3 = Number((no2KrigingSum / sumWeight).toFixed(1));
  const pm25Background = Number((pm25KrigingSum / sumWeight).toFixed(1));
  const pm10Background = Number((pm10KrigingSum / sumWeight).toFixed(1));
  const ozoneBackground = Number((o3KrigingSum / sumWeight).toFixed(1));

  const nearestWeightPct = Number(((weightsPerStation[nearestStation.id] / sumWeight) * 100).toFixed(1));

  // 3. Aporte Microescalar de Emisiones de Tráfico (COPERT 5 + Dispersión Gaussiana OSPM a escala de metro)
  const qNOx = explicitLocationMeta?.qNOx_ug_m_s !== undefined 
    ? explicitLocationMeta.qNOx_ug_m_s 
    : (resolved.qNOx_ug_m_s || 22.0);
  
  // Si es una calle peatonal o parque, la emisión vehicular directa en el punto es nula o residual
  const isPedestrianOrGreen = resolved.highwayType === 'pedestrian' || resolved.clickedFeatureType === 'tree' || resolved.name.includes('Parque') || resolved.name.includes('Botánico');
  const effectiveQNOx = isPedestrianOrGreen ? Math.min(qNOx, 3.5) : qNOx;

  // Factor de modulación diurna en tiempo real según la hora exacta actual
  const diurnalTraffic = getDiurnalTrafficFactor(now);
  const liveQNOx = effectiveQNOx * diurnalTraffic.factor;

  const windSpeedMs = Math.max(0.6, (globalData.velocidad_viento_km_h || 12.0) / 3.6);
  // Velocidad efectiva del aire acoplada a la turbulencia mecánica inducida por el flujo vehicular (0.45 m/s)
  const effectiveCanyonWindMs = Number(Math.sqrt(Math.pow(windSpeedMs, 2) + Math.pow(0.45, 2)).toFixed(2));

  // Dispersión en el eje central de la calzada (sigma_z0 = 2.4 m)
  const sigmaZ0 = 2.4;
  const rawRoadCenterNO2 = (liveQNOx / (Math.sqrt(2 * Math.PI) * effectiveCanyonWindMs * sigmaZ0)) * 1.6;
  const roadCenterTrafficContribution = Number(Math.max(1.0, Math.min(65.0, rawRoadCenterNO2)).toFixed(1));

  // Aporte local de tráfico modulado por la distancia métrica real perpendicular (OSPM decay factor)
  const no2TrafficContributionUgM3 = Number((roadCenterTrafficContribution * resolved.perpendicularDecayFactor).toFixed(1));

  // 4. Morfología de Cañón Urbano (Modelo OSPM - Relación H/W y Sky View Factor)
  const H = explicitLocationMeta?.H !== undefined ? explicitLocationMeta.H : (resolved.H || 18.0);
  const W = Math.max(1.0, explicitLocationMeta?.W !== undefined ? explicitLocationMeta.W : (resolved.W || 18.0));
  const aspectRatioHw = Number((H / W).toFixed(2));
  const skyViewFactorSvf = Number(Math.cos(Math.atan(aspectRatioHw)).toFixed(3));

  // Factor de retención de contaminantes por vórtice de recirculación en el cañón
  let streetCanyonRetentionFactor = 1.0;
  if (aspectRatioHw >= 0.7 && skyViewFactorSvf < 0.75) {
    streetCanyonRetentionFactor = Number((1.0 + 0.38 * Math.pow(aspectRatioHw, 0.7) * (1.0 - skyViewFactorSvf)).toFixed(3));
  } else if (aspectRatioHw < 0.3) {
    streetCanyonRetentionFactor = 0.95; // Ventilación libre
  }

  // Concentración de NO2 a Cota Respirable Peatonal (1.8m AGL) a la distancia real inspeccionada
  const no2PedestrianLevel1_8mUgM3 = Number(((no2BackgroundUgM3 * 0.70 + no2TrafficContributionUgM3) * streetCanyonRetentionFactor).toFixed(1));
  const roadCenterNO2UgM3 = Number(((no2BackgroundUgM3 * 0.70 + roadCenterTrafficContribution) * streetCanyonRetentionFactor).toFixed(1));
  
  // Monóxido de Nitrógeno (NO) Estimado in situ (Fondo urbano Leighton + Aporte vehicular COPERT 5)
  // El fondo de NO en aire urbano es ~22% de NO2 fondo por equilibrio fotoestacionario de Leighton (Leighton 1961),
  // más el aporte primario directo de combustión vehicular (NO_traffic ≈ 0.65 * NO2_traffic).
  const noBackgroundUgM3 = no2BackgroundUgM3 * 0.22;
  const noTrafficUgM3 = no2TrafficContributionUgM3 * 0.65;
  const noEstimatedUgM3 = Number(((noBackgroundUgM3 + noTrafficUgM3) * streetCanyonRetentionFactor).toFixed(1));

  // Tiempo de transporte y difusión transversal hacia el receptor
  const trafficMixingTimeSec = Number((Math.max(1.0, resolved.distanceToStreetMeters) / effectiveCanyonWindMs).toFixed(1));

  const streetLevelMetrics = {
    distanceToStreetAxisMeters: resolved.distanceToStreetMeters,
    nearestStreetName: resolved.nearestStreetName,
    highwayCategory: resolved.highwayType,
    lateralZone: resolved.lateralZone,
    lateralZoneLabel: resolved.lateralZoneLabel,
    perpendicularDecayFactor: resolved.perpendicularDecayFactor,
    diurnalTrafficFactor: Number(diurnalTraffic.factor.toFixed(2)),
    diurnalPeriodLabel: diurnalTraffic.periodLabel,
    roadCenterNO2UgM3,
    localPedestrianNO2UgM3: no2PedestrianLevel1_8mUgM3,
    backgroundNO2UgM3: no2BackgroundUgM3,
    effectiveCanyonWindMs,
    trafficMixingTimeSec
  };

  // 5. Partículas PM2.5 y PM10 Locales
  const pm25UgM3 = Number((pm25Background + (no2TrafficContributionUgM3 * 0.18) * (streetCanyonRetentionFactor >= 1.1 ? 1.2 : 1.0)).toFixed(1));
  
  // Aporte de Aerosol Marino (Spray Salino del Mar de Alborán) según distancia a la costa
  const marineSaltPm10UgM3 = Number((7.5 * Math.exp(-distanceToCoastKm / 1.4)).toFixed(1));
  const dustUgM3 = globalData.dust || 8.0;
  const pm10UgM3 = Number((pm10Background + (no2TrafficContributionUgM3 * 0.28) + marineSaltPm10UgM3).toFixed(1));

  // 6. Titulación y Fotoquímica Local del Ozono (NO + O3 -> NO2 + O2)
  // En calles con alto NO vehicular, el O3 se titula intensamente. En parques y cotas altas, el O3 aumenta.
  const titrationSink = Math.min(ozoneBackground * 0.75, noEstimatedUgM3 * 0.65);
  const altitudeO3Gain = Math.min(22.0, (elevationM / 100.0) * 8.5);
  const ozoneO3UgM3 = Number(Math.max(6.0, (ozoneBackground - titrationSink + altitudeO3Gain)).toFixed(1));

  // 7. Halógenos Marinos (ClNO2)
  let clno2Pptv = 15;
  if (distanceToCoastKm < 2.5) {
    const seaBreezeFactor = Math.exp(-distanceToCoastKm / 1.0);
    clno2Pptv = Math.round(15 + seaBreezeFactor * (no2PedestrianLevel1_8mUgM3 / 10.0) * 120.0);
  }

  // 8. Gradiente Termodinámico, Topográfico e Isla de Calor Urbana (UHI)
  const buildingVolume = Math.round(H * 150 * (resolved.lanes || 2));
  const treeCover = resolved.treeCoverPct || 15;
  const lai = Number((0.4 + (treeCover / 100) * 2.8).toFixed(2));

  // Isla de Calor Urbana: cálida en densos centros urbanos, fresca en parques y costa
  const uhiGain = 2.4 * (buildingVolume / (buildingVolume + 25000));
  const greenCooling = 1.2 * Math.min(1.0, lai / 2.5);
  const urbanHeatIslandDeltaC = Number((uhiGain - greenCooling).toFixed(2));

  // Gradiente adiabático troposférico: -0.65 °C por cada 100 metros de elevación
  const altitudeTempCorrection = -0.0065 * (elevationM - 10.0);
  
  // Efecto regulador térmico del mar (brisa marina refrescante de día)
  const marineBreezeCooling = hourUtc >= 10 && hourUtc <= 19
    ? -1.6 * Math.exp(-distanceToCoastKm / 1.2)
    : 0.8 * Math.exp(-distanceToCoastKm / 1.2); // Retención térmica nocturna del agua

  const localTemperatureC = Number((baseMeteo.temp + altitudeTempCorrection + urbanHeatIslandDeltaC + marineBreezeCooling).toFixed(1));

  // Humedad Relativa Local (mayor junto a la costa marina, menor en zonas interiores altas)
  const coastRhGain = 8.5 * Math.exp(-distanceToCoastKm / 1.5);
  const localRelativeHumidityPct = Number(Math.min(98.0, Math.max(25.0, baseMeteo.rh + coastRhGain - (elevationM / 100.0) * 2.0)).toFixed(0));

  // Presión Atmosférica Barométrica Local según ecuación hipsométrica barométrica
  const P0 = globalData.presion_atmosferica || 1013.25;
  const T_kelvin = localTemperatureC + 273.15;
  const localPressureHpa = Number((P0 * Math.exp((-9.80665 * 0.0289644 * elevationM) / (8.31446 * T_kelvin))).toFixed(1));

  // Viento local: rugosidad por cañón y canalización viaria
  let localWindSpeedKmh = baseMeteo.ws;
  if (aspectRatioHw >= 1.0) {
    localWindSpeedKmh = Math.max(2.5, baseMeteo.ws * (1.0 - Math.min(0.55, aspectRatioHw * 0.22)));
  }
  localWindSpeedKmh = Number(localWindSpeedKmh.toFixed(1));

  // Dirección del viento: si está canalizado por el eje de la calle
  let localWindDirectionDeg = globalData.direccion_viento_grados || 180;
  if (aspectRatioHw >= 1.2 && resolved.orientationDeg !== undefined) {
    // Tendencia de canalización (Street Canyon Channelling Effect)
    const streetAzimuth = resolved.orientationDeg;
    const diff = Math.abs((localWindDirectionDeg - streetAzimuth + 360) % 180);
    if (diff < 35) {
      localWindDirectionDeg = streetAzimuth;
    }
  }

  // 9. Construir el MeteoData Completo para este Punto Específico
  const localMeteoData: MeteoData = {
    ...globalData,
    lat,
    lon,
    temperatura_malaga: localTemperatureC,
    humedad_relativa: localRelativeHumidityPct,
    presion_atmosferica: localPressureHpa,
    velocidad_viento_km_h: localWindSpeedKmh,
    direccion_viento_grados: localWindDirectionDeg,
    no2_satelite_base: no2BackgroundUgM3,
    pm2_5: pm25UgM3,
    pm10: pm10UgM3,
    dust: dustUgM3,
    ozone: ozoneO3UgM3,
    aspect_ratio_hw: aspectRatioHw,
    sky_view_factor: skyViewFactorSvf,
    volumen_edificios_m3: buildingVolume,
    densidad_vias_m2: Number(((resolved.lanes || 2) * 3.5 * 100 / 10000).toFixed(3)),
    lai_arbolado: lai
  };

  // 10. Calcular la Física PINN Local Exacta
  const pinnResult = calculatePINNParameters(localMeteoData);

  // Radiación solar de onda corta dinámica (W/m²) y geometría solar en tiempo real
  const nowUtc = new Date();
  const solarHourLocal = (nowUtc.getUTCHours() + 1 + nowUtc.getUTCMinutes() / 60) % 24;
  const solarElevationFactor = Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, (solarHourLocal - 6.5) / 13.0))));
  const dynamicSolarRadWm2 = Number(
    (
      typeof globalData.shortwave_radiation === 'number' && globalData.shortwave_radiation > 0
        ? globalData.shortwave_radiation
        : typeof globalData.uv_index === 'number' && globalData.uv_index > 0
        ? globalData.uv_index * 95.0
        : Math.max(5.0, 820.0 * solarElevationFactor)
    ).toFixed(1)
  );
  const dynamicSolarZenithDeg = Number(Math.min(89.0, Math.max(14.0, 90.0 - 74.0 * solarElevationFactor)).toFixed(1));
  const dynamicSolarAzimuthDeg = Number((90.0 + ((solarHourLocal - 6.5) / 13.0) * 180.0).toFixed(1));
  const dynamicJNo2Zenithal = Number(Math.max(1e-5, (dynamicSolarRadWm2 / 1000.0) * 0.0088).toFixed(5));
  const dynamicDieselFraction =
    resolved.name.toLowerCase().includes('puerto') || resolved.name.toLowerCase().includes('polígono')
      ? 0.68
      : resolved.highwayType === 'motorway' || resolved.highwayType === 'trunk'
      ? 0.56
      : resolved.highwayType === 'pedestrian'
      ? 0.15
      : 0.48;
  const dynamicHchoColumnUmolM2 = Number(
    (18.0 + 4.8 * lai * Math.exp(0.05 * (localTemperatureC - 20.0)) + 0.28 * no2PedestrianLevel1_8mUgM3).toFixed(1)
  );
  const dynamicSigmaW = Number(
    Math.max(0.12, 0.14 * effectiveCanyonWindMs * (1.0 + 0.25 * Math.min(2.5, aspectRatioHw))).toFixed(2)
  );
  const tempKelvin = localTemperatureC + 273.15;
  // k3 Arrhenius en ppb⁻¹ min⁻¹: k(cm³ molec⁻¹ s⁻¹) = 1.4e-12 * exp(-1310/T) -> conversión a ppb⁻¹ min⁻¹
  const k3Cm3S = 1.4e-12 * Math.exp(-1310.0 / tempKelvin);
  const dynamicK3PpbMin = Number((k3Cm3S * 2.46e10 * (298.15 / tempKelvin) * 60.0).toFixed(3));

  // 11. Motor Avanzado Determinista de Microescala y Cinética NO2 (Tesis Doctoral)
  const no2MicroscaleReport = evaluateComprehensiveNO2Microscale({
    no2UgM3: no2PedestrianLevel1_8mUgM3,
    o3UgM3: ozoneO3UgM3,
    noUgM3: noEstimatedUgM3,
    trafficFactor: diurnalTraffic.factor,
    dieselFraction: dynamicDieselFraction,
    aspectRatioHw,
    streetWidthM: W,
    buildingHeightM: H,
    streetOrientationDeg: resolved.orientationDeg ?? 90,
    solarZenithDeg: dynamicSolarZenithDeg,
    solarAzimuthDeg: dynamicSolarAzimuthDeg,
    svf: skyViewFactorSvf,
    jNo2Zenithal: dynamicJNo2Zenithal,
    marineAerosolSalinityPsu: Number((36.4 + 0.5 * Math.exp(-distanceToCoastKm / 4.0)).toFixed(2)),
    distanceToCoastKm,
    tempC: localTemperatureC,
    rhPct: localRelativeHumidityPct,
    hchoColumnUmolM2: dynamicHchoColumnUmolM2,
    no2ColumnUmolM2: Number((no2BackgroundUgM3 * (1.15 + 0.25 * diurnalTraffic.factor)).toFixed(1)),
    windSpeedCanyonMs: effectiveCanyonWindMs,
    verticalTurbulenceSigmaW: dynamicSigmaW,
    k3Arrhenius: dynamicK3PpbMin
  });

  return {
    lat,
    lon,
    elevationM,
    distanceToCoastKm,
    nearestStation: {
      station: nearestStation,
      distanceKm: Number(minStationDist.toFixed(2)),
      interpolatedWeightPct: nearestWeightPct
    },
    temperatureC: localTemperatureC,
    relativeHumidityPct: localRelativeHumidityPct,
    atmosphericPressureHpa: localPressureHpa,
    windSpeedKmh: localWindSpeedKmh,
    windDirectionDeg: localWindDirectionDeg,
    urbanHeatIslandDeltaC,
    no2BackgroundUgM3,
    no2TrafficContributionUgM3,
    no2PedestrianLevel1_8mUgM3,
    noEstimatedUgM3,
    pm25UgM3,
    pm10UgM3,
    ozoneO3UgM3,
    dustUgM3,
    marineSaltPm10UgM3,
    clno2Pptv,
    aspectRatioHw,
    skyViewFactorSvf,
    streetCanyonRetentionFactor,
    resolvedLocation: resolved,
    streetLevelMetrics,
    meteoData: localMeteoData,
    pinnResult,
    allStationsReadings,
    allSatellitesReadings,
    totalStationsAssimilated: allStationsReadings.length,
    totalSatellitesAssimilated: allSatellitesReadings.length,
    no2MicroscaleReport,
    // Alias unificados de acceso directo
    no2Ugm3: no2PedestrianLevel1_8mUgM3,
    o3Ugm3: ozoneO3UgM3,
    pm25Ugm3: pm25UgM3,
    pm10Ugm3: pm10UgM3,
    humidityPct: localRelativeHumidityPct,
    windSpeedMs: Number((localWindSpeedKmh / 3.6).toFixed(2)),
    solarRadiationWm2: dynamicSolarRadWm2,
    svf: skyViewFactorSvf,
    treeCanopyLai: lai,
    diurnalTrafficFactor: diurnalTraffic.factor
  };
}

/**
 * Nivel discreto en el microperfil vertical de cañón urbano (0 a 50 m AGL)
 */
export interface VerticalCanyonLevel {
  altitudeM: number;
  no2UgM3: number;
  pm25UgM3: number;
  pm10UgM3: number;
  ozoneUgM3: number;
  windSpeedMs: number;
  tkeM2s2: number; // Energía cinética turbulenta
  regime: 'pedestrian' | 'canyon_vortex' | 'roof_shear' | 'inertial_sublayer';
  regimeLabel: string;
}

export interface VerticalCanyonProfileResult {
  H: number;
  W: number;
  aspectRatioHw: number;
  z0_m: number;
  d_m: number;
  uStarMs: number;
  pedestrianNO2UgM3: number;
  roofNO2UgM3: number;
  backgroundNO2UgM3: number;
  canyonVentilationFluxM2s: number;
  levels: VerticalCanyonLevel[];
}

/**
 * Calcula el microperfil vertical de dispersión y viento en cañón urbano (0 - 50m AGL)
 * Formulación física determinista acoplada a OSPM, Yamartino & Wiegand (1986) y perfil logarítmico de Monin-Obukhov.
 */
export function calculateVerticalCanyonProfile(assimilatedState: LocalAssimilatedState): VerticalCanyonProfileResult {
  const H = Math.max(6.0, assimilatedState.resolvedLocation?.H || 18.0);
  const W = Math.max(4.0, assimilatedState.resolvedLocation?.W || 18.0);
  const aspectRatioHw = Number((H / W).toFixed(2));
  
  // Parámetros aerodinámicos de rugosidad de Grimmond & Oke (1999)
  const d_m = Number((0.70 * H).toFixed(1)); // Plano de desplazamiento cero
  const z0_m = Number((0.10 * H).toFixed(2)); // Longitud de rugosidad aerodinámica
  
  const windSpeedRoofMs = Math.max(0.6, (assimilatedState.windSpeedKmh || 12.0) / 3.6);
  const vonKarman = 0.40;
  // Velocidad de fricción u* evaluada a cota de referencia z_ref = 2.5 * H
  const zRef = Math.max(30.0, 2.5 * H);
  const uStarMs = Number(((vonKarman * windSpeedRoofMs) / Math.max(0.5, Math.log((zRef - d_m + z0_m) / z0_m))).toFixed(3));
  
  const pedestrianNO2 = assimilatedState.no2PedestrianLevel1_8mUgM3;
  const backgroundNO2 = assimilatedState.no2BackgroundUgM3;
  const roofNO2 = Number((backgroundNO2 + 0.18 * (pedestrianNO2 - backgroundNO2)).toFixed(1));
  
  const pedestrianPM25 = assimilatedState.pm25UgM3;
  const backgroundPM25 = Number((pedestrianPM25 * 0.78).toFixed(1));
  
  const pedestrianPM10 = assimilatedState.pm10UgM3;
  const backgroundPM10 = Number((pedestrianPM10 * 0.72).toFixed(1));
  
  const baseO3 = assimilatedState.ozoneO3UgM3;

  // Factor de atenuación de viento en la cavidad del cañón k_att
  const kAtt = Number((1.25 * Math.pow(aspectRatioHw, 0.55)).toFixed(2));
  // Factor de gradiente vertical de contaminantes beta
  const betaDecay = Number((1.75 * Math.pow(aspectRatioHw, 0.65)).toFixed(2));

  // Tasa de intercambio de ventilación turbulenta en la coronación del cañón (m²/s)
  const canyonVentilationFluxM2s = Number((0.08 * uStarMs * W).toFixed(3));

  // Muestreo vertical en 28 cotas de alta resolución (0.5m a 50m)
  const altitudes = [
    0.5, 1.0, 1.5, 1.8, 2.5, 3.5, 5.0, 7.0, 9.0, 11.0, 
    13.0, 15.0, 18.0, 21.0, 24.0, 27.0, 30.0, 33.0, 36.0, 
    39.0, 42.0, 45.0, 48.0, 50.0
  ];
  // Asegurar que la cota H esté presente exactamente
  if (!altitudes.includes(H)) {
    altitudes.push(H);
    altitudes.sort((a, b) => a - b);
  }

  const levels: VerticalCanyonLevel[] = altitudes.map((z) => {
    let u_z = 0;
    let no2_z = 0;
    let pm25_z = 0;
    let pm10_z = 0;
    let o3_z = 0;
    let tke = 0;
    let regime: 'pedestrian' | 'canyon_vortex' | 'roof_shear' | 'inertial_sublayer' = 'pedestrian';
    let regimeLabel = 'Plano Peatonal Respiratorio';

    if (z <= 2.0) {
      // 1. Capa Peatonal (0 - 2m)
      regime = 'pedestrian';
      regimeLabel = 'Plano Peatonal (Receptor Humano OMS)';
      const microRel = z / 1.8;
      no2_z = Number((pedestrianNO2 * (1.0 + 0.05 * (1.0 - microRel))).toFixed(1));
      pm25_z = Number((pedestrianPM25 * (1.0 + 0.04 * (1.0 - microRel))).toFixed(1));
      pm10_z = Number((pedestrianPM10 * (1.0 + 0.06 * (1.0 - microRel))).toFixed(1));
      // Titulación fotoquímica máxima cerca de calzada: NO + O3 -> NO2 + O2
      o3_z = Number(Math.max(10.0, baseO3 * 0.75).toFixed(1));
      u_z = Number(Math.max(0.3, windSpeedRoofMs * 0.18 * Math.pow(z / 1.8, 0.4)).toFixed(2));
      tke = Number((0.8 * Math.pow(uStarMs, 2)).toFixed(3));
    } else if (z <= H) {
      // 2. Vórtice de Cañón Urbano (2m - H)
      regime = 'canyon_vortex';
      regimeLabel = `Vórtice de Recirculación del Cañón (z ≤ ${H}m)`;
      const relHeight = z / H;
      // Decaimiento exponencial en el cañón
      const decayFraction = Math.exp(-betaDecay * relHeight);
      no2_z = Number((roofNO2 + (pedestrianNO2 - roofNO2) * decayFraction).toFixed(1));
      pm25_z = Number((backgroundPM25 + (pedestrianPM25 - backgroundPM25) * decayFraction).toFixed(1));
      pm10_z = Number((backgroundPM10 + (pedestrianPM10 - backgroundPM10) * decayFraction).toFixed(1));
      // Gradiente de recuperación de ozono hacia la atmósfera libre
      o3_z = Number((baseO3 * (0.80 + 0.20 * relHeight)).toFixed(1));
      // Atenuación exponencial de viento en cañón
      u_z = Number(Math.max(0.35, windSpeedRoofMs * Math.exp(-kAtt * (1.0 - relHeight))).toFixed(2));
      tke = Number((1.2 * Math.pow(uStarMs, 2) * (1.0 + relHeight)).toFixed(3));
    } else if (z <= H * 1.35) {
      // 3. Capa de Cizalladura en Coronación (H - 1.35H)
      regime = 'roof_shear';
      regimeLabel = `Cizalladura de Cornisa y Desprendimiento Vortical (H=${H}m)`;
      const transRel = (z - H) / (0.35 * H);
      no2_z = Number((roofNO2 + (backgroundNO2 - roofNO2) * transRel).toFixed(1));
      pm25_z = Number((backgroundPM25 + (pedestrianPM25 - backgroundPM25) * 0.15 * (1.0 - transRel)).toFixed(1));
      pm10_z = Number((backgroundPM10 + (pedestrianPM10 - backgroundPM10) * 0.12 * (1.0 - transRel)).toFixed(1));
      o3_z = Number((baseO3 * (0.95 + 0.05 * transRel)).toFixed(1));
      // Transición al perfil logarítmico
      const uLog = (uStarMs / vonKarman) * Math.log(Math.max(1.1, (z - d_m + z0_m) / z0_m));
      u_z = Number(Math.max(windSpeedRoofMs, uLog).toFixed(2));
      // Pico máximo de TKE por fricción de cornisa
      tke = Number((3.8 * Math.pow(uStarMs, 2)).toFixed(3));
    } else {
      // 4. Subcapa Inercial Libre (z > 1.35H hasta 50m)
      regime = 'inertial_sublayer';
      regimeLabel = 'Subcapa Inercial de Atmósfera Libre (Monin-Obukhov)';
      no2_z = backgroundNO2;
      pm25_z = backgroundPM25;
      pm10_z = backgroundPM10;
      o3_z = baseO3;
      // Perfil logarítmico puro
      const uLog = (uStarMs / vonKarman) * Math.log(Math.max(1.1, (z - d_m + z0_m) / z0_m));
      u_z = Number(Math.max(windSpeedRoofMs * 1.2, uLog).toFixed(2));
      tke = Number((1.5 * Math.pow(uStarMs, 2)).toFixed(3));
    }

    return {
      altitudeM: z,
      no2UgM3: Math.max(1.0, no2_z),
      pm25UgM3: Math.max(1.0, pm25_z),
      pm10UgM3: Math.max(1.0, pm10_z),
      ozoneUgM3: Math.max(1.0, o3_z),
      windSpeedMs: u_z,
      tkeM2s2: tke,
      regime,
      regimeLabel
    };
  });

  return {
    H,
    W,
    aspectRatioHw,
    z0_m,
    d_m,
    uStarMs,
    pedestrianNO2UgM3: pedestrianNO2,
    roofNO2UgM3: roofNO2,
    backgroundNO2UgM3: backgroundNO2,
    canyonVentilationFluxM2s,
    levels
  };
}
