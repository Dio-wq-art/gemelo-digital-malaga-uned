/**
 * Microfísica de Aerosoles en Plumas de Emisión Portuaria y Activación Köhler CCN.
 * Nucleación binaria H2SO4-H2O, coagulación de hollín, crecimiento higroscópico y teoría kappa-Köhler (Petters & Kreidenweis, 2007).
 * Tesis Doctoral: Gemelo Digital de Málaga.
 */

export interface ShipEngineProfile {
  id: string;
  name: string;
  shipType: string;
  typicalBerthInMalaga: string;
  enginePowerKw: number;
  exhaustFlowM3S: number;
  stackHeightM: number;
  defaultFuelSulfurPct: number; // % azufre en combustible (0.1% Med-ECA vs 0.5% Global)
  defaultSootPrimaryMgM3: number; // Hollín primario / Black Carbon
  opsShorePowerAvailable: boolean; // Conexión eléctrica en muelle (OPS)
}

export const MALAGA_PORT_SHIPS: ShipEngineProfile[] = [
  {
    id: 'mega_cruise',
    name: 'Mega-Crucero Turístico (5.000 pax)',
    shipType: 'Crucero Internacional',
    typicalBerthInMalaga: 'Muelle de Levante / Terminal de Cruceros',
    enginePowerKw: 48000,
    exhaustFlowM3S: 180,
    stackHeightM: 52,
    defaultFuelSulfurPct: 0.10, // Med-ECA compliant MGO
    defaultSootPrimaryMgM3: 45.0,
    opsShorePowerAvailable: true
  },
  {
    id: 'fast_ferry_melilla',
    name: 'Fast Ferry Málaga - Melilla',
    shipType: 'Ferry Ro-Pax de Alta Velocidad',
    typicalBerthInMalaga: 'Estación Marítima / Muelle 3',
    enginePowerKw: 28000,
    exhaustFlowM3S: 110,
    stackHeightM: 28,
    defaultFuelSulfurPct: 0.10,
    defaultSootPrimaryMgM3: 35.0,
    opsShorePowerAvailable: false
  },
  {
    id: 'container_feeder',
    name: 'Portacontenedores / Buque Mercante',
    shipType: 'Carga General / Contenedores',
    typicalBerthInMalaga: 'Muelle 9 (Dique de Poniente / Noatum)',
    enginePowerKw: 18000,
    exhaustFlowM3S: 75,
    stackHeightM: 35,
    defaultFuelSulfurPct: 0.10,
    defaultSootPrimaryMgM3: 50.0,
    opsShorePowerAvailable: false
  },
  {
    id: 'harbor_tug',
    name: 'Remolcador Portuario de Maniobra',
    shipType: 'Servicio Portuario',
    typicalBerthInMalaga: 'Dársena de Guadiaro / Muelle 2',
    enginePowerKw: 4500,
    exhaustFlowM3S: 22,
    stackHeightM: 14,
    defaultFuelSulfurPct: 0.10,
    defaultSootPrimaryMgM3: 25.0,
    opsShorePowerAvailable: false
  }
];

export interface ShipPlumeInput {
  shipId: string;
  engineLoadPct: number; // Carga del motor (10% en atraque auxiliar a 85% en maniobra)
  fuelSulfurPct: number; // 0.001% (OPS/Gas), 0.1% (ECA), 0.5% (Global IMO), 1.5% (HFO no conforme)
  windSpeedMS: number; // Velocidad del viento para dilución
  ambientTempC: number;
  relativeHumidityPct: number;
  downwindDistanceM: number; // Distancia a sotavento hacia el Centro/La Farola (m)
  supersaturationPct: number; // Sobresaturación de vapor de agua para activación CCN (ej. 0.2% a 0.8%)
}

export interface ParticleSizeBin {
  diameterNm: number;
  dNdlogDp: number; // Concentración normalizada [cm⁻³]
  volumeUm3Cm3: number;
}

export interface ShipPlumeSimulationResult {
  ship: ShipEngineProfile;
  // Emisiones primarias de chimenea (Stack exit)
  so2EmissionRateGS: number; // Tasa de emisión de SO2 [g/s]
  sootEmissionRateGS: number; // Hollín / Black Carbon [g/s]
  h2so4NucleationPrecursorPpt: number;

  // Parámetros de Pluma en el punto de impacto (Downwind)
  plumeDilutionFactor: number;
  so2DownwindUgm3: number;
  blackCarbonDownwindUgm3: number;
  totalParticleNumberCm3: number; // N_tot [partículas / cm³]
  geometricMeanDiameterNm: number; // D_pg [nm]

  // Espectro de Tamaño dN/dlog(Dp)
  sizeDistribution: ParticleSizeBin[];

  // Higroscopicidad kappa-Köhler y Activación CCN
  effectiveKappa: number; // κ del aerosol envejecido (0.1 hollín puro a 0.7 sulfatos)
  criticalDryDiameterNm: number; // D_pc diámetro seco crítico a la sobresaturación dada
  ccnNumberConcentrationCm3: number; // N_CCN [cm⁻³]
  activatedFractionCCN: number; // N_CCN / N_tot (0 a 1)

  // Penetración en la ZBE y Fachada Litoral
  urbanPenetrationLevel: 'low_negligible' | 'moderate' | 'high_critical';
  mitigationVerdict: string;
}

/**
 * Resuelve la microfísica de nucleación, coagulación y teoría kappa-Köhler.
 */
export function simulateShipPlumeMicrophysics(input: ShipPlumeInput): ShipPlumeSimulationResult {
  const ship = MALAGA_PORT_SHIPS.find(s => s.id === input.shipId) || MALAGA_PORT_SHIPS[0];

  const loadFrac = Math.max(0.1, Math.min(1.0, input.engineLoadPct / 100));
  const activePowerKw = ship.enginePowerKw * loadFrac;

  // 1. Tasa de Emisión de SO2 y Hollín (g/s)
  // Consumo específico de combustible ~200 g/kWh
  const fuelConsumptionKgS = (activePowerKw * 0.200) / 3600;
  // SO2 = 2 * (S_frac) * Fuel_rate
  const so2EmissionRateGS = fuelConsumptionKgS * (input.fuelSulfurPct / 100) * 2 * 1000;
  const sootEmissionRateGS = (ship.defaultSootPrimaryMgM3 / 1000) * ship.exhaustFlowM3S * loadFrac;

  // Precursor H2SO4 por conversión catalítica en chimenea (~1.5% del SO2 se oxida a SO3/H2SO4)
  const h2so4NucleationPrecursorPpt = Math.max(0.1, so2EmissionRateGS * 15 * (input.relativeHumidityPct / 50));

  // 2. Modelo de Dilución y Dispersión de Pluma hacia la Costa de Málaga
  // Dilution(x) = (1 + x / x0)^alpha
  const x = Math.max(10, input.downwindDistanceM);
  const u_wind = Math.max(0.8, input.windSpeedMS);
  const x0 = 15; // Escala de mezcla inicial de chorro
  const plumeDilutionFactor = Math.pow(1 + x / x0, 1.45) * (u_wind / 2.0);

  const so2DownwindUgm3 = (so2EmissionRateGS * 1e6) / (ship.exhaustFlowM3S * plumeDilutionFactor);
  const blackCarbonDownwindUgm3 = (sootEmissionRateGS * 1e6) / (ship.exhaustFlowM3S * plumeDilutionFactor);

  // 3. Evolución Microfísica del Número y Diámetro de Partículas
  // Chimenea fresca: D_p0 ≈ 22 nm, N_0 ≈ 2e6 cm^-3
  // Coagulación Brownian: 1/N(t) = 1/N0 + K_coag · t
  // t_transit = x / u_wind
  const transitTimeSec = x / u_wind;
  const k_coag = 3.5e-10; // cm³/s
  const initialN0 = 2.5e6 * Math.max(0.2, input.fuelSulfurPct / 0.1);
  const nDilutedAndCoagulated = (initialN0 / (1 + initialN0 * k_coag * transitTimeSec)) / plumeDilutionFactor;
  const totalParticleNumberCm3 = Math.max(500, nDilutedAndCoagulated);

  // Crecimiento del Diámetro Medio por Condensación de H2SO4 y Coagulación
  // D_p(x) = D_p0 · (1 + k_growth · t)^0.33
  const initialDpNm = 20.0 + (input.fuelSulfurPct * 15);
  const growthRateNmSec = 0.08 * (so2DownwindUgm3 / 10);
  const geometricMeanDiameterNm = Math.min(220, initialDpNm + growthRateNmSec * transitTimeSec);

  // 4. Distribución Log-Normal Discretizada dN/dlog(Dp)
  const sigmaG = 1.65; // Desviación geométrica típica de aerosoles de combustión marítima
  const sizeDistribution: ParticleSizeBin[] = [];
  const binCount = 28;
  const minDp = 5; // nm
  const maxDp = 500; // nm

  for (let i = 0; i < binCount; i++) {
    const logMin = Math.log10(minDp);
    const logMax = Math.log10(maxDp);
    const dp = Math.pow(10, logMin + (i / (binCount - 1)) * (logMax - logMin));

    // Ecuación log-normal
    const exponent = -Math.pow(Math.log(dp / geometricMeanDiameterNm), 2) / (2 * Math.pow(Math.log(sigmaG), 2));
    const dNdlogDp = (totalParticleNumberCm3 / (Math.sqrt(2 * Math.PI) * Math.log(sigmaG))) * Math.exp(exponent);
    const volumeUm3Cm3 = (Math.PI / 6) * Math.pow(dp / 1000, 3) * dNdlogDp;

    sizeDistribution.push({
      diameterNm: Math.round(dp),
      dNdlogDp: Math.round(dNdlogDp),
      volumeUm3Cm3: parseFloat(volumeUm3Cm3.toFixed(4))
    });
  }

  // 5. Higroscopicidad kappa-Köhler (Petters & Kreidenweis 2007)
  // Fracción volumétrica de sulfato soluble vs núcleo de hollín insoluble
  // kappa_eff = eps_so4 * kappa_so4 + eps_soot * kappa_soot
  const kappaSulfate = 0.72; // (NH4)2SO4 / H2SO4
  const kappaSoot = 0.02; // Hollín hidrófobo primario
  const agedSulfateFrac = Math.min(0.85, 0.15 + (transitTimeSec / 600) * 0.4 + (input.fuelSulfurPct * 2.0));
  const effectiveKappa = Math.max(0.05, Math.min(0.70, (agedSulfateFrac * kappaSulfate) + ((1 - agedSulfateFrac) * kappaSoot)));

  // Ecuación de Köhler para Diámetro Seco Crítico D_pc a la sobresaturación S (%)
  // S_c ≈ sqrt( 4 · A^3 / (27 · kappa · D_dry^3) )
  // D_pc ≈ ( 4 · A^3 / (27 · kappa · S_c^2) )^(1/3)
  // A = 4 * M_w * sigma / (R * T * rho_w) ≈ 2.1e-9 m = 2.1 nm a 298 K
  const A_coeff = 2.1; // nm
  const Sc_fraction = Math.max(0.0005, input.supersaturationPct / 100);
  const criticalDryDiameterNm = Math.pow((4 * Math.pow(A_coeff, 3)) / (27 * effectiveKappa * Math.pow(Sc_fraction, 2)), 1 / 3);

  // Concentración de Núcleos de Condensación de Nubes CCN: Partículas con D_p > D_pc
  let ccnSum = 0;
  for (const bin of sizeDistribution) {
    if (bin.diameterNm >= criticalDryDiameterNm) {
      ccnSum += bin.dNdlogDp * 0.15; // Integral trapezoidal del log
    }
  }
  const ccnNumberConcentrationCm3 = Math.min(totalParticleNumberCm3, Math.max(10, Math.round(ccnSum)));
  const activatedFractionCCN = totalParticleNumberCm3 > 0 ? ccnNumberConcentrationCm3 / totalParticleNumberCm3 : 0;

  // 6. Diagnóstico de Penetración en la Fachada Urbana de Málaga
  let urbanPenetrationLevel: 'low_negligible' | 'moderate' | 'high_critical' = 'moderate';
  let mitigationVerdict = '';

  if (blackCarbonDownwindUgm3 > 3.0 || totalParticleNumberCm3 > 35000) {
    urbanPenetrationLevel = 'high_critical';
    mitigationVerdict = 'ALERTA DE ULTRAFINAS: La pluma portuaria penetra en la Alameda/Farola superando 35.000 part/cm³. Se requiere conexión eléctrica en muelle (OPS) o reducción de azufre.';
  } else if (blackCarbonDownwindUgm3 > 1.0 || totalParticleNumberCm3 > 12000) {
    urbanPenetrationLevel = 'moderate';
    mitigationVerdict = 'Impacto moderado en fachada litoral. Dilución atmosférica por brisa marina adecuada, pero con envejecimiento higroscópico activo.';
  } else {
    urbanPenetrationLevel = 'low_negligible';
    mitigationVerdict = 'Impacto despreciable en la ZBE. La dispersión y bajo contenido de azufre garantizan niveles seguros.';
  }

  return {
    ship,
    so2EmissionRateGS,
    sootEmissionRateGS,
    h2so4NucleationPrecursorPpt,
    plumeDilutionFactor,
    so2DownwindUgm3,
    blackCarbonDownwindUgm3,
    totalParticleNumberCm3,
    geometricMeanDiameterNm,
    sizeDistribution,
    effectiveKappa,
    criticalDryDiameterNm,
    ccnNumberConcentrationCm3,
    activatedFractionCCN,
    urbanPenetrationLevel,
    mitigationVerdict
  };
}

/**
 * Exportador FAIR CSV de la simulación de microfísica de pluma.
 */
export function exportShipPlumeCsv(input: ShipPlumeInput, result: ShipPlumeSimulationResult): string {
  const headers = 'ship_id,engine_load_pct,fuel_sulfur_pct,downwind_dist_m,wind_ms,so2_ugm3,bc_ugm3,ntot_cm3,dp_mean_nm,kappa,dpc_nm,n_ccn_cm3,ccn_activated_frac\n';
  const row = `"${result.ship.id}",${input.engineLoadPct},${input.fuelSulfurPct},${input.downwindDistanceM},${input.windSpeedMS},${result.so2DownwindUgm3.toFixed(2)},${result.blackCarbonDownwindUgm3.toFixed(2)},${result.totalParticleNumberCm3.toFixed(0)},${result.geometricMeanDiameterNm.toFixed(1)},${result.effectiveKappa.toFixed(3)},${result.criticalDryDiameterNm.toFixed(1)},${result.ccnNumberConcentrationCm3},${result.activatedFractionCCN.toFixed(3)}`;
  return headers + row;
}
