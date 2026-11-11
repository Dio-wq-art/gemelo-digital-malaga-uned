import { latLngToCell, cellToBoundary, cellToChildren, gridDisk } from 'h3-js';

export interface H3HexCell {
  h3Index: string;
  lat: number;
  lng: number;
  boundary: [number, number][]; // [lat, lng]
  no2AvgUgm3: number;
  pm25AvgUgm3: number;
  uhiAnomC: number;
  dryDepRate: number;
}

// In-memory cache for generated grids to avoid re-computation
const h3GridCache = new Map<string, H3HexCell[]>();

/**
 * Genera una malla hexagonal H3 sobre el área metropolitana y centro histórico de Málaga
 * @param centerLat Latitud central (def: 36.7196)
 * @param centerLng Longitud central (def: -4.4200)
 * @param resolution Resolución H3 (8 = ~460m, 9 = ~170m, 10 = ~65m, 11 = ~25m)
 * @param kRingRadius Radio de anillos hexagonales (def: 5)
 */
export function generateMalagaH3HexGrid(
  centerLat = 36.7196,
  centerLng = -4.4200,
  resolution = 10,
  kRingRadius = 6,
  baseNo2 = 28.5,
  basePm25 = 14.2
): H3HexCell[] {
  const cacheKey = `${centerLat.toFixed(4)}_${centerLng.toFixed(4)}_${resolution}_${kRingRadius}_${baseNo2.toFixed(1)}_${basePm25.toFixed(1)}`;
  if (h3GridCache.has(cacheKey)) {
    return h3GridCache.get(cacheKey)!;
  }

  try {
    const originCell = latLngToCell(centerLat, centerLng, resolution);
    const hexIndices = gridDisk(originCell, kRingRadius);

    const result: H3HexCell[] = hexIndices.map((h3Index, idx) => {
      const boundary = cellToBoundary(h3Index); // Array of [lat, lng]
      
      // Calculate centroid accurately
      const latSum = boundary.reduce((acc, pt) => acc + pt[0], 0);
      const lngSum = boundary.reduce((acc, pt) => acc + pt[1], 0);
      const lat = latSum / boundary.length;
      const lng = lngSum / boundary.length;

      // Deterministic spatial variation based on distance to coast/center
      const distFromCenter = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
      const spatialFactor = Math.sin(idx * 0.47) * 0.25 + 1.0;

      const no2AvgUgm3 = Math.max(5.0, (baseNo2 * spatialFactor - distFromCenter * 120));
      const pm25AvgUgm3 = Math.max(3.0, (basePm25 * spatialFactor - distFromCenter * 60));
      const uhiAnomC = Math.max(0.2, (1.8 * spatialFactor - distFromCenter * 20));
      const dryDepRate = parseFloat((0.015 * spatialFactor).toFixed(4));

      return {
        h3Index,
        lat,
        lng,
        boundary,
        no2AvgUgm3: parseFloat(no2AvgUgm3.toFixed(2)),
        pm25AvgUgm3: parseFloat(pm25AvgUgm3.toFixed(2)),
        uhiAnomC: parseFloat(uhiAnomC.toFixed(2)),
        dryDepRate
      };
    });

    h3GridCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('Error generando malla H3:', err);
    return [];
  }
}
