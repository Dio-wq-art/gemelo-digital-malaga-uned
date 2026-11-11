import { generateTrafficNOxGeoJson, getDiurnalTrafficFactor } from "../lib/trafficEmission";

self.onmessage = async (e: MessageEvent) => {
  const { geojson, lat, lon } = e.data || {};
  if (!geojson) return;
  try {
    const temporalFactor = getDiurnalTrafficFactor().factor;
    const trafficResult = generateTrafficNOxGeoJson(geojson, lat, lon, temporalFactor);
    self.postMessage({ type: "success", trafficResult });
  } catch (err) {
    self.postMessage({ type: "error", error: String(err) });
  }
};
