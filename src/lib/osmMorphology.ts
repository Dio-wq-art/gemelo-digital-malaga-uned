/**
 * Analizador de Morfología Urbana a partir de Topología Real OpenStreetMap (Overpass API)
 * Incorpora caché espacial acotada para evitar peticiones redundantes y saturación de Overpass.
 * Tesis Doctoral - Gemelo Digital de Málaga.
 */

import { BoundedCache } from './computationEngine';

export interface OsmMorphologyData {
  totalBuildingVol: number;
  totalRoadLength: number;
  buildingCount: number;
  averageHeight: number;
  svf: number;
  hwRatio: number;
}

const osmMorphologyCache = new BoundedCache<string, OsmMorphologyData>(150);

export async function fetchOSMMorphology(lat: number, lon: number): Promise<OsmMorphologyData | null> {
  // Cuantización de coordenadas a rejilla de ~30m para maximizar reuso de caché
  const quantizedKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
  const cached = osmMorphologyCache.get(quantizedKey);
  if (cached) {
    return cached;
  }

  // Bounding box approx 250m around the point for rapid querying
  const delta = 0.002; 
  const query = `[out:json][timeout:5];(way["building"](${lat - delta},${lon - delta},${lat + delta},${lon + delta});way["highway"](${lat - delta},${lon - delta},${lat + delta},${lon + delta}););out body;>;out skel qt;`;
  
  const endpoints = [
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
    `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`,
    `https://lz4.overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const osmJson = await response.json();
        if (osmJson && osmJson.elements && osmJson.elements.length > 0) {
          
          let totalBuildingVol = 0;
          let totalRoadLength = 0;
          let buildingCount = 0;
          let averageHeight = 0;
          let roadCount = 0;
          let avgRoadWidth = 0;

          osmJson.elements.forEach((el: any) => {
            if (el.type === 'way' && el.tags) {
              if (el.tags.building) {
                buildingCount++;
                const levels = el.tags['building:levels'] ? parseFloat(el.tags['building:levels']) : 3;
                const height = el.tags.height ? parseFloat(el.tags.height) : levels * 3.5;
                averageHeight += height;
                totalBuildingVol += height * 200; // proxy de volumen
              }
              if (el.tags.highway) {
                totalRoadLength += 150;
                roadCount++;
                const lanes = el.tags.lanes ? parseFloat(el.tags.lanes) : 2;
                avgRoadWidth += lanes * 3.5;
              }
            }
          });

          if (buildingCount > 0) averageHeight /= buildingCount;
          else averageHeight = 10;
          
          if (roadCount > 0) avgRoadWidth /= roadCount;
          else avgRoadWidth = 10;

          // Derivación determinista de H/W y SVF
          const hwRatio = averageHeight / Math.max(avgRoadWidth, 1);
          const svf = Math.cos(Math.atan(2 * hwRatio));

          const result: OsmMorphologyData = {
            totalBuildingVol,
            totalRoadLength,
            buildingCount,
            averageHeight,
            svf,
            hwRatio
          };

          osmMorphologyCache.set(quantizedKey, result);
          return result;
        }
      }
    } catch {
      // Intentar el siguiente endpoint Overpass
    }
  }
  return null;
}
