/**
 * Módulo de Geodesia y Métricas Espaciales Oficiales para Málaga (EPSG:25830 - ETRS89 / UTM zone 30N)
 * Tesis Doctoral - Modelización de Calidad del Aire y Gemelo Digital Urbano
 * 
 * Marco Normativo:
 * - Real Decreto 1071/2007, de 27 de julio, por el que se regula el sistema geodésico de referencia oficial en España (ETRS89).
 * - Directiva 2007/2/CE del Parlamento Europeo (INSPIRE).
 * - Coordenadas métricas para cálculo estricto de microescala, dispersión CFD, cañones urbanos (H/W) y distorsión cartográfica.
 */

import proj4 from 'proj4';

// Definición oficial EPSG:25830 (ETRS89 / UTM zone 30N)
// Parámetros elipsoide GRS80: a=6378137.0, rf=298.257222101, central_meridian=-3.0, false_easting=500000.0, false_northing=0.0
export const EPSG_25830_DEF = '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs';
export const EPSG_4326_DEF = '+proj=longlat +datum=WGS84 +no_defs +type=crs';

// Registrar en el catálogo de proj4
proj4.defs('EPSG:25830', EPSG_25830_DEF);
proj4.defs('EPSG:4326', EPSG_4326_DEF);

export interface UtmCoordinate {
  /** Coordenada X (Easting) en metros (EPSG:25830) */
  x: number;
  /** Coordenada Y (Northing) en metros (EPSG:25830) */
  y: number;
  /** Convergencia de meridianos en grados sexagesimales (diferencia entre Norte de Cuadrícula y Norte Geográfico) */
  gridConvergenceDeg: number;
  /** Factor de escala puntual k */
  scaleFactor: number;
}

export interface WgsCoordinate {
  lon: number;
  lat: number;
}

/**
 * Transforma coordenadas geográficas WGS84 (Lon, Lat) a ETRS89 / UTM Huso 30N (EPSG:25830).
 * Aplica cálculo analítico de convergencia de meridianos y factor de escala puntual.
 */
export function wgs84ToUtm30N(lon: number, lat: number): UtmCoordinate {
  const [x, y] = proj4('EPSG:4326', 'EPSG:25830', [lon, lat]);

  // Meridiano central del Huso 30 es -3.0° (3° Oeste)
  const lambda0 = -3.0;
  const dLambdaRad = ((lon - lambda0) * Math.PI) / 180;
  const phiRad = (lat * Math.PI) / 180;

  // Convergencia de meridianos gamma approx = dLambda * sin(phi)
  const gammaRad = dLambdaRad * Math.sin(phiRad);
  const gridConvergenceDeg = (gammaRad * 180) / Math.PI;

  // Factor de escala puntual k approx = k0 * (1 + (x - 500000)^2 / (2 * R^2))
  const k0 = 0.9996;
  const dx = x - 500000.0;
  const R = 6378137.0;
  const scaleFactor = k0 * (1 + (dx * dx) / (2 * R * R));

  return {
    x: Number(x.toFixed(3)),
    y: Number(y.toFixed(3)),
    gridConvergenceDeg: Number(gridConvergenceDeg.toFixed(4)),
    scaleFactor: Number(scaleFactor.toFixed(6)),
  };
}

/**
 * Transforma coordenadas proyectadas ETRS89 / UTM Huso 30N (EPSG:25830) a WGS84 (Lon, Lat).
 */
export function utm30NToWgs84(x: number, y: number): WgsCoordinate {
  const [lon, lat] = proj4('EPSG:25830', 'EPSG:4326', [x, y]);
  return {
    lon: Number(lon.toFixed(7)),
    lat: Number(lat.toFixed(7)),
  };
}

/**
 * Calcula la distancia métrica euclidiana exacta entre dos puntos geográficos en el plano UTM 30N.
 * Elimina las distorsiones de la fórmula de haversine en distancias cortas (< 5 km).
 */
export function calculatePlanarDistanceM(p1: WgsCoordinate, p2: WgsCoordinate): number {
  const u1 = wgs84ToUtm30N(p1.lon, p1.lat);
  const u2 = wgs84ToUtm30N(p2.lon, p2.lat);
  const dx = u2.x - u1.x;
  const dy = u2.y - u1.y;
  return Number(Math.sqrt(dx * dx + dy * dy).toFixed(2));
}

/**
 * Calcula el acimut de cuadrícula y acimut geográfico verdadero (0° a 360°) entre dos puntos.
 */
export function calculatePlanarBearingDeg(from: WgsCoordinate, to: WgsCoordinate): { gridBearingDeg: number; trueBearingDeg: number } {
  const u1 = wgs84ToUtm30N(from.lon, from.lat);
  const u2 = wgs84ToUtm30N(to.lon, to.lat);
  const dx = u2.x - u1.x;
  const dy = u2.y - u1.y;

  let angleRad = Math.atan2(dx, dy);
  let gridBearingDeg = (angleRad * 180) / Math.PI;
  if (gridBearingDeg < 0) gridBearingDeg += 360;

  // Acimut geográfico verdadero = Acimut de cuadrícula + convergencia de meridianos
  let trueBearingDeg = gridBearingDeg + u1.gridConvergenceDeg;
  if (trueBearingDeg < 0) trueBearingDeg += 360;
  if (trueBearingDeg >= 360) trueBearingDeg -= 360;

  return {
    gridBearingDeg: Number(gridBearingDeg.toFixed(2)),
    trueBearingDeg: Number(trueBearingDeg.toFixed(2)),
  };
}

/**
 * Estructura de Métricas Geométricas de Cañón Urbano (Street Canyon)
 */
export interface CanyonGeodeticMetrics {
  /** Ancho de calzada + aceras entre fachadas opuestas en metros W */
  W_m: number;
  /** Altura media de edificios perimetrales en metros H */
  H_m: number;
  /** Relación de aspecto del cañón H/W */
  aspectRatio_HW: number;
  /** Régimen de flujo de viento según Oke (1988) */
  flowRegime: 'isolated_roughness' | 'wake_interference' | 'skimming_flow';
  /** Orientación axial del cañón respecto al Norte Verdadero en grados [0°, 180°) */
  canyonOrientationDeg: number;
  /** Coordenadas UTM ETRS89 del eje central */
  utmCenter: UtmCoordinate;
}

/**
 * Calcula las métricas rigurosas de cañón urbano a partir de la geometría de fachadas y altura.
 * Aplica la clasificación canónica de Oke (1988) y Grimmond & Oke (1999).
 */
export function computeRigorousCanyonMetrics(
  centerLon: number,
  centerLat: number,
  facadeLeftLon: number,
  facadeLeftLat: number,
  facadeRightLon: number,
  facadeRightLat: number,
  averageBuildingHeightM: number
): CanyonGeodeticMetrics {
  const left = wgs84ToUtm30N(facadeLeftLon, facadeLeftLat);
  const right = wgs84ToUtm30N(facadeRightLon, facadeRightLat);

  const dx = right.x - left.x;
  const dy = right.y - left.y;
  const W_m = Number(Math.sqrt(dx * dx + dy * dy).toFixed(2));
  const H_m = Number(averageBuildingHeightM.toFixed(2));
  const aspectRatio_HW = Number((H_m / Math.max(W_m, 1.0)).toFixed(2));

  // Régimen de flujo Oke (1988)
  let flowRegime: 'isolated_roughness' | 'wake_interference' | 'skimming_flow' = 'isolated_roughness';
  if (aspectRatio_HW >= 0.65) {
    flowRegime = 'skimming_flow'; // Flujo rasante con vórtice primario atrapado
  } else if (aspectRatio_HW >= 0.3) {
    flowRegime = 'wake_interference'; // Interferencia de estelas
  } else {
    flowRegime = 'isolated_roughness'; // Rugosidad aislada
  }

  // Orientación del eje (perpendicular al vector entre fachadas)
  let normalDeg = (Math.atan2(dx, dy) * 180) / Math.PI;
  let canyonAxisDeg = (normalDeg + 90) % 180;
  if (canyonAxisDeg < 0) canyonAxisDeg += 180;

  const utmCenter = wgs84ToUtm30N(centerLon, centerLat);

  return {
    W_m,
    H_m,
    aspectRatio_HW,
    flowRegime,
    canyonOrientationDeg: Number(canyonAxisDeg.toFixed(1)),
    utmCenter,
  };
}
