import {
  generateAODDispersionGeoJson,
  generateWindVectorGeoJson,
  generateContinuousD3ContourGeoJson
} from "../lib/physics";

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data || {};
  if (type === "GENERATE_AOD_WIND" && payload) {
    try {
      const aodGeo = generateAODDispersionGeoJson(
        payload.lat,
        payload.lon,
        payload.aod,
        payload.windDir,
        payload.windSpeed,
        payload.rh,
        payload.dust,
        payload.scientificPalette
      );

      const windVectorGeo = generateWindVectorGeoJson(
        payload.lat,
        payload.lon,
        payload.windDir,
        payload.windSpeed
      );

      const d3ContourGeo = generateContinuousD3ContourGeoJson(
        payload.lat,
        payload.lon,
        payload.no2,
        payload.windDir,
        payload.windSpeed,
        payload.scientificPalette
      );

      self.postMessage({ type: "SUCCESS_AOD_WIND", aodGeo, windVectorGeo, d3ContourGeo });
    } catch (err) {
      self.postMessage({ type: "ERROR_AOD_WIND", error: String(err) });
    }
  }
};
