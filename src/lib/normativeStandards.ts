/**
 * Utilidad Centralizada de Clasificación Normativa Europea y OMS (Air Quality Standards)
 * Directiva 2008/50/CE & Revisión Directiva UE 2024/1618 (Horizonte 2030) & Guías OMS 2021
 * 
 * Proporciona el estado normativo y clases cromáticas oficiales para la interfaz de usuario:
 * - Verde (#10b981 / emerald): Cumplimiento óptimo por debajo del valor guía OMS (aire limpio).
 * - Ámbar (#f59e0b / amber): Por encima del valor guía OMS 2021, pero dentro del límite de transición UE 2030.
 * - Naranja (#f97316 / orange): Superación del límite horizonte UE 2030 (Directiva 2024/1618, 20 µg/m³ para NO2/PM10, 10 µg/m³ PM2.5).
 * - Rojo / Carmesí (#ef4444 / rose/red): Superación del límite legal vigente Directiva 2008/50/CE (40 µg/m³ para NO2/PM10, 20 µg/m³ PM2.5).
 */

export interface NormativeStatus {
  status: 'optimal' | 'moderate' | 'exceeds_2030' | 'exceeds_current';
  label: string;
  shortLabel: string;
  badgeText: string;
  colorHex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  glowClass: string;
  directiveCitation: string;
  worstPollutant: string;
  worstPollutantValue: number;
  worstPollutantUnit: string;
}

export interface PollutantValues {
  no2: number;
  pm25: number;
  pm10: number;
  o3?: number;
}

// Límites oficiales reglamentarios (µg/m³)
export const NORMATIVE_LIMITS = {
  NO2: {
    who2021: 25, // media 24h OMS 2021 (10 anual)
    eu2030: 20,  // Directiva 2024/1618 horizonte 2030
    eu2008: 40   // Directiva 2008/50/CE límite anual vigente
  },
  PM25: {
    who2021: 15, // media 24h OMS 2021 (5 anual)
    eu2030: 10,  // Directiva 2024/1618 horizonte 2030
    eu2008: 20   // Directiva 2008/50/CE (fase 2)
  },
  PM10: {
    who2021: 45, // media 24h OMS 2021 (15 anual)
    eu2030: 20,  // Directiva 2024/1618 horizonte 2030
    eu2008: 40   // Directiva 2008/50/CE límite anual vigente
  },
  O3: {
    who2021: 100, // media 8h máxima OMS 2021
    eu2030: 100,  // objetivo propuesto 2030
    eu2008: 120   // Directiva 2008/50/CE valor objetivo
  }
};

/**
 * Evalúa el estado normativo riguroso de una asimilación local según los estándares europeos y OMS
 */
export function evaluateNormativeStatus(values: PollutantValues): NormativeStatus {
  const { no2, pm25, pm10, o3 } = values;

  // Evaluar cocientes de severidad relativa frente a Directiva 2008/50/CE
  const ratioNO2_2008 = no2 / NORMATIVE_LIMITS.NO2.eu2008;
  const ratioPM25_2008 = pm25 / NORMATIVE_LIMITS.PM25.eu2008;
  const ratioPM10_2008 = pm10 / NORMATIVE_LIMITS.PM10.eu2008;
  const ratioO3_2008 = (o3 || 0) / NORMATIVE_LIMITS.O3.eu2008;

  // Evaluar cocientes frente a horizonte 2030
  const ratioNO2_2030 = no2 / NORMATIVE_LIMITS.NO2.eu2030;
  const ratioPM25_2030 = pm25 / NORMATIVE_LIMITS.PM25.eu2030;
  const ratioPM10_2030 = pm10 / NORMATIVE_LIMITS.PM10.eu2030;

  // Evaluar frente a OMS 2021
  const ratioNO2_who = no2 / NORMATIVE_LIMITS.NO2.who2021;
  const ratioPM25_who = pm25 / NORMATIVE_LIMITS.PM25.who2021;
  const ratioPM10_who = pm10 / NORMATIVE_LIMITS.PM10.who2021;

  // 1. Superación de límite legal vigente Directiva 2008/50/CE
  if (ratioNO2_2008 > 1 || ratioPM25_2008 > 1 || ratioPM10_2008 > 1 || ratioO3_2008 > 1) {
    let worst = 'NO₂';
    let val = no2;
    let maxRatio = ratioNO2_2008;

    if (ratioPM25_2008 > maxRatio) {
      worst = 'PM2.5';
      val = pm25;
      maxRatio = ratioPM25_2008;
    }
    if (ratioPM10_2008 > maxRatio) {
      worst = 'PM10';
      val = pm10;
      maxRatio = ratioPM10_2008;
    }
    if (ratioO3_2008 > maxRatio && o3) {
      worst = 'O₃';
      val = o3;
    }

    return {
      status: 'exceeds_current',
      label: 'Superación Límite Legal (Directiva 2008/50/CE)',
      shortLabel: 'Superación Legal',
      badgeText: `ALERTA ${worst} > VLE`,
      colorHex: '#ef4444',
      bgClass: 'bg-rose-950/80',
      textClass: 'text-rose-300',
      borderClass: 'border-rose-500',
      glowClass: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',
      directiveCitation: 'Directiva 2008/50/CE Anexo XI (VLE superado)',
      worstPollutant: worst,
      worstPollutantValue: Number(val.toFixed(1)),
      worstPollutantUnit: 'µg/m³'
    };
  }

  // 2. Superación del Límite Horizonte UE 2030 (Directiva 2024/1618)
  if (ratioNO2_2030 > 1 || ratioPM25_2030 > 1 || ratioPM10_2030 > 1) {
    let worst = 'NO₂';
    let val = no2;
    let maxRatio = ratioNO2_2030;

    if (ratioPM25_2030 > maxRatio) {
      worst = 'PM2.5';
      val = pm25;
      maxRatio = ratioPM25_2030;
    }
    if (ratioPM10_2030 > maxRatio) {
      worst = 'PM10';
      val = pm10;
      maxRatio = ratioPM10_2030;
    }

    return {
      status: 'exceeds_2030',
      label: 'Superación Horizonte UE 2030 (Dir. 2024/1618)',
      shortLabel: 'Excede UE 2030',
      badgeText: `NO CONFORME 2030 (${worst})`,
      colorHex: '#f97316',
      bgClass: 'bg-orange-950/80',
      textClass: 'text-orange-300',
      borderClass: 'border-orange-500',
      glowClass: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
      directiveCitation: 'Directiva UE 2024/1618 Horizonte 2030 (20 µg/m³ NO₂/PM10, 10 µg/m³ PM2.5)',
      worstPollutant: worst,
      worstPollutantValue: Number(val.toFixed(1)),
      worstPollutantUnit: 'µg/m³'
    };
  }

  // 3. Superación de Guías de Salud OMS 2021
  if (ratioNO2_who > 1 || ratioPM25_who > 1 || ratioPM10_who > 1) {
    let worst = 'NO₂';
    let val = no2;
    let maxRatio = ratioNO2_who;

    if (ratioPM25_who > maxRatio) {
      worst = 'PM2.5';
      val = pm25;
      maxRatio = ratioPM25_who;
    }
    if (ratioPM10_who > maxRatio) {
      worst = 'PM10';
      val = pm10;
      maxRatio = ratioPM10_who;
    }

    return {
      status: 'moderate',
      label: 'Conforme UE 2008/2030 • Supera Guías OMS 2021',
      shortLabel: 'Alerta OMS 2021',
      badgeText: `MODERADO OMS (${worst})`,
      colorHex: '#f59e0b',
      bgClass: 'bg-amber-950/80',
      textClass: 'text-amber-300',
      borderClass: 'border-amber-500',
      glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      directiveCitation: 'Guías de Calidad del Aire de la OMS 2021 (WHO AQG)',
      worstPollutant: worst,
      worstPollutantValue: Number(val.toFixed(1)),
      worstPollutantUnit: 'µg/m³'
    };
  }

  // 4. Óptimo (cumple OMS 2021 y Directivas UE)
  return {
    status: 'optimal',
    label: 'Calidad Óptima (Conforme OMS 2021 & Directivas UE)',
    shortLabel: 'Conforme OMS',
    badgeText: 'CONFORME OMS & UE',
    colorHex: '#10b981',
    bgClass: 'bg-emerald-950/80',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500',
    glowClass: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    directiveCitation: 'Cumple Directivas 2008/50/CE, 2024/1618 y Guías OMS 2021',
    worstPollutant: 'NO₂',
    worstPollutantValue: Number(no2.toFixed(1)),
    worstPollutantUnit: 'µg/m³'
  };
}
