/**
 * Módulo de Evaluación de Calidad del Modelo según FAIRMODE WG1
 * Directiva 2008/50/CE & Criterios de Validación Metrológica
 */

export interface StationObservedData {
  stationId: string;
  stationName: string;
  lat: number;
  lon: number;
  observedO3: number; // µg/m³
  observedNO2: number; // µg/m³
  simulatedO3: number; // µg/m³
  simulatedNO2: number; // µg/m³
}

export interface FairmodeMetrics {
  rmse: number; // Root Mean Square Error
  r2: number; // Coeficiente de Determinación
  fac2: number; // Fraction within a Factor of 2
  nmb: number; // Normalized Mean Bias (%)
  mqi: number; // Model Quality Indicator (FAIRMODE Target < 1.0)
  targetFulfilled: boolean;
  u_95: number; // Expanded uncertainty at 95% confidence level
}

/**
 * Calcula las métricas de calidad de modelo FAIRMODE WG1
 */
export function calculateFairmodeMetrics(
  pairs: Array<{ obs: number; sim: number }>
): FairmodeMetrics {
  if (!pairs || pairs.length === 0) {
    return {
      rmse: 0,
      r2: 0,
      fac2: 1,
      nmb: 0,
      mqi: 0,
      targetFulfilled: true,
      u_95: 0.28,
    };
  }

  const n = pairs.length;
  let sumObs = 0;
  let sumSim = 0;
  let sumSquareDiff = 0;
  let fac2Count = 0;

  pairs.forEach((p) => {
    sumObs += p.obs;
    sumSim += p.sim;
    sumSquareDiff += Math.pow(p.sim - p.obs, 2);
    if (p.obs > 0) {
      const ratio = p.sim / p.obs;
      if (ratio >= 0.5 && ratio <= 2.0) {
        fac2Count++;
      }
    } else {
      fac2Count++;
    }
  });

  const meanObs = sumObs / n;
  const meanSim = sumSim / n;
  const rmse = Math.sqrt(sumSquareDiff / n);

  // Coeficiente NMB (%)
  const nmb = meanObs !== 0 ? ((meanSim - meanObs) / meanObs) * 100 : 0;

  // Fraction within factor of 2
  const fac2 = fac2Count / n;

  // R^2 calculation
  let numR = 0;
  let denObs = 0;
  let denSim = 0;

  pairs.forEach((p) => {
    const diffObs = p.obs - meanObs;
    const diffSim = p.sim - meanSim;
    numR += diffObs * diffSim;
    denObs += Math.pow(diffObs, 2);
    denSim += Math.pow(diffSim, 2);
  });

  const den = Math.sqrt(denObs * denSim);
  const r = den !== 0 ? numR / den : 0;
  const r2 = Math.pow(r, 2);

  // FAIRMODE Model Quality Indicator (MQI)
  // MQI = RMSE / (2 * U_95 * Mean_Obs)
  const U_95 = 0.28; // Standard 95% expanded measurement uncertainty for O3/NO2 (FAIRMODE WG1)
  const mqi = meanObs > 0 ? rmse / (2 * U_95 * meanObs) : 0;

  return {
    rmse: parseFloat(rmse.toFixed(2)),
    r2: parseFloat(r2.toFixed(3)),
    fac2: parseFloat(fac2.toFixed(3)),
    nmb: parseFloat(nmb.toFixed(2)),
    mqi: parseFloat(mqi.toFixed(3)),
    targetFulfilled: mqi <= 1.0,
    u_95: U_95,
  };
}

export interface FairmodeNormativeParameters {
  ur95: number;   // Incertidumbre relativa máxima expandida al valor de referencia
  rv: number;     // Valor de referencia normativo de la UE (µg/m³)
  alpha: number;  // Parámetro no proporcional de incertidumbre
  beta_v: number; // Factor de cobertura (2.0)
  targetMaxUu: number; // Porcentaje máximo de incertidumbre del modelo según Directiva 2008/50/CE
}

/**
 * Parámetros normativos certificados FAIRMODE WG1 / Directiva 2008/50/CE
 */
export const FAIRMODE_NORMATIVE_PARAMS: Record<'NO2' | 'O3' | 'PM10' | 'PM25', FairmodeNormativeParameters> = {
  NO2: { ur95: 0.25, rv: 200, alpha: 0.20, beta_v: 2.0, targetMaxUu: 50 },
  O3: { ur95: 0.15, rv: 120, alpha: 0.79, beta_v: 2.0, targetMaxUu: 50 },
  PM10: { ur95: 0.50, rv: 50, alpha: 0.50, beta_v: 2.0, targetMaxUu: 60 },
  PM25: { ur95: 0.50, rv: 25, alpha: 0.50, beta_v: 2.0, targetMaxUu: 60 },
};

/**
 * Calcula la incertidumbre expandida de medida U_95(O_i) según el FAIRMODE Guidance Document (WG1)
 * U_95(O_i) = U_r,95 * sqrt( (1 - alpha^2)*O_i^2 + alpha^2 * RV^2 )
 */
export function calculateExpandedMeasurementUncertainty(
  obs: number, 
  pollutant: 'NO2' | 'O3' | 'PM10' | 'PM25' = 'NO2'
): number {
  const p = FAIRMODE_NORMATIVE_PARAMS[pollutant] || FAIRMODE_NORMATIVE_PARAMS.NO2;
  const oSafe = Math.max(0.1, obs);
  const u95 = p.ur95 * Math.sqrt((1 - Math.pow(p.alpha, 2)) * Math.pow(oSafe, 2) + Math.pow(p.alpha, 2) * Math.pow(p.rv, 2));
  return Number(u95.toFixed(3));
}

/**
 * Calcula el MQI individual para una estación específica según FAIRMODE WG1:
 * MQI_i = |M_i - O_i| / (beta_v * U_95(O_i))
 */
export function calculateStationMqi(
  obs: number,
  pred: number,
  pollutant: 'NO2' | 'O3' | 'PM10' | 'PM25' = 'NO2'
): {
  u95: number;
  bias: number;
  relBiasPct: number;
  mqi: number;
  isCompliant: boolean;
  beta_v: number;
  rv: number;
  alpha: number;
  ur95: number;
} {
  const p = FAIRMODE_NORMATIVE_PARAMS[pollutant] || FAIRMODE_NORMATIVE_PARAMS.NO2;
  const u95 = calculateExpandedMeasurementUncertainty(obs, pollutant);
  const bias = pred - obs;
  const relBiasPct = obs > 0 ? (bias / obs) * 100 : 0;
  const denominator = p.beta_v * u95;
  const mqi = denominator > 0 ? Math.abs(bias) / denominator : 0;
  return {
    u95: Number(u95.toFixed(2)),
    bias: Number(bias.toFixed(2)),
    relBiasPct: Number(relBiasPct.toFixed(1)),
    mqi: Number(mqi.toFixed(3)),
    isCompliant: mqi <= 1.0,
    beta_v: p.beta_v,
    rv: p.rv,
    alpha: p.alpha,
    ur95: p.ur95,
  };
}

/**
 * Exportador FAIR de la red completa de estaciones evaluadas a GeoJSON (EPSG:4326)
 */
export function exportFairmodeNetworkToGeoJson(
  dataPairs: Array<{
    id: string;
    name: string;
    code: string;
    envType: string;
    lat?: number;
    lon?: number;
    altM?: number;
    network?: string;
    obs: number;
    pred: number;
    diff: number;
    absDiff: number;
    ratio: number;
  }>,
  pollutant: 'NO2' | 'O3' | 'PM10' | 'PM25',
  networkMqi: number,
  isCompliant: boolean
): string {
  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      title: 'Validación Metrológica FAIRMODE WG1 - Red de Calidad del Aire de Málaga',
      standard: 'Directiva 2008/50/CE & JRC FAIRMODE Guidance Document',
      pollutant,
      networkMqi,
      isCompliant,
      stationsCount: dataPairs.length,
      timestamp: new Date().toISOString(),
    },
    features: dataPairs.map((d) => {
      const stMqi = calculateStationMqi(d.obs, d.pred, pollutant);
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [d.lon ?? -4.42, d.lat ?? 36.72],
        },
        properties: {
          id: d.id,
          name: d.name,
          code: d.code,
          environmentType: d.envType,
          network: d.network || 'Red de Vigilancia de Andalucía',
          pollutant,
          observed_ug_m3: d.obs,
          predicted_ug_m3: d.pred,
          bias_ug_m3: d.diff,
          ratio_pred_obs: d.ratio,
          u95_measurement_uncertainty: stMqi.u95,
          mqi_station: stMqi.mqi,
          isMqiCompliant: stMqi.isCompliant,
          beta_v: stMqi.beta_v,
          rv_reference_value: stMqi.rv,
        },
      };
    }),
  };
  return JSON.stringify(geojson, null, 2);
}

/**
 * Distancia ortodrómica (Haversine) determinista entre dos coordenadas en km
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.05, R * c);
}

export interface LoocvStationResult {
  stationId: string;
  stationName: string;
  code: string;
  environmentType: string;
  lat: number;
  lon: number;
  observed: number; // C_obs (µg/m³)
  predictedBlind: number; // C_hat_-i (µg/m³)
  residual: number; // C_hat - C_obs
  absResidual: number;
  relativeBiasPct: number;
  ratio: number; // C_hat / C_obs
  isFac2: boolean; // 0.5 <= ratio <= 2.0
  u_o: number; // Incertidumbre combinada de referencia (Directiva 2008/50/CE)
  mqi_station: number; // |residual| / (2 * u_o)
  isCompliant: boolean; // mqi_station <= 1.0
  nearestStationName: string;
  distanceToNearestKm: number;
}

export interface LoocvNetworkSummary {
  pollutant: 'NO2' | 'O3' | 'PM10' | 'PM25';
  nStations: number;
  meanObserved: number;
  meanPredictedBlind: number;
  rmse: number;
  mae: number;
  nmbPct: number;
  fac2Pct: number;
  r2: number;
  pearsonR: number;
  networkMqi: number; // FAIRMODE Overall Model Quality Indicator
  isNetworkCompliant: boolean;
  maxStationMqi: number;
  criticalStationName: string;
  stationResults: LoocvStationResult[];
}

/**
 * Factor de transferencia determinista microambiental entre tipologías de estación
 * Basado en EMEP/EEA e índice de cañón urbano
 */
function getEnvironmentalTransferRatio(fromEnv: string, toEnv: string, pollutant: string): number {
  if (fromEnv === toEnv) return 1.0;

  if (pollutant === 'NO2') {
    // Tráfico urbano tiene mayor NO2 que fondo urbano o suburbana
    const rank: Record<string, number> = {
      urban_traffic: 1.45,
      port_industrial: 1.25,
      airport_logistics: 1.15,
      urban_background: 1.0,
      coastal: 0.90,
      suburban_altitude: 0.62,
    };
    const rFrom = rank[fromEnv] || 1.0;
    const rTo = rank[toEnv] || 1.0;
    return rTo / rFrom;
  } else if (pollutant === 'O3') {
    // O3 es inverso al NO2 por titulación fotostacionaria (NO + O3 -> NO2)
    const rankO3: Record<string, number> = {
      suburban_altitude: 1.30,
      coastal: 1.15,
      urban_background: 1.0,
      port_industrial: 0.88,
      airport_logistics: 0.85,
      urban_traffic: 0.70,
    };
    const rFrom = rankO3[fromEnv] || 1.0;
    const rTo = rankO3[toEnv] || 1.0;
    return rTo / rFrom;
  } else {
    // PM10 / PM2.5
    const rankPM: Record<string, number> = {
      port_industrial: 1.35,
      airport_logistics: 1.25,
      urban_traffic: 1.20,
      urban_background: 1.0,
      suburban_altitude: 0.85,
      coastal: 0.90,
    };
    const rFrom = rankPM[fromEnv] || 1.0;
    const rTo = rankPM[toEnv] || 1.0;
    return rTo / rFrom;
  }
}

/**
 * Ejecuta la Validación Cruzada Espacial Ciega (LOOCV) para las estaciones de Málaga
 * según directrices oficiales de FAIRMODE WG1 / CEN/TR 17536
 */
export function executeLeaveOneOutCrossValidation(
  rawStations: Array<{
    station: {
      id: string;
      code: string;
      name: string;
      lat: number;
      lon: number;
      environmentType: string;
    };
    measuredNO2: number;
    measuredO3: number;
    measuredPM10: number;
    measuredPM25: number;
  }>,
  pollutant: 'NO2' | 'O3' | 'PM10' | 'PM25' = 'NO2'
): LoocvNetworkSummary {
  const N = rawStations.length;
  if (N < 2) {
    throw new Error("LOOCV requiere al menos 2 estaciones observadas.");
  }

  // Extraer valores observados para el contaminante
  const stationPool = rawStations.map((s) => {
    let obs = s.measuredNO2;
    if (pollutant === 'O3') obs = s.measuredO3;
    else if (pollutant === 'PM10') obs = s.measuredPM10;
    else if (pollutant === 'PM25') obs = s.measuredPM25;
    return {
      id: s.station.id,
      name: s.station.name,
      code: s.station.code,
      env: s.station.environmentType,
      lat: s.station.lat,
      lon: s.station.lon,
      observed: obs,
    };
  });

  const stationResults: LoocvStationResult[] = [];
  // Incertidumbre relativa típica directiva (15% para NO2 y O3, 25% para PM)
  const relativeU = (pollutant === 'PM10' || pollutant === 'PM25') ? 0.25 : 0.15;

  for (let i = 0; i < N; i++) {
    const target = stationPool[i];
    // Conjunto de entrenamiento ciego (todas excepto target)
    const training = stationPool.filter((_, idx) => idx !== i);

    let weightSum = 0;
    let weightedEstSum = 0;
    let nearestDist = Infinity;
    let nearestName = '';

    for (const train of training) {
      const distKm = haversineDistanceKm(target.lat, target.lon, train.lat, train.lon);
      if (distKm < nearestDist) {
        nearestDist = distKm;
        nearestName = train.name.replace('Málaga - ', '');
      }

      // Decaimiento espacial atmosférico p=1.8 acoplado al factor microambiental
      const envFactor = getEnvironmentalTransferRatio(train.env, target.env, pollutant);
      const w = 1 / Math.pow(distKm, 1.8);
      const adjustedObs = train.observed * envFactor;

      weightSum += w;
      weightedEstSum += w * adjustedObs;
    }

    const predictedBlind = weightSum > 0 ? weightedEstSum / weightSum : target.observed;
    const residual = predictedBlind - target.observed;
    const absResidual = Math.abs(residual);
    const relativeBiasPct = target.observed > 0 ? (residual / target.observed) * 100 : 0;
    const ratio = target.observed > 0 ? predictedBlind / target.observed : 1.0;
    const isFac2 = ratio >= 0.5 && ratio <= 2.0;

    // Incertidumbre combinada de referencia según FAIRMODE WG1
    const u_o = relativeU * Math.max(5, target.observed);
    // MQI individual = |residual| / (2 * u_o)
    const mqi_station = absResidual / (2 * u_o);
    const isCompliant = mqi_station <= 1.0;

    stationResults.push({
      stationId: target.id,
      stationName: target.name.replace('Málaga - ', ''),
      code: target.code,
      environmentType: target.env,
      lat: target.lat,
      lon: target.lon,
      observed: Number(target.observed.toFixed(2)),
      predictedBlind: Number(predictedBlind.toFixed(2)),
      residual: Number(residual.toFixed(2)),
      absResidual: Number(absResidual.toFixed(2)),
      relativeBiasPct: Number(relativeBiasPct.toFixed(2)),
      ratio: Number(ratio.toFixed(3)),
      isFac2,
      u_o: Number(u_o.toFixed(2)),
      mqi_station: Number(mqi_station.toFixed(2)),
      isCompliant,
      nearestStationName: nearestName,
      distanceToNearestKm: Number(nearestDist.toFixed(2)),
    });
  }

  // Métricas de red agregadas
  const meanObs = stationResults.reduce((a, b) => a + b.observed, 0) / N;
  const meanBlind = stationResults.reduce((a, b) => a + b.predictedBlind, 0) / N;
  const sumSqDiff = stationResults.reduce((a, b) => a + Math.pow(b.residual, 2), 0);
  const rmse = Math.sqrt(sumSqDiff / N);
  const mae = stationResults.reduce((a, b) => a + b.absResidual, 0) / N;
  const nmbPct = meanObs > 0 ? ((meanBlind - meanObs) / meanObs) * 100 : 0;
  const fac2Count = stationResults.filter((s) => s.isFac2).length;
  const fac2Pct = (fac2Count / N) * 100;

  // Correlación Pearson y R²
  const numR = stationResults.reduce((a, b) => a + (b.predictedBlind - meanBlind) * (b.observed - meanObs), 0);
  const denP = Math.sqrt(stationResults.reduce((a, b) => a + Math.pow(b.predictedBlind - meanBlind, 2), 0));
  const denO = Math.sqrt(stationResults.reduce((a, b) => a + Math.pow(b.observed - meanObs, 2), 0));
  const pearsonR = denP * denO > 0 ? numR / (denP * denO) : 1;
  const r2 = Math.pow(pearsonR, 2);

  // FAIRMODE Network Quality Indicator
  const sumUoSq = stationResults.reduce((a, b) => a + Math.pow(b.u_o, 2), 0);
  const meanUo = Math.sqrt(sumUoSq / N);
  const networkMqi = meanUo > 0 ? rmse / (2 * meanUo) : 0;

  let maxMqi = 0;
  let criticalName = '';
  stationResults.forEach((s) => {
    if (s.mqi_station > maxMqi) {
      maxMqi = s.mqi_station;
      criticalName = s.stationName;
    }
  });

  return {
    pollutant,
    nStations: N,
    meanObserved: Number(meanObs.toFixed(2)),
    meanPredictedBlind: Number(meanBlind.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    mae: Number(mae.toFixed(2)),
    nmbPct: Number(nmbPct.toFixed(2)),
    fac2Pct: Number(fac2Pct.toFixed(1)),
    r2: Number(r2.toFixed(3)),
    pearsonR: Number(pearsonR.toFixed(3)),
    networkMqi: Number(networkMqi.toFixed(2)),
    isNetworkCompliant: networkMqi <= 1.0,
    maxStationMqi: Number(maxMqi.toFixed(2)),
    criticalStationName: criticalName,
    stationResults,
  };
}

/**
 * Exportador FAIR de validación cruzada espacial (LOOCV) a CSV
 */
export function exportLoocvToCsv(summary: LoocvNetworkSummary): string {
  const headers = [
    'Codigo_Estacion',
    'Nombre_Estacion',
    'Tipologia_Ambiental',
    'Latitud',
    'Longitud',
    `Observado_${summary.pollutant}_ug_m3`,
    `Prediccion_Ciega_LOOCV_ug_m3`,
    'Error_Residual_ug_m3',
    'Sesgo_Relativo_Pct',
    'Ratio_Pred_Obs',
    'FAC2_Cumplido',
    'Incertidumbre_U95_ug_m3',
    'MQI_FAIRMODE',
    'Cumple_Objetivo_MQI_LE_1',
    'Estacion_Mas_Cercana',
    'Distancia_Km',
  ];

  const rows = summary.stationResults.map((s) => [
    s.code,
    `"${s.stationName}"`,
    s.environmentType,
    s.lat,
    s.lon,
    s.observed,
    s.predictedBlind,
    s.residual,
    s.relativeBiasPct,
    s.ratio,
    s.isFac2 ? 'SI' : 'NO',
    s.u_o,
    s.mqi_station,
    s.isCompliant ? 'SI' : 'NO',
    `"${s.nearestStationName}"`,
    s.distanceToNearestKm,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Exportador FAIR de validación cruzada espacial (LOOCV) a GeoJSON (EPSG:4326)
 */
export function exportLoocvToGeoJson(summary: LoocvNetworkSummary): string {
  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      title: 'Validación Cruzada Espacial (LOOCV) - Red Oficial Málaga',
      pollutant: summary.pollutant,
      standard: 'FAIRMODE WG1 / CEN/TR 17536',
      timestamp: new Date().toISOString(),
      networkMqi: summary.networkMqi,
      isCompliant: summary.isNetworkCompliant,
      rmse_ug_m3: summary.rmse,
      fac2_pct: summary.fac2Pct,
      r2: summary.r2,
    },
    features: summary.stationResults.map((s) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [s.lon, s.lat],
      },
      properties: {
        code: s.code,
        name: s.stationName,
        environmentType: s.environmentType,
        observed: s.observed,
        predictedBlind: s.predictedBlind,
        residual: s.residual,
        relativeBiasPct: s.relativeBiasPct,
        ratio: s.ratio,
        isFac2: s.isFac2,
        u_o: s.u_o,
        mqi_station: s.mqi_station,
        isCompliant: s.isCompliant,
        nearestStation: s.nearestStationName,
        distanceKm: s.distanceToNearestKm,
      },
    })),
  };

  return JSON.stringify(geojson, null, 2);
}

/**
 * Estaciones Oficiales de Calidad del Aire en Málaga (Red de Vigilancia de Andalucía)
 */
export const OFFICIAL_MALAGA_STATIONS: StationObservedData[] = [
  {
    stationId: "ES1822A",
    stationName: "Paseo del Parque (Urbana Tráfico)",
    lat: 36.7194,
    lon: -4.4172,
    observedO3: 54.2,
    observedNO2: 38.5,
    simulatedO3: 52.8,
    simulatedNO2: 36.9,
  },
  {
    stationId: "ES1823A",
    stationName: "Carranque (Urbana Fondo)",
    lat: 36.7171,
    lon: -4.4458,
    observedO3: 68.1,
    observedNO2: 24.1,
    simulatedO3: 66.5,
    simulatedNO2: 25.0,
  },
  {
    stationId: "ES1824A",
    stationName: "El Atabal (Suburbana)",
    lat: 36.7352,
    lon: -4.4688,
    observedO3: 82.4,
    observedNO2: 15.2,
    simulatedO3: 81.0,
    simulatedNO2: 16.1,
  },
];
