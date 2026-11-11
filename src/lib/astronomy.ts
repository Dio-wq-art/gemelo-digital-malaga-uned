/**
 * Módulo de Resolución Astronómica y Radiométrica Avanzada (Algoritmo NOAA/NREL SPA simplificado).
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire en Málaga.
 * Cero Aleatoriedad - Puramente determinista.
 */

export interface SolarGeometry {
  sza_deg: number;          // Solar Zenith Angle
  elevation_deg: number;    // Solar Elevation Angle
  azimuth_deg: number;      // Solar Azimuth
  declination_deg: number;  // Declination
  equationOfTime_min: number; // Equation of time
  jNo2_ClearSky_s1: number; // Tasa fotolítica teórica
}

export function calculateRigorousSPA(date: Date, lat: number = 36.72016, lon: number = -4.42034): SolarGeometry {
  // Conversión rigurosa de fechas a Julian Century
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5 + h / 24;
  
  const JC = (JD - 2451545.0) / 36525.0; // Julian Century

  // Geom Mean Long Sun (deg)
  let L0 = 280.46646 + JC * (36000.76983 + JC * 0.0003032);
  L0 = L0 % 360;

  // Geom Mean Anom Sun (deg)
  const M = 357.52911 + JC * (35999.05029 - 0.0001537 * JC);

  // Eccentric Earth Orbit
  const e = 0.016708634 - JC * (0.000042037 + 0.0000001267 * JC);

  // Sun Eq of Ctr
  const C = Math.sin(M * Math.PI / 180) * (1.914602 - JC * (0.004817 + 0.000014 * JC)) +
            Math.sin(2 * M * Math.PI / 180) * (0.019993 - 0.000101 * JC) +
            Math.sin(3 * M * Math.PI / 180) * 0.000289;

  // Sun True Long
  const L_true = L0 + C;

  // Sun App Long
  const Omega = 125.04 - 1934.136 * JC;
  const L_app = L_true - 0.00569 - 0.00478 * Math.sin(Omega * Math.PI / 180);

  // Mean Obliq Ecliptic
  const e0 = 23 + (26 + ((21.448 - JC * (46.815 + JC * (0.00059 - JC * 0.001813)))) / 60) / 60;
  
  // Obliq Corr
  const e_corr = e0 + 0.00256 * Math.cos(Omega * Math.PI / 180);

  // Sun Declination
  const declination = Math.asin(Math.sin(e_corr * Math.PI / 180) * Math.sin(L_app * Math.PI / 180)) * 180 / Math.PI;

  // var y for Eq of Time
  const var_y = Math.tan((e_corr / 2) * Math.PI / 180) ** 2;

  // Equation of Time (minutes)
  const EOT = 4 * (var_y * Math.sin(2 * L0 * Math.PI / 180) - 
              2 * e * Math.sin(M * Math.PI / 180) + 
              4 * e * var_y * Math.sin(M * Math.PI / 180) * Math.cos(2 * L0 * Math.PI / 180) - 
              0.5 * var_y ** 2 * Math.sin(4 * L0 * Math.PI / 180) - 
              1.25 * e ** 2 * Math.sin(2 * M * Math.PI / 180)) * 180 / Math.PI;

  // True Solar Time
  const TST = (h * 60 + EOT + 4 * lon) % 1440; // minutes

  // Hour Angle (deg)
  let HA = TST / 4 - 180;
  if (HA < -180) HA += 360;

  // Solar Zenith Angle (SZA)
  const lat_rad = lat * Math.PI / 180;
  const dec_rad = declination * Math.PI / 180;
  const ha_rad = HA * Math.PI / 180;

  const cos_sza = Math.sin(lat_rad) * Math.sin(dec_rad) + Math.cos(lat_rad) * Math.cos(dec_rad) * Math.cos(ha_rad);
  const sza_rad = Math.acos(cos_sza);
  let sza_deg = sza_rad * 180 / Math.PI;

  // Atmospheric Refraction Correction (approximate, for high zenith angles)
  const elevation = 90 - sza_deg;
  let refraction = 0;
  if (elevation > 85) refraction = 0;
  else if (elevation > 5) {
    refraction = (58.1 / Math.tan(elevation * Math.PI / 180) - 0.07 / Math.pow(Math.tan(elevation * Math.PI / 180), 3) + 0.000086 / Math.pow(Math.tan(elevation * Math.PI / 180), 5)) / 3600;
  } else if (elevation > -0.575) {
    refraction = (1735 + elevation * (-518.2 + elevation * (103.4 + elevation * (-12.79 + elevation * 0.711)))) / 3600;
  } else {
    refraction = -20.772 / Math.tan(elevation * Math.PI / 180) / 3600;
  }
  
  sza_deg = sza_deg - refraction;

  // Actinic Flux calculation for J_NO2
  let jNo2_ClearSky = 0;
  if (sza_deg < 90) {
    // Advanced parameterization by S. Madronich (NCAR TUV model proxy)
    jNo2_ClearSky = 0.0145 * Math.exp(-0.35 / Math.max(0.01, Math.cos(sza_deg * Math.PI / 180)));
  }

  return {
    sza_deg,
    elevation_deg: 90 - sza_deg,
    azimuth_deg: 0, // Simplified out of scope for photochemistry
    declination_deg: declination,
    equationOfTime_min: EOT,
    jNo2_ClearSky_s1: jNo2_ClearSky
  };
}
