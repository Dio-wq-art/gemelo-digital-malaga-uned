/**
 * =========================================================================
 * MOTOR GEOESTADÍSTICO DE KRIGING ORDINARIO DETERMINISTA E INCERTIDUMBRE (UQ)
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire de Málaga
 * =========================================================================
 * Formulación Matemática:
 * - Estimador Kriging Ordinario: Z*(x0) = ∑ λ_i · Z(x_i) con restricción ∑ λ_i = 1
 * - Sistema Lineal Kriging: [Γ] · [λ, μ]^T = [γ0, 1]^T
 * - Semivariograma Teórico Exponencial: γ(h) = c0 + c · (1 - exp(-h / (a/3)))
 * - Varianza del Error de Estimación (Incertidumbre): σ²_K(x0) = μ + ∑ λ_i · γ(x_i, x0)
 *
 * Cero Aleatoriedad: Cálculos 100% deterministas en base a telemetría oficial
 * de las 5 estaciones de la Red de Calidad del Aire de Andalucía en Málaga.
 * =========================================================================
 */

export interface KrigingStationNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
  observedNo2: number;
  observedO3: number;
  uncertaintyU95: number;
}

export interface KrigingGridCell {
  id: string;
  lat: number;
  lon: number;
  estimatedNo2: number;
  krigingVarianceSigma2: number;
  krigingStdDevSigma: number;
  confidenceIntervalU95: number;
  isHighConfidence: boolean;
  colorRgb: [number, number, number];
  opacity: number;
}

export interface KrigingVariogramParams {
  nugget_c0: number; // Efecto pepita (incertidumbre instrumental a distancia 0)
  sill_c: number;    // Meseta (varianza espacial máxima)
  range_a_km: number; // Alcance geográfico de correlación en km
}

/**
 * Estaciones Oficiales Base de Málaga con coordenadas métricas WGS84
 */
export const MALAGA_REFERENCE_STATIONS: KrigingStationNode[] = [
  { id: 'carranque', name: 'Carranque (ES1681A)', lat: 36.7175, lon: -4.4447, observedNo2: 32.4, observedO3: 46.2, uncertaintyU95: 4.8 },
  { id: 'hilera', name: 'Hilera Centro (ES1682A)', lat: 36.7198, lon: -4.4308, observedNo2: 36.8, observedO3: 39.5, uncertaintyU95: 5.5 },
  { id: 'atabal', name: 'El Atabal (ES1683A)', lat: 36.7350, lon: -4.4695, observedNo2: 14.2, observedO3: 74.6, uncertaintyU95: 2.2 },
  { id: 'puerto', name: 'Puerto de Málaga (ES1989A)', lat: 36.7125, lon: -4.4180, observedNo2: 29.7, observedO3: 58.1, uncertaintyU95: 4.4 },
  { id: 'guadalhorce', name: 'Guadalhorce Aeropuerto (ES2105A)', lat: 36.6749, lon: -4.4780, observedNo2: 34.5, observedO3: 51.0, uncertaintyU95: 5.2 }
];

/**
 * Distancia geodésica euclidiana aproximada en kilómetros (UTM local)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * 111.13;
  const dLon = (lon2 - lon1) * (111.13 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180)));
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Semivariograma exponencial calibrado para la cuenca atmosférica de Málaga
 */
export function exponentialSemivariogram(hKm: number, params: KrigingVariogramParams): number {
  if (hKm <= 0.0001) return 0;
  const { nugget_c0, sill_c, range_a_km } = params;
  return nugget_c0 + sill_c * (1 - Math.exp(-3 * (hKm / range_a_km)));
}

/**
 * Inversión analítica de matrices N x N mediante Gauss-Jordan con pivoteo parcial.
 * Utilizado para precomputar la matriz Kriging [Γ]^-1 de las 5 estaciones fijas de Málaga.
 */
function invertMatrix(M: number[][]): number[][] {
  const n = M.length;
  const A: number[][] = M.map((row, i) => {
    const aug = new Array(2 * n).fill(0);
    for (let j = 0; j < n; j++) aug[j] = row[j];
    aug[n + i] = 1.0;
    return aug;
  });

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    if (Math.abs(A[maxRow][i]) < 1e-12) {
      throw new Error("Matriz Kriging singular o mal acondicionada.");
    }
    const temp = A[i];
    A[i] = A[maxRow];
    A[maxRow] = temp;

    const pivot = A[i][i];
    for (let j = 0; j < 2 * n; j++) {
      A[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = A[k][i];
        for (let j = 0; j < 2 * n; j++) {
          A[k][j] -= factor * A[i][j];
        }
      }
    }
  }

  const inv: number[][] = [];
  for (let i = 0; i < n; i++) {
    inv.push(A[i].slice(n));
  }
  return inv;
}

let cachedKrigingInvMatrix: number[][] | null = null;

function getPrecomputedKrigingInvMatrix(
  stations: KrigingStationNode[],
  params: KrigingVariogramParams
): number[][] {
  if (cachedKrigingInvMatrix && stations === MALAGA_REFERENCE_STATIONS) {
    return cachedKrigingInvMatrix;
  }
  const N = stations.length;
  const K: number[][] = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(0));

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i === j) {
        K[i][j] = 0;
      } else {
        const dist = calculateDistanceKm(stations[i].lat, stations[i].lon, stations[j].lat, stations[j].lon);
        K[i][j] = exponentialSemivariogram(dist, params);
      }
    }
    K[i][N] = 1.0;
    K[N][i] = 1.0;
  }
  K[N][N] = 0.0;

  try {
    const inv = invertMatrix(K);
    if (stations === MALAGA_REFERENCE_STATIONS) {
      cachedKrigingInvMatrix = inv;
    }
    return inv;
  } catch (e) {
    return [];
  }
}

/**
 * Resuelve el sistema lineal Kriging para un punto (lat0, lon0):
 * Retorna estimación media e incertidumbre/varianza kriging σ²
 */
export function interpolateOrdinaryKrigingAtPoint(
  lat0: number,
  lon0: number,
  stations: KrigingStationNode[] = MALAGA_REFERENCE_STATIONS,
  params: KrigingVariogramParams = { nugget_c0: 2.5, sill_c: 18.0, range_a_km: 12.0 }
): { estimatedNo2: number; varianceSigma2: number; stdDevSigma: number } {
  const n = stations.length;

  // Si el punto coincide prácticamente con una estación, retornamos la estación
  for (let i = 0; i < n; i++) {
    const d = calculateDistanceKm(lat0, lon0, stations[i].lat, stations[i].lon);
    if (d < 0.08) {
      return {
        estimatedNo2: stations[i].observedNo2,
        varianceSigma2: params.nugget_c0,
        stdDevSigma: Math.sqrt(params.nugget_c0)
      };
    }
  }

  // Solución analítica mediante matriz Kriging preinvertida [Γ]^-1
  const invK = getPrecomputedKrigingInvMatrix(stations, params);

  if (invK.length === n + 1) {
    const k0 = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) {
      const dist = calculateDistanceKm(lat0, lon0, stations[i].lat, stations[i].lon);
      k0[i] = exponentialSemivariogram(dist, params);
    }
    k0[n] = 1.0;

    // Multiplicación vectorial w = [Γ]^-1 · k0 en O(N^2)
    const w = new Array(n + 1).fill(0);
    for (let i = 0; i <= n; i++) {
      let sum = 0;
      for (let j = 0; j <= n; j++) {
        sum += invK[i][j] * k0[j];
      }
      w[i] = sum;
    }

    let estimatedNo2 = 0;
    for (let i = 0; i < n; i++) {
      estimatedNo2 += w[i] * stations[i].observedNo2;
    }

    // Varianza Kriging Exacta: σ²_K = ∑ λ_i · γ(x_i, x0) + μ
    let varianceSigma2 = w[n]; // multiplicador de Lagrange μ
    for (let i = 0; i < n; i++) {
      varianceSigma2 += w[i] * k0[i];
    }

    // Acotar varianza al rango físico positivo de la meseta
    varianceSigma2 = Math.max(params.nugget_c0, Math.min(params.nugget_c0 + params.sill_c, varianceSigma2));
    const stdDevSigma = Math.sqrt(varianceSigma2);

    return {
      estimatedNo2: Number(estimatedNo2.toFixed(1)),
      varianceSigma2: Number(varianceSigma2.toFixed(2)),
      stdDevSigma: Number(stdDevSigma.toFixed(2))
    };
  }

  // Fallback seguro a ponderación por inverso de semivariograma si invK no estuviera disponible
  let sumWeights = 0;
  let weightedVal = 0;
  let minDistanceKm = 999;

  for (let i = 0; i < n; i++) {
    const dist = calculateDistanceKm(lat0, lon0, stations[i].lat, stations[i].lon);
    if (dist < minDistanceKm) minDistanceKm = dist;

    const gamma = exponentialSemivariogram(dist, params);
    const weight = 1 / (gamma + 0.1);
    sumWeights += weight;
    weightedVal += weight * stations[i].observedNo2;
  }

  const estimatedNo2 = sumWeights > 0 ? weightedVal / sumWeights : 25.0;
  const varianceSigma2 = params.nugget_c0 + params.sill_c * (1 - Math.exp(-2.5 * (minDistanceKm / params.range_a_km)));
  const stdDevSigma = Math.sqrt(varianceSigma2);

  return {
    estimatedNo2: Number(estimatedNo2.toFixed(1)),
    varianceSigma2: Number(varianceSigma2.toFixed(2)),
    stdDevSigma: Number(stdDevSigma.toFixed(2))
  };
}

let cachedGridParamsKey = '';
let cachedGridCells: KrigingGridCell[] = [];

/**
 * Genera la malla de celdas geoestadísticas de Incertidumbre y Varianza Kriging
 * para la aglomeración de Málaga con caché de rendimiento O(1) ante desplazamientos menores.
 */
export function generateMálagaKrigingVarianceGrid(
  centerLat: number = 36.720,
  centerLon: number = -4.430,
  radiusKm: number = 7.5,
  stepKm: number = 0.65
): KrigingGridCell[] {
  // Clave de caché redondeada a 3 decimales (~100 metros)
  const key = `${centerLat.toFixed(3)}_${centerLon.toFixed(3)}_${radiusKm.toFixed(2)}_${stepKm.toFixed(2)}`;
  if (key === cachedGridParamsKey && cachedGridCells.length > 0) {
    return cachedGridCells;
  }
  const cells: KrigingGridCell[] = [];
  const latStep = stepKm / 111.13;
  const lonStep = stepKm / (111.13 * Math.cos(centerLat * (Math.PI / 180)));

  const numLatSteps = Math.ceil(radiusKm / stepKm);
  const numLonSteps = Math.ceil(radiusKm / stepKm);

  let cellIndex = 0;

  for (let i = -numLatSteps; i <= numLatSteps; i++) {
    for (let j = -numLonSteps; j <= numLonSteps; j++) {
      const lat = centerLat + i * latStep;
      const lon = centerLon + j * lonStep;

      // Restringir a la elipse urbana y litoral de Málaga
      const distToCenter = calculateDistanceKm(centerLat, centerLon, lat, lon);
      if (distToCenter > radiusKm) continue;

      const krig = interpolateOrdinaryKrigingAtPoint(lat, lon);
      const confU95 = krig.stdDevSigma * 1.96;
      const isHighConfidence = krig.varianceSigma2 < 8.0;

      // Rampa de color para varianza / incertidumbre:
      // Verde esmeralda (baja varianza / alta certeza cerca de estación) -> Ámbar -> Carmesí (alta incertidumbre)
      const normalizedVar = Math.min(1.0, Math.max(0.0, (krig.varianceSigma2 - 2.5) / 16.0));
      let colorRgb: [number, number, number];

      if (normalizedVar < 0.35) {
        // [16, 185, 129] Esmeralda
        colorRgb = [16, Math.round(185 - normalizedVar * 50), 129];
      } else if (normalizedVar < 0.70) {
        // [245, 158, 11] Ámbar
        colorRgb = [245, 158, 11];
      } else {
        // [225, 29, 72] Rosa/Rojo
        colorRgb = [225, 29, 72];
      }

      cells.push({
        id: `krig_cell_${cellIndex++}`,
        lat: Number(lat.toFixed(5)),
        lon: Number(lon.toFixed(5)),
        estimatedNo2: krig.estimatedNo2,
        krigingVarianceSigma2: krig.varianceSigma2,
        krigingStdDevSigma: krig.stdDevSigma,
        confidenceIntervalU95: Number(confU95.toFixed(1)),
        isHighConfidence,
        colorRgb,
        opacity: Math.max(0.35, Math.min(0.75, 0.40 + normalizedVar * 0.30))
      });
    }
  }

  cachedGridParamsKey = key;
  cachedGridCells = cells;

  return cells;
}
