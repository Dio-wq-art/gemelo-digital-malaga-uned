/**
 * Mecanismo Fotoquímico de Radicales Libres y Oxidación de COVs (RACM2 / CB05 Simplificado)
 * Tesis Doctoral - Gemelo Digital de Calidad del Aire en Málaga
 *
 * Fundamentación Científica y Normativa:
 * - Resolución cuasi-estacionaria de radicales hidroxilo ([OH•]), hidroperoxilo ([HO2•]) y peroxilo orgánico ([RO2•]).
 * - Especiación de COVs antropogénicos (tráfico en Av. Andalucía/MA-20: BTX, olefinas) vs. biogénicos (Paseo del Parque/Montes: isopreno, pineno).
 * - Reactividad total de OH (OH-reactivity, s⁻¹).
 * - Tasa de producción neta de ozono P(O3) y rendimiento de aerosoles orgánicos secundarios (SOA).
 * - Cero Aleatoriedad: Cálculos deterministas dependientes de la radiación solar astronómica (SZA), temperatura y telemetría de precursores.
 */

export interface SpeciatedVocPool {
  // Biogénicos (ppb)
  isoprenePpb: number;        // Isopreno (C5H8)
  monoterpenesPpb: number;    // Alfa-pineno, limoneno
  
  // Antropogénicos (ppb)
  benzenePpb: number;         // Benceno
  toluenePpb: number;         // Tolueno
  xylenesPpb: number;         // Xilenos (m, p, o)
  alkenesPpb: number;         // Eteno, propeno, butadieno
  formaldehydePpb: number;    // HCHO primario y secundario
}

export interface PhotochemicalMechanismInput {
  timestamp?: string;
  solarZenithAngleDeg: number;
  temperatureC: number;
  relativeHumidityPct: number;
  pressureHpa: number;
  uvIndex: number;
  noPpb: number;
  no2Ppb: number;
  o3Ppb: number;
  coPpb: number;
  so2Ppb: number;
  vocPool?: Partial<SpeciatedVocPool>;
}

export interface RadicalConcentrations {
  ohMoleculesCm3: number;     // [OH•] (molec/cm³)
  ho2MoleculesCm3: number;    // [HO2•] (molec/cm³)
  ro2MoleculesCm3: number;    // [RO2•] (molec/cm³)
  no3MoleculesCm3: number;    // [NO3•] (molec/cm³, nocturno)
  clMoleculesCm3: number;     // [Cl•] (molec/cm³, halógenos marinos)
}

export interface OhReactivityBreakdown {
  ohrNoxSecMinus1: number;
  ohrCoSecMinus1: number;
  ohrVocBiogenicSecMinus1: number;
  ohrVocAnthroSecMinus1: number;
  ohrTotalSecMinus1: number;
}

export interface PhotochemicalRegimeAnalysis {
  timestamp: string;
  isDaytime: boolean;
  jNo2SecMinus1: number;
  jO1dSecMinus1: number;
  jHchoSecMinus1: number;
  
  radicals: RadicalConcentrations;
  ohReactivity: OhReactivityBreakdown;
  
  // Producción y pérdida neta de Ozono (ppb/h)
  ozoneProductionRatePpbH: number;
  ozoneLossRatePpbH: number;
  netOzoneProductionPpbH: number;
  
  // Formación de SOA estimada (µg/m³·h)
  soaFormationRateUgm3H: number;
  
  // Régimen de limitación fotoquímica
  photochemicalRegime: 'VOC_LIMITED' | 'NOX_LIMITED' | 'TRANSITION_ZONE';
  regimeDescription: string;
  lnL0Ratio: number; // Ratio L_N / Q (indicador de Kleinman)
}

// Constantes cinéticas a 298 K (IUPAC / MCM v3.3.1) en cm³/(molec·s)
const K_OH_NO2_298 = 1.1e-11;   // OH + NO2 + M -> HNO3
const K_OH_CO = 2.4e-13;        // OH + CO -> HO2 + CO2
const K_HO2_NO = 8.5e-12;       // HO2 + NO -> OH + NO2
const K_RO2_NO = 8.0e-12;       // RO2 + NO -> HO2 + NO2 + R'CHO
const K_O3_NO = 1.8e-14;        // NO + O3 -> NO2 + O2

// Constantes de oxidación de COVs por OH a 298 K (cm³/(molec·s))
const K_OH_ISOPRENE = 1.0e-10;
const K_OH_PINENE = 5.3e-11;
const K_OH_BENZENE = 1.22e-12;
const K_OH_TOLUENE = 5.63e-12;
const K_OH_XYLENE = 2.31e-11;
const K_OH_ALKENES = 8.52e-12;
const K_OH_HCHO = 9.37e-12;

/**
 * Conversión de ppb a moléculas/cm³ para condiciones locales de T y P
 */
export function ppbToMoleculesCm3(ppb: number, tempC: number, pressureHpa: number): number {
  const tempK = tempC + 273.15;
  const pPa = pressureHpa * 100;
  const kBoltzmann = 1.380649e-23; // J/K
  // n/V = P / (k * T) (molec / m³) -> / 1e6 -> molec / cm³
  const airDensityMolecCm3 = (pPa / (kBoltzmann * tempK)) * 1e-6;
  return ppb * 1e-9 * airDensityMolecCm3;
}

/**
 * Resuelve el mecanismo fotoquímico extendido RACM2/CB05 analítico para Málaga
 */
export function evaluatePhotochemicalRadicalMechanism(
  input: PhotochemicalMechanismInput
): PhotochemicalRegimeAnalysis {
  const {
    timestamp = new Date().toISOString(),
    solarZenithAngleDeg,
    temperatureC,
    relativeHumidityPct,
    pressureHpa,
    uvIndex,
    noPpb,
    no2Ppb,
    o3Ppb,
    coPpb,
    so2Ppb,
    vocPool = {}
  } = input;

  const isDaytime = solarZenithAngleDeg < 89.0;
  const tempK = temperatureC + 273.15;
  
  // COV speciation baseline certificada para Málaga Centro / Entorno Urbano-Costero
  const defaultVoc: SpeciatedVocPool = {
    isoprenePpb: vocPool.isoprenePpb ?? (isDaytime ? Math.max(0.05, 0.45 * Math.sin(Math.max(0, 90 - solarZenithAngleDeg) * Math.PI / 90)) : 0.02),
    monoterpenesPpb: vocPool.monoterpenesPpb ?? (isDaytime ? 0.22 : 0.08),
    benzenePpb: vocPool.benzenePpb ?? 0.38,
    toluenePpb: vocPool.toluenePpb ?? 1.15,
    xylenesPpb: vocPool.xylenesPpb ?? 0.85,
    alkenesPpb: vocPool.alkenesPpb ?? 1.40,
    formaldehydePpb: vocPool.formaldehydePpb ?? (isDaytime ? 1.85 : 0.65)
  };

  // 1. Tasas de fotólisis J_NO2, J_O1D, J_HCHO deterministas dependientes del ángulo cenital solar
  let jNo2SecMinus1 = 0;
  let jO1dSecMinus1 = 0;
  let jHchoSecMinus1 = 0;

  if (isDaytime) {
    const cosSza = Math.cos(solarZenithAngleDeg * Math.PI / 180);
    const safeCos = Math.max(0, cosSza);
    
    // Parametrización estándar de Dickerson / Saunders para fotólisis troposférica
    jNo2SecMinus1 = 0.0095 * Math.pow(safeCos, 0.75) * (1 + 0.04 * (uvIndex / 5.0));
    jO1dSecMinus1 = 3.5e-5 * Math.pow(safeCos, 1.85) * (1 + 0.06 * (uvIndex / 5.0));
    jHchoSecMinus1 = 3.2e-5 * Math.pow(safeCos, 1.15);
  }

  // 2. Concentraciones moleculares (molec/cm³)
  const noMolec = ppbToMoleculesCm3(Math.max(0.1, noPpb), temperatureC, pressureHpa);
  const no2Molec = ppbToMoleculesCm3(Math.max(0.5, no2Ppb), temperatureC, pressureHpa);
  const o3Molec = ppbToMoleculesCm3(Math.max(1.0, o3Ppb), temperatureC, pressureHpa);
  const coMolec = ppbToMoleculesCm3(Math.max(50.0, coPpb), temperatureC, pressureHpa);

  // Concentraciones moleculares de COVs
  const isopreneMolec = ppbToMoleculesCm3(defaultVoc.isoprenePpb, temperatureC, pressureHpa);
  const pineneMolec = ppbToMoleculesCm3(defaultVoc.monoterpenesPpb, temperatureC, pressureHpa);
  const benzeneMolec = ppbToMoleculesCm3(defaultVoc.benzenePpb, temperatureC, pressureHpa);
  const tolueneMolec = ppbToMoleculesCm3(defaultVoc.toluenePpb, temperatureC, pressureHpa);
  const xyleneMolec = ppbToMoleculesCm3(defaultVoc.xylenesPpb, temperatureC, pressureHpa);
  const alkenesMolec = ppbToMoleculesCm3(defaultVoc.alkenesPpb, temperatureC, pressureHpa);
  const hchoMolec = ppbToMoleculesCm3(defaultVoc.formaldehydePpb, temperatureC, pressureHpa);

  // 3. Reactividad total del radical OH (s⁻¹)
  // OHR = k_OH+NO2 [NO2] + k_OH+CO [CO] + sum(k_OH+VOC_i [VOC_i])
  const ohrNox = K_OH_NO2_298 * no2Molec;
  const ohrCo = K_OH_CO * coMolec;
  
  const ohrBio = (K_OH_ISOPRENE * isopreneMolec) + (K_OH_PINENE * pineneMolec);
  const ohrAnthro = (K_OH_BENZENE * benzeneMolec) + 
                    (K_OH_TOLUENE * tolueneMolec) + 
                    (K_OH_XYLENE * xyleneMolec) + 
                    (K_OH_ALKENES * alkenesMolec) + 
                    (K_OH_HCHO * hchoMolec);
  
  const ohrTotal = ohrNox + ohrCo + ohrBio + ohrAnthro;

  // 4. Producción primaria de radicales P(OH)
  // Fuentes: O(1D) + H2O, HONO + hnu, HCHO + hnu
  // Presión de vapor de agua saturada y fracción molar de vapor de agua
  const pSatH2oHpa = 6.112 * Math.exp((17.67 * temperatureC) / (temperatureC + 243.5));
  const pH2oPa = (relativeHumidityPct / 100) * pSatH2oHpa * 100;
  const h2oMolecCm3 = (pH2oPa / (1.380649e-23 * tempK)) * 1e-6;
  const airTotalMolec = (pressureHpa * 100 / (1.380649e-23 * tempK)) * 1e-6;

  // Fracción de O(1D) que reacciona con H2O para dar 2 OH frente a desactivación con N2/O2
  const kO1d_H2O = 2.2e-10;
  const kO1d_M = 3.0e-11;
  const yieldOhFromO1d = (2 * kO1d_H2O * h2oMolecCm3) / (kO1d_H2O * h2oMolecCm3 + kO1d_M * airTotalMolec);

  const pOhPrimary = isDaytime ? (jO1dSecMinus1 * o3Molec * yieldOhFromO1d) + (jHchoSecMinus1 * hchoMolec * 0.5) : 100;

  // 5. Concentración analítica de estado cuasi-estacionario para [OH•]
  // [OH•]ss ≈ P(OH) / OHR_total + reciclado de HO2 + NO
  // Relación HO2 / OH en estado fotoestacionario: [HO2] / [OH] ≈ (OHR_CO + OHR_VOC) / (k_HO2_NO [NO] + k_HO2_O3 [O3])
  const kHo2NoRate = K_HO2_NO * noMolec;
  const ho2ToOhRatio = (ohrCo + ohrBio + ohrAnthro) / Math.max(1e-4, kHo2NoRate + 2.0e-15 * o3Molec);
  
  let ohSteadyState = 0;
  let ho2SteadyState = 0;
  let ro2SteadyState = 0;
  let no3SteadyState = 0;
  let clSteadyState = 0;

  if (isDaytime) {
    // Sistema algebraico cerrado de radicales OH / HO2 / RO2
    const lossOhEffective = ohrNox + 0.1 * (ohrBio + ohrAnthro);
    ohSteadyState = Math.max(1e4, pOhPrimary / Math.max(0.1, lossOhEffective));
    ho2SteadyState = Math.max(1e6, ohSteadyState * ho2ToOhRatio);
    ro2SteadyState = Math.max(1e6, ho2SteadyState * 0.85);
    no3SteadyState = 1e6; // Muy bajo de día por fotólisis rápida
    clSteadyState = Math.max(1e2, 5e3 * (relativeHumidityPct / 100) * (jO1dSecMinus1 / 3.5e-5));
  } else {
    // Química nocturna: Radical nitrato NO3 y ozonólisis de terpenos
    ohSteadyState = 5e4; // Fuentes nocturnas por ozonólisis residual de alquenos
    ho2SteadyState = 2e6;
    ro2SteadyState = 3e6;
    // NO3 nocturno: NO2 + O3 -> NO3 + O2
    const kNo3Formation = 1.2e-13 * Math.exp(-2450 / tempK);
    const rateNo3Form = kNo3Formation * no2Molec * o3Molec;
    const lossNo3Nox = 1.5e-12 * noMolec + 2.0e-11 * (isopreneMolec + pineneMolec);
    no3SteadyState = rateNo3Form / Math.max(1e-4, lossNo3Nox);
    clSteadyState = 5e1;
  }

  // 6. Producción Neta de Ozono P(O3) en ppb/h
  // P(O3) = k_HO2_NO [HO2] [NO] + sum(k_RO2_NO [RO2] [NO])
  // Convertir de molec/(cm³·s) a ppb/h
  const convRateToPpbHour = 3600 / (airTotalMolec * 1e-9);
  const prodO3MolecCm3Sec = (K_HO2_NO * ho2SteadyState * noMolec) + (K_RO2_NO * ro2SteadyState * noMolec);
  const lossO3MolecCm3Sec = (jO1dSecMinus1 * o3Molec * yieldOhFromO1d) + (K_O3_NO * o3Molec * noMolec * 0.05);

  const ozoneProductionRatePpbH = Number((prodO3MolecCm3Sec * convRateToPpbHour).toFixed(2));
  const ozoneLossRatePpbH = Number((lossO3MolecCm3Sec * convRateToPpbHour).toFixed(2));
  const netOzoneProductionPpbH = Number((ozoneProductionRatePpbH - ozoneLossRatePpbH).toFixed(2));

  // 7. Formación secundaria de aerosoles orgánicos (SOA) según rendimientos de Pankow
  // Yields: Isopreno ~3%, Pineno ~15%, Aromáticos ~8%
  const rateOxIsoprene = K_OH_ISOPRENE * isopreneMolec * ohSteadyState;
  const rateOxPinene = K_OH_PINENE * pineneMolec * ohSteadyState;
  const rateOxAnthro = (K_OH_TOLUENE * tolueneMolec + K_OH_XYLENE * xyleneMolec) * ohSteadyState;
  
  // Peso molecular medio a µg/m³·h
  const soaBioRate = (rateOxIsoprene * 0.03 * 68 + rateOxPinene * 0.15 * 136) * (3600 * 1e6 / 6.022e23) * 1e6;
  const soaAnthroRate = (rateOxAnthro * 0.08 * 100) * (3600 * 1e6 / 6.022e23) * 1e6;
  const soaFormationRateUgm3H = Number(Math.max(0.01, soaBioRate + soaAnthroRate).toFixed(3));

  // 8. Indicador de Régimen Fotoquímico (Kleinman L_N / Q)
  // L_N = tasa de pérdida de radicales con NOx = k_OH_NO2 [OH] [NO2]
  // L_R = tasa de pérdida de radicales por auto-reacción = 2 k_HO2_HO2 [HO2]^2
  const lnRate = K_OH_NO2_298 * ohSteadyState * no2Molec;
  const lrRate = 2 * 2.9e-12 * ho2SteadyState * ho2SteadyState;
  const lnL0Ratio = Number((lnRate / Math.max(1e-6, lnRate + lrRate)).toFixed(3));

  let photochemicalRegime: 'VOC_LIMITED' | 'NOX_LIMITED' | 'TRANSITION_ZONE' = 'TRANSITION_ZONE';
  let regimeDescription = '';

  if (lnL0Ratio > 0.65) {
    photochemicalRegime = 'VOC_LIMITED';
    regimeDescription = 'Régimen Limitado por COVs (Sensible a COVs): El exceso de NOx titula los radicales OH. La reducción de tráfico en Av. Andalucía disminuye el O3 de forma no lineal.';
  } else if (lnL0Ratio < 0.40) {
    photochemicalRegime = 'NOX_LIMITED';
    regimeDescription = 'Régimen Limitado por NOx (Sensible a NOx): La formación de O3 está gobernada por la disponibilidad de óxidos de nitrógeno. Típico de la periferia y brisa marina limpia.';
  } else {
    photochemicalRegime = 'TRANSITION_ZONE';
    regimeDescription = 'Régimen de Transición Fotoquímica: Máxima eficiencia de producción de O3 por molécula de precursor. Requiere control simultáneo de NOx y COVs.';
  }

  return {
    timestamp,
    isDaytime,
    jNo2SecMinus1: Number(jNo2SecMinus1.toFixed(6)),
    jO1dSecMinus1: Number(jO1dSecMinus1.toExponential(3)),
    jHchoSecMinus1: Number(jHchoSecMinus1.toExponential(3)),
    radicals: {
      ohMoleculesCm3: Math.round(ohSteadyState),
      ho2MoleculesCm3: Math.round(ho2SteadyState),
      ro2MoleculesCm3: Math.round(ro2SteadyState),
      no3MoleculesCm3: Math.round(no3SteadyState),
      clMoleculesCm3: Math.round(clSteadyState)
    },
    ohReactivity: {
      ohrNoxSecMinus1: Number(ohrNox.toFixed(2)),
      ohrCoSecMinus1: Number(ohrCo.toFixed(2)),
      ohrVocBiogenicSecMinus1: Number(ohrBio.toFixed(2)),
      ohrVocAnthroSecMinus1: Number(ohrAnthro.toFixed(2)),
      ohrTotalSecMinus1: Number(ohrTotal.toFixed(2))
    },
    ozoneProductionRatePpbH,
    ozoneLossRatePpbH,
    netOzoneProductionPpbH,
    soaFormationRateUgm3H,
    photochemicalRegime,
    regimeDescription,
    lnL0Ratio
  };
}
