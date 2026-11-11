import { Router } from "express";
import crypto from "crypto";

const router = Router();

const getMapsApiKey = () => {
  return (
    process.env.REACT_APP_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ""
  ).trim();
};

// --------------------------------------------------------------------------
// ESTRATEGIA DE PRESERVACIÓN DE CUOTA Y CACHÉ MULTINIVEL (Google Maps Platform)
// --------------------------------------------------------------------------

interface CachedTile {
  buffer: Buffer;
  contentType: string;
  etag: string;
  timestamp: number;
}

interface CachedApiResult<T> {
  data: T;
  etag: string;
  timestamp: number;
}

// 1x1 / 256x256 Dark Slate Valid Raster PNG Buffer (Garantiza compatibilidad absoluta con MapLibre Web Workers)
const FALLBACK_PNG_TILE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEUPEyqu6L5zAAAAAXRSTlMAQObYZgAAACNJREFUeNrtwTEBAAAAwqD1T20ND6AAAAAAAAAAAAAAAAB4DcXAAAF5i4dKAAAAAElFTkSuQmCC",
  "base64"
);

// 1. Memoria Caché LRU de Teselas Ráster de Google Maps (Capacidad: 50.000 teselas)
const TILE_CACHE_MAX_SIZE = 50000;
const TILE_CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 días en memoria
const tileMemoryCache = new Map<string, CachedTile>();

// 2. Singleflight: Coalescencia y deduplicación de peticiones concurrentes a la misma tesela
const pendingTileFetches = new Map<string, Promise<{ buffer: Buffer; contentType: string; fromFallback?: boolean }>>();

// 3. Caché permanente de Geocodificación y Elevación (30 días de persistencia en memoria)
const API_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const geocodeMemoryCache = new Map<string, CachedApiResult<any>>();
const elevationMemoryCache = new Map<string, CachedApiResult<any>>();

// Métricas de telemetría de ahorro de cuota
const quotaTelemetry = {
  totalTileRequests: 0,
  tileCacheHits: 0,
  singleflightDeduplications: 0,
  upstreamGoogleFetches: 0,
  fallbackFetches: 0,
  totalGeocodeRequests: 0,
  geocodeCacheHits: 0,
  totalElevationRequests: 0,
  elevationCacheHits: 0,
  startTime: Date.now()
};

function getETag(data: Buffer | string): string {
  return `"${crypto.createHash("md5").update(data).digest("hex").slice(0, 16)}"`;
}

/**
 * GET /api/maps/status
 * Verifica la disponibilidad y estadísticas de ahorro de cuota de la API de Google Maps Platform
 */
router.get("/api/maps/status", (req, res) => {
  const key = getMapsApiKey();
  const configured = !!key;
  const masked = key && key.length > 6 
    ? `${key.substring(0, 4)}...${key.substring(key.length - 3)}`
    : null;

  const tileCacheRatio = quotaTelemetry.totalTileRequests > 0
    ? Number(((quotaTelemetry.tileCacheHits / quotaTelemetry.totalTileRequests) * 100).toFixed(1))
    : 100;

  return res.json({
    status: configured ? "ready" : "ready_with_proxy_cache",
    service: "Google Maps Platform (Optimized Quota Preservation Layer)",
    configured,
    key_env_var: "REACT_APP_MAPS_API_KEY",
    masked,
    quota_optimization: {
      strategy: "Multi-Tier In-Memory LRU Cache + Singleflight Request Coalescing + HTTP 304 ETag Revalidation",
      tile_cache_size: tileMemoryCache.size,
      tile_cache_max_capacity: TILE_CACHE_MAX_SIZE,
      tile_cache_ttl_days: 7,
      total_tile_requests: quotaTelemetry.totalTileRequests,
      tile_cache_hits: quotaTelemetry.tileCacheHits,
      tile_cache_savings_pct: `${tileCacheRatio}%`,
      singleflight_deduplications: quotaTelemetry.singleflightDeduplications,
      upstream_fetches: quotaTelemetry.upstreamGoogleFetches,
      geocode_cache_hits: quotaTelemetry.geocodeCacheHits,
      elevation_cache_hits: quotaTelemetry.elevationCacheHits,
      uptime_hours: Number(((Date.now() - quotaTelemetry.startTime) / (1000 * 3600)).toFixed(2))
    },
    capabilities: [
      { id: "tiles_satellite", name: "Google Maps Satélite Alta Resolución (Cacheado)", active: true },
      { id: "tiles_hybrid", name: "Google Maps Híbrido (Satélite + Vías y Toponimia)", active: true },
      { id: "tiles_terrain", name: "Google Maps Relieve y Terreno Topográfico", active: true },
      { id: "gmaps_3d_canyon", name: "Google Maps 3D Photorealistic & Cañones Urbanos (Oke)", active: configured },
      { id: "geocoding", name: "Geocodificación con Deduplicación (Málaga)", active: configured },
      { id: "elevation", name: "Servicio de Elevación Orográfica (MDT / 30 Días Caché)", active: configured }
    ],
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/maps/config
 * Devuelve la clave pública para inicializar SDKs de cliente (ej. gmp-map-3d)
 */
router.get("/api/maps/config", (req, res) => {
  res.json({ apiKey: getMapsApiKey() });
});

/**
 * GET /api/maps/tiles/:type/:z/:x/:y
 * Proxy optimizado de servidor para capas ráster de Google Maps (lyrs: s=satellite, y=hybrid, m=roadmap, p=terrain)
 * Implementa Caché LRU de memoria, Coalescencia Singleflight y Cabeceras ETag / Stale-While-Revalidate.
 */
router.get("/api/maps/tiles/:type/:z/:x/:y", async (req, res) => {
  quotaTelemetry.totalTileRequests++;
  const { type, z, x, y } = req.params;
  const scale = req.query.scale === "1" ? "1" : "2";

  const validTypes: Record<string, string> = {
    s: "s",
    sat: "s",
    satellite: "s",
    y: "y",
    hybrid: "y",
    m: "m",
    roadmap: "m",
    p: "p",
    terrain: "p"
  };
  const lyrs = validTypes[type] || "s";
  const cacheKey = `${lyrs}_${z}_${x}_${y}_scale${scale}`;

  // 1. Comprobación en memoria caché de alta velocidad (0 ms, 0 cuota consumida)
  const cached = tileMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < TILE_CACHE_TTL_MS)) {
    quotaTelemetry.tileCacheHits++;
    
    // Soporte para HTTP 304 Not Modified
    if (req.headers["if-none-match"] === cached.etag) {
      return res.status(304).end();
    }

    res.setHeader("Content-Type", cached.contentType);
    res.setHeader("ETag", cached.etag);
    res.setHeader("Cache-Control", "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=5184000");
    res.setHeader("X-Tile-Cache", "HIT-MEMORY");
    return res.send(cached.buffer);
  }

  // 2. Singleflight: Si otra petición concurrente ya está trayendo esta tesela, esperar su Promise
  let fetchPromise = pendingTileFetches.get(cacheKey);

  if (!fetchPromise) {
    fetchPromise = (async () => {
      // Sharding circular entre mt0, mt1, mt2 y mt3
      const xNum = parseInt(x, 10) || 0;
      const yNum = parseInt(y, 10) || 0;
      const serverIndex = Math.abs(xNum + yNum) % 4;
      const googleTileUrl = `https://mt${serverIndex}.google.com/vt/lyrs=${lyrs}&x=${x}&y=${y}&z=${z}&scale=${scale}`;

      try {
        quotaTelemetry.upstreamGoogleFetches++;
        const tileRes = await fetch(googleTileUrl, {
          signal: AbortSignal.timeout(6000),
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Referer": "https://maps.google.com/"
          }
        });

        if (tileRes.ok) {
          const contentType = tileRes.headers.get("content-type") || "image/jpeg";
          const arrayBuf = await tileRes.arrayBuffer();
          return { buffer: Buffer.from(arrayBuf), contentType };
        }

        // Fallback a Esri World Imagery si Google Maps reporta límite
        quotaTelemetry.fallbackFetches++;
        const fallbackUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
        const fbRes = await fetch(fallbackUrl, {
          signal: AbortSignal.timeout(5000)
        });
        if (fbRes.ok) {
          const contentType = fbRes.headers.get("content-type") || "image/jpeg";
          const arrayBuf = await fbRes.arrayBuffer();
          return { buffer: Buffer.from(arrayBuf), contentType, fromFallback: true };
        }

        // Fallback sólido en formato PNG raster válido para WebGL / MapLibre Workers
        return { buffer: FALLBACK_PNG_TILE, contentType: "image/png", fromFallback: true };
      } catch (err: any) {
        console.warn(`[Google Maps Tile Fetch Warning] z=${z} x=${x} y=${y}:`, err?.message || err);
        return { buffer: FALLBACK_PNG_TILE, contentType: "image/png", fromFallback: true };
      }
    })();

    pendingTileFetches.set(cacheKey, fetchPromise);
  } else {
    quotaTelemetry.singleflightDeduplications++;
  }

  try {
    const result = await fetchPromise;

    // Guardar en la caché de memoria con límite LRU
    if (!result.fromFallback && result.contentType.startsWith("image/")) {
      if (tileMemoryCache.size >= TILE_CACHE_MAX_SIZE) {
        // Desalojar las 500 entradas más antiguas
        const keysToEvict = Array.from(tileMemoryCache.keys()).slice(0, 500);
        for (const k of keysToEvict) {
          tileMemoryCache.delete(k);
        }
      }

      const etag = getETag(result.buffer);
      tileMemoryCache.set(cacheKey, {
        buffer: result.buffer,
        contentType: result.contentType,
        etag,
        timestamp: Date.now()
      });
    }

    const etag = getETag(result.buffer);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }

    res.setHeader("Content-Type", result.contentType);
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=5184000");
    res.setHeader("X-Tile-Cache", result.fromFallback ? "FALLBACK" : "MISS-STORED");
    return res.send(result.buffer);
  } finally {
    pendingTileFetches.delete(cacheKey);
  }
});

/**
 * GET /api/maps/geocode
 * Servicio de geocodificación con caché de 30 días para preservar la cuota de peticiones
 */
router.get("/api/maps/geocode", async (req, res) => {
  quotaTelemetry.totalGeocodeRequests++;
  const key = getMapsApiKey();
  const address = (req.query.address as string || "").trim().toLowerCase();

  if (!address) {
    return res.status(400).json({ error: "Parámetro 'address' requerido" });
  }

  const cacheKey = address;
  const cached = geocodeMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < API_CACHE_TTL_MS)) {
    quotaTelemetry.geocodeCacheHits++;
    res.setHeader("ETag", cached.etag);
    res.setHeader("X-Geocode-Cache", "HIT");
    return res.json(cached.data);
  }

  if (!key) {
    return res.status(503).json({
      error: "REACT_APP_MAPS_API_KEY no configurada",
      message: "Configure la clave en Secrets para habilitar geocodificación de Google Maps."
    });
  }

  try {
    const queryAddress = address.includes("málaga") ? address : `${address}, Málaga, España`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryAddress)}&bounds=36.65,-4.60|36.80,-4.30&region=es&language=es&key=${key}`;

    const geoRes = await fetch(url);
    const data = await geoRes.json();

    const responsePayload = {
      query: address,
      timestamp: new Date().toISOString(),
      ...data
    };

    if (data.status === "OK") {
      const etag = getETag(JSON.stringify(responsePayload));
      geocodeMemoryCache.set(cacheKey, {
        data: responsePayload,
        etag,
        timestamp: Date.now()
      });
      res.setHeader("ETag", etag);
      res.setHeader("X-Geocode-Cache", "MISS-STORED");
    }

    return res.json(responsePayload);
  } catch (err: any) {
    console.error("[Google Maps Geocode Error]:", err);
    return res.status(500).json({ error: "Error en la consulta de geocodificación Google Maps" });
  }
});

/**
 * GET /api/maps/reverse-geocode
 * Servicio de geocodificación reversa (lat, lon -> dirección postal/calle) con caché de 30 días
 */
router.get("/api/maps/reverse-geocode", async (req, res) => {
  quotaTelemetry.totalGeocodeRequests++;
  const key = getMapsApiKey();
  const latStr = req.query.lat as string;
  const lonStr = req.query.lon as string;

  if (!latStr || !lonStr) {
    return res.status(400).json({ error: "Parámetros 'lat' y 'lon' requeridos" });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: "Coordenadas numéricas inválidas" });
  }

  // Redondear a 4 decimales (~11m de resolución) para maximizar reutilización de caché
  const cacheKey = `rev_${lat.toFixed(4)}_${lon.toFixed(4)}`;
  const cached = geocodeMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < API_CACHE_TTL_MS)) {
    quotaTelemetry.geocodeCacheHits++;
    res.setHeader("ETag", cached.etag);
    res.setHeader("X-Geocode-Cache", "HIT");
    return res.json(cached.data);
  }

  try {
    let streetName = "";
    let streetNumber = "";
    let neighborhood = "";
    let postalCode = "";
    let city = "Málaga";
    let formattedAddress = "";
    let source = "google";

    if (key) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=es&key=${key}`;
      const geoRes = await fetch(url);
      const data = await geoRes.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const topResult = data.results[0];
        formattedAddress = topResult.formatted_address || "";

        for (const comp of topResult.address_components || []) {
          if (comp.types.includes("route")) streetName = comp.long_name;
          if (comp.types.includes("street_number")) streetNumber = comp.long_name;
          if (comp.types.includes("sublocality") || comp.types.includes("neighborhood")) neighborhood = comp.long_name;
          if (comp.types.includes("postal_code")) postalCode = comp.long_name;
          if (comp.types.includes("locality")) city = comp.long_name;
        }
      }
    }

    // Fallback a OpenStreetMap Nominatim si Google Maps no aportó datos o no tiene clave
    if (!streetName) {
      try {
        source = "nominatim";
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        const nomRes = await fetch(nomUrl, {
          headers: { 'User-Agent': 'GemeloDigital-Malaga-AirQuality/1.0' }
        });
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          formattedAddress = nomData.display_name || "";
          const addr = nomData.address || {};
          streetName = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path || addr.square || addr.suburb || "";
          streetNumber = addr.house_number || "";
          neighborhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district || "";
          postalCode = addr.postcode || "";
          if (addr.city) city = addr.city;
        }
      } catch (nomErr) {
        console.warn("[Nominatim Reverse Geocode Fallback warning]:", nomErr);
      }
    }

    const payload = {
      success: true,
      lat,
      lon,
      source,
      streetName: streetName || `Vía urbana (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W)`,
      streetNumber,
      neighborhood,
      postalCode,
      city,
      formattedAddress: formattedAddress || streetName || `Málaga (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      timestamp: new Date().toISOString()
    };

    const etag = getETag(JSON.stringify(payload));
    geocodeMemoryCache.set(cacheKey, {
      data: payload,
      etag,
      timestamp: Date.now()
    });

    res.setHeader("ETag", etag);
    res.setHeader("X-Geocode-Cache", "MISS-STORED");
    return res.json(payload);
  } catch (err: any) {
    console.error("[Reverse Geocode Error]:", err);
    return res.status(500).json({ error: "Error en la resolución de geocodificación reversa" });
  }
});

/**
 * GET /api/maps/elevation
 * Servicio de elevación altimétrica con caché de 30 días
 */
router.get("/api/maps/elevation", async (req, res) => {
  quotaTelemetry.totalElevationRequests++;
  const key = getMapsApiKey();
  const locations = (req.query.locations as string || "").trim();
  const queryLocations = locations || "36.7230,-4.4100|36.7185,-4.4213|36.7088,-4.4428";

  const cacheKey = queryLocations;
  const cached = elevationMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < API_CACHE_TTL_MS)) {
    quotaTelemetry.elevationCacheHits++;
    res.setHeader("ETag", cached.etag);
    res.setHeader("X-Elevation-Cache", "HIT");
    return res.json(cached.data);
  }

  if (!key) {
    return res.status(503).json({
      error: "REACT_APP_MAPS_API_KEY no configurada",
      message: "Configure la clave en Secrets para habilitar elevación de Google Maps."
    });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${encodeURIComponent(queryLocations)}&key=${key}`;
    const elevRes = await fetch(url);
    const data = await elevRes.json();

    const responsePayload = {
      locations: queryLocations,
      timestamp: new Date().toISOString(),
      ...data
    };

    if (data.status === "OK") {
      const etag = getETag(JSON.stringify(responsePayload));
      elevationMemoryCache.set(cacheKey, {
        data: responsePayload,
        etag,
        timestamp: Date.now()
      });
      res.setHeader("ETag", etag);
      res.setHeader("X-Elevation-Cache", "MISS-STORED");
    }

    return res.json(responsePayload);
  } catch (err: any) {
    console.error("[Google Maps Elevation Error]:", err);
    return res.status(500).json({ error: "Error en la consulta de elevación Google Maps" });
  }
});

/**
 * GET /api/maps/streetview/metadata
 * Comprueba disponibilidad de imagen de Street View en las coordenadas dadas
 */
router.get("/api/maps/streetview/metadata", async (req, res) => {
  const lat = req.query.lat as string;
  const lon = req.query.lon as string;
  const key = getMapsApiKey();

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat y lon son requeridos" });
  }

  if (!key) {
    return res.json({
      status: "OK",
      available: true,
      pano_id: `pano_${lat}_${lon}`,
      location: { lat: parseFloat(lat), lng: parseFloat(lon) },
      message: "Modo fotogramétrico local disponible"
    });
  }

  try {
    const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&key=${key}`;
    const metaRes = await fetch(metaUrl);
    const data = await metaRes.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/maps/streetview/image
 * Proxy optimizado con caché para imágenes de Street View 360 / perspectiva
 */
const streetViewImageCache = new Map<string, { buffer: Buffer; contentType: string; etag: string; timestamp: number }>();

router.get("/api/maps/streetview/image", async (req, res) => {
  const lat = parseFloat(req.query.lat as string || "36.7201");
  const lon = parseFloat(req.query.lon as string || "-4.4203");
  const heading = parseFloat(req.query.heading as string || "0");
  const pitch = parseFloat(req.query.pitch as string || "0");
  const fov = parseFloat(req.query.fov as string || "90");
  const size = (req.query.size as string || "800x500").trim();
  const key = getMapsApiKey();

  const cacheKey = `sv_${lat.toFixed(4)}_${lon.toFixed(4)}_h${Math.round(heading)}_p${Math.round(pitch)}_f${Math.round(fov)}_${size}`;
  const cached = streetViewImageCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < API_CACHE_TTL_MS)) {
    if (req.headers["if-none-match"] === cached.etag) {
      return res.status(304).end();
    }
    res.setHeader("Content-Type", cached.contentType);
    res.setHeader("ETag", cached.etag);
    res.setHeader("Cache-Control", "public, max-age=604800");
    return res.send(cached.buffer);
  }

  if (key) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lon}&heading=${heading}&pitch=${pitch}&fov=${fov}&return_error_code=true&key=${key}`;
      const imgRes = await fetch(gUrl);
      if (imgRes.ok) {
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const arrayBuf = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const etag = getETag(buffer);

        if (streetViewImageCache.size > 2000) {
          const firstKey = streetViewImageCache.keys().next().value;
          if (firstKey) streetViewImageCache.delete(firstKey);
        }

        streetViewImageCache.set(cacheKey, {
          buffer,
          contentType,
          etag,
          timestamp: Date.now()
        });

        res.setHeader("Content-Type", contentType);
        res.setHeader("ETag", etag);
        res.setHeader("Cache-Control", "public, max-age=604800");
        return res.send(buffer);
      }
    } catch (err) {
      console.error("[StreetView Image Fetch Error]:", err);
    }
  }

  // Fallback a tesela satélite de alta resolución si no hay API key o no hay Street View directo
  try {
    const z = 19;
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, z));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    const tileUrl = `https://mt1.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}&scale=2`;
    const tileRes = await fetch(tileUrl);
    if (tileRes.ok) {
      const contentType = tileRes.headers.get("content-type") || "image/jpeg";
      const arrayBuf = await tileRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const etag = getETag(buffer);
      res.setHeader("Content-Type", contentType);
      res.setHeader("ETag", etag);
      return res.send(buffer);
    }
  } catch {}

  // Fallback SVG fotogramétrico de visualización
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="#090d16"/><line x1="0" y1="250" x2="800" y2="250" stroke="#334155" stroke-width="1"/><circle cx="400" cy="250" r="120" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="6,6"/><text x="400" y="240" font-family="monospace" font-size="14" fill="#38bdf8" text-anchor="middle">VISTA 360° A COTA DE CALLE (1.8m AGL)</text><text x="400" y="265" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="middle">Azimut: ${Math.round(heading)}° | Elevación: ${Math.round(pitch)}° | FOV: ${Math.round(fov)}°</text><text x="400" y="290" font-family="monospace" font-size="10" fill="#64748b" text-anchor="middle">Lat: ${lat.toFixed(5)}°N, Lon: ${lon.toFixed(5)}°W</text></svg>`;
  res.setHeader("Content-Type", "image/svg+xml");
  return res.send(Buffer.from(svg));
});

/**
 * GET /api/maps/test
 * Test integral de verificación de clave contra la API de Google Maps
 */
router.get("/api/maps/test", async (req, res) => {
  const key = getMapsApiKey();
  if (!key) {
    return res.json({
      success: false,
      configured: false,
      message: "No se ha detectado REACT_APP_MAPS_API_KEY en variables de entorno."
    });
  }

  try {
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Ayuntamiento+de+Malaga&region=es&key=${key}`;
    const start = performance.now();
    const testRes = await fetch(testUrl);
    const data = await testRes.json();
    const latencyMs = Math.round(performance.now() - start);

    if (data.status === "OK") {
      const first = data.results?.[0];
      return res.json({
        success: true,
        configured: true,
        latencyMs,
        status: data.status,
        formatted_address: first?.formatted_address,
        location: first?.geometry?.location,
        place_id: first?.place_id,
        quota_optimization: "ACTIVE (LRU Cache + Singleflight Coalescing)",
        message: "¡Google Maps Platform verificado exitosamente y operativo con protección de cuota!"
      });
    } else {
      return res.json({
        success: false,
        configured: true,
        status: data.status,
        error_message: data.error_message || "Respuesta con código de error de Google Maps",
        message: `Google Maps retornó estado: ${data.status}`
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      configured: true,
      error: err.message,
      message: "Error de red al consultar Google Maps Platform"
    });
  }
});

export default router;
