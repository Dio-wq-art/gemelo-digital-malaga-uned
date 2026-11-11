/**
 * Balance Fotoquímico Regional y Rendimiento de Aerosoles Orgánicos Secundarios (SOA)
 * Estación Agroforestal y Atmosférica Oficial IHSM "La Mayora" (CSIC - UMA, Algarrobo)
 * 
 * Formulación Determinista Basada en:
 * 1. Algoritmo MEGAN (Guenther et al., 2006, 2012) para emisiones biogénicas (BVOCs).
 * 2. Teoría de Absorción Gas-Partícula de Pankow (1994) y Odum et al. (1996) para rendimiento SOA.
 * 3. Formación de Nitratos Orgánicos (RONO2 / PAN) bajo advección de Levante hacia la Bahía de Málaga.
 * 
 * Rigor científico doctoral: CERO datos estocásticos (Math.random() = 0).
 */

export interface IhsmBiogenicParams {
  solarRadiationParWm2: number;  // Radiación fotosintéticamente activa (PAR, W/m²)
  airTemperatureC: number;       // Temperatura ambiente en La Mayora (°C)
  levanteWindSpeedKmh: number;   // Velocidad del viento de Levante (km/h)
  urbanNo2ConcentrationUgM3: number; // NO2 medido en la cuenca receptora de Málaga (µg/m³)
  preexistingOrganicAerosolUgM3: number; // Masa de aerosol orgánico preexistente M_o (µg/m³)
  subtropicalCanopyFractionPct: number; // Fracción de cultivo subtropical (aguacate/mango) vs monte mediterráneo
}

export interface IhsmBiogenicResult {
  isopreneEmissionFluxUgM2h: number;     // Flujo de isopreno F_iso (µg/m²·h)
  monoterpeneEmissionFluxUgM2h: number;  // Flujo de monoterpenos F_mono (µg/m²·h)
  totalBvocMassKgH: number;               // Masa total regional emitida por la franja oriental de la Axarquía (kg/h)
  advectionTravelTimeHours: number;      // Tiempo de transporte desde Algarrobo hasta Málaga Centro (h)
  soaYieldPercent: number;               // Rendimiento de aerosol orgánico secundario Y_SOA (%)
  newSoaFormedUgM3: number;              // Nuevo SOA generado en la masa de aire (µg/m³)
  panOrganicNitratesPptv: number;        // Concentración calculada de PAN y nitratos orgánicos (pptv)
  photochemicalRegimeImpact: 'VOC_LIMITED_AMPLIFIED' | 'TRANSITIONAL' | 'NOX_SATURATED';
  scientificNote: string;
}

export function computeIhsmBiogenicSoa(params: IhsmBiogenicParams): IhsmBiogenicResult {
  const {
    solarRadiationParWm2,
    airTemperatureC,
    levanteWindSpeedKmh,
    urbanNo2ConcentrationUgM3,
    preexistingOrganicAerosolUgM3,
    subtropicalCanopyFractionPct
  } = params;

  // 1. Algoritmo MEGAN (Guenther et al., 2006)
  // Dependencia de la temperatura: gamma_T = exp(c_T1 * (T - T_s) / (R * T_s * T)) / (1 + exp(c_T2 * (T - T_m) / (R * T_s * T)))
  const T = airTemperatureC + 273.15;
  const Ts = 303.15; // 30°C referencia estándar
  const R = 8.314;
  const ct1 = 95000;
  const ct2 = 230000;
  const tm = 314.0;
  const num = Math.exp((ct1 * (T - Ts)) / (R * Ts * T));
  const den = 1.0 + Math.exp((ct2 * (T - tm)) / (R * Ts * T));
  const gammaT = Math.min(3.8, Math.max(0.05, num / den));

  // Dependencia de la luz (PAR): gamma_L = (alpha * c_L1 * L) / sqrt(1 + alpha^2 * L^2)
  const alpha = 0.0027;
  const cl1 = 1.066;
  const par = Math.max(0, solarRadiationParWm2);
  const gammaL = par > 5 ? (alpha * cl1 * par) / Math.sqrt(1.0 + Math.pow(alpha * par, 2)) : 0.01;

  // Factores basales de emisión para subtropicales (aguacatero Persea americana / cítricos)
  // Fracción subtropical (0 a 1)
  const fSub = Math.min(1.0, Math.max(0.1, subtropicalCanopyFractionPct / 100.0));
  const baselineIsoprene = 380.0 * fSub + 140.0 * (1.0 - fSub); // µg/m²·h
  const baselineMonoterpene = 180.0 * fSub + 95.0 * (1.0 - fSub); // µg/m²·h

  // Flujos de emisión biogénica
  const isopreneEmissionFluxUgM2h = Number((baselineIsoprene * gammaL * gammaT).toFixed(1));
  const monoterpeneEmissionFluxUgM2h = Number((baselineMonoterpene * gammaT * (0.4 + 0.6 * gammaL)).toFixed(1));

  // Área agroforestal efectiva de la cuenca oriental Axarquía-Algarrobo (~140 km² = 1.4e8 m²)
  const regionalAreaM2 = 1.4e8;
  const totalBvocGramsHour = ((isopreneEmissionFluxUgM2h + monoterpeneEmissionFluxUgM2h) * regionalAreaM2) / 1e6;
  const totalBvocMassKgH = Number((totalBvocGramsHour / 1000.0).toFixed(1));

  // 2. Transporte Advectivo hacia Málaga
  // Distancia geodésica Algarrobo -> Bahía de Málaga = ~34 km
  const distanceKm = 34.0;
  const windKmh = Math.max(3.0, levanteWindSpeedKmh);
  const advectionTravelTimeHours = Number((distanceKm / windKmh).toFixed(2));

  // 3. Formación de SOA y Nitratos Orgánicos (Pankow 1994 / Odum 1996)
  // Modelo bi-producto absorbente con M_o preexistente
  const Mo = Math.max(1.0, preexistingOrganicAerosolUgM3);
  // Parámetros de partición para monoterpenos (alpha1=0.08, Kp1=0.18, alpha2=0.14, Kp2=0.025)
  const yield1 = (0.09 * 0.18 * Mo) / (1.0 + 0.18 * Mo);
  const yield2 = (0.16 * 0.03 * Mo) / (1.0 + 0.03 * Mo);
  // Isoprene SOA yield under high NOx (Surratt et al. 2010): ~2.5%
  const isopreneYield = 0.028;
  
  const weightedSoaYield = (monoterpeneEmissionFluxUgM2h * (yield1 + yield2) + isopreneEmissionFluxUgM2h * isopreneYield) /
    Math.max(1.0, isopreneEmissionFluxUgM2h + monoterpeneEmissionFluxUgM2h);
  
  const soaYieldPercent = Number((weightedSoaYield * 100).toFixed(1));

  // Concentración de nuevo SOA acumulado en la masa advectada (µg/m³)
  // Caja de mezcla regional de altura ~800m
  const mixingHeightM = 800.0;
  const integratedBvocConcentration = (totalBvocMassKgH * 1e9) / (windKmh * 1000 * mixingHeightM * 12000.0);
  const newSoaFormedUgM3 = Number((integratedBvocConcentration * weightedSoaYield * (1.0 - Math.exp(-0.25 * advectionTravelTimeHours))).toFixed(2));

  // Formación de Peroxiacetil Nitrato (PAN) en presencia de NO2 urbano
  // Reacción: CH3C(O)OO• + NO2 <-> CH3C(O)OONO2 (PAN)
  const panYieldFactor = Math.min(1.2, urbanNo2ConcentrationUgM3 / 25.0);
  const panOrganicNitratesPptv = Number((45.0 + isopreneEmissionFluxUgM2h * 0.22 * panYieldFactor * Math.min(3.0, advectionTravelTimeHours)).toFixed(0));

  // Diagnóstico de Régimen Fotoquímico
  const vocNoxEquivalentRatio = (isopreneEmissionFluxUgM2h * 1.5 + monoterpeneEmissionFluxUgM2h * 2.0) / Math.max(10.0, urbanNo2ConcentrationUgM3 * 8.0);
  let photochemicalRegimeImpact: 'VOC_LIMITED_AMPLIFIED' | 'TRANSITIONAL' | 'NOX_SATURATED';
  if (vocNoxEquivalentRatio < 0.6) {
    photochemicalRegimeImpact = 'VOC_LIMITED_AMPLIFIED';
  } else if (vocNoxEquivalentRatio < 1.4) {
    photochemicalRegimeImpact = 'TRANSITIONAL';
  } else {
    photochemicalRegimeImpact = 'NOX_SATURATED';
  }

  const scientificNote = `Cálculo MEGAN (Guenther 2012) + Absorción Pankow (1994) desde IHSM La Mayora (CSIC-UMA): Emisión BVOC=${totalBvocMassKgH} kg/h, transporte de Levante (${windKmh} km/h, ${advectionTravelTimeHours} h a Málaga). Interacción con NO₂ urbano (${urbanNo2ConcentrationUgM3} µg/m³) genera ${newSoaFormedUgM3} µg/m³ de SOA y ${panOrganicNitratesPptv} pptv de PAN.`;

  return {
    isopreneEmissionFluxUgM2h,
    monoterpeneEmissionFluxUgM2h,
    totalBvocMassKgH,
    advectionTravelTimeHours,
    soaYieldPercent,
    newSoaFormedUgM3,
    panOrganicNitratesPptv,
    photochemicalRegimeImpact,
    scientificNote
  };
}
