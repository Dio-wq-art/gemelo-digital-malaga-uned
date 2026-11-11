/**
 * Motor de Asimilación de Telemetría (Digital Twin Core).
 * Extrae datos reales de Open-Meteo para Málaga.
 */

export interface LiveTelemetry {
  tempC: number;
  rhPct: number;
  cloudCoverPct: number;
  pressureHpa: number;
  windSpeedMs: number;
  timestamp: string;
  isLive: boolean;
}

export async function fetchMalagaTelemetry(): Promise<LiveTelemetry> {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=36.7202&longitude=-4.4203&current=temperature_2m,relative_humidity_2m,cloud_cover,surface_pressure,wind_speed_10m&timezone=auto";
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API falló");
    const data = await res.json();
    
    return {
      tempC: data.current.temperature_2m,
      rhPct: data.current.relative_humidity_2m,
      cloudCoverPct: data.current.cloud_cover,
      pressureHpa: data.current.surface_pressure,
      windSpeedMs: data.current.wind_speed_10m ? data.current.wind_speed_10m / 3.6 : 3.0, // m/s
      timestamp: new Date().toISOString(),
      isLive: true
    };
  } catch (error) {
    console.error("Error asimilando telemetría:", error);
    // Fallback a un valor determinista baseline si la API falla (no aleatorio)
    return {
      tempC: 22.5,
      rhPct: 65,
      cloudCoverPct: 0,
      pressureHpa: 1013,
      windSpeedMs: 3.0,
      timestamp: new Date().toISOString(),
      isLive: false
    };
  }
}
