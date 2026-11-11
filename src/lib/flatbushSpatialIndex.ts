import Flatbush from 'flatbush';
import { OFFICIAL_MALAGA_STREET_TREES, MalagaStreetTreeRecord } from './malagaTreesInventory';
import { OFFICIAL_MALAGA_TRAFFIC_INVENTORY, MalagaInventoryItem } from './malagaTrafficInventory';
import { MALAGA_STREET_CANYONS_GEOMETRY, StreetCanyonGeometryProfile } from './canyonGeometryOsm';

export interface SpatialSensorPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  no2Ugm3: number;
  pm25Ugm3: number;
}

export interface SpatialEntityWithCoords {
  lat: number;
  lon?: number;
  lng?: number;
}

/**
 * Árbol R espacial genérico ultrarrápido O(log N) basado en Flatbush
 */
export class UniversalSpatialRTree<T extends SpatialEntityWithCoords> {
  private index: Flatbush | null = null;
  private items: T[] = [];

  constructor(items: T[] = []) {
    if (items.length > 0) {
      this.buildIndex(items);
    }
  }

  public buildIndex(items: T[]) {
    this.items = items;
    if (items.length === 0) {
      this.index = null;
      return;
    }

    this.index = new Flatbush(items.length);
    for (const item of items) {
      const lng = item.lng ?? item.lon ?? 0;
      const lat = item.lat;
      this.index.add(lng, lat, lng, lat);
    }
    this.index.finish();
  }

  /**
   * Búsqueda por Bounding Box O(log N)
   */
  public searchBBox(minLng: number, minLat: number, maxLng: number, maxLat: number): T[] {
    if (!this.index) return [];
    const itemIndices = this.index.search(minLng, minLat, maxLng, maxLat);
    return itemIndices.map((i) => this.items[i]);
  }

  /**
   * Búsqueda de K Vecinos Más Cercanos (kNN) O(log N)
   */
  public searchKNN(queryLng: number, queryLat: number, k = 5): { item: T; distanceDeg: number }[] {
    if (!this.index || this.items.length === 0) return [];
    const actualK = Math.min(k, this.items.length);
    const itemIndices = this.index.neighbors(queryLng, queryLat, actualK);
    return itemIndices.map((i) => {
      const item = this.items[i];
      const lng = item.lng ?? item.lon ?? 0;
      const lat = item.lat;
      const dLat = lat - queryLat;
      const dLng = (lng - queryLng) * Math.cos((queryLat * Math.PI) / 180);
      const distDeg = Math.sqrt(dLat * dLat + dLng * dLng);
      return { item, distanceDeg: distDeg };
    });
  }

  /**
   * Obtiene el elemento más cercano de forma inmediata
   */
  public findNearest(queryLng: number, queryLat: number): T | null {
    const knn = this.searchKNN(queryLng, queryLat, 1);
    return knn.length > 0 ? knn[0].item : null;
  }
}

export class MalagaSpatialRTree {
  private index: Flatbush | null = null;
  private points: SpatialSensorPoint[] = [];

  constructor(points: SpatialSensorPoint[]) {
    this.buildIndex(points);
  }

  public buildIndex(points: SpatialSensorPoint[]) {
    this.points = points;
    if (points.length === 0) return;

    this.index = new Flatbush(points.length);
    for (const p of points) {
      this.index.add(p.lng, p.lat, p.lng, p.lat);
    }
    this.index.finish();
  }

  public searchBBox(minLng: number, minLat: number, maxLng: number, maxLat: number): SpatialSensorPoint[] {
    if (!this.index) return [];
    const itemIndices = this.index.search(minLng, minLat, maxLng, maxLat);
    return itemIndices.map((i) => this.points[i]);
  }

  public searchKNN(queryLng: number, queryLat: number, k = 5): SpatialSensorPoint[] {
    if (!this.index) return [];
    const itemIndices = this.index.neighbors(queryLng, queryLat, k);
    return itemIndices.map((i) => this.points[i]);
  }
}

// Pre-creación de Índices Espaciales Estáticos para Acceso Instantáneo O(log N)
export const treeSpatialIndex = new UniversalSpatialRTree<MalagaStreetTreeRecord>(OFFICIAL_MALAGA_STREET_TREES);
export const trafficSpatialIndex = new UniversalSpatialRTree<MalagaInventoryItem>(OFFICIAL_MALAGA_TRAFFIC_INVENTORY);
export const canyonSpatialIndex = new UniversalSpatialRTree<StreetCanyonGeometryProfile>(MALAGA_STREET_CANYONS_GEOMETRY);

/**
 * Consulta de cañón urbano OSM más cercano al punto activo (< 0.01 ms)
 */
export function getNearestStreetCanyonToPoint(lat: number, lon: number): StreetCanyonGeometryProfile | null {
  return canyonSpatialIndex.findNearest(lon, lat);
}

/**
 * Consulta de cañones urbanos dentro de un radio de influencia en metros (O(log N))
 */
export function getCanyonsInRadiusMeters(lat: number, lon: number, radiusM: number): StreetCanyonGeometryProfile[] {
  const degLat = radiusM / 111000.0;
  const degLon = radiusM / (111000.0 * Math.cos((lat * Math.PI) / 180));
  const candidates = canyonSpatialIndex.searchBBox(lon - degLon, lat - degLat, lon + degLon, lat + degLat);

  return candidates.filter(item => {
    const dLat = (item.lat - lat) * 111000.0;
    const dLon = ((item.lon ?? 0) - lon) * (111000.0 * Math.cos((lat * Math.PI) / 180));
    return Math.sqrt(dLat * dLat + dLon * dLon) <= radiusM;
  });
}

/**
 * Consulta de árbol urbano más cercano al punto activo (< 0.01 ms)
 */
export function getNearestTreeStreetToPoint(lat: number, lon: number): MalagaStreetTreeRecord | null {
  return treeSpatialIndex.findNearest(lon, lat);
}

/**
 * Consulta de alineaciones arbóreas dentro de un radio de influencia en metros (O(log N))
 */
export function getTreesInRadiusMeters(lat: number, lon: number, radiusM: number): MalagaStreetTreeRecord[] {
  // Conversión aproximada de metros a grados
  const degLat = radiusM / 111000.0;
  const degLon = radiusM / (111000.0 * Math.cos((lat * Math.PI) / 180));
  const candidates = treeSpatialIndex.searchBBox(lon - degLon, lat - degLat, lon + degLon, lat + degLat);

  return candidates.filter(item => {
    const dLat = (item.lat - lat) * 111000.0;
    const dLon = ((item.lon ?? 0) - lon) * (111000.0 * Math.cos((lat * Math.PI) / 180));
    return Math.sqrt(dLat * dLat + dLon * dLon) <= radiusM;
  });
}

/**
 * Consulta de elemento de tráfico más cercano al punto activo (< 0.01 ms)
 */
export function getNearestTrafficItemToPoint(lat: number, lon: number): MalagaInventoryItem | null {
  return trafficSpatialIndex.findNearest(lon, lat);
}
