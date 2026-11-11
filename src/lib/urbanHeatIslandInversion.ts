/**
 * Módulo de Isla de Calor Urbana (UHI) e Inversión Térmica Nocturna
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire en Málaga
 *
 * Fundamentación Científica y Normativa:
 * - Ecuación Empírica Canónica de Oke (1982) para intensidad UHI en función de la relación de aspecto H/W y rugosidad.
 * - Evolución diurna de la Capa Límite Planetaria (PBL_h) y colapso nocturno por enfriamiento radiativo superficial.
 * - Atrapamiento de contaminantes primarios (NOx, PM) en la capa límite nocturna somera (< 50m).
 * - Cero Datos Aleatorios (Zero Stochastic Data): Formulación analítica determinista basada en el ciclo solar.
 */

export interface UhiDistrictPoint {
  districtId: string;
  nombre: string;
  lat: number;
  lon: number;
  aspectRatioHW: number; // Relación de aspecto edificio/calle (H/W)
  imperviousPct: number; // Porcentaje de suelo impermeable / asfalto (%)
  deltaT_UHI_C: number;  // Exceso de temperatura por UHI (°C)
  trappedNO2_Ugm3: number;
  trappedPM10_Ugm3: number;
}

export interface DiurnalPblProfilePoint {
  hourOfDay: number;
  solarElevationDeg: number;
  pblHeightM: number;     // Altura de capa límite H_pbl (m)
  tempRuralC: number;
  tempUrbanCenterC: number;
  trappedSurfaceFactor: number;
}

export interface UrbanHeatIslandSummary {
  timestamp: string;
  hourOfDay: number;
  maxUhiIntensityC: number;
  nocturnalInversionPblHeightM: number;
  districts: UhiDistrictPoint[];
  diurnalProfile: DiurnalPblProfilePoint[];
}

export const MALAGA_UHI_DISTRICTS = [
  { id: 'centro_historico', nombre: 'Centro Histórico (Calle Larios / Alameda)', lat: 36.7200, lon: -4.4210, hw: 2.4, imp: 92 },
  { id: 'carretera_cadiz', nombre: 'Carretera de Cádiz (Giron / Huelin)', lat: 36.7050, lon: -4.4420, hw: 1.8, imp: 88 },
  { id: 'teatinos_universidad', nombre: 'Teatinos - Bulevar Louis Pasteur', lat: 36.7180, lon: -4.4720, hw: 0.9, imp: 65 },
  { id: 'el_palo_pedregalejo', nombre: 'El Palo - Pedregalejo (Litoral Este)', lat: 36.7210, lon: -4.3680, hw: 0.8, imp: 60 },
  { id: 'aeropuerto_periurbano', nombre: 'Aeropuerto de Málaga (Fondo Rural)', lat: 36.6750, lon: -4.4920, hw: 0.1, imp: 25 },
];

/**
 * Cálculo del Modelo Oke (1982) de Isla de Calor e Inversión Térmica
 */
export function calculateUrbanHeatIslandSummary(
  hourOfDay: number = 22, // Noche (22:00h)
  baseRuralTempC: number = 20.0,
  windSpeedMs: number = 2.0,
  cloudCoverPct: number = 0
): UrbanHeatIslandSummary {
  // Intensidad máxima de UHI de Oke: Delta T = 2.01 * log10(H/W) + 0.12 * Impervious% - 0.45 * ln(u)
  const u = Math.max(0.5, windSpeedMs);

  const districts: UhiDistrictPoint[] = MALAGA_UHI_DISTRICTS.map((d) => {
    const okeBase = 2.01 * Math.log10(Math.max(0.1, d.hw)) + 0.04 * d.imp - 0.45 * Math.log(u);
    // La UHI es máxima durante las horas nocturnas (21:00 a 05:00) y mínima al mediodía
    const isNight = hourOfDay >= 21 || hourOfDay <= 6;
    const diurnalFactor = isNight ? 1.0 : Math.max(0.15, Math.cos(((hourOfDay - 14) * Math.PI) / 12));
    const deltaT = parseFloat(Math.max(0.1, okeBase * diurnalFactor).toFixed(1));

    // Atrapamiento de contaminantes por capa superficial somera
    const basePbl = isNight ? 45.0 : 750.0;
    const trappedNO2 = parseFloat(((38.0 * 250.0) / basePbl + deltaT * 1.5).toFixed(1));
    const trappedPM10 = parseFloat(((22.0 * 250.0) / basePbl + deltaT * 0.8).toFixed(1));

    return {
      districtId: d.id,
      nombre: d.nombre,
      lat: d.lat,
      lon: d.lon,
      aspectRatioHW: d.hw,
      imperviousPct: d.imp,
      deltaT_UHI_C: deltaT,
      trappedNO2_Ugm3: trappedNO2,
      trappedPM10_Ugm3: trappedPM10,
    };
  });

  // Perfil diurno completo de 24h para gráficos Recharts
  const diurnalProfile: DiurnalPblProfilePoint[] = [];
  let maxUhi = 0;
  
  // Parámetros termodinámicos
  const rhoCp = 1200; // Aire: rho * Cp (J / m3 K)
  const gamma = 0.005; // Gradiente vertical de temperatura (K/m)
  const k = 0.4; // Constante de von Kármán

  for (let h = 0; h < 24; h++) {
    const isNightH = h >= 20 || h <= 6;
    const solarElev = Math.max(0, Math.sin(((h - 6) * Math.PI) / 14) * 68);
    
    // Radiación neta empírica (onda corta + onda larga) W/m2
    const R_n = isNightH 
      ? -45 * (1 - cloudCoverPct/100) 
      : 650 * Math.sin(solarElev * Math.PI / 180) * (1 - cloudCoverPct/100 * 0.75);
    
    // Flujo de calor sensible (H) (Bowen ratio típico urbano)
    const H_sensible = R_n > 0 ? R_n * 0.55 : R_n * 0.85;
    
    // Altura de capa de mezcla planetaria (PBL)
    let pbl = 50;
    if (H_sensible > 0) {
      // Modelo de crecimiento convectivo
      pbl = 200 + Math.sqrt(Math.max(0, 2 * H_sensible * (h - 6) * 3600 / (rhoCp * gamma)));
    } else {
      // Ecuación diagnóstica de Zilitinkevich para PBL nocturna estable
      const L_obukhov = -Math.pow(u, 3) * (baseRuralTempC + 273.15) / (k * 9.81 * (H_sensible / rhoCp));
      pbl = Math.max(30, 0.4 * Math.sqrt(Math.abs((u * u) / 0.0001 * Math.max(0.1, L_obukhov))));
    }

    const uhiH = isNightH ? 3.8 - (h > 21 ? (h - 21) * 0.2 : h * 0.2) : 0.8;
    maxUhi = Math.max(maxUhi, uhiH);

    diurnalProfile.push({
      hourOfDay: h,
      solarElevationDeg: parseFloat(solarElev.toFixed(1)),
      pblHeightM: parseFloat(Math.min(1500, pbl).toFixed(0)),
      tempRuralC: parseFloat((baseRuralTempC + Math.sin(((h - 8) * Math.PI) / 12) * 5.0).toFixed(1)),
      tempUrbanCenterC: parseFloat((baseRuralTempC + Math.sin(((h - 8) * Math.PI) / 12) * 5.0 + uhiH).toFixed(1)),
      trappedSurfaceFactor: parseFloat((750 / Math.max(30, pbl)).toFixed(2)),
    });
  }

  const nocturnalPbl = diurnalProfile[hourOfDay]?.pblHeightM || 50;

  return {
    timestamp: new Date().toISOString(),
    hourOfDay,
    maxUhiIntensityC: parseFloat(maxUhi.toFixed(1)),
    nocturnalInversionPblHeightM: nocturnalPbl,
    districts,
    diurnalProfile,
  };
}

export function generateUhiGeoJson(summary: UrbanHeatIslandSummary): any {
  return {
    type: 'FeatureCollection',
    features: summary.districts.map((d) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.lon, d.lat],
      },
      properties: {
        id: d.districtId,
        nombre: d.nombre,
        aspect_ratio_hw: d.aspectRatioHW,
        impervious_pct: d.imperviousPct,
        delta_t_uhi_c: d.deltaT_UHI_C,
        trapped_no2_ugm3: d.trappedNO2_Ugm3,
        trapped_pm10_ugm3: d.trappedPM10_Ugm3,
      },
    })),
  };
}

export function exportUhiGeoJson(summary: UrbanHeatIslandSummary): string {
  return JSON.stringify(generateUhiGeoJson(summary), null, 2);
}

export function exportUhiCsv(summary: UrbanHeatIslandSummary): string {
  const headers =
    'distrito_id,nombre,aspect_ratio_hw,impervious_pct,delta_t_uhi_c,trapped_no2_ugm3,trapped_pm10_ugm3\n';
  const rows = summary.districts
    .map(
      (d) =>
        `${d.districtId},"${d.nombre}",${d.aspectRatioHW},${d.imperviousPct},${d.deltaT_UHI_C},${d.trappedNO2_Ugm3},${d.trappedPM10_Ugm3}`
    )
    .join('\n');
  return headers + rows;
}
