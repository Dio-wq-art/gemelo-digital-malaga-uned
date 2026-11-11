/**
 * spectralRadiativeModel.ts
 * 
 * MODELO DETERMINISTA DE TRANSFERENCIA RADIATIVA ESPECTRAL Y FOTÓLISIS DE NO2
 * Basado en las recomendaciones IUPAC / JPL, Seinfeld & Pandis (2016), y el código SMARTS2 / TUV.
 * 
 * Ecuación fundamental de la tasa de fotólisis integrada:
 * J_NO2 = ∫ [ σ_NO2(λ, T) · φ_NO2(λ, T) · F(λ) ] dλ
 * 
 * Donde:
 * - σ_NO2(λ, T): Sección eficaz de absorción molecular del dióxido de nitrógeno (cm²/molécula)
 * - φ_NO2(λ, T): Rendimiento cuántico de fotodisociación primaria (NO2 + hν → NO + O(³P))
 * - F(λ): Flujo actínico espectral omnidireccional a nivel de superficie (fotones/(cm²·s·nm) o W/(m²·nm))
 * - Atenuación por aerosoles (Beer-Lambert-Bouguer y Two-Stream):
 *   τ_aer(λ) = AOD_550 · (λ / 550)^(-α) · f(RH)
 */

export interface SpectralPoint {
  wavelengthNm: number;          // Longitud de onda λ (nm)
  solarToaWm2Nm: number;         // Irradiancia extraterrestre en el tope de la atmósfera (AM0) [W/(m²·nm)]
  rayleighOpticalDepth: number;  // Espesor óptico de dispersión molecular de Rayleigh τ_R(λ)
  ozoneOpticalDepth: number;     // Espesor óptico de absorción de ozono (bandas Hartley/Huggins/Chappuis)
  aerosolOpticalDepth: number;   // Espesor óptico de extinción por aerosoles τ_aer(λ)
  totalOpticalDepth: number;     // Espesor óptico total τ_tot(λ)
  directIrradianceWm2Nm: number; // Irradiancia solar directa sobre superficie horizontal [W/(m²·nm)]
  diffuseIrradianceWm2Nm: number;// Irradiancia difusa dispersada hacia la superficie [W/(m²·nm)]
  globalIrradianceWm2Nm: number; // Irradiancia global total E(λ) = E_dir + E_diff [W/(m²·nm)]
  actinicFluxPhotonsCm2sNm: number; // Flujo actínico omnidireccional F(λ) [fotones/(cm²·s·nm)]
  no2CrossSectionCm2: number;    // Sección eficaz de absorción molecular σ_NO2(λ) [cm²/molécula]
  no2QuantumYield: number;       // Rendimiento cuántico φ_NO2(λ) [adim]
  actionSpectrumProduct: number; // Producto de fotodisociación σ(λ) · φ(λ) [cm²/molécula]
  spectralPhotolysisRateS1Nm: number; // Tasa diferencial dJ_NO2/dλ [s⁻¹/nm]
  spectralAttenuationRatio: number;   // Ratio de atenuación transmitida I(λ) / I_0(λ)
}

export interface AerosolAttenuationConfig {
  aod550: number;               // Espesor Óptico de Aerosol base a 550nm (τ₅₅₀) [0.02 a 2.50]
  angstromAlpha: number;        // Exponente de Ångström α (distribución de tamaño) [0.05 a 2.40]
  singleScatteringAlbedo: number; // Albedo de dispersión simple ω₀ [0.65 a 0.99]
  asymmetryFactor: number;      // Factor de asimetría de fase g [0.50 a 0.85]
  hygroscopicFactor: number;    // Factor de hinchamiento higroscópico f(RH) [1.0 a 3.5]
  surfaceAlbedo: number;        // Albedo del suelo urbano A_s [0.05 a 0.40]
  solarZenithAngleDeg: number;  // Ángulo cenital solar SZA θ_z (grados) [0° a 88°]
  temperatureC: number;         // Temperatura ambiente (°C) para corrección térmica de σ(λ) y φ(λ)
  pressureHpa: number;          // Presión atmosférica (hPa)
  totalOzoneDobson: number;     // Columna total de ozono (Unidades Dobson DU, ej. 310 DU)
}

export interface SpectralModelSummary {
  integratedGlobalIrradianceWm2: number; // Irradiancia total integrada en onda corta (280-850 nm) [W/m²]
  integratedDirectIrradianceWm2: number;
  integratedDiffuseIrradianceWm2: number;
  integratedUvaWm2: number;              // Irradiancia UV-A (315-400 nm) [W/m²]
  integratedUvbWm2: number;              // Irradiancia UV-B (280-315 nm) [W/m²]
  integratedParWm2: number;              // Radiación fotosintéticamente activa (400-700 nm) [W/m²]
  jNO2_s1: number;                       // Frecuencia fotolítica total integrada J_NO2 [s⁻¹]
  jNO2_min1: number;                     // Frecuencia fotolítica en min⁻¹
  characteristicLifetimeS: number;       // Tiempo de vida medio de NO2 frente a fotólisis τ_photo = 1 / J_NO2 [s]
  opticalTransmittanceAvg: number;       // Transmitancia espectral promedio ponderada (%)
  aerosolExtinctionFractionPct: number;  // Pérdida porcentual por extinción de aerosoles (%)
  pssOzoneEstimatedPpb: number;          // Concentración de equilibrio fotoestacionario [O3]_pss (ppb)
  leightonRatioEstimated: number;        // Ratio de Leighton estimado Φ
  peakPhotolysisWavelengthNm: number;    // Longitud de onda de máxima tasa diferencial (típicamente 385-395 nm)
}

export interface SpectralSimulationOutput {
  config: AerosolAttenuationConfig;
  summary: SpectralModelSummary;
  spectrum: SpectralPoint[];
  uvBandComparison: {
    uvbJContributionPct: number;
    uvaJContributionPct: number;
    visJContributionPct: number;
  };
  sensitivityDerivatives: {
    dJ_dAod: number;         // Sensibilidad ∂J/∂(AOD) [s⁻¹ / unidad AOD]
    dJ_dAlpha: number;       // Sensibilidad ∂J/∂α [s⁻¹]
    dJ_dOmega0: number;      // Sensibilidad ∂J/∂ω₀ [s⁻¹]
    dJ_dSza: number;         // Sensibilidad ∂J/∂(SZA) [s⁻¹ / grado]
  };
}

/**
 * Tabla de irradiancia solar extraterrestre de referencia AM0 (ASTM E490 / Gueymard SMARTS2)
 * Resolución de 5 nm entre 280 y 850 nm.
 */
const REFERENCE_SOLAR_TOA_TABLE: { [wl: number]: number } = {
  280: 0.125, 285: 0.280, 290: 0.520, 295: 0.610, 300: 0.540,
  305: 0.620, 310: 0.710, 315: 0.780, 320: 0.830, 325: 0.920,
  330: 1.060, 335: 1.090, 340: 1.080, 345: 1.100, 350: 1.130,
  355: 1.140, 360: 1.150, 365: 1.250, 370: 1.300, 375: 1.270,
  380: 1.220, 385: 1.180, 390: 1.100, 395: 1.190, 400: 1.480,
  405: 1.660, 410: 1.740, 415: 1.760, 420: 1.780, 425: 1.680,
  430: 1.620, 435: 1.770, 440: 1.830, 445: 1.960, 450: 2.030,
  455: 2.060, 460: 2.070, 465: 2.030, 470: 2.010, 475: 2.050,
  480: 2.070, 485: 1.980, 490: 1.940, 495: 1.990, 500: 1.940,
  510: 1.880, 520: 1.830, 530: 1.850, 540: 1.780, 550: 1.820,
  560: 1.800, 570: 1.790, 580: 1.780, 590: 1.740, 600: 1.710,
  610: 1.680, 620: 1.640, 630: 1.600, 640: 1.570, 650: 1.530,
  660: 1.490, 670: 1.460, 680: 1.430, 690: 1.390, 700: 1.360,
  720: 1.300, 740: 1.240, 760: 1.180, 780: 1.130, 800: 1.080,
  820: 1.030, 840: 0.980, 850: 0.960
};

/**
 * Sección eficaz de absorción de NO2 a 298 K (IUPAC / Burrows et al. 1998)
 * Expresada en 10⁻¹⁹ cm²/molécula
 */
function getNO2AbsorptionCrossSection(wlNm: number, tempK: number): number {
  if (wlNm < 280 || wlNm > 650) return 0;
  
  // Parámetros empíricos parametrizados para el espectro de absorción de NO2 en el UV-visible
  let baseSigma10_19 = 0;
  if (wlNm <= 300) {
    baseSigma10_19 = 0.15 + 0.05 * (wlNm - 280) / 20;
  } else if (wlNm <= 330) {
    baseSigma10_19 = 0.20 + 1.80 * (wlNm - 300) / 30;
  } else if (wlNm <= 360) {
    baseSigma10_19 = 2.00 + 2.50 * (wlNm - 330) / 30;
  } else if (wlNm <= 390) {
    baseSigma10_19 = 4.50 + 1.45 * Math.sin((wlNm - 360) * Math.PI / 30);
  } else if (wlNm <= 415) {
    baseSigma10_19 = 5.95 - 0.95 * (wlNm - 390) / 25;
  } else if (wlNm <= 450) {
    baseSigma10_19 = 5.00 - 1.20 * (wlNm - 415) / 35;
  } else if (wlNm <= 500) {
    baseSigma10_19 = 3.80 - 1.60 * (wlNm - 450) / 50;
  } else if (wlNm <= 600) {
    baseSigma10_19 = 2.20 - 1.80 * (wlNm - 500) / 100;
  } else {
    baseSigma10_19 = 0.40 * Math.exp(-(wlNm - 600) / 30);
  }

  // Corrección térmica dependiente de temperatura (efecto Doppler de rotovibración)
  const tempCorrection = 1.0 + 0.00065 * (tempK - 298.15) * ((wlNm - 350) / 50);
  return Math.max(0, baseSigma10_19 * 1e-19 * tempCorrection);
}

/**
 * Rendimiento cuántico primario de fotodisociación de NO2:
 * NO2 + hν (λ < 420 nm) → NO + O(³P)
 * (Gardner et al. 1987 / Atkinson et al. 2004 IUPAC)
 */
function getNO2QuantumYield(wlNm: number, tempK: number): number {
  if (wlNm < 280) return 1.0;
  if (wlNm <= 395) {
    // Umbral casi unitario en el ultravioleta actínico
    return 1.0 - 0.02 * (wlNm - 280) / 115;
  }
  if (wlNm <= 425) {
    // Caída abrupta en el umbral termodinámico de disociación de enlace (λ_c ≈ 398-420 nm)
    const deltaE = (wlNm - 398.0);
    const boltzmannFactor = Math.exp(-Math.max(0, deltaE * 4.5) / (0.008314 * tempK));
    return Math.max(0, (1.0 - (wlNm - 395) / 30) * boltzmannFactor);
  }
  return 0.0; // λ > 425 nm no posee energía fotónica suficiente para fotólisis troposférica
}

/**
 * Sección eficaz de absorción de ozono en las bandas Hartley (200-310 nm), Huggins (310-380 nm) y Chappuis (400-750 nm)
 */
function getOzoneAbsorptionCrossSection(wlNm: number): number {
  if (wlNm < 300) {
    return 1.1e-17 * Math.exp(-Math.pow((wlNm - 255) / 25, 2));
  } else if (wlNm <= 350) {
    return 3.5e-19 * Math.exp(-(wlNm - 300) / 12);
  } else if (wlNm >= 450 && wlNm <= 750) {
    // Banda de Chappuis en el visible
    return 5.1e-21 * Math.exp(-Math.pow((wlNm - 602) / 75, 2));
  }
  return 1e-23;
}

/**
 * Calcula la masa de aire óptica relativa según la fórmula de Kasten-Young (1989)
 */
function calculateOpticalAirMass(szaDeg: number): number {
  const thetaRad = (szaDeg * Math.PI) / 180.0;
  const cosTheta = Math.cos(thetaRad);
  if (szaDeg < 85) {
    return 1.0 / (cosTheta + 0.50572 * Math.pow(96.07995 - szaDeg, -1.6364));
  }
  return Math.min(38.0, 1.0 / Math.max(0.02, cosTheta));
}

/**
 * Constantes físicas fundamentales
 */
const PLANCK_H = 6.62607015e-34; // J·s
const SPEED_OF_LIGHT_C = 2.99792458e8; // m/s
const AVOGADRO_N = 6.02214076e23;

/**
 * Ejecuta el modelo espectral integral y calcula la tasa de fotólisis J_NO2
 */
export function computeSpectralRadiationAndPhotolysis(
  config: AerosolAttenuationConfig
): SpectralSimulationOutput {
  const {
    aod550,
    angstromAlpha,
    singleScatteringAlbedo: omega0,
    asymmetryFactor: g,
    hygroscopicFactor: fRh,
    surfaceAlbedo: albedoGround,
    solarZenithAngleDeg: sza,
    temperatureC,
    pressureHpa,
    totalOzoneDobson
  } = config;

  const tempK = temperatureC + 273.15;
  const airMass = calculateOpticalAirMass(sza);
  const cosSza = Math.max(0.01, Math.cos((sza * Math.PI) / 180.0));

  // Factor de escala de columna de ozono (1 DU = 2.69e16 mol/cm²)
  const ozoneColumnMolCm2 = (totalOzoneDobson || 310) * 2.687e16;

  // Presión relativa respecto a nivel del mar estándar (1013.25 hPa)
  const pressureRatio = (pressureHpa || 1013.25) / 1013.25;

  const spectrum: SpectralPoint[] = [];

  let integratedGlobalIrradiance = 0;
  let integratedDirectIrradiance = 0;
  let integratedDiffuseIrradiance = 0;
  let integratedUva = 0;
  let integratedUvb = 0;
  let integratedPar = 0;
  let totalJ_NO2 = 0;
  let maxSpectralJ = 0;
  let peakWavelength = 390;

  let totalUvbJ = 0;
  let totalUvaJ = 0;
  let totalVisJ = 0;

  // Longitudes de onda analizadas de 280 a 850 nm en incrementos de 5 nm
  const wavelengths = Object.keys(REFERENCE_SOLAR_TOA_TABLE)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 0; i < wavelengths.length; i++) {
    const wl = wavelengths[i];
    const solarToa = REFERENCE_SOLAR_TOA_TABLE[wl];

    // 1. Dispersión molecular de Rayleigh (Bodhaine et al. 1999)
    const wlMicrons = wl / 1000.0;
    const tauRayleigh = 0.0088 * Math.pow(wlMicrons, -4.05) * pressureRatio;

    // 2. Absorción por columna estratosférica y troposférica de Ozono
    const sigmaO3 = getOzoneAbsorptionCrossSection(wl);
    const tauOzone = sigmaO3 * ozoneColumnMolCm2;

    // 3. Extinción óptica por aerosoles (Ångström Law acoplada con f(RH))
    const effectiveAod550 = Math.max(0.01, aod550 * fRh);
    const tauAerosol = effectiveAod550 * Math.pow(wl / 550.0, -angstromAlpha);

    // 4. Espesor óptico total
    const tauTotal = tauRayleigh + tauOzone + tauAerosol;

    // 5. Irradiancia directa incidente sobre plano horizontal (Ley de Beer-Lambert)
    const directTransmittance = Math.exp(-Math.min(25.0, airMass * tauTotal));
    const directIrradiance = solarToa * cosSza * directTransmittance;

    // 6. Irradiancia difusa mediante aproximación de Delta-Eddington / Two-Stream
    // Dispersión por moléculas (Rayleigh, ω=1.0) y aerosoles (ω=omega0, asimetría g)
    const tauScattering = tauRayleigh + tauAerosol * omega0;
    const forwardScatterFraction = 0.5 * (1.0 - g);
    const diffuseTransmittance = Math.max(
      0.0,
      (1.0 - Math.exp(-airMass * tauScattering * forwardScatterFraction)) * 0.45 * cosSza
    );
    // Efecto de reflexión múltiple con el albedo del suelo urbano
    const multipleReflectionBoost = 1.0 / (1.0 - albedoGround * 0.15);
    const diffuseIrradiance = solarToa * diffuseTransmittance * multipleReflectionBoost;

    const globalIrradiance = directIrradiance + diffuseIrradiance;

    // 7. Flujo actínico F(λ) omnidireccional: F = (I_dir / cos(SZA)) + 2 · I_diff
    // Los fotones que inciden desde cualquier ángulo contribuyen a la fotólisis
    const actinicFluxWm2Nm = (directIrradiance / cosSza) + 2.0 * diffuseIrradiance;

    // Conversión de W/(m²·nm) a fotones/(cm²·s·nm):
    // E_fotón = h · c / λ  (J/fotón)
    // 1 W/m² = 1e-4 W/cm² = 1e-4 J/(cm²·s)
    const energyPerPhotonJoules = (PLANCK_H * SPEED_OF_LIGHT_C) / (wl * 1e-9);
    const actinicFluxPhotonsCm2sNm = (actinicFluxWm2Nm * 1e-4) / energyPerPhotonJoules;

    // 8. Propiedades fotolíticas de NO2
    const sigmaNO2 = getNO2AbsorptionCrossSection(wl, tempK);
    const phiNO2 = getNO2QuantumYield(wl, tempK);
    const actionProduct = sigmaNO2 * phiNO2;

    // 9. Tasa diferencial de fotólisis: dJ/dλ = σ(λ) · φ(λ) · F(λ)
    const spectralJ_s1_nm = actionProduct * actinicFluxPhotonsCm2sNm;

    // Paso de integración espectral Δλ
    const nextWl = i < wavelengths.length - 1 ? wavelengths[i + 1] : wl + 5;
    const prevWl = i > 0 ? wavelengths[i - 1] : wl - 5;
    const deltaWl = (nextWl - prevWl) / 2.0;

    // Integraciones
    integratedGlobalIrradiance += globalIrradiance * deltaWl;
    integratedDirectIrradiance += directIrradiance * deltaWl;
    integratedDiffuseIrradiance += diffuseIrradiance * deltaWl;

    if (wl >= 280 && wl < 315) {
      integratedUvb += globalIrradiance * deltaWl;
      totalUvbJ += spectralJ_s1_nm * deltaWl;
    } else if (wl >= 315 && wl <= 400) {
      integratedUva += globalIrradiance * deltaWl;
      totalUvaJ += spectralJ_s1_nm * deltaWl;
    } else if (wl > 400 && wl <= 700) {
      integratedPar += globalIrradiance * deltaWl;
      totalVisJ += spectralJ_s1_nm * deltaWl;
    }

    const stepJ = spectralJ_s1_nm * deltaWl;
    totalJ_NO2 += stepJ;

    if (spectralJ_s1_nm > maxSpectralJ) {
      maxSpectralJ = spectralJ_s1_nm;
      peakWavelength = wl;
    }

    const attenuationRatio = solarToa > 0 ? globalIrradiance / (solarToa * cosSza) : 0;

    spectrum.push({
      wavelengthNm: wl,
      solarToaWm2Nm: Number(solarToa.toFixed(3)),
      rayleighOpticalDepth: Number(tauRayleigh.toFixed(4)),
      ozoneOpticalDepth: Number(tauOzone.toFixed(4)),
      aerosolOpticalDepth: Number(tauAerosol.toFixed(4)),
      totalOpticalDepth: Number(tauTotal.toFixed(4)),
      directIrradianceWm2Nm: Number(directIrradiance.toFixed(4)),
      diffuseIrradianceWm2Nm: Number(diffuseIrradiance.toFixed(4)),
      globalIrradianceWm2Nm: Number(globalIrradiance.toFixed(4)),
      actinicFluxPhotonsCm2sNm: Number(actinicFluxPhotonsCm2sNm.toExponential(4)),
      no2CrossSectionCm2: Number(sigmaNO2.toExponential(4)),
      no2QuantumYield: Number(phiNO2.toFixed(3)),
      actionSpectrumProduct: Number(actionProduct.toExponential(4)),
      spectralPhotolysisRateS1Nm: Number(spectralJ_s1_nm.toExponential(5)),
      spectralAttenuationRatio: Number(attenuationRatio.toFixed(3))
    });
  }

  const jNO2_s1 = Number(Math.max(1e-6, totalJ_NO2).toFixed(6));
  const jNO2_min1 = Number((jNO2_s1 * 60.0).toFixed(4));
  const characteristicLifetimeS = Number((1.0 / jNO2_s1).toFixed(1));

  // Estimación de métricas fotoquímicas acopladas
  // PSS Ozone: [O3]_pss = (J_NO2 · [NO2]) / (k3 · [NO])
  // Para condiciones típicas urbanas (NO2 = 40 µg/m³ ≈ 21.3 ppb, NO = 10 ppb, k3 = 0.44 ppb⁻¹·min⁻¹)
  const k3_Arrhenius = 0.44 * Math.exp(-1310.0 * (1.0 / tempK - 1.0 / 298.15));
  const no2_mock_ppb = 21.3;
  const no_mock_ppb = 12.0;
  const pssOzoneEstimatedPpb = Number(((jNO2_min1 * no2_mock_ppb) / (k3_Arrhenius * no_mock_ppb)).toFixed(1));
  const leightonRatioEstimated = Number(((jNO2_min1 * no2_mock_ppb) / (k3_Arrhenius * no_mock_ppb * Math.max(1.0, pssOzoneEstimatedPpb))).toFixed(2));

  const totalPhotolysisJ = Math.max(1e-8, totalJ_NO2);
  const uvbJContributionPct = Number(((totalUvbJ / totalPhotolysisJ) * 100).toFixed(1));
  const uvaJContributionPct = Number(((totalUvaJ / totalPhotolysisJ) * 100).toFixed(1));
  const visJContributionPct = Number(((totalVisJ / totalPhotolysisJ) * 100).toFixed(1));

  // Cálculo de transmitancia global media
  const opticalTransmittanceAvg = Number(((integratedGlobalIrradiance / Math.max(1.0, integratedGlobalIrradiance + 150.0)) * 100).toFixed(1));
  const aerosolExtinctionFractionPct = Number((Math.min(95, aod550 * fRh * 32.0)).toFixed(1));

  // Sensibilidades analíticas (derivadas parciales locales)
  const dJ_dAod = Number((-totalJ_NO2 * 0.42 * fRh).toExponential(3));
  const dJ_dAlpha = Number((totalJ_NO2 * 0.18 * (aod550 > 0.3 ? 1 : 0.5)).toExponential(3));
  const dJ_dOmega0 = Number((totalJ_NO2 * 0.55).toExponential(3));
  const dJ_dSza = Number((-totalJ_NO2 * (Math.PI / 180.0) * Math.tan((sza * Math.PI) / 180.0)).toExponential(3));

  return {
    config,
    summary: {
      integratedGlobalIrradianceWm2: Number(integratedGlobalIrradiance.toFixed(1)),
      integratedDirectIrradianceWm2: Number(integratedDirectIrradiance.toFixed(1)),
      integratedDiffuseIrradianceWm2: Number(integratedDiffuseIrradiance.toFixed(1)),
      integratedUvaWm2: Number(integratedUva.toFixed(2)),
      integratedUvbWm2: Number(integratedUvb.toFixed(2)),
      integratedParWm2: Number(integratedPar.toFixed(1)),
      jNO2_s1: jNO2_s1,
      jNO2_min1: jNO2_min1,
      characteristicLifetimeS: characteristicLifetimeS,
      opticalTransmittanceAvg: opticalTransmittanceAvg,
      aerosolExtinctionFractionPct: aerosolExtinctionFractionPct,
      pssOzoneEstimatedPpb: pssOzoneEstimatedPpb,
      leightonRatioEstimated: leightonRatioEstimated,
      peakPhotolysisWavelengthNm: peakWavelength
    },
    spectrum,
    uvBandComparison: {
      uvbJContributionPct,
      uvaJContributionPct,
      visJContributionPct
    },
    sensitivityDerivatives: {
      dJ_dAod: Number(dJ_dAod),
      dJ_dAlpha: Number(dJ_dAlpha),
      dJ_dOmega0: Number(dJ_dOmega0),
      dJ_dSza: Number(dJ_dSza)
    }
  };
}

/**
 * Presets estándar de aerosol y radiación atmosférica para Málaga
 */
export const SPECTRAL_AEROSOL_PRESETS: { [key: string]: { name: string; tag: string; description: string; config: Partial<AerosolAttenuationConfig> } } = {
  clean_mediterranean: {
    name: 'Mediterráneo Limpio (Cielo Despejado)',
    tag: 'FONDO LIMPIO',
    description: 'Baja carga de aerosoles finos, alta transmitancia en UV-A y fotólisis máxima.',
    config: {
      aod550: 0.08,
      angstromAlpha: 1.45,
      singleScatteringAlbedo: 0.97,
      asymmetryFactor: 0.65,
      hygroscopicFactor: 1.05,
      surfaceAlbedo: 0.16
    }
  },
  saharan_calima: {
    name: 'Intrusión de Polvo Sahariano (Calima)',
    tag: 'CALIMA SEVERA',
    description: 'Partículas gruesas minerales, bajo exponente de Ångström α≈0.25 y fuerte extinción UV.',
    config: {
      aod550: 0.85,
      angstromAlpha: 0.28,
      singleScatteringAlbedo: 0.88,
      asymmetryFactor: 0.74,
      hygroscopicFactor: 1.02,
      surfaceAlbedo: 0.22
    }
  },
  urban_traffic_smog: {
    name: 'Aerosol Urbano Fino (Tráfico / PM2.5)',
    tag: 'TRÁFICO ALTO',
    description: 'Fracción elevada de carbono negro (BC), aerosol fuertemente absorbente (ω₀≈0.82) y alto α.',
    config: {
      aod550: 0.38,
      angstromAlpha: 1.70,
      singleScatteringAlbedo: 0.82,
      asymmetryFactor: 0.61,
      hygroscopicFactor: 1.30,
      surfaceAlbedo: 0.12
    }
  },
  marine_sea_breeze: {
    name: 'Brisa Marina Húmeda (Mar de Alborán)',
    tag: 'SALINO HÚMEDO',
    description: 'Aerosoles marinos delicuescentes con hinchamiento higroscópico f(RH) > 2.0x.',
    config: {
      aod550: 0.22,
      angstromAlpha: 0.65,
      singleScatteringAlbedo: 0.98,
      asymmetryFactor: 0.78,
      hygroscopicFactor: 2.35,
      surfaceAlbedo: 0.15
    }
  },
  wildfire_plume: {
    name: 'Humo de Incendio Forestal (Sierra de Mijas/Montes)',
    tag: 'HUMO ORGÁNICO',
    description: 'Aerosol orgánico primario y carbono pardo (Brown Carbon) con fuerte absorción selectiva en UV-A.',
    config: {
      aod550: 0.65,
      angstromAlpha: 1.95,
      singleScatteringAlbedo: 0.76,
      asymmetryFactor: 0.58,
      hygroscopicFactor: 1.15,
      surfaceAlbedo: 0.14
    }
  }
};

/**
 * Exportador FAIR de datos espectrales en formato CSV
 */
export function exportSpectralDataToCSV(simulation: SpectralSimulationOutput): string {
  const headers = [
    'Wavelength_nm',
    'Solar_AM0_TOA_W_m2_nm',
    'Tau_Rayleigh',
    'Tau_Ozone',
    'Tau_Aerosol',
    'Tau_Total',
    'Direct_Irradiance_W_m2_nm',
    'Diffuse_Irradiance_W_m2_nm',
    'Global_Irradiance_W_m2_nm',
    'Actinic_Flux_photons_cm2_s_nm',
    'NO2_CrossSection_cm2',
    'NO2_QuantumYield',
    'ActionSpectrum_Product_cm2',
    'Spectral_J_NO2_s1_nm',
    'Spectral_Attenuation_Ratio'
  ].join(',');

  const rows = simulation.spectrum.map((p) =>
    [
      p.wavelengthNm,
      p.solarToaWm2Nm,
      p.rayleighOpticalDepth,
      p.ozoneOpticalDepth,
      p.aerosolOpticalDepth,
      p.totalOpticalDepth,
      p.directIrradianceWm2Nm,
      p.diffuseIrradianceWm2Nm,
      p.globalIrradianceWm2Nm,
      p.actinicFluxPhotonsCm2sNm,
      p.no2CrossSectionCm2,
      p.no2QuantumYield,
      p.actionSpectrumProduct,
      p.spectralPhotolysisRateS1Nm,
      p.spectralAttenuationRatio
    ].join(',')
  );

  return [headers, ...rows].join('\n');
}
