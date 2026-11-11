/**
 * Módulo de Diagnóstico de Innovación del Filtro de Kalman Ensemble (EnKF)
 * Análisis de residuos d_k = y_k - H x_k⁻ y Prueba de Hipótesis Chi-Cuadrado (χ²)
 */

export interface InnovationStationResult {
  stationId: string;
  stationName: string;
  priorPredictionX: number; // x_k⁻ (µg/m³)
  telemetryObservationY: number; // y_k (µg/m³)
  innovationD: number; // d_k = y_k - H x_k⁻
  innovationVarianceS: number; // S_k = H P_k⁻ Hᵀ + R_k
  normalizedSquareInnovation: number; // d_k² / S_k
}

export interface EnkfInnovationDiagnostic {
  stations: InnovationStationResult[];
  degreesOfFreedom: number; // N
  totalNormalizedInnovationChi2: number; // Σ (d_k² / S_k)
  chi2Threshold95: number; // Valor crítico χ² (95% nivel de confianza)
  nullHypothesisAccepted: boolean; // ¿Filtro óptimo no sesgado?
  meanInnovation: number; // Media de residuos
  innovationStandardDeviation: number;
}

/**
 * Tabla de Valores Críticos χ² para nivel de significación α = 0.05
 */
const CHI2_CRITICAL_VALUES_95: Record<number, number> = {
  1: 3.841,
  2: 5.991,
  3: 7.815,
  4: 9.488,
  5: 11.07,
  6: 12.592,
  7: 14.067,
  8: 15.507,
  9: 16.919,
  10: 18.307,
};

/**
 * Calcula el diagnóstico de innovación de Kalman y el test χ²
 */
export function calculateEnkfInnovationDiagnostic(
  stationsState: Array<{
    station: { name: string };
    priorValueNO2: number;
    observedValueNO2: number;
  }>
): EnkfInnovationDiagnostic {
  if (!stationsState || stationsState.length === 0) {
    return {
      stations: [],
      degreesOfFreedom: 0,
      totalNormalizedInnovationChi2: 0,
      chi2Threshold95: 11.07,
      nullHypothesisAccepted: true,
      meanInnovation: 0,
      innovationStandardDeviation: 0,
    };
  }

  let totalChi2 = 0;
  let sumD = 0;
  const innovationsD: number[] = [];

  const stations: InnovationStationResult[] = stationsState.map((st, i) => {
    const priorX = st.priorValueNO2;
    const obsY = st.observedValueNO2;
    const d = parseFloat((obsY - priorX).toFixed(2));
    innovationsD.push(d);
    sumD += d;

    // Incertidumbre observacional R + varianza de fondo P_k (estimación conservadora 12 µg²/m⁶)
    const varS = 12.5 + Math.pow(0.08 * obsY, 2);
    const nis = parseFloat((Math.pow(d, 2) / varS).toFixed(3));
    totalChi2 += nis;

    return {
      stationId: `EST-00${i + 1}`,
      stationName: st.station.name,
      priorPredictionX: priorX,
      telemetryObservationY: obsY,
      innovationD: d,
      innovationVarianceS: parseFloat(varS.toFixed(2)),
      normalizedSquareInnovation: nis,
    };
  });

  const n = stationsState.length;
  const meanD = parseFloat((sumD / n).toFixed(3));

  let varSum = 0;
  innovationsD.forEach((d) => {
    varSum += Math.pow(d - meanD, 2);
  });
  const stdD = parseFloat((Math.sqrt(varSum / n)).toFixed(3));

  const criticalChi2 = CHI2_CRITICAL_VALUES_95[n] || 11.07;
  const accepted = totalChi2 <= criticalChi2;

  return {
    stations,
    degreesOfFreedom: n,
    totalNormalizedInnovationChi2: parseFloat(totalChi2.toFixed(3)),
    chi2Threshold95: criticalChi2,
    nullHypothesisAccepted: accepted,
    meanInnovation: meanD,
    innovationStandardDeviation: stdD,
  };
}
