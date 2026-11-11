/**
 * =================================================================================================
 * MOTOR CINÉTICO DE QUÍMICA NOCTURNA DEL NO2, RADICAL NITRATO (NO3•), N2O5 Y ClNO2 (TESIS DOCTORAL)
 * =================================================================================================
 * Reacciones Clave Diurnas y Nocturnas (Málaga / Bahía Costera / Cañón Urbano):
 * 
 * 1. Formación Nocturna de NO3•:
 *    NO2 + O3 -> NO3• + O2                            k_NO3(T) = 1.2e-13 * exp(-2450 / T) cm³·molec⁻¹·s⁻¹
 * 
 * 2. Equilibrio Térmico Rápido NO3• / N2O5:
 *    NO3• + NO2 <-> N2O5                              K_eq(T) = 2.7e-27 * exp(11000 / T) cm³·molec⁻¹
 * 
 * 3. Titulación Nocturna por NO Fresco de Tráfico (Destrucción Rápida de NO3•):
 *    NO3• + NO -> 2 NO2                               k_NO3_NO = 2.6e-11 cm³·molec⁻¹·s⁻¹
 * 
 * 4. Oxidación Nocturna de Terpenos Biogénicos (Monte Gibralfaro / Parques):
 *    NO3• + α-Pineno/Limoneno -> Org-NO3 (SOA Nocturno)  k_VOC ~ 6.0e-12 cm³·molec⁻¹·s⁻¹
 * 
 * 5. Captación Heterogénea en Spray Marino de la Bahía (Bertram & Thornton 2009):
 *    N2O5 + NaCl(aq) --γ(N2O5)--> ClNO2(g) + NaNO3(aq)   γ ~ 0.035 - 0.08
 * 
 * 6. Fotólisis Matutina de ClNO2 al Amanecer (Liberación de Cl•):
 *    ClNO2 + hν -> Cl• + NO2                          J_ClNO2 ~ 0.25 * J_NO2
 * 
 * Cero aleatoriedad (Rule 1 & 2 AGENTS.md). 100% Determinista.
 */

export interface NighttimeSpeciesConcentrations {
  no2Ugm3: number;          // [NO2] µg/m³
  noUgm3: number;           // [NO] µg/m³
  o3Ugm3: number;           // [O3] µg/m³
  no3RadicalPpt: number;     // [NO3•] pptv
  n2o5Ppt: number;          // [N2O5] pptv
  clno2Ppt: number;         // [ClNO2] pptv
  hno3Ugm3: number;         // [HNO3] µg/m³
  nighttimeSoaUgM3: number; // [SOA Nocturno] µg/m³
  clRadicalMolecCm3: number; // [Cl•] molec/cm³ matutino
}

export interface NighttimeReactionRates {
  no3ProductionRatePptH: number;      // Tasa de formación de NO3• (ppt/h)
  n2o5FormationRatePptH: number;      // Tasa de formación de N2O5 (ppt/h)
  no3TrafficLossRatePptH: number;     // Pérdida por NO fresco de tráfico (ppt/h)
  no3VocOxidationRatePptH: number;    // Oxidación de monoterpenos (ppt/h)
  n2o5MarineUptakeRatePptH: number;   // Absorción heterogénea en spray salino (ppt/h)
  clno2FormationRatePptH: number;     // Formación de ClNO2 (ppt/h)
  morningClPulseRateMolecCm3S: number; // Pulso matutino de Cl• (molec/cm³·s)
}

export interface DiurnalCycleHourlyPoint {
  hour: number;                  // 0 - 23h
  hourLabel: string;             // "02:00", "08:00", etc.
  isNight: boolean;
  solarRadiationWm2: number;
  no2UgM3: number;
  o3UgM3: number;
  noUgM3: number;
  no3RadicalPpt: number;
  n2o5Ppt: number;
  clno2Ppt: number;
  jNo2PerSec: number;
  jClNO2PerSec: number;
  clRadicalConc: number;        // x10⁴ molec/cm³
}

export interface NighttimeChemistryResult {
  currentSnapshot: NighttimeSpeciesConcentrations;
  reactionRates: NighttimeReactionRates;
  hourlyDiurnalCycle: DiurnalCycleHourlyPoint[];
  
  // Parámetros Diagnósticos
  gammaN2O5Heterogeneous: number;    // Coeficiente γ(N2O5)
  clno2YieldPhi: number;             // Rendimiento molar Φ(ClNO2)
  nighttimeNO2LifetimeHours: number; // Tiempo de vida nocturno de NO2 (h)
  morningOzoneAdvanceMinutes: number;// Adelanto del pico de ozono por Cl• (min)
  dominantNighttimeSink: 'TRAFFIC_NO_TITRATION' | 'MARINE_SPRAY_HET' | 'BIOGENIC_VOC_SOA' | 'DRY_DEPOSITION';
  
  // Metadatos
  timestampIso: string;
  temperatureC: number;
  relativeHumidityPct: number;
  distanceToCoastKm: number;
  marineSaltUgM3: number;
}

export interface ComputeNighttimeChemistryParams {
  no2Ugm3: number;
  o3Ugm3?: number;
  noUgm3?: number;
  temperatureC?: number;
  relativeHumidityPct?: number;
  solarRadiationWm2?: number;
  distanceToCoastKm?: number;
  marineSaltUgM3?: number;
  trafficVehH?: number;
  treeLai?: number;
}

/**
 * Constante cinética k_NO3 para NO2 + O3 -> NO3• + O2
 * Atkinson et al. (2004) IUPAC
 */
export function getKNo2O3RateConstant(tempC: number): number {
  const T = tempC + 273.15;
  return 1.2e-13 * Math.exp(-2450 / T); // cm³·molec⁻¹·s⁻¹
}

/**
 * Constante de equilibrio K_eq(T) para NO3• + NO2 <-> N2O5
 * Seinfeld & Pandis (2016)
 */
export function getN2O5EquilibriumConstant(tempC: number): number {
  const T = tempC + 273.15;
  return 2.7e-27 * Math.exp(11000 / T); // cm³·molec⁻¹
}

/**
 * Coeficiente de acomodación heterogénea γ(N2O5) en aerosol salino marino
 * Bertram & Thornton (2009)
 */
export function computeGammaN2O5(rhPct: number, distCoastKm: number, tempC: number): number {
  const normRh = Math.max(30, Math.min(98, rhPct));
  const coastFactor = Math.exp(-Math.max(0, distCoastKm) / 2.5); // Atenuaciónt con la distancia al mar
  // γ base para NaCl acuoso ~ 0.03 - 0.08
  const baseGamma = 0.035 + (normRh / 100) * 0.025 + (tempC > 25 ? -0.005 : 0.005);
  return Math.max(0.005, Math.min(0.095, baseGamma * (0.3 + 0.7 * coastFactor)));
}

/**
 * Rendimiento molar de ClNO2 Φ(ClNO2)
 * Thornton et al. (2010 Nature)
 */
export function computeClNO2YieldPhi(distCoastKm: number, rhPct: number): number {
  const marineProximity = Math.exp(-Math.max(0, distCoastKm) / 3.0);
  // En ambiente costero de Málaga, Φ(ClNO2) suele oscilar entre 0.4 y 0.85
  return Math.max(0.05, Math.min(0.92, 0.20 + 0.68 * marineProximity * (rhPct / 80)));
}

/**
 * Ejecuta el cálculo integral determinista de Química Nocturna del NO2
 */
export function computeNO2NighttimeChemistry(params: ComputeNighttimeChemistryParams): NighttimeChemistryResult {
  const no2 = Math.max(0.5, params.no2Ugm3);
  const o3 = Math.max(1.0, params.o3Ugm3 ?? 48.0);
  const no = Math.max(0.05, params.noUgm3 ?? (no2 * 0.15));
  const tempC = params.temperatureC ?? 20.0;
  const rhPct = Math.max(20, Math.min(100, params.relativeHumidityPct ?? 70.0));
  const solarRad = Math.max(0, params.solarRadiationWm2 ?? 0);
  const distCoast = Math.max(0.1, params.distanceToCoastKm ?? 1.2);
  const seaSalt = Math.max(0.1, params.marineSaltUgM3 ?? (distCoast < 3.0 ? 5.5 * Math.exp(-distCoast / 1.5) : 0.5));
  const vehH = Math.max(20, params.trafficVehH ?? 850);
  const lai = Math.max(0.1, params.treeLai ?? 1.2);

  const isNight = solarRad < 10;
  const T = tempC + 273.15;

  // Conversiones de concentración (µg/m³ -> molec/cm³ y pptv)
  // Factores a 298K: 1 ppb NO2 ~ 2.46e10 molec/cm³, 1 µg/m³ NO2 ~ 1.31e10 molec/cm³
  const no2MolecCm3 = no2 * 1.31e10;
  const o3MolecCm3 = o3 * 1.25e10;
  const noMolecCm3 = no * 2.0e10;

  // 1. Tasa de formación nocturna de NO3•: d[NO3•]/dt = k_NO3 * [NO2] * [O3]
  const k_no3 = getKNo2O3RateConstant(tempC);
  const rateNO3_molec_cm3_s = k_no3 * no2MolecCm3 * o3MolecCm3;
  // Conversión a ppt/h (1 ppt ~ 2.46e7 molec/cm³)
  const rateNO3_ppt_h = (rateNO3_molec_cm3_s / 2.46e7) * 3600;

  // 2. Pérdida nocturna por titulación con NO fresco vehicular: NO3• + NO -> 2 NO2
  const k_no3_no = 2.6e-11; // cm³·molec⁻¹·s⁻¹
  const lossNO3_traffic_molec_s = k_no3_no * noMolecCm3;
  const lossNO3_traffic_ppt_h = (lossNO3_traffic_molec_s * 20 / 2.46e7) * 3600;

  // 3. Reacción con COVs biogénicos (Monoterpenos de Gibralfaro / Parques): NO3• + VOC -> Org-NO3
  const vocConcMolecCm3 = Math.max(1e9, lai * 2.5e9);
  const k_no3_voc = 6.0e-12; // cm³·molec⁻¹·s⁻¹
  const lossNO3_voc_molec_s = k_no3_voc * vocConcMolecCm3;
  const lossNO3_voc_ppt_h = (lossNO3_voc_molec_s * 15 / 2.46e7) * 3600;

  // 4. Concentración cuasi-estacionaria de NO3• en pptv
  // [NO3•]_ss = P(NO3•) / (k_NO3_NO[NO] + k_NO3_VOC[VOC] + k_eq_N2O5)
  const totalNO3LossRateS = lossNO3_traffic_molec_s + lossNO3_voc_molec_s + 0.002;
  const no3SsMolecCm3 = isNight ? (rateNO3_molec_cm3_s / Math.max(1e-4, totalNO3LossRateS)) : (rateNO3_molec_cm3_s / 0.015);
  const no3SsPpt = Math.max(0.1, Math.min(180, no3SsMolecCm3 / 2.46e7));

  // 5. Equilibrio N2O5: [N2O5] = K_eq(T) * [NO2] * [NO3•]
  const k_eq = getN2O5EquilibriumConstant(tempC);
  const n2o5MolecCm3 = isNight ? (k_eq * no2MolecCm3 * no3SsMolecCm3) : (no3SsMolecCm3 * 0.1);
  const n2o5Ppt = Math.max(0.1, Math.min(450, n2o5MolecCm3 / 2.46e7));

  // 6. Absorción Heterogénea en Spray Marino (N2O5 + NaCl -> ClNO2)
  const gammaN2O5 = computeGammaN2O5(rhPct, distCoast, tempC);
  const phiClNO2 = computeClNO2YieldPhi(distCoast, rhPct);
  // Área superficial de aerosol S_a (µm²/cm³): función de sal marina
  const saAerosolUm2Cm3 = Math.max(20, seaSalt * 18.5);
  // Constante pseudo-primer orden k_het = (1/4) * c_bar * S_a * γ
  const cBarN2O5Ms = Math.sqrt((8 * 8.314 * T) / (Math.PI * 0.108)); // Velocidad molecular media N2O5 ~ 240 m/s
  const kHetPerSec = 0.25 * (cBarN2O5Ms * 100) * (saAerosolUm2Cm3 * 1e-8) * gammaN2O5;
  const rateN2O5_het_ppt_h = (kHetPerSec * n2o5Ppt * 3600);
  const rateClNO2_ppt_h = rateN2O5_het_ppt_h * phiClNO2;

  // Acumulación nocturna de ClNO2 (pptv) durante ~8h de noche
  const accumulatedClNO2Ppt = isNight 
    ? Math.max(5, Math.min(1250, rateClNO2_ppt_h * 4.5))
    : Math.max(1, rateClNO2_ppt_h * 0.5);

  // Pulso matutino de radicales Cl• al amanecer
  const jClNO2 = !isNight ? Math.max(1e-5, (solarRad / 1000) * 0.0022) : 0;
  const morningClFluxMolecCm3S = jClNO2 * (accumulatedClNO2Ppt * 2.46e7);
  const clRadicalConcMolecCm3 = !isNight ? Math.max(1e3, morningClFluxMolecCm3S * 120) : 0;

  // Tiempo de vida nocturno de NO2 (horas)
  const no2LossRateS = (rateNO3_molec_cm3_s) / Math.max(1e4, no2MolecCm3);
  const no2LifetimeHours = no2LossRateS > 0 ? (1 / no2LossRateS) / 3600 : 12;

  // Adelanto del pico de ozono matinal debido a la fotólisis de ClNO2
  const morningOzoneAdvanceMin = Math.round(15 + (accumulatedClNO2Ppt / 1000) * 45);

  // Determinación del sumidero nocturno dominante
  let dominantSink: 'TRAFFIC_NO_TITRATION' | 'MARINE_SPRAY_HET' | 'BIOGENIC_VOC_SOA' | 'DRY_DEPOSITION' = 'MARINE_SPRAY_HET';
  if (lossNO3_traffic_ppt_h > rateN2O5_het_ppt_h && lossNO3_traffic_ppt_h > lossNO3_voc_ppt_h) {
    dominantSink = 'TRAFFIC_NO_TITRATION';
  } else if (lossNO3_voc_ppt_h > rateN2O5_het_ppt_h) {
    dominantSink = 'BIOGENIC_VOC_SOA';
  } else {
    dominantSink = 'MARINE_SPRAY_HET';
  }

  // Generación de Serie Temporal Nictemeral Diurna-Nocturna (24 horas)
  const hourlyDiurnalCycle: DiurnalCycleHourlyPoint[] = Array.from({ length: 24 }, (_, h) => {
    const isHrNight = h < 7 || h >= 21;
    const hourRad = isHrNight ? 0 : Math.sin(((h - 7) / 14) * Math.PI) * 750;
    
    // Perfil determinista de NO2 con pico matutino (08:00) y vespertino (21:00)
    const trafficFactor = (h === 8 || h === 20) ? 1.45 : (h >= 1 && h <= 5) ? 0.45 : 1.0;
    const hrNO2 = Number((no2 * (0.8 + 0.4 * trafficFactor)).toFixed(1));
    const hrO3 = Number((isHrNight ? Math.max(12, o3 * 0.6) : Math.min(110, o3 * (0.9 + (hourRad / 750) * 0.8))).toFixed(1));
    const hrNO = Number((isHrNight ? Math.max(0.5, no * 0.8) : Math.max(1.0, no * (0.5 + trafficFactor * 0.7))).toFixed(1));
    
    // Cálculo horario de NO3• y N2O5
    const hrNO3Ppt = isHrNight 
      ? Number((Math.max(1.0, (hrNO2 * hrO3 * 0.08) / (1 + hrNO * 0.15))).toFixed(1))
      : Number((0.2 * Math.exp(-hourRad / 200)).toFixed(2));
      
    const hrN2O5Ppt = isHrNight
      ? Number((hrNO3Ppt * hrNO2 * 0.35).toFixed(1))
      : Number((hrNO3Ppt * 0.1).toFixed(2));

    // ClNO2 se acumula de noche y se fotoliza rápidamente entre las 07:00 y las 11:00
    let hrClNO2Ppt = 0;
    if (isHrNight) {
      const nightHoursElapsed = h < 7 ? (h + 3) : (h - 21);
      hrClNO2Ppt = Number((Math.min(950, 45 + nightHoursElapsed * 85 * (1 - distCoast / 5.0))).toFixed(1));
    } else if (h >= 7 && h <= 12) {
      const decayFactor = Math.exp(-(h - 6) * 0.65);
      hrClNO2Ppt = Number((850 * decayFactor).toFixed(1));
    } else {
      hrClNO2Ppt = 2.5;
    }

    const hrJNo2 = hourRad > 0 ? (hourRad / 1000) * 0.0085 : 0;
    const hrJClNO2 = hourRad > 0 ? (hourRad / 1000) * 0.0021 : 0;
    const hrClRadical = (h >= 7 && h <= 11) ? Number(((hrClNO2Ppt * hrJClNO2 * 100).toFixed(1))) : 0;

    return {
      hour: h,
      hourLabel: `${h.toString().padStart(2, '0')}:00`,
      isNight: isHrNight,
      solarRadiationWm2: Number(hourRad.toFixed(0)),
      no2UgM3: hrNO2,
      o3UgM3: hrO3,
      noUgM3: hrNO,
      no3RadicalPpt: hrNO3Ppt,
      n2o5Ppt: hrN2O5Ppt,
      clno2Ppt: hrClNO2Ppt,
      jNo2PerSec: Number(hrJNo2.toFixed(6)),
      jClNO2PerSec: Number(hrJClNO2.toFixed(6)),
      clRadicalConc: hrClRadical
    };
  });

  return {
    currentSnapshot: {
      no2Ugm3: Number(no2.toFixed(1)),
      noUgm3: Number(no.toFixed(1)),
      o3Ugm3: Number(o3.toFixed(1)),
      no3RadicalPpt: Number(no3SsPpt.toFixed(1)),
      n2o5Ppt: Number(n2o5Ppt.toFixed(1)),
      clno2Ppt: Number(accumulatedClNO2Ppt.toFixed(1)),
      hno3Ugm3: Number((rateN2O5_het_ppt_h * 0.0026).toFixed(2)),
      nighttimeSoaUgM3: Number((lossNO3_voc_ppt_h * 0.0042).toFixed(2)),
      clRadicalMolecCm3: Number(clRadicalConcMolecCm3.toFixed(0))
    },
    reactionRates: {
      no3ProductionRatePptH: Number(rateNO3_ppt_h.toFixed(1)),
      n2o5FormationRatePptH: Number((rateNO3_ppt_h * 0.85).toFixed(1)),
      no3TrafficLossRatePptH: Number(lossNO3_traffic_ppt_h.toFixed(1)),
      no3VocOxidationRatePptH: Number(lossNO3_voc_ppt_h.toFixed(1)),
      n2o5MarineUptakeRatePptH: Number(rateN2O5_het_ppt_h.toFixed(1)),
      clno2FormationRatePptH: Number(rateClNO2_ppt_h.toFixed(1)),
      morningClPulseRateMolecCm3S: Number(morningClFluxMolecCm3S.toFixed(1))
    },
    hourlyDiurnalCycle,
    gammaN2O5Heterogeneous: Number(gammaN2O5.toFixed(4)),
    clno2YieldPhi: Number(phiClNO2.toFixed(3)),
    nighttimeNO2LifetimeHours: Number(no2LifetimeHours.toFixed(1)),
    morningOzoneAdvanceMinutes: morningOzoneAdvanceMin,
    dominantNighttimeSink: dominantSink,
    timestampIso: new Date().toISOString(),
    temperatureC: Number(tempC.toFixed(1)),
    relativeHumidityPct: Number(rhPct.toFixed(0)),
    distanceToCoastKm: Number(distCoast.toFixed(2)),
    marineSaltUgM3: Number(seaSalt.toFixed(1))
  };
}
