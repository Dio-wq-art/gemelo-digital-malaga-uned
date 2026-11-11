import { Router } from "express";

const router = Router();

router.get(["/api/health", "/health"], (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/api/secrets/status", (req, res) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaqKey = process.env.OPENAQ_API_KEY || process.env.VITE_OPENAQ_API_KEY;
    const openweatherKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || process.env.VITE_OPENWEATHER_API_KEY;
    const earthEngineKey = process.env.EARTH_ENGINE_KEY || process.env.EARTH_ENGINE_SECRET || process.env.GEE_KEY;
    const copernicusUid = process.env.VITE_COPERNICUS_UID;
    const mapsKey = process.env.REACT_APP_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    const appUrl = process.env.APP_URL;

    const mask = (str?: string) => {
      if (!str) return null;
      const t = str.trim();
      if (t.length <= 6) return "***";
      return `${t.substring(0, 4)}...${t.substring(t.length - 3)}`;
    };

    res.json({
      timestamp: new Date().toISOString(),
      platform: "Gemelo Digital de Málaga (Cloud Run Runtime)",
      app_url: appUrl || "https://ais-dev-5samhewdfd74o4anr4ulgj-9718999215.europe-west2.run.app",
      secrets: [
        {
          id: "openaq",
          name: "OpenAQ v3 Platform (Estaciones Oficiales Junta de Andalucía)",
          configured: !!openaqKey,
          env_var: "OPENAQ_API_KEY",
          masked: mask(openaqKey),
          length: openaqKey?.length || 0,
          category: "Telemetría de Red Oficial (In Situ)",
          purpose: "Ingesta de datos horarios certificados de estaciones fijas (Carranque, Atabal, Juan XXIII, Campanillas)",
          status: openaqKey ? "Activo (Operacional)" : "No configurado"
        },
        {
          id: "openweather",
          name: "OpenWeatherMap Atmospheric & Air Pollution API",
          configured: !!openweatherKey,
          env_var: "OPENWEATHER_API_KEY",
          masked: mask(openweatherKey),
          length: openweatherKey?.length || 0,
          category: "Química Atmosférica y Meteorología en Vivo",
          purpose: "Columna química de contaminantes (NO, NO2, O3, SO2, PM2.5, PM10, NH3, CO) y condiciones termodinámicas",
          status: openweatherKey ? "Activo (Operacional)" : "No configurado"
        },
        {
          id: "gemini",
          name: "Google GenAI (Gemini 3.1 Pro / Gemini 3.8 Flash / Flash Lite)",
          configured: !!geminiKey,
          env_var: "GEMINI_API_KEY",
          masked: mask(geminiKey),
          length: geminiKey?.length || 0,
          category: "Inteligencia Artificial Científica",
          purpose: "Modelos multimodales para análisis doctoral profundo (Gemini 3.1 Pro STEM, 3.8 Flash y Flash Lite)",
          status: geminiKey ? "Activo (Operacional)" : "No configurado"
        },
        {
          id: "earth_engine",
          name: "Google Earth Engine (GEE)",
          configured: !!earthEngineKey,
          env_var: "EARTH_ENGINE_KEY",
          masked: mask(earthEngineKey),
          length: earthEngineKey?.length || 0,
          category: "Teledetección Satelital y Biofísica",
          purpose: "Temperatura superficial (LST), cobertura de suelo, reflectancia multiespectral e índice foliar (LAI)",
          status: earthEngineKey ? "Activo (Operacional)" : "No configurado"
        },
        {
          id: "copernicus",
          name: "Copernicus Data Space Ecosystem",
          configured: !!copernicusUid,
          env_var: "VITE_COPERNICUS_UID",
          masked: mask(copernicusUid),
          length: copernicusUid?.length || 0,
          category: "Datos Satelitales Europeos (Sentinel-5P / CAMS)",
          purpose: "Acceso al catálogo de perfiles troposféricos de NO2, aerosoles y reanálisis CAMS",
          status: copernicusUid ? "Activo (Operacional)" : "No configurado"
        },
        {
          id: "google_maps",
          name: "Google Maps Platform",
          configured: !!mapsKey,
          env_var: "REACT_APP_MAPS_API_KEY",
          masked: mask(mapsKey),
          length: mapsKey?.length || 0,
          category: "Cartografía e Infraestructura Espacial",
          purpose: "Soporte de capas cartográficas satelitales y geocodificación de coordenadas",
          status: mapsKey ? "Activo (Operacional)" : "No configurado"
        }
      ]
    });
  });

export default router;
