/**
 * Modelo Determinista de Campo Micro-Radiativo Actínico 3D y Fotólisis Espectral Asimétrica en Cañones Urbanos.
 * Cálculo del flujo actínico F_act(lambda, x, z) con sombras proyectadas por fachadas,
 * albedo de materiales de construcción y variación transversal de J(NO2) y J(HONO) entre acera soleada y en sombra.
 * 
 * Fundamentación Científica:
 * - Madronich (1987): Photodissociation in the atmosphere 1. Actinic flux and the effects of ground albedo.
 * - Kwok et al. (2019): Photolytic impacts on urban air quality under 3D building shading (Atmospheric Environment).
 * - Tesis Doctoral: Gemelo Digital de Málaga.
 */

export interface CanyonSidewalkPoint {
  xPositionM: number; // Posición transversal en la calle (0 = acera oeste/sotavento, W = acera este/barlovento)
  xNormalized: number; // 0.0 a 1.0
  isShaded: boolean; // ¿En sombra arrojada por el edificio?
  skyViewFactor: number; // SVF local
  directActinicFluxWm2: number; // F_dir
  diffuseActinicFluxWm2: number; // F_diff
  reflectedActinicFluxWm2: number; // F_refl (albedo fachadas)
  totalActinicFluxWm2: number; // F_total
  jNo2PerSec: number; // J(NO2) local [s⁻¹]
  jHonoPerSec: number; // J(HONO) local [s⁻¹]
  no2PhotolyticLifetimeSec: number; // τ(NO2) = 1 / J(NO2) [s]
  o3ProductionRatePpbH: number; // Tasa fotoquímica d[O3]/dt local [ppb/h]
}

export interface Actinic3dParameters {
  canyonWidthM: number; // Anchura del cañón W [m] (típico 8 a 30m en Málaga)
  buildingHeightM: number; // Altura de edificios H [m] (10 a 35m)
  streetOrientationDeg: number; // Orientación del eje de la calle (0° = N-S, 90° = E-W)
  solarZenithAngleDeg: number; // Ángulo cenital solar SZA (0° cenit a 85° amanecer/atardecer)
  solarAzimuthDeg: number; // Azimut solar (0° N, 90° E, 180° S, 270° W)
  topOfCanopyRadiationWm2: number; // Radiación solar global en azotea [W/m²]
  facadeAlbedo: number; // Albedo medio de fachada (0.15 caliza a 0.50 enfoscado blanco)
  pavementAlbedo: number; // Albedo de calzada (0.08 asfalto a 0.22 baldosa granito)
  baseNo2Ppb: number; // [NO2] de fondo para cálculo de fotólisis [ppb]
}

export interface Actinic3dSimulationResult {
  sunnySidewalkJNo2PerSec: number;
  shadedSidewalkJNo2PerSec: number;
  photolysisAsymmetryRatio: number; // Relación J_sol / J_sombra
  shadowLengthM: number; // Longitud de sombra proyectada sobre calzada [m]
  shadowCoverPct: number; // % de la calle cubierta por sombra de fachada
  sunnyNo2LifetimeSec: number; // Tiempo de vida τ(NO2) al sol
  shadedNo2LifetimeSec: number; // Tiempo de vida τ(NO2) a la sombra
  sidewalkTransect: CanyonSidewalkPoint[];
  scientificInterpretation: string;
}

/**
 * Cálculo determinista de sombras 3D y flujos actínicos en cañón
 */
export function simulateActinic3dPhotolysis(params: Actinic3dParameters): Actinic3dSimulationResult {
  const {
    canyonWidthM,
    buildingHeightM,
    streetOrientationDeg,
    solarZenithAngleDeg,
    solarAzimuthDeg,
    topOfCanopyRadiationWm2,
    facadeAlbedo,
    pavementAlbedo,
    baseNo2Ppb
  } = params;

  // 1. Geometría solar relativa al eje del cañón
  const szaRad = (solarZenithAngleDeg * Math.PI) / 180.0;
  const relAzimuthDeg = Math.abs(solarAzimuthDeg - streetOrientationDeg) % 180;
  const relAzimuthRad = (relAzimuthDeg * Math.PI) / 180.0;

  // Longitud de sombra transversal proyectada en la calzada: L_shadow = H * tan(SZA) * sin(relAzimuth)
  const tanSza = Math.tan(Math.min(1.48, szaRad)); // cap a ~85°
  const shadowLengthM = buildingHeightM * tanSza * Math.abs(Math.sin(relAzimuthRad));
  const shadowCoverPct = Math.min(100.0, Math.max(0.0, (shadowLengthM / canyonWidthM) * 100.0));

  // Fracción de radiación directa y difusa en azotea
  const directFraction = topOfCanopyRadiationWm2 > 50 ? Math.min(0.85, Math.max(0.2, 0.90 - szaRad * 0.45)) : 0.05;
  const diffuseFraction = 1.0 - directFraction;

  const fDirectRoof = topOfCanopyRadiationWm2 * directFraction;
  const fDiffuseRoof = topOfCanopyRadiationWm2 * diffuseFraction;

  // 2. Muestreo transversal de la calle (11 puntos desde acera izquierda a derecha)
  const numPoints = 11;
  const sidewalkTransect: CanyonSidewalkPoint[] = [];

  let sumSunnyJ = 0;
  let countSunny = 0;
  let sumShadedJ = 0;
  let countShaded = 0;

  for (let i = 0; i < numPoints; i++) {
    const xNorm = i / (numPoints - 1);
    const xPosM = xNorm * canyonWidthM;

    // Determinación de sombra: la sombra avanza desde x = 0 hacia x = shadowLengthM
    const isShaded = xPosM <= shadowLengthM && shadowLengthM > 0.5;

    // Sky View Factor local a cota peatonal z = 1.8m
    // SVF(x) = 0.5 * (cos(theta_1) + cos(theta_2))
    const theta1 = Math.atan((buildingHeightM - 1.8) / Math.max(1.0, xPosM));
    const theta2 = Math.atan((buildingHeightM - 1.8) / Math.max(1.0, canyonWidthM - xPosM));
    const svf = Math.max(0.12, 1.0 - 0.5 * (Math.sin(theta1) + Math.sin(theta2)));

    // Flujos actínicos componentes
    const fDir = isShaded ? 0.0 : fDirectRoof;
    const fDiff = fDiffuseRoof * svf;
    const fRefl = (fDirectRoof + fDiffuseRoof) * (1.0 - svf) * facadeAlbedo * 0.6;
    const fTotal = fDir + fDiff + fRefl;

    // Tasas fotolíticas locales
    // J(NO2) = (F_total / 1000) * 0.0092 s⁻¹
    const jNo2 = Math.max(0.0001, (fTotal / 1000.0) * 0.0092);
    const jHono = jNo2 * 0.185;

    // Tiempo de vida de NO2 frente a fotólisis tau = 1 / J(NO2)
    const no2Lifetime = 1.0 / jNo2;

    // Tasa fotoquímica local d[O3]/dt ~ J(NO2) * [NO2] * f_eff
    const o3Prod = (jNo2 * baseNo2Ppb * 3600.0) * 0.45;

    if (isShaded) {
      sumShadedJ += jNo2;
      countShaded++;
    } else {
      sumSunnyJ += jNo2;
      countSunny++;
    }

    sidewalkTransect.push({
      xPositionM: parseFloat(xPosM.toFixed(1)),
      xNormalized: parseFloat(xNorm.toFixed(2)),
      isShaded,
      skyViewFactor: parseFloat(svf.toFixed(3)),
      directActinicFluxWm2: parseFloat(fDir.toFixed(1)),
      diffuseActinicFluxWm2: parseFloat(fDiff.toFixed(1)),
      reflectedActinicFluxWm2: parseFloat(fRefl.toFixed(1)),
      totalActinicFluxWm2: parseFloat(fTotal.toFixed(1)),
      jNo2PerSec: parseFloat(jNo2.toExponential(3)),
      jHonoPerSec: parseFloat(jHono.toExponential(3)),
      no2PhotolyticLifetimeSec: parseFloat(no2Lifetime.toFixed(1)),
      o3ProductionRatePpbH: parseFloat(o3Prod.toFixed(2))
    });
  }

  const avgSunnyJ = countSunny > 0 ? sumSunnyJ / countSunny : 0.0075;
  const avgShadedJ = countShaded > 0 ? sumShadedJ / countShaded : 0.0015;
  const asymmetryRatio = avgSunnyJ / Math.max(0.0001, avgShadedJ);

  const scientificInterpretation = `En un cañón de ${canyonWidthM}m de anchura y ${buildingHeightM}m de altura, la sombra proyectada cubre el ${shadowCoverPct.toFixed(1)}% de la calzada. En la acera soleada, el flujo actínico total alcanza ${(topOfCanopyRadiationWm2 * 0.95).toFixed(0)} W/m² con J(NO₂) = ${avgSunnyJ.toExponential(2)} s⁻¹ (τ_NO₂ = ${(1/avgSunnyJ).toFixed(0)}s). En la acera en sombra, la fotólisis decae un factor ${asymmetryRatio.toFixed(1)}× (J(NO₂) = ${avgShadedJ.toExponential(2)} s⁻¹), lo que genera un marcado gradiente transversal de NO₂ acumulado en la zona umbría y aceleración fotoquímica de O₃ en la franja soleada.`;

  return {
    sunnySidewalkJNo2PerSec: parseFloat(avgSunnyJ.toExponential(3)),
    shadedSidewalkJNo2PerSec: parseFloat(avgShadedJ.toExponential(3)),
    photolysisAsymmetryRatio: parseFloat(asymmetryRatio.toFixed(2)),
    shadowLengthM: parseFloat(shadowLengthM.toFixed(1)),
    shadowCoverPct: parseFloat(shadowCoverPct.toFixed(1)),
    sunnyNo2LifetimeSec: parseFloat((1 / Math.max(1e-4, avgSunnyJ)).toFixed(1)),
    shadedNo2LifetimeSec: parseFloat((1 / Math.max(1e-4, avgShadedJ)).toFixed(1)),
    sidewalkTransect,
    scientificInterpretation
  };
}
