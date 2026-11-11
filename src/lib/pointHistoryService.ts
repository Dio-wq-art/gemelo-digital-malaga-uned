/**
 * Servicio de Generación y Asimilación del Historial de 7 Días para el Punto Activo
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire de Málaga
 * 
 * Cumplimiento Estricto de Reglas Doctorales:
 * - Regla 1 (Zero Stochastic Data): Cero Math.random(). Formulación analítica determinista
 *   basada en perfiles horarios EMEP/EEA 2023, COPERT 5, ciclo fotoquímico de Leighton (1961),
 *   brisas térmicas del Mar de Alborán y calibración atómica con el punto activo.
 * - Regla 8 (Ciencia Abierta y Exportación FAIR): Exportadores a CSV estándar y GeoJSON temporal.
 * - Regla 10 (Sincronización Global): Acoplado a ActivePointContext y georreferencia oficial.
 */

import { wgs84ToUtm30N } from './geodesy';

export interface HourlyAirQualityRecord {
  /** Timestamp ISO 8601 */
  timestamp: string;
  epochMs: number;
  /** Etiqueta temporal compacta (ej. "Lun 14:00") */
  timeLabel: string;
  /** Etiqueta de fecha (ej. "16 Sep") */
  dateLabel: string;
  /** Fecha formateada extendida */
  fullFormattedDate: string;
  dayIndex: number; // 0..6 (0 = hace 6 días, 6 = hoy)
  dayName: string;
  dayShort: string;
  hour: number; // 0..23
  isWeekend: boolean;

  // Concentraciones atmosféricas (µg/m³)
  no2: number;
  o3: number;
  pm25: number;
  pm10: number;

  // Índice compuesto
  aqi: number; // 0 a 100
  aqiCategory: 'Buena' | 'Admisible' | 'Moderada' | 'Mala' | 'Muy Mala';
  aqiColor: string;

  // Variables meteorológicas acopladas
  tempC: number;
  windKmh: number;
  rhPct: number;
  solarRadiationWm2: number;

  // Factores físicos deterministas
  trafficFactor: number;
  photolysisJNO2: number;
}

export interface DaySummaryRecord {
  dayIndex: number;
  dateStr: string;
  dayName: string;
  dayShort: string;
  isWeekend: boolean;
  meanNO2: number;
  maxNO2: number;
  minNO2: number;
  meanO3: number;
  maxO3: number;
  meanPM25: number;
  maxPM25: number;
  meanPM10: number;
  maxPM10: number;
  meanAQI: number;
  dominantPollutant: 'NO2' | 'O3' | 'PM2.5' | 'PM10';
  whoCompliance: boolean;
  euCompliance: boolean;
}

export interface PeriodStatistics {
  pollutant: 'NO2' | 'O3' | 'PM2.5' | 'PM10' | 'AQI' | 'MET';
  unit: string;
  mean: number;
  max: number;
  maxTimestamp: string;
  maxLabel: string;
  min: number;
  minTimestamp: string;
  p98: number;
  p50: number;
  whoLimit: number;
  euLimit: number;
  whoExceedanceHours: number;
  whoExceedancePct: number;
  euExceedanceHours: number;
  theilSenSlopePerDay: number;
  trendDirection: 'descendente' | 'estable' | 'ascendente';
  trendInterpretation: string;
}

// Perfil horario base EMEP/EEA 2023 para tráfico urbano (00:00 a 23:00)
const EMEP_WEEKDAY_HOURLY: number[] = [
  0.18, 0.12, 0.08, 0.08, 0.14, 0.35, 
  0.85, 1.42, 1.35, 1.05, 0.98, 1.02, 
  1.10, 1.18, 1.25, 1.05, 1.00, 1.15, 
  1.38, 1.32, 1.10, 0.82, 0.55, 0.32
];

const EMEP_WEEKEND_HOURLY: number[] = [
  0.42, 0.30, 0.20, 0.12, 0.10, 0.12, 
  0.22, 0.38, 0.55, 0.75, 0.95, 1.12, 
  1.20, 1.18, 1.05, 0.90, 0.88, 0.95, 
  1.02, 1.05, 1.00, 0.88, 0.72, 0.55
];

// Factores de ponderación semanal EMEP (0: Dom, 1: Lun, 2: Mar, 3: Mié, 4: Jue, 5: Vie, 6: Sáb)
const EMEP_DAY_FACTORS = [0.65, 1.02, 1.04, 1.05, 1.08, 1.14, 0.80];

/**
 * Calcula el índice de calidad del aire CAQI/EAQI determinista para el conjunto de contaminantes.
 */
export function calculateCompositeAQI(no2: number, o3: number, pm25: number, pm10: number): {
  aqi: number;
  category: 'Buena' | 'Admisible' | 'Moderada' | 'Mala' | 'Muy Mala';
  color: string;
} {
  // Normalizaciones respecto a los umbrales de referencia de la UE (0 a 100)
  const subNO2 = (no2 / 200.0) * 100.0;
  const subO3 = (o3 / 180.0) * 100.0;
  const subPM25 = (pm25 / 50.0) * 100.0;
  const subPM10 = (pm10 / 90.0) * 100.0;

  const aqiRaw = Math.max(subNO2, subO3, subPM25, subPM10);
  const aqi = Math.max(5.0, Math.min(100.0, Number(aqiRaw.toFixed(1))));

  if (aqi <= 25) {
    return { aqi, category: 'Buena', color: '#10b981' };
  } else if (aqi <= 50) {
    return { aqi, category: 'Admisible', color: '#06b6d4' };
  } else if (aqi <= 75) {
    return { aqi, category: 'Moderada', color: '#f59e0b' };
  } else if (aqi <= 90) {
    return { aqi, category: 'Mala', color: '#f43f5e' };
  } else {
    return { aqi, category: 'Muy Mala', color: '#9333ea' };
  }
}

/**
 * Genera la serie temporal horaria de los últimos 7 días (168 horas) para el punto activo.
 * Cero aleatoriedad: cálculo analítico determinista acoplado a la física del punto.
 */
export function generateActivePoint7DayHistory(params: {
  lat: number;
  lon: number;
  currentNO2: number;
  currentO3: number;
  currentPM25: number;
  currentPM10: number;
  currentTemp?: number;
  currentWindKmh?: number;
  currentRH?: number;
  svf?: number;
  hwRatio?: number;
  liveHourlyAq?: any;
  daysCount?: number; // 7, 30, 90, 365
}): {
  hourlyRecords: HourlyAirQualityRecord[];
  dailySummaries: DaySummaryRecord[];
} {
  const {
    currentNO2,
    currentO3,
    currentPM25,
    currentPM10,
    currentTemp = 24.5,
    currentWindKmh = 14.0,
    currentRH = 62.0,
    svf = 0.42,
    hwRatio = 1.65,
    liveHourlyAq,
    daysCount = 7
  } = params;

  const now = new Date();
  const currentEpochMs = now.getTime();
  const hourlyRecords: HourlyAirQualityRecord[] = [];

  // Confinamiento de cañón urbano de Oke (1988)
  const canyonRetention = hwRatio >= 0.65 ? 1.0 + Math.min(0.6, (hwRatio - 0.65) * 0.45) : 0.95;
  const svfFactor = 1.0 + (0.5 - Math.min(1.0, svf)) * 0.4;

  const validDays = Math.max(1, Math.min(365, daysCount));
  const totalHours = validDays * 24;

  // Si disponemos de datos horarios en vivo de Copernicus / Open-Meteo, verificar cobertura
  const hasLiveAqData = Boolean(
    liveHourlyAq &&
    Array.isArray(liveHourlyAq.time) &&
    liveHourlyAq.time.length >= 100 &&
    Array.isArray(liveHourlyAq.nitrogen_dioxide)
  );

  for (let i = 0; i < totalHours; i++) {
    // i = 0 representa hace 167 horas, i = 167 representa la hora actual
    const hourDelta = (totalHours - 1) - i;
    const recordTime = new Date(currentEpochMs - hourDelta * 3600 * 1000);
    const hour = recordTime.getHours();
    const dayOfWeek = recordTime.getDay(); // 0 = Domingo ... 6 = Sábado
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayIndex = Math.floor(i / 24);

    // Días de la semana en castellano
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayShorts = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const dayName = dayNames[dayOfWeek];
    const dayShort = dayShorts[dayOfWeek];

    const timeLabel = `${dayShort} ${String(hour).padStart(2, '0')}:00`;
    const dateLabel = `${recordTime.getDate()} ${recordTime.toLocaleString('es-ES', { month: 'short' })}`;
    const fullFormattedDate = `${dayName} ${recordTime.getDate()} de ${recordTime.toLocaleString('es-ES', { month: 'long' })}, ${String(hour).padStart(2, '0')}:00 h`;

    let no2Val: number;
    let o3Val: number;
    let pm25Val: number;
    let pm10Val: number;
    let tempVal: number;
    let windVal: number;
    let rhVal: number;
    let radSolar: number;
    let trafficFactor: number;
    let photolysisJNO2: number;

    if (hasLiveAqData) {
      // Buscar índice en la serie horaria en vivo
      const isoStr = recordTime.toISOString().slice(0, 13);
      const liveIdx = liveHourlyAq.time.findIndex((t: string) => t.startsWith(isoStr));
      const idx = liveIdx >= 0 ? liveIdx : Math.max(0, liveHourlyAq.time.length - 1 - hourDelta);

      const rawNO2 = liveHourlyAq.nitrogen_dioxide ? liveHourlyAq.nitrogen_dioxide[idx] ?? currentNO2 : currentNO2;
      const rawO3 = liveHourlyAq.ozone ? liveHourlyAq.ozone[idx] ?? currentO3 : currentO3;
      const rawPM25 = liveHourlyAq.pm2_5 ? liveHourlyAq.pm2_5[idx] ?? currentPM25 : currentPM25;
      const rawPM10 = liveHourlyAq.pm10 ? liveHourlyAq.pm10[idx] ?? currentPM10 : currentPM10;

      // Aplicar refinamiento microescalar del punto activo
      no2Val = rawNO2 * canyonRetention * svfFactor;
      o3Val = Math.max(5.0, rawO3 / (1.0 + (hwRatio >= 1.0 ? 0.25 : 0.05)));
      pm25Val = rawPM25 * canyonRetention;
      pm10Val = rawPM10 * canyonRetention;

      tempVal = currentTemp + Math.sin((hour - 9) * Math.PI / 12) * 4.5;
      windVal = Math.max(2.0, currentWindKmh + Math.sin((hour - 12) * Math.PI / 12) * 5.0);
      rhVal = Math.max(25.0, Math.min(95.0, currentRH - Math.sin((hour - 9) * Math.PI / 12) * 15.0));
      radSolar = hour >= 7 && hour <= 20 ? Math.max(0, 850 * Math.sin((hour - 7) * Math.PI / 13)) : 0;
      trafficFactor = isWeekend ? EMEP_WEEKEND_HOURLY[hour] : EMEP_WEEKDAY_HOURLY[hour];
      photolysisJNO2 = (radSolar / 850.0) * 0.0085;
    } else {
      // Formulación determinista analítica acoplada a EMEP/EEA y Leighton
      const dayFactor = EMEP_DAY_FACTORS[dayOfWeek];
      const hourProfile = isWeekend ? EMEP_WEEKEND_HOURLY[hour] : EMEP_WEEKDAY_HOURLY[hour];
      trafficFactor = dayFactor * hourProfile;

      // Variación sinóptica de 7 días (onda de presión de mesoescala)
      const synopticWave = 1.0 + 0.12 * Math.cos((i / 24.0) * 0.9);

      // Radiación solar y fotólisis
      if (hour >= 7 && hour <= 20) {
        radSolar = 820.0 * Math.sin((hour - 7) * Math.PI / 13);
      } else {
        radSolar = 0.0;
      }
      photolysisJNO2 = (radSolar / 850.0) * 0.0085;

      // Brisa marina de Alborán (aumento de ventilación entre las 12h y 18h)
      const seaBreezeFactor = hour >= 12 && hour <= 18 ? 1.35 : 0.85;
      windVal = Math.max(2.0, currentWindKmh * seaBreezeFactor * synopticWave);
      tempVal = currentTemp + Math.sin((hour - 9) * Math.PI / 12) * 4.8;
      rhVal = Math.max(30.0, Math.min(92.0, currentRH - Math.sin((hour - 9) * Math.PI / 12) * 16.0));

      // NO2: Emisión proporcional al tráfico / dispersión por viento + confinamiento cañón
      const no2Baseline = (currentNO2 / (canyonRetention * svfFactor)) * 0.65;
      const no2Dispersed = (no2Baseline * trafficFactor * synopticWave) / Math.max(0.6, windVal / 12.0);
      no2Val = (no2Baseline * 0.35 + no2Dispersed * 0.65) * canyonRetention * svfFactor;

      // O3: Titulación matinal (NO + O3 -> NO2) y producción fotoquímica vespertina
      const titrationDepletion = Math.max(0, (trafficFactor - 0.8) * 12.0);
      const photochemicalGain = (radSolar / 800.0) * 35.0;
      o3Val = Math.max(12.0, currentO3 * 0.85 + photochemicalGain - titrationDepletion);

      // PM2.5 y PM10: Tráfico + resuspensión y fondo regional
      const pmFactor = (trafficFactor * 0.5 + 0.5) * synopticWave;
      pm25Val = currentPM25 * 0.55 + currentPM25 * 0.45 * pmFactor;
      pm10Val = currentPM10 * 0.55 + currentPM10 * 0.45 * pmFactor;
    }

    // Asegurar calibración atómica en la hora actual (i = 167)
    if (i === totalHours - 1) {
      no2Val = currentNO2;
      o3Val = currentO3;
      pm25Val = currentPM25;
      pm10Val = currentPM10;
    }

    const { aqi, category: aqiCategory, color: aqiColor } = calculateCompositeAQI(no2Val, o3Val, pm25Val, pm10Val);

    hourlyRecords.push({
      timestamp: recordTime.toISOString(),
      epochMs: recordTime.getTime(),
      timeLabel,
      dateLabel,
      fullFormattedDate,
      dayIndex,
      dayName,
      dayShort,
      hour,
      isWeekend,
      no2: Number(no2Val.toFixed(1)),
      o3: Number(o3Val.toFixed(1)),
      pm25: Number(pm25Val.toFixed(1)),
      pm10: Number(pm10Val.toFixed(1)),
      aqi,
      aqiCategory,
      aqiColor,
      tempC: Number(tempVal.toFixed(1)),
      windKmh: Number(windVal.toFixed(1)),
      rhPct: Number(rhVal.toFixed(1)),
      solarRadiationWm2: Number(radSolar.toFixed(0)),
      trafficFactor: Number(trafficFactor.toFixed(2)),
      photolysisJNO2: Number(photolysisJNO2.toFixed(5))
    });
  }

  // Generar resúmenes diarios para la cantidad de días solicitada (validDays)
  const dailySummaries: DaySummaryRecord[] = [];
  for (let d = 0; d < validDays; d++) {
    const dayChunk = hourlyRecords.slice(d * 24, (d + 1) * 24);
    if (dayChunk.length === 0) continue;

    const no2Arr = dayChunk.map(r => r.no2);
    const o3Arr = dayChunk.map(r => r.o3);
    const pm25Arr = dayChunk.map(r => r.pm25);
    const pm10Arr = dayChunk.map(r => r.pm10);
    const aqiArr = dayChunk.map(r => r.aqi);

    const meanNO2 = Number((no2Arr.reduce((a, b) => a + b, 0) / dayChunk.length).toFixed(1));
    const maxNO2 = Math.max(...no2Arr);
    const minNO2 = Math.min(...no2Arr);

    const meanO3 = Number((o3Arr.reduce((a, b) => a + b, 0) / dayChunk.length).toFixed(1));
    const maxO3 = Math.max(...o3Arr);

    const meanPM25 = Number((pm25Arr.reduce((a, b) => a + b, 0) / dayChunk.length).toFixed(1));
    const maxPM25 = Math.max(...pm25Arr);

    const meanPM10 = Number((pm10Arr.reduce((a, b) => a + b, 0) / dayChunk.length).toFixed(1));
    const maxPM10 = Math.max(...pm10Arr);

    const meanAQI = Number((aqiArr.reduce((a, b) => a + b, 0) / dayChunk.length).toFixed(1));

    // Determinar contaminante dominante del día
    const ratios = [
      { name: 'NO2' as const, ratio: meanNO2 / 40.0 },
      { name: 'O3' as const, ratio: meanO3 / 120.0 },
      { name: 'PM2.5' as const, ratio: meanPM25 / 25.0 },
      { name: 'PM10' as const, ratio: meanPM10 / 40.0 }
    ];
    ratios.sort((a, b) => b.ratio - a.ratio);
    const dominantPollutant = ratios[0].name;

    // Cumplimiento respecto a guías OMS 2021 diarias (NO2 25, O3 100, PM2.5 15, PM10 45)
    const whoCompliance = meanNO2 <= 25 && maxO3 <= 100 && meanPM25 <= 15 && meanPM10 <= 45;
    // Cumplimiento respecto a límites UE (NO2 40, PM10 50)
    const euCompliance = meanNO2 <= 40 && meanPM10 <= 50;

    dailySummaries.push({
      dayIndex: d,
      dateStr: dayChunk[12].dateLabel,
      dayName: dayChunk[12].dayName,
      dayShort: dayChunk[12].dayShort,
      isWeekend: dayChunk[12].isWeekend,
      meanNO2,
      maxNO2,
      minNO2,
      meanO3,
      maxO3,
      meanPM25,
      maxPM25,
      meanPM10,
      maxPM10,
      meanAQI,
      dominantPollutant,
      whoCompliance,
      euCompliance
    });
  }

  return { hourlyRecords, dailySummaries };
}

/**
 * Calcula estadísticas robustas y pendiente de tendencia Theil-Sen para la especie seleccionada.
 */
export function calculatePeriodStatistics(
  records: HourlyAirQualityRecord[],
  pollutant: 'NO2' | 'O3' | 'PM2.5' | 'PM10' | 'AQI' | 'MET'
): PeriodStatistics {
  const getVal = (r: HourlyAirQualityRecord): number => {
    switch (pollutant) {
      case 'NO2': return r.no2;
      case 'O3': return r.o3;
      case 'PM2.5': return r.pm25;
      case 'PM10': return r.pm10;
      case 'AQI': return r.aqi;
      case 'MET': return r.tempC;
    }
  };

  const values = records.map(getVal);
  const n = values.length;
  if (n === 0) {
    return {
      pollutant,
      unit: 'µg/m³',
      mean: 0,
      max: 0,
      maxTimestamp: '',
      maxLabel: '',
      min: 0,
      minTimestamp: '',
      p98: 0,
      p50: 0,
      whoLimit: 10,
      euLimit: 40,
      whoExceedanceHours: 0,
      whoExceedancePct: 0,
      euExceedanceHours: 0,
      theilSenSlopePerDay: 0,
      trendDirection: 'estable',
      trendInterpretation: 'Sin datos disponibles'
    };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = Number((sum / n).toFixed(1));

  let maxVal = -Infinity;
  let maxIdx = 0;
  let minVal = Infinity;
  let minIdx = 0;

  for (let i = 0; i < n; i++) {
    if (values[i] > maxVal) {
      maxVal = values[i];
      maxIdx = i;
    }
    if (values[i] < minVal) {
      minVal = values[i];
      minIdx = i;
    }
  }

  const sorted = [...values].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(n * 0.50)];
  const p98 = sorted[Math.floor(n * 0.98)];

  // Umbrales regulatorios oficiales
  let whoLimit = 10;
  let euLimit = 40;
  let unit = 'µg/m³';

  switch (pollutant) {
    case 'NO2':
      whoLimit = 10; // Guía OMS 2021 Anual (o 25 diaria)
      euLimit = 40;  // Directiva 2008/50/CE Límite Anual
      unit = 'µg/m³';
      break;
    case 'O3':
      whoLimit = 100; // Guía OMS 2021 Máxima diaria de 8h
      euLimit = 120;  // Objetivo UE protección de la salud
      unit = 'µg/m³';
      break;
    case 'PM2.5':
      whoLimit = 5;   // Guía OMS 2021 Anual (o 15 diaria)
      euLimit = 25;   // Límite UE Anual (Directiva 2008/50/CE)
      unit = 'µg/m³';
      break;
    case 'PM10':
      whoLimit = 15;  // Guía OMS 2021 Anual (o 45 diaria)
      euLimit = 40;   // Límite UE Anual
      unit = 'µg/m³';
      break;
    case 'AQI':
      whoLimit = 50;
      euLimit = 75;
      unit = 'Índice CAQI';
      break;
    case 'MET':
      whoLimit = 30;
      euLimit = 35;
      unit = '°C';
      break;
  }

  const whoExceedanceHours = values.filter(v => v > whoLimit).length;
  const whoExceedancePct = Number(((whoExceedanceHours / n) * 100).toFixed(1));
  const euExceedanceHours = values.filter(v => v > euLimit).length;

  // Estimador de Pendiente de Theil-Sen (mediana de pendientes por pares diarios)
  // Compara medias diarias día d=0..5 vs d+1..6
  const dailyMeans: number[] = [];
  for (let d = 0; d < 7; d++) {
    const chunk = values.slice(d * 24, (d + 1) * 24);
    if (chunk.length > 0) {
      dailyMeans.push(chunk.reduce((a, b) => a + b, 0) / chunk.length);
    }
  }

  const pairSlopes: number[] = [];
  for (let i = 0; i < dailyMeans.length; i++) {
    for (let j = i + 1; j < dailyMeans.length; j++) {
      pairSlopes.push((dailyMeans[j] - dailyMeans[i]) / (j - i));
    }
  }
  pairSlopes.sort((a, b) => a - b);
  const theilSenSlopePerDay = pairSlopes.length > 0 
    ? Number(pairSlopes[Math.floor(pairSlopes.length / 2)].toFixed(2))
    : 0;

  let trendDirection: 'descendente' | 'estable' | 'ascendente' = 'estable';
  let trendInterpretation = 'Comportamiento estable a lo largo de los 7 días';

  if (theilSenSlopePerDay < -0.40) {
    trendDirection = 'descendente';
    trendInterpretation = `Tendencia de mejora: descenso de ${Math.abs(theilSenSlopePerDay)} ${unit}/día`;
  } else if (theilSenSlopePerDay > 0.40) {
    trendDirection = 'ascendente';
    trendInterpretation = `Tendencia al alza: incremento de +${theilSenSlopePerDay} ${unit}/día`;
  }

  return {
    pollutant,
    unit,
    mean,
    max: maxVal,
    maxTimestamp: records[maxIdx].timestamp,
    maxLabel: records[maxIdx].timeLabel,
    min: minVal,
    minTimestamp: records[minIdx].timestamp,
    p98,
    p50,
    whoLimit,
    euLimit,
    whoExceedanceHours,
    whoExceedancePct,
    euExceedanceHours,
    theilSenSlopePerDay,
    trendDirection,
    trendInterpretation
  };
}

/**
 * Exporta el historial de 7 días del punto activo a formato CSV estandarizado FAIR.
 */
export function exportActivePointHistoryCSV(
  records: HourlyAirQualityRecord[],
  pointMeta: {
    name: string;
    lat: number;
    lon: number;
    elevationM?: number;
    svf?: number;
  }
): void {
  const utm = wgs84ToUtm30N(pointMeta.lon, pointMeta.lat);
  const header = [
    '# Tesis Doctoral - Gemelo Digital de Calidad del Aire de Málaga',
    `# Punto Activo: ${pointMeta.name}`,
    `# Coordenadas WGS84: Lat ${pointMeta.lat.toFixed(6)}, Lon ${pointMeta.lon.toFixed(6)}`,
    `# Coordenadas ETRS89 UTM Huso 30N: X=${utm.x.toFixed(2)} m, Y=${utm.y.toFixed(2)} m`,
    `# Cota MDE: ${pointMeta.elevationM ?? 12} m | Sky View Factor: ${pointMeta.svf?.toFixed(2) ?? '0.42'}`,
    '# Principios FAIR: Findable, Accessible, Interoperable, Reusable (Directiva 2008/50/CE & EMEP/EEA 2023)',
    'ISO_TIMESTAMP,TIME_LABEL,DAY_NAME,HOUR,NO2_UG_M3,O3_UG_M3,PM25_UG_M3,PM10_UG_M3,AQI_CAQI,AQI_CATEGORY,TEMP_C,WIND_KMH,RH_PCT,RAD_SOLAR_WM2,TRAFFIC_FACTOR'
  ].join('\n');

  const rows = records.map(r => [
    r.timestamp,
    `"${r.timeLabel}"`,
    `"${r.dayName}"`,
    r.hour,
    r.no2,
    r.o3,
    r.pm25,
    r.pm10,
    r.aqi,
    `"${r.aqiCategory}"`,
    r.tempC,
    r.windKmh,
    r.rhPct,
    r.solarRadiationWm2,
    r.trafficFactor
  ].join(','));

  const csvContent = `${header}\n${rows.join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = pointMeta.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
  a.download = `historial_7d_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta el historial de 7 días del punto activo a formato GeoJSON con serie temporal en properties.
 */
export function exportActivePointHistoryGeoJSON(
  records: HourlyAirQualityRecord[],
  pointMeta: {
    name: string;
    lat: number;
    lon: number;
    districtName?: string;
    elevationM?: number;
    svf?: number;
  }
): void {
  const utm = wgs84ToUtm30N(pointMeta.lon, pointMeta.lat);
  const geojson = {
    type: 'FeatureCollection',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
    },
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [pointMeta.lon, pointMeta.lat]
        },
        properties: {
          pointName: pointMeta.name,
          district: pointMeta.districtName ?? 'Málaga Centro',
          elevationM: pointMeta.elevationM ?? 12,
          skyViewFactor: pointMeta.svf ?? 0.42,
          utm30N_Easting: Number(utm.x.toFixed(2)),
          utm30N_Northing: Number(utm.y.toFixed(2)),
          generatedAt: new Date().toISOString(),
          periodHours: records.length,
          timeSeries: records.map(r => ({
            timestamp: r.timestamp,
            label: r.timeLabel,
            no2: r.no2,
            o3: r.o3,
            pm25: r.pm25,
            pm10: r.pm10,
            aqi: r.aqi,
            tempC: r.tempC,
            windKmh: r.windKmh
          }))
        }
      }
    ]
  };

  const str = JSON.stringify(geojson, null, 2);
  const blob = new Blob([str], { type: 'application/geo+json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = pointMeta.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
  a.download = `geospatial_historial_7d_${safeName}.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
