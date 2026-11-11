/**
 * MÓDULO DE EFEMÉRIDES SOLARES Y FOTÓLISIS EN CAÑONES URBANOS 3D
 * =============================================================
 * Tesis Doctoral - Modelización de Calidad del Aire a Microescala en Málaga.
 *
 * Fundamentos Teóricos:
 * 1. Efemérides Solares (SunCalc & Algoritmos NREL SPA):
 *    Calcula acimut (θ_s) y cenit (θ_z) solar para Málaga (36.72°N, -4.42°W).
 * 2. Irradiancia en Cielo Despejado (Kasten-Czeplak / Haurwitz):
 *    Descomposición en Irradiancia Directa Normal (DNI), Difusa Horizontal (DHI) y Global (GHI).
 * 3. Geometría 3D de Sombreado en Cañones Urbanos (Oke, 1988):
 *    Proyección del rayo solar relativo al acimut de la calle. Sombra en calzada y en fachadas.
 * 4. Fotólisis Diferencial de Leighton (J_NO2):
 *    NO2 + hν -> NO + O(3P) (λ < 420 nm).
 *    J_NO2 = J_clear * (SVF * (DHI/GHI) + (DNI/GHI) * cos(θ_incidencia) * I_sunlit).
 *
 * Rigor Doctrinal: Cero aleatoriedad (Math.random prohibido). 100% Determinista.
 */

import * as SunCalc from 'suncalc';

export interface SolarCanyonState {
  timestamp: Date;
  solarAltitudeDeg: number;
  solarAzimuthDeg: number;
  solarZenithDeg: number;
  dniWm2: number;
  dhiWm2: number;
  ghiWm2: number;
  skyViewFactor: number;
  apparentSolarZenithDeg: number; // Cenit proyectado en el plano transversal de la calle
  floorShadowLengthM: number;
  floorShadowFraction: number; // 0 = 100% soleado, 1 = 100% en sombra
  leewardFacadeSunlitFraction: number;
  windwardFacadeSunlitFraction: number;
  jNo2ClearSky: number; // s^-1
  jNo2SunlitFacade: number; // s^-1
  jNo2ShadedFacade: number; // s^-1
  jNo2StreetFloor: number; // s^-1
  photolysisAsymmetryRatio: number; // jNo2_sunlit / jNo2_shaded
  estimatedOzoneProductionPpbHr: number;
}

export interface CanyonGeometry {
  H: number; // Altura de edificios (m)
  W: number; // Anchura de la calle (m)
  orientationDeg: number; // Azimut de la calle (0-360°, ej: Larios = 180° N-S, Alameda = 90° E-W)
  lat: number;
  lng: number;
}

/**
 * Calcula la posición solar, irradiancia y sombreado 3D de un cañón urbano en Málaga.
 */
export function calculateSolarCanyonShading(
  canyon: CanyonGeometry,
  date: Date = new Date(),
  baseUvIndex: number = 5.0
): SolarCanyonState {
  // 1. Posición Solar Astronómica con SunCalc
  const sunPos = SunCalc.getPosition(date, canyon.lat, canyon.lng);
  const altitudeRad = sunPos.altitude;
  const azimuthRad = sunPos.azimuth; // En SunCalc: 0 es Sur, -pi/2 Este, +pi/2 Oeste

  // Convertir a acimut de navegación meteorológica (0° Norte, 90° Este, 180° Sur, 270° Oeste)
  const solarAzimuthDeg = ((azimuthRad * (180 / Math.PI)) + 180 + 360) % 360;
  const solarAltitudeDeg = Math.max(0, altitudeRad * (180 / Math.PI));
  const solarZenithDeg = 90 - solarAltitudeDeg;
  const zenithRad = (solarZenithDeg * Math.PI) / 180;

  // 2. Modelo de Irradiancia en Cielo Despejado (Kasten-Czeplak / Haurwitz)
  let ghiWm2 = 0;
  let dniWm2 = 0;
  let dhiWm2 = 0;

  if (solarAltitudeDeg > 0.5) {
    const sinAlt = Math.sin(altitudeRad);
    const cosZen = Math.cos(zenithRad);
    // Masa de aire óptica relativa (Kasten-Young, 1989)
    const airMass = 1 / (cosZen + 0.50572 * Math.pow(96.07995 - solarZenithDeg, -1.6364));
    
    // Constante solar extraterrestre corregida por excentricidad (~1367 W/m2)
    const I0 = 1367.0;
    // Irradiancia directa normal (DNI)
    dniWm2 = Math.max(0, I0 * Math.exp(-0.185 * Math.min(10, airMass)));
    // Irradiancia global horizontal (GHI)
    ghiWm2 = Math.max(0, 1098.0 * sinAlt * Math.exp(-0.057 / Math.max(0.01, sinAlt)));
    // Difusa horizontal (DHI) = GHI - DNI * cos(zenith)
    dhiWm2 = Math.max(0, ghiWm2 - dniWm2 * sinAlt);
    if (dhiWm2 === 0 && ghiWm2 > 0) {
      dhiWm2 = ghiWm2 * 0.22;
    }
  }

  // 3. Geometría 3D de Sombreado del Cañón (Oke, 1988; Kastner-Klein et al., 2001)
  const hw = canyon.H / canyon.W;
  // Sky View Factor (SVF) analítico para cañón infinito 2D
  const skyViewFactor = Math.sqrt(hw * hw + 1) - hw;

  // Ángulo de incidencia horizontal del rayo solar relativo al eje de la calle
  const deltaPhiDeg = Math.abs((solarAzimuthDeg - canyon.orientationDeg + 360) % 180);
  const deltaPhiRad = (deltaPhiDeg * Math.PI) / 180;

  let apparentSolarZenithDeg = 90;
  let floorShadowLengthM = canyon.W;
  let floorShadowFraction = 1.0;
  let leewardFacadeSunlitFraction = 0.0;
  let windwardFacadeSunlitFraction = 0.0;

  if (solarAltitudeDeg > 0.5) {
    // Ángulo cenital aparente en la sección transversal perpendicular al cañón:
    // tan(θ_trans) = tan(θ_z) * |sin(Δφ)|
    const tanTrans = Math.tan(zenithRad) * Math.abs(Math.sin(deltaPhiRad));
    apparentSolarZenithDeg = Math.min(89.5, (Math.atan(tanTrans) * 180) / Math.PI);

    // Longitud proyectada de sombra de la cornisa de altura H sobre la calzada:
    floorShadowLengthM = canyon.H * tanTrans;
    floorShadowFraction = Math.min(1.0, Math.max(0.0, floorShadowLengthM / canyon.W));

    // Altura de fachada en sombra en la pared opuesta al Sol
    // Si la sombra del suelo excede W, la sombra trepa por la fachada opuesta
    const shadowClimbM = Math.max(0, (floorShadowLengthM - canyon.W) / Math.max(0.001, tanTrans));
    const oppositeWallSunlitHeightM = Math.max(0, canyon.H - shadowClimbM);

    // Determinar qué fachada recibe radiación solar directa según el acimut solar:
    // Si el Sol está a la derecha del vector de la calle o a la izquierda
    const canyonHeadingRad = (canyon.orientationDeg * Math.PI) / 180;
    const crossProduct = Math.sin(azimuthRad - canyonHeadingRad);

    if (crossProduct > 0) {
      // Fachada Oeste / Sotavento iluminada
      leewardFacadeSunlitFraction = Math.min(1.0, oppositeWallSunlitHeightM / canyon.H);
      windwardFacadeSunlitFraction = 0.0; // En sombra propia
    } else {
      // Fachada Este / Barlovento iluminada
      windwardFacadeSunlitFraction = Math.min(1.0, oppositeWallSunlitHeightM / canyon.H);
      leewardFacadeSunlitFraction = 0.0; // En sombra propia
    }
  }

  // 4. Fotólisis Diferencial de Leighton J_NO2
  // Parámetros empíricos TUV / Dickerson et al. (1982) para J_NO2 claro:
  // J0 ≈ 0.0085 s^-1 a mediodía despejado de verano con UV = 8
  const uvScale = Math.max(0.1, baseUvIndex / 7.0);
  const cosZenithSafe = Math.max(0.05, Math.cos(zenithRad));
  const jNo2ClearSky = solarAltitudeDeg > 0.5 
    ? Math.max(0.0001, 0.0092 * Math.exp(-0.35 / cosZenithSafe) * uvScale)
    : 0.00001; // Fotólisis nocturna nula

  const diffuseRatio = ghiWm2 > 0 ? Math.min(1.0, dhiWm2 / ghiWm2) : 1.0;
  const directRatio = 1.0 - diffuseRatio;

  // J_NO2 en calzada (piso del cañón):
  const streetSunlitFraction = 1.0 - floorShadowFraction;
  const jNo2StreetFloor = jNo2ClearSky * (
    skyViewFactor * diffuseRatio + directRatio * streetSunlitFraction * Math.cos(zenithRad)
  );

  // J_NO2 en Fachada Soleada (incidencia rasante en pared vertical):
  const wallCosIncidence = Math.sin(zenithRad) * Math.abs(Math.sin(deltaPhiRad));
  const jNo2SunlitFacade = jNo2ClearSky * (
    (skyViewFactor * 0.5) * diffuseRatio + directRatio * wallCosIncidence
  );

  // J_NO2 en Fachada en Sombra (únicamente radiación difusa del cielo visible):
  const jNo2ShadedFacade = jNo2ClearSky * (skyViewFactor * 0.5) * diffuseRatio;

  const photolysisAsymmetryRatio = jNo2ShadedFacade > 0 
    ? Number((jNo2SunlitFacade / jNo2ShadedFacade).toFixed(2))
    : 1.0;

  // Producción fotoquímica de Ozono aproximada (d[O3]/dt ≈ J_NO2 * [NO2]):
  // Asumiendo concentración base de NO2 de 35 ppb (~67 µg/m3)
  const baseNo2Ppb = 35.0;
  const estimatedOzoneProductionPpbHr = Number(
    (jNo2SunlitFacade * 3600 * baseNo2Ppb * 0.35).toFixed(1)
  );

  return {
    timestamp: date,
    solarAltitudeDeg: Number(solarAltitudeDeg.toFixed(2)),
    solarAzimuthDeg: Number(solarAzimuthDeg.toFixed(2)),
    solarZenithDeg: Number(solarZenithDeg.toFixed(2)),
    dniWm2: Number(dniWm2.toFixed(1)),
    dhiWm2: Number(dhiWm2.toFixed(1)),
    ghiWm2: Number(ghiWm2.toFixed(1)),
    skyViewFactor: Number(skyViewFactor.toFixed(3)),
    apparentSolarZenithDeg: Number(apparentSolarZenithDeg.toFixed(1)),
    floorShadowLengthM: Number(floorShadowLengthM.toFixed(2)),
    floorShadowFraction: Number(floorShadowFraction.toFixed(3)),
    leewardFacadeSunlitFraction: Number(leewardFacadeSunlitFraction.toFixed(3)),
    windwardFacadeSunlitFraction: Number(windwardFacadeSunlitFraction.toFixed(3)),
    jNo2ClearSky: Number(jNo2ClearSky.toFixed(5)),
    jNo2SunlitFacade: Number(jNo2SunlitFacade.toFixed(5)),
    jNo2ShadedFacade: Number(jNo2ShadedFacade.toFixed(5)),
    jNo2StreetFloor: Number(jNo2StreetFloor.toFixed(5)),
    photolysisAsymmetryRatio,
    estimatedOzoneProductionPpbHr
  };
}
